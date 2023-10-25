import express from "express";
import { talkToAI } from "./voice.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/transcribe", upload.single("audio"), talkToAI);

export default router;
