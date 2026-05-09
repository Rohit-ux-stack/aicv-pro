import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
  You are a precise resume data extractor. You extract EVERY piece of information
  from resume text into a strict JSON format. You NEVER skip fields. You NEVER
  summarize or shorten content. You copy bullet points and descriptions EXACTLY
  as they appear. Return ONLY raw JSON — no markdown, no explanation, no code fences.
`.trim();

function buildUserPrompt(rawText: string): string {
  return `
    Extract ALL data from this resume into the JSON structure below.
    Follow every rule strictly.

    EXTRACTION RULES — READ CAREFULLY:
    1.  "responsibilities" = Copy EVERY bullet point or description line from each job.
        Join them with " | " between each point. Do NOT skip any.
    2.  "description"      = Copy EVERY bullet point or description line from each project.
        Join them with " | " between each point. Do NOT skip any.
    3.  "soft"             = Soft skills: Problem Solving, Teamwork, Leadership,
                             Communication, Time Management, etc.
    4.  "technical"        = Programming languages and web technologies only.
        Return as a comma-separated string e.g. "Java, Python, JavaScript".
    5.  "tools"            = Software tools: Figma, Photoshop, VS Code, Git, etc.
        Return as a comma-separated string e.g. "Figma, Git, Canva".
    6.  "languages"        = Spoken/written languages: English, Hindi, Marathi, etc.
        Return as a comma-separated string e.g. "English, Hindi, Marathi".
    7.  "certifications"   = All certifications as a single comma-separated string.
    8.  "awards"           = All awards and achievements as a single comma-separated string.
    9.  "hobbies"          = Hobbies if mentioned; otherwise "".
    10. "grade"            = Include CGPA, percentage, or score if mentioned.
    11. "duration"         = Full date range, e.g. "March 2025 – April 2025".
    12. "website"          = Extract the applicant's job titles or target roles as a
                             COMMA-SEPARATED LIST. e.g. "Full Stack Developer, UI/UX Designer, BCA Intern".
                             Each role must be a separate comma-separated item.
                             Do NOT merge all roles into one string without commas.
                             Do NOT store an actual URL here.
    13. "soft"             = Return as a comma-separated string
                             e.g. "Problem Solving, Teamwork, Leadership".
    14. "id" fields        = Use "edu1", "edu2" ... for education;
                             "exp1", "exp2" ... for experience;
                             "proj1", "proj2" ... for projects.
    15. Missing fields     = Use "". NEVER use null or undefined.
    16. Arrays             = Include every item found. Never collapse multiple items into one.
                             If nothing is found, use an empty array [].

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

    RESUME TEXT TO PARSE:
    ${rawText}
  `;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text: rawText } = await extractText(pdf, { mergePages: true });

    console.log('=== RAW PDF TEXT ===');
    console.log(rawText);
    console.log('===================');

    if (!rawText?.trim()) {
      return NextResponse.json(
        { error: 'No readable text found. Ensure the PDF is not a scanned image.' },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildUserPrompt(rawText) },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content ?? '{}';

    console.log('=== AI PARSED OUTPUT ===');
    console.log(raw);
    console.log('========================');

    const parsed = JSON.parse(raw);
    return NextResponse.json({ data: parsed });

  } catch (error) {
    console.error('--- PDF PARSING ERROR ---', error);
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 });
  }
}