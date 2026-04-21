import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const upload = multer({ dest: "/tmp/" });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/summarize", upload.single("file"), async (req, res) => {
  try {
    let text = "";

    if (req.file) {
      text = fs.readFileSync(req.file.path, "utf8");
      fs.unlinkSync(req.file.path);
    } else if (req.body.text) {
      text = req.body.text;
    } else {
      return res.status(400).json({ error: "No text or file provided" });
    }

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Please summarize the following document clearly and concisely. Include: 1) A brief overview, 2) Key points, 3) Any action items or important dates if present.\n\nDocument:\n${text}`,
        },
      ],
    });

    res.json({ summary: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

export default app;
