"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { NewsCategory, AlertCategory, LeadStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugUnico, slugDaNoticia } from "@/lib/slug-unico";
import { slugify } from "@/lib/slugify";
import { sanitizarConteudo, htmlParaTexto } from "@/lib/sanitize";
import { tagsDoFormulario } from "@/lib/tags";
import { autorDe } from "@/lib/news";
import { dataDeInput, inputDeData } from "@/lib/datas";
import { lerAlertasCSV, filtrarNovos } from "@/lib/csv";

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

/**
 * Data editorial da notícia.
 *
 * Mantém o horário quando o dia não mudou: salvar uma correção de texto não
 * pode reordenar a notícia na listagem. Dia diferente vira meio-dia, que é
 * neutro em qualquer fuso.
 */
function dataDePublicacao(entrada: string, atual?: Date): Date {
  if (atual && entrada && inputDeData(atual) === entrada) return atual;
  return dataDeInput(entrada) ?? atual ?? new Date();
}

/**
 * Quebras de linha vindas de um <textarea>.
 *
 * O navegador normaliza o value para CRLF na submissão do formulário — é a
 * especificação do HTML, não um capricho de um navegador. Sem desfazer isso,
 * o texto chega ao banco com CR LF CR LF entre os parágrafos, e uma regex que
 * procure dois LF grudados não casa: há um CR no meio. Foi o que fez a
 * notícia editada no painel virar um bloco único no site.
 */
function normalizarQuebras(v: string): string {
  return v.replace(/\r\n?/g, "\n");
}

function parseNewsForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: normalizarQuebras(String(formData.get("excerpt") ?? "")).trim(),
    // O conteúdo vem do editor como HTML e é sanitizado ANTES de qualquer
    // gravação: a allowlist é a barreira contra XSS, não o editor.
    content: sanitizarConteudo(String(formData.get("content") ?? "")),
    category: String(formData.get("category") ?? ""),
    coverImage: String(formData.get("coverImage") ?? "").trim(),
    slugInput: String(formData.get("slug") ?? "").trim(),
    publishedAt: String(formData.get("publishedAt") ?? "").trim(),
    isPublished: formData.get("isPublished") === "on",
    tags: tagsDoFormulario(String(formData.get("tags") ?? "")),
  };
}

/**
 * Relação de tags para o Prisma: cria a que não existe, reaproveita a que
 * existe (pelo slug). No update, `set: []` primeiro zera o vínculo antigo — sem
 * isso, remover uma tag no formulário não a desconectaria.
 */
function relacaoTags(tags: { name: string; slug: string }[], substituir: boolean) {
  const connectOrCreate = tags.map((t) => ({
    where: { slug: t.slug },
    create: { name: t.name, slug: t.slug },
  }));
  return substituir ? { set: [], connectOrCreate } : { connectOrCreate };
}

function validateNews(data: ReturnType<typeof parseNewsForm>): NewsFormState | null {
  const errors: NewsFormState["errors"] = {};
  if (data.title.length < 4) errors.title = "Informe um título (mín. 4 caracteres).";
  // Mede o TEXTO, não o HTML: um editor vazio manda "<p></p>", que tem tamanho
  // mas nenhum conteúdo.
  if (htmlParaTexto(data.content).length < 10) errors.content = "O conteúdo está muito curto.";
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
      slug: await slugUnico(slugDaNoticia(data.slugInput, data.title)),
      excerpt: data.excerpt || null,
      content: data.content,
      author: autorDe(data.category as NewsCategory),
      category: data.category as NewsCategory,
      coverImage: data.coverImage || null,
      isPublished: data.isPublished,
      publishedAt: dataDePublicacao(data.publishedAt),
      tags: relacaoTags(data.tags, false),
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

  // Precisa da data atual para preservar o horário quando só o texto mudou.
  const atual = await prisma.news.findUnique({
    where: { id },
    select: { publishedAt: true },
  });

  await prisma.news.update({
    where: { id },
    data: {
      title: data.title,
      slug: await slugUnico(slugDaNoticia(data.slugInput, data.title), id),
      excerpt: data.excerpt || null,
      content: data.content,
      author: autorDe(data.category as NewsCategory),
      category: data.category as NewsCategory,
      coverImage: data.coverImage || null,
      isPublished: data.isPublished,
      publishedAt: dataDePublicacao(data.publishedAt, atual?.publishedAt),
      tags: relacaoTags(data.tags, true),
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
    description: normalizarQuebras(String(formData.get("description") ?? "")).trim(),
    isActive: formData.get("isActive") === "on",
  };
}

function validateAlert(data: ReturnType<typeof parseAlertForm>): AlertFormState | null {
  const errors: AlertFormState["errors"] = {};
  if (data.title.length < 4) errors.title = "Informe um título (mín. 4 caracteres).";
  if (!dataDeInput(data.date)) errors.date = "Informe uma data limite válida.";
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
      date: dataDeInput(data.date) ?? new Date(),
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
      date: dataDeInput(data.date) ?? new Date(),
      category: data.category as AlertCategory,
      description: data.description,
      isActive: data.isActive,
    },
  });

  revalidateAll();
  redirect("/admin/alertas?ok=updated");
}

