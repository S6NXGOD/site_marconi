"use client";

import { useState, useTransition } from "react";
import { deleteSource, toggleSourceActive } from "@/app/admin/actions";

export function ToggleSourceActiveButton({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void toggleSourceActive(id, !isActive))}
      aria-pressed={isActive}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {isActive ? "Ativa" : "Inativa"}
    </button>
  );
}

export function DeleteSourceButton({ id, name }: { id: string; name: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, start] = useTransition();

  // Confirmação inline em vez de window.confirm: o nativo é bloqueante, feio
  // no celular e não dá para explicar o que sobrevive à exclusão.
  if (confirmando) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void deleteSource(id))}
          className="inline-flex min-h-9 items-center rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Excluindo..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      aria-label={`Excluir a fonte ${name}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
      Excluir
    </button>
  );
}
