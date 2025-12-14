export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            border: active === t.id ? "2px solid #333" : "1px solid #ccc",
            background: active === t.id ? "#fafafa" : "#fff",
            borderRadius: 6
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
