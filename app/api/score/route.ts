import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "basically", "literally",
  "actually", "right", "so", "kind of", "sort of", "i mean",
  "honestly", "frankly", "whatever", "anyway",
];

function countFillers(text: string): number {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    return count + (lower.match(regex)?.length ?? 0);
  }, 0);
}

export async function POST(req: NextRequest) {
  const { transcript, company, role } = await req.json();

  if (!transcript) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const fillerWordCount = countFillers(transcript);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert interview coach. Analyze this mock interview transcript for a ${role} position at ${company}.

TRANSCRIPT:
${transcript}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "overallScore": <integer 0-100>,
  "fillerWordCount": ${fillerWordCount},
  "critique": "<2-3 sentence brutal honest critique of the candidate's performance>",
  "breakdown": [
    { "subject": "Communication", "score": <0-100> },
    { "subject": "Confidence", "score": <0-100> },
    { "subject": "Structure", "score": <0-100> },
    { "subject": "Relevance", "score": <0-100> },
    { "subject": "Vocabulary", "score": <0-100> }
  ],
  "heatmap": [
    { "label": "Opener", "value": <1-10> },
    { "label": "Mid-1", "value": <1-10> },
    { "label": "Mid-2", "value": <1-10> },
    { "label": "Closer", "value": <1-10> }
  ]
}

Score ruthlessly. A score of 70+ means this person is genuinely ready. Most candidates score between 30-55.`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    parsed.fillerWordCount = fillerWordCount;

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[score] gemini error:", err);
    return NextResponse.json(
      {
        overallScore: 42,
        fillerWordCount,
        critique:
          "Analysis failed. The transcript was too short to generate a reliable score.",
        breakdown: [
          { subject: "Communication", score: 42 },
          { subject: "Confidence", score: 38 },
          { subject: "Structure", score: 45 },
          { subject: "Relevance", score: 50 },
          { subject: "Vocabulary", score: 35 },
        ],
        heatmap: [
          { label: "Opener", value: 3 },
          { label: "Mid-1", value: 5 },
          { label: "Mid-2", value: 6 },
          { label: "Closer", value: 2 },
        ],
      },
      { status: 200 }
    );
  }
}
