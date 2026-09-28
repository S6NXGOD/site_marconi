"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Ações das Perguntas frequentes (painel → Perguntas frequentes). */

export type PerguntaFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"question" | "answer", string>>;
};

const LIMITE_PERGUNTA = 200;
const LIMITE_RESPOSTA = 2000;

async function exigirSessao() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
}

function revalidar() {
  revalidatePath("/");
  revalidatePath("/admin/perguntas");
}

function lerFormulario(formData: FormData) {
  return {
    question: String(formData.get("question") ?? "").trim(),
    // Quebra de linha do Windows vira \n: o site separa parágrafo por linha
    // em branco, e "\r\n\r\n" não casaria.
    answer: String(formData.get("answer") ?? "").replace(/\r\n/g, "\n").trim(),
    isActive: formData.get("isActive") === "on",
  };
}

function validar(d: ReturnType<typeof lerFormulario>): PerguntaFormState | null {
  const errors: PerguntaFormState["errors"] = {};
  if (d.question.length < 5) errors.question = "Escreva a pergunta.";
  else if (d.question.length > LIMITE_PERGUNTA)
    errors.question = `Pergunta longa demais — até ${LIMITE_PERGUNTA} caracteres.`;
  if (d.answer.length < 10) errors.answer = "Escreva a resposta.";
  else if (d.answer.length > LIMITE_RESPOSTA)
    errors.answer = `Resposta longa demais — até ${LIMITE_RESPOSTA.toLocaleString("pt-BR")} caracteres.`;

  return Object.keys(errors).length > 0
    ? { status: "error", message: "Confira os campos destacados.", errors }
    : null;
}

export async function criarPergunta(
  _prev: PerguntaFormState,
  formData: FormData
): Promise<PerguntaFormState> {
  await exigirSessao();
  const dados = lerFormulario(formData);
  const invalido = validar(dados);
  if (invalido) return invalido;

  // Pergunta nova entra no fim da lista; a ordem se ajusta pelas setas.
  const { _max } = await prisma.faqItem.aggregate({ _max: { order: true } });
  await prisma.faqItem.create({ data: { ...dados, order: (_max.order ?? -1) + 1 } });

  revalidar();
  redirect("/admin/perguntas?ok=created");
}

export async function atualizarPergunta(
  id: string,
  _prev: PerguntaFormState,
  formData: FormData
): Promise<PerguntaFormState> {
  await exigirSessao();
  const dados = lerFormulario(formData);
  const invalido = validar(dados);
  if (invalido) return invalido;

  await prisma.faqItem.update({ where: { id }, data: dados });
  revalidar();
  redirect("/admin/perguntas?ok=updated");
}

export async function excluirPergunta(id: string) {
  await exigirSessao();
  // Já apagada (clique duplo, outra aba): nada a fazer.
  await prisma.faqItem.deleteMany({ where: { id } });
  revalidar();
}

export async function alternarPergunta(id: string, isActive: boolean) {
  await exigirSessao();
  await prisma.faqItem.update({ where: { id }, data: { isActive } });
  revalidar();
}

/**
 * Sobe ou desce uma posição, trocando com a vizinha. Renumera a lista
 * inteira (0, 1, 2…) — de quebra, conserta ordens repetidas.
 */
export async function moverPergunta(id: string, direcao: "cima" | "baixo") {
  await exigirSessao();
  const todas = await prisma.faqItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const i = todas.findIndex((p) => p.id === id);
  const j = direcao === "cima" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= todas.length) return;

  [todas[i], todas[j]] = [todas[j], todas[i]];
  await prisma.$transaction(
    todas.map((p, ordem) => prisma.faqItem.update({ where: { id: p.id }, data: { order: ordem } }))
  );
  revalidar();
}
