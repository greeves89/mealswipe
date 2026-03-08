"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ChefHat, Loader2, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      }
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-2xl font-black text-[#f8fafc] mb-2">
            E-Mail versendet
          </h2>
          <p className="text-[#64748b] mb-6">
            Wir haben einen Link zum Zurücksetzen des Passworts an{" "}
            <span className="text-teal-400 font-medium">{email}</span> gesendet.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-2xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Anmeldung
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#f8fafc]">Passwort vergessen?</h1>
          <p className="text-[#64748b] text-sm mt-1 text-center">
            Gib deine E-Mail ein und wir senden dir einen Reset-Link.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 text-red-400 text-sm mb-4"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              E-Mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="deine@email.de"
                autoComplete="email"
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-[#f8fafc] placeholder-[#334155] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-60 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Reset-Link senden"
            )}
          </button>
        </form>

        <p className="text-center text-[#475569] text-sm mt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-teal-400 font-semibold hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Zurück zur Anmeldung
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
