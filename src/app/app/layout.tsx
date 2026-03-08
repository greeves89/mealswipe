"use client";
export const dynamic = "force-dynamic";
import { AppProvider } from "@/lib/store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Flame, Calendar, ShoppingCart, User, Camera, BookOpen, ScanLine, Package } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/app/swipe", icon: Flame, label: "Swipen" },
  { href: "/app/recipes", icon: BookOpen, label: "Kochen" },
  { href: "/app/scan", icon: ScanLine, label: "Scan" },
  { href: "/app/shopping", icon: ShoppingCart, label: "Liste" },
  { href: "/app/lager", icon: Package, label: "Lager" },
  { href: "/app/profile", icon: User, label: "Profil" },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 ${
                isActive ? "text-teal-400" : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-teal-400/10" : ""}`}>
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-teal-400" : ""}`} />
              </div>
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar() {
  const [avatarLetter, setAvatarLetter] = useState("M");
  const [planBadge, setPlanBadge] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;

        const user = await res.json();
        const letter =
          user.name?.charAt(0).toUpperCase() ||
          user.email?.charAt(0).toUpperCase() ||
          "M";
        setAvatarLetter(letter);

        if (user.plan && user.plan !== "free") {
          setPlanBadge(user.plan);
        }
      } catch {
        // Gracefully handle error — keep default avatar
      }
    }
    fetchUser();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            forkly
          </span>
        </div>
        <div className="flex items-center gap-2">
          {planBadge && (
            <span className="text-xs font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 capitalize">
              {planBadge}
            </span>
          )}
          <Link href="/app/profile">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform">
              {avatarLetter}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
        <TopBar />
        <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}
