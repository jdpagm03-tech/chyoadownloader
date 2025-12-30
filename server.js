import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { UniversalEdgeTTS } from "edge-tts-universal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname));

/* ===================== HTML ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ===================== PRO-LEVEL TTS STREAM ===================== */
app.post("/tts", async (req, res) => {
  try {
    const { chapters } = req.body;

    if (!Array.isArray(chapters) || !chapters.length) {
      return res.status(400).send("No chapters provided");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="story.mp3"'
    );

    // ✅ Stream immediately
    for (let i = 0; i < chapters.length; i++) {
      const text = chapters[i];

      const tts = new UniversalEdgeTTS(
        text,
        "en-US-AvaNeural"
      );

      const result = await tts.synthesize();

      // ✅ Pipe chapter audio directly to response
      await new Promise((resolve, reject) => {
        result.audio.on("end", resolve);
        result.audio.on("error", reject);
        result.audio.pipe(res, { end: false });
      });
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("TTS streaming error");
  }
});

/* ===================== START ===================== */
app.listen(1102, () => {
  console.log("✅ Server läuft auf http://localhost:1102");
});
