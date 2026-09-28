import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizarCapas } from "./normaliza-capas";
import { migrarConteudoParaHtml } from "./migra-conteudo-html";

const prisma = new PrismaClient();

const FLAG_CONTEUDO = "bootstrap:conteudo";

/**
 * Conteúdo institucional padrão (Áreas de Atuação e WhatsApp).
 *
 * Isto NÃO é dado fictício: é o conteúdo real que já estava no site, agora
 * editável pelo painel. Roda UMA vez na vida do banco e nunca mais.
 *
 * A trava é um marcador, e não "a tabela está vazia?". A diferença importa:
 * vazio também é o que sobra quando o admin apaga tudo de propósito, e a
 * pergunta errada fazia o deploy seguinte ressuscitar o conteúdo — inclusive
 * os números de exemplo do WhatsApp, que iriam ao ar.
 *
 * Para forçar de novo (banco novo, reset): apague a linha "bootstrap:conteudo"
 * da tabela SystemFlag.
 */
async function conteudoPadrao() {
  const jaRodou = await prisma.systemFlag.findUnique({ where: { key: FLAG_CONTEUDO } });
  if (jaRodou) return;

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
        accent: "conplan", // azul — diferencia da vertente privada
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

  // A partir daqui o bootstrap está encerrado para sempre neste banco.
  await prisma.systemFlag.create({ data: { key: FLAG_CONTEUDO } });
}

const FLAG_PERGUNTAS = "bootstrap:perguntas-frequentes";

/**
 * Primeira leva de Perguntas frequentes.
 *
 * Nada aqui é inventado: cada resposta repete o que o site já afirma (áreas
 * de atuação, CNPJs, contatos, como funcionam notícias, prazos e avisos).
 * Serve de ponto de partida — o texto é da equipe, e muda no painel
 * (/admin/perguntas). Mesma trava de marcador do conteúdo acima: roda uma vez;
 * se a equipe apagar tudo, não volta.
 */
async function perguntasPadrao() {
  const jaRodou = await prisma.systemFlag.findUnique({ where: { key: FLAG_PERGUNTAS } });
  if (jaRodou) return;

  if ((await prisma.faqItem.count()) === 0) {
    const perguntas: { question: string; answer: string }[] = [
      {
        question: "O que é o Grupo Dr. Marconi Nunes?",
        answer:
          "É o grupo que reúne duas empresas de contabilidade do Piauí, com a mesma exigência de segurança e conformidade: a Marconi Nunes Contabilidade (CNPJ 21.066.608/0001-99), que atende empresas do setor privado, e a CONPLAN Contabilidade LTDA (CNPJ 10.682.231/0001-86), que presta assessoria à gestão pública.",
      },
      {
        question: "Qual a diferença entre a CONPLAN e a Marconi Nunes Contabilidade?",
        answer:
          "A CONPLAN atende prefeituras, câmaras e órgãos municipais: gestão de convênios, prestação de contas de governo e assessoria técnica, com foco na conformidade junto ao Tribunal de Contas do Estado do Piauí (TCE-PI).\n\nA Marconi Nunes Contabilidade atende empresas: área fiscal e tributária, contábil, RH e departamento pessoal, e societária e legalização.",
      },
      {
        question: "Que serviços vocês oferecem para empresas?",
        answer:
          "Na área fiscal e tributária, apuração de tributos, obrigações acessórias e planejamento tributário. Na contábil, escrituração e demonstrações contábeis. Em RH e departamento pessoal, folha de pagamento, admissões, rescisões e obrigações trabalhistas. Na societária, abertura, alteração e regularização de empresas.",
      },
      {
        question: "Vocês atendem prefeituras e câmaras municipais?",
        answer:
          "Sim, pela CONPLAN: gestão de convênios, prestação de contas de governo e assessoria técnica a prefeituras e câmaras. Os municípios que tiveram as contas aprovadas pelo TCE-PI com o nosso acompanhamento aparecem na seção Contas Aprovadas.",
      },
      {
        question: "Como falo com um especialista?",
        answer:
          "Pelo botão do WhatsApp no canto da tela, pelo formulário Fale Conosco no fim desta página ou pelo e-mail contato@marconinunes.com.br.",
      },
      {
        question: "Os prazos do calendário de obrigações são oficiais?",
        answer:
          "São lembretes informativos, montados a partir das fontes oficiais. As datas podem mudar por decisão dos órgãos — antes de cumprir uma obrigação, confirme na fonte oficial ou com a nossa equipe.",
      },
      {
        question: "Como recebo os avisos de notícias e prazos?",
        answer:
          "Ative as notificações no botão da seção Alertas & Prazos: o aviso chega no celular ou no computador quando sai notícia nova ou quando um prazo se aproxima. Dá para desativar quando quiser.",
      },
      {
        question: "De onde vêm as notícias do portal?",
        answer:
          "Parte é escrita pela nossa equipe e parte é selecionada de órgãos oficiais e de veículos especializados em contabilidade e gestão pública — sempre com o crédito e o link para a matéria original.",
      },
      {
        question: "O portal é gratuito?",
        answer:
          "Sim. Notícias, calendário de prazos e avisos são abertos a qualquer pessoa, sem cadastro.",
      },
    ];

    await prisma.faqItem.createMany({
      data: perguntas.map((p, i) => ({ ...p, order: i })),
    });
    console.log(`[bootstrap] ${perguntas.length} perguntas frequentes criadas (edite em /admin/perguntas).`);
  }

  await prisma.systemFlag.create({ data: { key: FLAG_PERGUNTAS } });
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
  await perguntasPadrao();

  // Antes do bloco do admin de propósito: ele retorna cedo quando já existe
  // usuário, que é justamente o caso de produção.
  await normalizarCapas(prisma);
  await migrarConteudoParaHtml(prisma);

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
