"use client";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { useApp, getWeekDays } from "@/lib/store";
import { Recipe } from "@/lib/recipes";
import { useRecipes } from "@/hooks/useRecipes";
import { Heart, X, Clock, Flame, Star, ChefHat, RotateCcw, Zap, Loader2, SlidersHorizontal, Crown, Users, CalendarPlus } from "lucide-react";
import Link from "next/link";

// ── Plan limits ───────────────────────────────────────────────────────────────
const FREE_SWIPE_LIMIT = 10;

// ── Diet filter config ────────────────────────────────────────────────────────
const DIET_FILTERS = [
  { id: "vegan", label: "🌱 Vegan", tag: "Vegan" },
  { id: "vegetarisch", label: "🥦 Vegetarisch", tag: "Vegetarisch" },
  { id: "glutenfrei", label: "🌾 Glutenfrei", tag: "Glutenfrei" },
  { id: "keto", label: "🥑 Keto", tag: "Keto" },
  { id: "laktosefrei", label: "🥛 Laktosefrei", tag: "Laktosefrei" },
];

// Dietary helpers — rely on classifyRecipe() tags (set in useRecipes)
const hasTag = (recipe: Recipe, tag: string) =>
  recipe.tags.some(t => t.toLowerCase() === tag.toLowerCase());

const CALORIE_FILTERS = [
  { id: "all", label: "Alle kcal", max: Infinity },
  { id: "low", label: "< 300 kcal", max: 300 },
  { id: "mid", label: "300–500 kcal", min: 300, max: 500 },
  { id: "high", label: "500–800 kcal", min: 500, max: 800 },
  { id: "xhigh", label: "> 800 kcal", min: 800, max: Infinity },
];

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = -120;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
        />
      ))}
      <span className="text-white/50 text-xs ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const DIFF_COLORS: Record<string, string> = {
  Einfach: "bg-green-500/20 text-green-400 border-green-500/30",
  Mittel: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Anspruchsvoll: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ── TopCard with flip animation ───────────────────────────────────────────────
