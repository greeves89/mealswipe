import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

interface Ingredient { name: string; amount: string; }

export async function POST() {
  const session = await getSession();
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const recipes = await query<{
    id: string; name: string; description: string;
    ingredients: string; steps: string;
  }>("SELECT id, name, description, ingredients, steps FROM recipes ORDER BY created_at");

  let translated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const r of recipes) {
    try {
      const ings: Ingredient[] = typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : r.ingredients as unknown as Ingredient[];
      const steps: string[] = typeof r.steps === "string" ? JSON.parse(r.steps) : r.steps as unknown as string[];

      const payload = {
        name: r.name,
        description: r.description,
        ingredients: ings.map((i: Ingredient) => i.name).slice(0, 10),
        steps: steps.slice(0, 8),
      };

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `Translate this recipe data from English to German. Return ONLY valid JSON with exactly the same structure.\n\n${JSON.stringify(payload, null, 2)}`,
          }],
        }),
      });

      if (!res.ok) { skipped++; continue; }

      const aiData = await res.json();
      const text = aiData.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) { skipped++; continue; }

      const t = JSON.parse(match[0]);
      const tNames: string[] = t.ingredients ?? payload.ingredients;
      const newIngs = ings.map((ing: Ingredient, idx: number) => ({ ...ing, name: tNames[idx] ?? ing.name }));

      await query(
        "UPDATE recipes SET name=$1, description=$2, ingredients=$3, steps=$4 WHERE id=$5",
        [
          t.name ?? r.name,
          (t.description ?? r.description).slice(0, 250),
          JSON.stringify(newIngs),
          JSON.stringify(t.steps ?? steps),
          r.id,
        ]
      );
      translated++;

      // Rate limit: 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      errors.push(`${r.id}: ${String(e)}`);
      skipped++;
    }
  }

  return NextResponse.json({
    translated,
    skipped,
    total: recipes.length,
    errors: errors.slice(0, 5),
  });
}
