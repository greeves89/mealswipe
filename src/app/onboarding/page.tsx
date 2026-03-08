"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  ChefHat,
  Users,
  Utensils,
  Clock,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";

const TOTAL_STEPS = 4;

const DIETS = [
  { id: "Vegetarisch", label: "Vegetarisch", emoji: "🥦" },
  { id: "Vegan", label: "Vegan", emoji: "🌱" },
  { id: "Glutenfrei", label: "Glutenfrei", emoji: "🌾" },
  { id: "Laktosefrei", label: "Laktosefrei", emoji: "🥛" },
  { id: "Halal", label: "Halal", emoji: "☪️" },
  { id: "Keine Einschränkungen", label: "Keine Einschränkungen", emoji: "🍽️" },
];

const CUISINES = [
  { id: "Deutsch", label: "Deutsch", emoji: "🥨" },
  { id: "Italienisch", label: "Italienisch", emoji: "🍝" },
  { id: "Asiatisch", label: "Asiatisch", emoji: "🍜" },
  { id: "Mexikanisch", label: "Mexikanisch", emoji: "🌮" },
  { id: "Mediterran", label: "Mediterran", emoji: "🫒" },
  { id: "Amerikanisch", label: "Amerikanisch", emoji: "🍔" },
];

const TIME_BUDGETS = [
  { id: "lt20", label: "< 20 Min", sub: "Blitzschnell" },
  { id: "20-30", label: "20-30 Min", sub: "Schnell" },
  { id: "30-60", label: "30-60 Min", sub: "Normal" },
  { id: "gt60", label: "> 60 Min", sub: "Zeit zum Genießen" },
];

