"use client";

import { useFormStatus } from "react-dom";
import type { LeadStatus } from "@prisma/client";
import { updateLeadStatus, deleteLead } from "@/app/admin/actions";
import { leadStatusLabels, leadStatusOrder } from "@/lib/leads";

function StatusSubmit({
  status,
  active,
}: {
  status: LeadStatus;
  active: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || active}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default ${
        active
          ? "bg-conplan text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-60"
      }`}
    >
      {leadStatusLabels[status]}
    </button>
  );
}

/** Trilha de status: Novo → Em contato → Concluído */
export function LeadStatusSwitcher({
  id,
  current,
}: {
  id: string;
  current: LeadStatus;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {leadStatusOrder.map((status) => (
        <form key={status} action={updateLeadStatus.bind(null, id, status)}>
          <StatusSubmit status={status} active={status === current} />
        </form>
      ))}
    </div>
  );
}

function DeleteSubmit({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`Excluir o contato de "${name}"? Esta ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
      </svg>
      {pending ? "..." : "Excluir"}
    </button>
  );
}

export function DeleteLeadButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteLead.bind(null, id)}>
      <DeleteSubmit name={name} />
    </form>
  );
}
