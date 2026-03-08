"use client";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { RECIPES, Recipe } from "@/lib/recipes";
import { Heart, X, Clock, Flame, Star, ChefHat, RotateCcw, Zap } from "lucide-react";

const SWIPE_THRESHOLD = 100;

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

function TopCard({ recipe, onSwipe }: { recipe: Recipe; onSwipe: (dir: "left" | "right") => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
      else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
      else x.set(0);
    },
    [onSwipe, x]
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
      className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, zIndex: 20 }}
      drag="x"
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${fallback}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={recipe.image}
        alt={recipe.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* LECKER overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: likeOpacity }}
      >
        <div className="absolute top-10 right-6 border-4 border-green-400 rounded-2xl px-4 py-2 rotate-[-12deg] bg-black/20">
          <span className="text-green-400 text-2xl font-black tracking-widest">LECKER ❤️</span>
        </div>
        <div className="absolute inset-0 bg-green-500/10" />
      </motion.div>

      {/* NOPE overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: nopeOpacity }}
      >
        <div className="absolute top-10 left-6 border-4 border-red-400 rounded-2xl px-4 py-2 rotate-[12deg] bg-black/20">
          <span className="text-red-400 text-2xl font-black tracking-widest">NOPE ✗</span>
        </div>
        <div className="absolute inset-0 bg-red-500/10" />
      </motion.div>

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
          <span className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-white/60 text-xs">
            {recipe.cuisine}
          </span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${DIFF_COLORS[recipe.difficulty] ?? ""}`}>
            {recipe.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {recipe.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] bg-teal-500/20 text-teal-300 rounded-full px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BackCard({ recipe, stackIndex }: { recipe: Recipe; stackIndex: number }) {
  const scale = 1 - stackIndex * 0.05;
  const y = stackIndex * 14;
  return (
    <div
      className="absolute inset-0 rounded-3xl overflow-hidden"
      style={{ transform: `scale(${scale}) translateY(${y}px)`, zIndex: 10 - stackIndex }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={recipe.image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        draggable={false}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    </div>
  );
}

export default function SwipePage() {
  const { addToLiked, addToDisliked } = useApp();
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const deck = RECIPES;
  const done = index >= deck.length;
  const remaining = deck.slice(index);
  const progress = Math.min((index / deck.length) * 100, 100);

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      if (index >= deck.length) return;
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
        setIndex((i) => i + 1);
        setExiting(null);
      }, 350);
    },
    [index, deck, addToLiked, addToDisliked]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-black text-white">Rezepte entdecken</h1>
          <p className="text-[#64748b] text-sm">
            {done ? "Alle bewertet!" : `${deck.length - index} Rezepte übrig`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0f172a] rounded-xl px-3 py-2 border border-white/5">
          <Zap className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-bold text-teal-400">{index}</span>
          <span className="text-[#64748b] text-sm">/ {deck.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-[#1e293b] rounded-full h-1.5 mb-4">
        <motion.div
          className="bg-gradient-to-r from-teal-600 to-teal-400 h-1.5 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Card stack */}
      <div className="flex-1 relative min-h-0">
        {done ? (
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
              onClick={() => setIndex(0)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Nochmal swipen
            </button>
          </motion.div>
        ) : (
          <>
            {/* Back cards (static, stacked) */}
            {remaining.slice(1, 3).map((recipe, i) => (
              <BackCard key={recipe.id} recipe={recipe} stackIndex={i + 1} />
            ))}

            {/* Top card (draggable) */}
            <AnimatePresence mode="wait">
              {!exiting && remaining[0] && (
                <motion.div
                  key={remaining[0].id}
                  className="absolute inset-0"
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <TopCard recipe={remaining[0]} onSwipe={handleSwipe} />
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
                  <TopCard recipe={remaining[0]} onSwipe={() => {}} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

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
      {!done && (
        <div className="flex items-center justify-center gap-6 pt-4">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe("left")}
            disabled={!!exiting}
            className="w-16 h-16 rounded-full bg-[#0f172a] border-2 border-red-500/40 hover:border-red-500 flex items-center justify-center shadow-lg transition-all active:shadow-red-500/20 disabled:opacity-50"
          >
            <X className="w-8 h-8 text-red-400" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe("right")}
            disabled={!!exiting}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </motion.button>
        </div>
      )}

      {!done && index === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-[#475569] text-xs mt-3"
        >
          ← Swipe links für NOPE · Rechts für LECKER ❤️ →
        </motion.p>
      )}
    </div>
  );
}
