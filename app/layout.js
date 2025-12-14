import "../styles/globals.css";

export const metadata = {
  title: "ATS Resume Checker",
  description: "Upload a PDF CV and get an ATS score + summary"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>{children}</div>
      </body>
    </html>
  );
}
