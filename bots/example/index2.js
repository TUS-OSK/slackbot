// import { App } from "@slack/bolt";

module.exports = app => {
  app.message("hello", async ({ message, say }) => {
    say(`Hello, <@${message.user}>`);
  });
};
