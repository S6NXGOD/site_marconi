"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  /** name do input enviado no formulário */
  name: string;
  defaultValue?: string | null;
  label?: string;
  /** proporção do corte (ex.: 4/3) */
  aspect?: number;
  /** dimensão final gravada (largura); a altura sai da proporção */
  outputWidth?: number;
  hint?: string;
};

const MAX_MB = 8;

/** Recorta no canvas e devolve um JPEG — evita subir a foto original inteira. */
async function cropToBlob(
  src: string,
  area: Area,
  outputWidth: number,
  aspect: number
): Promise<Blob> {
  const img = document.createElement("img");
  img.src = src;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = Math.round(outputWidth / aspect);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Qualidade alta (0.95) de propósito: quem faz a compressão final é o
  // servidor (mozjpeg). Enviar já comprimido aqui só somaria perda de
  // qualidade em cima de perda — o arquivo final seria pior, não menor.
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("falha ao gerar imagem"))),
      "image/jpeg",
      0.95
    )
  );
}

export default function ImageCropUploader({
  name,
  defaultValue,
  label = "Imagem",
  aspect = 4 / 3,
  outputWidth = 1200,
  hint,
}: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [fonte, setFonte] = useState<string | null>(null); // imagem escolhida (dataURL)
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const alturaSugerida = Math.round(outputWidth / aspect);

  const onCropComplete = useCallback((_: Area, px: Area) => setAreaPx(px), []);

  function escolher(file: File) {
    setErro(null);
    if (!file.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErro(`Imagem muito grande. O limite é ${MAX_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFonte(String(reader.result));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  async function salvarCorte() {
    if (!fonte || !areaPx) return;
    setEnviando(true);
    setErro(null);
    try {
      const blob = await cropToBlob(fonte, areaPx, outputWidth, aspect);
      const body = new FormData();
      body.append("file", new File([blob], "corte.jpg", { type: "image/jpeg" }));

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha no upload.");
        return;
      }
      setUrl(data.url);
      setFonte(null);
    } catch {
      setErro("Não foi possível recortar/enviar a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-conplan">
        {label}
      </label>

      <input type="hidden" name={name} value={url} />

      {/* ——— Editor de corte ——— */}
      {fonte ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="relative h-72 w-full bg-slate-900">
            <Cropper
              image={fonte}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
            />
          </div>

          <div className="space-y-3 p-4">
            <div>
              <label htmlFor={`${name}-zoom`} className="mb-1 block text-xs font-medium text-slate-500">
                Zoom — arraste a imagem para posicionar
              </label>
              <input
                id={`${name}-zoom`}
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-marconi"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={salvarCorte}
                disabled={enviando}
                className="inline-flex items-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marconi-dark disabled:opacity-70"
              >
                {enviando ? "Enviando..." : "Recortar e salvar"}
              </button>
              <button
                type="button"
                onClick={() => setFonte(null)}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : url ? (
        /* ——— Preview ——— */
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div
            className="relative w-full bg-conplan-soft"
            style={{ aspectRatio: String(aspect) }}
          >
            <Image src={url} alt="Pré-visualização" fill sizes="640px" className="object-cover" />
          </div>
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
            <p className="truncate text-xs text-slate-500" title={url}>
              {url}
            </p>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => setUrl("")}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ——— Vazio ——— */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) escolher(f);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-cloud px-6 py-10 text-center transition-colors hover:border-marconi/50 hover:bg-marconi/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-marconi/10 text-marconi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </span>
          <p className="mt-3 text-sm font-semibold text-conplan">
            Arraste uma foto aqui ou clique para escolher
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Você poderá recortar depois · até {MAX_MB} MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) escolher(f);
          e.target.value = "";
        }}
      />

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      <p className="mt-2 text-xs text-slate-400">
        {hint ??
          `Proporção ${aspect === 4 / 3 ? "4:3" : aspect.toFixed(2)} — recomendado ${outputWidth}×${alturaSugerida}px. A imagem é recortada e otimizada automaticamente.`}
      </p>
    </div>
  );
}
