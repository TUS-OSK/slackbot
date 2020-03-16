const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const allBots = ["poll"];

allBots.forEach(botName => {
  (async () => {
    let bot = require(`./bots/${botName}`);
    if (typeof bot !== "function") {
      bot = bot.default;
    }

    return bot(app);
  })().catch(e => console.error(e));
});

app.error(error => {
  // メッセージ再送信もしくはアプリを停止するかの判断をするためにエラーの詳細を出力して確認
  console.error(error);
});

app.start(process.env.PORT || 3000).then(() => {
  console.log("⚡️ Bolt app is running!");
});
