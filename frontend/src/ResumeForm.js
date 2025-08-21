// frontend/src/ResumeForm.js
import React, { useState } from "react";

export default function ResumeForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to POST JSON to a relative API path so it works on Render
  async function postJson(path, payload) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Try to pull back any JSON error, else text, else status text
      let message = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        if (j?.error) message += ` - ${j.error}`;
      } catch {
        const t = await res.text().catch(() => "");
        if (t) message += ` - ${t}`;
      }
      throw new Error(message);
    }
    return res.json();
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        // backend accepts arrays; split the inputs here
        skills: (skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: (experience || "")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      // 👇 IMPORTANT: relative path so it works on Render behind one domain
      const data = await postJson("/api/generate-resume", payload);
      setResult(data);
    } catch (err) {
      setError(`Error: Request failed with status code ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadBranded() {
    try {
      setError("");
      const res = await fetch("/api/downloadBrandedPdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, skills, experience }),
      });
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(name || "resume").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Error: Request failed with status code ${err.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: 24 }}>
      <h1 style={{ textAlign: "center" }}>AI Resume Generator</h1>
      <h2 style={{ textAlign: "center" }}>Generate Your Resume</h2>

      <form onSubmit={handleGenerate}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <label style={{ alignSelf: "center" }}>Name:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />

          <label style={{ alignSelf: "center" }}>Email:</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />

          <label style={{ alignSelf: "center" }}>Skills:</label>
          <input
            placeholder="React, Node.js, SQL"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />

          <label style={{ alignSelf: "start" }}>Experience:</label>
          <textarea
            placeholder="One bullet per line"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={6}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Resume"}
          </button>

          <button
            type="button"
            onClick={handleDownloadBranded}
            disabled={!result}
            title={!result ? "Generate a resume first" : ""}
          >
            Download Branded PDF
          </button>
        </div>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: 16 }}>
          {error}
        </p>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          {/* If backend ever sends HTML use dangerouslySetInnerHTML;
              otherwise show structured JSON */}
          {"html" in result ? (
            <div dangerouslySetInnerHTML={{ __html: result.html }} />
          ) : (
            <>
              <h3>{result.name || name || "Unnamed"}</h3>
              <p>{result.email || email}</p>
              <hr />
              <h4>Skills</h4>
              <ul>
                {(result.skills || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <h4>Experience</h4>
              <ul>
                {(result.experience || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              {result.summary && (
                <>
                  <h4>Professional Summary</h4>
                  <p>{result.summary}</p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
