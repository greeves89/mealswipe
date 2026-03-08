"use client";
import { useApp, getWeekDays } from "@/lib/store";
import Link from "next/link";
import { Flame, Calendar, ShoppingCart, Heart, ArrowRight, Lightbulb, ChefHat, Clock } from "lucide-react";
import { motion } from "framer-motion";

const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const TIPS = [
  "Plane deine Mahlzeiten am Wochenende, spare Zeit in der Woche!",
  "Batch-cooking: Koche mehrere Portionen auf einmal für die ganze Woche.",
  "Saisonales Gemüse ist günstiger und schmeckt besser.",
  "Meal-Prep am Sonntag macht den Wochentag-Stress leichter.",
  "Friere Reste ein — du wirst dir in der Zukunft dankbar sein!",
];

export default function DashboardPage() {
  const { household, weeklyPlan, shoppingList, likedRecipes } = useApp();
  const days = getWeekDays();
  const today = new Date().toISOString().split("T")[0];
  const tip = TIPS[new Date().getDay() % TIPS.length];

  const plannedCount = Object.keys(weeklyPlan).length;
  const checkedItems = shoppingList.filter((i) => i.checked).length;

  return (
    <div className="p-4 space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-2"
      >
        <p className="text-[#64748b] text-sm">Willkommen zurück 👋</p>
        <h1 className="text-2xl font-black text-[#f8fafc] mt-1">
          {household.name}
        </h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          {household.people} {household.people === 1 ? "Person" : "Personen"} · {household.diets.length > 0 ? household.diets.join(", ") : "Keine Einschränkungen"}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: Heart, label: "Geliked", value: likedRecipes.length, color: "text-rose-400", bg: "bg-rose-400/10" },
          { icon: Calendar, label: "Geplant", value: plannedCount, color: "text-teal-400", bg: "bg-teal-400/10" },
          { icon: ShoppingCart, label: "Artikel", value: shoppingList.length, color: "text-orange-400", bg: "bg-orange-400/10" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-[#0f172a] border border-white/5 flex flex-col items-center text-center">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-2xl font-black">{stat.value}</span>
            <span className="text-[#64748b] text-xs">{stat.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Big CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Link
          href="/app/swipe"
          className="group flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-teal-500/20 to-teal-600/10 border border-teal-500/30 hover:border-teal-400/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">Rezepte swipen</p>
              <p className="text-[#94a3b8] text-sm">Finde deine Lieblingsrezepte</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Weekly Plan Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Diese Woche</h2>
          <Link href="/app/plan" className="text-teal-400 text-sm font-medium hover:text-teal-300 flex items-center gap-1">
            Alle <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {days.map((day, i) => {
            const recipe = weeklyPlan[day];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`flex-shrink-0 w-16 rounded-2xl overflow-hidden border transition-all ${
                  isToday ? "border-teal-500/50" : "border-white/5"
                } ${recipe ? "bg-[#0f172a]" : "bg-[#0f172a]/50"}`}
              >
                <div className={`text-center py-2 text-xs font-bold ${isToday ? "text-teal-400" : "text-[#64748b]"}`}>
                  {DAY_NAMES[i]}
                </div>
                {recipe ? (
                  <div className="relative h-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <ChefHat className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="h-14 flex items-center justify-center text-[#475569] text-xl">
                    +
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Today's Meal */}
      {weeklyPlan[today] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className="font-bold text-lg mb-3">Heute auf dem Plan</h2>
          <div className="rounded-3xl overflow-hidden bg-[#0f172a] border border-white/5">
            <div className="relative h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={weeklyPlan[today].image}
                alt={weeklyPlan[today].name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-bold text-white text-xl">{weeklyPlan[today].name}</p>
                <div className="flex items-center gap-3 text-white/70 text-sm mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {weeklyPlan[today].time} Min
                  </span>
                  <span>{weeklyPlan[today].cuisine}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Shopping progress */}
      {shoppingList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-sm">Einkaufsliste</span>
              </div>
              <Link href="/app/shopping" className="text-teal-400 text-xs font-medium">
                Öffnen →
              </Link>
            </div>
            <div className="w-full bg-[#1e293b] rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full transition-all"
                style={{ width: `${(checkedItems / shoppingList.length) * 100}%` }}
              />
            </div>
            <p className="text-[#64748b] text-xs">
              {checkedItems} von {shoppingList.length} Artikeln erledigt
            </p>
          </div>
        </motion.div>
      )}

      {/* Tip of the day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-400/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-orange-400 text-xs font-semibold mb-1">TIPP DES TAGES</p>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{tip}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
