import express from "express";
import { transcribeAudio, sendResponse } from "./voice.js";

const router = express.Router();

router.get("/transcribe", transcribeAudio);
router.post("/response", sendResponse);

export default router;
