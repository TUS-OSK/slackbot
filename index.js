const { App, LogLevel } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO
});

const allBots = ["example"];

allBots.forEach(botName => {
  (async () => {
    let bot = require(`./bots/${botName}`);
    if (typeof bot !== "function") {
      bot = bot.default;
    }

    return bot(app);
  })().catch(e => console.error(e));
});

app.start(process.env.PORT || 3000).then(() => {
  console.log("⚡️ Bolt app is running!");
});
