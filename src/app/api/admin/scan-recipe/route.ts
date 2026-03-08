import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "daniel.alisch@me.com").split(",").map(e => e.trim());

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { imageBase64 } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: "No image" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No OPENAI_API_KEY" }, { status: 500 });

  const prompt = `Analyze this recipe image and extract structured data. Return ONLY valid JSON with this exact schema:
{
  "name": "string",
  "description": "string (1-2 sentences)",
  "cuisine": "string",
  "ingredients": [{"name": "string", "amount": "string"}],
  "steps": ["string"],
  "time": number (minutes),
  "calories": number (per serving, estimate),
  "servings": number,
  "difficulty": "Einfach" | "Mittel" | "Anspruchsvoll",
  "tags": ["string"]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "OpenAI API error" }, { status: 502 });
  }

  const aiData = await response.json();
  const text = aiData.choices?.[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "No JSON in response" }, { status: 500 });

  const recipe = JSON.parse(jsonMatch[0]);
  return NextResponse.json(recipe);
}

// PUT: save scanned recipe to global recipes table
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recipe = await req.json();
  const id = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  await query(
    `INSERT INTO recipes (id, name, description, image, cuisine, time_minutes, servings, calories, difficulty, tags, ingredients, steps, rating, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'admin_scan')`,
    [
      id,
      recipe.name,
      recipe.description ?? "",
      recipe.image ?? "",
      recipe.cuisine ?? "International",
      recipe.time ?? 30,
      recipe.servings ?? 4,
      recipe.calories ?? 400,
      recipe.difficulty ?? "Mittel",
      recipe.tags ?? [],
      JSON.stringify(recipe.ingredients ?? []),
      JSON.stringify(recipe.steps ?? []),
      recipe.rating ?? 4.0,
    ]
  );

  return NextResponse.json({ ok: true, id });
}
