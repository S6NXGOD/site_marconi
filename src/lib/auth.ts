import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Sem segredo, o NextAuth não consegue assinar o JWT e o login do painel
// falha de forma confusa. Melhor derrubar o boot com uma mensagem clara.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET não definido. Gere um com `openssl rand -base64 32` e configure nas variáveis do serviço."
  );
}

/**
 * Rede de segurança para o NEXTAUTH_URL.
 *
 * O NextAuth v4 lê essa variável direto do ambiente para montar os callbacks
 * do login. Se ela vier vazia — ou preenchida com uma referência que não
 * resolveu (ex.: "${{NEXTAUTH_URL}}", que aponta para si mesma) — o login
 * quebra de um jeito difícil de diagnosticar.
 *
 * Aqui derivamos a URL do domínio público que o próprio Railway injeta.
 */
const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
const urlInvalida = !nextAuthUrl || !/^https?:\/\//i.test(nextAuthUrl);

if (urlInvalida && process.env.RAILWAY_PUBLIC_DOMAIN) {
  process.env.NEXTAUTH_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  console.warn(
    `[auth] NEXTAUTH_URL ausente ou inválido — usando https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Portal do Grupo",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
