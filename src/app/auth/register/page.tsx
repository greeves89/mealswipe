"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChefHat,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Loader2,
  MailCheck,
} from "lucide-react";

const BENEFITS = [
  "Rezepte swipen & entdecken",
  "Wochenplan automatisch befüllen",
  "Einkaufsliste generieren",
  "Rezeptkarten scannen",
];

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Bitte alle Felder ausfüllen");
      return;
    }
    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen haben");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }
    if (!consentAccepted) {
      setError("Bitte stimme der Datenschutzerklärung zu");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registrierung fehlgeschlagen");
        setLoading(false);
        return;
      }

      // Registration successful — redirect to join page if invite, else onboarding
      window.location.replace(inviteCode ? `/join/${inviteCode}` : "/onboarding");
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-2xl font-black text-[#f8fafc] mb-2">
            Fast geschafft!
          </h2>
          <p className="text-[#64748b] mb-6">
            Wir haben eine Bestätigungs-E-Mail an{" "}
            <span className="text-teal-400 font-medium">{email}</span> geschickt.
            Bitte klicke auf den Link, um dein Konto zu aktivieren.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[#0f172a] border border-white/10 hover:border-teal-500/30 text-[#94a3b8] hover:text-teal-400 font-medium py-3 px-6 rounded-2xl transition-all"
          >
            Zurück zur Anmeldung
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#f8fafc]">Konto erstellen</h1>
          <p className="text-[#64748b] text-sm mt-1">Starte deinen Mahlzeitenplaner</p>
        </div>

        {/* Benefits */}
        <div className="bg-[#0f172a] rounded-2xl p-4 mb-6 space-y-2">
          {BENEFITS.map((b) => (
            <div
              key={b}
              className="flex items-center gap-2.5 text-sm text-[#94a3b8]"
            >
              <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-teal-400" />
              </div>
              {b}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 text-red-400 text-sm mb-4"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Vorname
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max"
                autoComplete="given-name"
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              E-Mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                autoComplete="email"
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Passwort
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                autoComplete="new-password"
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-10 pr-12 py-3.5 text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Passwort bestätigen
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                autoComplete="new-password"
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
              />
            </div>
          </div>

          {/* Consent checkbox — DSGVO Art. 7 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setConsentAccepted(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                consentAccepted
                  ? "bg-teal-500 border-teal-500"
                  : "border-white/20 bg-[#0f172a] group-hover:border-teal-500/40"
              }`}
            >
              {consentAccepted && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs text-[#64748b] leading-relaxed">
              Ich habe die{" "}
              <a href="/datenschutz" target="_blank" className="text-teal-400 hover:underline">
                Datenschutzerklärung
              </a>{" "}
              gelesen und stimme der Verarbeitung meiner Daten zur Nutzung von forkly zu.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !consentAccepted}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-60 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[#475569] text-sm mt-6">
          Bereits ein Konto?{" "}
          <Link
            href="/auth/login"
            className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
          >
            Anmelden
          </Link>
        </p>
      </motion.div>
    </div>
  );
}


export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
