"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("E-mail ou senha inválidos. Verifique e tente novamente.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-elegant sm:p-10"
    >
      {/* Logos do Grupo */}
      <div className="flex flex-col items-center">
        <div className="flex flex-row items-center gap-4">
          <Image
            src="/logo_marconinunes.png"
            alt="Marconi Nunes Contabilidade"
            width={150}
            height={44}
            priority
            className="h-[44px] w-auto object-contain"
          />
          <span className="h-9 w-px bg-slate-300" aria-hidden />
          <Image
            src="/conplan.png"
            alt="CONPLAN"
            width={150}
            height={44}
            priority
            className="h-[44px] w-auto object-contain"
          />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-conplan">
          Portal do Grupo
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Área administrativa · acesso restrito
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-conplan">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@marconinunes.com.br"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-conplan">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldClass}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-conplan px-6 py-3.5 text-sm font-semibold text-white shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-conplan-light disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Entrando..." : "Entrar no Portal"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Acesso exclusivo para a equipe do Grupo Dr. Marconi Nunes.
      </p>
    </motion.div>
  );
}
