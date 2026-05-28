// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/contexts/cart-context";
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable}`}>
        <ThemeProvider><CartProvider>{children}</CartProvider></ThemeProvider>
      </body>
    </html>
  );
}