export type ImportAlertsState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Importa alertas em massa a partir do texto do CSV.
 *
 * Recebe o arquivo cru, e não as linhas já validadas pelo painel: a prévia é
 * conveniência, não autoridade. Quem valida é o servidor, com o mesmo
 * `lerAlertasCSV` que gerou a prévia.
 */
export async function importAlerts(
  _prev: ImportAlertsState,
  formData: FormData
): Promise<ImportAlertsState> {
  await requireSession();

  const texto = String(formData.get("csv") ?? "");
  if (!texto.trim()) {
    return { status: "error", message: "Nenhum conteúdo para importar." };
  }

  const linhas = lerAlertasCSV(texto);
  const validas = linhas.filter((l) => !l.erro && l.category);
  if (validas.length === 0) {
    return {
      status: "error",
      message: "Nenhuma linha válida no arquivo. Revise os erros apontados na prévia.",
    };
  }

  const existentes = await prisma.alert.findMany({ select: { title: true, date: true } });
  const { novos } = filtrarNovos(
    linhas,
    existentes.map((a) => ({ title: a.title, dia: inputDeData(a.date) }))
  );

  if (novos.length > 0) {
    await prisma.alert.createMany({
      data: novos.map((n) => ({
        title: n.title,
        // Meio-dia: a data do prazo não pode escorregar um dia por causa de fuso.
        date: dataDeInput(n.date) as Date,
        category: n.category,
        description: n.description,
        isActive: n.isActive,
      })),
    });
  }

  const ignorados = linhas.length - novos.length;
  revalidateAll();
  redirect(`/admin/alertas?ok=imported&n=${novos.length}&ign=${ignorados}`);
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

/* ───────────────────────── WHATSAPP (float) ───────────────────────── */

export type WhatsappFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"title" | "subtitle" | "phone" | "message", string>>;
};

function parseWhatsappForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    // guarda só dígitos: o link do wa.me não aceita máscara
    phone: String(formData.get("phone") ?? "").replace(/\D/g, ""),
    message: String(formData.get("message") ?? "").trim(),
    icon: String(formData.get("icon") ?? "user").trim() || "user",
    order: Number(formData.get("order") ?? 0) || 0,
    isActive: formData.get("isActive") === "on",
  };
}

function validateWhatsapp(
  d: ReturnType<typeof parseWhatsappForm>
): WhatsappFormState | null {
  const errors: WhatsappFormState["errors"] = {};
  if (d.title.length < 2) errors.title = "Informe o título.";
  if (d.subtitle.length < 2) errors.subtitle = "Informe a descrição.";
  // 55 + DDD (2) + número (8 ou 9) = 12 ou 13 dígitos
  if (d.phone.length < 12 || d.phone.length > 13)
    errors.phone = "Use DDI + DDD + número (ex.: 5586999998888).";
  if (!d.phone.startsWith("55"))
    errors.phone = "O número deve começar com 55 (DDI do Brasil).";
  if (d.message.length < 5) errors.message = "Informe a mensagem inicial.";
  if (Object.keys(errors).length > 0)
    return { status: "error", message: "Verifique os campos destacados.", errors };
  return null;
}

export async function createWhatsapp(
  _prev: WhatsappFormState,
  formData: FormData
): Promise<WhatsappFormState> {
  await requireSession();
  const data = parseWhatsappForm(formData);
  const invalid = validateWhatsapp(data);
  if (invalid) return invalid;

  await prisma.whatsappContact.create({ data });
  revalidatePath("/");
  revalidatePath("/admin/whatsapp");
  redirect("/admin/whatsapp?ok=created");
}

export async function updateWhatsapp(
  id: string,
  _prev: WhatsappFormState,
  formData: FormData
): Promise<WhatsappFormState> {
  await requireSession();
  const data = parseWhatsappForm(formData);
  const invalid = validateWhatsapp(data);
  if (invalid) return invalid;

  await prisma.whatsappContact.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/admin/whatsapp");
  redirect("/admin/whatsapp?ok=updated");
}

export async function deleteWhatsapp(id: string) {
  await requireSession();
  await prisma.whatsappContact.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/whatsapp");
}

