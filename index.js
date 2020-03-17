const { App } = require("@slack/bolt");

const assert = require("assert").strict;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// export default (ES2015) と module.exports (CommonJS)
// どちらのexportもサポートするための関数
function importModule(module) {
  const mod = require(module);
  return mod && mod.__esModule ? mod.default : mod;
}

// botsを並列読み込み
const bots = ["poll"];

bots.forEach(async botName => {
  console.log(`${botName}を読み込みます`);
  const bot = importModule(`./bots/${botName}`);
  assert.strictEqual(typeof bot, "function");

  try {
    await bot(app);
  } catch (e) {
    console.error(`${botName}がクラッシュしました`, e);
  }
});

app.error(error => {
  console.error(error);
});

app.start(process.env.PORT || 3000).then(() => {
  console.log("⚡️ Bolt app is running!");
});
