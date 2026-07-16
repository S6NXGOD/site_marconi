"use client";

import { useFormStatus } from "react-dom";
import { deleteAlert, toggleAlertActive } from "@/app/admin/actions";

function DeleteSubmit({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`Excluir o alerta "${title}"? Esta ação não pode ser desfeita.`)) {
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

export function DeleteAlertButton({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteAlert.bind(null, id)}>
      <DeleteSubmit title={title} />
    </form>
  );
}

export function ToggleAlertActiveButton({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  return (
    <form action={toggleAlertActive.bind(null, id, !isActive)}>
      <button
        type="submit"
        title={isActive ? "Clique para desativar" : "Clique para ativar"}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
          isActive
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        {isActive ? "Ativo" : "Inativo"}
      </button>
    </form>
  );
}
