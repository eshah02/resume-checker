import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>ATS Resume Checker</h1>
      <p>Upload a resume PDF and get an ATS score and suggestions powered by Gemini.</p>
      <Link href="/ats">
        <button style={{ padding: "10px 14px", cursor: "pointer" }}>Open ATS Checker</button>
      </Link>
    </main>
  );
}
