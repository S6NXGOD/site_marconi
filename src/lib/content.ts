import { prisma } from "@/lib/prisma";
import type { WhatsappItem } from "@/components/WhatsAppFloat";
import type { AreaItem } from "@/components/BusinessAreas";

/**
 * Conteúdo compartilhado entre páginas (float de WhatsApp e Áreas de Atuação).
 * Falha de banco nunca derruba a página: devolve vazio e o componente some.
 */
export async function getWhatsappContacts(): Promise<WhatsappItem[]> {
  try {
    return await prisma.whatsappContact.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        phone: true,
        message: true,
        icon: true,
      },
    });
  } catch (error) {
    console.error("[content] falha ao carregar contatos de WhatsApp:", error);
    return [];
  }
}

export async function getBusinessAreas(): Promise<AreaItem[]> {
  try {
    return await prisma.businessArea.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        tabLabel: true,
        eyebrow: true,
        headline: true,
        description: true,
        image: true,
        imageAlt: true,
        ctaLabel: true,
        ctaHref: true,
        accent: true,
        services: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, icon: true },
        },
      },
    });
  } catch (error) {
    console.error("[content] falha ao carregar áreas de atuação:", error);
    return [];
  }
}
