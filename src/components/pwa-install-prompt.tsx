"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePWABanner } from "@/contexts/pwa-banner-context";

type Platform = "ios" | "android" | "other";

function detect(): { mobile: boolean; platform: Platform; standalone: boolean } {
  const ua = navigator.userAgent;
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  const platform: Platform = /iphone|ipad|ipod/i.test(ua) ? "ios" : /android/i.test(ua) ? "android" : "other";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return { mobile, platform, standalone };
}

const IOS_STEPS = [
  <>Toque no ícone de <strong>Compartilhar</strong> ⬆ na barra do Safari</>,
  <>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong> +</>,
  <>Toque em <strong>Adicionar</strong> para confirmar</>,
  <>Permita as <strong>Notificações</strong> 🔔</>,
];

const ANDROID_STEPS = [
  <>Toque no menu <strong>⋮</strong> no canto superior direito</>,
  <>Toque em <strong>Adicionar à tela inicial</strong></>,
  <>Toque em <strong>Adicionar</strong> para confirmar</>,
  <>Permita as <strong>Notificações</strong> 🔔</>,
];

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { setBannerVisible } = usePWABanner();
  const pathname = usePathname();

  if (pathname.startsWith("/painel-gerenciar")) return null;
  const [platform, setPlatform] = useState<Platform>("ios");
  const [footerVisible, setFooterVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt(): void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    const { mobile, platform, standalone } = detect();
    if (!mobile || standalone) return;
    if (localStorage.getItem("pwa-dismissed")) return;

    setPlatform(platform);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt(): void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener("beforeinstallprompt", handler);

    const t = setTimeout(() => { setVisible(true); setBannerVisible(true); }, 2500);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterVisible(entry.isIntersecting);
        setBannerVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [visible, setBannerVisible]);

  function dismiss() {
    localStorage.setItem("pwa-dismissed", "1");
    setVisible(false);
    setShowModal(false);
    setBannerVisible(false);
  }

  async function handleInstall() {
    if (platform === "android" && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") dismiss();
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  }

  if (!visible) return null;

  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <>
      {/* Bottom banner */}
      {!showModal && !footerVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="rounded-2xl bg-white shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="ED Barbearia" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">Instale o Ed Barbearia</p>
              <p className="text-xs text-gray-500">Acesso rápido + notificações</p>
            </div>
            <button
              onClick={dismiss}
              className="text-gray-300 hover:text-gray-500 shrink-0 p-1"
              aria-label="Fechar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleInstall}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shrink-0"
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      {/* Install instructions modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gray-900 px-8 pt-8 pb-6 text-center">
              <div className="mb-3 flex justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 6h6M9 9h6M9 12h3" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Adicione à tela inicial</h2>
              <p className="text-sm text-gray-400">
                Acesse o Ed Barbearia como um app, direto da sua tela inicial.
              </p>
            </div>

            <div className="px-8 py-6">
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[#C9A84C] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <button
                onClick={dismiss}
                className="mt-6 w-full rounded-xl bg-[#C9A84C] py-3.5 text-sm font-semibold text-white hover:bg-[#A07830] transition-colors"
              >
                Pronto, já sei como fazer!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
