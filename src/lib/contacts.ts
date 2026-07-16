/* ────────────────────────────────────────────────────────────
   ⚠️  TROQUE PELOS NÚMEROS REAIS DO GRUPO.
   Fonte única: usada pelo float do WhatsApp e pelo "Fale Conosco".
   `phone` → formato internacional, só dígitos: 55 + DDD + número
   ──────────────────────────────────────────────────────────── */
export const CONTACTS = {
  administrativo: {
    phone: "5586900000000",
    display: "(86) 90000-0000",
  },
  comercial: {
    phone: "5586900000001",
    display: "(86) 90000-0001",
  },
} as const;

export function waLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
