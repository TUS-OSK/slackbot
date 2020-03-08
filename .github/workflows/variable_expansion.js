const fs = require("fs");

let fileData = fs.readFileSync("./app.yaml", "utf8");

fileData = fileData.replace(/\${\w+}/g, match => {
  return process.env[match.slice(2, -1)];
});

fs.writeFileSync("./app.yaml", fileData, "utf8");
