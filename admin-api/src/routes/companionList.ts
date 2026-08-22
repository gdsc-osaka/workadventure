import { Router } from "express";
import { getCompanionList } from "../catalog.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getCompanionList());
});

export default router;
