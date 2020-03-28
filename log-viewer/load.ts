/* eslint-disable @typescript-eslint/camelcase */
import * as path from "path";
import * as fs from "fs";
import { strict as assert } from "assert";

export interface Profile {
  // title: string;
  // phone: string;
  // skype: string;
  // api_app_id?: string;
  // always_active?: boolean;
  // bot_id?: string;
  real_name: string;
  // real_name_normalized: string;
  display_name: string;
  // display_name_normalized: string;
  // fields: []; // nullable
  // status_text: string;
  // status_emoji: string;
  // status_expiration: number;
  // avatar_hash: string;
  // email?: string;
  // first_name?: string;
  // last_name?: string;
  // image_24: string;
  // image_32: string;
  // image_48: string;
  // image_72: string;
  // image_192: string;
  // image_512: string;
  // image_1024?: string;
  // image_original?: string;
  // is_custom_image?: boolean;
  // status_text_canonical: string;
  // team: string;
}

export interface User {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: Profile;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  updated: number;
  is_app_user: boolean;
}

export async function loadUsers(logDir: string): Promise<User[]> {
  const filePath = path.join(logDir, "users.json");
  assert.ok(fs.existsSync(filePath));

  const users: User[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return users;
}

export interface Channel {
  id: string;
  name: string;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  members: string[];
  pins: {
    id: string;
    type: string;
    created: number;
    user: string;
    owner: string;
  }[];
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
}

export async function loadChannels(logDir: string): Promise<Channel[]> {
  const filePath = path.join(logDir, "channels.json");
  assert.ok(fs.existsSync(filePath));

  const channels: Channel[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return channels;
}

export interface Message {
  type: string;
  subtype?: string;
  text: string;
  user: string;
  ts: string;
  thread_ts?: string; // 初のthreadのtsと等しい

  blocks?: []; // まだ実装中
  files?: {}[]; // まだ実装中
  attachments?: {}[]; // まだ実装中

  reactions?: {
    name: string;
    users: string[];
    count: number;
  }[];
}

export async function loadMessages(logChannelDir: string): Promise<Message[]> {
  assert.ok(fs.existsSync(logChannelDir));

  const files = fs
    .readdirSync(logChannelDir)
    .filter(fileName => /^\d{4}-\d{2}-\d{2}.json$/.test(fileName)); // 暗黙的にsortされている
  assert.notStrictEqual(files.length, 0);

  // 排他制御ではなく2つに分けてconcatする
  const dateMessages = await Promise.all(
    files.map(async fileName => {
      const dateMessage: Message[] = JSON.parse(
        fs.readFileSync(path.join(logChannelDir, fileName), "utf8")
      );
      return dateMessage;
    })
  );
  const messages = ([] as Message[]).concat(...dateMessages);
  return messages;
}
