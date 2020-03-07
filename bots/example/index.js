module.exports = app => {
  app.message("hello", async ({ message, say }) => {
    say(`Hello, <@${message.user}>`);
  });
};
