import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SITE_URL, SITE_NAME, IS_INDEXABLE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { organizacaoSchema, siteSchema } from "@/lib/schema";
import RegisterPWA from "@/components/RegisterPWA";
import Pulso from "@/components/Pulso";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `maximumScale`/`userScalable` NÃO são travados de propósito: impedir o
  // pinch-zoom prejudica quem precisa ampliar para ler. O zoom automático
  // indesejado do iOS é resolvido pela fonte de 16px nos campos (globals.css).
  themeColor: "#0A192F",
};

// Entre 120 e 160 caracteres: acima disso o Google trunca nos resultados.
const DESCRICAO =
  "Grupo Dr. Marconi Nunes: contabilidade e gestão pública no Piauí. Assessoria a prefeituras (CONPLAN) e empresas — áreas fiscal, contábil, RH e societária.";

export const metadata: Metadata = {
  // Necessário para OpenGraph/Twitter resolverem URLs absolutas.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Grupo Dr. Marconi Nunes | Gestão Pública & Contabilidade",
    template: "%s | Grupo Dr. Marconi Nunes",
  },
  applicationName: `Portal ${SITE_NAME}`,
  description: DESCRICAO,
  /*
   * Ícones e imagem social vêm das convenções de arquivo do App Router
   * (`app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`) — o Next
   * injeta as tags com o hash certo, o que evita cache de favicon antigo.
   */
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
  robots: IS_INDEXABLE
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : { index: false, follow: false }, // não indexa preview/dev
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: `Portal ${SITE_NAME}`,
    url: SITE_URL,
    title: "Grupo Dr. Marconi Nunes | Gestão Pública & Contabilidade",
    description: DESCRICAO,
  },
  twitter: {
    card: "summary_large_image",
    title: "Grupo Dr. Marconi Nunes | Gestão Pública & Contabilidade",
    description: DESCRICAO,
  },
  // Google Search Console: o código da meta tag de verificação vai na variável
  // GOOGLE_SITE_VERIFICATION (Railway). Não carrega script nenhum no site — é
  // o painel do próprio Google que mostra buscas, cliques e erros de indexação.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Contabilidade",
  // Evita o iOS transformar números soltos em links de telefone.
  formatDetection: { telephone: false, address: false, email: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {children}
        {/* Identidade da empresa e do site para os buscadores. */}
        <JsonLd data={organizacaoSchema()} />
        <JsonLd data={siteSchema()} />
        <RegisterPWA />
        {/* Audiência (painel → Audiência): sem cookie, sem dado pessoal. */}
        <Pulso />
      </body>
    </html>
  );
}
