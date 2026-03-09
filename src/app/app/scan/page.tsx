"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Scan, ChefHat, Clock, Flame, Plus, X, Check, FlipHorizontal, Crop } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

type Tab = "camera" | "upload";

interface ScannedRecipe {
  name: string;
  description: string;
  ingredients: { name: string; amount: string }[];
  time: number;
  calories: number;
  servings: number;
  difficulty: "Einfach" | "Mittel" | "Anspruchsvoll";
  tags: string[];
}

const compressImage = (dataUrl: string, maxSize = 1200): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else { width = Math.round((width * maxSize) / height); height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });

const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      canvas.getContext("2d")?.drawImage(
        img,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      );
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = imageSrc;
  });

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  // pages[0] = Vorderseite, pages[1] = Rückseite (optional)
  const [pages, setPages] = useState<(string | null)[]>([null, null]);
  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropSlot, setCropSlot] = useState<0 | 1>(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedRecipe | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef0 = useRef<HTMLInputElement>(null);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraTarget, setCameraTarget] = useState<0 | 1>(0);

  const hasAnyPage = pages[0] !== null || pages[1] !== null;
  const hasBothPages = pages[0] !== null && pages[1] !== null;

  const handleFileUpload = (slot: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Nur Bilder erlaubt (JPG, PNG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Open cropper instead of setting page directly
      setCropSrc(ev.target?.result as string);
      setCropSlot(slot);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(cropSrc, croppedAreaPixels);
    setPages((prev) => { const next = [...prev]; next[cropSlot] = cropped; return next; });
    setCropSrc(null);
    setResult(null);
    setAdded(false);
  };

  const skipCrop = () => {
    if (!cropSrc) return;
    setPages((prev) => { const next = [...prev]; next[cropSlot] = cropSrc; return next; });
    setCropSrc(null);
    setResult(null);
    setAdded(false);
  };

  const startCamera = useCallback(async (target: 0 | 1) => {
    setCameraTarget(target);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError("Kamerazugriff nicht möglich. Bitte Datei-Upload verwenden.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    stopCamera();
    // Open cropper
    setCropSrc(dataUrl);
    setCropSlot(cameraTarget);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setResult(null);
    setAdded(false);
  };

  const handleScan = async () => {
    const filledPages = pages.filter(Boolean) as string[];
    if (filledPages.length === 0) return;
    setScanning(true);
    setError(null);

    try {
      const compressed = await Promise.all(filledPages.map((p) => compressImage(p)));
      const images = compressed.map((c) => c.split(",")[1] || c);

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Scan fehlgeschlagen");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Scannen");
    } finally {
      setScanning(false);
    }
  };

  const handleAddRecipe = async () => {
    if (!result || added) return;
    try {
      const res = await fetch("/api/scan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Speichern fehlgeschlagen (${res.status})`);
      }
      setAdded(true);
      setTimeout(() => { setResult(null); setPages([null, null]); setAdded(false); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rezept konnte nicht gespeichert werden");
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (stream) stopCamera();
    setActiveTab(tab);
    setPages([null, null]);
    setResult(null);
    setError(null);
  };

  const resetAll = () => { setPages([null, null]); setResult(null); setError(null); setAdded(false); };

  // Fullscreen crop overlay
  if (cropSrc) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/80">
          <button onClick={() => setCropSrc(null)} className="text-white/60 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
          <p className="text-white font-bold text-sm">
            {cropSlot === 0 ? "Vorderseite zuschneiden" : "Rückseite zuschneiden"}
          </p>
          <button onClick={skipCrop} className="text-[#64748b] text-sm px-2">
            Überspringen
          </button>
        </div>

        <div className="flex-1 relative">
          <Cropper
            image={cropSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            style={{
              containerStyle: { background: "#000" },
              cropAreaStyle: { border: "2px solid #14b8a6", borderRadius: "12px" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-3 bg-black/80">
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-teal-400"
          />
          <p className="text-[#64748b] text-xs text-center mt-1">Pinch oder Slider zum Zoomen</p>
        </div>

        <div className="px-4 pb-safe pb-6 bg-black/80">
          <button
            onClick={confirmCrop}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-2xl font-bold transition-all"
          >
            <Crop className="w-5 h-5" />
            Zuschnitt bestätigen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-10">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black">Rezept Scanner</h1>
        <p className="text-[#64748b] text-sm mt-1">Scanne Rezeptkarten mit KI-Erkennung</p>
      </div>

      {/* Tabs */}
      {!result && (
        <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-2xl">
          {([
            { id: "upload" as Tab, icon: Upload, label: "Bild hochladen" },
            { id: "camera" as Tab, icon: Camera, label: "Foto aufnehmen" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id ? "bg-[#1e293b] text-white shadow-sm" : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Camera view */}
      {activeTab === "camera" && stream && !result && (
        <div className="relative rounded-3xl overflow-hidden bg-[#0f172a] border border-white/5">
          <div className="absolute top-3 left-3 z-10 bg-teal-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
            {cameraTarget === 0 ? "Vorderseite" : "Rückseite"}
          </div>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-32 border-2 border-teal-400 rounded-xl relative">
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-teal-400/70"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
          <button
            onClick={capturePhoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg"
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#0a0a0f]" />
          </button>
          <button onClick={stopCamera} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page slots */}
      {!result && !stream && (
        <div className="space-y-3">
          {/* Page labels */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#94a3b8]">Fotos der Rezeptkarte</p>
            {hasBothPages && (
              <span className="text-xs text-teal-400 font-semibold">Vorder- & Rückseite ✓</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {([0, 1] as const).map((slot) => (
              <div key={slot} className="space-y-1">
                <p className="text-xs text-[#64748b] font-medium text-center">
                  {slot === 0 ? "Vorderseite" : "Rückseite"}{slot === 0 ? " *" : " (optional)"}
                </p>
                {pages[slot] ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pages[slot]!} alt={slot === 0 ? "Vorderseite" : "Rückseite"} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPages((prev) => { const next = [...prev]; next[slot] = null; return next; })}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-teal-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[#1e293b] hover:border-teal-500/50 transition-all flex flex-col">
                    {activeTab === "upload" ? (
                      <button
                        onClick={() => (slot === 0 ? fileRef0 : fileRef1).current?.click()}
                        className="flex-1 flex flex-col items-center justify-center gap-2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-xs font-medium">Hochladen</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startCamera(slot)}
                        className="flex-1 flex flex-col items-center justify-center gap-2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-xs font-medium">Foto</span>
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={slot === 0 ? fileRef0 : fileRef1}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload(slot)}
                />
              </div>
            ))}
          </div>

          {/* HelloFresh hint */}
          {!hasAnyPage && (
            <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
              <FlipHorizontal className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[#94a3b8] text-xs">
                <span className="text-orange-400 font-semibold">HelloFresh-Tipp:</span> Scanne Vorder- und Rückseite der Karte — die KI kombiniert alle Infos automatisch!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && !result && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Scan button */}
      {hasAnyPage && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={handleScan}
            disabled={scanning || !pages[0]}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all relative overflow-hidden"
          >
            {scanning && (
              <motion.div
                className="absolute inset-0 bg-teal-400/20"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            )}
            <Scan className="w-5 h-5" />
            {scanning
              ? `Analysiere ${pages.filter(Boolean).length} Bild${pages.filter(Boolean).length > 1 ? "er" : ""}...`
              : `Rezept analysieren${pages[1] ? " (2 Seiten)" : ""}`}
          </button>
          {!pages[0] && (
            <p className="text-center text-[#475569] text-xs mt-2">Vorderseite ist Pflicht</p>
          )}
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="rounded-3xl bg-[#0f172a] border border-teal-500/20 overflow-hidden">
              {pages[0] && (
                <div className="relative h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pages[0]} alt="Scanned" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-teal-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Erkannt{pages[1] ? " (2 Seiten)" : ""}
                  </div>
                </div>
              )}
              <div className="p-5">
                <h2 className="text-xl font-black mb-1">{result.name}</h2>
                <p className="text-[#94a3b8] text-sm mb-4">{result.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.time > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-xl px-3 py-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs font-semibold">{result.time} Min</span>
                    </div>
                  )}
                  {result.calories > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-xl px-3 py-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-semibold">{result.calories} kcal</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-xl px-3 py-1.5">
                    <span className="text-xs font-semibold text-[#94a3b8]">{result.difficulty}</span>
                  </div>
                </div>
                {result.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {result.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm mb-3 text-[#94a3b8] uppercase tracking-wide">Zutaten</h3>
                  <div className="space-y-1.5">
                    {result.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{ing.name}</span>
                        <span className="text-[#64748b]">{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddRecipe}
              disabled={added}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${
                added ? "bg-green-500 text-white" : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-[0_0_30px_rgba(20,184,166,0.3)]"
              }`}
            >
              {added ? <><Check className="w-5 h-5" /> Hinzugefügt!</> : <><Plus className="w-5 h-5" /> Zu meinen Rezepten hinzufügen</>}
            </button>

            <button onClick={resetAll} className="w-full text-[#64748b] hover:text-[#94a3b8] py-3 text-sm font-medium transition-colors">
              Neues Rezept scannen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works — only when no images */}
      {!hasAnyPage && !result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[#0f172a] border border-white/5 p-5"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-teal-400" />
            So funktioniert&apos;s
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Vorderseite der Rezeptkarte hochladen oder fotografieren" },
              { step: "2", text: "Optional: Rückseite hinzufügen (z.B. HelloFresh-Karten)" },
              { step: "3", text: "KI analysiert alle Seiten und erstellt das vollständige Rezept" },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0">
                  {step}
                </div>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
