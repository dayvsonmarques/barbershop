// src/components/footer.tsx
"use client";

import { useEffect, useState } from "react";
import { usePWABanner } from "@/contexts/pwa-banner-context";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABEL: Record<string, string> = {
  monday: "Seg", tuesday: "Ter", wednesday: "Qua", thursday: "Qui",
  friday: "Sex", saturday: "Sáb", sunday: "Dom",
};

function formatHourRange(range: string): string {
  const [start, end] = range.split("-");
  const fmt = (t: string) => t.replace(/^0/, "").replace(":00", "h").replace(/:(\d+)/, "h$1");
  return end ? `${fmt(start)} às ${fmt(end)}` : range;
}

function formatOpeningHours(raw?: string): string {
  if (!raw) return "Horário não informado";
  let parsed: Record<string, string>;
  try { parsed = JSON.parse(raw); } catch { return raw; }

  const days = DAY_KEYS.filter((d) => parsed[d]);
  const groups: { days: string[]; hours: string }[] = [];

  for (const day of days) {
    const hours = parsed[day];
    const last = groups[groups.length - 1];
    if (last && last.hours === hours) {
      last.days.push(DAY_LABEL[day]);
    } else {
      groups.push({ days: [DAY_LABEL[day]], hours });
    }
  }

  return groups
    .filter(({ hours }) => hours.toLowerCase() !== "fechado")
    .map(({ days: ds, hours }) => {
      const label = ds.length > 2 ? `${ds[0]} a ${ds[ds.length - 1]}` : ds.join(", ");
      return `${label}: ${formatHourRange(hours)}`;
    })
    .join(" | ");
}

type PublicSettings = {
  name?: string;
  openingHours?: string;
};


export function Footer() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const { bannerVisible } = usePWABanner();

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setSettings(json.data as PublicSettings);
      })
      .catch(() => {});
  }, []);

  const storeName = settings?.name ?? "Barbearia";
  const hoursSummary = formatOpeningHours(settings?.openingHours);

  const signature = (
    <div className={`group m-2.5 ${bannerVisible ? "relative" : "fixed bottom-4 right-4 z-50"}`}>
      <span className="pointer-events-none absolute bottom-full right-0 mb-4 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Desenvolvido por Web Dev Studio
      </span>
      <a
        href="https://webdev.recife.br/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Desenvolvido por webdev.recife.br"
        className="flex items-center justify-center w-11 h-11 rotate-45 border transition-colors duration-200
          border-[#C9A84C] hover:bg-[#C9A84C]/10
          dark:border-white dark:hover:border-[#C9A84C]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="-rotate-45 w-6 h-6 text-[#C9A84C] dark:text-white dark:group-hover:text-[#C9A84C] transition-colors duration-200"
        >
          <path d="M8 6L3 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 4.5L9.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 6L21 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
  );

  return (
    <>
    {!bannerVisible && signature}
    <footer className={`bg-background-primary border-t border-gold/30 py-16`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-4">
          <div>
            <p className="font-heading text-gold text-2xl font-bold mb-3">
              {storeName}
            </p>
            <p className="text-text-secondary text-lg leading-relaxed">
              Tradição, estilo e precisão.
            </p>
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mt-4">
              Horário de funcionamento
            </p>
            <p className="text-text-secondary text-lg mt-1">{hoursSummary}</p>
          </div>

        </div>

        {bannerVisible && <div className="flex justify-end mb-4">{signature}</div>}

        <div className="border-t border-border pt-6">
          <p className="text-text-secondary text-sm text-center">
            {new Date().getFullYear()} {storeName} © Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
