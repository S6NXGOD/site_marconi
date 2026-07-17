"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CSV_MODELO, lerAlertasCSV, type LinhaAlerta } from "@/lib/csv";
import { formatarData } from "@/lib/datas";
import { alertCategoryLabels, alertCategoryBadgeClasses } from "@/lib/news";
import { importAlerts, type ImportAlertsState } from "@/app/admin/actions";

const estadoInicial: ImportAlertsState = { status: "idle" };

/**
 * O Excel salva CSV em Windows-1252 com frequência. Lido como UTF-8, todo
 * acento vira "" (U+FFFD) e o alerta entraria no banco com o texto corrompido.
 * Não dá para saber a codificação pelo arquivo, então: tenta UTF-8 e, se
 * aparecer caractere de substituição, relê como Windows-1252.
 */
async function lerTexto(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  if (!utf8.includes("�")) return utf8;
  return new TextDecoder("windows-1252").decode(bytes);
}

function BotaoImportar({ quantos }: { quantos: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || quantos === 0}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending
        ? "Importando..."
        : `Importar ${quantos} ${quantos === 1 ? "alerta" : "alertas"}`}
    </button>
  );
}

export default function AlertsImport() {
  const [state, formAction] = useFormState(importAlerts, estadoInicial);
  const [texto, setTexto] = useState("");
  const [linhas, setLinhas] = useState<LinhaAlerta[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function analisar(conteudo: string, nome: string | null) {
    setErro(null);
    const lidas = lerAlertasCSV(conteudo);
    if (lidas.length === 0) {
      setErro("Não encontrei nenhuma linha de dados neste arquivo.");
      setLinhas([]);
      setTexto("");
      setNomeArquivo(null);
      return;
    }
    setTexto(conteudo);
    setLinhas(lidas);
    setNomeArquivo(nome);
  }

  async function escolher(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setErro("Arquivo muito grande. O limite é 2 MB.");
      return;
    }
    analisar(await lerTexto(file), file.name);
  }

  function limpar() {
    setTexto("");
    setLinhas([]);
    setNomeArquivo(null);
    setErro(null);
  }

  function baixarModelo() {
    // ﻿ (BOM): sem ele o Excel abre o modelo com os acentos quebrados.
    const blob = new Blob(["﻿" + CSV_MODELO], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-alertas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validas = linhas.filter((l) => !l.erro);
  const invalidas = linhas.filter((l) => l.erro);

  return (
    <div className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {state.message}
        </div>
      )}

      {/* ——— Instruções ——— */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-conplan">Como montar a planilha</h2>
            <p className="mt-1 text-sm text-slate-500">
              Uma linha por alerta, com as colunas{" "}
              <strong className="font-semibold text-conplan">
                titulo, data, categoria, descricao
              </strong>{" "}
              e <span className="text-slate-400">ativo</span> (opcional).
            </p>
          </div>
          <button
            type="button"
            onClick={baixarModelo}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-conplan transition-colors hover:border-marconi hover:text-marconi"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Baixar modelo
          </button>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-slate-500">
          <li>
            <strong className="font-semibold text-conplan">Data:</strong>{" "}
            31/07/2026 ou 2026-07-31.
          </li>
          <li>
            <strong className="font-semibold text-conplan">Categoria:</strong>{" "}
            Gestão Pública ou Setor Privado.
          </li>
          <li>
            <strong className="font-semibold text-conplan">Ativo:</strong> sim ou
            não — em branco, o alerta entra ativo.
          </li>
          <li className="pt-1 text-slate-400">
            Pode exportar direto do Excel. Alertas com o mesmo título e a mesma
            data de um já cadastrado são ignorados, então reimportar a planilha
            não duplica nada.
          </li>
        </ul>
      </div>

      {/* ——— Arquivo ——— */}
      {linhas.length === 0 ? (
        <div>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              const f = e.dataTransfer.files?.[0];
              if (f) escolher(f);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              arrastando
                ? "border-marconi bg-marconi/5"
                : "border-slate-300 bg-cloud hover:border-marconi/50 hover:bg-marconi/5"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-marconi/10 text-marconi">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 15h6M9 11h2" />
              </svg>
            </span>
            <p className="mt-3 text-sm font-semibold text-conplan">
              Arraste o CSV aqui ou clique para escolher
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Você confere tudo antes de importar · até 2 MB
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) escolher(f);
              e.target.value = "";
            }}
          />

          <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-conplan">
              Ou colar o conteúdo
            </summary>
            <textarea
              rows={5}
              placeholder={"titulo;data;categoria;descricao\nDCTF Mensal;20/08/2026;Setor Privado;Entrega da declaração federal."}
              onChange={(e) => {
                const v = e.target.value;
                if (v.trim().length > 12) analisar(v, null);
              }}
              className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-xs text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20"
            />
          </details>

          {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
        </div>
      ) : (
        /* ——— Prévia ——— */
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="csv" value={texto} />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-slate-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span className="truncate text-sm font-medium text-conplan">
                {nomeArquivo ?? "Conteúdo colado"}
              </span>
            </div>
            <button
              type="button"
              onClick={limpar}
              className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600"
            >
              Trocar
            </button>
          </div>

          {/* Resumo antes da tabela: no celular a tabela é longa e a contagem
              não pode ficar escondida no fim da rolagem. */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {validas.length} pronta{validas.length === 1 ? "" : "s"} para importar
            </span>
            {invalidas.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
                {invalidas.length} com problema — {invalidas.length === 1 ? "será ignorada" : "serão ignoradas"}
              </span>
            )}
          </div>

          {/* Cards em vez de tabela: no celular uma tabela de 4 colunas vira
              rolagem horizontal. */}
          <ul className="space-y-2">
            {linhas.map((l) => (
              <li
                key={l.linha}
                className={`rounded-xl border p-3.5 ${
                  l.erro
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      l.erro ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-500"
                    }`}
                    title={`Linha ${l.linha} do arquivo`}
                  >
                    L{l.linha}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-conplan">
                      {l.title || <span className="text-slate-400">(sem título)</span>}
                    </p>

                    {l.erro ? (
                      <p className="mt-1 text-xs font-medium text-amber-800">{l.erro}</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-xs text-slate-500">
                          {formatarData(`${l.date}T12:00:00Z`)}
                        </span>
                        {l.category && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${alertCategoryBadgeClasses[l.category]}`}
                          >
                            {alertCategoryLabels[l.category]}
                          </span>
                        )}
                        {!l.isActive && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Inativo
                          </span>
                        )}
                      </div>
                    )}

                    {!l.erro && l.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                        {l.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
            <BotaoImportar quantos={validas.length} />
            <Link
              href="/admin/alertas"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
