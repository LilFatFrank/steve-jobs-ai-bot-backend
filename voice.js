import { OpenAI } from "openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import fs from "fs";
import voice from "elevenlabs-node";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

export const talkToAI = async (req, res) => {
  try {
    const audioFile = req.file; // Access the uploaded file
    if (!audioFile) {
      res.status(400).send("No audio file uploaded");
      return;
    }
    const inputPath = req.file.path; // Path to the uploaded binary audio file
    const outputPath = `${__dirname}/response/${Date.now()}.wav`; // Path where the converted WAV file will be saved
    console.log(fs.readdirSync(process.cwd()));
    const wavPath = await convertToWav(inputPath, outputPath); // Convert binary to WAV

    const message = await transcribeAudio(wavPath);

    if (message) {
      const responseText = await getOpenAIResponse(message);
      const responseAudioFilename = await convertResponseToAudio(responseText);
      res.sendFile(`${__dirname}/response/${responseAudioFilename}`);
    } else {
      res.status(400).send("No transcription available");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
const convertToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .format("wav")
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
};
const transcribeAudio = async (filename) => {
  console.log("Transcribing audio...");
  const audioFile = fs.createReadStream(filename);
  const transcriptionResponse = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });
  return transcriptionResponse.text;
};
const getOpenAIResponse = async (message) => {
  console.log("Communicating with OpenAI...");
  const chat = new ChatOpenAI({
    openAIApiKey: process.env.OPEN_AI_KEY,
  });
  const response = await chat.call([
    new SystemMessage(
      "You are Steve Jobs. Talk like him. Respond like he would. Some of your personality traits are: charismatic, a risk-taker, abrasive, a genius, revolutionary, and an innovator."
    ),
    new HumanMessage(message),
  ]);
  return response.text;
};
const convertResponseToAudio = async (text) => {
  const apiKey = process.env.XI_LABS_KEY;
  const voiceID = "FTsayPuFdh6l0XUivdzk";
  const fileName = `${Date.now()}.mp3`;
  console.log("Converting response to audio...");
  const audioStream = await voice.textToSpeechStream(apiKey, voiceID, text);
  const fileWriteStream = fs.createWriteStream(
    `${__dirname}/response/` + fileName
  );
  audioStream.pipe(fileWriteStream);
  return new Promise((resolve, reject) => {
    fileWriteStream.on("finish", () => {
      console.log("Audio conversion done...");
      console.log(fileName);
      resolve(fileName);
    });
    audioStream.on("error", reject);
  });
};
