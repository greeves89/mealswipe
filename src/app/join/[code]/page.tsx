"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChefHat, Users, Crown, Check, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HouseholdPreview {
  id: string;
  name: string;
  owner_name: string;
  member_count: number;
}

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<HouseholdPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [invalidCode, setInvalidCode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const upperCode = (code as string)?.toUpperCase();

  useEffect(() => {
    if (!upperCode) return;

    // Load household preview (public)
    fetch(`/api/household/preview?code=${upperCode}`)
      .then(r => r.json())
      .then(data => {
        if (data.household) setPreview(data.household);
        else setInvalidCode(true);
      })
      .catch(() => setInvalidCode(true))
      .finally(() => setLoadingPreview(false));

    // Check if logged in
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        setIsLoggedIn(!!user?.id);
        // Check if already in this household
        if (user?.id) {
          fetch("/api/household")
            .then(r => r.ok ? r.json() : null)
            .then(hh => {
              if (hh?.household) setAlreadyMember(true);
            })
            .catch(() => {});
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, [upperCode]);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", invite_code: upperCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Beitritt fehlgeschlagen");
        setJoining(false);
        return;
      }
      setJoined(true);
      setTimeout(() => router.replace("/app"), 2000);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
      setJoining(false);
    }
  };

  if (loadingPreview || isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (invalidCode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Ungültige Einladung</h1>
        <p className="text-[#94a3b8] mb-8">Dieser Einladungs-Link ist nicht mehr gültig oder wurde widerrufen.</p>
        <Link href="/" className="bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all">
          Zur Startseite
        </Link>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="w-24 h-24 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-teal-400" />
        </motion.div>
        <h1 className="text-2xl font-black text-white mb-2">Willkommen!</h1>
        <p className="text-[#94a3b8]">Du bist jetzt Mitglied von <span className="text-white font-bold">{preview?.name}</span>.</p>
        <p className="text-[#475569] text-sm mt-2">Weiterleitung...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <p className="text-[#64748b] text-sm">Du wurdest eingeladen!</p>
        </div>

        {/* Household card */}
        <div className="bg-[#0f172a] border border-orange-500/20 rounded-3xl p-6 mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-1">{preview?.name}</h2>
          <p className="text-[#64748b] text-sm mb-3">
            Eingeladen von <span className="text-[#94a3b8] font-medium">{preview?.owner_name}</span>
          </p>
          <div className="flex items-center justify-center gap-2 bg-orange-500/10 rounded-xl px-4 py-2 border border-orange-500/10">
            <Crown className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-semibold">Family Plan</span>
            <span className="text-[#64748b] text-sm">· {preview?.member_count} {preview?.member_count === 1 ? "Mitglied" : "Mitglieder"}</span>
          </div>
        </div>

        {/* Invite code badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-[#475569] text-xs">Code:</span>
          <span className="font-mono font-bold text-teal-400 tracking-widest text-sm bg-teal-500/10 px-3 py-1 rounded-lg border border-teal-500/20">{upperCode}</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-red-400 text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {alreadyMember ? (
          <div className="text-center space-y-3">
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 text-teal-400 text-sm">
              Du bist bereits Mitglied eines Haushalts.
            </div>
            <Link href="/app" className="block w-full text-center bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-2xl font-bold transition-all">
              Zur App
            </Link>
          </div>
        ) : isLoggedIn ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
          >
            {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
            {joining ? "Beitreten..." : "Haushalt beitreten"}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-[#64748b] text-sm mb-4">
              Erstelle einen Account oder melde dich an, um dem Haushalt beizutreten.
            </p>
            <Link
              href={`/auth/register?invite=${upperCode}`}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
            >
              <ArrowRight className="w-5 h-5" />
              Registrieren & beitreten
            </Link>
            <Link
              href={`/auth/login?invite=${upperCode}`}
              className="w-full flex items-center justify-center gap-2 bg-[#0f172a] border border-white/10 hover:border-teal-500/30 text-[#94a3b8] hover:text-teal-400 py-4 rounded-2xl font-semibold transition-all"
            >
              Anmelden & beitreten
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
