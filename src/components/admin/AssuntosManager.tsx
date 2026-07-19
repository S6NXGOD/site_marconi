"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  renomearAssunto,
  mesclarAssuntos,
  excluirAssunto,
  type AssuntoResultado,
} from "@/app/admin/actions";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  /** ISO — a data vem serializada do servidor */
  createdAt: string;
};

type Ordem = "uso" | "az" | "recentes";
type Acao = { id: string; tipo: "rename" | "merge" | "delete" } | null;

const ordens: { valor: Ordem; label: string }[] = [
  { valor: "uso", label: "Mais usadas" },
  { valor: "az", label: "A–Z" },
  { valor: "recentes", label: "Recentes" },
];

function normaliza(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Central de Assuntos: lista com busca e ordenação, e por linha as operações
 * de renomear, mesclar (juntar duplicadas) e excluir do sistema. Cada operação
 * chama uma server action e recarrega os dados frescos.
 */
export default function AssuntosManager({ tags }: { tags: TagItem[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("uso");
  const [acao, setAcao] = useState<Acao>(null);
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();

  const semUso = tags.filter((t) => t.count === 0).length;

  const visiveis = useMemo(() => {
    const q = normaliza(busca.trim());
    const lista = tags.filter((t) => !q || normaliza(t.name).includes(q));
    const ordenada = [...lista];
    if (ordem === "uso") {
      ordenada.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));
    } else if (ordem === "az") {
      ordenada.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    } else {
      ordenada.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return ordenada;
  }, [tags, busca, ordem]);

  function executar(fn: () => Promise<AssuntoResultado>) {
    setErro("");
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível concluir.");
        return;
      }
      setAcao(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {erro && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {erro}
        </div>
      )}

      {/* Barra: busca + ordenação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar assunto…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {ordens.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setOrdem(o.valor)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                ordem === o.valor ? "bg-white text-marconi shadow-sm" : "text-slate-500 hover:text-conplan"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <p className="text-xs text-slate-400">
        {tags.length} {tags.length === 1 ? "assunto" : "assuntos"}
        {semUso > 0 && (
          <>
            {" · "}
            <span className="font-medium text-amber-600">{semUso} sem uso</span>
          </>
        )}
      </p>

      {/* Lista */}
      {visiveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
          {tags.length === 0
            ? "Nenhum assunto ainda. Eles nascem ao marcar notícias."
            : "Nenhum assunto encontrado para essa busca."}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {visiveis.map((t) => (
            <li key={t.id} className="px-4 py-3">
              {acao?.id === t.id && acao.tipo === "rename" ? (
                <FormRenomear
                  tag={t}
                  pendente={pendente}
                  onCancelar={() => setAcao(null)}
                  onConfirmar={(nome) => executar(() => renomearAssunto(t.id, nome))}
                />
              ) : acao?.id === t.id && acao.tipo === "merge" ? (
                <FormMesclar
                  tag={t}
                  outras={tags.filter((o) => o.id !== t.id)}
                  pendente={pendente}
                  onCancelar={() => setAcao(null)}
                  onConfirmar={(destinoId) => executar(() => mesclarAssuntos(t.id, destinoId))}
                />
              ) : acao?.id === t.id && acao.tipo === "delete" ? (
                <ConfirmaExcluir
                  tag={t}
                  pendente={pendente}
                  onCancelar={() => setAcao(null)}
                  onConfirmar={() => executar(() => excluirAssunto(t.id))}
                />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-conplan">{t.name}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {t.count > 0 ? (
                        `${t.count} ${t.count === 1 ? "notícia" : "notícias"}`
                      ) : (
                        <span className="text-amber-600">sem uso</span>
                      )}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <BotaoAcao titulo="Renomear" onClick={() => { setErro(""); setAcao({ id: t.id, tipo: "rename" }); }}>
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </BotaoAcao>
                    <BotaoAcao titulo="Mesclar em outro" onClick={() => { setErro(""); setAcao({ id: t.id, tipo: "merge" }); }}>
                      <path d="M7 3v6a5 5 0 0 0 5 5 5 5 0 0 0 5-5V3M12 14v7M8 18h8" />
                    </BotaoAcao>
                    <BotaoAcao titulo="Excluir do sistema" perigo onClick={() => { setErro(""); setAcao({ id: t.id, tipo: "delete" }); }}>
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </BotaoAcao>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BotaoAcao({
  titulo,
  onClick,
  perigo,
  children,
}: {
  titulo: string;
  onClick: () => void;
  perigo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors ${
        perigo ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-marconi/10 hover:text-marconi"
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function FormRenomear({
  tag,
  pendente,
  onCancelar,
  onConfirmar,
}: {
  tag: TagItem;
  pendente: boolean;
  onCancelar: () => void;
  onConfirmar: (nome: string) => void;
}) {
  const [nome, setNome] = useState(tag.name);
  const mudou = nome.trim() && nome.trim() !== tag.name;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        autoFocus
        type="text"
        value={nome}
        maxLength={40}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && mudou) onConfirmar(nome.trim());
          if (e.key === "Escape") onCancelar();
        }}
        className="flex-1 rounded-lg border border-marconi bg-white px-3 py-2 text-sm text-conplan outline-none ring-2 ring-marconi/20"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!mudou || pendente}
          onClick={() => onConfirmar(nome.trim())}
          className="rounded-lg bg-marconi px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-marconi-dark disabled:opacity-50"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onCancelar} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:text-conplan">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function FormMesclar({
  tag,
  outras,
  pendente,
  onCancelar,
  onConfirmar,
}: {
  tag: TagItem;
  outras: TagItem[];
  pendente: boolean;
  onCancelar: () => void;
  onConfirmar: (destinoId: string) => void;
}) {
  const opcoes = useMemo(
    () => [...outras].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")),
    [outras]
  );
  const [destino, setDestino] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-sm text-conplan">
        Mesclar <strong className="font-semibold">{tag.name}</strong> em outro assunto — as{" "}
        {tag.count} {tag.count === 1 ? "notícia passa" : "notícias passam"} a usar o destino, e{" "}
        <strong className="font-semibold">{tag.name}</strong> é apagado.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          autoFocus
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-conplan outline-none focus:border-marconi focus:ring-2 focus:ring-marconi/20"
        >
          <option value="">Escolha o assunto de destino…</option>
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.count})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!destino || pendente}
            onClick={() => onConfirmar(destino)}
            className="rounded-lg bg-marconi px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-marconi-dark disabled:opacity-50"
          >
            {pendente ? "Mesclando…" : "Mesclar"}
          </button>
          <button type="button" onClick={onCancelar} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:text-conplan">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmaExcluir({
  tag,
  pendente,
  onCancelar,
  onConfirmar,
}: {
  tag: TagItem;
  pendente: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-conplan">
        Excluir <strong className="font-semibold">{tag.name}</strong>?{" "}
        {tag.count > 0 ? (
          <span className="text-slate-500">
            {tag.count} {tag.count === 1 ? "notícia perde" : "notícias perdem"} esta tag (o texto fica intacto).
          </span>
        ) : (
          <span className="text-slate-500">Não está em uso.</span>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={pendente}
          onClick={onConfirmar}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {pendente ? "Excluindo…" : "Excluir"}
        </button>
        <button type="button" onClick={onCancelar} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:text-conplan">
          Cancelar
        </button>
      </div>
    </div>
  );
}
