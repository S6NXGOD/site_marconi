"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ApprovalFormState } from "@/app/admin/actions";
import { toEmbedUrl } from "@/lib/embed";

type ApprovalInitial = {
  municipality: string;
  label: string;
  embedUrl: string | null;
  order: number;
  isActive: boolean;
};

type Props = {
  action: (
    state: ApprovalFormState,
    formData: FormData
  ) => Promise<ApprovalFormState>;
  initial?: ApprovalInitial;
  submitLabel: string;
};

const initialState: ApprovalFormState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

export default function ApprovalForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const [embed, setEmbed] = useState(initial?.embedUrl ?? "");

  const parsed = toEmbedUrl(embed);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="municipality" className="mb-1.5 block text-sm font-medium text-conplan">
          Município
        </label>
        <input
          id="municipality"
          name="municipality"
          type="text"
          defaultValue={initial?.municipality}
          placeholder="Ex.: Tanque do Piauí"
          className={fieldClass}
        />
        {state.errors?.municipality && (
          <p className="mt-1 text-xs text-red-600">{state.errors.municipality}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="label" className="mb-1.5 block text-sm font-medium text-conplan">
            Selo
          </label>
          <input
            id="label"
            name="label"
            type="text"
            defaultValue={initial?.label ?? "Contas Aprovadas"}
            placeholder="Contas Aprovadas"
            className={fieldClass}
          />
          {state.errors?.label && (
            <p className="mt-1 text-xs text-red-600">{state.errors.label}</p>
          )}
        </div>

        <div>
          <label htmlFor="order" className="mb-1.5 block text-sm font-medium text-conplan">
            Ordem{" "}
            <span className="font-normal text-slate-400">(menor aparece antes)</span>
          </label>
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={initial?.order ?? 0}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Link do vídeo — é o card inteiro */}
      <div>
        <label htmlFor="embedUrl" className="mb-1.5 block text-sm font-medium text-conplan">
          Link da publicação
        </label>
        <textarea
          id="embedUrl"
          name="embedUrl"
          rows={3}
          value={embed}
          onChange={(e) => setEmbed(e.target.value)}
          placeholder="Cole o link do reel — ex.: https://www.instagram.com/reel/ABC123/"
          className={`${fieldClass} resize-y font-mono text-xs`}
        />

        {embed.trim() && (
          <p
            className={`mt-2 rounded-lg px-3 py-2 text-xs ${
              parsed
                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
            }`}
          >
            {parsed
              ? "✓ Publicação reconhecida — ela aparecerá incorporada no card, como no Instagram."
              : "Não reconheci um reel do Instagram nem um vídeo do YouTube. Sem uma publicação válida, o card NÃO aparece no site."}
          </p>
        )}

        <p className="mt-2 text-xs text-slate-400">
          A publicação é exibida de verdade dentro do card — não precisa de capa.
          Aceita o link do reel, o link do post ou o código{" "}
          <code className="rounded bg-slate-100 px-1">&lt;blockquote&gt;</code> do
          Instagram. Também aceita YouTube.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-cloud px-4 py-3">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
        />
        <span className="text-sm font-medium text-conplan">Exibir no site</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin/aprovacoes"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
