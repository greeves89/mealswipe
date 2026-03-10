"use client";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  ShoppingCart, Share2, Check, Leaf, Beef, Milk, Flame, Package,
  RefreshCw, PackagePlus, AlertTriangle, X, Loader2,
} from "lucide-react";

interface PantryItem { id: string; name: string; quantity: number; unit: string; category: string; }

function pantryMatch(itemName: string, pantry: PantryItem[]): PantryItem | null {
  const needle = itemName.toLowerCase().trim();
  return pantry.find(p => {
    const hay = p.name.toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  }) ?? null;
}

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
  { name: "REWE", emoji: "🛒", color: "bg-red-500/10 border-red-500/20 text-red-400", url: "https://shop.rewe.de/" },
  { name: "Edeka", emoji: "🏪", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400", url: "https://www.edeka24.de/" },
  { name: "Picnic", emoji: "🚴", color: "bg-green-500/10 border-green-500/20 text-green-400", url: "https://picnic.app/de/" },
  { name: "Flaschenpost", emoji: "⚡", color: "bg-blue-500/10 border-blue-500/20 text-blue-400", url: "https://www.flaschenpost.de/" },
  { name: "Kaufland", emoji: "🏬", color: "bg-purple-500/10 border-purple-500/20 text-purple-400", url: "https://www.kaufland.de/service/online-shop.html" },
  { name: "Penny", emoji: "🪙", color: "bg-orange-500/10 border-orange-500/20 text-orange-400", url: "https://www.penny.de/" },
];

export default function ShoppingPage() {
  const { shoppingList, generateShoppingList, setShoppingList, clearShoppingList, toggleShoppingItem, weeklyPlan, getShoppingListFromPlan } = useApp();
  const [movingToLager, setMovingToLager] = useState(false);
  const [lagerDone, setLagerDone] = useState(false);
  // Pantry conflict modal state
  const [pantryConflicts, setPantryConflicts] = useState<{ item: ReturnType<typeof getShoppingListFromPlan>[0]; pantry: PantryItem }[]>([]);
  const [pendingItems, setPendingItems] = useState<ReturnType<typeof getShoppingListFromPlan>>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [skipConflicts, setSkipConflicts] = useState<Set<string>>(new Set());

  const checkedCount = shoppingList.filter((i) => i.checked).length;
  const totalCount = shoppingList.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  // Transfer checked items to pantry
  const handleMoveToLager = useCallback(async () => {
    setMovingToLager(true);
    const checked = shoppingList.filter(i => i.checked);
    for (const item of checked) {
      try {
        await fetch("/api/pantry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: item.name, quantity: 1, unit: "Stück", category: "Sonstiges" }),
        });
      } catch { /* ignore */ }
    }
    clearShoppingList();
    setMovingToLager(false);
    setLagerDone(true);
  }, [shoppingList, clearShoppingList]);

  // Generate with pantry check
  const handleGenerateWithCheck = useCallback(async () => {
    const proposed = getShoppingListFromPlan();
    if (proposed.length === 0) { generateShoppingList(); return; }
    try {
      const res = await fetch("/api/pantry");
      const data = await res.json();
      const pantry: PantryItem[] = data.items ?? [];
      const conflicts = proposed
        .map(item => ({ item, pantry: pantryMatch(item.name, pantry) }))
        .filter((x): x is { item: typeof x.item; pantry: PantryItem } => x.pantry !== null);
      if (conflicts.length > 0) {
        setPantryConflicts(conflicts);
        setPendingItems(proposed);
        setShowConflictModal(true);
      } else {
        setShoppingList(proposed);
      }
    } catch {
      generateShoppingList();
    }
  }, [getShoppingListFromPlan, generateShoppingList, setShoppingList]);

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
      await navigator.share({ title: "forkly Einkaufsliste", text });
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

      {/* Einkaufen fertig → ins Lager */}
      {checkedCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={handleMoveToLager}
            disabled={movingToLager}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.25)] disabled:opacity-50"
          >
            {movingToLager
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <PackagePlus className="w-5 h-5" />}
            {movingToLager
              ? "Wird ins Lager übernommen..."
              : `Einkaufen fertig — ${checkedCount} Artikel ins Lager`}
          </button>
          {lagerDone && (
            <p className="text-center text-green-400 text-xs font-semibold mt-2">
              ✓ Artikel wurden ins Lager übernommen
            </p>
          )}
        </motion.div>
      )}

      {/* Generate / Refresh */}
      <button
        onClick={handleGenerateWithCheck}
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Jetzt bestellen</h3>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-[#1e293b] text-[#94a3b8] hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Liste kopieren
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SUPERMARKETS.map((sm) => (
              <a
                key={sm.name}
                href={sm.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-2xl border ${sm.color} text-center transition-all hover:scale-105 active:scale-95`}
              >
                <div className="text-xl mb-1">{sm.emoji}</div>
                <div className="text-xs font-bold">{sm.name}</div>
              </a>
            ))}
          </div>
          <p className="text-[#475569] text-xs text-center mt-2">
            Liste kopieren → im Shop einfügen
          </p>
        </motion.div>
      )}

      {/* Pantry conflict modal */}
      <AnimatePresence>
        {showConflictModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-end p-4"
            onClick={() => setShowConflictModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-[#0f172a] rounded-3xl p-5 w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h2 className="font-bold text-lg">Bereits im Lager</h2>
              </div>
              <p className="text-[#64748b] text-sm mb-4">
                Diese Zutaten hast du noch im Lager. Trotzdem auf die Liste?
              </p>
              <div className="space-y-2 mb-5">
                {pantryConflicts.map(({ item, pantry }) => {
                  const skip = skipConflicts.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        skip ? "bg-[#0a0a0f] border-white/5 opacity-50" : "bg-green-500/5 border-green-500/20"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-green-400">
                          Im Lager: {pantry.quantity} {pantry.unit}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSkipConflicts((prev) => {
                            const next = new Set(prev);
                            skip ? next.delete(item.id) : next.add(item.id);
                            return next;
                          })
                        }
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          skip
                            ? "bg-white/10 text-[#94a3b8]"
                            : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        }`}
                      >
                        {skip ? "Doch kaufen" : "Weglassen"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setSkipConflicts(new Set(pantryConflicts.map((c) => c.item.id)))
                  }
                  className="flex-1 py-3 rounded-2xl bg-[#1e293b] text-[#94a3b8] text-sm font-semibold"
                >
                  Alle weglassen
                </button>
                <button
                  onClick={() => {
                    const finalItems = pendingItems.filter((i) => !skipConflicts.has(i.id));
                    setShoppingList(finalItems);
                    setShowConflictModal(false);
                    setSkipConflicts(new Set());
                  }}
                  className="flex-1 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold"
                >
                  Liste erstellen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
