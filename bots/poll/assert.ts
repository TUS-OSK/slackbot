import { ViewOutput } from "@slack/bolt";
import {
  KnownBlock,
  SectionBlock,
  ContextBlock,
  PlainTextElement,
  View
} from "@slack/web-api";

import { AssertionError, strict as assert } from "assert";

export function assertMybeViewOutput(val: any): asserts val is ViewOutput {
  if (
    val === undefined ||
    val === null ||
    typeof val !== "object" ||
    !("id" in val) ||
    typeof val.id !== "string" ||
    !("blocks" in val) ||
    typeof val.blocks !== "object"
  ) {
    throw new AssertionError({ message: "Not a ViewOutput!" });
  }
}

export function assertJSONEqual(actual: string[], expected: string[]): void {
  assert.strictEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    `${actual}が${expected}と等しくありません。`
  );
}
