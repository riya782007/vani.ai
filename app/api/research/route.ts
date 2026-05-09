import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { company, role } = await req.json();

  if (!company || !role) {
    return NextResponse.json({ error: "company and role required" }, { status: 400 });
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return NextResponse.json({ questions: [], culture: "" }, { status: 200 });
  }

  try {
    const [questionsRes, cultureRes] = await Promise.all([
      fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${company} ${role} interview questions 2024 2025`,
          search_depth: "advanced",
          max_results: 5,
          include_answer: true,
        }),
      }),
      fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${company} engineering culture values hiring bar 2025`,
          search_depth: "basic",
          max_results: 3,
          include_answer: true,
        }),
      }),
    ]);

    const [questionsData, cultureData] = await Promise.all([
      questionsRes.json(),
      cultureRes.json(),
    ]);

    const questions: string[] = [];
    for (const result of questionsData.results ?? []) {
      const lines = (result.content as string)
        .split(/\n|\./)
        .filter((l: string) => l.trim().endsWith("?") && l.length > 20)
        .slice(0, 3);
      questions.push(...lines);
    }
    if (questionsData.answer) questions.unshift(questionsData.answer);

    const culture: string = cultureData.answer ?? cultureData.results?.[0]?.content ?? "";

    return NextResponse.json({ questions: questions.slice(0, 8), culture });
  } catch (err) {
    console.error("[research] tavily error:", err);
    return NextResponse.json({ questions: [], culture: "" });
  }
}
