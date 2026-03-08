import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Return mock data if no API key
    return NextResponse.json({
      name: "Pasta Carbonara",
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
    });
  }

  try {
    // Call OpenAI Vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Du bist ein Rezept-Scanner. Analysiere dieses Bild einer Rezeptkarte und extrahiere alle Informationen.
Antworte NUR mit validem JSON in diesem Format:
{
  "name": "Rezeptname",
  "description": "Kurzbeschreibung",
  "ingredients": [{"name": "Zutat", "amount": "Menge"}],
  "time": Minuten als Zahl,
  "calories": Kalorien pro Portion als Zahl,
  "servings": Portionen als Zahl,
  "difficulty": "Einfach" oder "Mittel" oder "Anspruchsvoll",
  "tags": ["Tag1", "Tag2"]
}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    try {
      const recipe = JSON.parse(
        content.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      );
      return NextResponse.json(recipe);
    } catch {
      return NextResponse.json(
        { error: "Rezept konnte nicht erkannt werden" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "Scan fehlgeschlagen" },
      { status: 500 }
    );
  }
}
