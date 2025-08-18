// backend/server.js
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- API ROUTES ----------
app.post("/api/generate-resume", (req, res) => {
  const { name = "", email = "", skills = "", experience = "" } = req.body || {};

  // Normalize to arrays for a simple demo response
  const skillsArr = Array.isArray(skills)
    ? skills
    : String(skills)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

  const expArr = Array.isArray(experience)
    ? experience
    : String(experience)
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

  // Return structured JSON the UI can render
  return res.json({
    name,
    email,
    skills: skillsArr,
    experience: expArr,
    summary: `Generated summary for ${name || "Candidate"} with ${skillsArr.join(", ")}.`
  });
});

app.post("/api/downloadBrandedPdf", (req, res) => {
  // Demo: return a tiny PDF so the UI can download something
  const pdf = Buffer.from(
    "%PDF-1.1\n1 0 obj\n<<>>\nendobj\n2 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
    "utf8"
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
  return res.send(pdf);
});

// ---------- STATIC FRONTEND ----------
const buildDir = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- SAFE SPA FALLBACK ----------
// If the request is NOT for /api/* and NOT a file request (has a dot),
// serve index.html so the React router can handle it.
app.get("*", (req, res, next) => {
  const isApi = req.path.startsWith("/api/");
  const looksLikeFile = req.path.includes(".");
  if (isApi || looksLikeFile) return next();
  res.sendFile(path.join(buildDir, "index.html"));
});

// ---------- START ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});
