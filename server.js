import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { UniversalEdgeTTS } from "edge-tts-universal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

/* ===================== INDEX ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ===================== TTS (BROWSER-SAFE STREAM) ===================== */
app.post("/tts", async (req, res) => {
  try {
    const text = req.body.text;

    if (!text || !text.trim()) {
      return res.status(400).send("No text provided");
    }

    const tts = new UniversalEdgeTTS(
      text,
      "en-US-AvaNeural"
    );

    const result = await tts.synthesize();

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="story.mp3"'
    );

    // ✅ EIN valider MP3-Stream
    result.audio.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("TTS error");
  }
});

/* ===================== START ===================== */
app.listen(1102, () => {
  console.log("✅ Server läuft auf http://localhost:1102");
});
