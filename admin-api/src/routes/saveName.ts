import { Router } from "express";
import { repo } from "../store/ProfileRepository.js";
import { z } from "zod";
import { buildErrorPayload } from "../errors.js";

const router = Router();
const schema = z.object({
  playUri: z.string(),
  userIdentifier: z.string(),
  name: z.string()
});

router.post("/", (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(buildErrorPayload("BAD_REQUEST", "Bad Request", result.error.message));
    return;
  }
  repo.saveName(result.data.userIdentifier, result.data.name);
  res.status(204).end();
});

export default router;
