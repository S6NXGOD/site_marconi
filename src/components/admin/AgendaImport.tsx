"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatarDiaPrazo } from "@/lib/datas";

type Obrigacao = {
  ano: number;
  mes: string;
  data: string;
  dia: number;
  codigo: string;
  descricao: string;
  fundamentacao: string | null;
  tipo_setor: "PUBLICO" | "PRIVADO" | "AMBOS";
  relevante: boolean;
};
type Mes = { mes: string; nome: string; url: string };

const chaveDe = (o: Obrigacao) => `${o.data}|${o.codigo}`;

export default function AgendaImport() {
  const [anos, setAnos] = useState<number[]>([]);
  const [ano, setAno] = useState<number | null>(null);
  const [meses, setMeses] = useState<Mes[]>([]);
  const [mesesSel, setMesesSel] = useState<Set<string>>(new Set());

  const [obrig, setObrig] = useState<Obrigacao[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState<"anos" | "meses" | "preview" | "import" | null>("anos");
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState("");

  // Carrega anos + meses do ano padrão ao abrir.
  useEffect(() => {
    fetch("/api/admin/agenda")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setAnos(d.anos ?? []);
        setAno(d.ano ?? null);
        setMeses(d.meses ?? []);
      })
      .catch((e) => setErro(String(e.message || e)))
      .finally(() => setCarregando(null));
  }, []);

  async function trocarAno(novo: number) {
    setAno(novo);
    setMeses([]);
    setMesesSel(new Set());
    setObrig(null);
    setErro("");
    setCarregando("meses");
    try {
      const d = await (await fetch(`/api/admin/agenda?ano=${novo}`)).json();
      if (d.error) throw new Error(d.error);
      setMeses(d.meses ?? []);
    } catch (e: any) {
      setErro(String(e.message || e));
    } finally {
      setCarregando(null);
    }
  }

  function alternarMes(mes: string) {
    setMesesSel((s) => {
      const n = new Set(s);
      n.has(mes) ? n.delete(mes) : n.add(mes);
      return n;
    });
  }

  async function buscar() {
    if (mesesSel.size === 0 || !ano) return;
    setErro("");
    setResultado("");
    setCarregando("preview");
    try {
      const d = await (
        await fetch("/api/admin/agenda", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "preview", ano, meses: Array.from(mesesSel) }),
        })
      ).json();
      if (d.error) throw new Error(d.error);
      const lista: Obrigacao[] = d.obrigacoes ?? [];
      setObrig(lista);
      // Pré-seleciona só as relevantes (destaque = sugestão de importar).
      setSel(new Set(lista.filter((o) => o.relevante).map(chaveDe)));
    } catch (e: any) {
      setErro(String(e.message || e));
    } finally {
      setCarregando(null);
    }
  }

  function alternarItem(k: string) {
    setSel((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  }

  async function importar() {
    if (!obrig || sel.size === 0) return;
    setErro("");
    setResultado("");
    setCarregando("import");
    try {
      const itens = obrig
        .filter((o) => sel.has(chaveDe(o)))
        .map((o) => ({
          data: o.data,
          codigo: o.codigo,
          descricao: o.descricao,
          tipo_setor: o.tipo_setor,
          fundamentacao: o.fundamentacao,
        }));
      const d = await (
        await fetch("/api/admin/agenda", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "importar", itens, ativo }),
        })
      ).json();
      if (d.error) throw new Error(d.error);
      setResultado(
        `${d.criados} prazo(s) importado(s) como ${ativo ? "ativos" : "inativos"}.` +
          (d.ignorados ? ` ${d.ignorados} ignorado(s) (já existiam).` : "")
      );
    } catch (e: any) {
      setErro(String(e.message || e));
    } finally {
      setCarregando(null);
    }
  }

  const relevantes = useMemo(() => (obrig ?? []).filter((o) => o.relevante).length, [obrig]);

  return (
    <div className="space-y-6">
      {erro && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {erro}
        </div>
      )}
      {resultado && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {resultado} <Link href="/admin/alertas" className="font-semibold underline">Ver em Alertas</Link>
        </div>
      )}

      {/* ——— Ano + meses ——— */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-conplan">Ano:</label>
          <select
            value={ano ?? ""}
            disabled={carregando === "anos" || anos.length === 0}
            onChange={(e) => trocarAno(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-conplan outline-none focus:border-marconi focus:ring-2 focus:ring-marconi/20"
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {carregando === "anos" && <span className="text-xs text-slate-400">carregando anos…</span>}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-conplan">
            Meses disponíveis {carregando === "meses" && <span className="text-xs font-normal text-slate-400">carregando…</span>}
          </p>
          {meses.length === 0 && carregando !== "meses" ? (
            <p className="text-sm text-slate-400">Nenhum mês publicado para {ano}.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {meses.map((m) => {
                const on = mesesSel.has(m.mes);
                return (
                  <button
                    key={m.mes}
                    type="button"
                    onClick={() => alternarMes(m.mes)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                      on ? "bg-marconi text-white ring-marconi" : "bg-white text-conplan ring-slate-300 hover:ring-marconi"
                    }`}
                  >
                    {m.nome}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={buscar}
            disabled={mesesSel.size === 0 || carregando === "preview"}
            className="inline-flex items-center gap-2 rounded-full bg-conplan px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-conplan-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando === "preview" ? "Buscando…" : `Buscar obrigações (${mesesSel.size} ${mesesSel.size === 1 ? "mês" : "meses"})`}
          </button>
        </div>
      </div>

      {/* ——— Resultado da raspagem ——— */}
      {obrig && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          {/* Barra de seleção + import */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-conplan">{obrig.length} obrigações</span>
              <span className="text-slate-400">·</span>
              <span className="text-marconi-dark">{relevantes} relevantes</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-conplan">{sel.size} selecionadas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <BotaoMini onClick={() => setSel(new Set(obrig.filter((o) => o.relevante).map(chaveDe)))}>Só relevantes</BotaoMini>
              <BotaoMini onClick={() => setSel(new Set(obrig.map(chaveDe)))}>Todas</BotaoMini>
              <BotaoMini onClick={() => setSel(new Set())}>Limpar</BotaoMini>
            </div>
          </div>

          {/* Lista */}
          <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
            {obrig.map((o) => {
              const k = chaveDe(o);
              const on = sel.has(k);
              return (
                <li
                  key={k}
                  className={`flex items-start gap-3 px-4 py-3 ${o.relevante ? "bg-marconi/[0.03]" : ""} ${on ? "" : "opacity-70"}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => alternarItem(k)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-marconi focus:ring-marconi"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {formatarDiaPrazo(`${o.data}T12:00:00Z`)}
                      </span>
                      {o.relevante ? (
                        <span className="rounded-full bg-marconi/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-marconi-dark">Relevante</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400">Específico</span>
                      )}
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                        {o.tipo_setor === "PUBLICO" ? "Público" : o.tipo_setor === "AMBOS" ? "Ambos" : "Privado"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium leading-snug text-conplan">{o.codigo || "(sem título)"}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{o.descricao}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Importar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
            <label className="flex items-center gap-2 text-sm text-conplan">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi" />
              Importar já ativos (aparecem no site)
            </label>
            <button
              type="button"
              onClick={importar}
              disabled={sel.size === 0 || carregando === "import"}
              className="inline-flex items-center gap-2 rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {carregando === "import" ? "Importando…" : `Importar ${sel.size} selecionada(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BotaoMini({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-conplan transition-colors hover:border-marconi hover:text-marconi"
    >
      {children}
    </button>
  );
}
