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
} from "lucide-react";
import { useApp, getWeekDays } from "@/lib/store";

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const { addToWeeklyPlan } = useApp();

  const handleAddToWeek = () => {
    if (!recipe) return;
    const days = getWeekDays();
    const nextDay = days[0];
    addToWeeklyPlan(nextDay, recipe);
    onClose();
  };

  return (
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
                <h3 className="font-bold text-lg mb-4">Zubereitung</h3>
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

              {/* CTA */}
              <button
                onClick={handleAddToWeek}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(20,184,166,0.3)]"
              >
                <Calendar className="w-5 h-5" />
                Diese Woche kochen
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
