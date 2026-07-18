import Link from "next/link";
import { createNews } from "@/app/admin/actions";
import { SITE_URL } from "@/lib/site";
import { getTagSuggestions } from "@/lib/get-tags";
import NewsForm from "@/components/admin/NewsForm";

export default async function NovaNoticiaPage() {
  const tagSuggestions = await getTagSuggestions();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/noticias"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Notícias
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Nova notícia</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preencha os campos e escolha a categoria do assunto.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <NewsForm
          action={createNews}
          submitLabel="Criar notícia"
          siteUrl={SITE_URL}
          tagSuggestions={tagSuggestions}
        />
      </div>
    </div>
  );
}
