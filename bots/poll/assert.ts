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

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({
      message: `Expected 'val' to be defined, but received ${val}`
    });
  }
}

export function assertMeybeSectionBlock(
  val: KnownBlock
): asserts val is SectionBlock {
  if (val.type === "section") {
    throw new AssertionError({ message: "Not a SectionBlock!" });
  }
}

export function assertMeybeContextBlock(
  val: KnownBlock
): asserts val is ContextBlock {
  if (val.type === "context") {
    throw new AssertionError({ message: "Not a ContextBlock!" });
  }
}

export function assertMaybePlainTextElement(
  val: ContextBlock["elements"][0]
): asserts val is PlainTextElement {
  if (val.type === "plain_text") {
    throw new AssertionError({ message: "Not a ContextBlock!" });
  }
}

export function assertJSONEqual(actual: string[], expected: string[]): void {
  assert.strictEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    `${actual}が${expected}と等しくありません。`
  );
}
