import { Router } from "express";
import { getWokaList } from "../catalog.js";

const router = Router();

router.get("/", (req, res) => {
    res.json(getWokaList());
});

export default router;
