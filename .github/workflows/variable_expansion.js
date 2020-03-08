const fs = require("fs");

let fileData = fs.readFileSync("./app.yaml", "utf8");

fileData = fileData.replace(/\${\w+}/g, match => {
  const key = match.slice(2, -1);
  if (!(key in process.env)) {
    throw new ReferenceError("app.ymlが未定義の環境変数を参照しています。");
  }
  return process.env[key];
});

fs.writeFileSync("./app.yaml", fileData, "utf8");
