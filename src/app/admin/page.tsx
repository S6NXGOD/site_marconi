import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  categoryLabels,
  categoryBadgeClasses,
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
} from "@/lib/news";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const toneClasses = {
  danger: "text-red-600",
  warning: "text-amber-600",
  neutral: "text-slate-400",
} as const;

async function getDashboardData() {
  const [
    latestNews,
    totalNews,
    publishedNews,
    latestLeads,
    totalLeads,
    upcomingAlerts,
    activeAlerts,
  ] = await Promise.all([
    prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        isPublished: true,
        createdAt: true,
      },
    }),
    prisma.news.count(),
    prisma.news.count({ where: { isPublished: true } }),
    prisma.commercialLead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.commercialLead.count(),
    prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.alert.count({ where: { isActive: true } }),
  ]);

  return {
    latestNews,
    totalNews,
    publishedNews,
    latestLeads,
    totalLeads,
    upcomingAlerts,
    activeAlerts,
  };
}

export default async function AdminDashboard() {
  const {
    latestNews,
    totalNews,
    publishedNews,
    latestLeads,
    totalLeads,
    upcomingAlerts,
    activeAlerts,
  } = await getDashboardData();

  const stats = [
    { label: "Notícias publicadas", value: publishedNews },
    { label: "Notícias no total", value: totalNews },
    { label: "Alertas ativos", value: activeAlerts },
    { label: "Leads capturados", value: totalLeads },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral do portal, dos prazos e dos contatos do Grupo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/noticias/nova"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nova notícia
          </Link>
          <Link
            href="/admin/alertas/novo"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-conplan/20 px-5 text-sm font-semibold text-conplan transition-all hover:-translate-y-0.5 hover:bg-conplan-soft sm:w-auto"
          >
            Novo alerta
          </Link>
        </div>
      </header>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className="mt-2 font-serif text-4xl font-bold text-conplan">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Últimas Notícias */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-conplan">
              Últimas Notícias
            </h2>
            <Link
              href="/admin/noticias"
              className="text-sm font-medium text-marconi hover:underline"
            >
              Gerenciar
            </Link>
          </div>

          {latestNews.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Nenhuma notícia cadastrada.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latestNews.map((n) => (
                <li key={n.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/noticias/${n.id}/editar`}
                      className="block truncate text-sm font-medium text-conplan hover:text-marconi"
                    >
                      {n.title}
                    </Link>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryBadgeClasses[n.category]}`}
                      >
                        {categoryLabels[n.category]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {dateFmt.format(n.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      n.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {n.isPublished ? "Publicada" : "Rascunho"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximos Prazos */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-conplan">
              Próximos Prazos
            </h2>
            <Link
              href="/admin/alertas"
              className="text-sm font-medium text-marconi hover:underline"
            >
              Gerenciar
            </Link>
          </div>

          {upcomingAlerts.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Nenhum alerta ativo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingAlerts.map((a) => {
                const deadline = deadlineLabel(a.date);
                return (
                  <li key={a.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/alertas/${a.id}/editar`}
                        className="truncate text-sm font-medium text-conplan hover:text-marconi"
                      >
                        {a.title}
                      </Link>
                      <span className={`shrink-0 text-xs font-semibold ${toneClasses[deadline.tone]}`}>
                        {deadline.text}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${alertCategoryBadgeClasses[a.category]}`}
                      >
                        {alertCategoryLabels[a.category]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {dateFmt.format(a.date)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Leads */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-conplan">
            Leads Capturados pelo Comercial
          </h2>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-conplan-soft px-2.5 py-1 text-xs font-semibold text-conplan">
              {totalLeads} no total
            </span>
            <Link
              href="/admin/leads"
              className="text-sm font-medium text-marconi hover:underline"
            >
              Gerenciar
            </Link>
          </div>
        </div>

        {latestLeads.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            Nenhum lead recebido ainda.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {latestLeads.map((lead) => (
              <li key={lead.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-conplan">
                    {lead.name}
                    <span className="ml-2 font-normal text-slate-400">
                      · {lead.company}
                    </span>
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {dateFmt.format(lead.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-marconi">
                  {lead.phone}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {lead.need}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
