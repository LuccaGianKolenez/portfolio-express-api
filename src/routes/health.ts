import { Router } from "express";
import os from "os";
const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), hostname: os.hostname() });
});

export default router;
