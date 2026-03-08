"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, TrendingUp, Crown, Star, Zap, ChefHat, RefreshCw, ShieldAlert,
  MessageSquare, Bug, Lightbulb, Archive, CheckCircle, Database, Download,
  Camera, Upload, Check, X, Languages, BookOpen, Search, Trash2, Edit3,
} from "lucide-react";

interface User {
  id: string; email: string; name: string; plan: string;
  created_at: string; household_people: number | null; household_diets: string[] | null;
}
interface FeedbackItem {
  id: string; user_email: string | null; user_name: string | null; type: string;
  rating: number | null; message: string; status: string; created_at: string;
}
interface Recipe {
  id: string; name: string; cuisine: string; difficulty: string;
  time_minutes: number; calories: number; rating: number;
  ingredients: {name:string;amount:string}[]; steps: string[]; image: string; source: string;
}
interface Stats {
  total: number; planCounts: Record<string, number>; mrr: string;
  newLast30Days: number; signupsByDay: {date:string;count:string}[]; newFeedback: number;
}
interface AdminData { users: User[]; feedback: FeedbackItem[]; stats: Stats; }

const FEEDBACK_TYPE_ICON: Record<string, React.ReactNode> = {
  bug: <Bug className="w-3.5 h-3.5" />,
  feature: <Lightbulb className="w-3.5 h-3.5" />,
  general: <MessageSquare className="w-3.5 h-3.5" />,
};
const FEEDBACK_TYPE_COLOR: Record<string, string> = {
  bug: "bg-red-500/10 text-red-400 border-red-500/20",
  feature: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  general: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  plus: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  family: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
const PLAN_ICON: Record<string, React.ReactNode> = {
  free: <Star className="w-3 h-3" />, plus: <Zap className="w-3 h-3" />, family: <Users className="w-3 h-3" />,
};
const DIFFICULTY_COLOR: Record<string, string> = {
  Einfach: "text-green-400 bg-green-400/10",
  Mittel: "text-orange-400 bg-orange-400/10",
  Anspruchsvoll: "text-red-400 bg-red-400/10",
};

function StatCard({ label, value, sub, icon, color }: { label:string; value:string|number; sub?:string; icon:React.ReactNode; color:string }) {
  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="bg-[#0f172a] rounded-2xl border border-white/5 p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-3xl font-black text-[#f8fafc]">{value}</p>
      <p className="text-sm font-semibold text-[#94a3b8] mt-1">{label}</p>
      {sub && <p className="text-xs text-[#475569] mt-0.5">{sub}</p>}
    </motion.div>
  );
}

