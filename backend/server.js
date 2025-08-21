// backend/server.js
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ---------- API ROUTES (must come BEFORE static + fallback) ----------
app.post("/api/generate-resume", (req, res) => {
  const { name = "", email = "", skills = [], experience = [] } = req.body || {};

  // Return a simple JSON structure the frontend can render
  res.json({
    ok: true,
    name,
    email,
    skills: Array.isArray(skills) ? skills : String(skills).split(",").map(s => s.trim()).filter(Boolean),
    experience: Array.isArray(experience)
      ? experience
      : String(experience).split(/\r?\n/).map(s => s.trim()).filter(Boolean),
    summary: `Generated summary for ${name || "candidate"}.`
  });
});

app.post("/api/downloadBrandedPdf", async (req, res) => {
  // For now, just return a tiny text file so the download button works.
  // Swap this for real PDF generation when you’re ready.
  const content = `Branded PDF placeholder for ${req.body?.name || "candidate"}`;
  const buff = Buffer.from(content, "utf8");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
  return res.send(buff);
});

// Health check (handy on Render)
app.get("/api/healthz", (req, res) => res.json({ ok: true }));

// ---------- STATIC REACT BUILD ----------
const buildDir = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// ---------- SAFE SPA FALLBACK ----------
// Serve index.html for non-API, non-file-like paths (no dots), so client routing works.
app.get(/^\/(?!api\/)(?!.*\.\w+$).*$/, (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

// ---------- DEBUG: log mounted routes ----------
function listRoutes() {
  const routes = [];
  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase())
        .join(",");
      routes.push(`${methods.padEnd(7)} ${layer.route.path}`);
    }
  });
  console.log("Mounted routes:\n" + routes.sort().join("\n"));
}

app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
  listRoutes();
});
