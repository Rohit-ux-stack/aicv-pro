import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1",
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
      console.error('Nemotron API error:', result);
      const nemotronMessage = result?.error?.message || `Nemotron returned status ${response.status}`;
      return NextResponse.json({ error: 'Optimization failed', detail: nemotronMessage }, { status: 500 });
    }

    return NextResponse.json({ data: result.choices[0].message.content.trim() });
  } catch (error) {
    console.error("ATS Optimize Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Optimization failed", detail: message }, { status: 500 });
  }
}
