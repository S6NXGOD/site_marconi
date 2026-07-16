import { withAuth } from "next-auth/middleware";

// Protege todas as rotas /admin/**. Sem token válido → redireciona para /login.
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
