"use client";

import { useEffect } from "react";

export function ServiceWorkerWrapper() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("✅ Service Worker registered:", registration.scope);
          })
          .catch((error) => {
            console.error("❌ Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
