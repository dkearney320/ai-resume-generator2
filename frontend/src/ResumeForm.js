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

  // Helper to POST JSON with a RELATIVE path (works on Render + local dev)
  async function postJson(path, payload) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
    return res.json();
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await postJson("/api/generate-resume", {
        name,
        email,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: experience
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      });
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
      // EXACT route expected by your backend:
      const res = await fetch("/api/downloadBrandedPdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, skills, experience }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
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
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label style={{ alignSelf: "center" }}>Email:</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

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

      {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
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
                {(Array.isArray(result.experience) ? result.experience : []).map((b, i) => (
                  <li key={i}>{typeof b === "string" ? b : (b?.bullets || []).join(" ")}</li>
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
