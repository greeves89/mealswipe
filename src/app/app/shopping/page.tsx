"use client";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShoppingCart,
  Share2,
  Check,
  Leaf,
  Beef,
  Milk,
  Flame,
  Package,
  RefreshCw,
} from "lucide-react";

type Category = "Gemüse & Obst" | "Fleisch & Fisch" | "Milchprodukte" | "Gewürze & Öle" | "Sonstiges";

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  "Gemüse & Obst": [
    "tomaten", "gurke", "paprika", "zwiebel", "knoblauch", "spinat", "avocado",
    "mango", "zitrone", "limette", "karotte", "süßkartoffel", "zucchini",
    "salat", "kohl", "ingwer", "koriander", "basilikum", "dill", "petersilie",
    "schnittlauch", "thymian", "frühlingszwiebeln", "bambussprossen", "sojasprossen",
    "kirschtomaten", "edamame",
  ],
  "Fleisch & Fisch": [
    "hähnchen", "rindfleisch", "schweinefleisch", "lachs", "fisch", "garnelen",
    "guanciale", "speck", "bratwurst", "wurst", "kalbsschnitzel", "rinderrücken",
    "kabeljau",
  ],
  "Milchprodukte": [
    "eier", "käse", "butter", "sahne", "mozzarella", "parmesan", "pecorino",
    "feta", "joghurt", "saure sahne", "crème fraîche", "milch", "butterschmalz",
  ],
  "Gewürze & Öle": [
    "salz", "pfeffer", "olivenöl", "currypulver", "paprika", "kurkuma",
    "garam masala", "oregano", "kreuzkümmel", "muskatnuss", "sesam",
    "sojasauce", "fischsauce", "worcester", "tamarinde", "reisessig",
    "mirin", "honig", "chiliflocken",
  ],
  "Sonstiges": [],
};

function categorize(itemName: string): Category {
  const lower = itemName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return cat as Category;
    }
  }
  return "Sonstiges";
}

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  "Gemüse & Obst": Leaf,
  "Fleisch & Fisch": Beef,
  "Milchprodukte": Milk,
  "Gewürze & Öle": Flame,
  "Sonstiges": Package,
};

const CATEGORY_COLORS: Record<Category, string> = {
  "Gemüse & Obst": "text-green-400 bg-green-400/10",
  "Fleisch & Fisch": "text-red-400 bg-red-400/10",
  "Milchprodukte": "text-blue-400 bg-blue-400/10",
  "Gewürze & Öle": "text-orange-400 bg-orange-400/10",
  "Sonstiges": "text-[#94a3b8] bg-white/5",
};

