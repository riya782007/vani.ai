import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ResearchContext {
  questions?: string[];
  culture?: string;
}

function buildSystemPrompt(company: string, role: string, ctx: ResearchContext): string {
  const questionList = ctx.questions?.slice(0, 5).join("\n- ") ?? "";
  const culture = ctx.culture ?? "";

  return `You are a ruthless, no-nonsense HR manager and technical interviewer at ${company}, hiring for the role of ${role}.

Your persona:
- Direct, assertive, and intellectually demanding. You don't give hints or sympathy.
- You push back on vague answers with "Can you be more specific?" or "Give me a concrete example."
- You ask ONE question at a time and wait for the answer.
- You probe weaknesses: if an answer is weak, you say "That's not convincing. Try again."
- Keep your responses SHORT — 1-3 sentences max. You're on a call, not writing an essay.
- Never break character. Never say you're an AI.

Company culture context:
${culture}

Known interview questions for this role at ${company}:
- ${questionList || "Behavioral, technical, and situational questions relevant to the role"}

Start by greeting the candidate and asking your first question immediately. Do not ask multiple questions at once.`;
}

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Use Gemini Flash's audio understanding capability
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "audio/webm",
        data: base64Audio,
      },
    },
    "Transcribe this audio exactly. Return only the spoken words with no additional commentary.",
  ]);

  return result.response.text().trim();
}

async function generateAIResponse(
  transcript: string,
  history: Message[],
  systemPrompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const chatHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: chatHistory,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.85,
    },
  });

  const result = await chat.sendMessage(transcript);
  return result.response.text().trim();
}

async function textToSpeech(text: string): Promise<Buffer> {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY!;
  // Using Rachel voice — professional, authoritative
  const voiceId = "21m00Tcm4TlvDq8ikWAM";

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": elevenLabsKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs error: ${res.status}`);
  }

  const chunks: Uint8Array[] = [];
  const reader = res.body!.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const contextRaw = formData.get("context") as string;
  const historyRaw = formData.get("history") as string;
  const isKickoff = formData.get("kickoff") === "true";
  const audioFile = formData.get("audio") as File | null;

  const ctx: ResearchContext = contextRaw ? JSON.parse(contextRaw) : {};
  const history: Message[] = historyRaw ? JSON.parse(historyRaw) : [];
  const systemPrompt = buildSystemPrompt(company, role, ctx);

  let transcript = "";
  let aiText = "";

  try {
    if (isKickoff) {
      // First message — no audio
      aiText = await generateAIResponse("", [], systemPrompt);
    } else {
      if (!audioFile) {
        return NextResponse.json({ error: "audio required" }, { status: 400 });
      }

      const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
      transcript = await transcribeAudio(audioBlob);

      if (!transcript || transcript.length < 2) {
        // Silence / no speech detected
        aiText = "I didn't catch that. Could you repeat yourself?";
      } else {
        aiText = await generateAIResponse(transcript, history, systemPrompt);
      }
    }

    const audioBuffer = await textToSpeech(aiText);

    return new NextResponse(audioBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Transcript": encodeURIComponent(transcript),
        "X-AI-Response": encodeURIComponent(aiText),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
