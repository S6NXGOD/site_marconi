import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dataDeInput, inputDeData } from "@/lib/datas";
import {
  anosDisponiveis,
  mesesDisponiveis,
  raspaMeses,
  ANO_PADRAO,
  type Obrigacao,
} from "@/lib/agenda-piaui";

export const runtime = "nodejs";
// Vários meses, cada um com pausa educada — o padrão da rota não dá conta.
export const maxDuration = 120;

async function autorizado() {
  return Boolean(await getServerSession(authOptions));
}

/** GET ?ano=2026 → anos publicados + meses disponíveis daquele ano. */
export async function GET(request: Request) {
  if (!(await autorizado()))
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const ano = Number(new URL(request.url).searchParams.get("ano")) || ANO_PADRAO;
  try {
    const [anos, meses] = await Promise.all([
      anosDisponiveis(),
      mesesDisponiveis(ano),
    ]);
    return NextResponse.json({ ano, anos, meses });
  } catch (e) {
    return NextResponse.json(
      { error: "Não consegui ler a agenda no site de origem." },
      { status: 502 }
    );
  }
}

/**
 * POST — duas ações:
 *   { acao: "preview", ano, meses:[...] }  → raspa e devolve as obrigações
 *   { acao: "importar", itens:[...], ativo } → grava como Alert (dedup)
 */
export async function POST(request: Request) {
  if (!(await autorizado()))
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  let corpo: any;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (corpo?.acao === "preview") {
    const ano = Number(corpo.ano) || ANO_PADRAO;
    const meses: string[] = Array.isArray(corpo.meses) ? corpo.meses.map(String) : [];
    if (meses.length === 0)
      return NextResponse.json({ error: "Selecione ao menos um mês." }, { status: 400 });
    try {
      const obrigacoes = await raspaMeses(ano, meses);
      return NextResponse.json({ obrigacoes });
    } catch (e) {
      return NextResponse.json(
        { error: "Falha ao raspar os meses selecionados." },
        { status: 502 }
      );
    }
  }

  if (corpo?.acao === "importar") {
    return importar(corpo.itens, Boolean(corpo.ativo));
  }

  return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
}

type ItemImport = Pick<
  Obrigacao,
  "data" | "codigo" | "descricao" | "tipo_setor" | "fundamentacao"
>;

const chave = (titulo: string, dia: string) =>
  `${titulo.trim().toLowerCase()}|${dia}`;

async function importar(itens: unknown, ativo: boolean) {
  if (!Array.isArray(itens) || itens.length === 0)
    return NextResponse.json({ error: "Nada selecionado." }, { status: 400 });

  const existentes = await prisma.alert.findMany({ select: { title: true, date: true } });
  const vistos = new Set(existentes.map((a) => chave(a.title, inputDeData(a.date))));

  const novos: {
    title: string;
    date: Date;
    category: "PUBLICO" | "PRIVADO";
    description: string;
    isActive: boolean;
  }[] = [];

  let ignorados = 0;
  for (const bruto of itens as ItemImport[]) {
    const codigo = String(bruto?.codigo ?? "").trim();
    const descricao = String(bruto?.descricao ?? "").trim();
    const dataISO = String(bruto?.data ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) { ignorados++; continue; }

    const title = (codigo || descricao).slice(0, 160).trim();
    const date = dataDeInput(dataISO);
    if (title.length < 3 || !date) { ignorados++; continue; }

    const k = chave(title, dataISO);
    if (vistos.has(k)) { ignorados++; continue; }
    vistos.add(k);

    // AlertCategory só tem PUBLICO/PRIVADO — AMBOS entra como PRIVADO.
    const category = bruto?.tipo_setor === "PUBLICO" ? "PUBLICO" : "PRIVADO";
    const partes = [descricao || codigo];
    if (bruto?.tipo_setor === "AMBOS") partes.push("(Aplica-se a setor público e privado.)");
    if (bruto?.fundamentacao) partes.push(`Base legal: ${bruto.fundamentacao}.`);

    novos.push({
      title,
      date,
      category,
      description: partes.join(" ").slice(0, 1000),
      isActive: ativo,
    });
  }

  if (novos.length === 0)
    return NextResponse.json({ criados: 0, ignorados, message: "Nada novo (tudo já cadastrado)." });

  const r = await prisma.alert.createMany({ data: novos });
  return NextResponse.json({ criados: r.count, ignorados });
}
