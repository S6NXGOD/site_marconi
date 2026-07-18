"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * Editor visual do corpo da notícia.
 *
 * O que se vê é o que sai: negrito, subtítulos, listas, imagens no meio do
 * texto, links e vídeos aparecem já formatados — nada de marcação crua no
 * campo. O valor é HTML, gravado num input escondido e SANITIZADO no servidor
 * antes de salvar (o editor nunca é a última barreira contra XSS).
 */

type Props = {
  name: string;
  defaultValue?: string;
};

const btn =
  "flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-slate-600 transition-colors hover:bg-slate-100";
const btnAtivo = "bg-marconi/10 text-marconi hover:bg-marconi/15";

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />;
}

function Botao({
  onClick,
  ativo,
  titulo,
  children,
}: {
  onClick: () => void;
  ativo?: boolean;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      className={`${btn} ${ativo ? btnAtivo : ""}`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ name, defaultValue = "" }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [enviando, setEnviando] = useState(false);
  const inputImagem = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Next renderiza no servidor primeiro; sem isto dá hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // só H2/H3 no corpo — H1 é o título
      }),
      Underline,
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      ImageExt.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Placeholder.configure({
        placeholder: "Escreva o conteúdo da notícia. Você pode inserir imagens, links e formatar o texto…",
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[320px] px-4 py-3 outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const enviarImagem = useCallback(
    async (file: File) => {
      if (!editor) return;
      setEnviando(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        // A rota já otimiza (sharp) e guarda no volume; aqui só inserimos.
        if (res.ok && data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: "" }).run();
        }
      } finally {
        setEnviando(false);
      }
    },
    [editor]
  );

  if (!editor) {
    // Enquanto o editor monta, o input já existe — o form nunca fica sem valor.
    return <input type="hidden" name={name} defaultValue={defaultValue} />;
  }

  function inserirLink() {
    const anterior = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link (https://...)", anterior ?? "https://");
    if (url === null) return; // cancelou
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url)) return;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function inserirVideo() {
    const url = window.prompt("Link do vídeo (YouTube ou Vimeo)");
    if (!url) return;
    editor!.commands.setYoutubeVideo({ src: url });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-marconi focus-within:ring-2 focus-within:ring-marconi/20">
      {/* ——— Barra de ferramentas ——— */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <Botao onClick={() => editor.chain().focus().toggleBold().run()} ativo={editor.isActive("bold")} titulo="Negrito">
          <span className="text-sm font-bold">B</span>
        </Botao>
        <Botao onClick={() => editor.chain().focus().toggleItalic().run()} ativo={editor.isActive("italic")} titulo="Itálico">
          <span className="text-sm italic">I</span>
        </Botao>
        <Botao onClick={() => editor.chain().focus().toggleUnderline().run()} ativo={editor.isActive("underline")} titulo="Sublinhado">
          <span className="text-sm underline">U</span>
        </Botao>

        <Sep />

        <Botao onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} ativo={editor.isActive("heading", { level: 2 })} titulo="Subtítulo grande">
          <span className="text-sm font-bold">H2</span>
        </Botao>
        <Botao onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} ativo={editor.isActive("heading", { level: 3 })} titulo="Subtítulo menor">
          <span className="text-sm font-bold">H3</span>
        </Botao>

        <Sep />

        <Botao onClick={() => editor.chain().focus().toggleBulletList().run()} ativo={editor.isActive("bulletList")} titulo="Lista">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </Botao>
        <Botao onClick={() => editor.chain().focus().toggleOrderedList().run()} ativo={editor.isActive("orderedList")} titulo="Lista numerada">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4l2-3H4" /></svg>
        </Botao>
        <Botao onClick={() => editor.chain().focus().toggleBlockquote().run()} ativo={editor.isActive("blockquote")} titulo="Citação">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h4v6H8v-2h1V9H7V7zm6 0h4v6h-3v-2h1V9h-2V7z" /></svg>
        </Botao>

        <Sep />

        <Botao onClick={inserirLink} ativo={editor.isActive("link")} titulo="Inserir link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        </Botao>
        <Botao onClick={() => editor.chain().focus().unsetLink().run()} titulo="Remover link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 5.64a5 5 0 0 1 0 7.07l-1.5 1.5M6.14 6.14l-1.5 1.5a5 5 0 0 0 7.07 7.07M3 3l18 18" /></svg>
        </Botao>
        <Botao onClick={() => inputImagem.current?.click()} titulo="Inserir imagem">
          {enviando ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-marconi border-t-transparent" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          )}
        </Botao>
        <Botao onClick={inserirVideo} titulo="Inserir vídeo (YouTube/Vimeo)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 8l6 4-6 4V8z" fill="currentColor" /></svg>
        </Botao>

        <Sep />

        <Botao onClick={() => editor.chain().focus().undo().run()} titulo="Desfazer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" /></svg>
        </Botao>
        <Botao onClick={() => editor.chain().focus().redo().run()} titulo="Refazer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" /></svg>
        </Botao>
      </div>

      <EditorContent editor={editor} />

      {/* O que o formulário envia — sanitizado no servidor antes de gravar. */}
      <input type="hidden" name={name} value={html} />

      <input
        ref={inputImagem}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) enviarImagem(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
