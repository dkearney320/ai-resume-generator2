// backend/server.js
const path = require('path');
const express = require('express');

const app = express();

// ---------- Middleware ----------
app.use(express.json()); // Parse JSON bodies

// ---------- Static (React build) ----------
const buildDir = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildDir));

// ---------- Simple API health ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'API up' });
});

// ---------- Example generate endpoint (safe placeholder) ----------
app.post('/api/generate', (req, res) => {
  // In your app, this would call the AI/generation logic.
  // Keeping a no-op so the button works while backend is simple.
  res.json({ ok: true, result: { message: 'Generated successfully (placeholder)' } });
});

// ---------- Download PDF (accept both paths + methods) ----------
app.all(['/api/download-pdf', '/download-pdf'], async (req, res) => {
  try {
    // Support name from POST body or GET query
    const nameFromBody = (req.body && req.body.name) || '';
    const nameFromQuery = (req.query && req.query.name) || '';
    const safeName = (nameFromBody || nameFromQuery || 'resume').toString();
    const filename = `${safeName.replace(/\s+/g, '_')}.pdf`;

    // Minimal placeholder PDF buffer. Replace with real PDF generation when ready.
    const pdfStub = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
        "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n" +
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n" +
        "4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 72 720 Td (Resume PDF Placeholder) Tj ET\nendstream\nendobj\n" +
        "xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000114 00000 n \n0000000217 00000 n \n" +
        "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n324\n%%EOF",
      "utf8"
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfStub);
  } catch (err) {
    console.error('download-pdf error:', err);
    res.status(500).json({ error: 'Failed to create PDF' });
  }
});

// ---------- SPA fallback (safe RegExp) ----------
// Serve index.html for any non-API route (so client-side routing works).
// This regex literally means: paths starting with "/" that do NOT begin with "api" or "api/".
app.get(/^\/(?!api(?:$|\/)).*/, (req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
  console.log('NODE_ENV =', process.env.NODE_ENV || 'development');
});
