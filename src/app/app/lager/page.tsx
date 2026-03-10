"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Package, Search, X, ChevronDown, Barcode, Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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

// ── Barcode Scanner Modal ────────────────────────────────────────────────────

interface BarcodeResult {
  found: boolean;
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  image?: string | null;
}

function BarcodeScannerModal({
  onAdd,
  onClose,
}: {
  onAdd: (item: Omit<PantryItem, "id" | "created_at">) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<"scanning" | "found" | "notfound" | "error">("scanning");
  const [product, setProduct] = useState<BarcodeResult | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("1");
  const [editUnit, setEditUnit] = useState("Stück");
  const [editCat, setEditCat] = useState("Sonstiges");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const lookupBarcode = useCallback(async (barcode: string) => {
    stopCamera();
    setPhase("found"); // optimistic — show loader in the found state
    try {
      const res = await fetch(`/api/barcode-lookup?barcode=${barcode}`);
      const data: BarcodeResult = await res.json();
      setProduct(data);
      if (data.found) {
        setEditName(data.name ?? "");
        setEditQty(String(data.quantity ?? 1));
        setEditUnit(data.unit ?? "Stück");
        setEditCat(data.category ?? "Sonstiges");
        setPhase("found");
      } else {
        setPhase("notfound");
        setEditName("");
        setEditQty("1");
        setEditUnit("Stück");
        setEditCat("Sonstiges");
      }
    } catch {
      setPhase("error");
    }
  }, [stopCamera]);

  // Start camera + BarcodeDetector scanning loop
  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Check BarcodeDetector support
      if (!("BarcodeDetector" in window)) {
        setCameraError("Barcode-Erkennung wird von diesem Browser nicht unterstützt. Bitte Chrome auf Android oder Edge verwenden.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detectorRef.current = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        scanInterval.current = setInterval(async () => {
          if (!videoRef.current || !detectorRef.current || cancelled) return;
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && /^\d{8,14}$/.test(code)) {
                lookupBarcode(code);
              }
            }
          } catch { /* frame decode errors are normal */ }
        }, 400);
      } catch (err) {
        if (!cancelled) {
          setCameraError("Kamera konnte nicht gestartet werden. Bitte Kamerazugriff erlauben.");
          console.error(err);
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [lookupBarcode, stopCamera]);

  const handleConfirm = () => {
    onAdd({
      name: editName.trim() || "Unbekanntes Produkt",
      quantity: parseFloat(editQty) || 1,
      unit: editUnit,
      category: editCat,
    });
    handleClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#080f1e]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Barcode className="w-5 h-5 text-teal-400" />
          <h2 className="font-black text-base">Barcode scannen</h2>
        </div>
        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      {phase === "scanning" && (
        <>
          {cameraError ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm text-[#94a3b8]">{cameraError}</p>
              <button onClick={handleClose} className="px-6 py-2.5 rounded-2xl bg-white/5 text-sm font-semibold">
                Schließen
              </button>
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-64 h-40 border-2 border-teal-400 rounded-2xl relative">
                  {/* Corner marks */}
                  <span className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
                  <span className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
                  <span className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />
                  {/* Scan line */}
                  <motion.div
                    className="absolute inset-x-2 h-0.5 bg-teal-400/80 rounded-full"
                    animate={{ top: ["10%", "85%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <p className="mt-5 text-sm text-white/70 font-medium bg-black/50 px-4 py-2 rounded-full">
                  Barcode in den Rahmen halten
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {phase === "found" && !product && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      )}

      {phase === "found" && product?.found && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          <div className="flex items-center gap-3 py-3">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={editName} className="w-14 h-14 rounded-xl object-contain bg-white/5" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Package className="w-7 h-7 text-teal-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-teal-400 font-semibold">Produkt gefunden</span>
              </div>
              <p className="font-bold mt-0.5">{editName}</p>
            </div>
          </div>

          {/* Edit fields */}
          <div>
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Name</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/40"
            />
          </div>

          <div className="flex gap-3">
            <div className="w-24">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Menge</label>
              <input
                type="number"
                value={editQty}
                onChange={e => setEditQty(e.target.value)}
                min="0"
                step="0.1"
                className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/40"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Einheit</label>
              <div className="relative">
                <select
                  value={editUnit}
                  onChange={e => setEditUnit(e.target.value)}
                  className="w-full appearance-none bg-[#0f172a] border border-white/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/40 pr-8"
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
                  onClick={() => setEditCat(c)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 ${
                    editCat === c ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-[#0f172a] text-[#64748b] border border-white/5"
                  }`}
                >
                  <span>{CATEGORY_EMOJI[c]}</span>
                  <span className="truncate">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!editName.trim()}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Zum Lager hinzufügen
          </button>
          <button
            onClick={() => { setPhase("scanning"); setProduct(null); /* restart camera */ }}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-[#64748b] hover:text-white transition-colors"
          >
            Erneut scannen
          </button>
        </div>
      )}

      {(phase === "notfound" || phase === "error") && (
        <div className="flex-1 flex flex-col px-4 pb-6">
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">{phase === "notfound" ? "🔍" : "⚠️"}</span>
            <p className="font-bold">
              {phase === "notfound" ? "Produkt nicht gefunden" : "Fehler bei der Suche"}
            </p>
            <p className="text-sm text-[#64748b]">
              {phase === "notfound"
                ? "Dieser Barcode ist nicht in der Datenbank. Trag das Produkt manuell ein."
                : "Verbindungsproblem. Bitte erneut versuchen."}
            </p>
          </div>

          {/* Manual entry fallback */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Manuell eingeben</p>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Produktname..."
              className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/40"
            />
            <div className="flex gap-3">
              <input
                type="number"
                value={editQty}
                onChange={e => setEditQty(e.target.value)}
                min="0"
                step="0.1"
                className="w-24 bg-[#0f172a] border border-white/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/40"
              />
              <div className="relative flex-1">
                <select
                  value={editUnit}
                  onChange={e => setEditUnit(e.target.value)}
                  className="w-full appearance-none bg-[#0f172a] border border-white/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/40 pr-8"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b] pointer-events-none" />
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!editName.trim()}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold transition-all"
            >
              Hinzufügen
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-[#64748b] hover:text-white transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Add Item Modal ───────────────────────────────────────────────────────────

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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LagerPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              title="Barcode scannen"
              className="flex items-center gap-2 bg-[#0f172a] border border-white/5 hover:border-teal-500/30 text-[#94a3b8] hover:text-teal-400 px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all"
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scannen</span>
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Hinzufügen
            </button>
          </div>
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
              <div className="flex flex-col items-center gap-2 mt-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2 text-teal-400 text-sm hover:underline"
                >
                  <Barcode className="w-4 h-4" /> Barcode scannen
                </button>
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-[#64748b] text-sm hover:underline"
                >
                  oder manuell hinzufügen
                </button>
              </div>
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

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <AddItemModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />
        )}
        {showScanner && (
          <BarcodeScannerModal
            onAdd={(item) => { handleAdd(item); setShowScanner(false); }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
