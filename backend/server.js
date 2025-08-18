// backend/server.js
const path = require("path");
const express = require("express");

const app = express();

// --- Middleware ---
app.use(express.json({ limit: "2mb" }));

// (Optional) very light CORS for local dev; not needed on Render since
// frontend and backend are same origin in production.
// const cors = require("cors");
// app.use(cors());

// --- API ROUTES ---

// Health check to quickly verify API is reachable in prod:
// Open https://<your-app>.onrender.com/api/health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// This is the route your frontend calls from ResumeForm.js
app.post("/api/generate-resume", async (req, res) => {
  try {
    const { name, email, skills, experience } = req.body;

    // skills may arrive as a string or array depending on your UI
    const skillsArr = Array.isArray(skills)
      ? skills
      : (skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const expArr = Array.isArray(experience)
      ? experience
      : (experience || "")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);

    // TODO: Replace this with your real AI logic.
    // For now, return a minimal structured resume object so the UI shows something.
    const summary =
      `Results-driven professional with skills in ${skillsArr.join(", ")}. ` +
      `Experience highlights: ${expArr.slice(0, 3).join("; ")}.`;

    const mockResume = {
      name: name || "Anonymous",
      email: email || "",
      skills: skillsArr,
      experience: expArr,
      summary,
    };

    res.json(mockResume);
  } catch (err) {
    console.error("generate-resume error:", err);
    res.status(500).json({ error: "Failed to generate resume" });
  }
});

// Simple PDF stream so the Download button works.
// Replace with your real PDF generation (e.g., pdfkit, puppeteer, etc.).
app.post("/api/download-pdf", async (req, res) => {
  try {
    const { name = "resume" } = req.body || {};
    const filename = `${String(name).replace(/\s+/g, "_")}.pdf`;

    // A minimal PDF buffer (valid PDF header/footer). This is just a stub.
    // Use a library in a real app.
    const pdfStub = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
        "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n" +
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n" +
        "4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 72 720 Td (Resume PDF Placeholder) Tj ET\nendstream\nendobj\n" +
        "xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000114 00000 n \n0000000217 00000 n \n" +
        "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n324\n%%EOF",
      "utf8"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfStub);
  } catch (err) {
    console.error("download-pdf error:", err);
    res.status(500).json({ error: "Failed to create PDF" });
  }
});

// --- Static hosting of React build ---
const buildDir = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// --- SPA fallback with REGEX (avoids path-to-regexp crash) ---
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

// --- Startup ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
  console.log("NODE_ENV =", process.env.NODE_ENV);
});
