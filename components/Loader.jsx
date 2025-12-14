export default function Loader() {
  return (
    <div style={{
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 20,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none"
    }}>
      <div style={{
        padding: "8px 12px",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        background: "#fff"
      }}>
        Processing — this may take a few seconds...
      </div>
    </div>
  );
}
