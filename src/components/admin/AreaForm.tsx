"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import ImageCropUploader from "./ImageCropUploader";
import type { AreaFormState } from "@/app/admin/actions";
import { ICONS, Icon } from "@/lib/icons";
import { ACCENT_OPTIONS } from "@/lib/accents";

type Service = { name: string; icon: string };

type Initial = {
  tabLabel: string;
  eyebrow: string;
  headline: string;
  description: string;
  image: string | null;
  imageAlt: string;
  accent: string;
  ctaLabel: string;
  ctaHref: string;
  order: number;
  isActive: boolean;
  services: Service[];
};

type Props = {
  action: (s: AreaFormState, f: FormData) => Promise<AreaFormState>;
  initial?: Initial;
  submitLabel: string;
};

const initialState: AreaFormState = { status: "idle" };

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

export default function AreaForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const [services, setServices] = useState<Service[]>(
    initial?.services?.length ? initial.services : [{ name: "", icon: "chart" }]
  );
  const [accent, setAccent] = useState(initial?.accent ?? "marconi");

  function alterar(i: number, patch: Partial<Service>) {
    setServices((s) => s.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function remover(i: number) {
    setServices((s) => s.filter((_, idx) => idx !== i));
  }
  function mover(i: number, dir: -1 | 1) {
    setServices((s) => {
      const alvo = i + dir;
      if (alvo < 0 || alvo >= s.length) return s;
      const c = [...s];
      [c[i], c[alvo]] = [c[alvo], c[i]];
      return c;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="tabLabel" className="mb-1.5 block text-sm font-medium text-conplan">
          Texto da aba
        </label>
        <input
          id="tabLabel"
          name="tabLabel"
          defaultValue={initial?.tabLabel}
          placeholder="MARCONI NUNES — SETOR PRIVADO"
          className={fieldClass}
        />
        {state.errors?.tabLabel && (
          <p className="mt-1 text-xs text-red-600">{state.errors.tabLabel}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="eyebrow" className="mb-1.5 block text-sm font-medium text-conplan">
            Empresa <span className="font-normal text-slate-400">(linha dourada)</span>
          </label>
          <input
            id="eyebrow"
            name="eyebrow"
            defaultValue={initial?.eyebrow}
            placeholder="Marconi Nunes Contabilidade"
            className={fieldClass}
          />
          {state.errors?.eyebrow && (
            <p className="mt-1 text-xs text-red-600">{state.errors.eyebrow}</p>
          )}
        </div>

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
      </div>

      <div>
        <label htmlFor="headline" className="mb-1.5 block text-sm font-medium text-conplan">
          Título
        </label>
        <input
          id="headline"
          name="headline"
          defaultValue={initial?.headline}
          placeholder="Solidez contábil para o setor privado"
          className={fieldClass}
        />
        {state.errors?.headline && (
          <p className="mt-1 text-xs text-red-600">{state.errors.headline}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-conplan">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description}
          className={`${fieldClass} resize-y`}
        />
        {state.errors?.description && (
          <p className="mt-1 text-xs text-red-600">{state.errors.description}</p>
        )}
      </div>

      {/* ——— Cor da vertente ——— */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-conplan">
          Cor da vertente
        </span>
        <input type="hidden" name="accent" value={accent} />
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccent(opt.value)}
              className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                accent === opt.value
                  ? "border-marconi bg-marconi/5 ring-1 ring-marconi"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span
                className={`h-6 w-6 shrink-0 rounded-full ${
                  opt.value === "conplan" ? "bg-sky-600" : "bg-marconi"
                }`}
              />
              <span className="text-sm font-semibold text-conplan">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Define a cor da aba, dos ícones e do botão. Cores diferentes entre as
          vertentes fazem o visitante perceber que trocou de aba.
        </p>
      </div>

      {/* ——— Serviços ——— */}
      <fieldset className="rounded-2xl border border-slate-200 p-5">
        <legend className="px-2 text-sm font-medium text-conplan">
          Serviços listados
        </legend>

        <ul className="space-y-3">
          {services.map((s, i) => (
            <li key={i} className="rounded-xl border border-slate-200 bg-cloud p-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    name="serviceName"
                    value={s.name}
                    onChange={(e) => alterar(i, { name: e.target.value })}
                    placeholder="Ex.: Área Fiscal e Tributária"
                    className={fieldClass}
                  />
                  <input type="hidden" name="serviceIcon" value={s.icon} />

                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(ICONS).map(([key, def]) => (
                      <button
                        key={key}
                        type="button"
                        title={def.label}
                        onClick={() => alterar(i, { icon: key })}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                          s.icon === key
                            ? "border-marconi bg-marconi text-white"
                            : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Icon name={key} size={15} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover para cima"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === services.length - 1}
                    aria-label="Mover para baixo"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(i)}
                    aria-label="Remover serviço"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setServices((s) => [...s, { name: "", icon: "chart" }])}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-conplan transition-colors hover:bg-slate-50"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Adicionar serviço
        </button>

        <p className="mt-2 text-xs text-slate-400">
          Serviços com o nome em branco são ignorados ao salvar.
        </p>
      </fieldset>

      {/* ——— Foto ——— */}
      <ImageCropUploader
        name="image"
        defaultValue={initial?.image}
        label="Foto da vertente"
        aspect={4 / 3}
        outputWidth={1200}
        hint="Proporção 4:3 — recomendado 1200×900px. Escolha a foto e ajuste o recorte; ela é otimizada automaticamente."
      />

      <div>
        <label htmlFor="imageAlt" className="mb-1.5 block text-sm font-medium text-conplan">
          Descrição da foto{" "}
          <span className="font-normal text-slate-400">(acessibilidade)</span>
        </label>
        <input
          id="imageAlt"
          name="imageAlt"
          defaultValue={initial?.imageAlt}
          placeholder="Sede da Marconi Nunes Contabilidade"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="ctaLabel" className="mb-1.5 block text-sm font-medium text-conplan">
            Texto do botão
          </label>
          <input
            id="ctaLabel"
            name="ctaLabel"
            defaultValue={initial?.ctaLabel ?? "Fale conosco"}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="ctaHref" className="mb-1.5 block text-sm font-medium text-conplan">
            Link do botão
          </label>
          <input
            id="ctaHref"
            name="ctaHref"
            defaultValue={initial?.ctaHref ?? "#contato"}
            placeholder="#contato"
            className={fieldClass}
          />
        </div>
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
          href="/admin/areas"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