function TopCard({
  recipe,
  onSwipe,
  onSwipeUp,
}: {
  recipe: Recipe;
  onSwipe: (dir: "left" | "right") => void;
  onSwipeUp: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);
  const planOpacity = useTransform(y, [-40, -140], [0, 1]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number; y: number } }) => {
      if (info.offset.y < SWIPE_UP_THRESHOLD && Math.abs(info.offset.x) < 60) {
        onSwipeUp();
      } else if (info.offset.x > SWIPE_THRESHOLD) {
        onSwipe("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        onSwipe("left");
      } else {
        x.set(0);
        y.set(0);
      }
    },
    [onSwipe, onSwipeUp, x, y]
  );

  // Gradient fallback colors per cuisine
  const bgGradients: Record<string, string> = {
    Deutsch: "from-amber-900 to-orange-800",
    Italienisch: "from-red-900 to-rose-800",
    Asiatisch: "from-teal-900 to-emerald-800",
    Mexikanisch: "from-orange-900 to-yellow-800",
    Mediterran: "from-blue-900 to-cyan-800",
    Amerikanisch: "from-red-900 to-orange-800",
    Japanisch: "from-pink-900 to-rose-800",
    Indisch: "from-orange-900 to-amber-800",
  };
  const fallback = bgGradients[recipe.cuisine] || "from-slate-800 to-slate-700";

  return (
    <motion.div
      className="absolute inset-0 select-none"
      style={{ x, y, rotate, zIndex: 20, perspective: 1200 }}
      drag={true}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onTap={() => {
        // Only flip if not in the middle of a swipe
        if (Math.abs(x.get()) < 5 && Math.abs(y.get()) < 5) setIsFlipped(f => !f);
      }}
    >
      {/* 3D flip container */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        {/* FRONT */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing" style={{ backfaceVisibility: "hidden" }}>
          <div className={`absolute inset-0 bg-gradient-to-br ${fallback}`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.image}
            alt={recipe.name}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-400"
            style={{ opacity: imgLoaded ? 1 : 0 }}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; setImgLoaded(true); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* LECKER overlay */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: likeOpacity }}>
            <div className="absolute top-10 right-6 border-4 border-green-400 rounded-2xl px-4 py-2 rotate-[-12deg] bg-black/20">
              <span className="text-green-400 text-2xl font-black tracking-widest">LECKER ❤️</span>
            </div>
            <div className="absolute inset-0 bg-green-500/10" />
          </motion.div>

          {/* NOPE overlay */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: nopeOpacity }}>
            <div className="absolute top-10 left-6 border-4 border-red-400 rounded-2xl px-4 py-2 rotate-[12deg] bg-black/20">
              <span className="text-red-400 text-2xl font-black tracking-widest">NOPE ✗</span>
            </div>
            <div className="absolute inset-0 bg-red-500/10" />
          </motion.div>

          {/* ZUM PLAN overlay (swipe up) */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: planOpacity }}>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 border-4 border-teal-400 rounded-2xl px-4 py-2 bg-black/20 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-teal-400" />
              <span className="text-teal-400 text-2xl font-black tracking-widest">ZUM PLAN</span>
            </div>
            <div className="absolute inset-0 bg-teal-500/10" />
          </motion.div>

          {/* Flip hint */}
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 pointer-events-none">
            <span className="text-white/60 text-[10px] font-medium">Tippen für Details</span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
            {recipe.source && (
              <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                <ChefHat className="w-3 h-3 text-white/70" />
                <span className="text-white/70 text-xs font-medium">{recipe.source}</span>
              </div>
            )}
            <h2 className="text-2xl font-black text-white mb-1 leading-tight">{recipe.name}</h2>
            <p className="text-white/60 text-sm mb-3 line-clamp-2">{recipe.description}</p>
            <StarRating rating={recipe.rating} />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                <Clock className="w-3 h-3 text-teal-400" />
                <span className="text-white text-xs font-semibold">{recipe.time} Min</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-white text-xs font-semibold">{recipe.calories} kcal</span>
              </div>
              <span className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-white/60 text-xs">{recipe.cuisine}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${DIFF_COLORS[recipe.difficulty] ?? ""}`}>
                {recipe.difficulty}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {recipe.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] bg-teal-500/20 text-teal-300 rounded-full px-2 py-0.5">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* BACK (detail card) */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-[#0a1120] border border-teal-500/20 cursor-pointer"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Header image strip */}
          {recipe.image && (
            <div className="relative h-32 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a1120]" />
            </div>
          )}
          <div className="p-5 overflow-y-auto" style={{ maxHeight: recipe.image ? "calc(100% - 128px)" : "100%" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-xl font-black text-white leading-tight">{recipe.name}</h2>
              <span className="shrink-0 bg-teal-500/20 text-teal-400 text-xs font-semibold px-2 py-1 rounded-full border border-teal-500/20">
                {recipe.cuisine}
              </span>
            </div>
            <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">{recipe.description}</p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#0f172a] rounded-xl p-2 text-center">
                <Clock className="w-4 h-4 text-teal-400 mx-auto mb-0.5" />
                <p className="text-xs font-bold">{recipe.time}</p>
                <p className="text-[10px] text-[#64748b]">Min</p>
              </div>
              <div className="bg-[#0f172a] rounded-xl p-2 text-center">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-0.5" />
                <p className="text-xs font-bold">{recipe.calories}</p>
                <p className="text-[10px] text-[#64748b]">kcal</p>
              </div>
              <div className="bg-[#0f172a] rounded-xl p-2 text-center">
                <span className="text-sm">👥</span>
                <p className="text-xs font-bold">{recipe.servings}</p>
                <p className="text-[10px] text-[#64748b]">Port.</p>
              </div>
            </div>

            {/* Macros if available */}
            {(recipe.protein || recipe.carbs || recipe.fat) ? (
              <div className="flex gap-2 mb-4">
                {recipe.protein ? <div className="flex-1 bg-blue-500/10 rounded-xl p-2 text-center"><p className="text-blue-400 font-black text-sm">{recipe.protein}g</p><p className="text-[10px] text-[#64748b]">Protein</p></div> : null}
                {recipe.carbs ? <div className="flex-1 bg-orange-500/10 rounded-xl p-2 text-center"><p className="text-orange-400 font-black text-sm">{recipe.carbs}g</p><p className="text-[10px] text-[#64748b]">Carbs</p></div> : null}
                {recipe.fat ? <div className="flex-1 bg-yellow-500/10 rounded-xl p-2 text-center"><p className="text-yellow-400 font-black text-sm">{recipe.fat}g</p><p className="text-[10px] text-[#64748b]">Fett</p></div> : null}
              </div>
            ) : null}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full px-2 py-0.5">{tag}</span>
              ))}
            </div>

            {/* Ingredients */}
            {recipe.ingredients.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Hauptzutaten</p>
                <div className="space-y-1">
                  {recipe.ingredients.slice(0, 4).map((ing, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-[#94a3b8]">{ing.name}</span>
                      <span className="text-[#64748b]">{ing.amount}</span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 4 && (
                    <p className="text-[10px] text-[#475569]">+{recipe.ingredients.length - 4} weitere...</p>
                  )}
                </div>
              </div>
            )}

            {/* Cooking steps */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Zubereitung</p>
                <div className="space-y-2">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px]">{i + 1}</span>
                      <span className="text-[#94a3b8] leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-[#475569] text-xs mt-2 mb-1">← Tippen um zurückzudrehen · Swipe für ❤️/✗</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Upgrade Wall ──────────────────────────────────────────────────────────────
function UpgradeWall({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-teal-500/20 border border-orange-500/30 flex items-center justify-center mb-6">
        <Crown className="w-12 h-12 text-orange-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Limit erreicht</h2>
      <p className="text-[#94a3b8] mb-2">
        Im Free-Plan sind <span className="text-white font-bold">{FREE_SWIPE_LIMIT} Swipes</span> möglich.
      </p>
      <p className="text-[#64748b] text-sm mb-8">
        Upgrade auf Plus oder Family für unbegrenzte Rezeptentdeckung!
      </p>
      <Link
        href="/app/billing"
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(249,115,22,0.3)] mb-3"
      >
        <Crown className="w-5 h-5" />
        Jetzt upgraden
      </Link>
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-[#64748b] hover:text-[#94a3b8] text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Nochmal von vorne (Free)
      </button>
    </motion.div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayKey = () => `swipe_count_${new Date().toISOString().slice(0, 10)}`;

const DE_DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SwipePage() {
  const { addToLiked, addToDisliked, addToWeeklyPlan, weeklyPlan, household } = useApp();
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [planToast, setPlanToast] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeDiets, setActiveDiets] = useState<string[]>([]);
  const [activeCalorie, setActiveCalorie] = useState("all");
  const [userPlan, setUserPlan] = useState<"free" | "plus" | "family">("plus"); // default to plus until loaded
  const { recipes, loading: recipesLoading } = useRecipes();

  // Load persisted swipe count (daily reset) + plan + profile diets
  useEffect(() => {
    // Restore today's swipe count from localStorage
    try {
      const saved = localStorage.getItem(todayKey());
      if (saved) setIndex(parseInt(saved, 10) || 0);
    } catch { /* ignore */ }

    // Load user plan
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u?.plan) setUserPlan(u.plan); })
      .catch(() => {});

    // Load profile diets and apply as swipe filters
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const diets: string[] = data?.profile?.household_diets ?? [];
        const validDiets = diets.filter(d => d !== "Keine Einschränkungen");
        if (validDiets.length > 0) setActiveDiets(validDiets);
      })
      .catch(() => {
        // Fallback: use household from local store
        const localDiets = household.diets.filter(d => d !== "Keine Einschränkungen");
        if (localDiets.length > 0) setActiveDiets(localDiets);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDiet = (tag: string) => {
    setActiveDiets(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setIndex(0);
  };

  const calFilter = CALORIE_FILTERS.find(f => f.id === activeCalorie) ?? CALORIE_FILTERS[0];

  const filteredRecipes = recipes.filter(r => {
    // All diet filters: recipe must have the tag (classifyRecipe ensures they're accurate)
    for (const diet of activeDiets) {
      if (!hasTag(r, diet)) return false;
    }
    // Calorie filter
    if (calFilter.max !== Infinity && r.calories > calFilter.max) return false;
    if ("min" in calFilter && calFilter.min !== undefined && r.calories < calFilter.min) return false;
    return true;
  });

  const deck = filteredRecipes;
  const isAtPlanLimit = userPlan === "free" && index >= FREE_SWIPE_LIMIT;
  const done = index >= deck.length;
  const remaining = deck.slice(index);
  const progress = Math.min((index / Math.max(deck.length, 1)) * 100, 100);

  const advanceIndex = useCallback(() => {
    setIndex(i => {
      const next = i + 1;
      try { localStorage.setItem(todayKey(), String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      if (index >= deck.length) return;
      if (isAtPlanLimit) return;
      const recipe = deck[index];
      setExiting(dir);

      if (dir === "right") {
        addToLiked(recipe);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1400);
      } else {
        addToDisliked(recipe.id);
      }

      setTimeout(() => {
        advanceIndex();
        setExiting(null);
      }, 350);
    },
    [index, deck, addToLiked, addToDisliked, isAtPlanLimit, advanceIndex]
  );

  const handleSwipeUp = useCallback(() => {
    if (index >= deck.length) return;
    if (isAtPlanLimit) return;
    const recipe = deck[index];
    // Find next free day in the current week
    const days = getWeekDays();
    const freeDay = days.find(d => !weeklyPlan[d]);
    const targetDay = freeDay ?? days[0]; // overwrite first day if week is full
    const dayLabel = DE_DAYS[days.indexOf(targetDay)] ?? targetDay;
    addToWeeklyPlan(targetDay, recipe);
    setPlanToast(`📅 ${recipe.name} → ${dayLabel}`);
    setTimeout(() => setPlanToast(null), 2500);
    setExiting("right"); // exit card upward visually
    setTimeout(() => {
      advanceIndex();
      setExiting(null);
    }, 350);
  }, [index, deck, isAtPlanLimit, weeklyPlan, addToWeeklyPlan, advanceIndex]);

  if (recipesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-[#64748b] text-sm">Rezepte werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-black text-white">Rezepte entdecken</h1>
          <p className="text-[#64748b] text-sm">
            {done ? "Alle bewertet!" : isAtPlanLimit ? `${FREE_SWIPE_LIMIT}/${FREE_SWIPE_LIMIT} Free-Limit` : `${deck.length - index} Rezepte übrig`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userPlan === "free" && (
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-xl px-2.5 py-1.5">
              <Crown className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-orange-400 text-xs font-bold">{Math.min(index, FREE_SWIPE_LIMIT)}/{FREE_SWIPE_LIMIT}</span>
            </div>
          )}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
              (activeDiets.length > 0 || activeCalorie !== "all")
                ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
                : "bg-[#0f172a] border-white/5 text-[#64748b] hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeDiets.length > 0 || activeCalorie !== "all" ? `${activeDiets.length + (activeCalorie !== "all" ? 1 : 0)} Filter` : "Filter"}
          </button>
          <div className="flex items-center gap-2 bg-[#0f172a] rounded-xl px-3 py-2 border border-white/5">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-bold text-teal-400">{index}</span>
            <span className="text-[#64748b] text-sm">/ {deck.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Ernährung</p>
                <div className="flex flex-wrap gap-2">
                  {DIET_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => toggleDiet(f.tag)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                        activeDiets.includes(f.tag) ? "bg-teal-500 text-white" : "bg-[#1e293b] text-[#94a3b8] hover:bg-[#253347]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Kalorien</p>
                <div className="flex flex-wrap gap-2">
                  {CALORIE_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setActiveCalorie(f.id); setIndex(0); }}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                        activeCalorie === f.id ? "bg-orange-500 text-white" : "bg-[#1e293b] text-[#94a3b8] hover:bg-[#253347]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {(activeDiets.length > 0 || activeCalorie !== "all") && (
                <button
                  onClick={() => { setActiveDiets([]); setActiveCalorie("all"); setIndex(0); }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="w-full bg-[#1e293b] rounded-full h-1.5 mb-4">
        <motion.div
          className={`h-1.5 rounded-full ${userPlan === "free" ? "bg-gradient-to-r from-orange-500 to-orange-400" : "bg-gradient-to-r from-teal-600 to-teal-400"}`}
          animate={{ width: `${userPlan === "free" ? (Math.min(index, FREE_SWIPE_LIMIT) / FREE_SWIPE_LIMIT) * 100 : progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Card stack */}
      <div className="flex-1 relative min-h-0">
        {isAtPlanLimit ? (
          <UpgradeWall onReset={() => { setIndex(0); try { localStorage.removeItem(todayKey()); } catch { /* ignore */ } }} />
        ) : done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="w-24 h-24 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
              <ChefHat className="w-12 h-12 text-teal-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Alle bewertet!</h2>
            <p className="text-[#94a3b8] mb-8">
              Du hast alle {deck.length} Rezepte bewertet. Schau dir deinen Wochenplan an!
            </p>
            <button
              onClick={() => { setIndex(0); try { localStorage.removeItem(todayKey()); } catch { /* ignore */ } }}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Nochmal swipen
            </button>
          </motion.div>
        ) : (
          <>
            {/* Top card only — no back cards */}
            <AnimatePresence mode="wait">
              {!exiting && remaining[0] && (
                <motion.div
                  key={remaining[0].id}
                  className="absolute inset-0"
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <TopCard recipe={remaining[0]} onSwipe={handleSwipe} onSwipeUp={handleSwipeUp} />
                </motion.div>
              )}
              {exiting && remaining[0] && (
                <motion.div
                  key={remaining[0].id + "-exit"}
                  className="absolute inset-0"
                  initial={{ x: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: exiting === "right" ? 500 : -500,
                    rotate: exiting === "right" ? 25 : -25,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.35, ease: "easeIn" }}
                >
                  <TopCard recipe={remaining[0]} onSwipe={() => {}} onSwipeUp={() => {}} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Plan toast */}
        <AnimatePresence>
          {planToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-50"
            >
              <div className="bg-teal-500/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2">
                <CalendarPlus className="w-4 h-4" />
                {planToast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor: ["#14b8a6", "#f97316", "#f59e0b", "#10b981", "#a78bfa", "#f472b6"][i % 6],
                  left: `${5 + (i / 24) * 90}%`,
                  top: "-5%",
                }}
                animate={{ y: "120vh", x: (Math.random() - 0.5) * 180, rotate: Math.random() * 720, opacity: [1, 1, 0] }}
                transition={{ duration: 1.2 + Math.random() * 0.4, delay: Math.random() * 0.25, ease: "easeIn" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      {!done && !isAtPlanLimit && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe("left")}
            disabled={!!exiting}
            className="w-14 h-14 rounded-full bg-[#0f172a] border-2 border-red-500/40 hover:border-red-500 flex items-center justify-center shadow-lg transition-all active:shadow-red-500/20 disabled:opacity-50"
          >
            <X className="w-7 h-7 text-red-400" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSwipeUp}
            disabled={!!exiting}
            className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 gap-1"
          >
            <CalendarPlus className="w-7 h-7 text-white" />
            <span className="text-white text-[10px] font-bold leading-none">KOCHEN!</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe("right")}
            disabled={!!exiting}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </motion.button>
        </div>
      )}

      {!done && !isAtPlanLimit && index === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-[#475569] text-xs mt-3"
        >
          ← NOPE · ❤️ LECKER · ↑ ZUM PLAN · Tippen für Details
        </motion.p>
      )}

      {/* Upgrade banner for free users with remaining swipes */}
      {userPlan === "free" && !isAtPlanLimit && index > 0 && (
        <Link href="/app/billing" className="mt-2 flex items-center justify-center gap-1.5 text-xs text-orange-400/70 hover:text-orange-400 transition-colors">
          <Users className="w-3 h-3" />
          {FREE_SWIPE_LIMIT - index} Swipes verbleibend · Upgrade für unbegrenzt
        </Link>
      )}
    </div>
  );
}
