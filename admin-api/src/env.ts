import { fileURLToPath } from "node:url";
import { z } from "zod";
import { OpidWokaNamePolicy } from "@workadventure/messages/src/JsonMessages/OpidWokaNamePolicy";

/**
 * Default location of woka.json / companions.json: play's own catalog files.
 * We deliberately read them in place instead of copying them, so an upstream
 * catalog update is picked up without any change here.
 */
const DEFAULT_WOKA_DATA_DIR = fileURLToPath(new URL("../../play/src/pusher/data/", import.meta.url));

const preprocessBool = (val: unknown) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
  }
  return val;
};

const envSchema = z.object({
  ADMIN_API_PORT: z.coerce.number().default(3000),
  ADMIN_API_TOKEN: z.string().min(1),
  ADMIN_API_DB_PATH: z.string().default("./data/profiles.sqlite"),
  WOKA_DATA_DIR: z.string().default(DEFAULT_WOKA_DATA_DIR),
  PUBLIC_MAP_STORAGE_URL: z.string().default(""),
  START_ROOM_URL: z.string().default("/_/global/maps.workadventure.localhost/tests/E2E/empty.json"),
  DISABLE_ANONYMOUS: z.preprocess(preprocessBool, z.boolean().default(false)),
  ENABLE_MAP_EDITOR: z.preprocess(preprocessBool, z.boolean().default(false)),
  MAP_EDITOR_ALLOW_ALL_USERS: z.preprocess(preprocessBool, z.boolean().default(true)),
  MAP_EDITOR_ALLOWED_USERS: z.string().default(""),
  OPID_WOKA_NAME_POLICY: z.string().default("user_input"),
  ENABLE_CHAT: z.preprocess(preprocessBool, z.boolean().default(true)),
  ENABLE_CHAT_UPLOAD: z.preprocess(preprocessBool, z.boolean().default(true)),
  ENABLE_CHAT_ONLINE_LIST: z.preprocess(preprocessBool, z.boolean().default(true)),
  ENABLE_CHAT_DISCONNECTED_LIST: z.preprocess(preprocessBool, z.boolean().default(true)),
  ENABLE_SAY: z.preprocess(preprocessBool, z.boolean().default(true)),
  ENABLE_TUTORIAL: z.preprocess(preprocessBool, z.boolean().default(true)),
  WORLD_NAME: z.string().default("selfHostedWorld"),
});

const env = envSchema.parse(process.env);

export const ADMIN_API_PORT = env.ADMIN_API_PORT;
export const ADMIN_API_TOKEN = env.ADMIN_API_TOKEN;
export const ADMIN_API_DB_PATH = env.ADMIN_API_DB_PATH;
export const WOKA_DATA_DIR = env.WOKA_DATA_DIR;
export const PUBLIC_MAP_STORAGE_URL = env.PUBLIC_MAP_STORAGE_URL;
export const START_ROOM_URL = env.START_ROOM_URL;
export const DISABLE_ANONYMOUS = env.DISABLE_ANONYMOUS;
export const ENABLE_MAP_EDITOR = env.ENABLE_MAP_EDITOR;
export const MAP_EDITOR_ALLOW_ALL_USERS = env.MAP_EDITOR_ALLOW_ALL_USERS;
export const MAP_EDITOR_ALLOWED_USERS = env.MAP_EDITOR_ALLOWED_USERS;

const opidPolicyCheck = OpidWokaNamePolicy.safeParse(env.OPID_WOKA_NAME_POLICY);
export const OPID_WOKA_NAME_POLICY = opidPolicyCheck.success ? opidPolicyCheck.data : null;

export const ENABLE_CHAT = env.ENABLE_CHAT;
export const ENABLE_CHAT_UPLOAD = env.ENABLE_CHAT_UPLOAD;
export const ENABLE_CHAT_ONLINE_LIST = env.ENABLE_CHAT_ONLINE_LIST;
export const ENABLE_CHAT_DISCONNECTED_LIST = env.ENABLE_CHAT_DISCONNECTED_LIST;
export const ENABLE_SAY = env.ENABLE_SAY;
export const ENABLE_TUTORIAL = env.ENABLE_TUTORIAL;
export const WORLD_NAME = env.WORLD_NAME;
