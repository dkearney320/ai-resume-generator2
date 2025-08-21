// backend/server.js
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// Basic Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// POST /api/generate-resume
app.post("/api/generate-resume", (req, res) => {
  const { name = "", email = "", skills = [], experience = [] } = req.body || {};
  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Please provide both name and email" });
  }

  const skillsArr = Array.isArray(skills)
    ? skills
    : String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const expArr = Array.isArray(experience)
    ? experience
    : String(experience)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

  return res.json({
    name,
    email,
    skills: skillsArr,
    experience: expArr,
    summary: `Summary for ${name} with ${skillsArr.length} skill(s)`,
  });
});

// POST /api/downloadBrandedPdf
app.post("/api/downloadBrandedPdf", (req, res) => {
  const filename = `${(req.body?.name || "resume").replace(/\s+/g, "_")}.pdf`;
  const placeholderPdf = Buffer.from(
    "PDF placeholder for " + filename,
    "utf8"
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(placeholderPdf);
});

// Serve React build
const buildDir = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// Safe SPA fallback: non-API, non-file paths go to index.html
app.get(/^\/(?!api\/)(?!.*\.\w+$).*/, (_req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

// Catch-all for unmatched API paths (404 JSON)
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: "No API route matched on server",
    path: req.path,
    method: req.method,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Listening on http://127.0.0.1:${PORT}`);
});
