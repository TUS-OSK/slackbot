/* eslint-disable @typescript-eslint/camelcase */
import {
  App,
  BlockButtonAction,
  ViewOutput,
  ViewSubmitAction
} from "@slack/bolt";

import assert from "assert";
import { AssertionError } from "assert";

import { buildView, countNumOptions } from "./view";

function assertMybeViewOutput(val: any): asserts val is ViewOutput {
  if (
    val === undefined ||
    val === null ||
    typeof val !== "object" ||
    !Object.prototype.hasOwnProperty.call(val, "id") ||
    typeof val.id !== "string" ||
    !Object.prototype.hasOwnProperty.call(val, "blocks") ||
    typeof val.blocks !== "object"
  ) {
    throw new AssertionError({ message: "Not a ViewOutput!" });
  }
}

export default (app: App): void => {
  console.log("/poll を読み込みました。");

  app.command("/poll", async ({ ack, body, context }) => {
    ack();

    const result = await app.client.views.open({
      token: context.botToken,
      // 適切な trigger_id を受け取ってから 3 秒以内に渡す
      trigger_id: body.trigger_id,
      // view の値をペイロードに含む
      view: buildView(2)
    });
    console.log(result);
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

  app.view<ViewSubmitAction>(
    "poll_view_1",
    async ({ ack, body, view, context }) => {
      // モーダルビューでのデータ送信イベントを確認
      ack();

      const user = body.user.id;
      const numOptions = countNumOptions(view);

      assert(numOptions === Object.keys(view.state.values).length - 1); // titleの分1引く
      const desiredValues = [
        "title",
        ...[...Array(numOptions).keys()].map(i => i + 1).map(i => `option_${i}`)
      ];

      for (const [key, value] of Object.entries(view.state.values)) {
        assert(desiredValues.includes(key));
        assert(Object.prototype.hasOwnProperty.call(value, key));

        const inputElement: { type: string; value: string } = value.value;
      }
    }
  );
};
