import { fontesNoticias, noticiasHref } from "@/config/noticias";
import { getNoticias } from "@/lib/noticias";
import { ButtonLink } from "./Button";
import { type GrupoNoticias, NewsTabs } from "./NewsTabs";
import { SectionHeading } from "./SectionHeading";

/** Seção de notícias da página inicial: uma aba por categoria (tipo + local de referência). */
export async function HomeNews() {
  const { itens } = await getNoticias();
  if (itens.length === 0) return null;

  const grupos: GrupoNoticias[] = [
    {
      id: "todas",
      rotulo: "Mais recentes",
      descricao: "As publicações mais recentes de todas as fontes.",
      href: noticiasHref(),
      itens: itens.slice(0, 6),
    },
    ...fontesNoticias
      .map((f) => ({
        id: f.id,
        rotulo: f.nome,
        descricao: `${f.rotuloTipo} · ${f.local}`,
        href: noticiasHref(f.id),
        itens: itens.filter((n) => n.fonte === f.id).slice(0, 6),
      }))
      .filter((g) => g.itens.length > 0),
  ];

  return (
    <section aria-labelledby="noticias-titulo" className="border-t border-gold/10 bg-ink py-24 md:py-32">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading id="noticias-titulo" eyebrow="Notícias jurídicas" title="O que está acontecendo nos tribunais">
            <p>Publicações recentes do STJ e da imprensa jurídica, com link para a fonte original.</p>
          </SectionHeading>
          <ButtonLink href={noticiasHref()} variant="outline" data-reveal>
            Ver todas as notícias
          </ButtonLink>
        </div>
        <div data-reveal className="mt-12">
          <NewsTabs grupos={grupos} />
        </div>
      </div>
    </section>
  );
}
