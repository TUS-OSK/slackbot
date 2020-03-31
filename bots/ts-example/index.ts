import { App } from "@slack/bolt";

/**
 * module.exports に botのメインを置く
 * async や Promise を return してもOK
 */
export default (app: App): void => {
  app.message("hello", ({ message, say }) => {
    say(`Hello, <@${message.user}>`);
  });

  // app.client を https://slack.dev/node-slack-sdk/web-api の WebClient と同様に扱える
  app.client.chat.postMessage({
    text: "Hello world!",
    channel: "<conversationId>",
  });
};
