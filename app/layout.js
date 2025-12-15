import styles from "./layout.module.css";

export const metadata = {
  title: "ATS Resume Checker",
  description: "Upload a PDF CV and get an ATS score + summary",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.wrapper}>{children}</div>
      </body>
    </html>
  );
}
