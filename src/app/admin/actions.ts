"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { NewsCategory, AlertCategory, LeadStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return session;
}

// Revalida tudo que depende de notícias/alertas.
function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/noticias");
  revalidatePath("/admin/alertas");
}

/* ───────────────────────── LEADS (Fale Conosco) ───────────────────────── */

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await requireSession();
  await prisma.commercialLead.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

export async function deleteLead(id: string) {
  await requireSession();
  await prisma.commercialLead.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

/* ──────────────── CONTAS APROVADAS (reels da CONPLAN) ──────────────── */

export type ApprovalFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"municipality" | "label", string>>;
};

function parseApprovalForm(formData: FormData) {
  return {
    municipality: String(formData.get("municipality") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim() || "Contas Aprovadas",
    embedUrl: String(formData.get("embedUrl") ?? "").trim(),
    order: Number(formData.get("order") ?? 0) || 0,
    isActive: formData.get("isActive") === "on",
  };
}

function validateApproval(
  data: ReturnType<typeof parseApprovalForm>
): ApprovalFormState | null {
  const errors: ApprovalFormState["errors"] = {};
  if (data.municipality.length < 2)
    errors.municipality = "Informe o município.";
  if (data.label.length < 2) errors.label = "Informe o selo (ex.: Contas Aprovadas).";
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifique os campos destacados.", errors };
  }
  return null;
}

