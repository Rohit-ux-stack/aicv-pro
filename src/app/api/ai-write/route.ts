import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const fullResumeData = await req.json();

    const prompt = `
      You are an expert HR recruiter. Read the following resume data and write a highly professional, tailored 2-4 line "Objective / Professional Summary".
      Focus on their tech stack, projects, education, and the value they bring. Do not include any introductory text, just return the summary itself.
      
      Resume Data:
      ${JSON.stringify(fullResumeData)}
    `;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = result.choices[0].message.content || '';
    return NextResponse.json({ data: summary });

  } catch (error) {
    return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
  }
}