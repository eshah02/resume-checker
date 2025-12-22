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
Analyze the resume text provided below. 

Return ONLY valid JSON in this exact format:
{
  "ats_score": 0,
  "summary": "...",
  "detailed_points": [
    {
      "section": "Experience",
      "category": "weakness", 
      "status": "red",
      "issue": "Specific issue found",
      "correction": "The improved STAR-method version",
      "explanation": "Why this change matters"
    },
    {
      "section": "Skills",
      "category": "strength",
      "status": "green",
      "issue": "High-impact skill mentioned",
      "correction": null,
      "explanation": "This is a strong point because..."
    },
    {
      "section": "Professional Summary",
      "category": "suggestion",
      "status": "yellow",
      "issue": "Generic summary statement",
      "correction": "Results-oriented professional with...",
      "explanation": "A stronger summary hooks the recruiter."
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
