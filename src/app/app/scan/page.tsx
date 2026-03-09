"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Scan, ChefHat, Clock, Flame, Plus, X, Check } from "lucide-react";

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

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedRecipe | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!supportedTypes.includes(file.type) && !file.type.startsWith("image/")) {
      setError("Nur Bilder erlaubt (JPG, PNG, WEBP). PDFs werden nicht unterstützt.");
      return;
    }
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setResult(null);
      setAdded(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
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
    setPreview(dataUrl);
    stopCamera();
    setResult(null);
    setAdded(false);
  };

  const handleScan = async () => {
    if (!preview) return;
    setScanning(true);
    setError(null);

    try {
      // Extract base64
      const base64 = preview.split(",")[1] || preview;

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!response.ok) throw new Error("Scan fehlgeschlagen");
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
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      setAdded(true);
      setTimeout(() => {
        setResult(null);
        setPreview(null);
        setAdded(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rezept konnte nicht gespeichert werden");
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (stream) stopCamera();
    setActiveTab(tab);
    setPreview(null);
    setResult(null);
    setError(null);
    if (tab === "camera") {
      setTimeout(startCamera, 100);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black">Rezept Scanner</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Scanne Rezeptkarten mit KI-Erkennung
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#0f172a] p-1.5 rounded-2xl">
        {([
          { id: "upload" as Tab, icon: Upload, label: "Bild hochladen" },
          { id: "camera" as Tab, icon: Camera, label: "Foto aufnehmen" },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-[#1e293b] text-white shadow-sm"
                : "text-[#64748b] hover:text-[#94a3b8]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Camera view */}
      {activeTab === "camera" && !preview && (
        <div className="relative rounded-3xl overflow-hidden bg-[#0f172a] border border-white/5">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />
          {stream && (
            <>
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-teal-400 rounded-xl">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400 rounded-br" />
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
            </>
          )}
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startCamera}
                className="flex items-center gap-2 bg-teal-500 text-white px-5 py-3 rounded-xl font-semibold"
              >
                <Camera className="w-5 h-5" />
                Kamera starten
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload area */}
      {activeTab === "upload" && !preview && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#1e293b] hover:border-teal-500/50 rounded-3xl p-10 text-center cursor-pointer transition-all hover:bg-teal-500/5"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-[#64748b]" />
          </div>
          <p className="font-semibold text-[#94a3b8]">Bild hierher ziehen</p>
          <p className="text-[#475569] text-sm mt-1">oder tippen um zu wählen</p>
          <p className="text-[#475569] text-xs mt-3">JPG, PNG, WEBP</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Preview + scan */}
      {preview && !result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative rounded-3xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vorschau"
              className="w-full h-56 object-cover"
            />
            {scanning && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full mb-3"
                />
                <p className="text-teal-400 text-sm font-semibold">KI analysiert Bild...</p>
                {/* Scanner line */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-teal-400/50"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}
            <button
              onClick={() => { setPreview(null); setError(null); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all"
          >
            <Scan className="w-5 h-5" />
            {scanning ? "Analysiert..." : "Rezept analysieren"}
          </button>
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
            {/* Result card */}
            <div className="rounded-3xl bg-[#0f172a] border border-teal-500/20 overflow-hidden">
              {preview && (
                <div className="relative h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Scanned" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-teal-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Erkannt
                  </div>
                </div>
              )}

              <div className="p-5">
                <h2 className="text-xl font-black mb-1">{result.name}</h2>
                <p className="text-[#94a3b8] text-sm mb-4">{result.description}</p>

                {/* Meta */}
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

                {/* Tags */}
                {result.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {result.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ingredients */}
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

            {/* Add button */}
            <button
              onClick={handleAddRecipe}
              disabled={added}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-[0_0_30px_rgba(20,184,166,0.3)]"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  Hinzugefügt!
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Zu meinen Rezepten hinzufügen
                </>
              )}
            </button>

            <button
              onClick={() => { setResult(null); setPreview(null); }}
              className="w-full text-[#64748b] hover:text-[#94a3b8] py-3 text-sm font-medium transition-colors"
            >
              Neues Bild scannen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works */}
      {!preview && !result && (
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
              { step: "1", text: "Foto deiner Rezeptkarte aufnehmen oder hochladen (HelloFresh, Chefkoch, etc.)" },
              { step: "2", text: "KI-Analyse erkennt automatisch alle Rezeptinformationen" },
              { step: "3", text: "Rezept zu deiner Sammlung hinzufügen und einplanen" },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0">
                  {step}
                </div>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Example card hint */}
          <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-orange-400 text-xs font-semibold mb-1">TIPP</p>
            <p className="text-[#94a3b8] text-xs">
              Halte die Rezeptkarte gerade und gut beleuchtet. Funktioniert auch mit Fotos aus Kochbüchern!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