export async function toggleWhatsappActive(id: string, isActive: boolean) {
  await requireSession();
  await prisma.whatsappContact.update({ where: { id }, data: { isActive } });
  revalidatePath("/");
  revalidatePath("/admin/whatsapp");
}

/* ───────────────────── ÁREAS DE ATUAÇÃO ───────────────────── */

export type AreaFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"tabLabel" | "eyebrow" | "headline" | "description", string>>;
};

function parseAreaForm(formData: FormData) {
  // Serviços chegam como listas paralelas (nome[i], ícone[i]).
  const nomes = formData.getAll("serviceName").map((v) => String(v).trim());
  const icones = formData.getAll("serviceIcon").map((v) => String(v).trim());

  const services = nomes
    .map((name, i) => ({ name, icon: icones[i] || "chart", order: i }))
    .filter((s) => s.name.length > 0);

  return {
    tabLabel: String(formData.get("tabLabel") ?? "").trim(),
    eyebrow: String(formData.get("eyebrow") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    description: normalizarQuebras(String(formData.get("description") ?? "")).trim(),
    image: String(formData.get("image") ?? "").trim(),
    imageAlt: String(formData.get("imageAlt") ?? "").trim(),
    accent: String(formData.get("accent") ?? "marconi") === "conplan" ? "conplan" : "marconi",
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || "Fale conosco",
    ctaHref: String(formData.get("ctaHref") ?? "").trim() || "#contato",
    order: Number(formData.get("order") ?? 0) || 0,
    isActive: formData.get("isActive") === "on",
    services,
  };
}

function validateArea(d: ReturnType<typeof parseAreaForm>): AreaFormState | null {
  const errors: AreaFormState["errors"] = {};
  if (d.tabLabel.length < 3) errors.tabLabel = "Informe o texto da aba.";
  if (d.eyebrow.length < 2) errors.eyebrow = "Informe o nome da empresa.";
  if (d.headline.length < 5) errors.headline = "Informe o título.";
  if (d.description.length < 10) errors.description = "Descrição muito curta.";
  if (Object.keys(errors).length > 0)
    return { status: "error", message: "Verifique os campos destacados.", errors };
  return null;
}

export async function createArea(
  _prev: AreaFormState,
  formData: FormData
): Promise<AreaFormState> {
  await requireSession();
  const d = parseAreaForm(formData);
  const invalid = validateArea(d);
  if (invalid) return invalid;

  const { services, ...area } = d;
  await prisma.businessArea.create({
    data: {
      ...area,
      image: area.image || null,
      services: { create: services },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/areas");
  redirect("/admin/areas?ok=created");
}

export async function updateArea(
  id: string,
  _prev: AreaFormState,
  formData: FormData
): Promise<AreaFormState> {
  await requireSession();
  const d = parseAreaForm(formData);
  const invalid = validateArea(d);
  if (invalid) return invalid;

  const { services, ...area } = d;

  // Recria os serviços: mais simples e previsível que casar item a item.
  await prisma.$transaction([
    prisma.businessAreaService.deleteMany({ where: { areaId: id } }),
    prisma.businessArea.update({
      where: { id },
      data: {
        ...area,
        image: area.image || null,
        services: { create: services },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin/areas");
  redirect("/admin/areas?ok=updated");
}

export async function deleteArea(id: string) {
  await requireSession();
  await prisma.businessArea.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/areas");
}

export async function toggleAreaActive(id: string, isActive: boolean) {
  await requireSession();
  await prisma.businessArea.update({ where: { id }, data: { isActive } });
  revalidatePath("/");
  revalidatePath("/admin/areas");
}

/* ─────────────────────── FONTES DE RASPAGEM ─────────────────────── */

export type SourceFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "url" | "itemSelector" | "category", string>>;
};

function parseSourceForm(formData: FormData) {
  const txt = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    name: txt("name"),
    url: txt("url"),
    category: txt("category"),
    itemSelector: txt("itemSelector"),
    titleSelector: txt("titleSelector"),
    linkSelector: txt("linkSelector"),
    dateSelector: txt("dateSelector"),
    imageSelector: txt("imageSelector"),
    excerptSelector: txt("excerptSelector"),
    categorySelector: txt("categorySelector"),
    contentSelector: txt("contentSelector"),
    isActive: formData.get("isActive") === "on",
  };
}

function validateSource(d: ReturnType<typeof parseSourceForm>): SourceFormState | null {
  const errors: SourceFormState["errors"] = {};
  if (d.name.length < 3) errors.name = "Informe um nome para a fonte.";
  if (!/^https?:\/\/.+/i.test(d.url)) errors.url = "Informe a URL completa, com https://";
  if (!d.itemSelector) errors.itemSelector = "O seletor dos itens é obrigatório.";
  if (!isNewsCategory(d.category)) errors.category = "Selecione uma categoria.";
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifique os campos destacados.", errors };
  }
  return null;
}

/** Campo de seletor vazio significa "não capturar", não string vazia. */
function dadosDaFonte(d: ReturnType<typeof parseSourceForm>) {
  return {
    name: d.name,
    url: d.url,
    category: d.category as NewsCategory,
    itemSelector: d.itemSelector,
    titleSelector: d.titleSelector || null,
    linkSelector: d.linkSelector || null,
    dateSelector: d.dateSelector || null,
    imageSelector: d.imageSelector || null,
    excerptSelector: d.excerptSelector || null,
    categorySelector: d.categorySelector || null,
    contentSelector: d.contentSelector || null,
    isActive: d.isActive,
  };
}

export async function createSource(
  _prev: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  await requireSession();
  const data = parseSourceForm(formData);
  const invalid = validateSource(data);
  if (invalid) return invalid;

  await prisma.scrapeSource.create({ data: dadosDaFonte(data) });
  revalidatePath("/admin/fontes");
  redirect("/admin/fontes?ok=created");
}

export async function updateSource(
  id: string,
  _prev: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  await requireSession();
  const data = parseSourceForm(formData);
  const invalid = validateSource(data);
  if (invalid) return invalid;

  await prisma.scrapeSource.update({ where: { id }, data: dadosDaFonte(data) });
  revalidatePath("/admin/fontes");
  redirect("/admin/fontes?ok=updated");
}

export async function deleteSource(id: string) {
  await requireSession();
  await prisma.scrapeSource.delete({ where: { id } });
  revalidatePath("/admin/fontes");
}

export async function toggleSourceActive(id: string, isActive: boolean) {
  await requireSession();
  await prisma.scrapeSource.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/fontes");
}

/* ─────────────────────── ASSUNTOS (tags) — gestão ─────────────────────── */

export type AssuntoResultado = { ok: boolean; erro?: string };

// A tag aparece em card, filtro e página de matéria; mexer nela reflete no site
// público inteiro.
function revalidateAssuntos() {
  revalidatePath("/admin/assuntos");
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  revalidatePath("/");
}

/** Renomeia um assunto. Se o novo nome colidir com outro, manda mesclar. */
export async function renomearAssunto(
  id: string,
  novoNome: string
): Promise<AssuntoResultado> {
  await requireSession();
  const nome = novoNome.replace(/\s+/g, " ").trim().slice(0, 40);
  if (!nome) return { ok: false, erro: "Digite um nome." };
  const slug = slugify(nome);
  if (!slug) return { ok: false, erro: "Nome inválido." };

  const conflito = await prisma.tag.findFirst({
    where: { slug, NOT: { id } },
    select: { id: true },
  });
  if (conflito) {
    return {
      ok: false,
      erro: "Já existe um assunto com esse nome. Use Mesclar para juntá-los.",
    };
  }

  await prisma.tag.update({ where: { id }, data: { name: nome, slug } });
  revalidateAssuntos();
  return { ok: true };
}

/**
 * Mescla `origem` em `destino`: as notícias da origem passam a ter o destino e
 * a origem é apagada. É como se juntassem duas grafias da mesma coisa.
 */
export async function mesclarAssuntos(
  origemId: string,
  destinoId: string
): Promise<AssuntoResultado> {
  await requireSession();
  if (origemId === destinoId) {
    return { ok: false, erro: "Escolha dois assuntos diferentes." };
  }

  const [origem, destino] = await Promise.all([
    prisma.tag.findUnique({
      where: { id: origemId },
      select: { id: true, news: { select: { id: true } } },
    }),
    prisma.tag.findUnique({ where: { id: destinoId }, select: { id: true } }),
  ]);
  if (!origem || !destino) return { ok: false, erro: "Assunto não encontrado." };

  // `connect` é idempotente: notícia que já tinha o destino não duplica.
  await prisma.$transaction([
    prisma.tag.update({
      where: { id: destinoId },
      data: { news: { connect: origem.news.map((n) => ({ id: n.id })) } },
    }),
    prisma.tag.delete({ where: { id: origemId } }),
  ]);
  revalidateAssuntos();
  return { ok: true };
}

/** Exclui um assunto do sistema (o vínculo com as notícias cai junto). */
export async function excluirAssunto(id: string): Promise<AssuntoResultado> {
  await requireSession();
  await prisma.tag.delete({ where: { id } });
  revalidateAssuntos();
  return { ok: true };
}
