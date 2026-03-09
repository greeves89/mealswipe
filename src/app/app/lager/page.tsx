"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Package, Search, X, ChevronDown } from "lucide-react";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  "Gemüse", "Obst", "Fleisch & Fisch", "Milchprodukte",
  "Getreide & Pasta", "Hülsenfrüchte", "Gewürze & Öle",
  "Backzutaten", "Getränke", "Konserven", "Tiefkühl", "Sonstiges",
];

const CATEGORY_EMOJI: Record<string, string> = {
  "Gemüse": "🥦", "Obst": "🍎", "Fleisch & Fisch": "🥩",
  "Milchprodukte": "🧀", "Getreide & Pasta": "🍞",
  "Hülsenfrüchte": "🫘", "Gewürze & Öle": "🫙",
  "Backzutaten": "🧁", "Getränke": "🥤",
  "Konserven": "🥫", "Tiefkühl": "❄️", "Sonstiges": "📦",
};

const UNITS = ["g", "kg", "ml", "l", "Stück", "Bund", "Packung", "Dose", "Flasche", "EL", "TL"];

function AddItemModal({ onAdd, onClose }: { onAdd: (item: Omit<PantryItem, "id" | "created_at">) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("Stück");
  const [category, setCategory] = useState("Sonstiges");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), quantity: parseFloat(quantity) || 1, unit, category });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-black text-lg mb-5 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-400" /> Zutat hinzufügen
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Mehl, Tomaten, Milch..."
              className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-sm placeholder-[#334155] focus:outline-none focus:border-teal-500/40"
            />
          </div>
          <div className="flex gap-3">
            <div className="w-24">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Menge</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="0"
                step="0.1"
                className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/40"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Einheit</label>
              <div className="relative">
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full appearance-none bg-[#1e293b] border border-white/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/40 pr-8"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b] pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Kategorie</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 ${
                    category === c ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-[#1e293b] text-[#64748b] border border-white/5"
                  }`}
                >
                  <span>{CATEGORY_EMOJI[c]}</span>
                  <span className="truncate">{c}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold transition-all"
          >
            Hinzufügen
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function LagerPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alle");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/pantry");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleAdd = async (item: Omit<PantryItem, "id" | "created_at">) => {
    try {
      const res = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) load();
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/pantry", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
  };

  const handleQuantityChange = async (id: string, quantity: number) => {
    if (quantity < 0) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    try {
      await fetch("/api/pantry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity }),
      });
    } catch { /* silent */ }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Alle" || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // Group by category
  const grouped = filteredItems.reduce<Record<string, PantryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const usedCategories = ["Alle", ...CATEGORIES.filter(c => items.some(i => i.category === c))];

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Package className="w-6 h-6 text-teal-400" /> Lager
            </h1>
            <p className="text-[#64748b] text-sm mt-0.5">{items.length} Zutaten vorrätig</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Hinzufügen
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zutat suchen..."
            className="w-full bg-[#0f172a] border border-white/5 rounded-2xl pl-9 pr-9 py-3 text-sm placeholder-[#475569] focus:outline-none focus:border-teal-500/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {usedCategories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                activeCategory === c ? "bg-teal-500 text-white" : "bg-[#0f172a] border border-white/5 text-[#64748b]"
              }`}
            >
              {c !== "Alle" && <span>{CATEGORY_EMOJI[c]}</span>}
              {c}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#0f172a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">📦</span>
            <p className="text-[#64748b] mt-3 font-medium">
              {items.length === 0 ? "Noch keine Zutaten im Lager" : "Keine Zutaten gefunden"}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 text-teal-400 text-sm hover:underline"
              >
                Erste Zutat hinzufügen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                  <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">{cat}</h3>
                  <span className="text-xs text-[#334155] ml-auto">{catItems.length}</span>
                </div>
                <div className="rounded-2xl bg-[#0f172a] border border-white/5 divide-y divide-white/5 overflow-hidden">
                  <AnimatePresence>
                    {catItems.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, Math.max(0, item.quantity - 1))}
                            className="w-7 h-7 rounded-lg bg-[#1e293b] flex items-center justify-center text-[#64748b] hover:text-white text-lg font-bold leading-none transition-colors"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-14 text-center">
                            {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}{" "}
                            <span className="text-[#64748b] font-normal text-xs">{item.unit}</span>
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-[#1e293b] flex items-center justify-center text-[#64748b] hover:text-white text-lg font-bold leading-none transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <AddItemModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
