import React from 'react';
import styles from "./Tabs.module.css"; 
export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className={styles.tabs}>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`${styles.tabBtn} ${active === t.id ? styles.active : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}