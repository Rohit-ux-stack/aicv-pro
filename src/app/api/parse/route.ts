import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
  You are a precise resume data extractor. You extract EVERY piece of information
  from resume text or images into a strict JSON format. You NEVER skip fields. You NEVER
  summarize or shorten content. You copy bullet points and descriptions EXACTLY
  as they appear. Return ONLY raw JSON — no markdown, no explanation, no code fences.
`.trim();

const EXTRACTION_RULES_AND_SCHEMA = `
  Extract ALL data from this resume into the JSON structure below.
  Follow every rule strictly.

  EXTRACTION RULES — READ CAREFULLY:
  1.  "responsibilities" = Copy EVERY bullet point or description line from each job.
      Join them with " | " between each point. Do NOT skip any.
  2.  "description"      = Copy EVERY bullet point or description line from each project.
      Join them with " | " between each point. Do NOT skip any.
  3.  "soft"             = Soft skills: Problem Solving, Teamwork, Leadership, Communication, Time Management, etc.
  4.  "technical"        = Programming languages and web technologies only. (Return as a comma-separated string)
  5.  "tools"            = Software tools: Figma, Photoshop, VS Code, Git, etc. (Return as a comma-separated string)
  6.  "languages"        = Spoken/written languages: English, Hindi, Marathi, etc. (Return as a comma-separated string)
  7.  "certifications"   = All certifications as a single comma-separated string.
  8.  "awards"           = All awards and achievements as a single comma-separated string.
  9.  "hobbies"          = Hobbies if mentioned; otherwise "".
  10. "grade"            = Include CGPA, percentage, or score if mentioned.
  11. "duration"         = Full date range, e.g. "March 2025 – April 2025".
  12. "website"          = Extract the applicant's job titles or target roles as a
                           COMMA-SEPARATED LIST. e.g. "Full Stack Developer, UI/UX Designer".
                           Do NOT merge all roles into one string without commas.
                           Do NOT store an actual URL here.
  13. "id" fields        = Use "edu1", "edu2" ... for education; "exp1", "exp2" ... for experience; "proj1", "proj2" ... for projects.
  14. Missing fields     = Use "". NEVER use null or undefined.
  15. Arrays             = Include every item found. Never collapse multiple items into one. If nothing is found, use an empty array [].

  REQUIRED JSON STRUCTURE:
  {
    "personalInfo": {
      "fullName": "",
      "phone": "",
      "email": "",
      "location": "",
      "linkedin": "",
      "github": "",
      "website": "",
      "summary": ""
    },
    "education": [
      {
        "id": "edu1",
        "degree": "",
        "institution": "",
        "board": "",
        "location": "",
        "duration": "",
        "grade": "",
        "coursework": "",
        "achievements": ""
      }
    ],
    "skills": {
      "technical": "",
      "soft": "",
      "tools": "",
      "languages": ""
    },
    "experience": [
      {
        "id": "exp1",
        "title": "",
        "company": "",
        "location": "",
        "duration": "",
        "responsibilities": ""
      }
    ],
    "projects": [
      {
        "id": "proj1",
        "name": "",
        "stack": "",
        "description": "",
        "role": "",
        "link": "",
        "duration": ""
      }
    ],
    "extras": {
      "certifications": "",
      "awards": "",
      "activities": "",
      "hobbies": "",
      "references": "Available upon request"
    }
  }
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── 1. HANDLE TEXT-BASED PDF (Smart Fast Route) ────────────────────────
    if (body.type === 'text') {
      console.log('=== PROCESSING TEXT VIA STANDARD MODEL ===');
      
      const chatCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${EXTRACTION_RULES_AND_SCHEMA}\n\nRESUME TEXT TO PARSE:\n${body.text}` },
        ],
        response_format: { type: 'json_object' },
      });

      const raw = chatCompletion.choices[0].message.content ?? '{}';
      console.log('=== AI TEXT PARSED OUTPUT ===');
      console.log(raw);
      
      const parsedJson = JSON.parse(raw);
      return NextResponse.json({ data: parsedJson });
    } 
    
    // ── 2. HANDLE IMAGES & SCANNED PDFs (Vision Route) ─────────────────────
    else if (body.type === 'image') {
      console.log('=== PROCESSING IMAGE(S) VIA VISION MODEL ===');
      const { images } = body;
      
      // Map multiple base64 images to Groq's expected content format
      const imageContents = images.map((base64Str: string) => ({
        type: "image_url",
        image_url: { url: base64Str }
      }));

      const chatCompletion = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `${SYSTEM_PROMPT}\n\n${EXTRACTION_RULES_AND_SCHEMA}\n\nExtract ALL resume data from the provided image(s).` 
              },
              ...imageContents
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const raw = chatCompletion.choices[0].message.content ?? '{}';
      console.log('=== AI VISION PARSED OUTPUT ===');
      console.log(raw);
      
      const parsedJson = JSON.parse(raw);
      return NextResponse.json({ data: parsedJson });
    }

    return NextResponse.json({ error: "Invalid payload type. Expected 'text' or 'image'." }, { status: 400 });

  } catch (error) {
    console.error('--- PARSING ERROR ---', error);
    return NextResponse.json({ error: 'Failed to parse document.' }, { status: 500 });
  }
}
