import { Router } from "express";
import { repo } from "../store/ProfileRepository.js";
import { z } from "zod";
import { buildErrorPayload } from "../errors.js";

const router = Router();
const schema = z.object({
  playUri: z.string(),
  userIdentifier: z.string(),
  textures: z.array(z.string())
});

router.post("/", (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(buildErrorPayload("BAD_REQUEST", "Bad Request", result.error.message));
    return;
  }
  repo.saveTextures(result.data.userIdentifier, result.data.textures);
  res.status(204).end();
});

export default router;
