// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

/* ---------- middleware ---------- */
app.use(express.json());

// tiny logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// allow CRA dev server only outside production
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: ['http://127.0.0.1:3000', 'http://localhost:3000'] }));
}

/* ---------- API routes ---------- */
app.get('/health', (_req, res) => res.send('ok'));

app.post('/resumes', (req, res) => {
  const { name = '', email = '', skills = '', experience = '' } = req.body;

  const skillsList = Array.isArray(skills)
    ? skills
    : String(skills).split(',').map(s => s.trim()).filter(Boolean);

  const expList = Array.isArray(experience)
    ? experience
    : String(experience).split('\n').map(s => s.trim()).filter(Boolean);

  const summary = skillsList.length
    ? `Detail-oriented professional with strengths in ${skillsList.slice(0, 3).join(', ')}. Delivers impact through hands-on execution, clear communication, and continuous improvement.`
    : 'Detail-oriented professional seeking opportunities to grow and contribute.';

  const preview = {
    header: { name, email },
    summary,
    skills: skillsList,
    experience: expList.map(e => (e.startsWith('•') ? e : `• ${e}`)),
  };

  res.status(200).json({ message: 'Resume generated', preview });
});

/* ---------- static serving (no route patterns; v5-safe) ---------- */
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
const buildIndex = path.join(buildPath, 'index.html');
const hasBuild = fs.existsSync(buildIndex);

if (hasBuild) {
  console.log('Serving React build from:', buildPath);
  app.use(express.static(buildPath));

  // fallback: any non-API GET / non-asset -> index.html
  app.use((req, res, next) => {
    const isGet = req.method === 'GET';
    const isApi = req.path.startsWith('/resumes') || req.path.startsWith('/health');
    const isAsset =
      req.path.startsWith('/static/') ||
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|map|txt|json)$/i.test(req.path);

    if (isGet && !isApi && !isAsset) {
      console.log('Sending index.html for', req.path);
      return res.sendFile(buildIndex);
    }
    return next();
  });
} else {
  console.warn('No React build found at', buildPath);
}

/* ---------- start ---------- */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
  console.log('NODE_ENV =', process.env.NODE_ENV || '(not set)');
});
