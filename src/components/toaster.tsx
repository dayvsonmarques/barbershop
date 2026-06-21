"use client";

import { useEffect, useState } from "react";
import { subscribeToast, type ToastEntry } from "@/lib/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => { return subscribeToast(setToasts); }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-3 right-3 z-200 flex flex-col gap-2 items-stretch pointer-events-none sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-5 py-4 text-base bg-background-primary border border-gold/40 shadow-lg text-text-primary animate-fade-in-up sm:py-3 sm:text-sm"
        >
          <span className={t.type === "add" ? "text-gold" : "text-text-secondary"}>
            {t.type === "add" ? "✓" : "×"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
