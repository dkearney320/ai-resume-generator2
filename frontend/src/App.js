// src/App.js
import React from 'react';
import './App.css';  // Import styles
import ResumeForm from './ResumeForm';  // Correct import of ResumeForm

function App() {
  return (
    <div className="App">
      <h1>AI Resume Generator</h1>
      <ResumeForm />  {/* Render ResumeForm here */}
    </div>
  );
}

export default App;
