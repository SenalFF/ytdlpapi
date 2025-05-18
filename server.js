
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

function normalizeYouTubeURL(rawUrl) {
  try {
    let url = new URL(rawUrl.trim());
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (url.hostname.includes("youtube.com") && url.searchParams.has("v")) {
      const videoId = url.searchParams.get("v");
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

const YTDLP_PATH = "/usr/local/bin/yt-dlp";

app.post("/info", (req, res) => {
  const { url } = req.body;
  const normalized = normalizeYouTubeURL(url);
  const ytdlp = spawn(YTDLP_PATH, ["-J", "--no-playlist", normalized]);

  let data = "";
  ytdlp.stdout.on("data", (chunk) => (data += chunk));
  ytdlp.stderr.on("data", (err) => console.error(err.toString()));

  ytdlp.on("close", () => {
    try {
      const info = JSON.parse(data);
      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        formats: info.formats.filter(f => f.filesize && (f.ext === 'mp4' || f.ext === 'webm' || f.ext === 'm4a')),
        id: info.id
      });
    } catch {
      res.status(500).send("Failed to parse video info");
    }
  });
});

app.get("/download", (req, res) => {
  const { url, format_id, title } = req.query;
  if (!url || !format_id) return res.status(400).send("Missing URL or format");

  const filename = `${title || "download"}.${format_id}.mp4`;
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  res.setHeader("Content-Type", "video/mp4");

  const ytdlp = spawn(YTDLP_PATH, ["-f", format_id, "-o", "-", normalizeYouTubeURL(url)]);
  ytdlp.stdout.pipe(res);
  ytdlp.stderr.pipe(process.stderr);

  ytdlp.on("error", () => res.status(500).send("Download failed"));
  ytdlp.on("close", (code) => {
    if (code !== 0) res.status(500).send("yt-dlp error");
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
