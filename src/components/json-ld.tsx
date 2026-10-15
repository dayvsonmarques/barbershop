/** Renderiza dados estruturados (schema.org) para buscadores e IAs. */
export function JsonLd({ data }: { data: object | object[] }) {
  // Escapa "<" para impedir que conteúdo do admin feche a tag <script>
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
