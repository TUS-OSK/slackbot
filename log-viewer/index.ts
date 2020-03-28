import express from "express";
const router = express.Router();

import { AssertionError, strict as assert } from "assert";
import * as path from "path";

router.get("/", function(req, res) {
  res.send("Hello, World!");
});

module.exports = router;

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({
      message: `Expected 'val' to be defined, but received ${val}`
    });
  }
}
const logDir = process.env.SLACK_LOG_DIR;
assertIsDefined(logDir);

import { loadUsers, loadChannels, loadMessages } from "./load";
(async () => {
  const channels = await loadChannels(logDir);
  const users = await loadUsers(logDir);
  const messages = await Promise.all(
    channels.map(channnel => loadMessages(path.join(logDir, channnel.name)))
  );
})();
