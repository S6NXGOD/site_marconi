"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

const links = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: (
      <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" />
    ),
  },
  {
    href: "/admin/noticias",
    label: "Notícias",
    exact: false,
    icon: (
      <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" />
    ),
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
];

export default function AdminSidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex h-full flex-col bg-conplan text-white">
      {/* Logos */}
      <div className="border-b border-white/10 px-6 py-5">
        <Link href="/admin" className="flex flex-row items-center gap-2.5">
          <Image
            src="/logo_marconinunes_branca.png"
            alt="Marconi Nunes"
            width={375}
            height={214}
            className="h-10 w-auto object-contain"
          />
          <span className="h-6 w-px bg-white/20" aria-hidden />
          <Image
            src="/conplan.png"
            alt="CONPLAN"
            width={375}
            height={214}
            className="h-10 w-auto object-contain"
          />
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-marconi-light">
          Portal do Grupo
        </p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {links.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-marconi text-white shadow-gold"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {link.icon}
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé com usuário e logout */}
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
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Ver site
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
