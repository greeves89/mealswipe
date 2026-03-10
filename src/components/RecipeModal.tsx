"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Recipe } from "@/lib/recipes";
import {
  X,
  Clock,
  Flame,
  Users,
  Star,
  ChefHat,
  Check,
  Calendar,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useApp, getWeekDays } from "@/lib/store";
import { useState, useEffect, useRef } from "react";

// ── Cooking Mode ──────────────────────────────────────────────────────────────

function CookingMode({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const steps = recipe.steps ?? [];
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Acquire WakeLock to keep screen on while cooking
  useEffect(() => {
    async function acquireWakeLock() {
      if (!("wakeLock" in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch { /* not supported or denied */ }
    }
    acquireWakeLock();

    // Re-acquire on visibility change (browser may release it)
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setDone(true);
    }
  };
  const goPrev = () => setCurrentStep(s => Math.max(0, s - 1));

  const progress = ((currentStep + (done ? 1 : 0)) / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-[#060d1a] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-sm font-semibold text-[#94a3b8] truncate">{recipe.name}</span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ml-3 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3 shrink-0">
        <div className="w-full bg-[#1e293b] rounded-full h-1.5">
          <motion.div
            className="bg-teal-400 h-1.5 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-[#475569]">
            {done ? "Fertig!" : `Schritt ${currentStep + 1} von ${steps.length}`}
          </span>
          <span className="text-[10px] text-[#475569]">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <CheckCircle className="w-20 h-20 text-teal-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black mb-3">Guten Appetit!</h2>
              <p className="text-[#64748b] text-lg">{recipe.name} ist fertig.</p>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
              className="w-full text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xl font-black mx-auto mb-6">
                {currentStep + 1}
              </div>
              <p className="text-white text-xl leading-relaxed font-medium">
                {steps[currentStep]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-8 pt-4 shrink-0">
        {done ? (
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Schließen
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-white/5 flex items-center justify-center disabled:opacity-30 transition-all hover:border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="flex-1 h-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-all flex items-center justify-center gap-2 text-lg"
            >
              {currentStep === steps.length - 1 ? (
                <><Check className="w-5 h-5" /> Fertig</>
              ) : (
                <>Weiter <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        )}

        {/* Step dots */}
        {!done && steps.length <= 12 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full transition-all ${
                  i === currentStep
                    ? "w-4 h-2 bg-teal-400"
                    : i < currentStep
                    ? "w-2 h-2 bg-teal-500/40"
                    : "w-2 h-2 bg-[#1e293b]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Recipe Modal ──────────────────────────────────────────────────────────────

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const { addToWeeklyPlan } = useApp();
  const [showCooking, setShowCooking] = useState(false);

  const handleAddToWeek = () => {
    if (!recipe) return;
    const days = getWeekDays();
    const nextDay = days[0];
    addToWeeklyPlan(nextDay, recipe);
    onClose();
  };

  // Reset cooking mode when recipe changes
  useEffect(() => { setShowCooking(false); }, [recipe?.id]);

  return (
    <>
      <AnimatePresence>
        {recipe && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-[#0f172a] border-t border-white/10"
            >
              {/* Photo */}
              <div className="relative h-56 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                {recipe.source && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-xs font-medium">
                    <ChefHat className="w-3 h-3" />
                    {recipe.source}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Name & Cuisine */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-2xl font-black text-white leading-tight">{recipe.name}</h2>
                  <span className="shrink-0 bg-teal-500/20 text-teal-400 text-xs font-semibold px-3 py-1 rounded-full border border-teal-500/20">
                    {recipe.cuisine}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(recipe.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-[#475569]"
                      }`}
                    />
                  ))}
                  <span className="text-[#94a3b8] text-sm ml-1">{recipe.rating.toFixed(1)}</span>
                </div>

                <p className="text-[#94a3b8] text-sm leading-relaxed mb-6">{recipe.description}</p>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-4 py-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-semibold">{recipe.time} Min</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-4 py-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold">{recipe.calories} kcal</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1e293b] rounded-xl px-4 py-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold">{recipe.servings} Portionen</span>
                  </div>
                </div>

                {/* Macros */}
                {(recipe.protein || recipe.carbs || recipe.fat) ? (
                  <div className="bg-[#1e293b] rounded-2xl p-4 mb-6">
                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Nährwerte pro Portion</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-blue-400 font-black text-lg">{recipe.protein}g</p>
                        <p className="text-[#64748b] text-xs">Protein</p>
                        <div className="w-full bg-[#0f172a] rounded-full h-1.5 mt-1.5">
                          <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${Math.min((recipe.protein! / ((recipe.protein! + recipe.carbs! + recipe.fat!) || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-orange-400 font-black text-lg">{recipe.carbs}g</p>
                        <p className="text-[#64748b] text-xs">Kohlenhydrate</p>
                        <div className="w-full bg-[#0f172a] rounded-full h-1.5 mt-1.5">
                          <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${Math.min((recipe.carbs! / ((recipe.protein! + recipe.carbs! + recipe.fat!) || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-yellow-400 font-black text-lg">{recipe.fat}g</p>
                        <p className="text-[#64748b] text-xs">Fett</p>
                        <div className="w-full bg-[#0f172a] rounded-full h-1.5 mt-1.5">
                          <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min((recipe.fat! / ((recipe.protein! + recipe.carbs! + recipe.fat!) || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Ingredients */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-4">Zutaten</h3>
                  <div className="space-y-2">
                    {recipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <span className="text-[#f8fafc] text-sm">{ing.name}</span>
                        <span className="text-[#94a3b8] text-sm font-medium">{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Zubereitung</h3>
                    {recipe.steps.length > 0 && (
                      <button
                        onClick={() => setShowCooking(true)}
                        className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Kochmodus
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {recipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-[#94a3b8] text-sm leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  {recipe.steps.length > 0 && (
                    <button
                      onClick={() => setShowCooking(true)}
                      className="w-full flex items-center justify-center gap-3 bg-[#0f2e2a] hover:bg-[#0f3a35] border border-teal-500/20 hover:border-teal-500/40 text-teal-400 py-3.5 rounded-2xl font-bold transition-all"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Schritt-für-Schritt kochen
                    </button>
                  )}
                  <button
                    onClick={handleAddToWeek}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(20,184,166,0.3)]"
                  >
                    <Calendar className="w-5 h-5" />
                    Diese Woche kochen
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hands-free Cooking Mode overlay */}
      <AnimatePresence>
        {showCooking && recipe && (
          <CookingMode recipe={recipe} onClose={() => setShowCooking(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
