/* eslint-disable @typescript-eslint/camelcase */
import { ViewOutput } from "@slack/bolt";
import { ActionsBlock, InputBlock, View } from "@slack/web-api";

import { strict as assert } from "assert";

import baseView from "./base-view.json";

export function buildView(num: number, conversation: string): View {
  assert.ok(num > 0);

  const view = JSON.parse(JSON.stringify(baseView)) as View;
  const deleteOptionBlock = view.blocks.pop() as ActionsBlock;
  const addOptionBlock = view.blocks.pop() as ActionsBlock;

  const conversationBlock: InputBlock = {
    type: "input",
    element: {
      type: "conversations_select",
      initial_conversation: conversation,
      action_id: "conversation",
    },
    label: {
      type: "plain_text",
      text: "送信先",
      emoji: true,
    },
  };
  view.blocks.unshift(conversationBlock);

  for (let i = 1; i <= num; ++i) {
    view.blocks.push({
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: `option_${i}`,
      },
      label: {
        type: "plain_text",
        text: `選択肢${i}`,
      },
    });
  }

  view.blocks.push(addOptionBlock);
  if (num > 1) {
    view.blocks.push(deleteOptionBlock);
  }

  return view;
}

export function countNumOptions(view: ViewOutput): number {
  assert.ok(view.blocks.length - 2 >= 0);

  if (view.blocks.length === 4) {
    // 「選択肢を減らす」が無いので
    return 1;
  }
  return view.blocks.length - 4; // 「送信先」,「タイトル」,「選択肢を減らす」,「選択肢を増やす」の3つを除く
}
