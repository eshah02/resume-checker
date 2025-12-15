
"use client";
import React, { useState, useCallback, useMemo } from "react";
import Tabs from "../components/Tabs/Tabs.jsx"; 
import Loader from "../components/Loader/Loader.jsx";
import styles from "./home.module.css";

const TAB_CONFIG = [
  { id: "strengths", label: "Strengths" },
  { id: "weaknesses", label: "Weaknesses" },
  { id: "suggestions", label: "Suggestions" },
];

const getScoreColorClass = (score) => {
  if (score >= 80) return "highScore";
  if (score >= 60) return "mediumScore";
  return "lowScore";
};

export default function AtsCheckerPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0].id);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);
    } else {
      setFile(null);
      setError("Please upload a PDF file.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ats", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume.");
      }

      setAnalysis(data.ats);
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const currentTabContent = useMemo(() => {
    if (!analysis) return [];
    return analysis[activeTab] || [];
  }, [analysis, activeTab]);

  const scoreClass = analysis ? getScoreColorClass(analysis.ats_score) : "";

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>AI-Powered ATS Resume Analyzer</h1>
        <p className={styles.subtitle}>
          Upload your resume (PDF) 
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label htmlFor="resume-upload" className={styles.fileLabel}>
            {file ? `Selected: ${file.name}` : "Click here to choose a PDF Resume..."}
          </label>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={!file || loading}
        >
          {loading ? "Analyzing Resume..." : "Get ATS Score & Feedback"}
        </button>
      </form>

      {error && <div className={styles.errorBox}>Error: {error}</div>}

      {loading && <Loader />}

      {analysis && (
        <div className={styles.resultsContainer}>
          <div className={`${styles.scoreBox}`}>
            <span className={styles.scoreLabel}>ATS Score:</span>
            <span 
              className={styles.scoreNumber} 
              style={{ 
                color: scoreClass === 'highScore' ? 'var(--color-score-high)' : 
                       scoreClass === 'mediumScore' ? 'var(--color-score-medium)' : 
                       'var(--color-score-low)' 
              }}
            >
              {analysis.ats_score}
            </span>
            <span className={styles.scoreOutOf}>/ 100</span>
          </div>

          <div className={styles.summary}>
            <h2>AI Summary</h2>
            <p>{analysis.summary}</p>
          </div>

          <Tabs
            tabs={TAB_CONFIG}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div className={styles.tabContent}>
            <ul>
              {currentTabContent.map((item, index) => (
                <li key={index} className={styles[activeTab.slice(0, -1)]}>
                  {item}
                </li>
              ))}
              {currentTabContent.length === 0 && (
                <li className={styles.noContent}>No items found for this category.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}