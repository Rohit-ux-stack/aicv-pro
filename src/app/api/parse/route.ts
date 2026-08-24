import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

// Groq client — used STRICTLY for text-based (readable) PDFs.
// This matches ai-write, ats-optimize and full-optimize, which all
// already call Groq natively with the same GROQ_API_KEY.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// OpenRouter client — used STRICTLY for OCR on image/scanned PDFs.
// Groq does not host the Nemotron vision model, so OCR keeps going
// through OpenRouter. Text parsing no longer touches this client.
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Safely parses a model's JSON response. Handles empty strings, truncated
// output, and stray markdown fences instead of letting a raw SyntaxError
// ("Unexpected end of JSON input") bubble up with no context.
function safeJsonParse(raw: string | undefined | null, context: string) {
  if (!raw || !raw.trim()) {
    throw new Error(`${context}: model returned empty content`);
  }

  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `${context}: model returned invalid or truncated JSON (${
        err instanceof Error ? err.message : String(err)
      }). Raw output started with: ${cleaned.slice(0, 200)}`
    );
  }
}

const RESUME_SCHEMA = {
  type: "object",
  properties: {
    personalInfo: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
        website: { type: "string" },
        summary: { type: "string" }
      },
      required: [
        "fullName",
        "phone",
        "email",
        "location",
        "linkedin",
        "github",
        "website",
        "summary"
      ],
      additionalProperties: false
    },

    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          degree: { type: "string" },
          institution: { type: "string" },
          board: { type: "string" },
          location: { type: "string" },
          duration: { type: "string" },
          startMonth: { type: "string" },
          startYear: { type: "string" },
          endMonth: { type: "string" },
          endYear: { type: "string" },
          grade: { type: "string" },
          coursework: { type: "string" },
          achievements: { type: "string" }
        },
        required: [
          "id",
          "degree",
          "institution",
          "board",
          "location",
          "duration",
          "startMonth",
          "startYear",
          "endMonth",
          "endYear",
          "grade",
          "coursework",
          "achievements"
        ],
        additionalProperties: false
      }
    },

    skills: {
      type: "object",
      properties: {
        technical: { type: "string" },
        soft: { type: "string" },
        tools: { type: "string" },
        languages: { type: "string" }
      },
      required: [
        "technical",
        "soft",
        "tools",
        "languages"
      ],
      additionalProperties: false
    },

    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          duration: { type: "string" },
          startMonth: { type: "string" },
          startYear: { type: "string" },
          endMonth: { type: "string" },
          endYear: { type: "string" },
          responsibilities: { type: "string" }
        },
        required: [
          "id",
          "title",
          "company",
          "location",
          "duration",
          "startMonth",
          "startYear",
          "endMonth",
          "endYear",
          "responsibilities"
        ],
        additionalProperties: false
      }
    },

    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          stack: { type: "string" },
          description: { type: "string" },
          role: { type: "string" },
          link: { type: "string" },
          duration: { type: "string" }
        },
        required: [
          "id",
          "name",
          "stack",
          "description",
          "role",
          "link",
          "duration"
        ],
        additionalProperties: false
      }
    },

    extras: {
      type: "object",
      properties: {
        certifications: { type: "string" },
        awards: { type: "string" },
        activities: { type: "string" },
        hobbies: { type: "string" },
        references: { type: "string" }
      },
      required: [
        "certifications",
        "awards",
        "activities",
        "hobbies",
        "references"
      ],
      additionalProperties: false
    }
  },

  required: [
    "personalInfo",
    "education",
    "skills",
    "experience",
    "projects",
    "extras"
  ],

  additionalProperties: false
};

const SYSTEM_PROMPT = `
You are an expert ATS resume parser.

Extract ONLY information that actually exists in the resume.

Do not invent:
- companies
- dates
- skills
- education
- job titles
- achievements
- links
- phone numbers
- email addresses

If a field does not exist, return an empty string.

Convert the resume into the exact provided JSON schema.

For multiple bullet points inside experience, combine them into one string using " | ".

For multiple skills, combine them using " | ".

Preserve the original meaning and factual information.
`;

async function parseResumeText(text: string) {
  // STRICTLY Groq — readable/text PDFs never touch OpenRouter or Nemotron.
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Extract the following resume into the required structure:\n\n${text}`
        }
      ],
      temperature: 0,
      max_completion_tokens: 8192,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume",
          strict: true,
          schema: RESUME_SCHEMA
        }
      } as any
    });

    const content = completion.choices[0]?.message?.content;
    return safeJsonParse(content, "Groq resume parser (json_schema mode)");
  } catch (schemaError) {
    // Fallback for cases where strict json_schema isn't accepted:
    // fall back to json_object mode (same pattern as full-optimize route)
    // instead of ever routing text PDFs to a different provider/model.
    console.warn("Groq json_schema mode failed, falling back to json_object:", schemaError);

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nReturn STRICTLY valid JSON matching this schema (no markdown fences, no extra text):\n${JSON.stringify(RESUME_SCHEMA)}`
        },
        {
          role: "user",
          content: `Extract the following resume into the required structure:\n\n${text}`
        }
      ],
      temperature: 0,
      max_completion_tokens: 8192,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content;
    return safeJsonParse(rawContent, "Groq resume parser (json_object fallback)");
  }
}

async function extractTextFromImages(images: string[]) {
  // STRICTLY OpenRouter + Nemotron — scanned/image PDFs never touch Groq.
  const extractedPages: string[] = [];

  for (let i = 0; i < images.length; i += 5) {
    const batch = images.slice(i, i + 5);

    const imageContents = batch.map((image) => ({
      type: "image_url" as const,
      image_url: {
        url: image.startsWith("data:image")
          ? image
          : `data:image/jpeg;base64,${image}`
      }
    }));

    const completion = await openRouter.chat.completions.create({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Read these resume page images.
Perform OCR on the images.
Return ONLY JSON in this format:

{
  "text": "complete extracted resume text"
}

Preserve names, dates, emails, phone numbers,
companies, job titles, education, skills and projects.
Do not summarize.
Do not invent information.
              `
            },
            ...imageContents
          ]
        }
      ],
      temperature: 0,
      max_completion_tokens: 8192,
      response_format: {
        type: "json_object"
      }
    });

    const content = completion.choices[0]?.message?.content;
    const pageResult = safeJsonParse(content, "Nemotron OCR");

    if (pageResult.text) {
      extractedPages.push(pageResult.text);
    }
  }

  return extractedPages.join("\n\n");
}

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body is missing or not valid JSON" },
        { status: 400 }
      );
    }

    let resumeText = "";

    // TEXT PDF — strictly Groq
    if (body.type === "text" && body.text?.trim()) {
      if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
          { error: "GROQ_API_KEY is missing in environment variables" },
          { status: 500 }
        );
      }
      resumeText = body.text.trim();
    }

    // IMAGE / SCANNED PDF — strictly OpenRouter + Nemotron (OCR)
    else if (
      body.type === "image" &&
      Array.isArray(body.images) &&
      body.images.length > 0
    ) {
      if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json(
          { error: "OPENROUTER_API_KEY is missing in environment variables" },
          { status: 500 }
        );
      }
      resumeText = await extractTextFromImages(body.images);
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Unable to extract resume content" },
        { status: 422 }
      );
    }

    const resumeData = await parseResumeText(resumeText);

    return NextResponse.json({
      data: resumeData
    });

  } catch (error: any) {
    console.error("PARSE API ERROR:", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      stack: error?.stack
    });

    return NextResponse.json(
      {
        error: error?.message || "Failed to parse resume"
      },
      { status: 500 }
    );
  }
}
