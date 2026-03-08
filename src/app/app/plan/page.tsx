"use client";
import { useState } from "react";
import { useApp, getWeekDays } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";
import RecipeModal from "@/components/RecipeModal";
import { Recipe } from "@/lib/recipes";
import {
  Plus,
  X,
  ShoppingCart,
  Clock,
  Flame,
  ChefHat,
} from "lucide-react";

const DAY_LABELS: Record<string, string> = {};
const DE_DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function buildDayLabels(days: string[]) {
  days.forEach((day, i) => {
    DAY_LABELS[day] = DE_DAYS[i];
  });
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

function formatDayDate(dayKey: string): string {
  const d = new Date(dayKey);
  return `${d.getDate()}. ${SHORT_MONTHS[d.getMonth()]}`;
}

export default function PlanPage() {
  const { weeklyPlan, removeFromPlan, generateShoppingList } = useApp();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const days = getWeekDays();
  const today = new Date().toISOString().split("T")[0];
  buildDayLabels(days);

  const plannedCount = Object.keys(weeklyPlan).length;

  const handleGenerateShopping = () => {
    generateShoppingList();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black">Wochenplan</h1>
        <p className="text-[#64748b] text-sm mt-1">
          {plannedCount} von 7 Tagen geplant
        </p>
      </div>

      {/* Progress */}
      <div className="w-full bg-[#1e293b] rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full"
          animate={{ width: `${(plannedCount / 7) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Days */}
      <div className="space-y-3">
        {days.map((day, i) => {
          const recipe = weeklyPlan[day];
          const isToday = day === today;
          const label = DE_DAYS[i];
          const dateStr = formatDayDate(day);

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border transition-all ${
                isToday
                  ? "border-teal-500/40 bg-teal-500/5"
                  : "border-white/5 bg-[#0f172a]"
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${isToday ? "text-teal-400" : "text-[#f8fafc]"}`}>
                    {label}
                  </span>
                  {isToday && (
                    <span className="text-[10px] bg-teal-500/20 text-teal-400 rounded-full px-2 py-0.5 font-semibold">
                      Heute
                    </span>
                  )}
                </div>
                <span className="text-[#64748b] text-xs">{dateStr}</span>
              </div>

              {/* Meal slot */}
              {recipe ? (
                <div
                  className="flex items-center gap-3 px-4 pb-4 cursor-pointer"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{recipe.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[#64748b] text-xs">
                        <Clock className="w-3 h-3" /> {recipe.time} Min
                      </span>
                      <span className="flex items-center gap-1 text-[#64748b] text-xs">
                        <Flame className="w-3 h-3" /> {recipe.calories} kcal
                      </span>
                    </div>
                    <p className="text-teal-400 text-xs mt-1">{recipe.cuisine}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlan(day);
                    }}
                    className="w-7 h-7 rounded-full bg-[#1e293b] hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-3 h-3 text-[#64748b] hover:text-red-400" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/app/swipe"
                  className="flex items-center gap-3 px-4 pb-4 text-[#475569] hover:text-teal-400 transition-colors"
                >
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#1e293b] flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Mahlzeit hinzufügen</span>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Generate shopping list */}
      {plannedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-2"
        >
          <Link
            href="/app/shopping"
            onClick={handleGenerateShopping}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(249,115,22,0.3)]"
          >
            <ShoppingCart className="w-5 h-5" />
            Einkaufsliste generieren
          </Link>
          <p className="text-center text-[#64748b] text-xs mt-2">
            Zutaten für {plannedCount} Mahlzeit{plannedCount !== 1 ? "en" : ""} werden zusammengestellt
          </p>
        </motion.div>
      )}

      {/* Empty state */}
      {plannedCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 rounded-full bg-[#0f172a] flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-10 h-10 text-[#475569]" />
          </div>
          <h3 className="font-bold text-lg mb-2">Noch keine Mahlzeiten</h3>
          <p className="text-[#64748b] text-sm mb-6">Swipe Rezepte um sie automatisch einzuplanen</p>
          <Link
            href="/app/swipe"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all"
          >
            Rezepte entdecken
          </Link>
        </motion.div>
      )}

      {/* Recipe Modal */}
      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
}
