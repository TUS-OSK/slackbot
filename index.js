const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const allBots = ["example"];

Promise.all(
  allBots.map(botName => {
    new Promise(resolve => {
      const bot = require(`./bots/${botName}`);
      resolve(bot(app));
    });
  })
)
  .then(() => app.start(process.env.PORT || 3000))
  .then(() => {
    console.log("⚡️ Bolt app is running!");
  });
