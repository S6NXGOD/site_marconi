"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { alertCategoryOptions } from "@/lib/news";
import type { AlertFormState } from "@/app/admin/actions";
import type { AlertCategory } from "@prisma/client";

type AlertInitial = {
  title: string;
  date: Date;
  category: AlertCategory;
  description: string;
  isActive: boolean;
};

type Props = {
  action: (state: AlertFormState, formData: FormData) => Promise<AlertFormState>;
  initial?: AlertInitial;
  submitLabel: string;
};

const initialState: AlertFormState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

// yyyy-MM-dd para o input type="date"
function toDateInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

export default function AlertForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-conplan">
          Título do prazo
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title}
          placeholder="Ex.: Prazo de Prestação de Contas TCE-PI"
          className={fieldClass}
        />
        {state.errors?.title && (
          <p className="mt-1 text-xs text-red-600">{state.errors.title}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-conplan">
            Data limite
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={initial ? toDateInput(initial.date) : ""}
            className={fieldClass}
          />
          {state.errors?.date && (
            <p className="mt-1 text-xs text-red-600">{state.errors.date}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-conplan">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category ?? "PUBLICO"}
            className={fieldClass}
          >
            {alertCategoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {state.errors?.category && (
            <p className="mt-1 text-xs text-red-600">{state.errors.category}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-conplan">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial?.description}
          placeholder="Detalhe o que precisa ser entregue e para quem se aplica..."
          className={`${fieldClass} resize-y`}
        />
        {state.errors?.description && (
          <p className="mt-1 text-xs text-red-600">{state.errors.description}</p>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-cloud px-4 py-3">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
        />
        <span className="text-sm font-medium text-conplan">
          Alerta ativo (exibir no portal)
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin/alertas"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
