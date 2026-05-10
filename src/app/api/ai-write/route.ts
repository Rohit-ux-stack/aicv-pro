import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Extract key elements to check if the resume is empty
    const targetRole = data.personalInfo?.website || "Professional";
    const technicalSkills = data.skills?.technical || "";
    const hasExperience = data.experience && data.experience.length > 0;
    const hasProjects = data.projects && data.projects.length > 0;
    const hasEducation = data.education && data.education.length > 0;

    // 2. EMPTY DATA CHECK (Guardrail)
    if (!technicalSkills && !hasExperience && !hasProjects && !hasEducation) {
      return NextResponse.json({ 
        data: "Please fill out your Target Job Profile, Skills, Education, or Experience in the previous steps so the AI can craft a highly personalized and accurate summary for you." 
      });
    }

    // 3. THE VARIATION INJECTOR
    // This random number ensures the prompt is slightly different every single time the button is clicked, breaking the AI's cache.
    const randomSeed = Math.floor(Math.random() * 100000);

    // 4. THE "ANTI-CLICHÉ" EXPERT PROMPT
    const prompt = `
      You are an elite, high-end executive resume writer. 
      Your task is to write a 3 to 4 sentence professional summary based ONLY on the provided JSON profile data.
      
      STRICT RULES - YOU MUST OBEY THESE:
      1. NO BUZZWORDS: You are strictly forbidden from using the phrases: "Results-driven", "Passionate", "Proven track record", "Strong foundation", or "Leveraging". 
      2. OPENING: Do not use "I am a". Start immediately with their target role (Target Role: ${targetRole}). Example: "Full Stack Developer specializing in..." or "UI/UX Designer with expertise in..."
      3. BE SPECIFIC: You must mention their actual hard skills, specific project names, or specific degrees from the JSON. Do not be vague.
      4. NO HALLUCINATIONS: Do not invent years of experience, tools, or skills they do not have. Rely strictly on the provided JSON.
      5. TONE: Highly professional, direct, and impactful.
      6. FORMAT: Return ONLY the summary paragraph. Do not include any introductory text, titles, or quotes.
      7. UNIQUE VARIATION: Generate a completely fresh and unique phrasing for this request. Do not use the same sentence structure as previous generations. (Seed: ${randomSeed})

      Resume Data:
      ${JSON.stringify(data)}
    `;

    // 5. Call Groq
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7, // Increased from 0.4 to 0.7 to allow for more vocabulary variation while obeying the strict rules
    });

    const summary = result.choices[0].message.content?.trim() || '';
    return NextResponse.json({ data: summary });

  } catch (error) {
    console.error("AI Summary Error:", error);
    return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
  }
}