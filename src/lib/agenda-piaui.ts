import * as cheerio from "cheerio";
import { buscarHtml } from "./scrape-fetch";

/**
 * Raspagem da Agenda Tributária ESTADUAL do Piauí (ICMS) do contadores.cnt.br.
 *
 * A página é HTML estático — cheerio dá conta, sem navegador. Reaproveita o
 * `buscarHtml` (guarda SSRF + cabeçalhos de navegador) do módulo de scraping.
 *
 * Puro (sem banco, sem Next): roda igual num script (tsx), numa rota ou num
 * teste. A gravação em `Alert` fica por conta de quem chama.
 *
 * O ANO é parâmetro: não fica preso a 2026. `anosDisponiveis()` lista os anos
 * publicados no site (o mesmo para todos os meses).
 */

const ORIGEM = "https://www.contadores.cnt.br";
const BASE = `${ORIGEM}/agenda-tributaria/estadual/piaui`;

/** Ano padrão quando nenhum é informado (o site publica com antecedência). */
export const ANO_PADRAO = 2026;

const NOMES_MES: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

export type TipoSetor = "PUBLICO" | "PRIVADO" | "AMBOS";

export type MesDisponivel = { mes: string; nome: string; url: string };

export type Obrigacao = {
  ano: number;
  /** "01".."12" */
  mes: string;
  /** yyyy-mm-dd (fuso resolvido por quem grava) */
  data: string;
  dia: number;
  /** sigla/nome da obrigação (ex.: "ICMS ST - Simples Nacional") */
  codigo: string;
  descricao: string;
  /** citação legal, quando aparece no texto — melhor esforço, quase sempre null */
  fundamentacao: string | null;
  tipo_setor: TipoSetor;
  /** true = interessa à maioria (destacar); false = nicho, específico demais */
  relevante: boolean;
};

const limpar = (t: string) => (t || "").replace(/\s+/g, " ").trim();

/** Minúsculo e sem acento — base das comparações por palavra-chave. */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const urlAno = (ano: number) => `${BASE}/${ano}.html`;
const urlMes = (ano: number, mm: string) => `${BASE}/${ano}/${mm}.html`;

/* ───────────── Anos disponíveis ───────────── */

/**
 * Lista os anos publicados no site (links `/piaui/AAAA.html`), do mais novo
 * para o mais antigo. Lê a partir da página do ano padrão (que traz a lista de
 * todos os anos na lateral).
 */
export async function anosDisponiveis(): Promise<number[]> {
  const html = await buscarHtml(urlAno(ANO_PADRAO));
  const $ = cheerio.load(html);
  const anos = new Set<number>();
  $('a[href*="/estadual/piaui/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/\/estadual\/piaui\/(\d{4})\.html$/);
    if (m) anos.add(Number(m[1]));
  });
  return Array.from(anos).sort((a, b) => b - a);
}

/* ───────────── Função 1: meses disponíveis (Passo 3) ───────────── */

/**
 * Acessa a página do ANO e lê APENAS os meses já publicados no "Passo 3"
 * (`[data-agenda-meses-lista]`). Devolve número do mês, nome e URL.
 */
export async function mesesDisponiveis(ano: number): Promise<MesDisponivel[]> {
  const html = await buscarHtml(urlAno(ano));
  const $ = cheerio.load(html);

  const meses: MesDisponivel[] = [];
  const vistos = new Set<string>();

  $("[data-agenda-meses-lista] a.agendatributaria-link-anomes").each((_, el) => {
    const $a = $(el);
    const mes = (($a.attr("data-agenda-mes") || "").trim()).padStart(2, "0");
    if (!/^(0[1-9]|1[0-2])$/.test(mes) || vistos.has(mes)) return;
    vistos.add(mes);
    const href = $a.attr("href") || `/agenda-tributaria/estadual/piaui/${ano}/${mes}.html`;
    let url: string;
    try {
      url = new URL(href, ORIGEM).toString();
    } catch {
      url = urlMes(ano, mes);
    }
    meses.push({ mes, nome: NOMES_MES[mes] ?? mes, url });
  });

  return meses.sort((a, b) => a.mes.localeCompare(b.mes));
}

