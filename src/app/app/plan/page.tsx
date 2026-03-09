"use client";
import { useState } from "react";
import { useApp, getWeekDays } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
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
  Heart,
  Search,
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

function RecipePickerModal({
  likedRecipes,
  onPick,
  onClose,
}: {
  likedRecipes: Recipe[];
  onPick: (r: Recipe) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const cuisines = [...new Set(likedRecipes.map((r) => r.cuisine).filter(Boolean))];

  const filtered = likedRecipes.filter((r) => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !activeFilter || r.cuisine === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-5 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" /> Meine Rezepte
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center">
            <X className="w-4 h-4 text-[#64748b]" />
          </button>
        </div>

        {likedRecipes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <ChefHat className="w-12 h-12 text-[#475569] mb-3" />
            <p className="text-[#64748b] text-sm mb-4">Noch keine Rezepte gespeichert</p>
            <Link href="/app/swipe" onClick={onClose}
              className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              Rezepte entdecken
            </Link>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rezept suchen..."
                className="w-full bg-[#1e293b] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-[#475569] focus:outline-none focus:border-teal-500/40"
              />
            </div>

            {/* Cuisine filter chips */}
            {cuisines.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                    !activeFilter ? "bg-teal-500 text-white" : "bg-[#1e293b] text-[#64748b]"
                  }`}
                >
                  Alle
                </button>
                {cuisines.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveFilter(activeFilter === c ? null : c)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                      activeFilter === c ? "bg-teal-500 text-white" : "bg-[#1e293b] text-[#64748b]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Recipe list */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filtered.length === 0 ? (
                <p className="text-center text-[#475569] text-sm py-8">Keine Treffer</p>
              ) : (
                filtered.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => onPick(recipe)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#1e293b] hover:bg-[#253347] transition-colors text-left"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{recipe.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[#64748b] text-xs">
                          <Clock className="w-3 h-3" /> {recipe.time} Min
                        </span>
                        <span className="flex items-center gap-1 text-[#64748b] text-xs">
                          <Flame className="w-3 h-3" /> {recipe.calories} kcal
                        </span>
                        {recipe.cuisine && (
                          <span className="text-teal-400 text-xs">{recipe.cuisine}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function PlanPage() {
  const { weeklyPlan, likedRecipes, removeFromPlan, addToWeeklyPlan, generateShoppingList } = useApp();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
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
                <button
                  onClick={() => setAddingDay(day)}
                  className="flex items-center gap-3 px-4 pb-4 text-[#475569] hover:text-teal-400 transition-colors w-full"
                >
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#1e293b] flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Mahlzeit hinzufügen</span>
                </button>
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
          <p className="text-[#64748b] text-sm mb-6">Entdecke Rezepte per Swipe und plane deine Woche</p>
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

      {/* Recipe Picker Modal */}
      <AnimatePresence>
        {addingDay && (
          <RecipePickerModal
            likedRecipes={likedRecipes}
            onPick={(recipe) => {
              addToWeeklyPlan(addingDay, recipe);
              setAddingDay(null);
            }}
            onClose={() => setAddingDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
