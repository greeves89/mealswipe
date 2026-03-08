import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "Kein Bild übermittelt" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Demo mode — return mock data so the UI is testable without API key
    return NextResponse.json({
      name: "Pasta Carbonara (Demo)",
      description: "Klassische römische Pasta mit Ei, Pecorino und Guanciale",
      ingredients: [
        { name: "Spaghetti", amount: "400g" },
        { name: "Guanciale", amount: "150g" },
        { name: "Eier", amount: "4 Stück" },
        { name: "Pecorino Romano", amount: "100g" },
        { name: "Schwarzer Pfeffer", amount: "nach Geschmack" },
      ],
      time: 25,
      calories: 650,
      servings: 4,
      difficulty: "Mittel",
      tags: ["Pasta", "Italienisch", "Klassiker"],
      demo: true,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: `Analysiere dieses Bild einer Rezeptkarte und extrahiere alle Informationen.
Antworte NUR mit validem JSON ohne Markdown-Formatierung:
{
  "name": "Rezeptname",
  "description": "Kurzbeschreibung auf Deutsch (1-2 Sätze)",
  "cuisine": "Küche (z.B. Italienisch, Deutsch, Asiatisch)",
  "ingredients": [{"name": "Zutat", "amount": "Menge"}],
  "steps": ["Schritt 1", "Schritt 2"],
  "time": Minuten als Zahl,
  "calories": Kalorien pro Portion als Zahl oder 0 wenn unbekannt,
  "servings": Portionen als Zahl,
  "difficulty": "Einfach" oder "Mittel" oder "Anspruchsvoll",
  "tags": ["Tag1", "Tag2"]
}
Falls kein Rezept erkennbar ist, antworte mit: {"error": "Kein Rezept erkannt"}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", err);
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
      return NextResponse.json({ error: "Rezept konnte nicht erkannt werden" }, { status: 500 });
    }
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Scan fehlgeschlagen" }, { status: 500 });
  }
}

// Save scanned recipe to DB
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipe = await req.json();

  const result = await query<{ id: string }>(
    `INSERT INTO custom_recipes
       (user_id, name, description, cuisine, time, servings, calories, difficulty, tags, ingredients, steps, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Gescannt')
     RETURNING id`,
    [
      session.id,
      recipe.name,
      recipe.description ?? "",
      recipe.cuisine ?? "International",
      recipe.time ?? 30,
      recipe.servings ?? 4,
      recipe.calories ?? 0,
      recipe.difficulty ?? "Mittel",
      recipe.tags ?? [],
      JSON.stringify(recipe.ingredients ?? []),
      recipe.steps ?? [],
    ]
  );

  return NextResponse.json({ ok: true, id: result[0]?.id });
}
