"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Clock, Flame, Check, X, Loader2,
  ChefHat, Mail, Share2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type FriendStatus = "pending" | "accepted";
type Direction = "sent" | "received";

interface Friend {
  id: string;
  user_id: string;
  name: string;
  email: string;
  direction: Direction;
  status: FriendStatus;
  created_at: string;
}

interface SharedRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  time: number;
  calories: number;
  difficulty: string;
  tags: string[];
  ownerName: string;
}

type Tab = "feed" | "friends";

export default function SocialPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [recipes, setRecipes] = useState<SharedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [fRes, rRes] = await Promise.all([
      fetch("/api/friends"),
      fetch("/api/social/recipes"),
    ]);
    if (fRes.ok) { const d = await fRes.json(); setFriends(d.friends ?? []); }
    if (rRes.ok) { const d = await rRes.json(); setRecipes(d.recipes ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddFriend = async () => {
    if (!emailInput.trim()) return;
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      setAddSuccess(`Anfrage an ${data.friend_name} gesendet!`);
      setEmailInput("");
      load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setAddLoading(false);
    }
  };

  const handleFriendAction = async (id: string, action: "accept" | "decline" | "remove") => {
    if (action === "remove") {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/friends/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    }
    load();
  };

  const pending = friends.filter((f) => f.status === "pending" && f.direction === "received");
  const accepted = friends.filter((f) => f.status === "accepted");
  const sent = friends.filter((f) => f.status === "pending" && f.direction === "sent");

  return (
    <div className="p-4 space-y-5 pb-10">
      {/* Header */}
      <div className="pt-2 flex items-center gap-3">
        <Link href="/app/profile" className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-[#64748b] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Community</h1>
          <p className="text-[#64748b] text-sm">Freunde & geteilte Rezepte</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-2xl">
        {([
          { id: "feed" as Tab, icon: Share2, label: "Feed" },
          { id: "friends" as Tab, icon: Users, label: `Freunde${pending.length > 0 ? ` (${pending.length})` : ""}` },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === id ? "bg-[#1e293b] text-white shadow-sm" : "text-[#64748b] hover:text-[#94a3b8]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "feed" && (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {recipes.length === 0 ? (
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 text-center space-y-3">
                  <ChefHat className="w-12 h-12 text-teal-400/40 mx-auto" />
                  <p className="font-bold text-[#94a3b8]">Noch keine geteilten Rezepte</p>
                  <p className="text-sm text-[#475569]">
                    Füge Freunde hinzu und bitte sie, ihre Rezepte zu teilen!
                  </p>
                  <button
                    onClick={() => setTab("friends")}
                    className="mx-auto flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    <UserPlus className="w-4 h-4" /> Freunde hinzufügen
                  </button>
                </div>
              ) : (
                recipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden"
                  >
                    {recipe.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={recipe.image} alt={recipe.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="h-32 bg-[#1e293b] flex items-center justify-center text-5xl">
                        {["🍝", "🍜", "🌮", "🥗", "🍣", "🥘", "🍕"][Math.abs(recipe.name.charCodeAt(0)) % 7]}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {recipe.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-[#64748b] font-medium">{recipe.ownerName}</span>
                      </div>
                      <h3 className="font-bold mb-1">{recipe.name}</h3>
                      <p className="text-[#94a3b8] text-sm mb-3 line-clamp-2">{recipe.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        {recipe.time > 0 && (
                          <div className="flex items-center gap-1 bg-[#1e293b] rounded-lg px-2.5 py-1">
                            <Clock className="w-3 h-3 text-teal-400" />
                            <span className="text-xs font-semibold">{recipe.time} Min</span>
                          </div>
                        )}
                        {recipe.calories > 0 && (
                          <div className="flex items-center gap-1 bg-[#1e293b] rounded-lg px-2.5 py-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span className="text-xs font-semibold">{recipe.calories} kcal</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-[#1e293b] rounded-lg px-2.5 py-1">
                          <span className="text-xs text-[#94a3b8]">{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === "friends" && (
            <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Add friend */}
              <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
                <h3 className="font-bold mb-1 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-400" /> Freund hinzufügen
                </h3>
                <p className="text-[#64748b] text-sm mb-4">Gib die E-Mail-Adresse deines Freundes ein.</p>
                <div className="flex gap-2">
                  <input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                    placeholder="freund@beispiel.de"
                    type="email"
                    className="flex-1 bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-sm placeholder-[#475569] focus:outline-none focus:border-teal-500/40"
                  />
                  <button
                    onClick={handleAddFriend}
                    disabled={!emailInput.trim() || addLoading}
                    className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white px-4 rounded-xl font-bold transition-all"
                  >
                    {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  </button>
                </div>
                {addError && <p className="text-red-400 text-sm mt-2">{addError}</p>}
                {addSuccess && <p className="text-teal-400 text-sm mt-2">{addSuccess}</p>}
              </div>

              {/* Pending incoming */}
              {pending.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide px-1">Anfragen</p>
                  {pending.map((f) => (
                    <div key={f.id} className="bg-[#0f172a] border border-teal-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.name}</p>
                        <p className="text-[#64748b] text-xs truncate">{f.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFriendAction(f.id, "accept")}
                          className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 hover:bg-teal-500/30 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFriendAction(f.id, "decline")}
                          className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Accepted friends */}
              {accepted.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide px-1">Meine Freunde ({accepted.length})</p>
                  {accepted.map((f) => (
                    <div key={f.id} className="bg-[#0f172a] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.name}</p>
                        <p className="text-[#64748b] text-xs truncate">{f.email}</p>
                      </div>
                      <button
                        onClick={() => handleFriendAction(f.id, "remove")}
                        className="text-[#475569] hover:text-red-400 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent requests */}
              {sent.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide px-1">Gesendet</p>
                  {sent.map((f) => (
                    <div key={f.id} className="bg-[#0f172a] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3 opacity-70">
                      <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center text-[#94a3b8] text-sm font-bold shrink-0">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.name}</p>
                        <p className="text-[#64748b] text-xs">Ausstehend…</p>
                      </div>
                      <button
                        onClick={() => handleFriendAction(f.id, "remove")}
                        className="text-[#475569] hover:text-red-400 transition-colors p-1"
                        title="Anfrage zurückziehen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {accepted.length === 0 && pending.length === 0 && sent.length === 0 && (
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 text-center space-y-2">
                  <Users className="w-10 h-10 text-[#1e293b] mx-auto" />
                  <p className="text-[#94a3b8] font-semibold">Noch keine Freunde</p>
                  <p className="text-sm text-[#475569]">Füge Freunde hinzu, um ihre Rezepte zu sehen!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
