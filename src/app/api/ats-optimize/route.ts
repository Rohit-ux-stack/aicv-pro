import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are an ATS Resume Optimizer. Rewrite the user's sentence to replace weak words with strong action verbs. Use strictly professional HR language. Return ONLY the rewritten sentence."
          },
          { role: "user", content: text }
        ]
      })
    });

    const result = await response.json();
    return NextResponse.json({ data: result.choices[0].message.content.trim() });
  } catch (error) {
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
  }
}