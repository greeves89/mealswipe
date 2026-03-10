import { NextRequest, NextResponse } from "next/server";

const DEMO_RECIPE = {
  name: "Pasta al Pomodoro (Demo)",
  description: "Einfache, schnelle Pasta mit frischer Tomatensauce",
  cuisine: "Italienisch",
  ingredients: [
    { name: "Spaghetti", amount: "400g" },
    { name: "Tomaten", amount: "500g" },
    { name: "Knoblauch", amount: "3 Zehen" },
    { name: "Olivenöl", amount: "4 EL" },
    { name: "Basilikum", amount: "1 Bund" },
  ],
  steps: [
    "Pasta in Salzwasser al dente kochen.",
    "Knoblauch in Olivenöl anbraten.",
    "Tomaten würfeln und 10 Min. köcheln lassen.",
    "Mit Basilikum und Salz abschmecken.",
    "Pasta abgießen und mit der Sauce vermengen.",
  ],
  time: 20,
  calories: 480,
  protein: 16,
  carbs: 72,
  fat: 12,
  servings: 4,
  difficulty: "Einfach",
  tags: ["Pasta", "Italienisch", "Schnell", "Vegetarisch"],
  demo: true,
};

const EXTRACT_PROMPT = `Extrahiere das Rezept aus dem folgenden Text und antworte NUR mit validem JSON ohne Markdown:
{
  "name": "Rezeptname",
  "description": "Kurzbeschreibung auf Deutsch (1-2 Sätze)",
  "cuisine": "Küche (z.B. Italienisch, Deutsch, Asiatisch)",
  "ingredients": [{"name": "Zutat", "amount": "Menge"}],
  "steps": ["Schritt 1", "Schritt 2"],
  "time": Minuten als Zahl,
  "calories": Kalorien pro Portion als Zahl oder 0,
  "protein": Protein in Gramm oder 0,
  "carbs": Kohlenhydrate in Gramm oder 0,
  "fat": Fett in Gramm oder 0,
  "servings": Portionen als Zahl,
  "difficulty": "Einfach" oder "Mittel" oder "Anspruchsvoll",
  "tags": ["Tag1", "Tag2"]
}
Falls kein Rezept erkennbar, antworte mit: {"error": "Kein Rezept gefunden"}

Text:
`;

async function callOpenAI(apiKey: string, text: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "user", content: EXTRACT_PROMPT + text }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "KI-Analyse fehlgeschlagen" }, { status: 500 });
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  try {
    const recipe = JSON.parse(content.trim());
    if (recipe.error) {
      return NextResponse.json({ error: recipe.error }, { status: 422 });
    }
    return NextResponse.json(recipe);
  } catch {
    return NextResponse.json({ error: "Rezept konnte nicht extrahiert werden" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, text } = body as { url?: string; text?: string };

  const apiKey = process.env.OPENAI_API_KEY;

  // Text-based import (e.g. pasted from Instagram/TikTok caption)
  if (text && typeof text === "string" && text.trim().length > 20) {
    if (!apiKey) return NextResponse.json(DEMO_RECIPE);
    try {
      return await callOpenAI(apiKey, text.trim().slice(0, 6000));
    } catch (err) {
      console.error("Text import error:", err);
      return NextResponse.json({ error: "Import fehlgeschlagen" }, { status: 500 });
    }
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Keine URL oder Text angegeben" }, { status: 400 });
  }

  // Basic URL validation
  try { new URL(url); } catch {
    return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
  }

  if (!apiKey) return NextResponse.json(DEMO_RECIPE);

  // Fetch the URL content
  let pageText = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ForklyBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    // Strip HTML tags to get readable text, limit to ~6000 chars
    pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return NextResponse.json({ error: "URL konnte nicht geladen werden" }, { status: 422 });
  }

  if (!pageText) {
    return NextResponse.json({ error: "Kein Inhalt gefunden" }, { status: 422 });
  }

  try {
    return await callOpenAI(apiKey, pageText);
  } catch (err) {
    console.error("URL import error:", err);
    return NextResponse.json({ error: "Import fehlgeschlagen" }, { status: 500 });
  }
}