const SKILLS = [
  { id: "Anfänger", label: "Anfänger", emoji: "👶", desc: "Einfache Rezepte" },
  { id: "Fortgeschritten", label: "Fortgeschritten", emoji: "👨‍🍳", desc: "Mittlere Schwierigkeit" },
  { id: "Profi", label: "Profi", emoji: "⭐", desc: "Alle Schwierigkeiten" },
];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 8,
            backgroundColor: i < current ? "#14b8a6" : i === current ? "#14b8a6" : "#1e293b",
          }}
          className="h-2 rounded-full"
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setHousehold } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Unser Haushalt");
  const [people, setPeople] = useState(2);
  const [diets, setDiets] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [timeBudget, setTimeBudget] = useState("20-30");
  const [skill, setSkill] = useState("Fortgeschritten");

  const toggleDiet = (id: string) => {
    if (id === "Keine Einschränkungen") {
      setDiets(["Keine Einschränkungen"]);
      return;
    }
    setDiets((prev) => {
      const without = prev.filter((d) => d !== "Keine Einschränkungen");
      return without.includes(id)
        ? without.filter((d) => d !== id)
        : [...without, id];
    });
  };

  const toggleCuisine = (id: string) => {
    setCuisines((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      // Finish
      setHousehold({ name, people, diets });
      router.push("/app/swipe");
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col px-5 py-10">
      {/* Progress dots */}
      <div className="flex justify-between items-center mb-10">
        <StepDots current={step} total={TOTAL_STEPS} />
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-[#64748b] hover:text-[#94a3b8] text-sm transition-colors"
          >
            Zurück
          </button>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="flex flex-col items-center text-center flex-1 justify-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-28 h-28 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(20,184,166,0.4)]"
                >
                  <ChefHat className="w-14 h-14 text-white" />
                </motion.div>
                <h1 className="text-4xl font-black mb-4">
                  Willkommen bei{" "}
                  <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                    MealSwipe
                  </span>
                </h1>
                <p className="text-[#94a3b8] text-lg leading-relaxed max-w-xs mb-6">
                  Lass uns kurz dein Profil einrichten, damit wir dir die besten Rezepte empfehlen können.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {[
                    "Personalisierte Rezeptempfehlungen",
                    "Passende Portionsgrößen",
                    "Deine Ernährungsvorlieben",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[#94a3b8] text-sm">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Household */}
            {step === 1 && (
              <div className="flex-1">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Dein Haushalt</h2>
                  <p className="text-[#94a3b8]">Wie sieht dein Haushalt aus?</p>
                </div>

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-semibold text-[#94a3b8] mb-2 block">
                      Name des Haushalts
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0f172a] border border-white/10 focus:border-teal-500/50 rounded-2xl px-4 py-3 text-[#f8fafc] text-base outline-none transition-colors"
                      placeholder="z.B. Die Mustermanns"
                    />
                  </div>

                  {/* People */}
                  <div>
                    <label className="text-sm font-semibold text-[#94a3b8] mb-4 block">
                      Anzahl Personen: <span className="text-teal-400 text-lg">{people}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <button
                          key={n}
                          onClick={() => setPeople(n)}
                          className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                            people === n
                              ? "bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                              : "bg-[#0f172a] border border-white/10 text-[#64748b] hover:border-teal-500/30"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diets */}
                  <div>
                    <label className="text-sm font-semibold text-[#94a3b8] mb-3 block">
                      Ernährungsweise
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIETS.map(({ id, label, emoji }) => {
                        const isSelected = diets.includes(id);
                        return (
                          <button
                            key={id}
                            onClick={() => toggleDiet(id)}
                            className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium text-left transition-all ${
                              isSelected
                                ? "bg-teal-500/10 border-teal-500/40 text-teal-400"
                                : "bg-[#0f172a] border-white/5 text-[#94a3b8] hover:border-white/10"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="truncate">{label}</span>
                            {isSelected && <Check className="w-4 h-4 ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <div className="flex-1">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center mb-4">
                    <Utensils className="w-6 h-6 text-orange-400" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Deine Vorlieben</h2>
                  <p className="text-[#94a3b8]">Was magst du am liebsten?</p>
                </div>

                <div className="space-y-6">
                  {/* Cuisines */}
                  <div>
                    <label className="text-sm font-semibold text-[#94a3b8] mb-3 block">
                      Lieblingsküchen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CUISINES.map(({ id, label, emoji }) => {
                        const isSelected = cuisines.includes(id);
                        return (
                          <button
                            key={id}
                            onClick={() => toggleCuisine(id)}
                            className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium text-left transition-all ${
                              isSelected
                                ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                                : "bg-[#0f172a] border-white/5 text-[#94a3b8] hover:border-white/10"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{label}</span>
                            {isSelected && <Check className="w-4 h-4 ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time budget */}
                  <div>
                    <label className="text-sm font-semibold text-[#94a3b8] mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Zeitbudget zum Kochen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_BUDGETS.map(({ id, label, sub }) => (
                        <button
                          key={id}
                          onClick={() => setTimeBudget(id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            timeBudget === id
                              ? "bg-teal-500/10 border-teal-500/40"
                              : "bg-[#0f172a] border-white/5 hover:border-white/10"
                          }`}
                        >
                          <p className={`font-bold text-sm ${timeBudget === id ? "text-teal-400" : "text-[#f8fafc]"}`}>
                            {label}
                          </p>
                          <p className="text-[#64748b] text-xs mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="text-sm font-semibold text-[#94a3b8] mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Kochkenntnisse
                    </label>
                    <div className="space-y-2">
                      {SKILLS.map(({ id, label, emoji, desc }) => (
                        <button
                          key={id}
                          onClick={() => setSkill(id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                            skill === id
                              ? "bg-teal-500/10 border-teal-500/40"
                              : "bg-[#0f172a] border-white/5 hover:border-white/10"
                          }`}
                        >
                          <span className="text-2xl">{emoji}</span>
                          <div>
                            <p className={`font-bold text-sm ${skill === id ? "text-teal-400" : "text-[#f8fafc]"}`}>
                              {label}
                            </p>
                            <p className="text-[#64748b] text-xs">{desc}</p>
                          </div>
                          {skill === id && <Check className="w-5 h-5 text-teal-400 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="flex flex-col items-center text-center flex-1 justify-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(20,184,166,0.5)]"
                >
                  <Check className="w-14 h-14 text-white" />
                </motion.div>
                <h2 className="text-4xl font-black mb-4">Alles bereit! 🎉</h2>
                <p className="text-[#94a3b8] text-lg max-w-xs leading-relaxed mb-8">
                  Dein Profil ist eingerichtet. Los geht&apos;s — swipe deine ersten Rezepte!
                </p>
                <div className="w-full max-w-xs space-y-2 text-left mb-8">
                  {[
                    { label: "Haushalt", value: name },
                    { label: "Personen", value: `${people} ${people === 1 ? "Person" : "Personen"}` },
                    {
                      label: "Ernährung",
                      value:
                        diets.length === 0
                          ? "Keine Einschränkungen"
                          : diets.join(", "),
                    },
                    { label: "Kochzeit", value: TIME_BUDGETS.find((t) => t.id === timeBudget)?.label || "" },
                    { label: "Kenntnisse", value: skill },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-[#64748b] text-sm">{label}</span>
                      <span className="text-[#f8fafc] text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      <div className="pt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(20,184,166,0.3)]"
        >
          {step === TOTAL_STEPS - 1 ? "Zu den Rezepten" : "Weiter"}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
