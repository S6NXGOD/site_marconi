import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Conteúdo institucional padrão (Áreas de Atuação e WhatsApp).
 *
 * Isto NÃO é dado fictício: é o conteúdo real que já estava no site, agora
 * editável pelo painel. É criado só uma vez — se o admin editar depois, um
 * novo deploy não sobrescreve.
 */
async function conteudoPadrao() {
  // ——— Áreas de Atuação ———
  if ((await prisma.businessArea.count()) === 0) {
    await prisma.businessArea.create({
      data: {
        tabLabel: "MARCONI NUNES — SETOR PRIVADO",
        eyebrow: "Marconi Nunes Contabilidade",
        headline: "Solidez contábil para o setor privado",
        description:
          "Estrutura técnica completa para empresas que buscam crescer com segurança, conformidade e proteção do patrimônio.",
        image: "/predio_marconinunes.jpg",
        imageAlt: "Sede da Marconi Nunes Contabilidade",
        ctaLabel: "Falar com o comercial",
        ctaHref: "#contato",
        order: 0,
        services: {
          create: [
            { name: "Área Fiscal e Tributária", icon: "scale", order: 0 },
            { name: "Área Contábil", icon: "chart", order: 1 },
            { name: "Área de RH e Departamento Pessoal", icon: "people", order: 2 },
            { name: "Área Societária e Legalização", icon: "document", order: 3 },
          ],
        },
      },
    });

    await prisma.businessArea.create({
      data: {
        tabLabel: "CONPLAN — GESTÃO PÚBLICA",
        eyebrow: "CONPLAN",
        headline: "Excelência na gestão dos municípios",
        description:
          "Assessoria técnica a prefeituras e órgãos públicos, com foco em conformidade, transparência e resultados junto aos órgãos de controle.",
        image: "/predio_marconinunes.jpg",
        imageAlt: "Sede do Grupo Dr. Marconi Nunes",
        ctaLabel: "Falar com a CONPLAN",
        ctaHref: "#contato",
        order: 1,
        services: {
          create: [
            { name: "Gestão de Convênios", icon: "handshake", order: 0 },
            { name: "Prestação de Contas de Governo", icon: "document", order: 1 },
            { name: "Assessoria a Prefeituras", icon: "building", order: 2 },
          ],
        },
      },
    });
    console.log("[bootstrap] Áreas de Atuação criadas.");
  }

  // ——— WhatsApp ———
  if ((await prisma.whatsappContact.count()) === 0) {
    await prisma.whatsappContact.createMany({
      data: [
        {
          title: "Já sou cliente",
          subtitle: "Contato administrativo",
          // ⚠️ número de exemplo — troque em /admin/whatsapp
          phone: "5586900000000",
          message:
            "Olá! Sou cliente do Grupo Dr. Marconi Nunes e preciso de atendimento administrativo.",
          icon: "user",
          order: 0,
        },
        {
          title: "Quero ser cliente",
          subtitle: "Falar com comercial",
          phone: "5586900000001",
          message:
            "Olá! Vim pelo site e gostaria de conhecer os serviços do Grupo Dr. Marconi Nunes.",
          icon: "chat",
          order: 1,
        },
      ],
    });
    console.log("[bootstrap] Contatos de WhatsApp criados (troque os números em /admin/whatsapp).");
  }
}

/**
 * Bootstrap do administrador.
 *
 * Roda no start do container (antes do `next start`) e é IDEMPOTENTE:
 *  - Cria o admin apenas se ainda não existir nenhum usuário.
 *  - NUNCA sobrescreve a senha de um admin existente — assim um novo deploy
 *    não desfaz a troca de senha feita no painel.
 *  - NUNCA derruba o boot: se faltar variável, apenas avisa e sai com 0.
 *    O site precisa subir mesmo que o admin ainda não esteja configurado.
 *
 * Nenhum conteúdo fictício é criado: notícias, alertas e reels entram
 * exclusivamente pelo painel.
 */
async function main() {
  // Conteúdo institucional editável — independente do admin existir ou não.
  await conteudoPadrao();

  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "Administrador").trim();

  const jaExiste = await prisma.user.count();
  if (jaExiste > 0) {
    console.log("[bootstrap] Usuário administrador já existe — nada a fazer.");
    return;
  }

  if (!email || !password) {
    console.warn(
      "[bootstrap] ADMIN_EMAIL/ADMIN_PASSWORD não definidos — nenhum admin criado.\n" +
        "            Configure as variáveis e reinicie o serviço para acessar /admin."
    );
    return;
  }

  if (password.length < 8) {
    console.warn(
      "[bootstrap] ADMIN_PASSWORD muito curta (mínimo 8 caracteres) — admin NÃO criado."
    );
    return;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
    },
  });

  console.log(`[bootstrap] Admin criado: ${email}`);
  console.log("[bootstrap] Troque a senha em /admin/conta após o primeiro acesso.");
}

main()
  .catch((e) => {
    // Também não derruba o boot: o site institucional deve continuar no ar.
    console.error("[bootstrap] falhou (site sobe mesmo assim):", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
