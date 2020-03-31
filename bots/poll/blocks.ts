/* eslint-disable @typescript-eslint/camelcase */
import {
  ActionsBlock,
  ContextBlock,
  DividerBlock,
  KnownBlock,
  SectionBlock,
} from "@slack/web-api";

import { strict as assert } from "assert";

function buildOption(
  option: string,
  optionId: string,
  voters: string[],
  totalVotersNum: number
): { optionBlock: SectionBlock; votersBlock: ContextBlock } {
  assert.ok(voters.length <= totalVotersNum);

  const optionBlock: SectionBlock = {
    type: "section",
    text: { type: "mrkdwn", text: `${option}` },
    accessory: {
      type: "button",
      text: { type: "plain_text", emoji: true, text: "投票" },
      action_id: "poll_vote",
      value: optionId,
    },
  };

  const votersBlock: ContextBlock = {
    type: "context",
    elements: [
      // {
      //   type: "image",
      //   image_url:
      //     "https://api.slack.com/img/blocks/bkb_template_images/profile_4.png",
      //   alt_text: "Angela"
      // }
    ],
  };
  if (voters.length != 0) {
    votersBlock.elements.push({
      type: "mrkdwn",
      text: voters.map((voter) => `<@${voter}>`).join(" "),
    });
  }

  votersBlock.elements.push({
    type: "plain_text",
    emoji: true,
    text: `${voters.length}人${
      totalVotersNum === 0
        ? ""
        : `(${((voters.length / totalVotersNum) * 100).toFixed(1)}%)`
    }が投票`,
  });

  return { optionBlock, votersBlock };
}

export function buildBlocks(
  title: string,
  investigatorId: string,
  options: string[],
  voters: string[][] = new Array<string[]>(options.length).fill([])
): KnownBlock[] {
  assert.strictEqual(voters.length, options.length);

  const driverBlock: DividerBlock = { type: "divider" };

  const blocks = [];

  const titleBlock: SectionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${title}* (<@${investigatorId}>による投票)`,
    },
  };
  blocks.push(titleBlock);
  blocks.push(driverBlock);

  const totalVotersNum = voters.reduce(
    (accumulator, currentValue) => accumulator + currentValue.length,
    0
  );
  for (const [index, option] of options.entries()) {
    const { optionBlock, votersBlock } = buildOption(
      option,
      `option_${index}`,
      voters[index],
      totalVotersNum
    );
    blocks.push(optionBlock);
    blocks.push(votersBlock);
  }
  blocks.push(driverBlock);

  const totalNumBlock: ContextBlock = {
    type: "context",
    elements: [{ type: "mrkdwn", text: `計${totalVotersNum}人` }],
  };
  blocks.push(totalNumBlock);

  const footerBlock: ActionsBlock = {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "削除",
        },
        style: "danger",
        action_id: "poll_delete",
        confirm: {
          title: {
            type: "plain_text",
            text: "確認",
          },
          text: {
            type: "plain_text",
            text: "本当に削除しますか？",
          },
          confirm: {
            type: "plain_text",
            text: "削除",
          },
        },
      },
    ],
  };
  blocks.push(footerBlock);

  return blocks;
}
