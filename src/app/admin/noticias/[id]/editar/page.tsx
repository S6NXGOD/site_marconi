import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateNews } from "@/app/admin/actions";
import NewsForm from "@/components/admin/NewsForm";

export default async function EditarNoticiaPage({
  params,
}: {
  params: { id: string };
}) {
  const news = await prisma.news.findUnique({ where: { id: params.id } });
  if (!news) notFound();

  // Amarra o id à server action de atualização.
  const action = updateNews.bind(null, news.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/noticias"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Notícias
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">
          Editar notícia
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Atualize o conteúdo, a categoria ou o status de publicação.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <NewsForm
          action={action}
          submitLabel="Salvar alterações"
          initial={{
            title: news.title,
            slug: news.slug,
            excerpt: news.excerpt,
            content: news.content,
            author: news.author,
            coverImage: news.coverImage,
            category: news.category,
            isPublished: news.isPublished,
          }}
        />
      </div>
    </div>
  );
}
