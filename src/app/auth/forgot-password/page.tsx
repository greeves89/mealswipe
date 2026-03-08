"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChefHat, ArrowLeft, Info } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#f8fafc]">Passwort vergessen?</h1>
          <p className="text-[#64748b] text-sm mt-1 text-center">
            Wir kümmern uns darum.
          </p>
        </div>

        <div className="bg-[#0f172a] border border-teal-500/20 rounded-2xl p-6 mb-6 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
            <Info className="w-6 h-6 text-teal-400" />
          </div>
          <p className="text-[#94a3b8] text-sm leading-relaxed">
            Password-Reset-Funktion kommt bald!
          </p>
          <p className="text-[#475569] text-xs">
            Bitte wende dich in der Zwischenzeit an{" "}
            <a
              href="mailto:support@mealswipe.app"
              className="text-teal-400 hover:underline"
            >
              support@mealswipe.app
            </a>
          </p>
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-teal-400 font-semibold hover:text-teal-300 transition-colors text-sm"
        >
          <ArrowLeft className="w-3 h-3" />
          Zurück zur Anmeldung
        </Link>
      </motion.div>
    </div>
  );
}
