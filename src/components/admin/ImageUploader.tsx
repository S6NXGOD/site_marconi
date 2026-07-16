"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  /** name do input enviado no formulário (ex.: coverImage, thumbnail) */
  name: string;
  defaultValue?: string | null;
  label?: string;
  hint?: string;
};

const MAX_MB = 5;

export default function ImageUploader({
  name,
  defaultValue,
  label = "Foto de capa",
  hint = "Sem foto, a capa usa o fundo de marca da categoria.",
}: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Imagem muito grande. O limite é ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Falha no upload.");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-conplan">
        {label} <span className="font-normal text-slate-400">(opcional)</span>
      </label>

      {/* valor real enviado ao server action */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        /* ——— Preview ——— */
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          <div className="relative aspect-[16/9] w-full bg-conplan-soft">
            <Image
              src={url}
              alt="Pré-visualização da capa"
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>

          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
            <p className="truncate text-xs text-slate-500" title={url}>
              {url}
            </p>
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Remover
            </button>
          </div>
        </div>
      ) : (
        /* ——— Área de upload ——— */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? "border-marconi bg-marconi/5"
              : "border-slate-300 bg-cloud hover:border-marconi/50 hover:bg-marconi/5"
          }`}
        >
          {uploading ? (
            <>
              <svg className="h-7 w-7 animate-spin text-marconi" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="mt-3 text-sm font-medium text-conplan">Enviando...</p>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-marconi/10 text-marconi">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-semibold text-conplan">
                Arraste uma foto aqui ou clique para escolher
              </p>
              <p className="mt-1 text-xs text-slate-400">
                JPG, PNG, WEBP, AVIF ou GIF · até {MAX_MB} MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* A opção de "colar URL externa" foi removida de propósito: exibir
          imagem de outro domínio exigiria abrir o otimizador do Next para
          qualquer host, o que vira um proxy de imagens aberto. Todo upload
          vai para o volume e é servido pelo próprio site. */}

      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
