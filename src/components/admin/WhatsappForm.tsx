"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { WhatsappFormState } from "@/app/admin/actions";
import { ICONS, Icon } from "@/lib/icons";

type Initial = {
  title: string;
  subtitle: string;
  phone: string;
  message: string;
  icon: string;
  order: number;
  isActive: boolean;
};

type Props = {
  action: (s: WhatsappFormState, f: FormData) => Promise<WhatsappFormState>;
  initial?: Initial;
  submitLabel: string;
};

const initialState: WhatsappFormState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:opacity-70"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

/** (86) 99999-8888 → 5586999998888 */
function formatarBR(digits: string) {
  const d = digits.replace(/\D/g, "").replace(/^55/, "");
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export default function WhatsappForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const [phone, setPhone] = useState(formatarBR(initial?.phone ?? ""));
  const [icon, setIcon] = useState(initial?.icon ?? "user");

  // O que realmente vai para o banco: 55 + dígitos.
  const digits = "55" + phone.replace(/\D/g, "");

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-conplan">
            Título
          </label>
          <input
            id="title"
            name="title"
            defaultValue={initial?.title}
            placeholder="Já sou cliente"
            className={fieldClass}
          />
          {state.errors?.title && (
            <p className="mt-1 text-xs text-red-600">{state.errors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="subtitle" className="mb-1.5 block text-sm font-medium text-conplan">
            Descrição
          </label>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={initial?.subtitle}
            placeholder="Contato administrativo"
            className={fieldClass}
          />
          {state.errors?.subtitle && (
            <p className="mt-1 text-xs text-red-600">{state.errors.subtitle}</p>
          )}
        </div>
      </div>

      {/* Telefone com máscara; o valor real vai num hidden */}
      <div>
        <label htmlFor="phone-visivel" className="mb-1.5 block text-sm font-medium text-conplan">
          Telefone (WhatsApp)
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-xl border border-slate-300 bg-cloud px-3 py-3 text-sm font-semibold text-slate-500">
            +55
          </span>
          <input
            id="phone-visivel"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatarBR(e.target.value))}
            placeholder="(86) 99999-8888"
            className={fieldClass}
          />
        </div>
        <input type="hidden" name="phone" value={digits} />
        {state.errors?.phone && (
          <p className="mt-1 text-xs text-red-600">{state.errors.phone}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Será salvo como{" "}
          <code className="rounded bg-slate-100 px-1">{digits}</code> — formato do
          link do WhatsApp.
        </p>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-conplan">
          Mensagem inicial
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          defaultValue={initial?.message}
          placeholder="Olá! Vim pelo site e gostaria de..."
          className={`${fieldClass} resize-y`}
        />
        {state.errors?.message && (
          <p className="mt-1 text-xs text-red-600">{state.errors.message}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Já vem digitada na conversa quando a pessoa clica — poupa uma rodada de
          perguntas.
        </p>
      </div>

      {/* Ícone */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-conplan">Ícone</span>
        <input type="hidden" name="icon" value={icon} />
        <div className="flex flex-wrap gap-2">
          {Object.entries(ICONS).map(([key, def]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              title={def.label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                icon === key
                  ? "border-marconi bg-marconi text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Icon name={key} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="order" className="mb-1.5 block text-sm font-medium text-conplan">
            Ordem <span className="font-normal text-slate-400">(menor primeiro)</span>
          </label>
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={initial?.order ?? 0}
            className={fieldClass}
          />
        </div>

        <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-cloud px-4 py-3">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial?.isActive ?? true}
            className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
          />
          <span className="text-sm font-medium text-conplan">Exibir no site</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin/whatsapp"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
