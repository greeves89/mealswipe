"use client";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Poll for updates every 60 seconds while the app is open
      const interval = setInterval(() => registration.update(), 60_000);

      // When a new SW is found, activate it immediately
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      return () => clearInterval(interval);
    }).catch(() => {
      // SW registration failed — app still works without it
    });

    // Reload once when a new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);

  return null;
}
