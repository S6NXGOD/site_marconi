"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type LeadState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Protocolo mostrado ao usuário no comprovante de envio. */
  protocol?: string;
  /** Nome informado, usado na mensagem de confirmação. */
  name?: string;
  errors?: Partial<Record<"name" | "company" | "phone" | "need", string>>;
};

// Formulário público: 5 envios por IP a cada 10 minutos.
const LIMITE = 5;
const JANELA_MS = 10 * 60 * 1000;

/**
 * Server Action: persiste o contato do formulário "Fale Conosco" da home.
 *
 * É PÚBLICA por natureza (qualquer visitante envia), então tem duas defesas
 * contra flood de bots: honeypot + rate limit por IP.
 */
export async function createCommercialLead(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  // 1) Honeypot: campo invisível. Humano nunca preenche; bot preenche tudo.
  //    Responde "sucesso" de propósito, para o bot não descobrir o filtro.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return {
      status: "success",
      message: "Recebemos seu contato! Nossa equipe retornará em breve.",
    };
  }

  // 2) Rate limit por IP.
  //    Envolto em try/catch de propósito: captar o lead é crítico para o
  //    negócio, o rate limit é proteção secundária. Se a leitura do IP falhar,
  //    seguimos com o cadastro em vez de perder o contato do cliente.
  try {
    const ip = clientIp(headers());
    const { ok, resetEmSegundos } = rateLimit(`lead:${ip}`, LIMITE, JANELA_MS);
    if (!ok) {
      const minutos = Math.max(1, Math.ceil(resetEmSegundos / 60));
      return {
        status: "error",
        message: `Muitas tentativas. Aguarde ${minutos} minuto(s) e tente novamente — ou fale conosco pelo WhatsApp.`,
      };
    }
  } catch (error) {
    console.warn("[lead] rate limit indisponível, seguindo sem ele:", error);
  }

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const need = String(formData.get("need") ?? "").trim();

  const errors: LeadState["errors"] = {};
  if (name.length < 2) errors.name = "Informe seu nome.";
  if (company.length < 2) errors.company = "Informe o nome da empresa ou município.";
  if (phone.replace(/\D/g, "").length < 8) errors.phone = "Telefone inválido.";
  if (need.length < 5) errors.need = "Descreva sua necessidade.";

  // Limites de tamanho: evita alguém gravar megabytes no banco.
  if (name.length > 120) errors.name = "Nome muito longo.";
  if (company.length > 160) errors.company = "Nome muito longo.";
  if (phone.length > 40) errors.phone = "Telefone inválido.";
  if (need.length > 2000) errors.need = "Mensagem muito longa (máx. 2000 caracteres).";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifique os campos destacados.", errors };
  }

  try {
    const lead = await prisma.commercialLead.create({
      data: { name, company, phone, need },
    });

    return {
      status: "success",
      message: "Recebemos seu contato! Nossa equipe retornará em breve.",
      // Protocolo curto e legível derivado do id do lead.
      protocol: lead.id.slice(-6).toUpperCase(),
      name: name.split(" ")[0], // primeiro nome
    };
  } catch (error) {
    console.error("Falha ao salvar CommercialLead:", error);
    return {
      status: "error",
      message:
        "Não foi possível registrar seu contato agora. Tente novamente em instantes.",
    };
  }
}
