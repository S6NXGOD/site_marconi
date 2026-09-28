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
      // O JSON leva texto do banco (título de notícia importada de outro site,
      // perguntas frequentes). Um "</script>" nesse texto fecharia a tag e
      // abriria a página para código injetado — por isso todo "<" sai
      // escapado. Para quem lê o JSON, "<" continua sendo "<".
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
