"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description: string }[];
};

// Reflete as seções que realmente existem na home.
const navItems: NavItem[] = [
  { label: "Notícias", href: "/noticias" },
  { label: "Alertas & Prazos", href: "/#alertas" },
  { label: "Áreas de Atuação", href: "/#areas-de-atuacao" },
  {
    label: "Resultados",
    href: "/#resultados",
    children: [
      {
        label: "Números do Grupo",
        href: "/#resultados",
        description: "Aprovações, municípios e anos de atuação",
      },
      {
        label: "Contas Aprovadas",
        href: "/#prova-social",
        description: "Pronunciamentos dos municípios parceiros",
      },
    ],
  },
  { label: "O Grupo", href: "/#sobre" },
];

// Ids observados para marcar a seção ativa (na ordem em que aparecem).
const SECTION_IDS = [
  "noticias",
  "alertas",
  "areas-de-atuacao",
  "sobre",
  "resultados",
  "prova-social",
  "contato",
];

const isAnchor = (href: string) => href.includes("#");
const hashOf = (href: string) => href.split("#")[1] ?? "";

export default function Header() {
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll spy: destaca no menu a seção que o usuário está lendo.
  useEffect(() => {
    if (pathname !== "/") {
      setActive(null);
      return;
    }

    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      // desconta o header fixo e só considera a seção quando ela domina a tela
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const solid = scrolled || open;

  function isItemActive(item: NavItem) {
    if (!isAnchor(item.href)) return pathname.startsWith(item.href);
    if (pathname !== "/") return false;
    if (item.children) return item.children.some((c) => hashOf(c.href) === active);
    return hashOf(item.href) === active;
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-md"
          : "bg-gradient-to-b from-black/35 to-transparent"
      }`}
    >
      <nav className="section-shell flex items-center justify-between gap-4 py-3">
        {/* Logos */}
        <Link href="/" className="flex shrink-0 flex-row items-center gap-2.5 sm:gap-3">
          <span className="relative block h-11 w-[77px] sm:h-12 sm:w-[84px]">
            <Image
              src="/logo_marconinunes.png"
              alt="Marconi Nunes Contabilidade"
              fill
              sizes="84px"
              priority
              className={`object-contain transition-opacity duration-300 ${
                solid ? "opacity-100" : "opacity-0"
              }`}
            />
            <Image
              src="/logo_marconinunes_branca.png"
              alt=""
              aria-hidden
              fill
              sizes="84px"
              priority
              className={`object-contain transition-opacity duration-300 ${
                solid ? "opacity-0" : "opacity-100"
              }`}
            />
          </span>

          <span
            className={`h-7 w-px transition-colors duration-300 ${
              solid ? "bg-slate-300" : "bg-white/25"
            }`}
            aria-hidden
          />

          <Image
            src="/conplan.png"
            alt="CONPLAN — Gestão Pública"
            width={375}
            height={214}
            priority
            className="h-11 w-auto object-contain sm:h-12"
          />
        </Link>

        {/* Menu desktop */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-7">
          <ul className="flex items-center gap-5 xl:gap-6">
            {navItems.map((item) => {
              const itemActive = isItemActive(item);

              const linkClass = `group relative flex items-center gap-1 whitespace-nowrap text-sm font-medium transition-colors ${
                solid
                  ? itemActive
                    ? "text-conplan"
                    : "text-conplan/70 hover:text-conplan"
                  : itemActive
                    ? "text-white"
                    : "text-white/80 hover:text-white"
              }`;

              const underline = (
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    itemActive ? "w-full" : "w-0"
                  } ${solid ? "bg-marconi" : "bg-marconi-light"}`}
                />
              );

              /* Item com submenu */
              if (item.children) {
                return (
                  <li key={item.label} className="relative">
                    <div className="group/menu">
                      <a href={item.href} className={linkClass} aria-haspopup="true">
                        {item.label}
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          className="mt-0.5 transition-transform duration-200 group-hover/menu:rotate-180"
                        >
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {underline}
                      </a>

                      {/* Painel: abre no hover e também no foco (teclado) */}
                      <div className="invisible absolute left-1/2 top-full z-10 w-72 -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:opacity-100">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-elegant">
                          {item.children.map((child) => (
                            <a
                              key={child.href}
                              href={child.href}
                              className={`block rounded-xl px-3 py-2.5 transition-colors hover:bg-cloud ${
                                hashOf(child.href) === active ? "bg-cloud" : ""
                              }`}
                            >
                              <span className="block text-sm font-semibold text-conplan">
                                {child.label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                                {child.description}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              /* Item simples */
              return (
                <li key={item.href}>
                  {isAnchor(item.href) ? (
                    <a href={item.href} className={linkClass}>
                      {item.label}
                      {underline}
                    </a>
                  ) : (
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                      {underline}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <a
            href="/#contato"
            className="shrink-0 whitespace-nowrap rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-marconi-dark"
          >
            Fale Conosco
          </a>
        </div>

        {/* Botão mobile */}
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors lg:hidden ${
            solid ? "text-conplan" : "text-white"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Menu mobile — lista completa, sem submenu escondido */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="max-h-[75vh] overflow-y-auto border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
        >
          <ul className="section-shell flex flex-col gap-1 py-4">
            {navItems.flatMap((item) => {
              const rows = item.children
                ? item.children.map((c) => ({ label: c.label, href: c.href }))
                : [{ label: item.label, href: item.href }];

              return rows.map((row) => {
                const rowActive =
                  pathname === "/" && isAnchor(row.href)
                    ? hashOf(row.href) === active
                    : !isAnchor(row.href) && pathname.startsWith(row.href);

                const cls = `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  rowActive
                    ? "bg-conplan-soft text-conplan"
                    : "text-conplan/80 hover:bg-conplan-soft hover:text-conplan"
                }`;

                return (
                  <li key={row.href + row.label}>
                    {isAnchor(row.href) ? (
                      <a href={row.href} onClick={() => setOpen(false)} className={cls}>
                        {row.label}
                      </a>
                    ) : (
                      <Link href={row.href} onClick={() => setOpen(false)} className={cls}>
                        {row.label}
                      </Link>
                    )}
                  </li>
                );
              });
            })}

            <li className="mt-2">
              <a
                href="/#contato"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-marconi px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Fale Conosco
              </a>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
}
