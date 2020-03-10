import { strict as assert } from "assert";

export function parseArgs(str: string): string[] {
  assert.ok(!/\$/.test(str));

  const regex = /"(.*?)"|'(.*?)'|“(.*?)”|‘(.*?)’/g;
  const buf: string[] = [];
  const encoded = str.replace(regex, (match, p1, p2, p3, p4) => {
    return "$" + `{${buf.push(p1 ?? p2 ?? p3 ?? p4) - 1}}`;
  });

  if (/("|“|”|'|‘|’)/.test(encoded)) {
    throw new Error("無効な引数です。");
  }

  const decode = (s: string): string => {
    return s.replace(/\${(\d+)}/g, (match, p1) => {
      const i = parseInt(p1);
      assert.ok(i < buf.length);
      return buf[i];
    });
  };

  const squeezed = encoded.replace(/\s+/g, " ").replace(/(^ | $)/g, "");
  return squeezed.split(" ").map(value => decode(value));
}

const myAssert = (actual: string[], expected: string[]): void => {
  assert.strictEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    `${actual}が${expected}でない`
  );
};

myAssert(parseArgs(`"hello" test`), ["hello", "test"]);
myAssert(parseArgs(` "hello" test`), ["hello", "test"]);
myAssert(parseArgs(`"hello"  test`), ["hello", "test"]);
myAssert(parseArgs(`"hello" test `), ["hello", "test"]);
myAssert(parseArgs(`  "hello"  test  `), ["hello", "test"]);
myAssert(parseArgs(`'hello' test`), ["hello", "test"]);
myAssert(parseArgs(`'hello' "test"`), ["hello", "test"]);
myAssert(parseArgs(`"he'll'o" '"test"'`), [`he'll'o`, `"test"`]);
myAssert(parseArgs(`'he"ll"o' "'test'"`), [`he"ll"o`, "'test'"]);
myAssert(parseArgs(`"hello"test`), ["hellotest"]);
myAssert(parseArgs(`he"llo"test`), ["hellotest"]);
myAssert(parseArgs(`'hello'test`), ["hellotest"]);
myAssert(parseArgs(` "he'll'o" 'he"ll"o2'  "he 'll' o" 'he "ll" o2'`), [
  "he'll'o",
  `he"ll"o2`,
  `he 'll' o`,
  `he "ll" o2`
]);
myAssert(parseArgs(`'he"ll"o'"he'll'o2"`), [`he"ll"ohe'll'o2`]);
myAssert(parseArgs(`'he"ll"o' "he'll'o2"`), [`he"ll"o`, `he'll'o2`]);
myAssert(parseArgs(`"a'b"c"d'e"`), [`a'bcd'e`]);
myAssert(parseArgs(`"hello""world"`), [`helloworld`]);

assert.throws(() => parseArgs(`hello " bad`));
assert.throws(() => parseArgs(`"hello" " bad`));
assert.throws(() => parseArgs(`hello ' bad`));
assert.throws(() => parseArgs(`he"llo ' bad`));
