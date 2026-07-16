"use client";

import { useFormStatus } from "react-dom";
import {
  deleteWhatsapp,
  toggleWhatsappActive,
  deleteArea,
  toggleAreaActive,
} from "@/app/admin/actions";

function DeleteSubmit({ nome }: { nome: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) {
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

function ToggleButton({ ativo }: { ativo: boolean }) {
  return (
    <button
      type="submit"
      title={ativo ? "Clique para ocultar do site" : "Clique para exibir no site"}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        ativo
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {ativo ? "No site" : "Oculto"}
    </button>
  );
}

/* ——— WhatsApp ——— */
export function DeleteWhatsappButton({ id, nome }: { id: string; nome: string }) {
  return (
    <form action={deleteWhatsapp.bind(null, id)}>
      <DeleteSubmit nome={nome} />
    </form>
  );
}

export function ToggleWhatsappButton({ id, ativo }: { id: string; ativo: boolean }) {
  return (
    <form action={toggleWhatsappActive.bind(null, id, !ativo)}>
      <ToggleButton ativo={ativo} />
    </form>
  );
}

/* ——— Áreas de Atuação ——— */
export function DeleteAreaButton({ id, nome }: { id: string; nome: string }) {
  return (
    <form action={deleteArea.bind(null, id)}>
      <DeleteSubmit nome={nome} />
    </form>
  );
}

export function ToggleAreaButton({ id, ativo }: { id: string; ativo: boolean }) {
  return (
    <form action={toggleAreaActive.bind(null, id, !ativo)}>
      <ToggleButton ativo={ativo} />
    </form>
  );
}
