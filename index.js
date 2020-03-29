const { App, ExpressReceiver } = require("@slack/bolt");
const assert = require("assert").strict;

// export default (ES2015) と module.exports (CommonJS)
// どちらのexportもサポートするための関数
function importModule(module) {
  const mod = require(module);
  return mod && mod.__esModule ? mod.default : mod;
}

const logViewer = importModule("./log-viewer");

const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
});

// botsを並列読み込み
const bots = ["poll"];

bots.forEach(async (botName) => {
  console.log(`${botName}を読み込みます`);
  const bot = importModule(`./bots/${botName}`);
  assert.strictEqual(typeof bot, "function");

  try {
    await bot(app);
  } catch (e) {
    console.error(`${botName}がクラッシュしました`, e);
  }
});

expressReceiver.app.set("trust proxy", 1); // trust first proxy
logViewer(app).then((router) => expressReceiver.app.use("/log-viewer", router));

app.error((error) => {
  console.error(error);
});

app.start(process.env.PORT || 3000).then(() => {
  console.log("⚡️ Bolt app is running!");
});
