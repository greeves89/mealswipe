"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Star, Bug, Lightbulb, MessageCircle, Check } from "lucide-react";

type FeedbackType = "bug" | "feature" | "general";

const TYPES: { id: FeedbackType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "bug", label: "Bug melden", icon: <Bug className="w-4 h-4" />, desc: "Etwas funktioniert nicht" },
  { id: "feature", label: "Feature-Wunsch", icon: <Lightbulb className="w-4 h-4" />, desc: "Idee oder Verbesserung" },
  { id: "general", label: "Allgemein", icon: <MessageCircle className="w-4 h-4" />, desc: "Sonstiges Feedback" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: Props) {
  const [type, setType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setType("general");
    setRating(0);
    setMessage("");
    setDone(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rating: rating || null, message }),
      });
      setDone(true);
      setTimeout(() => { handleClose(); }, 2000);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            {done ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-teal-400" />
                </motion.div>
                <p className="text-[#f8fafc] font-bold text-lg">Danke für dein Feedback!</p>
                <p className="text-[#64748b] text-sm text-center">Wir schauen uns das an.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-black text-[#f8fafc]">Feedback geben</h2>
                  <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-[#94a3b8]" />
                  </button>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        type === t.id
                          ? "bg-teal-500/10 border-teal-500/40 text-teal-400"
                          : "bg-[#1e293b] border-white/5 text-[#64748b] hover:border-white/10"
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Star rating */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                    Bewertung (optional)
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(rating === n ? 0 : n)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            n <= rating ? "text-yellow-400 fill-yellow-400" : "text-[#334155]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                    Nachricht *
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === "bug"
                        ? "Was ist passiert? Wie kann man es nachstellen?"
                        : type === "feature"
                        ? "Was würdest du dir wünschen?"
                        : "Dein Feedback…"
                    }
                    rows={4}
                    className="w-full bg-[#1e293b] border border-white/10 focus:border-teal-500/50 rounded-2xl px-4 py-3 text-[#f8fafc] placeholder-[#334155] text-sm outline-none resize-none transition-colors"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || sending}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold transition-all"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Senden…" : "Feedback senden"}
                </button>
              </>
            )}
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
