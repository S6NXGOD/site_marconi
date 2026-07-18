import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // ⚠️ Obrigatório: src/lib define strings de classe (gradientes das capas,
    // badges de categoria). Sem isso o Tailwind não gera essas classes e os
    // elementos ficam sem fundo — foi o que apagou a faixa da notícia.
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CONPLAN — Gestão Pública
        conplan: {
          DEFAULT: "#0A192F", // Azul Marinho Profundo
          light: "#112240",
          soft: "#F4F7FB", // fundo azul muito sutil
        },
        // Marconi Nunes — Setor Comercial
        marconi: {
          DEFAULT: "#B8942E", // Dourado/Mostarda escurecido
          light: "#D4AF37", // Dourado original
          dark: "#8A6E1F",
        },
        ink: "#0B1220",
        cloud: "#F8FAFC",
      },
      fontFamily: {
        // Serifada para títulos, Sans-serif para textos
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        elegant: "0 20px 50px -12px rgba(10, 25, 47, 0.25)",
        gold: "0 18px 40px -12px rgba(184, 148, 46, 0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Anel de alerta: expande e some devagar (mais suave que o animate-ping padrão)
        "soft-ping": {
          "0%": { transform: "scale(1)", opacity: "0.45" },
          "70%": { transform: "scale(1.9)", opacity: "0" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        // "Respiração": escala mínima, só para chamar o olhar sem incomodar
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.035)" },
        },
        // Sino balançando: usado só quando há prazo HOJE ou AMANHÃ. Toca em
        // rajadas (a maior parte do ciclo fica parado) para alertar sem cansar.
        sino: {
          "0%, 82%, 100%": { transform: "rotate(0deg)" },
          "85%": { transform: "rotate(11deg)" },
          "88%": { transform: "rotate(-9deg)" },
          "91%": { transform: "rotate(7deg)" },
          "94%": { transform: "rotate(-5deg)" },
          "97%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "soft-ping": "soft-ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite",
        breathe: "breathe 3.2s ease-in-out infinite",
        sino: "sino 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
