"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { categoryOptions } from "@/lib/news";
import type { SourceFormState } from "@/app/admin/actions";
import type { NewsCategory } from "@prisma/client";

type SourceInitial = {
  name: string;
  url: string;
  category: NewsCategory;
  itemSelector: string;
  titleSelector: string | null;
  linkSelector: string | null;
  dateSelector: string | null;
  imageSelector: string | null;
  excerptSelector: string | null;
  contentSelector: string | null;
  isActive: boolean;
};

type Props = {
  action: (state: SourceFormState, formData: FormData) => Promise<SourceFormState>;
  initial?: SourceInitial;
  submitLabel: string;
};

type Campos = Omit<SourceInitial, "isActive">;

/**
 * Preset do TCE-PI: seletores conferidos contra o HTML real do site.
 * Poupa a pessoa de abrir o inspetor do navegador para a fonte mais provável.
 */
const PRESET_TCE: Campos = {
  name: "TCE-PI — Notícias",
  url: "https://www.tcepi.tc.br/publicacoes/noticias/",
  category: "PUBLICO",
  itemSelector: "article .post",
  titleSelector: "h3.title a",
  linkSelector: "h3.title a",
  dateSelector: ".date",
  imageSelector: ".thumbnail img",
  excerptSelector: ".post-content p",
  contentSelector: ".the_post.post_content",
};

const initialState: SourceFormState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

const monoClass = `${fieldClass} font-mono text-xs`;

type Previa = { title: string; link: string; date: string; imageUrl: string; excerpt: string };

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

