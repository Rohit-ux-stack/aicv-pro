import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// NVIDIA build.nvidia.com — OpenAI-compatible endpoint.
const nemotron = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

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

    // Reasoning off — a chain-of-thought preamble here would land inside
    // the JSON response and break json_object parsing (same failure mode
    // seen in parse/route.ts), plus it adds latency for no benefit.
    const result = await nemotron.chat.completions.create({
      model: "nvidia/llama-3.3-nemotron-super-49b-v1",
      messages: [
        { role: "system", content: "detailed thinking off" },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Very low temperature so it doesn't break the JSON structure
      response_format: { type: "json_object" } // Forces Nemotron to output clean JSON
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
