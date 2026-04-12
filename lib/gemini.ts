import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function classifyAndGenerateProtocol(userInput: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
You are a neuroscience-backed cognitive recovery specialist.

A student just described their mental state: "${userInput}"

You MUST do the following — do not skip any step:

STEP 1: Classify fatigue into EXACTLY ONE of:
- LOGIC (coding, math, debugging, algorithms, problem-solving)
- NARRATIVE (reading textbooks, writing essays, memorizing, history)
- VISUAL (UI design, video editing, diagrams, watching tutorials)  
- EMOTIONAL (exams, group conflict, presentations, anxiety, stress)
If ambiguous, you MUST still choose the closest match. Never return null.

STEP 2: Classify intensity as LIGHT, MODERATE, or HEAVY based on:
- Duration clues (e.g. "30 min" = LIGHT, "2 hours" = MODERATE, "all day" = HEAVY)
- Emotional language ("completely blank", "fried", "exhausted" = HEAVY)

STEP 3: Generate a 3-step, 10-minute recovery protocol.
Each step MUST:
- Be hyper-specific (not "rest" — say exactly what to do and for how long)
- Include WHY it helps this specific fatigue type in one sentence
- Mention one thing NOT to do and why it delays recovery

STEP 4: Write a one-sentence "Instagram Warning" — what physically 
happens to their brain if they open social media right now instead.

Return ONLY valid JSON in this exact format:
{
  "fatigueType": "LOGIC|NARRATIVE|VISUAL|EMOTIONAL",
  "intensity": "LIGHT|MODERATE|HEAVY",
  "headline": "Short punchy label e.g. 'Heavy Logic Fatigue'",
  "instagramWarning": "One sentence about what opening Instagram does right now",
  "steps": [
    {"duration": "0–3 min", "action": "Exact action", "why": "Why this helps", "avoid": "What not to do"},
    {"duration": "3–7 min", "action": "Exact action", "why": "Why this helps", "avoid": "What not to do"},
    {"duration": "7–10 min", "action": "Exact action", "why": "Why this helps", "avoid": "What not to do"}
  ],
  "ambientColor": "hex color code — muted green for LOGIC, deep blue for NARRATIVE, warm amber for VISUAL, soft purple for EMOTIONAL"
}
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}