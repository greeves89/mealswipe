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
  MessageSquare,
  Copy,
  UserPlus,
  UserMinus,
  RefreshCw,
} from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [household, setHousehold] = useState<{
    id: string; invite_code: string; name: string; is_owner: boolean;
  } | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [householdAction, setHouseholdAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const [meRes, profileRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/profile"),
        ]);

        if (!meRes.ok) {
          router.push("/auth/login");
          return;
        }

        const user: MeResponse = await meRes.json();
        setEmail(user.email ?? "");
        setDisplayName(user.name ?? user.email?.split("@")[0] ?? "");

        let household_size = 2;
        let dietary_restrictions: string[] = [];

        if (profileRes.ok) {
          const { profile } = await profileRes.json();
          if (profile) {
            household_size = profile.household_people ?? 2;
            dietary_restrictions = profile.household_diets ?? [];
          }
        }

        setProfile({
          display_name: user.name ?? null,
          plan: user.plan ?? "free",
          household_size,
          dietary_restrictions,
        });
        setHouseholdSize(household_size);
        setDietRestrictions(dietary_restrictions);

        // Load household info
        try {
          const hhRes = await fetch("/api/household");
          if (hhRes.ok) {
            const { household: hh, members } = await hhRes.json();
            setHousehold(hh ?? null);
            setHouseholdMembers(members ?? []);
          }
        } catch { /* ignore */ }
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

  const handleHouseholdAction = async (action: string, extra?: object) => {
    setHouseholdAction(action);
    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Fehler"); return; }

      // Refresh household
      const hhRes = await fetch("/api/household");
      if (hhRes.ok) {
        const { household: hh, members } = await hhRes.json();
        setHousehold(hh ?? null);
        setHouseholdMembers(members ?? []);
      }
      if (action === "join") setJoinCode("");
    } finally {
      setHouseholdAction(null);
    }
  };

  const copyInviteCode = async () => {
    if (!household?.invite_code) return;
    await navigator.clipboard.writeText(household.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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

      {/* Family Sharing */}
      {currentPlan === "family" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-[#0f172a] rounded-2xl border border-orange-500/20 p-5 space-y-4"
        >
          <h3 className="text-[#f8fafc] font-semibold flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-orange-400" />
            Family Sharing
          </h3>

          {household ? (
            <>
              {/* Invite code */}
              <div>
                <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-2">
                  Einladungs-Code
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#1e293b] rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-widest text-orange-400 text-center border border-orange-500/20">
                    {household.invite_code}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-orange-500/10 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all"
                    title="Code kopieren"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#94a3b8]" />}
                  </button>
                  {household.is_owner && (
                    <button
                      onClick={() => handleHouseholdAction("regenerate_code")}
                      disabled={householdAction === "regenerate_code"}
                      className="w-12 h-12 flex items-center justify-center bg-[#1e293b] hover:bg-[#263548] rounded-xl border border-white/5 transition-all"
                      title="Neuen Code generieren"
                    >
                      {householdAction === "regenerate_code"
                        ? <Loader2 className="w-4 h-4 animate-spin text-[#94a3b8]" />
                        : <RefreshCw className="w-4 h-4 text-[#94a3b8]" />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#475569] mt-1.5">
                  Code teilen → andere können deinem Haushalt beitreten
                </p>
              </div>

              {/* Members list */}
              {householdMembers.length > 0 && (
                <div>
                  <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-2">
                    Mitglieder ({householdMembers.length})
                  </p>
                  <div className="bg-[#1e293b] rounded-xl divide-y divide-white/5">
                    {householdMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400/30 to-teal-600/30 flex items-center justify-center text-teal-400 text-sm font-bold shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-[#475569] truncate">{member.email}</p>
                        </div>
                        {household.is_owner && member.id !== (householdMembers.find(() => true)?.id) && (
                          <button
                            onClick={() => handleHouseholdAction("kick", { member_id: member.id })}
                            disabled={!!householdAction}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Entfernen"
                          >
                            <UserMinus className="w-3.5 h-3.5 text-[#475569] hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leave button (non-owners) */}
              {!household.is_owner && (
                <button
                  onClick={() => handleHouseholdAction("leave")}
                  disabled={!!householdAction}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  Haushalt verlassen
                </button>
              )}
            </>
          ) : (
            <>
              {/* Create or join */}
              <div className="space-y-3">
                <button
                  onClick={() => handleHouseholdAction("create")}
                  disabled={!!householdAction}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-sm font-semibold hover:bg-orange-500/20 transition-all"
                >
                  {householdAction === "create"
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <UserPlus className="w-4 h-4" />}
                  Neuen Haushalt erstellen
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-[#475569]">oder</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Einladungs-Code"
                    maxLength={6}
                    className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono tracking-widest placeholder-[#334155] focus:outline-none focus:border-orange-500/40 uppercase"
                  />
                  <button
                    onClick={() => handleHouseholdAction("join", { invite_code: joinCode })}
                    disabled={joinCode.length < 6 || !!householdAction}
                    className="px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold disabled:opacity-40 transition-all"
                  >
                    {householdAction === "join" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Beitreten"}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

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

      {/* Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center justify-between bg-[#0f172a] border border-white/5 hover:border-teal-500/20 rounded-2xl p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-left">
              <p className="text-[#f8fafc] text-sm font-semibold">Feedback geben</p>
              <p className="text-[#475569] text-xs">Bug, Idee oder Lob</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#475569] group-hover:text-teal-400 transition-colors" />
        </button>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30 }}
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
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
