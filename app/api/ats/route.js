import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // read PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const resumeText = (data.text || "").trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const prompt = `
You are an ATS Resume Checker assistant.

Return ONLY valid JSON in this exact format:

{
  "ats_score": 0,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
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