const TABS = ["Übersicht", "User", "Rezepte", "Feedback", "Tools"] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Übersicht");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [feedbackFilter, setFeedbackFilter] = useState("new");
  const [updatingFeedback, setUpdatingFeedback] = useState<string | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<string | null>(null);

  // Crawler state
  const [crawlQuery, setCrawlQuery] = useState("");
  const [crawlCuisine, setCrawlCuisine] = useState("");
  const [crawlNumber, setCrawlNumber] = useState(10);
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<{saved?:number;skipped?:number;dbTotal?:number;quota?:{used:string;left:string;request:string};error?:string;lastError?:string} | null>(null);

  // TheMealDB import state
  const [importingMealDB, setImportingMealDB] = useState(false);
  const [mealDBResult, setMealDBResult] = useState<{saved?:number;skipped?:number;totalMeals?:number;dbTotal?:number;errors?:string[];error?:string} | null>(null);

  // Translate state
  const [translating, setTranslating] = useState(false);
  const [translateResult, setTranslateResult] = useState<{translated?:number;skipped?:number;total?:number;error?:string} | null>(null);

  // Scan-to-DB state
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Record<string,unknown> | null>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recipeSaved, setRecipeSaved] = useState(false);

  const handleCrawl = async () => {
    setCrawling(true); setCrawlResult(null);
    try {
      const res = await fetch("/api/admin/crawl", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({query:crawlQuery,cuisine:crawlCuisine,number:crawlNumber}) });
      setCrawlResult(await res.json());
    } finally { setCrawling(false); }
  };

  const handleImportMealDB = async () => {
    setImportingMealDB(true); setMealDBResult(null);
    try {
      const res = await fetch("/api/admin/import-themealdb", { method:"POST" });
      setMealDBResult(await res.json());
    } catch { setMealDBResult({error:"Netzwerkfehler"}); }
    finally { setImportingMealDB(false); }
  };

  const handleTranslate = async () => {
    setTranslating(true); setTranslateResult(null);
    try {
      const res = await fetch("/api/admin/translate-recipes", { method:"POST" });
      setTranslateResult(await res.json());
    } catch { setTranslateResult({error:"Netzwerkfehler"}); }
    finally { setTranslating(false); }
  };

  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setScanPreview(ev.target?.result as string); setScanResult(null); setRecipeSaved(false); };
    reader.readAsDataURL(file);
  };

  const handleScanImage = async () => {
    if (!scanPreview) return;
    setScanning(true); setScanResult(null);
    try {
      const base64 = scanPreview.split(",")[1] || scanPreview;
      const res = await fetch("/api/admin/scan-recipe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({imageBase64:base64}) });
      setScanResult(await res.json());
    } finally { setScanning(false); }
  };

  const handleSaveScannedRecipe = async () => {
    if (!scanResult) return;
    setSavingRecipe(true);
    try {
      await fetch("/api/admin/scan-recipe", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(scanResult) });
      setRecipeSaved(true);
      setTimeout(() => { setScanPreview(null); setScanResult(null); setRecipeSaved(false); loadRecipes(); }, 2000);
    } finally { setSavingRecipe(false); }
  };

  const handleDeleteRecipe = async (id: string) => {
    setDeletingRecipe(id);
    try {
      await fetch("/api/admin/recipes", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
      setRecipes(prev => prev.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    } finally { setDeletingRecipe(null); }
  };

  async function loadRecipes() {
    try {
      const res = await fetch("/api/recipes?number=100");
      if (res.ok) {
        const d = await res.json();
        setRecipes(d.recipes ?? []);
      }
    } catch { /* silent */ }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.status === 403) { setError("Kein Zugriff — nur für Admins."); return; }
      if (!res.ok) throw new Error("Fehler");
      setData(await res.json());
    } catch { setError("Fehler beim Laden der Daten."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); loadRecipes(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 text-center p-6">
      <ShieldAlert className="w-12 h-12 text-red-400" />
      <h1 className="text-2xl font-black text-[#f8fafc]">{error}</h1>
      <a href="/auth/login" className="text-teal-400 text-sm hover:underline">Zum Login</a>
    </div>
  );

  const { users, feedback, stats } = data!;
  const updateFeedbackStatus = async (id: string, status: string) => {
    setUpdatingFeedback(id);
    try { await fetch("/api/feedback", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,status}) }); await load(); }
    finally { setUpdatingFeedback(null); }
  };
  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (planFilter === "all" || u.plan === planFilter);
  });
  const filteredRecipes = recipes.filter(r =>
    !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase()) || r.cuisine?.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-lg">forkly</span>
              <span className="ml-2 text-xs font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5">Admin</span>
            </div>
          </div>
          <button onClick={() => { load(); loadRecipes(); }} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tab navigation */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all relative ${
                activeTab === tab
                  ? "text-teal-400 bg-teal-400/5 border-b-2 border-teal-400"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {tab}
              {tab === "Feedback" && stats.newFeedback > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-purple-500 rounded-full text-[9px] text-white font-bold">
                  {stats.newFeedback}
                </span>
              )}
              {tab === "Rezepte" && recipes.length > 0 && (
                <span className="ml-1.5 text-[10px] text-[#475569]">{recipes.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ── ÜBERSICHT ── */}
          {activeTab === "Übersicht" && (
            <motion.div key="overview" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Gesamt User" value={stats.total} sub={`+${stats.newLast30Days} in 30 Tagen`} icon={<Users className="w-5 h-5 text-teal-400" />} color="bg-teal-400/10" />
                <StatCard label="MRR (geschätzt)" value={`${stats.mrr} €`} sub="Plus + Family" icon={<TrendingUp className="w-5 h-5 text-green-400" />} color="bg-green-400/10" />
                <StatCard label="Plus Abos" value={stats.planCounts.plus ?? 0} sub="@ 3,99 €/Mo" icon={<Zap className="w-5 h-5 text-teal-400" />} color="bg-teal-400/10" />
                <StatCard label="Family Abos" value={stats.planCounts.family ?? 0} sub="@ 4,99 €/Mo" icon={<Crown className="w-5 h-5 text-orange-400" />} color="bg-orange-400/10" />
                <StatCard label="Neues Feedback" value={stats.newFeedback ?? 0} sub="ungelesen" icon={<MessageSquare className="w-5 h-5 text-purple-400" />} color="bg-purple-400/10" />
                <StatCard label="Rezepte in DB" value={recipes.length} sub="gecrawlt & gescannt" icon={<BookOpen className="w-5 h-5 text-blue-400" />} color="bg-blue-400/10" />
              </div>
              {/* Plan breakdown */}
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-5">
                <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">Plan-Verteilung</h2>
                <div className="flex gap-3">
                  {["free","plus","family"].map(plan => {
                    const count = stats.planCounts[plan] ?? 0;
                    const pct = stats.total > 0 ? Math.round((count/stats.total)*100) : 0;
                    return (
                      <div key={plan} className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-[#94a3b8]">{plan}</span>
                          <span className="text-[#64748b]">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${plan==="plus"?"bg-teal-500":plan==="family"?"bg-orange-500":"bg-slate-500"}`} style={{width:`${pct}%`}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Signups chart */}
              {stats.signupsByDay.length > 0 && (
                <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-5">
                  <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">Registrierungen (letzte 30 Tage)</h2>
                  <div className="flex items-end gap-1 h-16">
                    {stats.signupsByDay.slice(0,30).reverse().map(d => {
                      const max = Math.max(...stats.signupsByDay.map(x=>parseInt(x.count)));
                      const h = max > 0 ? (parseInt(d.count)/max)*100 : 0;
                      return <div key={d.date} title={`${d.date}: ${d.count}`} className="flex-1 bg-teal-500/40 hover:bg-teal-500/70 rounded-sm transition-colors cursor-default" style={{height:`${Math.max(h,8)}%`}} />;
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── USER ── */}
          {activeTab === "User" && (
            <motion.div key="users" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text" placeholder="Name oder E-Mail suchen…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50"
                  />
                  <div className="flex gap-2">
                    {["all","free","plus","family"].map(p => (
                      <button key={p} onClick={()=>setPlanFilter(p)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${planFilter===p?"bg-teal-500/20 text-teal-400 border border-teal-500/30":"bg-[#1e293b] text-[#64748b] border border-white/5 hover:border-white/10"}`}>
                        {p==="all"?`Alle (${users.length})`:`${p} (${stats.planCounts[p]??0})`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-[#475569] text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-semibold">Name / E-Mail</th>
                        <th className="text-left px-4 py-3 font-semibold">Plan</th>
                        <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Haushalt</th>
                        <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Ernährung</th>
                        <th className="text-left px-4 py-3 font-semibold">Registriert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u,i) => (
                        <tr key={u.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i%2===0?"":"bg-white/[0.01]"}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#f8fafc] truncate max-w-[200px]">{u.name}</p>
                            <p className="text-[#475569] text-xs truncate max-w-[200px]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-1 capitalize ${PLAN_BADGE[u.plan]??PLAN_BADGE.free}`}>
                              {PLAN_ICON[u.plan]}{u.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell"><span className="text-[#94a3b8]">{u.household_people?`${u.household_people} Pers.`:"—"}</span></td>
                          <td className="px-4 py-3 hidden lg:table-cell"><span className="text-[#64748b] text-xs">{u.household_diets?.length?u.household_diets.join(", "):"—"}</span></td>
                          <td className="px-4 py-3 text-[#64748b] text-xs whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"2-digit"})}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#475569]">Keine User gefunden.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-white/5 text-xs text-[#334155]">{filteredUsers.length} von {users.length} Usern</div>
              </div>
            </motion.div>
          )}

          {/* ── REZEPTE ── */}
          {activeTab === "Rezepte" && (
            <motion.div key="recipes" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
              {/* Search */}
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input
                    value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)}
                    placeholder="Rezept oder Küche suchen…"
                    className="w-full bg-[#0f172a] border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-[#475569] focus:outline-none focus:border-teal-500/40"
                  />
                </div>
                <span className="text-xs text-[#475569]">{filteredRecipes.length} Rezepte</span>
              </div>

              {/* Recipe list + detail */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* List */}
                <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
                    {filteredRecipes.length === 0 ? (
                      <div className="px-4 py-10 text-center text-[#475569] text-sm">Keine Rezepte gefunden.</div>
                    ) : filteredRecipes.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRecipe(selectedRecipe?.id === r.id ? null : r)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left ${selectedRecipe?.id===r.id?"bg-teal-500/5 border-l-2 border-teal-500":""}`}
                      >
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt={r.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#1e293b] flex items-center justify-center text-xl shrink-0">
                            🍽️
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{r.name}</p>
                          <p className="text-xs text-[#64748b] truncate">{r.cuisine} · {r.time_minutes} Min · {r.calories} kcal</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[r.difficulty]||"text-[#64748b]"}`}>
                            {r.difficulty}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteRecipe(r.id); }}
                            disabled={deletingRecipe === r.id}
                            className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                          >
                            {deletingRecipe===r.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detail panel */}
                {selectedRecipe ? (
                  <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
                    {selectedRecipe.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-base leading-tight">{selectedRecipe.name}</h3>
                        <span className="text-xs text-[#475569] shrink-0 bg-[#1e293b] px-2 py-1 rounded-lg">{selectedRecipe.source}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-[#1e293b] px-2 py-1 rounded-lg">{selectedRecipe.cuisine}</span>
                        <span className="bg-[#1e293b] px-2 py-1 rounded-lg">{selectedRecipe.time_minutes} Min</span>
                        <span className="bg-[#1e293b] px-2 py-1 rounded-lg">{selectedRecipe.calories} kcal</span>
                        <span className={`px-2 py-1 rounded-lg font-semibold ${DIFFICULTY_COLOR[selectedRecipe.difficulty]||""}`}>{selectedRecipe.difficulty}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                          Zutaten ({selectedRecipe.ingredients?.length ?? 0})
                        </p>
                        {selectedRecipe.ingredients?.length > 0 ? (
                          <div className="space-y-1">
                            {selectedRecipe.ingredients.map((ing, i) => (
                              <div key={i} className="flex justify-between text-sm bg-[#1e293b]/50 rounded-lg px-3 py-1.5">
                                <span>{ing.name}</span>
                                <span className="text-[#64748b] text-xs">{ing.amount}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#475569] text-xs">Keine Zutaten</p>
                        )}
                      </div>
                      {selectedRecipe.steps?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                            Schritte ({selectedRecipe.steps.length})
                          </p>
                          <div className="space-y-1.5">
                            {selectedRecipe.steps.slice(0,5).map((step, i) => (
                              <div key={i} className="flex gap-2 text-xs text-[#94a3b8]">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px]">{i+1}</span>
                                <span className="leading-relaxed line-clamp-2">{step}</span>
                              </div>
                            ))}
                            {selectedRecipe.steps.length > 5 && <p className="text-xs text-[#475569]">+{selectedRecipe.steps.length-5} weitere Schritte</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f172a] rounded-2xl border border-white/5 flex items-center justify-center p-12 text-[#334155]">
                    <div className="text-center">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Rezept auswählen um Details zu sehen</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── FEEDBACK ── */}
          {activeTab === "Feedback" && (
            <motion.div key="feedback" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <h2 className="text-sm font-semibold text-[#f8fafc]">Feedback</h2>
                    {stats.newFeedback > 0 && <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold rounded-full px-2 py-0.5">{stats.newFeedback} neu</span>}
                  </div>
                  <div className="flex gap-2">
                    {["new","read","archived","all"].map(s => (
                      <button key={s} onClick={()=>setFeedbackFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${feedbackFilter===s?"bg-purple-500/20 text-purple-400 border border-purple-500/30":"bg-[#1e293b] text-[#64748b] border border-white/5 hover:border-white/10"}`}>
                        {s==="new"?"Neu":s==="read"?"Gelesen":s==="archived"?"Archiv":"Alle"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {feedback.filter(f => feedbackFilter==="all"||f.status===feedbackFilter).map(f => (
                    <div key={f.id} className={`p-4 transition-colors ${f.status==="new"?"bg-purple-500/[0.03]":""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2 py-0.5 capitalize ${FEEDBACK_TYPE_COLOR[f.type]??FEEDBACK_TYPE_COLOR.general}`}>
                              {FEEDBACK_TYPE_ICON[f.type]}{f.type==="bug"?"Bug":f.type==="feature"?"Feature":"Allgemein"}
                            </span>
                            {f.rating && <span className="flex items-center gap-0.5 text-xs text-yellow-400">{"★".repeat(f.rating)}{"☆".repeat(5-f.rating)}</span>}
                            {f.status==="new" && <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5 font-semibold">Neu</span>}
                            <span className="text-xs text-[#475569]">{f.user_name??f.user_email??"Anonym"} · {new Date(f.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                          </div>
                          <p className="text-sm text-[#e2e8f0] leading-relaxed">{f.message}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {f.status!=="read" && (
                            <button onClick={()=>updateFeedbackStatus(f.id,"read")} disabled={updatingFeedback===f.id} title="Als gelesen markieren" className="w-7 h-7 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 flex items-center justify-center transition-colors">
                              <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                            </button>
                          )}
                          {f.status!=="archived" && (
                            <button onClick={()=>updateFeedbackStatus(f.id,"archived")} disabled={updatingFeedback===f.id} title="Archivieren" className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-colors">
                              <Archive className="w-3.5 h-3.5 text-[#64748b]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {feedback.filter(f=>feedbackFilter==="all"||f.status===feedbackFilter).length===0 && (
                    <div className="px-4 py-10 text-center text-[#475569] text-sm">Kein Feedback in dieser Kategorie.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TOOLS ── */}
          {activeTab === "Tools" && (
            <motion.div key="tools" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  <h2 className="font-bold text-sm">Rezept-Datenbank Tools</h2>
                  <span className="ml-auto text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-2 py-0.5">{recipes.length} in DB</span>
                </div>
                <div className="p-5 space-y-6">
                  {/* Spoonacular Crawler */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Spoonacular Crawler
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-[#64748b] mb-1 block">Suchbegriff</label>
                        <input value={crawlQuery} onChange={e=>setCrawlQuery(e.target.value)} placeholder="z.B. pasta, salad..." className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-3 py-2 text-sm placeholder-[#334155] focus:outline-none focus:border-teal-500/40" />
                      </div>
                      <div>
                        <label className="text-xs text-[#64748b] mb-1 block">Küche</label>
                        <input value={crawlCuisine} onChange={e=>setCrawlCuisine(e.target.value)} placeholder="z.B. italian, asian..." className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-3 py-2 text-sm placeholder-[#334155] focus:outline-none focus:border-teal-500/40" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-xs text-[#64748b]">Anzahl:</label>
                      {[5,10,20,50].map(n => (
                        <button key={n} onClick={()=>setCrawlNumber(n)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${crawlNumber===n?"bg-teal-500 text-white":"bg-[#1e293b] text-[#64748b] border border-white/5"}`}>{n}</button>
                      ))}
                    </div>
                    <button onClick={handleCrawl} disabled={crawling} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                      {crawling?<RefreshCw className="w-4 h-4 animate-spin" />:<Download className="w-4 h-4" />}
                      {crawling?"Wird gecrawlt...":"Rezepte crawlen"}
                    </button>
                    {crawlResult && (
                      <div className="mt-3 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs space-y-1">
                        <div className="flex gap-4 flex-wrap">
                          <span className="text-teal-400 font-semibold">✓ {crawlResult.saved??0} gespeichert</span>
                          {(crawlResult.skipped??0)>0 && <span className="text-orange-400">{crawlResult.skipped} übersprungen</span>}
                          <span className="text-[#94a3b8]">DB gesamt: {crawlResult.dbTotal??"?"}</span>
                        </div>
                        {crawlResult.lastError && <div className="text-red-400">Fehler: {crawlResult.lastError}</div>}
                        <div className="text-[#64748b]">
                          {crawlResult.quota
                            ? <>Quota: {crawlResult.quota.request} Punkte · {crawlResult.quota.used} verwendet · <span className={parseInt(crawlResult.quota.left??"999")<20?"text-red-400":"text-green-400"}>{crawlResult.quota.left} übrig</span></>
                            : crawlResult.error?<span className="text-red-400">Fehler: {crawlResult.error}</span>:null}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TheMealDB Import */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Database className="w-3.5 h-3.5" /> TheMealDB Import (~300 Rezepte)
                    </h3>
                    <p className="text-xs text-[#475569] mb-3">Importiert alle ~300 kostenlosen Rezepte von TheMealDB (mit Zutaten + Mengenangaben + Schritten).</p>
                    <button onClick={handleImportMealDB} disabled={importingMealDB} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                      {importingMealDB?<RefreshCw className="w-4 h-4 animate-spin" />:<Download className="w-4 h-4" />}
                      {importingMealDB?"Importiere (kann 2–3 min dauern)...":"TheMealDB importieren"}
                    </button>
                    {mealDBResult && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1">
                        {mealDBResult.error
                          ? <span className="text-red-400">Fehler: {mealDBResult.error}</span>
                          : <>
                              <div className="flex gap-4 flex-wrap">
                                <span className="text-blue-400 font-semibold">✓ {mealDBResult.saved} gespeichert</span>
                                {(mealDBResult.skipped??0)>0 && <span className="text-orange-400">{mealDBResult.skipped} übersprungen</span>}
                                <span className="text-[#94a3b8]">Gesamt TheMealDB: {mealDBResult.totalMeals}</span>
                                <span className="text-[#64748b]">DB total: {mealDBResult.dbTotal}</span>
                              </div>
                              {(mealDBResult.errors?.length??0)>0 && <div className="text-red-400">Fehler: {mealDBResult.errors?.join(", ")}</div>}
                            </>}
                      </div>
                    )}
                  </div>

                  {/* Translate All */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5" /> Alle Rezepte übersetzen (OpenAI)
                    </h3>
                    <p className="text-xs text-[#475569] mb-3">Übersetzt alle Rezeptnamen, Beschreibungen, Zutaten und Schritte ins Deutsche.</p>
                    <button onClick={handleTranslate} disabled={translating} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                      {translating?<RefreshCw className="w-4 h-4 animate-spin" />:<Languages className="w-4 h-4" />}
                      {translating?"Übersetze...":"Alle übersetzen"}
                    </button>
                    {translateResult && (
                      <div className="mt-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                        {translateResult.error
                          ? <span className="text-red-400">Fehler: {translateResult.error}</span>
                          : <><span className="text-purple-400 font-semibold">✓ {translateResult.translated} übersetzt</span>
                             {(translateResult.skipped??0)>0 && <span className="text-orange-400 ml-3">{translateResult.skipped} übersprungen</span>}
                             <span className="text-[#64748b] ml-3">von {translateResult.total}</span></>}
                      </div>
                    )}
                  </div>

                  {/* Scan to DB */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" /> Foto scannen → Datenbank
                    </h3>
                    {!scanPreview ? (
                      <label className="flex items-center gap-3 bg-[#1e293b] border-2 border-dashed border-white/10 hover:border-teal-500/40 rounded-2xl p-5 cursor-pointer transition-all">
                        <Upload className="w-5 h-5 text-[#64748b]" />
                        <span className="text-sm text-[#64748b]">Rezeptfoto hochladen (JPG, PNG)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleScanFile} />
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={scanPreview} alt="Scan preview" className="w-full h-40 object-cover" />
                          <button onClick={()=>{setScanPreview(null);setScanResult(null);}} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {!scanResult ? (
                          <button onClick={handleScanImage} disabled={scanning} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                            {scanning?<RefreshCw className="w-4 h-4 animate-spin" />:<Camera className="w-4 h-4" />}
                            {scanning?"KI analysiert...":"Rezept analysieren"}
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-[#1e293b] border border-white/5 text-sm">
                              <p className="font-bold text-white mb-1">{String(scanResult.name??"")}</p>
                              <p className="text-[#64748b] text-xs">{String(scanResult.description??"")}</p>
                              <div className="flex gap-3 mt-2 text-xs text-[#94a3b8]">
                                <span>{String(scanResult.cuisine??"")} · {String(scanResult.time??"")} Min · {String(scanResult.difficulty??"")}</span>
                              </div>
                            </div>
                            <button onClick={handleSaveScannedRecipe} disabled={savingRecipe||recipeSaved} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${recipeSaved?"bg-green-500 text-white":"bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white"}`}>
                              {recipeSaved?<><Check className="w-4 h-4" /> In DB gespeichert!</>:savingRecipe?<RefreshCw className="w-4 h-4 animate-spin" />:"In Datenbank speichern"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
