import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <>
      <Header />

      <main className="flex min-h-[70vh] items-center bg-conplan px-6 pt-28 pb-20">
        <div className="section-shell">
          <div className="mx-auto max-w-lg text-center">
            <p className="font-serif text-6xl font-bold text-marconi sm:text-7xl">
              404
            </p>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-white sm:text-3xl">
              Página não encontrada
            </h1>
            <p className="mt-3 text-slate-400">
              O endereço que você tentou acessar não existe ou foi movido.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-light"
              >
                Voltar ao início
              </Link>
              <Link
                href="/noticias"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ver notícias
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
