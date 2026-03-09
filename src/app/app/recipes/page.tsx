"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Clock, Flame, ChefHat, X, Star, BookOpen, Filter,
  ChevronLeft, ChevronRight, CheckCircle2, Circle, PlayCircle, ShoppingCart,
  AlertTriangle, PackageCheck, Trash2,
} from "lucide-react";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

async function fetchPantry(): Promise<PantryItem[]> {
  try {
    const res = await fetch("/api/pantry");
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch { return []; }
}

function pantryMatch(ingredientName: string, pantryItems: PantryItem[]): PantryItem | null {
  const needle = ingredientName.toLowerCase().trim();
  return pantryItems.find(p => {
    const hay = p.name.toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  }) ?? null;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  time: number;
  servings: number;
  calories: number;
  difficulty: "Einfach" | "Mittel" | "Anspruchsvoll";
  tags: string[];
  ingredients: { name: string; amount: string }[];
  steps: string[];
  rating: number;
}

const CUISINES = ["Alle", "Italienisch", "Asiatisch", "Mexikanisch", "Deutsch", "International"];
const DIFFICULTIES = ["Alle", "Einfach", "Mittel", "Anspruchsvoll"];
const TIME_FILTERS = [
  { label: "Alle", max: Infinity },
  { label: "≤ 30 Min", max: 30 },
  { label: "≤ 60 Min", max: 60 },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Einfach: "text-green-400 bg-green-400/10",
  Mittel: "text-orange-400 bg-orange-400/10",
  Anspruchsvoll: "text-red-400 bg-red-400/10",
};

function RecipeCard({ recipe, onSelect, onDelete }: { recipe: Recipe; onSelect: (r: Recipe) => void; onDelete?: (id: string) => void }) {
  const emoji = recipe.image
    ? null
    : ["🍝", "🍜", "🌮", "🥗", "🍣", "🥘", "🍕", "🍛", "🥩", "🍲"][
        Math.abs(recipe.name.charCodeAt(0) + recipe.name.charCodeAt(2)) % 10
      ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full text-left rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden hover:border-teal-500/30 transition-all"
    >
      <button onClick={() => onSelect(recipe)} className="w-full text-left active:scale-[0.98] transition-all">
      <div className="relative h-36 bg-[#1e293b] flex items-center justify-center overflow-hidden">
        {recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[recipe.difficulty]}`}>
          {recipe.difficulty}
        </span>
        {recipe.rating >= 4.7 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400">
            ⭐ Top
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-1">{recipe.name}</h3>
        <p className="text-[#64748b] text-xs line-clamp-2 mb-3">{recipe.description}</p>
        <div className="flex items-center gap-3 text-xs text-[#64748b]">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time} Min</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.calories} kcal</span>
          <span className="flex items-center gap-1 ml-auto"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {recipe.rating.toFixed(1)}</span>
        </div>
      </div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
          className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

function CookingMode({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"ingredients" | "steps">("ingredients");
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [deducted, setDeducted] = useState(false);
  const [missingWarning, setMissingWarning] = useState<string[]>([]);

  useEffect(() => { fetchPantry().then(setPantryItems); }, []);

  const handleFinish = async () => {
    if (deducted) { onClose(); return; }
    const missing: string[] = [];
    for (const ing of recipe.ingredients) {
      const match = pantryMatch(ing.name, pantryItems);
      if (match) {
        if (match.quantity <= 1) {
          await fetch(`/api/pantry?id=${match.id}`, { method: "DELETE" });
        } else {
          await fetch("/api/pantry", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: match.id, quantity: match.quantity - 1 }),
          });
        }
      } else {
        missing.push(ing.name);
      }
    }
    if (missing.length > 0) {
      setMissingWarning(missing);
      return;
    }
    setDeducted(true);
    onClose();
  };

  const handleConfirmFinish = () => {
    setDeducted(true);
    setMissingWarning([]);
    onClose();
  };

  const totalSteps = recipe.steps.length;
  const progress = totalSteps > 0 ? ((step + 1) / totalSteps) * 100 : 100;

  const toggleIngredient = (i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-[#0a0a0f] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-teal-400 font-semibold uppercase tracking-wide">Kochmodus</p>
          <h2 className="font-bold text-sm truncate">{recipe.name}</h2>
        </div>
        {/* View toggle */}
        <div className="flex bg-[#1e293b] rounded-xl p-1 gap-1">
          <button
            onClick={() => setView("ingredients")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${view === "ingredients" ? "bg-teal-500 text-white" : "text-[#64748b]"}`}
          >
            Zutaten
          </button>
          <button
            onClick={() => setView("steps")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${view === "steps" ? "bg-teal-500 text-white" : "text-[#64748b]"}`}
          >
            Schritte
          </button>
        </div>
      </div>

      {view === "ingredients" ? (
        /* Ingredient checklist */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[#94a3b8] text-sm font-semibold">{recipe.ingredients.length} Zutaten</p>
            <span className="text-xs text-[#475569]">
              {checkedIngredients.size}/{recipe.ingredients.length} bereit
            </span>
          </div>
          <div className="space-y-2">
            {recipe.ingredients.map((ing, i) => {
              const inPantry = pantryMatch(ing.name, pantryItems);
              return (
                <button
                  key={i}
                  onClick={() => toggleIngredient(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    checkedIngredients.has(i)
                      ? "bg-teal-500/10 border-teal-500/30"
                      : inPantry
                        ? "bg-[#0f172a] border-green-500/20"
                        : "bg-[#0f172a] border-orange-500/20"
                  }`}
                >
                  {checkedIngredients.has(i)
                    ? <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                    : <Circle className="w-5 h-5 text-[#334155] shrink-0" />
                  }
                  <span className={`flex-1 text-sm font-medium ${checkedIngredients.has(i) ? "text-teal-300 line-through" : "text-white"}`}>
                    {ing.name}
                  </span>
                  {ing.amount && (
                    <span className="text-xs text-[#64748b] shrink-0 mr-1">{ing.amount}</span>
                  )}
                  {pantryItems.length > 0 && (
                    inPantry
                      ? <PackageCheck className="w-4 h-4 text-green-400 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          {pantryItems.length > 0 && (
            <div className="mt-3 flex gap-3 text-xs text-[#64748b]">
              <span className="flex items-center gap-1"><PackageCheck className="w-3.5 h-3.5 text-green-400" /> Im Lager</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Fehlt im Lager</span>
            </div>
          )}
          {checkedIngredients.size === recipe.ingredients.length && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { setView("steps"); setStep(0); }}
              className="mt-6 w-full bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" /> Kochen starten!
            </motion.button>
          )}
        </div>
      ) : totalSteps === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <span className="text-4xl">📋</span>
            <p className="text-[#64748b] mt-3">Keine Schritte für dieses Rezept verfügbar.</p>
          </div>
        </div>
      ) : (
        /* Step-by-step cooking */
        <div className="flex-1 flex flex-col">
          {/* Progress bar */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex justify-between text-xs text-[#64748b] mb-2">
              <span>Schritt {step + 1} von {totalSteps}</span>
              <span>{Math.round(progress)}% fertig</span>
            </div>
            <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 flex flex-col justify-center px-4 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                {/* Step number circle */}
                <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/50 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-black text-teal-400">{step + 1}</span>
                </div>
                <p className="text-[#e2e8f0] text-lg leading-relaxed font-medium">
                  {recipe.steps[step]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-4 pb-8 flex gap-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#0f172a] border border-white/5 disabled:opacity-30 text-[#94a3b8] font-semibold transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> Zurück
            </button>
            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-all"
              >
                Weiter <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <>
              <motion.button
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={handleFinish}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold"
              >
                ✓ Fertig & Lager aktualisieren
              </motion.button>

              {/* Missing items warning overlay */}
              <AnimatePresence>
                {missingWarning.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] bg-black/80 flex items-end p-4"
                  >
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      className="bg-[#0f172a] rounded-3xl p-5 w-full"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <h2 className="font-bold text-lg">Nicht im Lager</h2>
                      </div>
                      <p className="text-[#64748b] text-sm mb-3">
                        Diese Zutaten fehlen in deinem Lager:
                      </p>
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-3 mb-5 space-y-1">
                        {missingWarning.map((name) => (
                          <p key={name} className="text-sm text-orange-300 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {name}
                          </p>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setMissingWarning([])}
                          className="flex-1 py-3 rounded-2xl bg-[#1e293b] text-[#94a3b8] text-sm font-semibold"
                        >
                          Zurück
                        </button>
                        <button
                          onClick={handleConfirmFinish}
                          className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-white text-sm font-bold"
                        >
                          Trotzdem fertig
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RecipeDetail({ recipe, onClose, onCook }: { recipe: Recipe; onClose: () => void; onCook: () => void }) {
  const emoji = recipe.image
    ? null
    : ["🍝", "🍜", "🌮", "🥗", "🍣", "🥘", "🍕", "🍛", "🥩", "🍲"][
        Math.abs(recipe.name.charCodeAt(0) + recipe.name.charCodeAt(2)) % 10
      ];

  const addToShoppingList = async () => {
    try {
      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: recipe.ingredients.map(i => ({ name: `${i.name}${i.amount ? ` (${i.amount})` : ""}` })),
        }),
      });
    } catch { /* silent */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-y-auto"
    >
      {/* Hero image */}
      <div className="relative h-56 bg-[#1e293b] flex items-center justify-center overflow-hidden">
        {recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5 pb-8">
        {/* Title + rating */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-2xl font-black leading-tight">{recipe.name}</h1>
            <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold shrink-0">
              <Star className="w-4 h-4 fill-yellow-400" /> {recipe.rating.toFixed(1)}
            </span>
          </div>
          <p className="text-[#64748b] text-sm">{recipe.cuisine} · {recipe.description}</p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-xl px-3 py-1.5 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-teal-400" /> {recipe.time} Min
          </div>
          <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-xl px-3 py-1.5 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-orange-400" /> {recipe.calories} kcal
          </div>
          <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-xl px-3 py-1.5 text-xs font-semibold">
            <ChefHat className="w-3.5 h-3.5 text-[#94a3b8]" /> {recipe.servings} Port.
          </div>
          <span className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${DIFFICULTY_COLOR[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map(tag => (
              <span key={tag} className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCook}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white py-3.5 rounded-2xl font-bold text-sm transition-all"
          >
            <PlayCircle className="w-5 h-5" /> Kochen starten
          </button>
          <button
            onClick={addToShoppingList}
            title="Zutaten zur Einkaufsliste hinzufügen"
            className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-[#263548] border border-white/5 rounded-2xl transition-all"
          >
            <ShoppingCart className="w-4.5 h-4.5 text-[#94a3b8]" />
          </button>
        </div>

        {/* Ingredients */}
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#94a3b8] mb-3">Zutaten</h2>
          <div className="rounded-2xl bg-[#0f172a] border border-white/5 divide-y divide-white/5">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                <span>{ing.name}</span>
                <span className="text-[#64748b]">{ing.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#94a3b8] mb-3">Zubereitung</h2>
            <div className="space-y-3">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function RecipesPage() {
  const [tab, setTab] = useState<"alle" | "gescannt">("alle");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [customLoading, setCustomLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("Alle");
  const [difficulty, setDifficulty] = useState("Alle");
  const [timeFilter, setTimeFilter] = useState(Infinity);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [cooking, setCooking] = useState<Recipe | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchRecipes = useCallback(async (q: string, c: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ number: "400" });
      if (q) params.set("query", q);
      if (c && c !== "Alle") params.set("cuisine", c);
      const res = await fetch(`/api/recipes?${params}`);
      const data = await res.json();
      setRecipes(data.recipes ?? []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomRecipes = useCallback(async () => {
    setCustomLoading(true);
    try {
      const res = await fetch("/api/custom-recipes");
      if (res.ok) {
        const data = await res.json();
        setCustomRecipes(data.recipes ?? []);
      }
    } catch { /* ignore */ }
    finally { setCustomLoading(false); }
  }, []);

  const handleDeleteCustom = useCallback(async (id: string) => {
    try {
      await fetch("/api/custom-recipes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setCustomRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCustomRecipes();
  }, [fetchCustomRecipes]);

  useEffect(() => {
    const t = setTimeout(() => fetchRecipes(search, cuisine), 300);
    return () => clearTimeout(t);
  }, [search, cuisine, fetchRecipes]);

  const activeList = tab === "gescannt" ? customRecipes : recipes;
  const filtered = activeList.filter(r => {
    if (tab === "alle") {
      if (difficulty !== "Alle" && r.difficulty !== difficulty) return false;
      if (r.time > timeFilter) return false;
    }
    if (search && tab === "gescannt") {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeFilterCount = [
    cuisine !== "Alle",
    difficulty !== "Alle",
    timeFilter !== Infinity,
  ].filter(Boolean).length;

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-teal-400" /> Rezepte
            </h1>
            <p className="text-[#64748b] text-sm mt-0.5">
              {tab === "gescannt" ? `${customRecipes.length} gescannte Rezepte` : `${recipes.length} Rezepte verfügbar`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-2xl">
          <button
            onClick={() => setTab("alle")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "alle" ? "bg-[#1e293b] text-white" : "text-[#64748b]"}`}
          >
            Alle Rezepte
          </button>
          <button
            onClick={() => setTab("gescannt")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all relative ${tab === "gescannt" ? "bg-[#1e293b] text-white" : "text-[#64748b]"}`}
          >
            Gescannt
            {customRecipes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {customRecipes.length}
              </span>
            )}
          </button>
        </div>

        {/* Search + Filter row */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rezept suchen..."
              className="w-full bg-[#0f172a] border border-white/5 rounded-2xl pl-9 pr-3 py-3 text-sm placeholder-[#475569] focus:outline-none focus:border-teal-500/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`relative flex items-center justify-center w-12 rounded-2xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-teal-500/10 border-teal-500/40 text-teal-400"
                : "bg-[#0f172a] border-white/5 text-[#64748b]"
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pb-1">
                <div>
                  <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-2">Küche</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CUISINES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCuisine(c)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          cuisine === c ? "bg-teal-500 text-white" : "bg-[#0f172a] border border-white/5 text-[#64748b] hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-2">Schwierigkeit</p>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          difficulty === d ? "bg-teal-500 text-white" : "bg-[#0f172a] border border-white/5 text-[#64748b]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-2">Zeit</p>
                  <div className="flex gap-2">
                    {TIME_FILTERS.map(tf => (
                      <button
                        key={tf.label}
                        onClick={() => setTimeFilter(tf.max)}
                        className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          timeFilter === tf.max ? "bg-teal-500 text-white" : "bg-[#0f172a] border border-white/5 text-[#64748b]"
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setCuisine("Alle"); setDifficulty("Alle"); setTimeFilter(Infinity); }}
                    className="text-xs text-[#64748b] hover:text-white transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipe grid */}
        {(tab === "alle" ? loading : customLoading) ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden animate-pulse">
                <div className="h-36 bg-[#1e293b]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#1e293b] rounded w-3/4" />
                  <div className="h-2 bg-[#1e293b] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">{tab === "gescannt" ? "📷" : "🔍"}</span>
            <p className="text-[#64748b] mt-3 font-medium">
              {tab === "gescannt" ? "Noch keine gescannten Rezepte" : "Keine Rezepte gefunden"}
            </p>
            {tab === "gescannt" ? (
              <p className="text-[#475569] text-sm mt-1">Scanne Rezeptkarten unter &ldquo;Scan&rdquo;</p>
            ) : (
              <button
                onClick={() => { setSearch(""); setCuisine("Alle"); setDifficulty("Alle"); setTimeFilter(Infinity); }}
                className="mt-3 text-teal-400 text-sm hover:underline"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map(r => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onSelect={setSelected}
                  onDelete={tab === "gescannt" ? handleDeleteCustom : undefined}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Detail overlay */}
      <AnimatePresence>
        {selected && !cooking && (
          <RecipeDetail
            recipe={selected}
            onClose={() => setSelected(null)}
            onCook={() => setCooking(selected)}
          />
        )}
      </AnimatePresence>

      {/* Cooking mode */}
      <AnimatePresence>
        {cooking && (
          <CookingMode
            recipe={cooking}
            onClose={() => { setCooking(null); setSelected(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
