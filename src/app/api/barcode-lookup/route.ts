import { NextRequest, NextResponse } from "next/server";

interface OFFProduct {
  product_name?: string;
  product_name_de?: string;
  generic_name?: string;
  quantity?: string;
  categories_tags?: string[];
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  image_front_small_url?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  "en:fruits": "Obst",
  "en:vegetables": "Gemüse",
  "en:meats": "Fleisch & Fisch",
  "en:fish": "Fleisch & Fisch",
  "en:seafood": "Fleisch & Fisch",
  "en:dairy": "Milchprodukte",
  "en:milks": "Milchprodukte",
  "en:cheeses": "Milchprodukte",
  "en:cereals": "Getreide & Pasta",
  "en:pasta": "Getreide & Pasta",
  "en:bread": "Getreide & Pasta",
  "en:legumes": "Hülsenfrüchte",
  "en:spices": "Gewürze & Öle",
  "en:oils": "Gewürze & Öle",
  "en:baking": "Backzutaten",
  "en:beverages": "Getränke",
  "en:waters": "Getränke",
  "en:juices": "Getränke",
  "en:canned-foods": "Konserven",
  "en:frozen-foods": "Tiefkühl",
};

function mapCategory(tags: string[]): string {
  for (const tag of tags) {
    const mapped = CATEGORY_MAP[tag];
    if (mapped) return mapped;
  }
  return "Sonstiges";
}

function parseQuantityAndUnit(quantityStr: string | undefined): { quantity: number; unit: string } {
  if (!quantityStr) return { quantity: 1, unit: "Stück" };
  const match = quantityStr.match(/^([\d.,]+)\s*(g|kg|ml|l|cl)\b/i);
  if (!match) return { quantity: 1, unit: "Packung" };
  const qty = parseFloat(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();
  const normalizedUnit = unit === "cl" ? "ml" : unit;
  const normalizedQty = unit === "cl" ? qty * 10 : qty;
  return { quantity: normalizedQty, unit: normalizedUnit };
}

// GET /api/barcode-lookup?barcode=<EAN>
export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get("barcode");
  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: { "User-Agent": "Forkly/1.0 (https://forkly.site)" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error("OFF API error");

    const data = await res.json() as { status: number; product?: OFFProduct };
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false });
    }

    const p = data.product;
    const name =
      p.product_name_de?.trim() ||
      p.product_name?.trim() ||
      p.generic_name?.trim() ||
      "Unbekanntes Produkt";

    const { quantity, unit } = parseQuantityAndUnit(p.quantity);
    const category = mapCategory(p.categories_tags ?? []);

    return NextResponse.json({
      found: true,
      name,
      quantity,
      unit,
      category,
      image: p.image_front_small_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
  }
}
