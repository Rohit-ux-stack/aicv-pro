import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
    }
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Resume parser returned empty content");
  }

  return JSON.parse(content);
}

async function extractTextFromImages(images: string[]) {
  const extractedPages: string[] = [];

  // Groq vision supports up to 5 images per request.
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

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",

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

    if (!content) {
      throw new Error("OCR returned empty content");
    }

    const pageResult = JSON.parse(content);

    if (pageResult.text) {
      extractedPages.push(pageResult.text);
    }
  }

  return extractedPages.join("\n\n");
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await req.json();

    let resumeText = "";

    // TEXT PDF
    if (body.type === "text" && body.text?.trim()) {
      resumeText = body.text.trim();
    }

    // IMAGE / SCANNED PDF
    else if (
      body.type === "image" &&
      Array.isArray(body.images) &&
      body.images.length > 0
    ) {
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
    console.error("GROQ API ERROR:", {
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
