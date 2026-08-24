import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    // 1. API Key Guard
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
      return NextResponse.json({ error: "API Configuration Error" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 2. Safe Payload Parsing
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Payload Parse Error:", parseError);
      return NextResponse.json({ error: "Invalid JSON Payload" }, { status: 400 });
    }

    if (!body || (!body.text && (!body.images || body.images.length === 0))) {
      return NextResponse.json({ error: "No text or images provided" }, { status: 400 });
    }

    const SYSTEM_PROMPT = "You are an expert ATS resume parser. Extract the resume details and return ONLY a strict JSON object matching my required schema (name, email, phone, education, experience, projects, skills). Do not include any markdown formatting or explanations.";

    // 3. Handle Text-based PDFs
    if (body.type === 'text' && body.text) {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Parse this resume text:\n\n${body.text}` }
        ],
        model: "llama-3.3-70b-versatile", // Currently active Groq Text Model
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const parsedJson = JSON.parse(chatCompletion.choices[0].message.content);
      return NextResponse.json(parsedJson);
    } 
    
    // 4. Handle Scanned PDFs / Images
    else if (body.type === 'image' && body.images && body.images.length > 0) {
      // Format base64 images exactly how Groq Vision expects
      const imageContents = body.images.map((base64Str: string) => {
        // Ensure proper base64 data URI format if missing
        const formattedUrl = base64Str.startsWith('data:image') 
          ? base64Str 
          : `data:image/jpeg;base64,${base64Str}`;
          
        return {
          type: "image_url",
          image_url: { url: formattedUrl }
        };
      });

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: SYSTEM_PROMPT },
              ...imageContents
            ]
          }
        ],
        // Replace with the exact active Vision model from your Groq console if this one is rotated
        model: "llama-3.2-11b-vision-preview", 
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const parsedJson = JSON.parse(chatCompletion.choices[0].message.content);
      return NextResponse.json(parsedJson);
    }

    // If payload structure doesn't match expected
    return NextResponse.json({ error: "Invalid payload type" }, { status: 400 });

  } catch (error: any) {
    // 5. Detailed Error Logging for Vercel Logs
    console.error("GROQ API ERROR:", {
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack
    });
    return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 });
  }
}
