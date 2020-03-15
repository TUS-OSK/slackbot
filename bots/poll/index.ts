/* eslint-disable @typescript-eslint/camelcase */
import { App, BlockButtonAction, ViewSubmitAction } from "@slack/bolt";
import { KnownBlock } from "@slack/web-api";

import { strict as assert } from "assert";

import {
  assertMybeViewOutput,
  assertIsDefined,
  assertMeybeSectionBlock,
  assertMeybeContextBlock,
  assertMaybePlainTextElement
} from "./assert";
import { parseArgs } from "./parser";

import { buildBlocks } from "./blocks";
import { buildView, countNumOptions } from "./view";

export default (app: App): void => {
  console.log("/poll を読み込みました。");

  app.command("/poll", async ({ ack, body, context, say }) => {
    ack();

    const { text } = body;
    if (text === "") {
      const result = await app.client.views.open({
        token: context.botToken,
        // 適切な trigger_id を受け取ってから 3 秒以内に渡す
        trigger_id: body.trigger_id,
        // view の値をペイロードに含む
        view: buildView(2)
      });
      console.log(result);
      return;
    }

    const [title, ...options] = parseArgs(text);
    say({
      channel: body.channel_id,
      text: "text sample",
      blocks: buildBlocks(title, body.user_id, options)
    });
  });

  app.action<BlockButtonAction>(
    "poll_add_option",
    async ({ ack, body, context }) => {
      assertMybeViewOutput(body.view);
      ack();

      const result = await app.client.views.update({
        token: context.botToken,
        // リクエストに含まれる view_id を渡す
        view_id: body.view.id,
        // 更新された view の値をペイロードに含む
        view: buildView(countNumOptions(body.view) + 1)
      });
      console.log(result);
    }
  );

  app.action<BlockButtonAction>(
    "poll_delete_option",
    async ({ ack, body, context }) => {
      assertMybeViewOutput(body.view);
      ack();

      const result = await app.client.views.update({
        token: context.botToken,
        // リクエストに含まれる view_id を渡す
        view_id: body.view.id,
        // 更新された view の値をペイロードに含む
        view: buildView(
          countNumOptions(body.view) > 1 ? countNumOptions(body.view) - 1 : 1
        )
      });

      console.log(result);
    }
  );

  app.view<ViewSubmitAction>("poll_view_1", async ({ ack, body, view }) => {
    // モーダルビューでのデータ送信イベントを確認
    ack();

    const user = body.user.id;
    const numOptions = countNumOptions(view);

    assert.strictEqual(Object.keys(view.state.values).length - 1, numOptions); // titleの分1引く
    const desiredValues = [
      "title",
      ...[...Array(numOptions).keys()].map(i => i + 1).map(i => `option_${i}`)
    ];

    for (const [key, value] of Object.entries(view.state.values)) {
      assert.ok(desiredValues.includes(key));
      assert.ok(key in value);

      const inputElement: { type: string; value: string } = value[key];

      // key: inputElement.value
    }
  });

  app.action<BlockButtonAction>(
    "poll_vote",
    async ({ action, ack, body, respond }) => {
      ack();

      const matchedOptionIndex = action.value.match(/^option_(\d+)$/);
      assertIsDefined(matchedOptionIndex);
      const optionIndex = parseInt(matchedOptionIndex[1]);

      // extract blocks
      assertIsDefined(body.message);
      const blocks = body.message.blocks as KnownBlock[]; // TODO:

      assert.ok(blocks.length >= 6);

      // extract title
      const titleBlock = blocks[0];
      assertMeybeSectionBlock(titleBlock);
      assertIsDefined(titleBlock.text);
      const matchedTitle = titleBlock.text.text.match(
        /^\*(.+)\* \(<@(\w+)>による投票\)$/
      );
      assertIsDefined(matchedTitle);
      const [, title, investigatorId] = matchedTitle;

      // extract options
      const optionBlocks = blocks
        .slice(2, -2)
        .filter((block, index) => index % 2 === 0);
      const options = optionBlocks.map(option => {
        assertMeybeSectionBlock(option);
        assertIsDefined(option.text);
        return option.text.text;
      });

      // extract voters
      const votersBlocks = blocks
        .slice(2, -2)
        .filter((block, index) => index % 2 === 1);
      const voters = votersBlocks.map(voter => {
        assertMeybeContextBlock(voter);
        assert.ok(voter.elements.length > 0);
        return voter.elements.slice(0, -1).map(element => {
          assertMaybePlainTextElement(element);
          return element.text;
        });
      });

      buildBlocks(title, investigatorId, options, voters);
    }
  );
};
