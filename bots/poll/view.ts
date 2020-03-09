/* eslint-disable @typescript-eslint/camelcase */
import { ViewOutput } from "@slack/bolt";
import { View, Block } from "@slack/web-api";

import assert from "assert";

import baseView from "./base-view.json";

export function buildView(num: number): View {
  assert(num > 0);
  const view = JSON.parse(JSON.stringify(baseView)) as View;
  const deleteOptionBlock = view.blocks.pop() as Block;
  const addOptionBlock = view.blocks.pop() as Block;
  for (let i = 1; i <= num; ++i) {
    view.blocks.push({
      type: "input",
      block_id: `option_${i}`,
      element: {
        type: "plain_text_input",

        action_id: `option_${i}`
      },
      label: {
        type: "plain_text",
        text: `選択肢${i}`
      }
    });
  }
  view.blocks.push(addOptionBlock);
  if (num > 1) {
    view.blocks.push(deleteOptionBlock);
  }
  return view;
}

export function countNumOptions(view: ViewOutput): number {
  assert(view.blocks.length - 2 >= 0);

  if (view.blocks.length === 3) {
    // 「選択肢を減らす」が無いので
    return 1;
  }
  return view.blocks.length - 3; // 「タイトル」,「選択肢を減らす」,「選択肢を増やす」の3つを除く
}
