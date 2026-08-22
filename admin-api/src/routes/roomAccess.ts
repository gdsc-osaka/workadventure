import { Router } from "express";
import { repo } from "../store/ProfileRepository.js";
import { resolveWoka, resolveCompanion } from "../catalog.js";
import { ENABLE_MAP_EDITOR, MAP_EDITOR_ALLOW_ALL_USERS, MAP_EDITOR_ALLOWED_USERS, WORLD_NAME } from "../env.js";
import { buildErrorPayload } from "../errors.js";

const router = Router();

/** `req.query` values are `string | string[] | ParsedQs | ParsedQs[] | undefined`. */
function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * axios serialises arrays as `characterTextureIds[]=male1`. Express 5 only strips the
 * trailing `[]` when the "extended" query parser is enabled, so accept both spellings
 * (and a bare single value) to stay robust against that setting.
 */
function asStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

router.get("/", (req, res) => {
  const userIdentifier = asString(req.query.userIdentifier);
  const playUri = asString(req.query.playUri);
  const accessToken = asString(req.query.accessToken);
  const companionTextureId = asString(req.query.companionTextureId);
  const chatID = asString(req.query.chatID);

  if (playUri === undefined) {
    res.status(400).json(buildErrorPayload("BAD_REQUEST", "Bad Request", "Missing playUri"));
    return;
  }
  if (userIdentifier === undefined) {
    res.status(400).json(buildErrorPayload("BAD_REQUEST", "Bad Request", "Missing userIdentifier"));
    return;
  }

  let playUrlPathname: string;
  try {
    playUrlPathname = new URL(playUri).pathname;
  } catch {
    res.status(400).json(buildErrorPayload("BAD_REQUEST", "Bad Request", "Malformed playUri: " + playUri));
    return;
  }

  const characterTextureIds =
    req.query.characterTextureIds !== undefined
      ? asStringArray(req.query.characterTextureIds)
      : asStringArray(req.query["characterTextureIds[]"]);

  const isLogged = accessToken !== undefined;
  const profile = isLogged ? repo.get(userIdentifier) : undefined;

  // --- Woka textures ---
  const ids = profile?.textures ?? characterTextureIds;
  const details = resolveWoka(ids);
  const isCharacterTexturesValid = ids.length > 0 && details !== undefined;

  if (isLogged && profile?.textures === undefined && isCharacterTexturesValid) {
    repo.saveTextures(userIdentifier, ids);
  }

  // --- display name ---
  const username = profile?.name ?? undefined;

  // --- companion ---
  let companionId: string | null | undefined;
  if (profile !== undefined && profile.companion !== undefined) {
    companionId = profile.companion;
  } else {
    companionId = companionTextureId ?? null;
  }

  const companionTexture = companionId ? resolveCompanion(companionId) : undefined;
  const isCompanionTextureValid = companionId ? companionTexture !== undefined : true;

  if (isLogged && profile?.companion === undefined && companionId && isCompanionTextureValid) {
    repo.saveCompanion(userIdentifier, companionId);
  }

  // --- map editor ---
  const canEdit =
    /\/~\/(.+)/.test(playUrlPathname) &&
    ENABLE_MAP_EDITOR &&
    (MAP_EDITOR_ALLOW_ALL_USERS ||
      MAP_EDITOR_ALLOWED_USERS.split(",")
        .map((entry) => entry.trim())
        .includes(userIdentifier));

  const responsePayload: Record<string, unknown> = {
    status: "ok",
    email: userIdentifier,
    username,
    userUuid: userIdentifier,
    tags: [],
    visitCardUrl: null,
    isCharacterTexturesValid,
    characterTextures: details ?? [],
    isCompanionTextureValid,
    companionTexture,
    messages: [],
    userRoomToken: undefined,
    activatedInviteUser: true,
    canEdit,
    world: WORLD_NAME,
    applications: [],
    canRecord: false,
  };

  if (chatID !== undefined) {
    responsePayload.chatID = chatID;
  }

  res.json(responsePayload);
});

export default router;
