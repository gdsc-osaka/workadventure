import express from "express";
import { ADMIN_API_PORT } from "./env.js";
import { loadCatalog } from "./catalog.js";
import { authMiddleware } from "./auth.js";
import { logRequest } from "./logger.js";
import { buildErrorPayload } from "./errors.js";

import capabilitiesRoute from "./routes/capabilities.js";
import mapRoute from "./routes/map.js";
import roomAccessRoute from "./routes/roomAccess.js";
import saveNameRoute from "./routes/saveName.js";
import saveTexturesRoute from "./routes/saveTextures.js";
import saveCompanionTextureRoute from "./routes/saveCompanionTexture.js";
import wokaListRoute from "./routes/wokaList.js";
import companionListRoute from "./routes/companionList.js";

const app = express();

app.set("query parser", "extended");
app.use(express.json());

app.use((req, res, next) => {
  logRequest(req);
  next();
});

app.use("/api/capabilities", capabilitiesRoute);

app.use(authMiddleware);

app.use("/api/map", mapRoute);
app.use("/api/room/access", roomAccessRoute);
app.use("/api/save-name", saveNameRoute);
app.use("/api/save-textures", saveTexturesRoute);
app.use("/api/save-companion-texture", saveCompanionTextureRoute);
app.use("/api/woka/list", wokaListRoute);
app.use("/api/companion/list", companionListRoute);

app.use((req, res) => {
  res.status(404).json(buildErrorPayload("NOT_FOUND", "Not Found", "Path not found"));
});

// The details string is rendered on the user's error screen, so it must stay generic:
// `String(err)` would leak SQLite paths and other internals to every visitor.
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express error:", err);
    res.status(500).json(
        buildErrorPayload("INTERNAL_ERROR", "Internal Server Error", "An unexpected error occurred. Check the admin API logs."),
    );
});

loadCatalog();

app.listen(ADMIN_API_PORT, () => {
  console.info(`Admin API listening on port ${ADMIN_API_PORT}`);
});
