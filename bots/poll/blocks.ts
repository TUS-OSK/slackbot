/* eslint-disable @typescript-eslint/camelcase */
import {
  SectionBlock,
  ActionsBlock,
  DividerBlock,
  ContextBlock,
  KnownBlock
} from "@slack/web-api";

import { strict as assert } from "assert";

// import baseBlock from "./base-blocks.json";

function buildOption(
  option: string,
  optionId: string,
  voters: string[]
): { optionBlock: SectionBlock; votersBlock: ContextBlock } {
  const optionBlock: SectionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${option}`
    },
    accessory: {
      type: "button",
      text: {
        type: "plain_text",
        emoji: true,
        text: "投票"
      },
      action_id: "poll_vote",
      value: optionId
    }
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
    ]
  };

  if (voters.length != 0) {
    votersBlock.elements.push({
      type: "mrkdwn",
      text: voters.map(voter => `<@${voter}>`).join(" ")
    });
  }

  votersBlock.elements.push({
    type: "plain_text",
    emoji: true,
    text: voters.length === 0 ? "No votes" : `${voters.length} votes`
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

  const driverBlock: DividerBlock = {
    type: "divider"
  };

  const blocks = [];

  const titleBlock: SectionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${title}* (<@${investigatorId}>による投票)`
    }
  };
  blocks.push(titleBlock);
  blocks.push(driverBlock);

  for (const [index, option] of options.entries()) {
    const { optionBlock, votersBlock } = buildOption(
      option,
      `option_${index}`,
      voters[index]
    );
    blocks.push(optionBlock);
    blocks.push(votersBlock);
  }
  blocks.push(driverBlock);

  const footerBlock: ActionsBlock = {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "削除"
        },
        style: "danger",
        action_id: "poll_delete"
      }
    ]
  };
  blocks.push(footerBlock);
  return blocks;
}
