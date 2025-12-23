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

const renderHighlightedText = (fullText, highlights) => {
  if (!fullText) return "";
  if (!highlights || highlights.length === 0) return fullText;

  const escapedHighlights = highlights
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(`(${escapedHighlights})`, "gi");
  const parts = fullText.split(regex);

  return parts.map((part, i) => {
    const isWeak = highlights.some(
      (h) => h.toLowerCase() === part.toLowerCase()
    );
    return isWeak ? (
      <span
        key={i}
        style={{
          color: "#e40000ff",
          fontWeight: "bold",
          textDecoration: "underline",
        }}
      >
        {part}
      </span>
    ) : (
      part
    );
  });
};

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
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPoints = useMemo(() => {
    if (!analysis || !analysis.detailed_points) return [];

    const tabToCategory = {
      strengths: ["strength", "strengths"],
      weaknesses: ["weakness", "weaknesses", "critical"],
      suggestions: ["suggestion", "suggestions", "improve", "improvement", "improvements"],
    };

    const allowedCategories = tabToCategory[activeTab];

    return analysis.detailed_points.filter((point) =>
      allowedCategories.includes(point.category?.toLowerCase())
    );
  }, [analysis, activeTab]);

  const scoreClass = analysis ? getScoreColorClass(analysis.ats_score) : "";

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>ATS Resume Analyzer</h1>
        <p className={styles.subtitle}>Upload Resume (PDF)</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label htmlFor="resume-upload" className={styles.fileLabel}>
            {file ? `Selected: ${file.name}` : "Click to choose a PDF Resume..."}
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

          {analysis.summary_upgrade && analysis.summary_upgrade.found && (
            <div className={styles.summaryAnalysisWrapper}>
              <h2 className={styles.sectionTitle}>Summary Analysis</h2>
              <div className={styles.originalBox}>
                <h4 className={styles.boxLabel}>Original Summary (Weaknesses in Red)</h4>
                <div className={styles.summaryText}>
                  {renderHighlightedText(
                    analysis.summary_upgrade.original_summary,
                    analysis.summary_upgrade.weak_highlights
                  )}
                </div>
              </div>

              <div className={styles.optimizedBox}>
                <h4 className={styles.boxLabel}>Optimized Summary</h4>
                <p className={styles.summaryText}>
                  {analysis.summary_upgrade.best_summary}
                </p>
                <button
                  className={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.summary_upgrade.best_summary);
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy Summary
                </button>
              </div>
            </div>
          )}

          <Tabs tabs={TAB_CONFIG} active={activeTab} onChange={setActiveTab} />

          <div className={styles.tabContent}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {filteredPoints.map((item, index) => (
                <div key={index} className={styles.suggestionCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.statusBadge} data-status={item.status}>
                      {item.status === "red" ? "Critical" : item.status === "yellow" ? "Improve" : "Strong"}
                    </span>
                    <span className={styles.sectionLabel}>{item.section || "General"}</span>
                  </div>

                  <div className={styles.contentBody}>
                    <h4 className={styles.issueHeading}>
                      {item.status === "red" ? "🚫" : item.status === "green" ? "✅" : "💡"} {item.issue}
                    </h4>
                    {item.correction && 
                     item.correction !== "N/A" && 
                     !item.correction.includes("N/A") && 
                     item.category !== "strength" && (
                      <div className={styles.optimizationZone}>
                        <div className={styles.comparisonGrid}>
                          <div className={styles.comparisonItem}>
                            <label>Original Phrase</label>
                            <div className={styles.textStrike}>{item.issue}</div>
                          </div>
                          <div className={styles.comparisonItem}>
                            <label>Optimized (STAR Method)</label>
                            <div className={styles.textSuccess}>{item.correction}</div>
                          </div>
                        </div>
                        {item.explanation && (
                          <p className={styles.proTip}>
                            <strong>Why this works:</strong> {item.explanation}
                          </p>
                        )}
                      </div>
                    )}
                    {(item.category === "strength" || 
                      item.correction === "N/A" || 
                      item.correction?.includes("N/A") || 
                      !item.correction) && (
                      <div className={styles.optimizationZone} style={{ borderLeftColor: "#16cd6bff", background: "#f0fff4" }}>
                        <p className={styles.proTip} style={{ marginTop: 0 }}>
                          <strong>Feedback:</strong> {item.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredPoints.length === 0 && (
                <p className={styles.noContent}>Excellent! No major issues found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
