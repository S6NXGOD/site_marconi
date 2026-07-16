"use server";

import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"current" | "next" | "confirm", string>>;
};

export async function changePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { status: "error", message: "Sessão expirada. Entre novamente." };
  }

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errors: PasswordState["errors"] = {};
  if (!current) errors.current = "Informe a senha atual.";
  if (next.length < 8) errors.next = "A nova senha deve ter ao menos 8 caracteres.";
  if (next && next === current) errors.next = "A nova senha deve ser diferente da atual.";
  if (confirm !== next) errors.confirm = "As senhas não conferem.";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifique os campos destacados.", errors };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { status: "error", message: "Usuário não encontrado." };
  }

  const ok = await bcrypt.compare(current, user.password);
  if (!ok) {
    return {
      status: "error",
      message: "Senha atual incorreta.",
      errors: { current: "Senha atual incorreta." },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(next, 12) },
  });

  return {
    status: "success",
    message:
      "Senha alterada com sucesso. Ela já vale para o próximo acesso ao painel.",
  };
}
