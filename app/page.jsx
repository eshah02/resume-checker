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
      setError("upload a PDF file.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("select a file.");
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
      setError(err.message || "unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPoints = useMemo(() => {
    if (!analysis || !analysis.detailed_points) return [];

    const tabToCategory = {
      strengths: "strength",
      weaknesses: "weakness",
      suggestions: "suggestion",
    };

    return analysis.detailed_points.filter(
      (point) => point.category === tabToCategory[activeTab]
    );
  }, [analysis, activeTab]);

  const scoreClass = analysis ? getScoreColorClass(analysis.ats_score) : "";

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>ATS Resume Analyzer</h1>
        <p className={styles.subtitle}>Upload resume (PDF)</p>
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
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>ATS Score:</span>
            <span
              className={styles.scoreNumber}
              style={{
                color:
                  scoreClass === "highScore"
                    ? "var(--color-score-high)"
                    : scoreClass === "mediumScore"
                    ? "var(--color-score-medium)"
                    : "var(--color-score-low)",
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

          <Tabs tabs={TAB_CONFIG} active={activeTab} onChange={setActiveTab} />
          
          <div className={styles.tabContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredPoints.map((item, index) => (
                <div key={index} className={styles.suggestionCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.statusBadge} data-status={item.status}>
                      {item.status === 'red' ? 'Critical' : item.status === 'yellow' ? 'Improve' : 'Strong'}
                    </span>
                    <span className={styles.sectionLabel}>{item.section || "General"}</span>
                  </div>

                  <div className={styles.contentBody}>
                    <h4 className={styles.issueHeading}>
                      {item.status === 'red' ? '🚫' : item.status === 'green' ? '✅' : '💡'} {item.issue}
                    </h4>
                    
                    {item.correction && (
                      <div className={styles.optimizationZone}>
                        <div className={styles.comparisonGrid}>
                          <div className={styles.comparisonItem}>
                            <label>Original Phrase</label>
                            <div className={styles.textStrike}>{item.issue}</div>
                          </div>
                          
                          <div className={styles.comparisonItem}>
                            <label>Optimized (STAR Method)</label>
                            <div className={styles.textSuccess}>
                               {item.correction}
                               
                            </div>
                          </div>
                        </div>
                        
                        <p className={styles.proTip}>
                          <strong>Why this works:</strong> {item.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredPoints.length === 0 && (
                <p className={styles.noContent}>
                  Excellent! No major issues found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
