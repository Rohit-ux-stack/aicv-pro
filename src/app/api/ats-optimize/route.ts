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
        model: "openai/gpt-oss-120b",
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

    if (!response.ok) {
      console.error('Groq API error:', result);
      const groqMessage = result?.error?.message || `Groq returned status ${response.status}`;
      return NextResponse.json({ error: 'Optimization failed', detail: groqMessage }, { status: 500 });
    }

    return NextResponse.json({ data: result.choices[0].message.content.trim() });
  } catch (error) {
    console.error("ATS Optimize Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Optimization failed", detail: message }, { status: 500 });
  }
}
