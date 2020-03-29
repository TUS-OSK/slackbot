/* eslint-disable @typescript-eslint/camelcase */
import { App } from "@slack/bolt";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieSession from "cookie-session";
import Keygrip from "keygrip";
import logger from "morgan";
import pug from "pug";

import { AssertionError, strict as assert } from "assert";
import * as path from "path";

import { loadUsers, loadChannels, loadMessages, Message } from "./load";
import { authorizeUrl } from "./authorize";

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({
      message: `Expected 'val' to be defined, but received ${val}`,
    });
  }
}

export default async function (app: App): Promise<express.Router> {
  const {
    SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET,
    SLACK_LOG_DIR: logDir,
  } = process.env;
  assertIsDefined(SLACK_CLIENT_ID);
  assertIsDefined(SLACK_CLIENT_SECRET);
  assertIsDefined(logDir);

  const users = await loadUsers(logDir).then(
    (users) => new Map(users.map((user) => [user.id, user]))
  );

  const channels = await loadChannels(logDir).then((channels) => {
    channels.sort((a, b) => {
      const nameA = a.name.toUpperCase(); // 大文字と小文字を無視する
      const nameB = b.name.toUpperCase(); // 大文字と小文字を無視する
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      // names must be equal
      return 0;
    });
    return new Map(channels.map((channel) => [channel.name, channel]));
  }); // TODO: catch

  const messages = new Map(
    await Promise.all(
      Array.from(channels.keys()).map(
        async (channelName): Promise<[string, Message[]]> => [
          channelName,
          await loadMessages(path.join(logDir, channelName)),
        ]
      )
    ) // TODO: catch
  );

  const router = express.Router();

  router.use(helmet());
  router.use(cors());

  router.use(logger("short"));
  router.use(
    cookieSession({
      name: "session",
      keys: new Keygrip(["key1"], "SHA384", "base64"), // TODO 変数化
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  );
  router.use("/static", express.static(path.join(__dirname, "static")));

  router.get("/login", (req, res) => {
    const { state } = req.query;

    res.send(
      pug.renderFile(path.join(__dirname, "views", "login.pug"), {
        url: authorizeUrl(SLACK_CLIENT_ID, state),
      })
    );
  });

  router.get("/logout", (req, res) => {
    assertIsDefined(req.session);

    if (req.session.isNew) {
      res.send("すでにlogout済みです");
      return;
    }
    req.session = null;
    res.send("適切にlogoutしました");
  });

  router.get("/auth", async (req, res) => {
    const { code, state } = req.query;
    if (code === undefined) {
      res.sendStatus(400);
      return;
    }
    const response = await app.client.oauth.access({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code: code,
    }); // TODO: catch
    if (!response.ok) {
      // botを一つのワークスペースにしか追加しない想定なので、単純にokで判断
      res.sendStatus(403); // TODO: もっと適切なStatusへ細分化
      return;
    }
    assertIsDefined(req.session);
    req.session.user = response.user_id;
    req.session.team_id = response.team_id;
    req.session.access_token = response.access_token;
    if (state === "" || state === undefined || state == null) {
      res.redirect(req.baseUrl);
      return;
    }
    res.redirect(`${req.baseUrl}/channel/${state}`);
  });

  router.get("/", (req, res) => {
    const generals = Array.from(channels.values()).filter(
      (channel) => channel.is_general
    );
    assert.strictEqual(generals.length, 1);

    res.redirect(`${req.baseUrl}/channel/${generals[0].name}`);
  });

  router.use("/channel", (req, res, next) => {
    assertIsDefined(req.session);

    if (!req.session.user) {
      res.redirect(`../login?state=${req.path.slice(1)}`);
      return;
    }
    next();
  });

  router.get("/channel/:channelName", (req, res) => {
    const { channelName } = req.params;
    if (!channels.has(channelName)) {
      res.sendStatus(404);
      return;
    }

    res.send(
      pug.renderFile(path.join(__dirname, "views", "index.pug"), {
        currentChannel: channelName,
        channels: Array.from(channels.values()),
        messages: messages.get(channelName),
        users: users,
      })
    );
  });

  console.log("log-viewerを読み込みました");
  return router;
}
