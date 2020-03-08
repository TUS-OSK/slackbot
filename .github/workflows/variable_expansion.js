const fs = require("fs");

if (process.length < 3) {
  throw new Error("変数を展開するyamlファイルが指定されていません。");
}
const fileName = process.argv[2];

let fileData = fs.readFileSync(fileName, "utf8");

fileData = fileData.replace(/\${\w+}/g, match => {
  const key = match.slice(2, -1);
  if (!(key in process.env)) {
    throw new ReferenceError(`${fileName}が未定義の環境変数${key}を参照しています。`);
  }
  return process.env[key];
});

fs.writeFileSync(fileName, fileData, "utf8");
