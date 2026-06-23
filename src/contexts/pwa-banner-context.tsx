"use client";
import { createContext, useContext, useState } from "react";

type Ctx = { bannerVisible: boolean; setBannerVisible: (v: boolean) => void };

const PWABannerContext = createContext<Ctx>({ bannerVisible: false, setBannerVisible: () => {} });

export function PWABannerProvider({ children }: { children: React.ReactNode }) {
  const [bannerVisible, setBannerVisible] = useState(false);
  return (
    <PWABannerContext.Provider value={{ bannerVisible, setBannerVisible }}>
      {children}
    </PWABannerContext.Provider>
  );
}

export const usePWABanner = () => useContext(PWABannerContext);
