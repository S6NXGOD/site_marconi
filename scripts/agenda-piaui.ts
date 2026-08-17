/**
 * CLI da Agenda Tributária Estadual do Piauí (ICMS) — 2026.
 *
 * Roda À MÃO, para testar localmente antes de qualquer coisa em produção.
 * NÃO está no boot nem no seed.
 *
 * Uso:
 *   # Função 1 — meses disponíveis (Passo 3)
 *   npx tsx scripts/agenda-piaui.ts --listar
 *
 *   # Função 2 — raspar (preview, NÃO grava nada)
 *   npx tsx scripts/agenda-piaui.ts --meses=01,02
 *   npx tsx scripts/agenda-piaui.ts --meses=all --json > agenda.json
 *
 *   # Importar para Alert (dedup por título+data). INATIVO por padrão:
 *   # entra em /admin/alertas para revisar e ativar só o que interessa.
 *   npx tsx scripts/agenda-piaui.ts --meses=01 --importar
 *   npx tsx scripts/agenda-piaui.ts --meses=01 --importar --ativo   # já ativo
 */
import { PrismaClient, type AlertCategory } from "@prisma/client";
import {
  anosDisponiveis,
  mesesDisponiveis,
  raspaMeses,
  ANO_PADRAO,
  type Obrigacao,
} from "../src/lib/agenda-piaui";
import { dataDeInput, inputDeData } from "../src/lib/datas";

function arg(nome: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return p ? p.split("=").slice(1).join("=") : undefined;
}
const flag = (nome: string) => process.argv.includes(`--${nome}`);

const anoEscolhido = () => Number(arg("ano")) || ANO_PADRAO;

async function resolverMeses(ano: number): Promise<string[]> {
  const bruto = arg("meses");
  if (!bruto) return [];
  if (bruto.toLowerCase() === "all") {
    const disp = await mesesDisponiveis(ano);
    return disp.map((m) => m.mes);
  }
  return bruto.split(",").map((m) => m.trim()).filter(Boolean);
}

/** Título+data em minúsculo — mesma chave de dedup dos alertas. */
const chave = (titulo: string, dia: string) =>
  `${titulo.trim().toLowerCase()}|${dia}`;

async function importar(obrig: Obrigacao[], ativo: boolean) {
  const prisma = new PrismaClient();
  try {
    const existentes = await prisma.alert.findMany({
      select: { title: true, date: true },
    });
    const vistos = new Set(
      existentes.map((a) => chave(a.title, inputDeData(a.date)))
    );

    const novos = [];
    for (const o of obrig) {
      const title = (o.codigo || o.descricao).slice(0, 160).trim();
      if (title.length < 3) continue;
      const k = chave(title, o.data);
      if (vistos.has(k)) continue;
      vistos.add(k);

      const date = dataDeInput(o.data);
      if (!date) continue;

      // AlertCategory só tem PUBLICO/PRIVADO — AMBOS entra como PRIVADO
      // (público mais amplo), preservando o tipo real na descrição.
      const category: AlertCategory = o.tipo_setor === "PUBLICO" ? "PUBLICO" : "PRIVADO";
      const partes = [o.descricao || o.codigo];
      if (o.tipo_setor === "AMBOS") partes.push("(Aplica-se a setor público e privado.)");
      if (o.fundamentacao) partes.push(`Base legal: ${o.fundamentacao}.`);

      novos.push({
        title,
        date,
        category,
        description: partes.join(" ").slice(0, 1000),
        isActive: ativo,
      });
    }

    if (novos.length === 0) {
      console.log("Nada novo para importar (tudo já cadastrado).");
      return;
    }
    const r = await prisma.alert.createMany({ data: novos });
    console.log(
      `Importados ${r.count} alerta(s) como ${ativo ? "ATIVOS" : "INATIVOS"}.` +
        (ativo ? "" : " Ative os relevantes em /admin/alertas.")
    );
  } finally {
    await prisma.$disconnect();
  }
}

function resumo(obrig: Obrigacao[]) {
  const porSetor = { PUBLICO: 0, PRIVADO: 0, AMBOS: 0 } as Record<string, number>;
  const porMes: Record<string, number> = {};
  let comBase = 0;
  let relevantes = 0;
  for (const o of obrig) {
    porSetor[o.tipo_setor]++;
    porMes[o.mes] = (porMes[o.mes] || 0) + 1;
    if (o.fundamentacao) comBase++;
    if (o.relevante) relevantes++;
  }
  console.log(`\nTotal de obrigações: ${obrig.length}`);
  console.log(`Por mês: ${Object.entries(porMes).map(([m, n]) => `${m}=${n}`).join(", ")}`);
  console.log(`Por setor: PRIVADO=${porSetor.PRIVADO}, PUBLICO=${porSetor.PUBLICO}, AMBOS=${porSetor.AMBOS}`);
  console.log(`Relevantes (destaque): ${relevantes}/${obrig.length} | Nicho: ${obrig.length - relevantes}`);
  console.log(`Com base legal detectada: ${comBase}/${obrig.length}`);
}

async function main() {
  if (flag("anos")) {
    const anos = await anosDisponiveis();
    console.log(`Anos disponíveis: ${anos.join(", ")}`);
    return;
  }

  const ano = anoEscolhido();

  if (flag("listar")) {
    const meses = await mesesDisponiveis(ano);
    console.log(`Meses disponíveis em ${ano} (${meses.length}):`);
    for (const m of meses) console.log(`  ${m.mes} ${m.nome} → ${m.url}`);
    return;
  }

  const meses = await resolverMeses(ano);
  if (meses.length === 0) {
    console.log("Nada a fazer. Use --anos, --listar [--ano=2026], ou --meses=01,02 [--ano=2026].");
    return;
  }

  console.error(`Raspando ${ano} meses: ${meses.join(", ")}…`);
  const obrig = await raspaMeses(ano, meses);

  if (flag("json")) {
    // JSON puro na saída padrão (para redirecionar a um arquivo).
    console.log(JSON.stringify(obrig, null, 2));
  } else {
    resumo(obrig);
    console.log("\nAmostra (3 primeiras):");
    console.log(JSON.stringify(obrig.slice(0, 3), null, 2));
  }

  if (flag("importar")) await importar(obrig, flag("ativo"));
}

main().catch((e) => {
  console.error("Falhou:", e);
  process.exitCode = 1;
});
