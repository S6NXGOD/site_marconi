/**
 * Injeta dados estruturados (schema.org) na página.
 *
 * É o que permite ao Google entender que o site é de uma organização real,
 * exibir o nome/logo corretamente e habilitar recursos como a caixa de busca
 * nos resultados. Sem isso, o buscador só tem o texto solto da página.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // O conteúdo é gerado pelo próprio servidor, não vem do usuário.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
