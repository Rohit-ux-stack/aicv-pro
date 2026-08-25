import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// NVIDIA build.nvidia.com — OpenAI-compatible endpoint. Nemotron 3 Nano
// Omni handles BOTH text-PDF parsing and OCR on image/scanned PDFs — it's
// a genuinely omni-modal model (text + vision in, text out), so one model
// and one client cover the whole route. This matches ai-write,
// ats-optimize and full-optimize, which all call NVIDIA natively with
// NVIDIA_API_KEY.
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

Copy every word, name, and list item EXACTLY as it is spelled and spaced in the
source text — character for character. This especially applies to short
alphanumeric tokens (e.g. "3d", "iOS15", "Node.js") and hobbies/skills/tools
lists: never split a word apart, insert a space inside a token, or "correct"
spelling/spacing that looks unusual. If in doubt, copy the exact substring
rather than retyping it from memory.

FIELD-SPECIFIC RULES:

- personalInfo.website: this field is reused for the short role/title line that
  often appears directly under the candidate's name (e.g. "Front-End Developer |
  UI/UX Designer | Project Manager | Editor"). If such a line exists, put it here,
  formatted as comma-separated tags (e.g. "Front-End Developer,UI/UX Designer").
  Only put an actual website/portfolio URL here if there is no role/title line
  AND a real website URL is present in the resume.

- startMonth / endMonth (in both "experience" and "education"): these must ALWAYS
  be a two-digit numeric string from "01" to "12" (e.g. "03" for March). NEVER
  return a month name like "March" or "Mar". If the resume's date range only
  states years with no month (e.g. "2023 - 2026"), leave startMonth and endMonth
  as empty strings "" — do NOT invent or guess a month. If the role is current/
  ongoing, set endYear to "Present" and leave endMonth as "".

- experience: only include entries that are actual jobs, internships, or
  employment roles with both a title and a company. Never emit an experience
  entry where title and company are both empty — if a line doesn't clearly
  belong to an employment role, leave it out entirely rather than creating a
  placeholder entry. Do not confuse the "PROJECTS" section with "EXPERIENCE" —
  personal/academic projects belong only in the "projects" array, never in
  "experience".
`;

async function parseResumeText(text: string) {
  // Text-based (readable) PDFs — uses Nemotron 3 Nano Omni (same model as OCR).
  const userMessage = `Extract the following resume into the required structure:\n\n${text}`;
  const promptForBudget = SYSTEM_PROMPT + userMessage;

  try {
    const completion = await nemotron.chat.completions.create({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
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
      max_tokens: completionBudget(promptForBudget, 8000, 1024, 6000),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume",
          strict: true,
          schema: RESUME_SCHEMA
        }
      },
      // Omni is a reasoning model by default — without this it emits raw
      // chain-of-thought ("We need to parse...") into content instead of
      // clean JSON, breaking response_format entirely. This forces the
      // instruct (non-thinking) path, which is both faster and correct here.
      // NOTE: the Node SDK (unlike Python's) has no extra_body unwrapping,
      // so this must be a top-level key, not nested under extra_body.
      chat_template_kwargs: { enable_thinking: false }
    } as any);

    const content = completion.choices[0]?.message?.content;
    return sanitizeResumeData(safeJsonParse(content, "Nemotron resume parser (json_schema mode)"));
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
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
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
      max_tokens: completionBudget(fallbackPromptForBudget, 8000, 1024, 6000),
      response_format: { type: "json_object" },
      chat_template_kwargs: { enable_thinking: false }
    } as any);

    const rawContent = completion.choices[0]?.message?.content;
    return sanitizeResumeData(safeJsonParse(rawContent, "Nemotron resume parser (json_object fallback)"));
  }
}

// Safety net independent of prompt-following: drops any experience/education
// entries the model returned where the core identifying fields are all blank
// (e.g. a stray entry at a section boundary), and coerces month fields that
// aren't clean "01"-"12" numeric strings to "" instead of passing bad data
// through to the frontend's date formatting.
function sanitizeResumeData(data: any) {
  if (!data || typeof data !== "object") return data;

  const cleanMonth = (m: any) => {
    const s = typeof m === "string" ? m.trim() : "";
    return /^(0?[1-9]|1[0-2])$/.test(s) ? s.padStart(2, "0") : "";
  };

  if (Array.isArray(data.experience)) {
    data.experience = data.experience
      .filter((exp: any) => (exp?.title?.trim() || exp?.company?.trim()))
      .map((exp: any) => ({
        ...exp,
        startMonth: cleanMonth(exp.startMonth),
        endMonth: cleanMonth(exp.endMonth)
      }));
  }

  if (Array.isArray(data.education)) {
    data.education = data.education
      .filter((edu: any) => (edu?.degree?.trim() || edu?.institution?.trim()))
      .map((edu: any) => ({
        ...edu,
        startMonth: cleanMonth(edu.startMonth),
        endMonth: cleanMonth(edu.endMonth)
      }));
  }

  return data;
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
      max_tokens: completionBudget(ocrInstruction, 8000, 2048, 6000),
      response_format: {
        type: "json_object"
      },
      // See parseResumeText: without this, Omni emits raw reasoning text
      // instead of clean JSON. Top-level key — Node SDK has no extra_body unwrapping.
      chat_template_kwargs: { enable_thinking: false }
    } as any);

    const content = completion.choices[0]?.message?.content;

    // DEBUG: temporary — helps confirm whether the model is actually grounding
    // on the image content or hallucinating a generic resume. Check server logs
    // after a test upload: if reasoning/content describes THIS resume, the image
    // is reaching the model; if it's generic/unrelated, the image isn't landing
    // (encoding, size limit, or param issue upstream). Remove once confirmed fixed.
    console.log("NEMOTRON OCR DEBUG — batch size:", batch.length);
    console.log("NEMOTRON OCR DEBUG — reasoning_content:", (completion.choices[0]?.message as any)?.reasoning_content?.slice?.(0, 500));
    console.log("NEMOTRON OCR DEBUG — raw content:", content?.slice(0, 500));

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