export default function SourceForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, initialState);

  const [campos, setCampos] = useState<Campos>({
    name: initial?.name ?? "",
    url: initial?.url ?? "",
    category: initial?.category ?? "PUBLICO",
    itemSelector: initial?.itemSelector ?? "",
    titleSelector: initial?.titleSelector ?? "",
    linkSelector: initial?.linkSelector ?? "",
    dateSelector: initial?.dateSelector ?? "",
    imageSelector: initial?.imageSelector ?? "",
    excerptSelector: initial?.excerptSelector ?? "",
    contentSelector: initial?.contentSelector ?? "",
  });

  const [testando, setTestando] = useState(false);
  const [previa, setPrevia] = useState<{ total: number; itens: Previa[] } | null>(null);
  const [erroTeste, setErroTeste] = useState<string | null>(null);

  function set<K extends keyof Campos>(k: K, v: Campos[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    setPrevia(null);
  }

  async function testar() {
    setTestando(true);
    setErroTeste(null);
    setPrevia(null);
    try {
      const res = await fetch("/api/admin/scrape/testar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });
      const data = await res.json();
      if (!res.ok) setErroTeste(data.error ?? "Falha no teste.");
      else setPrevia(data);
    } catch {
      setErroTeste("Não consegui contatar o servidor.");
    } finally {
      setTestando(false);
    }
  }

  const podeTestar = Boolean(campos.url && campos.itemSelector) && !testando;

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      {/* Atalho para a fonte mais provável. */}
      <button
        type="button"
        onClick={() => {
          setCampos(PRESET_TCE);
          setPrevia(null);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-marconi/40 bg-marconi/5 px-4 py-2 text-xs font-semibold text-marconi transition-colors hover:bg-marconi/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Preencher com o TCE-PI
      </button>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-conplan">
          Nome da fonte
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={campos.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="TCE-PI — Notícias"
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-slate-400">
          É este nome que aparece no crédito da matéria importada.
        </p>
        {state.errors?.name && <p className="mt-1 text-xs text-red-600">{state.errors.name}</p>}
      </div>

      <div>
        <label htmlFor="url" className="mb-1.5 block text-sm font-medium text-conplan">
          URL da listagem
        </label>
        <input
          id="url"
          name="url"
          type="url"
          value={campos.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://www.tcepi.tc.br/publicacoes/noticias/"
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-slate-400">
          A página que lista as notícias, não a de uma matéria.
        </p>
        {state.errors?.url && <p className="mt-1 text-xs text-red-600">{state.errors.url}</p>}
      </div>

      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-conplan">
          Categoria das notícias importadas
        </label>
        <select
          id="category"
          name="category"
          value={campos.category}
          onChange={(e) => set("category", e.target.value as NewsCategory)}
          className={fieldClass}
        >
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {state.errors?.category && (
          <p className="mt-1 text-xs text-red-600">{state.errors.category}</p>
        )}
      </div>

      {/* ——— Seletores ——— */}
      <div className="rounded-2xl border border-slate-200 bg-cloud p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-conplan">Seletores CSS</h2>
        <p className="mt-1 text-xs text-slate-500">
          Onde cada dado está no HTML da página. Use o botão de testar abaixo
          para conferir antes de salvar.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="itemSelector" className="mb-1.5 block text-xs font-medium text-conplan">
              Container de cada notícia <span className="text-red-500">*</span>
            </label>
            <input
              id="itemSelector"
              name="itemSelector"
              type="text"
              value={campos.itemSelector}
              onChange={(e) => set("itemSelector", e.target.value)}
              placeholder="article .post"
              className={monoClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Os seletores abaixo são procurados dentro dele.
            </p>
            {state.errors?.itemSelector && (
              <p className="mt-1 text-xs text-red-600">{state.errors.itemSelector}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["titleSelector", "Título", "h3.title a"],
                ["linkSelector", "Link (href)", "h3.title a"],
                ["dateSelector", "Data", ".date"],
                ["imageSelector", "Imagem (src)", ".thumbnail img"],
              ] as const
            ).map(([key, label, ph]) => (
              <div key={key}>
                <label htmlFor={key} className="mb-1.5 block text-xs font-medium text-conplan">
                  {label}
                </label>
                <input
                  id={key}
                  name={key}
                  type="text"
                  value={campos[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph}
                  className={monoClass}
                />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="excerptSelector" className="mb-1.5 block text-xs font-medium text-conplan">
              Resumo na listagem
            </label>
            <input
              id="excerptSelector"
              name="excerptSelector"
              type="text"
              value={campos.excerptSelector ?? ""}
              onChange={(e) => set("excerptSelector", e.target.value)}
              placeholder=".post-content p"
              className={monoClass}
            />
          </div>

          <div>
            <label htmlFor="contentSelector" className="mb-1.5 block text-xs font-medium text-conplan">
              Corpo do texto <span className="font-normal text-slate-400">(na página da matéria)</span>
            </label>
            <input
              id="contentSelector"
              name="contentSelector"
              type="text"
              value={campos.contentSelector ?? ""}
              onChange={(e) => set("contentSelector", e.target.value)}
              placeholder=".the_post.post_content"
              className={monoClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Sem isto, o rascunho nasce só com o resumo — a listagem entrega o
              texto cortado.
            </p>
          </div>
        </div>

        {/* ——— Teste ——— */}
        <div className="mt-5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={testar}
            disabled={!podeTestar}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-conplan transition-colors hover:border-marconi hover:text-marconi disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testando ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-marconi border-t-transparent" />
                Testando...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                Testar seletores
              </>
            )}
          </button>

          {erroTeste && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
              {erroTeste}
            </p>
          )}

          {previa && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-emerald-700">
                {previa.total} {previa.total === 1 ? "item encontrado" : "itens encontrados"}
                {previa.itens.length > 0 && " — amostra:"}
              </p>
              <ul className="mt-2 space-y-2">
                {previa.itens.map((i, n) => (
                  <li key={n} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="truncate text-xs font-semibold text-conplan">
                      {i.title || <span className="text-red-600">título não capturado</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span>{i.date || "sem data"}</span>
                      <span>{i.imageUrl ? "com imagem" : "sem imagem"}</span>
                      <span>{i.excerpt ? "com resumo" : "sem resumo"}</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[10px] text-slate-400">{i.link}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-cloud px-4 py-3">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
        />
        <span className="text-sm font-medium text-conplan">
          Fonte ativa
          <span className="ml-1 font-normal text-slate-400">
            — aparece na tela de importação
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin/fontes"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
