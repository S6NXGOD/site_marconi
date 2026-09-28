import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";

/**
 * Middleware de borda — três responsabilidades, nesta ordem:
 *
 *  1. WEBMAIL DOS COLABORADORES: qualquer requisição ao host
 *     `webmail.marconinunes.com.br` responde 301 (permanente) para o provedor
 *     de e-mail (Hostinger), antes de tocar no roteamento da aplicação.
 *  1b. WWW: `www.marconinunes.com.br` responde 301 para `marconinunes.com.br`
 *     — o site público responde num endereço só.
 *  2. PAINEL: /admin/** segue protegido por autenticação (next-auth) — sem
 *     token válido, redireciona para /login.
 *
 * ⚠️ Para o item 1 valer, o subdomínio `webmail.marconinunes.com.br` precisa
 * APONTAR para esta aplicação (cadastrado como domínio custom no Railway).
 * O código redireciona a requisição — mas ela só chega até aqui se o DNS do
 * subdomínio estiver apontado para o app.
 */

const WEBMAIL_HOST = "webmail.marconinunes.com.br";
const WEBMAIL_DESTINO = "https://mail.hostinger.com";

// Proteção do painel — mesma configuração de antes.
const protegerAdmin = withAuth({ pages: { signIn: "/login" } });

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // O host pode vir com porta em dev ("localhost:3000") — compara só o nome.
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // 1) Webmail: 301 permanente para o provedor, sem passar pela aplicação.
  if (host === WEBMAIL_HOST) {
    return NextResponse.redirect(WEBMAIL_DESTINO, 301);
  }

  // 1b) www → endereço oficial, mantendo caminho e parâmetros. Sem isso o site
  //     inteiro respondia nos dois endereços: duas cópias para o Google, com o
  //     peso de cada link dividido entre elas (e a medição de audiência
  //     separando "www" do resto).
  if (host.startsWith("www.")) {
    const { pathname, search } = req.nextUrl;
    return NextResponse.redirect(`https://${host.slice(4)}${pathname}${search}`, 301);
  }

  // 2) Painel: delega para a proteção do next-auth.
  if (req.nextUrl.pathname.startsWith("/admin")) {
    return protegerAdmin(req as NextRequestWithAuth, event);
  }

  // 3) Site público: segue sem alteração.
  return NextResponse.next();
}

export const config = {
  // Roda em toda rota de PÁGINA — o redirect do webmail precisa alcançar
  // qualquer caminho nesse host, inclusive a raiz "/". Ficam de fora os assets
  // estáticos e os internos do Next, que não têm por que passar pelo middleware.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.jpg|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webmanifest|xml|txt|js|css)$).*)",
  ],
};
