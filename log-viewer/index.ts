import express from "express";
import logger from "morgan";
import pug from "pug";

import { AssertionError, strict as assert } from "assert";
import * as path from "path";

import { loadUsers, loadChannels, loadMessages, Message } from "./load";

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({
      message: `Expected 'val' to be defined, but received ${val}`
    });
  }
}

export default async function(): Promise<express.Router> {
  const logDir = process.env.SLACK_LOG_DIR;
  assertIsDefined(logDir);

  const channels = await loadChannels(logDir);
  const users = await loadUsers(logDir);
  const messages: {
    [key: string]: Message[];
  } = (
    await Promise.all(
      channels.map(channnel => loadMessages(path.join(logDir, channnel.name)))
    )
  ).reduce((acc, cur, index) => ({ ...acc, [channels[index].name]: cur }), {}); // keyに変数を使うときは[]で囲う

  const router = express.Router();

  router.use(logger("short"));
  router.use("/static", express.static(path.join(__dirname, "static")));

  router.get("/", (req, res) => {
    const generals = channels.filter(channel => channel.is_general);
    assert.strictEqual(generals.length, 1);

    res.redirect(`${req.baseUrl}/${generals[0].name}`);
  });

  router.get("/:channelName", (req, res) => {
    const { channelName } = req.params;

    res.send(
      pug.renderFile(path.join(__dirname, "views", "index.pug"), {
        currentChannel: channelName,
        channels: channels,
        messages: messages[channelName]
      })
    );
  });

  return router;
}
