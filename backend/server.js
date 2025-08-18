// backend/server.js
const path = require("path");
const express = require("express");

const app = express();

// --- Basic logging so you can see exactly what's hitting the server ----
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// ---------------- API: Generate Resume -----------------
// Accept both POST and GET to be forgiving, but frontend uses POST.
app.all("/api/generate-resume", (req, res) => {
  try {
    // If GET, read from query; if POST, from body.
    const src = req.method === "GET" ? req.query : req.body;

    const name = (src.name || "").toString();
    const email = (src.email || "").toString();

    // Normalize skills and experience into arrays
    const skills = Array.isArray(src.skills)
      ? src.skills
      : typeof src.skills === "string"
      ? src.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const experience = Array.isArray(src.experience)
      ? src.experience
      : typeof src.experience === "string"
      ? src.experience
          .split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean)
      : [];

    const summary =
      name || skills.length || experience.length
        ? `Professional summary for ${name || "Candidate"} with ${
            skills.length
          } skill(s) and ${experience.length} experience bullet(s).`
        : "Empty input — add your details and try again.";

    // A minimal structured response the frontend can render
    const payload = {
      name,
      email,
      skills,
      experience,
      summary,
    };

    res.json(payload);
  } catch (err) {
    console.error("generate-resume error:", err);
    res.status(500).json({ error: "Failed to generate resume" });
  }
});

// ---------------- API: Download Branded PDF -----------------
// Sends a very small valid PDF without any extra dependencies.
app.all("/api/downloadBrandedPdf", (req, res) => {
  try {
    // A tiny single-page PDF (valid). No extra libs required.
    // (This just produces a blank page PDF; it’s enough to verify download.)
    const minimalPdf = Buffer.from(
      "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000114 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n170\n%%EOF",
      "utf8"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="resume.pdf"'
    );
    res.status(200).send(minimalPdf);
  } catch (err) {
    console.error("downloadBrandedPdf error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// ------------- Static: serve the React build -----------------
const buildDir = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// ------------- SPA fallback (safe, no path-to-regexp surprises) -------------
// Only handle GETs that are NOT `/api/*`. Everything else falls through.
app.get("*", (req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(buildDir, "index.html"));
});

// ------------- Start server -------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});
