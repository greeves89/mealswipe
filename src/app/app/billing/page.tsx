"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { PLANS, PlanKey } from "@/lib/stripe";
import { motion } from "framer-motion";
import { Check, Loader2, Crown, Zap, Users, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Star className="w-5 h-5" />,
  plus: <Zap className="w-5 h-5" />,
  family: <Users className="w-5 h-5" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  plus: "from-teal-500 to-teal-600",
  family: "from-orange-500 to-orange-600",
};

const PLAN_BORDER: Record<string, string> = {
  free: "border-slate-500/30",
  plus: "border-teal-500/30",
  family: "border-orange-500/30",
};

function BillingContent() {
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const user = await res.json();
        setUserEmail(user.email ?? "");
        if (user.plan) {
          setCurrentPlan(user.plan as PlanKey);
        }
      } catch {
        // Gracefully handle error — stay with default free plan
      }
    }
    fetchProfile();
  }, []);

  const handleUpgrade = async (plan: PlanKey) => {
    if (plan === "free") return;
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // handle error
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="px-4 py-6">
      {/* Success banner */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <p className="text-teal-400 font-semibold text-sm">
              Upgrade erfolgreich!
            </p>
            <p className="text-[#64748b] text-xs">
              Dein Plan wurde aktiviert. Viel Spaß!
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-orange-400" />
          <h1 className="text-xl font-black text-[#f8fafc]">
            Abonnement
          </h1>
        </div>
        <p className="text-[#64748b] text-sm">
          Aktueller Plan:{" "}
          <span className="text-teal-400 font-semibold capitalize">
            {currentPlan}
          </span>
        </p>
      </div>

      {/* Plan cards */}
      <div className="space-y-4">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
          ([key, plan], i) => {
            const isCurrentPlan = currentPlan === key;
            const isPaid = key !== "free";

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-[#0f172a] rounded-2xl border ${
                  isCurrentPlan
                    ? PLAN_BORDER[key]
                    : "border-white/5"
                } p-5 relative overflow-hidden`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-3 right-3 bg-teal-500/20 border border-teal-500/30 rounded-full px-2.5 py-1">
                    <span className="text-teal-400 text-xs font-semibold">
                      Aktuell
                    </span>
                  </div>
                )}

                {key === "plus" && !isCurrentPlan && (
                  <div className="absolute top-3 right-3 bg-orange-500/20 border border-orange-500/30 rounded-full px-2.5 py-1">
                    <span className="text-orange-400 text-xs font-semibold">
                      Beliebt
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAN_COLORS[key]} flex items-center justify-center text-white`}
                  >
                    {PLAN_ICONS[key]}
                  </div>
                  <div>
                    <h3 className="text-[#f8fafc] font-bold">{plan.name}</h3>
                    <p className="text-[#64748b] text-sm">
                      {plan.price === 0
                        ? "Kostenlos"
                        : `${plan.price.toFixed(2).replace(".", ",")} €/Monat`}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-[#94a3b8]"
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-gradient-to-br ${PLAN_COLORS[key]} flex items-center justify-center flex-shrink-0`}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isPaid && !isCurrentPlan && (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={loadingPlan === key}
                    className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${PLAN_COLORS[key]} hover:opacity-90 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-all`}
                  >
                    {loadingPlan === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Auf ${plan.name} upgraden`
                    )}
                  </button>
                )}

                {isCurrentPlan && isPaid && (
                  <p className="text-center text-[#475569] text-xs">
                    Kontakt:{" "}
                    <a
                      href={`mailto:support@forkly.site?subject=Subscription&body=Konto: ${userEmail}`}
                      className="text-teal-400 hover:underline"
                    >
                      support@forkly.site
                    </a>
                  </p>
                )}

                {key === "free" && isCurrentPlan && (
                  <p className="text-[#475569] text-xs text-center">
                    Upgrade für unbegrenzte Features
                  </p>
                )}
              </motion.div>
            );
          }
        )}
      </div>

      <p className="text-center text-[#334155] text-xs mt-6">
        Alle Preise inkl. MwSt. · Monatlich kündbar
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
