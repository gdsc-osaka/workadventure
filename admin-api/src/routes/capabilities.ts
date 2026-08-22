import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({"api/woka/list":"v1","api/companion/list":"v1","api/save-name":"v1","api/save-textures":"v1"});
});

export default router;
