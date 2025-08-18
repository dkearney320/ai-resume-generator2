// backend/server.js
const path = require("path");
const express = require("express");

const app = express();

// Serve the React build
const buildDir = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildDir));

// (Optional) simple health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// --- SPA fallback ---
// Use a RegExp that matches everything EXCEPT routes beginning with /api
// This avoids path-to-regexp errors and serves index.html for client-side routes.
app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});
