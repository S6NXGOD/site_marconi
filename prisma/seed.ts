import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
