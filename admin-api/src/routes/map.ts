import { Router } from "express";
import {
    START_ROOM_URL,
    PUBLIC_MAP_STORAGE_URL,
    ENABLE_MAP_EDITOR,
    DISABLE_ANONYMOUS,
    OPID_WOKA_NAME_POLICY,
    ENABLE_CHAT,
    ENABLE_CHAT_UPLOAD,
    ENABLE_CHAT_ONLINE_LIST,
    ENABLE_CHAT_DISCONNECTED_LIST,
    ENABLE_SAY,
    ENABLE_TUTORIAL,
} from "../env.js";
import { buildErrorPayload } from "../errors.js";

const router = Router();

// NOTE: application errors are returned with HTTP 200 on purpose. pusher calls this
// endpoint through axios, which rejects any non-2xx response before it gets a chance to
// parse the body (AdminApi.fetchMapDetails), so a 4xx is reported to the user as a
// generic "Connection error / ROOM_ACCESS_ERROR" and the real reason is lost. Only the
// auth middleware answers 4xx, because a rejected shared token is an operator problem,
// not something to render on the player's error screen.
router.get("/", (req, res) => {
    const playUri = req.query.playUri;
    if (typeof playUri !== "string") {
        res.json(buildErrorPayload("BAD_REQUEST", "Bad Request", "Missing playUri"));
        return;
    }

    let roomUrl: URL;
    try {
        roomUrl = new URL(playUri);
    } catch {
        res.json(buildErrorPayload("BAD_REQUEST", "Bad Request", "Malformed playUri: " + playUri));
        return;
    }

    if (roomUrl.pathname === "/") {
        roomUrl.pathname = START_ROOM_URL;
        res.json({
            redirectUrl: roomUrl.toString(),
        });
        return;
    }

    let mapUrl: string | undefined = undefined;
    let wamUrl: string | undefined = undefined;
    let canEdit = false;

    let match = /\/~\/(.+)/.exec(roomUrl.pathname);
    if (match) {
        if (roomUrl.pathname.endsWith(".tmj")) {
            res.json({
                redirectUrl: roomUrl.toString().replace(".tmj", ".wam"),
            });
            return;
        }
        wamUrl = `${PUBLIC_MAP_STORAGE_URL}/${match[1]}`;
        canEdit = ENABLE_MAP_EDITOR;
    } else {
        match = /\/_\/[^/]+\/(.+)/.exec(roomUrl.pathname);
        if (!match) {
            res.json(
                buildErrorPayload(
                    "UNSUPPORTED_URL_FORMAT",
                    "Unsupported URL format",
                    "Unsupported path: " + roomUrl.pathname,
                ),
            );
            return;
        }
        mapUrl = roomUrl.protocol + "//" + match[1];
    }

    res.json({
        mapUrl,
        wamUrl,
        canEdit,
        authenticationMandatory: DISABLE_ANONYMOUS,
        contactPage: null,
        group: wamUrl ? "default" : null,
        opidLogoutRedirectUrl: null,
        opidWokaNamePolicy: OPID_WOKA_NAME_POLICY, // NOTE: intentionally fixed upstream bug (LocalAdmin returns opidUsernamePolicy)
        loadingLogo: null,
        loginSceneLogo: null,
        errorSceneLogo: null,
        showPoweredBy: true,
        loadingCowebsiteLogo: null,
        enableChat: ENABLE_CHAT,
        enableChatUpload: ENABLE_CHAT_UPLOAD,
        enableChatOnlineList: ENABLE_CHAT_ONLINE_LIST,
        enableChatDisconnectedList: ENABLE_CHAT_DISCONNECTED_LIST,
        enableSay: ENABLE_SAY,
        metadata: { enableTutorial: ENABLE_TUTORIAL },
    });
});

export default router;
