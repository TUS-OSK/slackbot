import { App } from "@slack/bolt";

export default (app: App): void => {
  app.message("hello", async ({ message, say }) => {
    say(`Hello, <@${message.user}>`);
  });
};
