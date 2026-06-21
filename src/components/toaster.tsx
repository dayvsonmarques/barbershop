"use client";

import { useEffect, useState } from "react";
import { subscribeToast, type ToastEntry } from "@/lib/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => { return subscribeToast(setToasts); }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-5 py-3 bg-background-primary border border-gold/40 shadow-lg text-sm text-text-primary animate-fade-in-up"
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
