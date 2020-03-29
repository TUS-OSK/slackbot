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

  const channels = await loadChannels(logDir); // TODO: catch
  const users = await loadUsers(logDir); // TODO: catch
  const messages: {
    [key: string]: Message[];
  } = (
    await Promise.all(
      channels.map((channnel) => loadMessages(path.join(logDir, channnel.name)))
    )
  ) // TODO: catch
    .reduce((acc, cur, index) => ({ ...acc, [channels[index].name]: cur }), {}); // keyに変数を使うときは[]で囲う

  const router = express.Router();

  router.use(helmet());
  router.use(cors());

  router.use(logger("short"));
  router.use(
    cookieSession({
      name: "session",
      keys: new Keygrip(["key1"], "SHA384", "base64"),
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
    const generals = channels.filter((channel) => channel.is_general);
    assert.strictEqual(generals.length, 1);

    res.redirect(`${req.baseUrl}/channel/${generals[0].name}`);
  });

  router.use("/channel", (req, res, next) => {
    assertIsDefined(req.session);

    if (!req.session.user) {
      res.redirect(
        `${req.baseUrl.split("/", 2).join("/")}/login?state=${req.path.slice(
          1
        )}`
      );
      return;
    }
    next();
  });

  router.get("/channel/:channelName", (req, res) => {
    const { channelName } = req.params;
    if (!channels.map((channel) => channel.name).includes(channelName)) {
      res.sendStatus(404);
      return;
    }

    res.send(
      pug.renderFile(path.join(__dirname, "views", "index.pug"), {
        currentChannel: channelName,
        channels: channels,
        messages: messages[channelName],
      })
    );
  });

  console.log("log-viewerを読み込みました");
  return router;
}
