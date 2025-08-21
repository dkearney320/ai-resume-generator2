// backend/server.js
/* eslint-disable no-console */
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

// --- middleware ---
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- tiny request logger (helps in Render logs) ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------- API ROUTES (must be BEFORE static & fallback) -------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// /api/generate-resume  (what your UI calls)
app.post("/api/generate-resume", async (req, res) => {
  const { name = "", email = "", skills = [], experience = [] } = req.body || {};
  // TODO: put your real generation here (OpenAI, etc.)
  // For now we just echo something back so UI can render.
  return res.json({
    name,
    email,
    skills: Array.isArray(skills) ? skills : String(skills).split(",").map(s => s.trim()).filter(Boolean),
    experience: Array.isArray(experience) ? experience : String(experience).split("\n").map(s => s.trim()).filter(Boolean),
    summary: "Auto-generated preview (stub). Replace with your real AI output.",
  });
});

// Optional: branded PDF download stub.
// If you don’t need the button yet, you can keep this simple 200.
// If you want a real PDF, add a library (e.g., pdfkit) later.
app.post("/api/downloadBrandedPdf", (req, res) => {
  const filename = `${(req.body?.name || "resume").replace(/\s+/g, "_")}.txt`;
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(
    `Resume for ${req.body?.name || "Unknown"}\nEmail: ${req.body?.email || ""}\n\nSkills: ${req.body?.skills || ""}\n\nExperience:\n${req.body?.experience || ""}`
  );
});

// ------------------- STATIC + SPA FALLBACK -------------------
// Serve the React build
const buildDir = path.resolve(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// Safe SPA fallback (NO '*'):
// - not /api/*
// - not file-like (has a dot, e.g. .js, .css, .png)
app.get(/^\/(?!api\/)(?!.*\.[a-zA-Z0-9]{2,}$).*/, (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

// ------------------- START -------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});
