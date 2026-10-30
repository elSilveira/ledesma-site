import { noticiasHref } from "@/config/noticias";
import type { AreaSlug } from "@/config/site";
import { getArea } from "@/content/areas";
import { getNoticias } from "@/lib/noticias";
import { ButtonLink } from "./Button";
import { NewsCard } from "./NewsCard";

/** As notícias mais recentes classificadas na área; some quando não há nenhuma. */
export async function AreaNews({ slug }: { slug: AreaSlug }) {
  const area = getArea(slug);
  const { itens } = await getNoticias();
  const daArea = itens.filter((n) => n.areas.includes(slug)).slice(0, 3);
  if (daArea.length === 0) return null;

  return (
    <section aria-labelledby="noticias-area" className="border-t border-gold/10 bg-coal py-20 md:py-24">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div data-reveal className="max-w-2xl">
            <p className="eyebrow">Notícias</p>
            <h2 id="noticias-area" className="mt-4 text-3xl md:text-4xl">
              Notícias de {area.nome}
            </h2>
            <p className="mt-4 text-sm text-muted">Publicações do STJ e da imprensa jurídica, com link para a fonte original.</p>
          </div>
          <ButtonLink href={`${noticiasHref()}?area=${slug}`} variant="outline" data-reveal>
            Mais notícias de {area.nomeCurto.toLowerCase()}
          </ButtonLink>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {daArea.map((n) => (
            <li key={n.id} data-reveal>
              <NewsCard noticia={n} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
