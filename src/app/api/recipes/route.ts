import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.spoonacular.com/recipes";

interface SpoonacularNutrient {
  name: string;
  amount: number;
}

interface SpoonacularIngredient {
  name: string;
  measures?: {
    metric?: {
      amount?: number;
      unitShort?: string;
    };
  };
}

interface SpoonacularStep {
  step: string;
}

interface SpoonacularInstruction {
  steps: SpoonacularStep[];
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  summary?: string;
  image?: string;
  cuisines?: string[];
  readyInMinutes?: number;
  servings?: number;
  nutrition?: { nutrients: SpoonacularNutrient[] };
  diets?: string[];
  dishTypes?: string[];
  extendedIngredients?: SpoonacularIngredient[];
  analyzedInstructions?: SpoonacularInstruction[];
  spoonacularScore?: number;
}

const MOCK_RECIPES = [
  { id: "m1", name: "Spaghetti Carbonara", description: "Cremige römische Pasta mit Pancetta, Ei und Pecorino.", image: "", cuisine: "Italienisch", time: 25, servings: 2, calories: 620, difficulty: "Mittel", tags: ["Pasta", "Klassiker"], ingredients: [{ name: "Spaghetti", amount: "200g" }, { name: "Pancetta", amount: "100g" }, { name: "Eier", amount: "3 Stück" }, { name: "Pecorino", amount: "60g" }], steps: [], rating: 4.8 },
  { id: "m2", name: "Hähnchen-Curry", description: "Würziges Thai-Curry mit Kokosmilch und Jasminreis.", image: "", cuisine: "Asiatisch", time: 35, servings: 4, calories: 480, difficulty: "Einfach", tags: ["Curry", "Glutenfrei"], ingredients: [{ name: "Hähnchenbrust", amount: "600g" }, { name: "Kokosmilch", amount: "400ml" }, { name: "Currypaste", amount: "2 EL" }], steps: [], rating: 4.5 },
  { id: "m3", name: "Avocado Toast", description: "Knuspriger Toast mit cremiger Avocado und Ei.", image: "", cuisine: "International", time: 10, servings: 1, calories: 350, difficulty: "Einfach", tags: ["Frühstück", "Vegetarisch"], ingredients: [{ name: "Sourdough", amount: "2 Scheiben" }, { name: "Avocado", amount: "1 Stück" }, { name: "Ei", amount: "1 Stück" }], steps: [], rating: 4.3 },
  { id: "m4", name: "Ramen", description: "Japanische Nudelsuppe mit Chashu-Schweinebauch.", image: "", cuisine: "Japanisch", time: 60, servings: 2, calories: 680, difficulty: "Anspruchsvoll", tags: ["Suppe", "Asiatisch"], ingredients: [{ name: "Ramen-Nudeln", amount: "200g" }, { name: "Schweinebauch", amount: "300g" }, { name: "Miso-Paste", amount: "3 EL" }], steps: [], rating: 4.9 },
  { id: "m5", name: "Caesar Salad", description: "Knackiger Romana-Salat mit hausgemachtem Dressing.", image: "", cuisine: "Amerikanisch", time: 15, servings: 2, calories: 320, difficulty: "Einfach", tags: ["Salat", "Vegetarisch"], ingredients: [{ name: "Romanasalat", amount: "1 Kopf" }, { name: "Parmesan", amount: "50g" }, { name: "Croutons", amount: "80g" }], steps: [], rating: 4.2 },
  { id: "m6", name: "Shakshuka", description: "Pochierte Eier in würziger Tomatensauce.", image: "", cuisine: "Nahöstlich", time: 25, servings: 2, calories: 290, difficulty: "Einfach", tags: ["Frühstück", "Vegetarisch", "Glutenfrei"], ingredients: [{ name: "Eier", amount: "4 Stück" }, { name: "Tomaten", amount: "400g" }, { name: "Paprika", amount: "2 Stück" }], steps: [], rating: 4.6 },
  { id: "m7", name: "Tacos al Pastor", description: "Mexikanische Tacos mit mariniertem Schweinefleisch.", image: "", cuisine: "Mexikanisch", time: 40, servings: 4, calories: 520, difficulty: "Mittel", tags: ["Mexikanisch", "Street Food"], ingredients: [{ name: "Schweinefleisch", amount: "500g" }, { name: "Ananas", amount: "200g" }, { name: "Maistortillas", amount: "12 Stück" }], steps: [], rating: 4.7 },
  { id: "m8", name: "Hummus Bowl", description: "Cremiger Hummus mit gegrilltem Gemüse und Fladenbrot.", image: "", cuisine: "Nahöstlich", time: 20, servings: 2, calories: 380, difficulty: "Einfach", tags: ["Vegan", "Glutenfrei"], ingredients: [{ name: "Kichererbsen", amount: "400g" }, { name: "Tahini", amount: "3 EL" }, { name: "Zitrone", amount: "1 Stück" }], steps: [], rating: 4.4 },
  { id: "m9", name: "Beef Bourguignon", description: "Französischer Rinderschmorbraten mit Rotwein.", image: "", cuisine: "Französisch", time: 180, servings: 6, calories: 720, difficulty: "Anspruchsvoll", tags: ["Schmorgericht", "Klassiker"], ingredients: [{ name: "Rindfleisch", amount: "1kg" }, { name: "Rotwein", amount: "500ml" }, { name: "Champignons", amount: "300g" }], steps: [], rating: 4.8 },
  { id: "m10", name: "Pad Thai", description: "Gebratene Reisnudeln mit Garnelen und Erdnüssen.", image: "", cuisine: "Asiatisch", time: 30, servings: 2, calories: 550, difficulty: "Mittel", tags: ["Nudeln", "Meeresfrüchte"], ingredients: [{ name: "Reisnudeln", amount: "200g" }, { name: "Garnelen", amount: "250g" }, { name: "Erdnüsse", amount: "60g" }], steps: [], rating: 4.5 },
  { id: "m11", name: "Margherita Pizza", description: "Klassische neapolitanische Pizza mit San-Marzano-Tomaten.", image: "", cuisine: "Italienisch", time: 45, servings: 2, calories: 580, difficulty: "Mittel", tags: ["Pizza", "Vegetarisch"], ingredients: [{ name: "Pizzateig", amount: "300g" }, { name: "Mozzarella", amount: "200g" }, { name: "Basilikum", amount: "1 Bund" }], steps: [], rating: 4.7 },
  { id: "m12", name: "Grüner Smoothie", description: "Energiereicher Smoothie mit Spinat, Banane und Ingwer.", image: "", cuisine: "International", time: 5, servings: 1, calories: 180, difficulty: "Einfach", tags: ["Frühstück", "Vegan", "Gesund"], ingredients: [{ name: "Spinat", amount: "100g" }, { name: "Banane", amount: "1 Stück" }, { name: "Ingwer", amount: "2cm" }], steps: [], rating: 4.1 },
  { id: "m13", name: "Lachsfilet", description: "Gebratener Lachs mit Zitronenbutter und Asparagus.", image: "", cuisine: "International", time: 20, servings: 2, calories: 420, difficulty: "Einfach", tags: ["Fisch", "Glutenfrei", "Low-Carb"], ingredients: [{ name: "Lachsfilet", amount: "2 Stück" }, { name: "Spargel", amount: "500g" }, { name: "Butter", amount: "50g" }], steps: [], rating: 4.6 },
  { id: "m14", name: "Linsensuppe", description: "Herzhafte türkische Linsensuppe mit Kreuzkümmel.", image: "", cuisine: "Nahöstlich", time: 40, servings: 4, calories: 310, difficulty: "Einfach", tags: ["Suppe", "Vegan", "Glutenfrei"], ingredients: [{ name: "Rote Linsen", amount: "300g" }, { name: "Karotten", amount: "2 Stück" }, { name: "Kreuzkümmel", amount: "2 TL" }], steps: [], rating: 4.4 },
  { id: "m15", name: "Bibimbap", description: "Koreanische Reisschüssel mit buntem Gemüse und Gochujang.", image: "", cuisine: "Koreanisch", time: 45, servings: 2, calories: 490, difficulty: "Mittel", tags: ["Reis", "Vegetarisch"], ingredients: [{ name: "Jasminreis", amount: "300g" }, { name: "Zucchini", amount: "1 Stück" }, { name: "Gochujang", amount: "2 EL" }], steps: [], rating: 4.7 },
  { id: "m16", name: "Creamy Mushroom Risotto", description: "Seidiges Risotto mit Steinpilzen und Parmesan.", image: "", cuisine: "Italienisch", time: 40, servings: 4, calories: 540, difficulty: "Mittel", tags: ["Reis", "Vegetarisch"], ingredients: [{ name: "Arborio-Reis", amount: "320g" }, { name: "Steinpilze", amount: "300g" }, { name: "Parmesan", amount: "80g" }], steps: [], rating: 4.8 },
  { id: "m17", name: "Falafel Wrap", description: "Knuspriger Falafel mit Tzatziki im Vollkornwrap.", image: "", cuisine: "Nahöstlich", time: 30, servings: 2, calories: 450, difficulty: "Mittel", tags: ["Vegan", "Street Food"], ingredients: [{ name: "Kichererbsen", amount: "400g" }, { name: "Petersilie", amount: "1 Bund" }, { name: "Vollkornwrap", amount: "2 Stück" }], steps: [], rating: 4.5 },
  { id: "m18", name: "Tiramisu", description: "Klassisches italienisches Dessert mit Espresso und Mascarpone.", image: "", cuisine: "Italienisch", time: 30, servings: 6, calories: 380, difficulty: "Mittel", tags: ["Dessert", "Klassiker"], ingredients: [{ name: "Mascarpone", amount: "500g" }, { name: "Löffelbiskuits", amount: "200g" }, { name: "Espresso", amount: "200ml" }], steps: [], rating: 4.9 },
  { id: "m19", name: "Steak mit Pommes", description: "Saftiges Ribeye-Steak mit hausgemachten Pommes Frites.", image: "", cuisine: "Amerikanisch", time: 35, servings: 2, calories: 850, difficulty: "Mittel", tags: ["Fleisch", "Klassiker"], ingredients: [{ name: "Ribeye-Steak", amount: "2 × 250g" }, { name: "Kartoffeln", amount: "600g" }, { name: "Rosmarin", amount: "2 Zweige" }], steps: [], rating: 4.7 },
  { id: "m20", name: "Mango Lassi", description: "Erfrischender indischer Joghurtdrink mit reifer Mango.", image: "", cuisine: "Indisch", time: 5, servings: 2, calories: 210, difficulty: "Einfach", tags: ["Getränk", "Vegetarisch"], ingredients: [{ name: "Mango", amount: "1 Stück" }, { name: "Joghurt", amount: "400ml" }, { name: "Kardamom", amount: "1 Prise" }], steps: [], rating: 4.3 },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get("query") ?? "";
  const cuisine = searchParams.get("cuisine") ?? "";
  const number = parseInt(searchParams.get("number") ?? "50");

  // 1. Try DB cache first
  try {
    const { query: dbQuery } = await import("@/lib/db");
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;
    if (searchQuery) {
      const pattern = `%${searchQuery.toLowerCase()}%`;
      conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(description) LIKE $${idx + 1})`);
      values.push(pattern, pattern);
      idx += 2;
    }
    if (cuisine) {
      conditions.push(`LOWER(cuisine) = $${idx}`);
      values.push(cuisine.toLowerCase());
      idx++;
    }
    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const dbRecipes = await dbQuery<{
      id: string; name: string; description: string; image: string; cuisine: string;
      time_minutes: number; servings: number; calories: number; difficulty: string;
      tags: string[]; ingredients: string; steps: string; rating: number; source: string;
    }>(
      `SELECT id, name, description, image, cuisine, time_minutes, servings, calories,
              difficulty, tags, ingredients, steps, rating, source
       FROM recipes ${where} ORDER BY RANDOM() LIMIT $${idx}`,
      [...values, number]
    );
    if (dbRecipes.length > 0) {
      const recipes = dbRecipes.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        image: r.image,
        cuisine: r.cuisine,
        time: r.time_minutes,
        servings: r.servings,
        calories: r.calories,
        difficulty: r.difficulty,
        tags: r.tags ?? [],
        ingredients: typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : r.ingredients,
        steps: typeof r.steps === "string" ? JSON.parse(r.steps) : r.steps,
        rating: r.rating,
        source: r.source,
      }));
      return NextResponse.json({ recipes, total: recipes.length, source: "db" });
    }
  } catch {
    // DB not available, fall through
  }

  // 2. Try Spoonacular live
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    let results = MOCK_RECIPES;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (cuisine) {
      results = results.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    }
    return NextResponse.json({ recipes: results, total: results.length, noApiKey: true });
  }

  const params = new URLSearchParams({
    apiKey,
    number: String(number),
    offset: searchParams.get("offset") ?? "0",
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    instructionsRequired: "true",
    fillIngredients: "true",
    ...(searchQuery && { query: searchQuery }),
    ...(cuisine && { cuisine }),
  });

  try {
    const res = await fetch(`${BASE}/complexSearch?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ recipes: MOCK_RECIPES, total: MOCK_RECIPES.length });
    }
    const data = await res.json();
    const recipes = (data.results ?? []).map((r: SpoonacularRecipe) => ({
      id: String(r.id),
      name: r.title,
      description: r.summary?.replace(/<[^>]*>/g, "").slice(0, 150) ?? "",
      image: r.image ?? "",
      cuisine: r.cuisines?.[0] ?? "International",
      time: r.readyInMinutes ?? 30,
      servings: r.servings ?? 4,
      calories: Math.round(r.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount ?? 400),
      difficulty: (r.readyInMinutes ?? 30) <= 20 ? "Einfach" : (r.readyInMinutes ?? 30) <= 45 ? "Mittel" : "Anspruchsvoll",
      tags: [...(r.diets ?? []).slice(0, 3), ...(r.dishTypes ?? []).slice(0, 2)]
        .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 5),
      ingredients: (r.extendedIngredients ?? []).map((i) => ({
        name: i.name,
        amount: `${i.measures?.metric?.amount?.toFixed(0) ?? ""} ${i.measures?.metric?.unitShort ?? ""}`.trim(),
      })),
      steps: (r.analyzedInstructions?.[0]?.steps ?? []).map((s) => s.step),
      rating: Math.round(((r.spoonacularScore ?? 70) / 20) * 10) / 10,
      source: "Spoonacular",
    }));
    return NextResponse.json({ recipes, total: data.totalResults ?? 0 });
  } catch {
    return NextResponse.json({ recipes: MOCK_RECIPES, total: MOCK_RECIPES.length });
  }
}
