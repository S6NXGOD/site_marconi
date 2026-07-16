import Image from "next/image";
import type { NewsCategory } from "@prisma/client";
import { categoryCoverGradient, categoryLabels } from "@/lib/news";

type Props = {
  src: string | null;
  alt: string;
  category: NewsCategory;
  /** Tamanhos responsivos do next/image */
  sizes?: string;
  priority?: boolean;
};

/**
 * Capa da notícia.
 * - Com foto: preenche o card (object-cover), como num portal de notícias.
 * - Sem foto: fundo de marca da categoria + marca d'água — nunca fica branco.
 */
export default function NewsCover({
  src,
  alt,
  category,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: Props) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 ${categoryCoverGradient[category]} transition-transform duration-700 group-hover:scale-105`}
      aria-label={alt}
      role="img"
    >
      {/* textura sutil de pontos */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* marca d'água */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="select-none font-serif text-6xl font-bold uppercase tracking-tight text-white/10 sm:text-7xl">
          {categoryLabels[category] === "Gestão Pública" ? "CONPLAN" : "MN"}
        </span>
      </div>
    </div>
  );
}
