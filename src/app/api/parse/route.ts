import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// NVIDIA build.nvidia.com — OpenAI-compatible endpoint, used for BOTH
// text-PDF parsing (nemotron-super, text-only) and OCR on image/scanned
// PDFs (nemotron-3-nano-omni, vision-capable). Same client, same key —
// this matches ai-write, ats-optimize and full-optimize, which all
// already call NVIDIA natively with NVIDIA_API_KEY.
const nemotron = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
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

// Rough token estimator (no tokenizer dependency): ~4 chars per token is a
// safe-enough approximation for budgeting against the provider's TPM limit.
function estimateTokens(str: string): number {
  return Math.ceil(str.length / 4);
}

// Free/on-demand NVIDIA NIM tiers can also cap tokens per minute. Sending a
// fixed large completion budget every time can blow past that cap on short
// requests. This clamps the completion budget so prompt + completion always
// stays under the limit, while leaving room for genuinely long resumes to
// still get a full response.
function completionBudget(promptText: string, cap: number, floor: number, ceiling: number): number {
  const promptTokens = estimateTokens(promptText);
  const safetyMargin = 200; // leave headroom for tokenizer estimation error
  const available = cap - promptTokens - safetyMargin;
  return Math.max(floor, Math.min(ceiling, available));
}

// Friendlier message when the provider's TPM rate limit is hit, instead of a
// raw 413/429 JSON blob bubbling up to the user.
function isRateLimitError(err: any): boolean {
  const status = err?.status;
  const message = String(err?.message || "");
  return status === 429 || status === 413 || /rate_limit_exceeded|tokens per minute/i.test(message);
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
  // Text-based (readable) PDFs — uses the text-only Nemotron model.
  const userMessage = `Extract the following resume into the required structure:\n\n${text}`;
  const promptForBudget = SYSTEM_PROMPT + userMessage;

  try {
    const completion = await nemotron.chat.completions.create({
      model: "nvidia/llama-3.3-nemotron-super-49b-v1",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0,
      // Sized to fit under the provider's TPM on-demand limit (prompt + completion
      // combined), while still allowing long resumes a large enough response.
      max_completion_tokens: completionBudget(promptForBudget, 8000, 1024, 6000),
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
    return safeJsonParse(content, "Nemotron resume parser (json_schema mode)");
  } catch (schemaError) {
    if (isRateLimitError(schemaError)) {
      throw new Error(
        "Your resume text is too large for the current NVIDIA API rate limit. Try shortening it, splitting it up, or upgrading your NVIDIA tier."
      );
    }

    // Fallback for cases where strict json_schema isn't accepted:
    // fall back to json_object mode (same pattern as full-optimize route)
    // instead of ever routing text PDFs to a different provider/model.
    // NOTE: deliberately does NOT re-embed the full JSON schema as text here —
    // that alone was often larger than the resume itself and was a major
    // contributor to hitting the TPM limit. A short instruction is enough
    // since the model already saw the required fields via SYSTEM_PROMPT.
    console.warn("Nemotron json_schema mode failed, falling back to json_object:", schemaError);

    const fallbackSystemPrompt = `${SYSTEM_PROMPT}\n\nReturn STRICTLY valid JSON only — no markdown fences, no extra text — with these top-level keys: personalInfo, education, skills, experience, projects, extras.`;
    const fallbackPromptForBudget = fallbackSystemPrompt + userMessage;

    const completion = await nemotron.chat.completions.create({
      model: "nvidia/llama-3.3-nemotron-super-49b-v1",
      messages: [
        {
          role: "system",
          content: fallbackSystemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0,
      max_completion_tokens: completionBudget(fallbackPromptForBudget, 8000, 1024, 6000),
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content;
    return safeJsonParse(rawContent, "Nemotron resume parser (json_object fallback)");
  }
}

async function extractTextFromImages(images: string[]) {
  // Scanned/image PDFs — uses the vision-capable Nemotron Omni model,
  // now called directly on build.nvidia.com (same client as text parsing).
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

    const ocrInstruction = `
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
              `;

    const completion = await nemotron.chat.completions.create({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ocrInstruction
            },
            ...imageContents
          ]
        }
      ],
      temperature: 0,
      // Images already consume a large token budget on this model; cap the
      // completion request instead of blindly asking for the max every time.
      max_completion_tokens: completionBudget(ocrInstruction, 8000, 2048, 6000),
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

    // TEXT PDF — Nemotron (text-only)
    if (body.type === "text" && body.text?.trim()) {
      if (!process.env.NVIDIA_API_KEY) {
        return NextResponse.json(
          { error: "NVIDIA_API_KEY is missing in environment variables" },
          { status: 500 }
        );
      }
      resumeText = body.text.trim();
    }

    // IMAGE / SCANNED PDF — Nemotron Omni (vision, OCR)
    else if (
      body.type === "image" &&
      Array.isArray(body.images) &&
      body.images.length > 0
    ) {
      if (!process.env.NVIDIA_API_KEY) {
        return NextResponse.json(
          { error: "NVIDIA_API_KEY is missing in environment variables" },
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

    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            "The AI provider's rate limit was hit for this request. Try again with a shorter resume, wait a minute, or upgrade your NVIDIA API tier."
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || "Failed to parse resume"
      },
      { status: 500 }
    );
  }
}
