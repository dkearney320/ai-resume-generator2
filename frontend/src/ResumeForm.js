// src/ResumeForm.js
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

/** Optional: tries to load /logo.png from frontend/public for the PDF header */
async function loadLogoDataUrl(path = '/logo.png') {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data URL
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Helper: add section title with automatic page break if near bottom */
function withPageBreak(doc, title, x, yPos, h, margin) {
  if (yPos > h - margin - 24) {
    doc.addPage();
    yPos = margin;
  }
  doc.text(title, x, yPos);
  return yPos + 10;
}

/** Helper: add wrapped paragraph with auto page breaks */
function addParagraph(doc, lines, x, yPos, h, margin, lineGap = 4) {
  lines.forEach((line) => {
    if (yPos > h - margin) {
      doc.addPage();
      yPos = margin;
    }
    doc.text(line, x, yPos);
    yPos += 14 + lineGap; // line height + spacing
  });
  return yPos;
}

/** Helper: bulleted list in a column with auto page breaks */
function addBulletedList(doc, items, x, yPos, width, h, margin) {
  const bulletIndent = 10;
  items.forEach((text) => {
    const wrapped = doc.splitTextToSize(text, width - bulletIndent);
    if (yPos > h - margin) {
      doc.addPage();
      yPos = margin;
    }
    // bullet dot
    doc.circle(x + 2, yPos - 3.5, 1.5, 'F');
    // first line
    doc.text(wrapped[0], x + bulletIndent, yPos);
    yPos += 14;
    // subsequent lines
    for (let i = 1; i < wrapped.length; i++) {
      if (yPos > h - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(wrapped[i], x + bulletIndent, yPos);
      yPos += 14;
    }
  });
  return yPos;
}

export default function ResumeForm() {
  const [resumeData, setResumeData] = useState({
    name: '',
    email: '',
    skills: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // uses CRA proxy ("proxy":"http://127.0.0.1:3001") so no hardcoded URL
      const res = await axios.post('/resumes', resumeData);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  /** Branded, text-based PDF (crisp, selectable text; optional logo) */
  async function handleDownloadBrandedPDF() {
    if (!result?.preview) return;
    const { header, summary, skills, experience } = result.preview;

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const M = 48;                    // margin
    const contentW = pageW - M * 2;  // usable width
    let y = M;

    // Optional logo in /public/logo.png
    const logoDataUrl = await loadLogoDataUrl('/logo.png');
    if (logoDataUrl) {
      const logoW = 72;
      const logoH = 72;
      pdf.addImage(logoDataUrl, 'PNG', pageW - M - logoW, y, logoW, logoH);
    }

    // Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text(header?.name || 'Your Name', M, y + 18);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const email = header?.email ? `${header.email}` : '';
    if (email) {
      pdf.setTextColor('#2563eb');
      pdf.textWithLink(email, M, y + 36, { url: `mailto:${email}` });
      pdf.setTextColor('#000000');
    }
    y += 72;

    // Divider
    pdf.setDrawColor('#e5e7eb');
    pdf.setLineWidth(1);
    pdf.line(M, y, pageW - M, y);
    y += 16;

    // Summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Professional Summary', M, y);
    y += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const summaryWrapped = pdf.splitTextToSize(summary || '', contentW);
    y = addParagraph(pdf, summaryWrapped, M, y, pageH, M);

    // Skills (two columns)
    y += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    y = withPageBreak(pdf, 'Skills', M, y, pageH, M);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const colGap = 24;
    const colW = (contentW - colGap) / 2;
    const leftSkills = [];
    const rightSkills = [];
    (skills || []).forEach((s, i) => (i % 2 === 0 ? leftSkills : rightSkills).push(s));

    y += 6;
    const yLeft = addBulletedList(pdf, leftSkills, M, y, colW, pageH, M);
    const yRight = addBulletedList(pdf, rightSkills, M + colW + colGap, y, colW, pageH, M);
    y = Math.max(yLeft, yRight) + 6;

    // Experience
    y += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    y = withPageBreak(pdf, 'Experience', M, y, pageH, M);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const expItems = (experience || []).map(e => e.replace(/^•\s?/, ''));

    expItems.forEach((item) => {
      const wrapped = pdf.splitTextToSize(`• ${item}`, contentW);
      y = addParagraph(pdf, wrapped, M, y, pageH, M, 6);
    });

    // Optional footer
    // pdf.setFontSize(9); pdf.setTextColor('#6b7280');
    // pdf.text('Generated by Your Brand', M, pageH - M / 2);

    pdf.save(`${header?.name ? header.name.replace(/\s+/g, '_') : 'resume'}.pdf`);
  }

  return (
    <div className="App" style={{ maxWidth: 820, margin: '0 auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center' }}>Generate Your Resume</h2>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
          Name:
          <input name="name" value={resumeData.name} onChange={handleChange} required />
        </label>

        <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
          Email:
          <input type="email" name="email" value={resumeData.email} onChange={handleChange} required />
        </label>

        <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
          Skills:
          <input
            name="skills"
            placeholder="React, Node.js, SQL"
            value={resumeData.skills}
            onChange={handleChange}
            required
          />
        </label>

        <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'start', gap: 10 }}>
          Experience:
          <textarea
            name="experience"
            placeholder="One bullet per line"
            rows={5}
            value={resumeData.experience}
            onChange={handleChange}
            required
          />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Generate Resume'}
          </button>
          <button
            type="button"
            onClick={handleDownloadBrandedPDF}
            disabled={!result?.preview}
            title="Creates a crisp, text-based PDF with logo and layout"
          >
            Download Branded PDF
          </button>
        </div>
      </form>

      {error && <p style={{ color: 'red', marginTop: 12 }}>Error: {error}</p>}

      {result?.preview && (
        <div
          ref={previewRef}
          style={{ marginTop: 24, padding: 20, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0 }}>{result.preview.header.name}</h2>
            <a href={`mailto:${result.preview.header.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
              {result.preview.header.email}
            </a>
          </div>

          <hr style={{ margin: '16px 0' }} />

          <section>
            <h3 style={{ margin: '8px 0' }}>Professional Summary</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{result.preview.summary}</p>
          </section>

          <section style={{ marginTop: 16 }}>
            <h3 style={{ margin: '8px 0' }}>Skills</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {result.preview.skills.map((s, i) => (<li key={i}>{s}</li>))}
            </ul>
          </section>

          <section style={{ marginTop: 16 }}>
            <h3 style={{ margin: '8px 0' }}>Experience</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {result.preview.experience.map((e, i) => (<li key={i}>{e.replace(/^•\s?/, '')}</li>))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