export async function createApproval(
  _prev: ApprovalFormState,
  formData: FormData
): Promise<ApprovalFormState> {
  await requireSession();
  const data = parseApprovalForm(formData);
  const invalid = validateApproval(data);
  if (invalid) return invalid;

  await prisma.approval.create({
    data: {
      municipality: data.municipality,
      label: data.label,
      embedUrl: data.embedUrl || null,
      order: data.order,
      isActive: data.isActive,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/aprovacoes");
  redirect("/admin/aprovacoes?ok=created");
}

export async function updateApproval(
  id: string,
  _prev: ApprovalFormState,
  formData: FormData
): Promise<ApprovalFormState> {
  await requireSession();
  const data = parseApprovalForm(formData);
  const invalid = validateApproval(data);
  if (invalid) return invalid;

  await prisma.approval.update({
    where: { id },
    data: {
      municipality: data.municipality,
      label: data.label,
      embedUrl: data.embedUrl || null,
      order: data.order,
      isActive: data.isActive,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/aprovacoes");
  redirect("/admin/aprovacoes?ok=updated");
}

export async function deleteApproval(id: string) {
  await requireSession();
  await prisma.approval.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/aprovacoes");
}

export async function toggleApprovalActive(id: string, isActive: boolean) {
  await requireSession();
  await prisma.approval.update({ where: { id }, data: { isActive } });
  revalidatePath("/");
  revalidatePath("/admin/aprovacoes");
}

/* ───────────────────────── NOTÍCIAS ───────────────────────── */

export type NewsFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"title" | "content" | "category", string>>;
};

function isNewsCategory(value: string): value is NewsCategory {
  return value === "PUBLICO" || value === "PRIVADO" || value === "GERAL";
}

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "noticia";
  let slug = root;
  let i = 2;
  for (;;) {
    const existing = await prisma.news.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${root}-${i++}`;
  }
}

function parseNewsForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    coverImage: String(formData.get("coverImage") ?? "").trim(),
    slugInput: String(formData.get("slug") ?? "").trim(),
    isPublished: formData.get("isPublished") === "on",
  };
}

function validateNews(data: ReturnType<typeof parseNewsForm>): NewsFormState | null {
  const errors: NewsFormState["errors"] = {};
  if (data.title.length < 4) errors.title = "Informe um título (mín. 4 caracteres).";
  if (data.content.length < 10) errors.content = "O conteúdo está muito curto.";
  if (!isNewsCategory(data.category)) errors.category = "Selecione uma categoria.";
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifique os campos destacados.", errors };
  }
  return null;
}

export async function createNews(
  _prev: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  await requireSession();
  const data = parseNewsForm(formData);
  const invalid = validateNews(data);
  if (invalid) return invalid;

  await prisma.news.create({
    data: {
      title: data.title,
      slug: await ensureUniqueSlug(data.slugInput || data.title),
      excerpt: data.excerpt || null,
      content: data.content,
      author: data.author || null,
      category: data.category as NewsCategory,
      coverImage: data.coverImage || null,
      isPublished: data.isPublished,
    },
  });

  revalidateAll();
  redirect("/admin/noticias?ok=created");
}

export async function updateNews(
  id: string,
  _prev: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  await requireSession();
  const data = parseNewsForm(formData);
  const invalid = validateNews(data);
  if (invalid) return invalid;

  await prisma.news.update({
    where: { id },
    data: {
      title: data.title,
      slug: await ensureUniqueSlug(data.slugInput || data.title, id),
      excerpt: data.excerpt || null,
      content: data.content,
      author: data.author || null,
      category: data.category as NewsCategory,
      coverImage: data.coverImage || null,
      isPublished: data.isPublished,
    },
  });

  revalidateAll();
  redirect("/admin/noticias?ok=updated");
}

export async function deleteNews(id: string) {
  await requireSession();
  await prisma.news.delete({ where: { id } });
  revalidateAll();
}

export async function toggleNewsPublish(id: string, isPublished: boolean) {
  await requireSession();
  await prisma.news.update({ where: { id }, data: { isPublished } });
  revalidateAll();
}

/* ───────────────────────── ALERTAS / PRAZOS ───────────────────────── */

export type AlertFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"title" | "date" | "category" | "description", string>>;
};

function isAlertCategory(value: string): value is AlertCategory {
  return value === "PUBLICO" || value === "PRIVADO";
}

function parseAlertForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    isActive: formData.get("isActive") === "on",
  };
}

function validateAlert(data: ReturnType<typeof parseAlertForm>): AlertFormState | null {
  const errors: AlertFormState["errors"] = {};
  if (data.title.length < 4) errors.title = "Informe um título (mín. 4 caracteres).";
  if (!data.date || Number.isNaN(new Date(data.date).getTime()))
    errors.date = "Informe uma data limite válida.";
  if (!isAlertCategory(data.category)) errors.category = "Selecione uma categoria.";
  if (data.description.length < 10) errors.description = "A descrição está muito curta.";
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifique os campos destacados.", errors };
  }
  return null;
}

export async function createAlert(
  _prev: AlertFormState,
  formData: FormData
): Promise<AlertFormState> {
  await requireSession();
  const data = parseAlertForm(formData);
  const invalid = validateAlert(data);
  if (invalid) return invalid;

  await prisma.alert.create({
    data: {
      title: data.title,
      date: new Date(data.date),
      category: data.category as AlertCategory,
      description: data.description,
      isActive: data.isActive,
    },
  });

  revalidateAll();
  redirect("/admin/alertas?ok=created");
}

export async function updateAlert(
  id: string,
  _prev: AlertFormState,
  formData: FormData
): Promise<AlertFormState> {
  await requireSession();
  const data = parseAlertForm(formData);
  const invalid = validateAlert(data);
  if (invalid) return invalid;

  await prisma.alert.update({
    where: { id },
    data: {
      title: data.title,
      date: new Date(data.date),
      category: data.category as AlertCategory,
      description: data.description,
      isActive: data.isActive,
    },
  });

  revalidateAll();
  redirect("/admin/alertas?ok=updated");
}

export async function deleteAlert(id: string) {
  await requireSession();
  await prisma.alert.delete({ where: { id } });
  revalidateAll();
}

export async function toggleAlertActive(id: string, isActive: boolean) {
  await requireSession();
  await prisma.alert.update({ where: { id }, data: { isActive } });
  revalidateAll();
}
