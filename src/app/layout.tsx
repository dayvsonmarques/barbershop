// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/contexts/cart-context";
import { CustomerAuthProvider } from "@/contexts/customer-auth-context";
import { Toaster } from "@/components/toaster";
import { PWARegister } from "@/components/pwa-register";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWABannerProvider } from "@/contexts/pwa-banner-context";
import { DEFAULT_SITE_NAME, getSiteSettings, getSiteUrl } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.name ?? DEFAULT_SITE_NAME;
  const description = settings?.address
    ? `${name}: cortes, barba e cuidados masculinos com agendamento online. ${settings.address}.`
    : `${name}: cortes, barba e cuidados masculinos com agendamento online.`;

  // Meta tags de geolocalização (GEO) quando há coordenadas cadastradas
  const geo: Record<string, string> = {};
  if (settings?.hasCoords) {
    geo["geo.position"] = `${settings.latitude};${settings.longitude}`;
    geo["ICBM"] = `${settings.latitude}, ${settings.longitude}`;
  }
  if (settings?.address) geo["geo.placename"] = settings.address;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `${name} | Agendamento online`, template: `%s | ${name}` },
    description,
    applicationName: name,
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: name,
      title: name,
      description,
      images: [{ url: "/barbershop.png", width: 1672, height: 941, alt: name }],
    },
    twitter: { card: "summary_large_image", title: name, description, images: ["/barbershop.png"] },
    robots: { index: true, follow: true },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: name,
    },
    other: geo,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#111111" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${playfair.variable} ${inter.variable}`}>
        <ThemeProvider><CustomerAuthProvider><CartProvider><PWABannerProvider>{children}<Toaster /><PWARegister /><PWAInstallPrompt /></PWABannerProvider></CartProvider></CustomerAuthProvider></ThemeProvider>
      </body>
    </html>
  );
}