/* ───────────── Função 2: obrigações de um mês ───────────── */

const SEL_DIA = ".agendatributaria-pagedados__content-dia__item";
const SEL_DIA_NOME = ".agendatributaria-pagedados__content-dia__item-header--namedia";
const SEL_ITEM = ".agendatributaria-pagedados__content-dia__item-content-blcitem";
const SEL_ITEM_TITULO = ".agendatributaria-pagedados__content-dia__item-content-blcitem__title";
const SEL_ITEM_DESC = ".agendatributaria-pagedados__content-dia__item-content-blcitem__descricao";

/**
 * Raspa as obrigações de UM mês de UM ano. Cada bloco de dia traz o número do
 * dia; cada item, a sigla e a descrição. A data de vencimento é ano+mês+dia.
 */
export async function raspaMes(ano: number, mes: string): Promise<Obrigacao[]> {
  const mm = mes.trim().padStart(2, "0");
  const html = await buscarHtml(urlMes(ano, mm));
  const $ = cheerio.load(html);

  const out: Obrigacao[] = [];

  $(SEL_DIA).each((_, diaEl) => {
    const $dia = $(diaEl);
    const nomeDia = limpar($dia.find(SEL_DIA_NOME).first().text()); // "Dia 02"
    const dia = Number((nomeDia.match(/\d{1,2}/) || [])[0]);
    if (!dia || dia < 1 || dia > 31) return;
    const data = `${ano}-${mm}-${String(dia).padStart(2, "0")}`;

    $dia.find(SEL_ITEM).each((__, it) => {
      const $it = $(it);
      const codigo = limparCodigo($it.find(SEL_ITEM_TITULO).first().text());
      const descricao = limpar($it.find(SEL_ITEM_DESC).first().text());
      if (!codigo && !descricao) return;

      out.push({
        ano,
        mes: mm,
        data,
        dia,
        codigo,
        descricao,
        fundamentacao: extrairFundamentacao(descricao),
        tipo_setor: classificarSetor(codigo, descricao),
        relevante: ehRelevante(codigo, descricao),
      });
    });
  });

  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Raspa VÁRIOS meses de um ano em sequência, com pausa entre requisições
 * (educação com o servidor e menos chance de bloqueio).
 */
export async function raspaMeses(
  ano: number,
  meses: string[],
  pausaMs = 1500
): Promise<Obrigacao[]> {
  const alvo = meses
    .map((m) => m.trim().padStart(2, "0"))
    .filter((m) => /^(0[1-9]|1[0-2])$/.test(m));

  const todas: Obrigacao[] = [];
  for (let i = 0; i < alvo.length; i++) {
    todas.push(...(await raspaMes(ano, alvo[i])));
    if (i < alvo.length - 1) await sleep(pausaMs);
  }
  return todas;
}

/* ───────────── Limpeza, classificação e relevância ───────────── */

/** Tira o "- " que às vezes prefixa o título e normaliza espaços. */
function limparCodigo(bruto: string): string {
  return limpar(bruto).replace(/^[-–—•\s]+/, "").trim();
}

/**
 * Citação legal dentro da descrição — melhor esforço. A fonte NÃO tem um campo
 * de "Fundamentação Legal"; quando o texto cita uma norma, pega a primeira.
 */
function extrairFundamentacao(descricao: string): string | null {
  const m = descricao.match(
    /\b(?:RICMS|Lei(?:\s+Complementar)?|Decreto|Instru[çc][ãa]o\s+Normativa|Portaria|Conv[êe]nio(?:\s+ICMS)?|Ajuste\s+SINIEF|Resolu[çc][ãa]o|Ato\s+COTEPE)\b[^.;:]{0,60}?(?:n[º°o]?\.?\s*[\d][\d.\/-]*|\/\d{2,4})/i
  );
  return m ? limpar(m[0]) : null;
}

// Marcadores de que o OBRIGADO é o poder público (retenção na fonte por órgãos,
// prefeituras, autarquias). De propósito NÃO inclui "município": em ICMS a
// palavra é geografia, não sujeito público — incluí-la marcaria quase tudo como
// público por engano. Sem `\b` no fim para casar sufixos ("público/pública").
const RE_PUBLICO =
  /orgao[s]?\s+public|administracao\s+public|poder\s+public|ente[s]?\s+public|entidade[s]?\s+public|reparticao\s+public|fundacao\s+public|orgao[s]?\s+da\s+administracao|autarquia|prefeitura/;

// Palavras que indicam obrigação comercial/empresarial (setor privado). Sem `\b`
// no fim (para casar plural/sufixo: "empresas", "contribuintes"); só no começo.
const RE_PRIVADO =
  /\b(?:contribuinte|empresa|estabeleciment|comerci|industri|importador|revendedor|transportador|substitut|simples\s+nacional|optante|distribuidor|atacadist|varejist|produtor)/;

/**
 * Classifica a obrigação por setor.
 *
 * Regra: retenção na fonte por órgãos públicos/prefeituras/autarquias → PÚBLICO;
 * obrigações comerciais/empresariais → PRIVADO; AMBOS quando o texto traz os
 * dois lados. A agenda ESTADUAL é ICMS, quase tudo empresarial (espere PRIVADO).
 */
export function classificarSetor(codigo: string, descricao: string): TipoSetor {
  const texto = norm(`${codigo} ${descricao}`);
  const ehPublico = RE_PUBLICO.test(texto);
  const ehPrivado = RE_PRIVADO.test(texto);

  if (ehPublico && ehPrivado) return "AMBOS";
  if (ehPublico) return "PUBLICO";
  return "PRIVADO";
}

// Obrigações de NICHO — específicas de poucos setores, não interessam à maioria
// dos clientes (combustíveis/SCANC/TRR, energia elétrica, telecom, produtores
// específicos). Estas NÃO ganham destaque na importação.
//
// Só palavras-chave inequívocas: nada de siglas ambíguas (o "DAS" do tributo
// colide com "das" — contração comuníssima do português — e marcaria quase
// tudo). "Nicho vence": se é de setor específico, fica sem destaque mesmo que
// seja substituição tributária.
const RE_NICHO =
  /\b(?:scanc|combustivel|combustiveis|petroleo|alcool\s+anidro|alcool\s+etilico|monofasic|\btrr\b|transportador\s+revendedor|distribuidora?\s+de\s+combust|importador\s+de\s+combust|usina|refinaria|energia\s+eletric|telecomunic|servico[s]?\s+de\s+comunicac|gerador\s+de\s+energia|boletim\s+mensal\s+de\s+producao|\bbmp\b|extrator|minerais|minera(?:cao|dora))/;

/**
 * Vale destacar esta obrigação na importação?
 *
 * Olha só o TÍTULO (código), de propósito: é o nome da obrigação, o sinal
 * limpo do que ela é. A descrição costuma listar setores específicos (minerais,
 * energia…) que fazem uma obrigação AMPLA parecer de nicho — ruído que jogava
 * "Diferencial de Alíquotas" e "Diferimento" para o balde errado.
 *
 * Heurística honesta (não é verdade absoluta — a pessoa ainda escolhe): sem
 * destaque só o que o título já denuncia como de NICHO (combustíveis/SCANC/TRR,
 * energia, telecom, extração). Na dúvida, destaca.
 */
export function ehRelevante(codigo: string, _descricao?: string): boolean {
  return !RE_NICHO.test(norm(codigo));
}
