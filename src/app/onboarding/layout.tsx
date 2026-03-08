"use client";
import { AppProvider } from "@/lib/store";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
