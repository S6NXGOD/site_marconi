import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SITE_URL, SITE_NAME, IS_INDEXABLE } from "@/lib/site";
import "./globals.css";

// Sans-serif para textos
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Serifada para títulos
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // Necessário para OpenGraph/Twitter resolverem URLs absolutas.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Grupo Dr. Marconi Nunes | Gestão Pública & Contabilidade",
    template: "%s | Grupo Dr. Marconi Nunes",
  },
  applicationName: SITE_NAME,
  robots: IS_INDEXABLE
    ? { index: true, follow: true }
    : { index: false, follow: false }, // não indexa preview/dev
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  description:
    "Portal institucional do Grupo Dr. Marconi Nunes: CONPLAN — assessoria a prefeituras e municípios — e Marconi Nunes Contabilidade, com as áreas Fiscal e Tributária, Contábil, RH e Departamento Pessoal e Societária e Legalização.",
  keywords: [
    "CONPLAN",
    "gestão pública",
    "prefeituras",
    "municípios",
    "Marconi Nunes",
    "contabilidade",
    "área fiscal e tributária",
    "departamento pessoal",
    "societária e legalização",
    "setor privado",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