const SUPERMARKETS = [
  { name: "REWE", emoji: "🛒", color: "bg-red-500/10 border-red-500/20 text-red-400" },
  { name: "Edeka", emoji: "🏪", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  { name: "Kaufland", emoji: "🏬", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
];

export default function ShoppingPage() {
  const { shoppingList, generateShoppingList, toggleShoppingItem, weeklyPlan } = useApp();

  const checkedCount = shoppingList.filter((i) => i.checked).length;
  const totalCount = shoppingList.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  // Group by category
  const grouped: Record<Category, typeof shoppingList> = {
    "Gemüse & Obst": [],
    "Fleisch & Fisch": [],
    "Milchprodukte": [],
    "Gewürze & Öle": [],
    "Sonstiges": [],
  };

  shoppingList.forEach((item) => {
    const cat = categorize(item.name);
    grouped[cat].push(item);
  });

  const handleShare = async () => {
    const text = shoppingList
      .map((item) => `${item.checked ? "✓" : "○"} ${item.name} — ${item.amount}`)
      .join("\n");
    if (navigator.share) {
      await navigator.share({ title: "MealSwipe Einkaufsliste", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Liste in die Zwischenablage kopiert!");
    }
  };

  const plannedCount = Object.keys(weeklyPlan).length;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Einkaufsliste</h1>
          <p className="text-[#64748b] text-sm mt-1">
            {totalCount === 0
              ? "Noch keine Artikel"
              : `${checkedCount} von ${totalCount} erledigt`}
          </p>
        </div>
        {shoppingList.length > 0 && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-[#0f172a] border border-white/10 hover:border-white/20 text-[#94a3b8] hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Share2 className="w-4 h-4" />
            Teilen
          </button>
        )}
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div>
          <div className="w-full bg-[#1e293b] rounded-full h-2.5 mb-1">
            <motion.div
              className="bg-gradient-to-r from-teal-500 to-teal-400 h-2.5 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {progress === 100 && (
            <p className="text-teal-400 text-sm font-semibold text-center">
              Alles erledigt! 🎉
            </p>
          )}
        </div>
      )}

      {/* Generate / Refresh */}
      <button
        onClick={generateShoppingList}
        disabled={plannedCount === 0}
        className="w-full flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] border border-white/5 hover:border-teal-500/30 text-[#94a3b8] hover:text-teal-400 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RefreshCw className="w-4 h-4" />
        {shoppingList.length > 0 ? "Liste neu generieren" : "Liste generieren"}
      </button>

      {/* Empty state */}
      {shoppingList.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10"
        >
          <div className="w-20 h-20 rounded-full bg-[#0f172a] flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-[#475569]" />
          </div>
          <h3 className="font-bold text-lg mb-2">Keine Artikel</h3>
          <p className="text-[#64748b] text-sm mb-4">
            {plannedCount === 0
              ? "Plane zuerst Mahlzeiten für die Woche"
              : "Generiere deine Liste aus dem Wochenplan"}
          </p>
          {plannedCount === 0 && (
            <Link
              href="/app/plan"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all text-sm"
            >
              Zum Wochenplan
            </Link>
          )}
        </motion.div>
      )}

      {/* Grouped items */}
      {(Object.entries(grouped) as [Category, typeof shoppingList][]).map(([cat, items]) => {
        if (items.length === 0) return null;
        const Icon = CATEGORY_ICONS[cat];
        const colorClass = CATEGORY_COLORS[cat];

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Category header */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${colorClass.split(" ").slice(1).join(" ")}`}>
              <Icon className={`w-4 h-4 ${colorClass.split(" ")[0]}`} />
              <span className={`text-sm font-semibold ${colorClass.split(" ")[0]}`}>{cat}</span>
              <span className={`text-xs ml-auto ${colorClass.split(" ")[0]} opacity-60`}>
                {items.filter((i) => i.checked).length}/{items.length}
              </span>
            </div>

            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      i < items.length - 1 ? "border-b border-white/5" : ""
                    } ${item.checked ? "opacity-50" : ""}`}
                    onClick={() => toggleShoppingItem(item.id)}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        item.checked
                          ? "bg-teal-500 border-teal-500"
                          : "border-[#475569] hover:border-teal-500"
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`flex-1 text-sm ${
                        item.checked ? "line-through text-[#475569]" : "text-[#f8fafc]"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-[#64748b] text-xs font-medium shrink-0">
                      {item.amount}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      {/* Supermarket integrations */}
      {shoppingList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <h3 className="font-bold text-base mb-3">Direkt bestellen</h3>
          <div className="grid grid-cols-3 gap-3">
            {SUPERMARKETS.map((sm) => (
              <button
                key={sm.name}
                className={`p-4 rounded-2xl border ${sm.color} text-center transition-all hover:scale-105 active:scale-95`}
                onClick={() => alert(`${sm.name} Integration kommt bald!`)}
              >
                <div className="text-2xl mb-1">{sm.emoji}</div>
                <div className="text-xs font-bold">{sm.name}</div>
              </button>
            ))}
          </div>
          <p className="text-[#475569] text-xs text-center mt-2">
            Integrationen in Kürze verfügbar
          </p>
        </motion.div>
      )}
    </div>
  );
}
