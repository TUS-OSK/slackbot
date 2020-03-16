/* eslint-disable @typescript-eslint/camelcase */
import { App, BlockButtonAction, ViewSubmitAction } from "@slack/bolt";
import { KnownBlock } from "@slack/web-api";

import { strict as assert } from "assert";

import {
  assertIsDefined,
  assertIsString,
  assertJSONEqual,
  assertMaybeConversationsSelect,
  assertMaybeInputBlock,
  assertMaybeMrkdwnElement,
  assertMeybeContextBlock,
  assertMeybeSectionBlock,
  assertMaybeViewOutput
} from "./assert";
import { parseArgs } from "./parser";

import { buildBlocks } from "./blocks";
import { buildView, countNumOptions } from "./view";

export default (app: App): void => {
  console.log("/poll を読み込みました。");

  app.command("/poll", async ({ ack, body, context, respond, say }) => {
    ack();

    const { text } = body;
    if (text === "") {
      // SLack側が "   " などは "" と解釈する
      await app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: buildView(2, body.channel_id)
      });
      return;
    }

    let title: string, options: string[];
    try {
      [title, ...options] = parseArgs(text);
    } catch {
      respond({
        channel: body.channel_id,
        text: "引数が無効です。",
        response_type: "ephemeral"
      });
      return;
    }
    if (options.length === 0) {
      respond({
        channel: body.channel_id,
        text: "選択肢は必ず一つ以上必要です。",
        response_type: "ephemeral"
      });
      return;
    }
    say({
      channel: body.channel_id,
      text: "text sample", // TODO
      blocks: buildBlocks(title, body.user_id, options)
    });
  });

  app.action<BlockButtonAction>(
    "poll_add_option",
    async ({ ack, body, context }) => {
      ack();

      assertMaybeViewOutput(body.view);
      assertMaybeInputBlock(body.view.blocks[0]);
      assertMaybeConversationsSelect(body.view.blocks[0].element);
      assertIsDefined(body.view.blocks[0].element.initial_conversation);

      await app.client.views.update({
        token: context.botToken,
        view_id: body.view.id,
        view: buildView(
          countNumOptions(body.view) + 1,
          body.view.blocks[0].element.initial_conversation
        )
      });
    }
  );

  app.action<BlockButtonAction>(
    "poll_delete_option",
    async ({ ack, body, context }) => {
      ack();

      assertMaybeViewOutput(body.view);
      assertMaybeInputBlock(body.view.blocks[0]);
      assertMaybeConversationsSelect(body.view.blocks[0].element);
      assertIsDefined(body.view.blocks[0].element.initial_conversation);

      const result = await app.client.views.update({
        token: context.botToken,
        view_id: body.view.id,
        view: buildView(
          countNumOptions(body.view) > 1 ? countNumOptions(body.view) - 1 : 1,
          body.view.blocks[0].element.initial_conversation
        )
      });

      console.log(result);
    }
  );

  app.view<ViewSubmitAction>(
    "poll_view_1",
    async ({ ack, body, context, view }) => {
      ack();

      const numOptions = countNumOptions(view);
      const desiredValues = [
        "conversation",
        "title",
        ...Array.from({ length: numOptions }, (value, i) => `option_${i + 1}`)
      ];
      const actions: { [actionId: string]: any } = Object.assign(
        {},
        ...Object.values(view.state.values)
      );

      assertJSONEqual(Object.keys(actions), desiredValues); // titleの分1引く

      let conversation = ""; // TODO
      let title = ""; // TODO
      const options: string[] = [];
      for (const [key, action] of Object.entries(actions)) {
        if (key === "conversation") {
          assert.strictEqual(action.type, "conversations_select");
          assertIsString(action.selected_conversation);
          conversation = action.selected_conversation;
          continue;
        }
        assert.strictEqual(action.type, "plain_text_input");
        assertIsString(action.value);
        if (key === "title") {
          title = action.value;
          continue;
        }
        const optionIndex = parseInt(key.slice(7)) - 1;
        assert.ok(0 <= optionIndex);
        assert.ok(optionIndex < numOptions);
        options[optionIndex] = action.value; // index以下の未初期化なitemに対し <empty item> が暗黙的に代入されることに注意
      }

      assert.notStrictEqual(conversation, "");
      assert.notStrictEqual(title, "");
      assert.strictEqual(options.length, numOptions);

      await app.client.chat.postMessage({
        token: context.botToken,
        channel: conversation,
        text: "text sample", // TODO
        blocks: buildBlocks(title, body.user.id, options)
      });
    }
  );

  app.action<BlockButtonAction>(
    "poll_delete",
    async ({ ack, body, context }) => {
      ack();

      assertIsDefined(body.channel);
      assertIsDefined(body.message);

      await app.client.chat.delete({
        token: context.botToken,
        channel: body.channel.id,
        ts: body.message.ts
      });
    }
  );

  app.action<BlockButtonAction>(
    "poll_vote",
    ({ ack, action, body, respond }) => {
      ack();

      const matchedOptionIndex = action.value.match(/^option_(\d+)$/);
      assertIsDefined(matchedOptionIndex);
      const optionIndex = parseInt(matchedOptionIndex[1]);

      // extract blocks
      assertIsDefined(body.message);
      const oldBlocks = body.message.blocks as KnownBlock[]; // TODO:

      assert.ok(oldBlocks.length >= 6);

      // extract title
      const titleBlock = oldBlocks[0];
      assertMeybeSectionBlock(titleBlock);
      assertIsDefined(titleBlock.text);
      const matchedTitle = titleBlock.text.text.match(
        /^\*(.+)\* \(<@(\w+)>による投票\)$/
      );
      assertIsDefined(matchedTitle);
      const [, title, investigatorId] = matchedTitle;

      // extract options
      const optionBlocks = oldBlocks
        .slice(2, -3)
        .filter((block, index) => index % 2 === 0);
      const options = optionBlocks.map(option => {
        assertMeybeSectionBlock(option);
        assertIsDefined(option.text);
        return option.text.text;
      });

      // extract voters
      const votersBlocks = oldBlocks
        .slice(2, -3)
        .filter((block, index) => index % 2 === 1);
      let voters: string[][] = votersBlocks.map(voter => {
        assertMeybeContextBlock(voter);
        assert.ok(voter.elements.length > 0);
        if (voter.elements.length === 1) {
          return [];
        }
        assertMaybeMrkdwnElement(voter.elements[0]);
        const voterIds = voter.elements[0].text.match(/<@(\w+)>/g);
        assertIsDefined(voterIds);
        return voterIds.map(value => value.slice(2, -1));
      });

      // vote
      voters = voters.map(value => {
        const set = new Set(value);
        set.delete(body.user.id);
        const array = Array.from(set);
        array.sort();
        return array;
      });
      assert.ok(optionIndex < voters.length);
      voters[optionIndex].push(body.user.id);

      // build blocks
      const blocks = buildBlocks(title, investigatorId, options, voters);

      assertIsDefined(body.channel);
      assertIsDefined(body.message);
      assertIsDefined(body.message.text);

      respond({
        channel: body.channel.id,
        text: body.message.text,
        blocks: blocks,
        replace_original: true
      });
    }
  );
};
