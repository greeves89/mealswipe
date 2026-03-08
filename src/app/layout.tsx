import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { CookieBanner } from "@/components/CookieBanner";

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "forkly — Mahlzeiten, die du liebst",
  description:
    "Scanne Rezeptkarten, swipe deine Woche, lass einkaufen. KI-gestützter Mahlzeitenplaner.",
  keywords: ["Mahlzeitenplaner", "Rezepte", "Einkaufsliste", "HelloFresh", "KI"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "forkly",
  },
  openGraph: {
    title: "forkly — Mahlzeiten, die du liebst",
    description: "KI-gestützter Mahlzeitenplaner. Rezepte swipen, Wochenplan erstellen, Einkaufen.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <ServiceWorkerRegister />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
