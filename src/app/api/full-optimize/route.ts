import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const resumeData = await req.json();

    const prompt = `
      You are an expert Applicant Tracking System (ATS) optimizer and elite executive resume writer.
      I am providing you with a user's resume data in JSON format.
      Your task is to rewrite and polish the text fields to be highly ATS-friendly.

      SPECIFIC INSTRUCTIONS:
      1. Rewrite 'personalInfo.summary' to be impactful and keyword-rich.
      2. Rewrite 'responsibilities' in the 'experience' array using strong action verbs (e.g., Spearheaded, Architected, Optimized).
      3. Rewrite 'description' in the 'projects' array to emphasize problem-solving and technical impact.
      4. DO NOT change the names of companies, dates, titles, degrees, or fabricate metrics that do not exist. Only polish the phrasing to sound more professional.
      5. DO NOT change the JSON keys, arrays, or structure. Return the exact same structure.
      6. RETURN STRICTLY VALID JSON ONLY. Do not include markdown formatting like \`\`\`json or any conversational text.

      Resume JSON:
      ${JSON.stringify(resumeData)}
    `;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Very low temperature so it doesn't break the JSON structure
      response_format: { type: "json_object" } // Forces Groq to output clean JSON
    });

    const rawContent = result.choices[0].message.content || '{}';
    
    // Safety cleanup in case the AI adds markdown blocks anyway
    const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const optimizedData = JSON.parse(cleanedContent);

    return NextResponse.json({ data: optimizedData });

  } catch (error) {
    console.error("Full Optimize Error:", error);
    return NextResponse.json({ error: "Failed to optimize resume" }, { status: 500 });
  }
}