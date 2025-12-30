import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { UniversalEdgeTTS } from "edge-tts-universal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(bodyParser.json());

/* ✅ WICHTIG: Statische Dateien erlauben */
app.use(express.static(__dirname));

/* ===================== ROUTES ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).send("Kein Text übergeben");
    }

    const tts = new UniversalEdgeTTS(
      text,
      "en-US-AvaNeural"
    );

    const result = await tts.synthesize();
    const audioBuffer = Buffer.from(
      await result.audio.arrayBuffer()
    );

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "attachment; filename=speech.mp3"
    });

    res.send(audioBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("TTS-Fehler");
  }
});

/* ===================== START ===================== */
app.listen(1102, () => {
  console.log("✅ Server läuft auf http://localhost:1102");
});
