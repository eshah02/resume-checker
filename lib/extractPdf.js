import pdf from "pdf-parse";

export async function extractPdfText(buffer) {
  const data = await pdf(buffer);
  return data.text || "";
}
