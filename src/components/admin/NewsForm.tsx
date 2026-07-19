"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import ImageCropUploader from "./ImageCropUploader";
import PublishDateField from "./PublishDateField";
import SlugField from "./SlugField";
import RichEditor from "./RichEditor";
import TagField from "./TagField";
import { autorDe, categoryOptions } from "@/lib/news";
import type { NewsFormState } from "@/app/admin/actions";
import type { TagRank } from "@/lib/get-tags";
import type { NewsCategory } from "@prisma/client";

type NewsInitial = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: NewsCategory;
  isPublished: boolean;
  /** "yyyy-mm-dd" no fuso do Piauí */
  publishedAt: string;
  /** nomes das tags de assunto já atribuídas */
  tags: string[];
};

type Props = {
  action: (state: NewsFormState, formData: FormData) => Promise<NewsFormState>;
  initial?: NewsInitial;
  submitLabel: string;
  /** domínio público, só para o preview do endereço */
  siteUrl?: string;
  /** tags que já existem no sistema (com uso), para sugerir */
  tagSuggestions?: TagRank[];
};

const initialState: NewsFormState = { status: "idle" };

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

export default function NewsForm({
  action,
  initial,
  submitLabel,
  siteUrl,
  tagSuggestions = [],
}: Props) {
  const [state, formAction] = useFormState(action, initialState);
  // Título e categoria viram estado porque alimentam os previews do endereço
  // e da assinatura enquanto a pessoa digita.
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<NewsCategory>(
    initial?.category ?? "PUBLICO"
  );

  // Texto do corpo (puro) para a sugestão de assuntos. Debounce leve: o editor
  // dispara a cada tecla; não vale re-renderizar o formulário todo tão rápido.
  const [corpoTexto, setCorpoTexto] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  function aoDigitarCorpo(texto: string) {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setCorpoTexto(texto), 400);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-conplan">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da notícia"
          className={fieldClass}
        />
        {state.errors?.title && (
          <p className="mt-1 text-xs text-red-600">{state.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-conplan">
          Categoria
        </label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as NewsCategory)}
          className={fieldClass}
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {state.errors?.category && (
          <p className="mt-1 text-xs text-red-600">{state.errors.category}</p>
        )}
        {/* A assinatura acompanha a categoria — ver `newsAuthors` em lib/news. */}
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Assinatura:{" "}
          <strong className="font-semibold text-conplan">
            {autorDe(category)}
          </strong>
        </p>
      </div>

      {/* Vertente (category) é o SETOR; a tag é o ASSUNTO — as duas convivem. */}
      <TagField
        name="tags"
        defaultValue={initial?.tags}
        suggestions={tagSuggestions}
        texto={`${title}\n${corpoTexto}`}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <PublishDateField name="publishedAt" defaultValue={initial?.publishedAt} />
      </div>

      <SlugField
        name="slug"
        title={title}
        defaultValue={initial?.slug}
        siteUrl={siteUrl}
      />

      {/* Capa em 16:9 e sempre JPEG.
          O formato importa: o WhatsApp não renderiza WebP no preview do link,
          e o recorte garante a proporção que as redes esperam ao compartilhar. */}
      <ImageCropUploader
        name="coverImage"
        defaultValue={initial?.coverImage}
        label="Foto de capa"
        aspect={16 / 9}
        outputWidth={1200}
        hint="Proporção 16:9 — recomendado 1200×675px. É esta imagem que aparece ao compartilhar a notícia no WhatsApp. Sem foto, a capa usa o fundo de marca da categoria."
      />

      <div>
        <label htmlFor="excerpt" className="mb-1.5 block text-sm font-medium text-conplan">
          Resumo{" "}
          <span className="font-normal text-slate-400">
            (opcional — aparece nos cards e na busca)
          </span>
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={initial?.excerpt ?? ""}
          placeholder="Uma ou duas frases resumindo a notícia..."
          className={`${fieldClass} resize-y`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-conplan">
          Conteúdo
        </label>
        <p className="mb-2 text-xs text-slate-400">
          Corpo principal. Parágrafos, espaçamento, imagens no meio do texto e
          links são preservados.
        </p>
        <RichEditor name="content" defaultValue={initial?.content} onTextChange={aoDigitarCorpo} />
        {state.errors?.content && (
          <p className="mt-1 text-xs text-red-600">{state.errors.content}</p>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-cloud px-4 py-3">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={initial?.isPublished ?? false}
          className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
        />
        <span className="text-sm font-medium text-conplan">
          Publicar imediatamente
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/admin/noticias"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
