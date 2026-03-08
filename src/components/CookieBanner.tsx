"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "forkly-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage not available (SSR / private mode)
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 z-[100] max-w-xl mx-auto"
        >
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/40 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cookie className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#f8fafc] mb-1">
                Wir verwenden Cookies
              </p>
              <p className="text-xs text-[#64748b] leading-relaxed">
                forkly nutzt ausschließlich technisch notwendige Cookies (Session-Cookie für die Anmeldung) sowie Zahlungs-Cookies von Stripe beim Checkout. Keine Tracking- oder Werbe-Cookies.{" "}
                <Link href="/datenschutz" className="text-teal-400 hover:underline">
                  Datenschutz
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-1">
              <button
                onClick={accept}
                className="bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
              >
                OK, verstanden
              </button>
              <button
                onClick={accept}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Schließen"
              >
                <X className="w-3.5 h-3.5 text-[#64748b]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
