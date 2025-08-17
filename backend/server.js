// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- API routes ---
app.post('/resumes', (req, res) => {
  const { name, email, skills, experience } = req.body;
  console.log('Received resume data:', req.body);

  // simple preview payload (same shape the frontend expects)
  res.status(200).json({
    message: 'Resume generated',
    preview: {
      header: { name, email },
      summary: `Detail-oriented professional with strengths in ${Array.isArray(skills) ? skills.join(', ') : skills}.`,
      skills: Array.isArray(skills) ? skills : String(skills || '').split(',').map(s => s.trim()).filter(Boolean),
      experience: String(experience || '').split('\n').map(l => l.trim()).filter(Boolean).map(b => `• ${b}`)
    }
  });
});

// simple health check for debugging
app.get('/api/health', (_req, res) => res.send('OK'));

// --- Static hosting for React build (production) ---
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));

// SPA fallback – send index.html for any non-API route
app.get('*', (req, res) => {
  // keep API 404s from falling through to SPA
  if (req.path.startsWith('/api') || req.path.startsWith('/resumes')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
