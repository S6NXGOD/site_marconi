import type { AlertCategory } from "@prisma/client";

/**
 * Leitura de CSV de alertas.
 *
 * Roda nos dois lados: o painel usa para montar a prévia e a server action usa
 * para importar de verdade. É o mesmo código de propósito — a prévia não pode
 * prometer uma coisa e o servidor gravar outra. A validação do servidor é a
 * que vale; a do cliente é só para a pessoa ver antes.
 */

/**
 * Descobre o separador pelo cabeçalho.
 *
 * O Excel em português salva "CSV" com PONTO E VÍRGULA, porque a vírgula já é
 * o separador decimal. Assumir vírgula faria o arquivo que o usuário exportou
 * do Excel cair inteiro numa coluna só.
 */
function detectarSeparador(texto: string): string {
  const primeira = texto.split(/\r?\n/, 1)[0] ?? "";
  let melhor = ",";
  let max = 0;
  for (const cand of [";", ",", "\t"]) {
    const n = primeira.split(cand).length - 1;
    if (n > max) {
      max = n;
      melhor = cand;
    }
  }
  return melhor;
}

/** Parser CSV (RFC 4180): aspas, aspas escapadas ("") e quebra de linha dentro do campo. */
export function parseCSV(entrada: string): string[][] {
  // O Excel prefixa um BOM que gruda no primeiro cabeçalho e quebra o
  // reconhecimento da coluna ("﻿titulo" !== "titulo").
  const texto = entrada.charCodeAt(0) === 0xfeff ? entrada.slice(1) : entrada;
  const sep = detectarSeparador(texto);

  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let emAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (emAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          emAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') emAspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else if (c !== "\r") campo += c;
  }

  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  // Linha em branco no fim do arquivo é regra, não exceção.
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

function semAcento(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Aceita 2026-07-20 e 20/07/2026 — e recusa dia inexistente (31/02). */
export function parseDataBR(valor: string): string | null {
  const v = valor.trim();
  let ano: number, mes: number, dia: number;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);

  if (iso) [, ano, mes, dia] = iso.map(Number) as unknown as number[];
  else if (br) {
    dia = Number(br[1]);
    mes = Number(br[2]);
    ano = Number(br[3]);
  } else return null;

  // new Date "conserta" 31/02 virando 03/03 em silêncio. Comparar de volta é
  // o que pega a data que não existe.
  const d = new Date(Date.UTC(ano, mes - 1, dia, 12));
  if (
    d.getUTCFullYear() !== ano ||
    d.getUTCMonth() !== mes - 1 ||
    d.getUTCDate() !== dia
  )
    return null;

  const p = (n: number) => String(n).padStart(2, "0");
  return `${ano}-${p(mes)}-${p(dia)}`;
}

/** Aceita PUBLICO, "Gestão Pública", CONPLAN, privado, "Setor Privado"... */
export function parseCategoriaAlerta(valor: string): AlertCategory | null {
  const v = semAcento(valor);
  if (!v) return null;
  if (v.includes("public") || v.includes("conplan") || v.includes("prefeitur"))
    return "PUBLICO";
  if (v.includes("privad") || v.includes("empresa") || v.includes("marconi"))
    return "PRIVADO";
  return null;
}

function parseBool(valor: string): boolean {
  const v = semAcento(valor);
  if (!v) return true; // coluna opcional: sem valor, o alerta entra ativo
  return ["sim", "s", "true", "1", "ativo", "x", "yes"].includes(v);
}

export type LinhaAlerta = {
  /** linha no arquivo, contando o cabeçalho — é o que a pessoa vê no Excel */
  linha: number;
  title: string;
  /** yyyy-mm-dd */
  date: string;
  category: AlertCategory | null;
  description: string;
  isActive: boolean;
  /** preenchido quando a linha não pode ser importada */
  erro?: string;
};

const COLUNAS: Record<string, keyof LinhaAlerta> = {
  titulo: "title",
  title: "title",
  nome: "title",
  assunto: "title",
  data: "date",
  date: "date",
  prazo: "date",
  vencimento: "date",
  "data limite": "date",
  categoria: "category",
  category: "category",
  vertente: "category",
  tipo: "category",
  descricao: "description",
  description: "description",
  detalhe: "description",
  detalhes: "description",
  observacao: "description",
  ativo: "isActive",
  active: "isActive",
  publicado: "isActive",
  status: "isActive",
};

/** Ordem assumida quando o arquivo vem sem cabeçalho. */
const ORDEM_PADRAO: (keyof LinhaAlerta)[] = [
  "title",
  "date",
  "category",
  "description",
  "isActive",
];

export const CSV_MODELO =
  "titulo;data;categoria;descricao;ativo\n" +
  '"Prestação de contas ao TCE-PI";31/07/2026;Gestão Pública;"Envio do balancete mensal pelo sistema SAGRES.";sim\n' +
  '"DCTF Mensal";20/08/2026;Setor Privado;"Entrega da declaração de débitos e créditos tributários federais.";sim\n';

/**
 * Converte o texto do CSV em linhas de alerta, cada uma já validada.
 *
 * Nunca lança: linha ruim volta com `erro` preenchido, para o painel mostrar o
 * que houve em vez de recusar o arquivo inteiro por causa de uma linha.
 */
export function lerAlertasCSV(texto: string): LinhaAlerta[] {
  const linhas = parseCSV(texto);
  if (linhas.length === 0) return [];

  // Cabeçalho é opcional: se a primeira linha nomeia colunas conhecidas, ela
  // manda na ordem; senão o arquivo já começa nos dados.
  const primeira = linhas[0].map((c) => semAcento(c));
  const temCabecalho = primeira.some((c) => c in COLUNAS);

  const mapa: (keyof LinhaAlerta | null)[] = temCabecalho
    ? primeira.map((c) => COLUNAS[c] ?? null)
    : ORDEM_PADRAO;

  const dados = temCabecalho ? linhas.slice(1) : linhas;
  const deslocamento = temCabecalho ? 2 : 1;

  return dados.map((colunas, i) => {
    const pega = (campo: keyof LinhaAlerta): string => {
      const idx = mapa.indexOf(campo);
      return idx >= 0 ? (colunas[idx] ?? "").trim() : "";
    };

    const title = pega("title");
    const dataCrua = pega("date");
    const categoriaCrua = pega("category");
    const description = pega("description");

    const date = parseDataBR(dataCrua);
    const category = parseCategoriaAlerta(categoriaCrua);

    const item: LinhaAlerta = {
      linha: i + deslocamento,
      title,
      date: date ?? "",
      category,
      description,
      isActive: parseBool(pega("isActive")),
    };

    // Mesmas regras do cadastro manual — importar não pode ser a porta dos
    // fundos para um alerta que o formulário recusaria.
    if (title.length < 4) item.erro = "Título muito curto (mín. 4 caracteres).";
    else if (!dataCrua) item.erro = "Data em branco.";
    else if (!date) item.erro = `Data inválida: "${dataCrua}". Use 31/07/2026.`;
    else if (!categoriaCrua) item.erro = "Categoria em branco.";
    else if (!category)
      item.erro = `Categoria inválida: "${categoriaCrua}". Use Gestão Pública ou Setor Privado.`;
    else if (description.length < 10)
      item.erro = "Descrição muito curta (mín. 10 caracteres).";

    return item;
  });
}

export type AlertaNovo = {
  title: string;
  /** yyyy-mm-dd — quem converte para Date é quem grava */
  date: string;
  category: AlertCategory;
  description: string;
  isActive: boolean;
};

/** Mesmo título no mesmo dia = mesmo alerta. */
function chaveDoAlerta(titulo: string, dia: string): string {
  return `${titulo.trim().toLowerCase()}|${dia}`;
}

/**
 * Separa o que entra do que já existe.
 *
 * Reimportar a mesma planilha é o erro mais fácil de cometer — e duplicaria
 * cada prazo. Também pega a linha repetida dentro do próprio arquivo, senão a
 * verificação contra o banco deixaria passar duas cópias na mesma leva.
 */
export function filtrarNovos(
  linhas: LinhaAlerta[],
  jaCadastrados: { title: string; dia: string }[]
): { novos: AlertaNovo[]; repetidos: number } {
  const vistos = new Set(
    jaCadastrados.map((a) => chaveDoAlerta(a.title, a.dia))
  );

  const novos: AlertaNovo[] = [];
  let repetidos = 0;

  for (const l of linhas) {
    if (l.erro || !l.category) continue;

    const chave = chaveDoAlerta(l.title, l.date);
    if (vistos.has(chave)) {
      repetidos++;
      continue;
    }
    vistos.add(chave);

    novos.push({
      title: l.title,
      date: l.date,
      category: l.category,
      description: l.description,
      isActive: l.isActive,
    });
  }

  return { novos, repetidos };
}
