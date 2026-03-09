"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Zap,
  ShoppingCart,
  Users,
  ChefHat,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Heart,
  Clock,
  Flame,
} from "lucide-react";

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const demoCards = [
  {
    name: "Pasta Carbonara",
    cuisine: "Italienisch",
    time: 25,
    cal: 650,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    rotate: "-6deg",
    zIndex: 1,
    scale: 0.88,
  },
  {
    name: "Butter Chicken",
    cuisine: "Indisch",
    time: 45,
    cal: 580,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
    rotate: "3deg",
    zIndex: 2,
    scale: 0.94,
  },
  {
    name: "Buddha Bowl",
    cuisine: "International",
    time: 30,
    cal: 420,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    rotate: "0deg",
    zIndex: 3,
    scale: 1,
  },
];

const steps = [
  {
    icon: Camera,
    title: "Scannen",
    desc: "Fotografiere deine HelloFresh- oder Chefkoch-Rezeptkarte. Unsere KI extrahiert alle Infos automatisch.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
  {
    icon: Heart,
    title: "Swipen",
    desc: "Swipe rechts für Rezepte die dir gefallen, links für die du überspringen möchtest — wie Tinder, aber leckerer.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: ShoppingCart,
    title: "Einkaufen",
    desc: "Deine Einkaufsliste wird automatisch generiert. Bestelle direkt bei REWE oder Edeka mit einem Klick.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
];

const features = [
  {
    icon: Camera,
    title: "KI-Rezept Scanner",
    desc: "Scanne jede Rezeptkarte — HelloFresh, Chefkoch, BBC Food. Alles wird automatisch erkannt.",
    color: "teal",
  },
  {
    icon: Heart,
    title: "Tinder-Style Swipen",
    desc: "Finde Rezepte die dir wirklich schmecken mit intuitivem Swipe-Interface.",
    color: "rose",
  },
  {
    icon: ChefHat,
    title: "Wochenplan",
    desc: "7-Tage-Übersicht mit deinen Lieblingsrezepten, perfekt portioniert für deinen Haushalt.",
    color: "orange",
  },
  {
    icon: ShoppingCart,
    title: "Auto-Einkaufsliste",
    desc: "Alle Zutaten deiner geplanten Mahlzeiten — sortiert, dedupliziert, direkt bestellbar.",
    color: "green",
  },
  {
    icon: Users,
    title: "Haushalts-Profile",
    desc: "Konfiguriere Portionsgrößen und Ernährungsvorlieben für deine ganze Familie.",
    color: "blue",
  },
  {
    icon: Zap,
    title: "Supermarkt-Integration",
    desc: "Direktbestellung bei REWE, Edeka und weiteren Partnern. Lieferung nach Hause.",
    color: "yellow",
  },
];

const colorMap: Record<string, string> = {
  teal: "bg-teal-400/10 text-teal-400",
  rose: "bg-rose-400/10 text-rose-400",
  orange: "bg-orange-400/10 text-orange-400",
  green: "bg-green-400/10 text-green-400",
  blue: "bg-blue-400/10 text-blue-400",
  yellow: "bg-yellow-400/10 text-yellow-400",
};

const pricing = [
  {
    name: "Free",
    price: "0€",
    period: "für immer",
    features: [
      "20 Rezepte swipen",
      "Wochenplan (3 Tage)",
      "Basis-Einkaufsliste",
      "1 Scan/Monat",
    ],
    missing: ["Unbegrenzte Scans", "Supermarkt-Integration", "Familie teilen"],
    cta: "Kostenlos starten",
    highlight: false,
    badge: undefined as string | undefined,
  },
  {
    name: "Plus",
    price: "3,99€",
    period: "pro Monat",
    features: [
      "Unbegrenzte Rezepte",
      "Vollständiger Wochenplan",
      "Smart-Einkaufsliste",
      "10 Scans/Monat",
      "REWE & Edeka Integration",
    ],
    missing: ["Familie teilen"],
    cta: "Plus holen",
    highlight: true,
    badge: "Beliebteste",
  },
  {
    name: "Family",
    price: "4,99€",
    period: "pro Monat",
    features: [
      "Alles aus Plus",
      "Bis zu 6 Profile",
      "Unbegrenzte Scans",
      "Gemeinsame Planung",
      "Prioritäts-Support",
      "Früher Zugang zu Funktionen",
    ],
    missing: [],
    cta: "Family starten",
    highlight: false,
    badge: undefined as string | undefined,
  },
];

const competitors = [
  { feature: "Tinder-Style Swipen", ms: true, hf: false, ck: false },
  { feature: "KI-Rezept Scanner", ms: true, hf: false, ck: false },
  { feature: "Eigene Rezepte importieren", ms: true, hf: false, ck: true },
  { feature: "Supermarkt-Integration", ms: true, hf: true, ck: false },
  { feature: "Kein Abo-Zwang", ms: true, hf: false, ck: true },
  { feature: "Ernährungsfilter", ms: true, hf: true, ck: true },
  { feature: "Offline-Modus", ms: true, hf: false, ck: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f8fafc] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">forkly</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#94a3b8]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Preise</a>
          <a href="#compare" className="hover:text-white transition-colors">Vergleich</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="text-[#94a3b8] hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          >
            Registrieren <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-32 overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-teal-400/8 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-2 text-teal-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            KI-gestützte Mahlzeitenplanung
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-[#94a3b8] bg-clip-text text-transparent">
              Swipe.
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-teal-500 bg-clip-text text-transparent">
              Plan.
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent">
              Eat.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#94a3b8] mb-10 max-w-2xl mx-auto leading-relaxed">
            Scanne deine Rezeptkarten, swipe wie bei Tinder und lass deine Einkaufsliste
            automatisch erstellen. Mahlzeitenplanung, die Spaß macht.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth/register"
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-[0_0_40px_rgba(20,184,166,0.3)]"
            >
              Jetzt kostenlos starten
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-[#94a3b8] hover:text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all hover:bg-white/5"
            >
              Einrichten
            </Link>
          </div>
        </motion.div>

        {/* Demo Cards Stack */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-xs mx-auto h-80"
        >
          {demoCards.map((card, idx) => (
            <div
              key={card.name}
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
              style={{
                transform: `rotate(${card.rotate}) scale(${card.scale})`,
                zIndex: card.zIndex,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-bold text-white text-lg">{card.name}</p>
                <div className="flex items-center gap-3 text-white/70 text-sm mt-1">
                  <span>{card.cuisine}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {card.time} Min
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {card.cal} kcal
                  </span>
                </div>
              </div>
              {idx === 2 && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-lg">
                  LECKER ❤️
                </div>
              )}
            </div>
          ))}

          {/* Swipe hint */}
          <div className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <X className="w-5 h-5" />
              </div>
              Nope
            </div>
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              Lecker
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              So einfach{" "}
              <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                geht&apos;s
              </span>
            </h2>
            <p className="text-[#94a3b8] text-lg max-w-xl mx-auto">
              In 3 Schritten zur perfekten Mahlzeitenplanung. Keine Kompromisse.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <AnimatedSection key={step.title} delay={i * 0.15}>
                <div className="relative p-8 rounded-3xl bg-[#0f172a] border border-white/5 hover:border-teal-500/20 transition-all hover:-translate-y-1">
                  <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-[#64748b] font-bold text-lg">
                    {i + 1}
                  </div>
                  <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mb-6`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-[#94a3b8] leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-4 bg-[#0f172a]/50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Alles was du{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                brauchst
              </span>
            </h2>
            <p className="text-[#94a3b8] text-lg max-w-xl mx-auto">
              forkly ist vollgepackt mit Features, die Mahlzeitenplanung zur Freude machen.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 h-full">
                  <div className={`w-12 h-12 rounded-xl ${colorMap[f.color]} flex items-center justify-center mb-4`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              forkly vs.{" "}
              <span className="text-[#64748b]">die Anderen</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="rounded-3xl bg-[#0f172a] border border-white/5 overflow-hidden">
              <div className="grid grid-cols-4 bg-[#1e293b]/50 p-4 text-sm font-semibold text-[#94a3b8]">
                <div>Feature</div>
                <div className="text-center text-teal-400">forkly</div>
                <div className="text-center">HelloFresh</div>
                <div className="text-center">Chefkoch</div>
              </div>
              {competitors.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-4 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                >
                  <div className="text-[#94a3b8]">{row.feature}</div>
                  <div className="flex justify-center">
                    {row.ms ? (
                      <Check className="w-5 h-5 text-teal-400" />
                    ) : (
                      <X className="w-5 h-5 text-[#475569]" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.hf ? (
                      <Check className="w-5 h-5 text-[#64748b]" />
                    ) : (
                      <X className="w-5 h-5 text-[#475569]" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.ck ? (
                      <Check className="w-5 h-5 text-[#64748b]" />
                    ) : (
                      <X className="w-5 h-5 text-[#475569]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-4 bg-[#0f172a]/50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Einfache{" "}
              <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                Preise
              </span>
            </h2>
            <p className="text-[#94a3b8] text-lg">Kein Versteckspiel. Jederzeit kündbar.</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <AnimatedSection key={plan.name} delay={i * 0.1}>
                <div
                  className={`relative p-8 rounded-3xl border h-full flex flex-col ${
                    plan.highlight
                      ? "bg-gradient-to-b from-teal-500/10 to-teal-600/5 border-teal-500/40 shadow-[0_0_60px_rgba(20,184,166,0.15)]"
                      : "bg-[#0f172a] border-white/5"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{plan.price}</span>
                      <span className="text-[#64748b] text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-[#475569]">
                        <X className="w-4 h-4 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    className={`w-full text-center py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] block ${
                      plan.highlight
                        ? "bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                        : "bg-white/5 hover:bg-white/10 text-[#94a3b8] border border-white/10"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="relative p-12 rounded-3xl bg-gradient-to-br from-teal-500/10 via-[#0f172a] to-orange-500/5 border border-teal-500/20 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-teal-500/10 blur-[80px]" />
              </div>
              <ChefHat className="w-16 h-16 text-teal-400 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Bereit für besseres Essen?
              </h2>
              <p className="text-[#94a3b8] text-lg mb-8 max-w-xl mx-auto">
                Tausende Haushalte planen schon smarter. Kostenlos, ohne Kreditkarte.
              </p>
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all hover:scale-105 shadow-[0_0_50px_rgba(20,184,166,0.4)]"
              >
                Jetzt kostenlos starten
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">forkly</span>
          </div>
          <p className="text-[#64748b] text-sm">
            © 2026 forkly. Mit ❤️ für bessere Mahlzeiten.
          </p>
          <div className="flex gap-6 text-sm text-[#64748b]">
            <a href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="/impressum" className="hover:text-white transition-colors">Impressum</a>
            <a href="mailto:daniel.alisch@me.com" className="hover:text-white transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
