/**
 * Roda uma vez, quando o servidor sobe.
 *
 * O `if` precisa ser exatamente este: é o que tira o Prisma e o web-push do
 * pacote do middleware, que roda no runtime edge.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarAgendador } = await import("./lib/agendamento");
    iniciarAgendador();
  }
}
