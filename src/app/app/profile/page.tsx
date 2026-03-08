"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Crown,
  Users,
  LogOut,
  ChevronRight,
  Loader2,
  Check,
  Utensils,
} from "lucide-react";

const DIET_OPTIONS = [
  "Vegetarisch",
  "Vegan",
  "Glutenfrei",
  "Laktosefrei",
  "Halal",
  "Koscher",
];

interface Profile {
  display_name: string | null;
  plan: string;
  household_size: number;
  dietary_restrictions: string[];
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  plan: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [householdSize, setHouseholdSize] = useState(2);
  const [dietRestrictions, setDietRestrictions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth/login");
          return;
        }

        const user: MeResponse = await res.json();
        setEmail(user.email ?? "");

        const profileData: Profile = {
          display_name: user.name ?? null,
          plan: user.plan ?? "free",
          household_size: 2,
          dietary_restrictions: [],
        };
        setProfile(profileData);
        setDisplayName(user.name ?? user.email?.split("@")[0] ?? "");
        setHouseholdSize(2);
        setDietRestrictions([]);
      } catch {
        router.push("/auth/login");
        return;
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          household_size: householdSize,
          dietary_restrictions: dietRestrictions,
        }),
      });
    } catch {
      // Gracefully handle error — profile update is best-effort
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Ignore errors on signout
    }
    router.push("/");
    router.refresh();
  };

  const toggleDiet = (diet: string) => {
    setDietRestrictions((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const planLabel: Record<string, string> = {
    free: "Free",
    plus: "Plus",
    family: "Family",
  };

  const planColor: Record<string, string> = {
    free: "text-[#94a3b8] bg-slate-500/10 border-slate-500/20",
    plus: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    family: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  const avatarLetter = (displayName || email).charAt(0).toUpperCase();
  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Avatar + Plan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-teal-500/20 flex-shrink-0">
          {avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[#f8fafc] font-bold text-lg leading-tight truncate">
            {displayName || email.split("@")[0]}
          </h2>
          <p className="text-[#64748b] text-sm truncate">{email}</p>
          <span
            className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 ${
              planColor[currentPlan] ?? planColor.free
            }`}
          >
            <Crown className="w-3 h-3" />
            {planLabel[currentPlan] ?? "Free"}
          </span>
        </div>
      </motion.div>

      {/* Edit profile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-[#0f172a] rounded-2xl border border-white/5 p-5 space-y-4"
      >
        <h3 className="text-[#f8fafc] font-semibold flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-teal-400" />
          Profil bearbeiten
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            Anzeigename
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Dein Name"
            className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 text-sm transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            E-Mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-[#0f172a] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-[#475569] text-sm cursor-not-allowed"
            />
          </div>
        </div>
      </motion.div>

      {/* Household */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-[#0f172a] rounded-2xl border border-white/5 p-5 space-y-4"
      >
        <h3 className="text-[#f8fafc] font-semibold flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-teal-400" />
          Haushalt
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            Personen im Haushalt
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setHouseholdSize(n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  householdSize === n
                    ? "bg-teal-500 text-white"
                    : "bg-[#1e293b] text-[#64748b] hover:text-[#94a3b8] border border-white/5"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            Ernährungsweise
          </label>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((diet) => {
              const active = dietRestrictions.includes(diet);
              return (
                <button
                  key={diet}
                  onClick={() => toggleDiet(diet)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
                      : "bg-[#1e293b] border-white/5 text-[#64748b] hover:border-white/20"
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {diet}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Save button */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <>
            <Check className="w-4 h-4" />
            Gespeichert!
          </>
        ) : (
          "Änderungen speichern"
        )}
      </motion.button>

      {/* Plan upgrade link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link
          href="/app/billing"
          className="w-full flex items-center justify-between bg-[#0f172a] border border-white/5 hover:border-orange-500/20 rounded-2xl p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[#f8fafc] text-sm font-semibold">
                Plan upgraden
              </p>
              <p className="text-[#475569] text-xs">
                Alle Features freischalten
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#475569] group-hover:text-orange-400 transition-colors" />
        </Link>
      </motion.div>

      {/* Rezepte verwalten link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <Link
          href="/app/swipe"
          className="w-full flex items-center justify-between bg-[#0f172a] border border-white/5 hover:border-teal-500/20 rounded-2xl p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <p className="text-[#f8fafc] text-sm font-semibold">
                Rezepte entdecken
              </p>
              <p className="text-[#475569] text-xs">Swipen und entscheiden</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#475569] group-hover:text-teal-400 transition-colors" />
        </Link>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 bg-[#0f172a] border border-white/5 hover:border-red-500/20 text-[#64748b] hover:text-red-400 py-3.5 rounded-2xl font-medium text-sm transition-all"
        >
          {signingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              Abmelden
            </>
          )}
        </button>
      </motion.div>

      <div className="h-4" />
    </div>
  );
}
