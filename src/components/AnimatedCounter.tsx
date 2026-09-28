"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

type Props = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  /**
   * Quanto o número precisa entrar na tela para começar. Só na vertical: uma
   * margem negativa nas laterais deixava o "0" inicial — estreito e colado na
   * borda esquerda no celular — de fora para sempre, e o contador nunca subia.
   */
  margem?: string;
};

// Contador que anima de 0 até `to` quando entra na viewport (framer-motion).
export default function AnimatedCounter({
  to,
  duration = 2,
  prefix = "",
  suffix = "",
  margem = "-80px 0px",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: margem as `${number}px` });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {Math.round(value).toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}
