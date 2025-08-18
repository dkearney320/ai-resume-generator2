// backend/server.js
const path = require('path');
const express = require('express');

const app = express();

/* ---------- Basics ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Tiny request logger (no deps) */
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

/* ---------- Serve React build ---------- */
const buildDir = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildDir));

/* ---------- API request logger (critical) ---------- */
app.use(/^\/api\/.*/i, (req, _res, next) => {
  console.log('[API HIT]', req.method, req.originalUrl);
  next();
});

/* ---------- Simple health ---------- */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'API up' });
});

/* ---------- Example generate ---------- */
app.post('/api/generate', (req, res) => {
  res.json({ ok: true, result: { message: 'Generated successfully (placeholder)' } });
});

/* ---------- Robust PDF endpoints ---------- */
const pdfPaths = [
  /^\/api\/download-pdf\/?$/i,
  /^\/download-pdf\/?$/i,
  /^\/api\/download[-]?branded[-]?pdf\/?$/i,
  /^\/download[-]?branded[-]?pdf\/?$/i,
  /^\/api\/downloadBrandedPdf\/?$/i,
  /^\/downloadBrandedPdf\/?$/i,
];

app.all(pdfPaths, async (req, res) => {
  try {
    console.log('[PDF ROUTE MATCHED]', req.method, req.originalUrl, 'query:', req.query);

    const nameFromBody = (req.body && (req.body.name || req.body.fileName)) || '';
    const nameFromQuery = (req.query && (req.query.name || req.query.fileName)) || '';
    const safeName = (nameFromBody || nameFromQuery || 'resume').toString();
    const filename = `${safeName.replace(/\s+/g, '_')}.pdf`;

    // Minimal valid PDF
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

/* ---------- API catch-all 404 with path ---------- */
app.all(/^\/api\/.*$/i, (req, res) => {
  console.warn('[API UNMATCHED]', req.method, req.originalUrl);
  res.status(404).json({
    error: 'No API route matched on server',
    path: req.originalUrl,
    method: req.method,
  });
});

/* ---------- SPA fallback (safe regex) ---------- */
app.get(/^\/(?!api(?:$|\/)).*/i, (_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

/* ---------- Start ---------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
  console.log('NODE_ENV =', process.env.NODE_ENV || 'development');
});
