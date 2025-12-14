"use client";

import { useState } from "react";
import Tabs from "../../components/Tabs";
import Loader from "../../components/Loader";
import styles from "../../styles/ats.module.css";

export default function ATSPage() {
  const [file, setFile] = useState(null);
  const [ats, setAts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a PDF file first.");
      return;
    }

    setLoading(true);
    setAts(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ats", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data?.error || "Server error");
        return;
      }

      if (data?.success && data.ats) {
        setAts(data.ats);
        setActiveTab("score");
      } else {
        alert("Unexpected response from server.");
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <div>
      <h2>ATS Resume Checker</h2>

      <Tabs
        tabs={[
          { id: "upload", label: "Upload Resume" },
          { id: "score", label: "ATS Score" },
          { id: "summary", label: "Summary" }
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className={styles.tabContent}>
        {activeTab === "upload" && (
          <div>
            <label className={styles.fileLabel}>
              Choose PDF resume
              <input type="file" accept="application/pdf" onChange={handleFileChange} />
            </label>

            <div style={{ marginTop: 12 }}>
              <button onClick={handleUpload} disabled={loading} className={styles.primaryBtn}>
                {loading ? "Analyzing..." : "Upload & Analyze"}
              </button>
            </div>

            <p style={{ marginTop: 12 }}>Accepted: PDF. Max file size depends on your server limits.</p>
          </div>
        )}

        {activeTab === "score" && (
          <div>
            {!ats && <p>No result yet. Upload a resume first.</p>}
            {ats && (
              <>
                <h3>ATS Score</h3>
                <div className={styles.scoreBox}>
                  <span className={styles.scoreNumber}>{ats.ats_score}</span>
                  <span>/ 100</span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <strong>Summary</strong>
                  <p>{ats.summary}</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            {!ats && <p>No result yet. Upload a resume first.</p>}
            {ats && (
              <>
                <h3>Detailed Report</h3>

                <section>
                  <h4>Strengths</h4>
                  <ul>{(ats.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                </section>

                <section>
                  <h4>Weaknesses</h4>
                  <ul>{(ats.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul>
                </section>

                <section>
                  <h4>Suggestions</h4>
                  <ul>{(ats.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                </section>
              </>
            )}
          </div>
        )}
      </div>

      {loading && <Loader />}
    </div>
  );
}
