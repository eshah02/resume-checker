import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    const resumeText = pdfData.text;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
const prompt = `
You are a Senior Technical Recruiter and ATS Auditor. 
Analyze the resume text provided below and return ONLY valid JSON.
For "detailed_points", use ONLY these categories: "strength", "weakness", or "suggestion".

Required JSON Structure:
{
  "ats_score": 85,
  "summary": "Overall feedback about the resume...",
  "summary_upgrade": {
    "found": true,
    "original_summary": "Extract the EXACT summary text found in the resume",
    "weak_highlights": ["exact phrase from summary", "another weak word"],
    "best_summary": "Provide a completely new, high-impact version here"
  },
  "detailed_points": [
    {
      "section": "Experience",
      "category": "weakness", 
      "status": "red",
      "issue": "Vague job descriptions",
      "correction": "Increased sales by 20%...",
      "explanation": "Metric-driven data helps ATS."
    }
      {
  "section": "Work Experience",
  "category": "weakness",
  "status": "red",
  "issue": "Vague bullet point",
  "original_phrase": "Responsible for managing a team and doing sales.",
  "weak_highlights": ["Responsible for", "doing sales"],
  "correction": "Led a cross-functional team of 10 to increase regional sales by 25% ($500k) in Q3.",
  "explanation": "Using action verbs and quantifiable metrics (STAR method) is more impactful than listing responsibilities."
}
  ]
}

Resume text:
${resumeText}
`.trim();
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON", raw: cleaned },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ats: parsed });

  } catch (err) {
    console.error("ATS API error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
