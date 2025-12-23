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
  if (!highlights || !Array.isArray(highlights) || highlights.length === 0) return fullText;
  
  const escapedHighlights = highlights
    .filter(h => h && typeof h === 'string')
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
    
  if (!escapedHighlights) return fullText;

  const regex = new RegExp(`(${escapedHighlights})`, "gi");
  const parts = fullText.split(regex);
  return parts.map((part, i) => {
    const isWeak = highlights.some((h) => h?.toLowerCase() === part?.toLowerCase());
    return isWeak ? (
      <span key={i} style={{ color: "#e40000", fontWeight: "bold", textDecoration: "underline" }}>
        {part}
      </span>
    ) : (part);
  });
};

export default function AtsCheckerPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0].id);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a valid PDF.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/ats", { method: "POST", body: formData });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.ats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const experienceFixes = useMemo(() => {
    if (!analysis?.detailed_points) return [];
    return analysis.detailed_points.filter(p => 
      p.section?.toLowerCase().includes("experience") && 
      (p.category === "weakness" || p.category === "suggestion" || p.status === "red")
    );
  }, [analysis]);
  const filteredPoints = useMemo(() => {
    if (!analysis?.detailed_points) return [];
    const mapping = {
      strengths: ["strength", "strengths", "green"],
      weaknesses: ["weakness", "weaknesses", "critical", "red"],
      suggestions: ["suggestion", "suggestions", "improve", "orange", "yellow"],
    };

    return analysis.detailed_points.filter(p => {
      const categoryMatch = mapping[activeTab].includes(p.category?.toLowerCase()) || 
                            mapping[activeTab].includes(p.status?.toLowerCase());
            const isDuplicate = p.section?.toLowerCase().includes("experience") && activeTab !== "strengths";
      
      return categoryMatch && !isDuplicate;
    });
  }, [analysis, activeTab]);

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
         <input type="file" accept=".pdf" onChange={handleFileChange} />
         <button type="submit" disabled={loading || !file}>Analyze</button>
      </form>

      {loading && <Loader />}
      {error && <div className={styles.errorBox}>{error}</div>}

      {analysis && (
        <div className={styles.resultsContainer}>
          {analysis.summary_upgrade && (
            <div className={styles.summaryAnalysisWrapper}>
              <h3>Summary Optimization</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.originalBox}>
                  <label>Original</label>
                  <div>{renderHighlightedText(analysis.summary_upgrade.original_summary, analysis.summary_upgrade.weak_highlights)}</div>
                </div>
                <div className={styles.optimizedBox}>
                  <label>Optimized</label>
                  <p>{analysis.summary_upgrade.best_summary}</p>
                </div>
              </div>
            </div>
          )}
          {experienceFixes.length > 0 && (
            <div className={styles.summaryAnalysisWrapper}>
              <h3>Experience Optimizations</h3>
              {experienceFixes.map((item, i) => (
                <div key={i} className={styles.optimizationZone} style={{marginBottom: '1rem'}}>
                  <div className={styles.comparisonGrid}>
                    <div className={styles.comparisonItem}>
                      <label>Original Bullet</label>
                      <div className={styles.textStrike}>
                        {renderHighlightedText(item.original_phrase || item.issue, item.weak_highlights)}
                      </div>
                    </div>
                    <div className={styles.comparisonItem}>
                      <label>STAR Recommendation</label>
                      <div className={styles.textSuccess}>{item.correction}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Tabs tabs={TAB_CONFIG} active={activeTab} onChange={setActiveTab} />
          
          <div className={styles.tabContent}>
            {filteredPoints.map((item, i) => (
              <div key={i} className={styles.suggestionCard}>
                <strong>{item.section}</strong>
                <p>{item.issue}</p>
                {item.correction && item.category !== "strength" && (
                   <div className={styles.textSuccess} style={{marginTop: '10px', padding: '10px', background: '#f0fff4'}}>
                     Update to: {item.correction}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
