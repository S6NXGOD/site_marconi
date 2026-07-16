"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SignOutButton from "./SignOutButton";

const links = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" />,
  },
  {
    href: "/admin/noticias",
    label: "Notícias",
    exact: false,
    icon: <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" />,
  },
  {
    href: "/admin/alertas",
    label: "Alertas & Prazos",
    exact: false,
    icon: (
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ),
  },
  {
    href: "/admin/aprovacoes",
    label: "Contas Aprovadas",
    exact: false,
    icon: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M10 9l5 3-5 3V9z" />
      </>
    ),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    exact: false,
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    href: "/admin/areas",
    label: "Áreas de Atuação",
    exact: false,
    icon: (
      <path d="M3 21h18M6 21V9l6-4 6 4v12M9 21v-6h6v6M10.5 9.5h.01M13.5 9.5h.01" />
    ),
  },
  {
    href: "/admin/whatsapp",
    label: "WhatsApp",
    exact: false,
    icon: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
  },
];

function Logos({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-row items-center gap-2.5">
      <Image
        src="/logo_marconinunes_branca.png"
        alt="Marconi Nunes"
        width={375}
        height={214}
        className={compact ? "h-8 w-auto object-contain" : "h-10 w-auto object-contain"}
        priority
      />
      <span className="h-5 w-px bg-white/20" aria-hidden />
      <Image
        src="/conplan.png"
        alt="CONPLAN"
        width={375}
        height={214}
        className={compact ? "h-8 w-auto object-contain" : "h-10 w-auto object-contain"}
        priority
      />
    </span>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = isActive(link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            // min-h-11 = alvo de toque confortável no celular
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-marconi text-white shadow-gold"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              {link.icon}
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Rodape({ userName }: { userName?: string | null }) {
  return (
    <div className="border-t border-white/10 px-4 py-4">
      {userName && (
        <Link
          href="/admin/conta"
          className="mb-2 block rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          Conectado como{" "}
          <span className="font-semibold text-white">{userName}</span>
          <span className="mt-0.5 block text-[11px] text-marconi-light">
            Minha conta · trocar senha
          </span>
        </Link>
      )}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          Ver site
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}

export default function AdminShell({
  userName,
  children,
}: {
  userName?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu ao navegar e trava o scroll do fundo enquanto aberto.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-cloud lg:grid lg:grid-cols-[260px_1fr]">
      {/* ——— Sidebar fixa (desktop) ——— */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-conplan lg:flex">
        <div className="border-b border-white/10 px-6 py-5">
          <Link href="/admin">
            <Logos />
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-marconi-light">
            Portal do Grupo
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <NavLinks />
        </div>
        <Rodape userName={userName} />
      </aside>

      {/* ——— Barra superior (mobile) ——— */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-conplan px-4 py-3 lg:hidden">
        <Link href="/admin" className="min-w-0">
          <Logos compact />
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* ——— Gaveta (mobile) ——— */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu do painel"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-conplan shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <Logos compact />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>

              <Rodape userName={userName} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ——— Conteúdo ——— */}
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
