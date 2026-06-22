// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/contexts/cart-context";
import { CustomerAuthProvider } from "@/contexts/customer-auth-context";
import { Toaster } from "@/components/toaster";
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

export const metadata: Metadata = {
  title: "ED Barbearia",
  description: "Barbearia em Recife — agendamentos e serviços",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ED Barbearia",
  },
};

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
        <ThemeProvider><CustomerAuthProvider><CartProvider>{children}<Toaster /></CartProvider></CustomerAuthProvider></ThemeProvider>
      </body>
    </html>
  );
}
