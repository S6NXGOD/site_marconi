"use server";

import { prisma } from "@/lib/prisma";

export type LeadState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Protocolo mostrado ao usuário no comprovante de envio. */
  protocol?: string;
  /** Nome informado, usado na mensagem de confirmação. */
  name?: string;
  errors?: Partial<Record<"name" | "company" | "phone" | "need", string>>;
};

// Server Action: persiste o contato do formulário "Fale Conosco" da home.
export async function createCommercialLead(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const need = String(formData.get("need") ?? "").trim();

  const errors: LeadState["errors"] = {};
  if (name.length < 2) errors.name = "Informe seu nome.";
  if (company.length < 2) errors.company = "Informe o nome da empresa ou município.";
  if (phone.replace(/\D/g, "").length < 8) errors.phone = "Telefone inválido.";
  if (need.length < 5) errors.need = "Descreva sua necessidade.";

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
