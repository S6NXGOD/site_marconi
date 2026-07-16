import type { LeadStatus } from "@prisma/client";

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Em contato",
  CLOSED: "Concluído",
};

export const leadStatusClasses: Record<LeadStatus, string> = {
  NEW: "bg-amber-50 text-amber-700 ring-amber-200",
  CONTACTED: "bg-blue-50 text-blue-700 ring-blue-200",
  CLOSED: "bg-green-50 text-green-700 ring-green-200",
};

export const leadStatusOrder: LeadStatus[] = ["NEW", "CONTACTED", "CLOSED"];

/** Telefone só com dígitos, com DDI 55 — para montar o link do WhatsApp. */
export function toWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}
