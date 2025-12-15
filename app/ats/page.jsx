import Link from "next/link";
import styles from "../home.module.css";
export default function Home() {
  return (
    <main className={styles.container}>
      <h1>ATS Resume Checker</h1>
      <p>
        Upload a resume PDF and get an ATS score and suggestions powered by Gemini.
      </p>

      <Link href="/ats">
        <button className={styles.ctaBtn}>Open ATS Checker</button>
      </Link>
    </main>
  );
}
