import Link from "next/link";
import { type Artigo, artigoHref, formatarData, tempoDeLeitura } from "@/content/articles";
import { getArea } from "@/content/areas";
import { Icon } from "./icons";
import { delay } from "./PageHero";

export function ArticleCard({ artigo, index = 0, headingLevel = "h3" }: { artigo: Artigo; index?: number; headingLevel?: "h2" | "h3" }) {
  const area = getArea(artigo.area);
  const H = headingLevel;
  return (
    <article data-reveal style={delay(index * 100)} className="card card-interactive group flex flex-col p-8">
      <p className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
        <Icon name={area.icone} className="size-4" />
        {area.nomeCurto}
      </p>
      <H className="mt-5 text-[1.4rem] leading-snug">
        <Link href={artigoHref(artigo.slug)} className="after:absolute after:inset-0">
          {artigo.titulo}
        </Link>
      </H>
      <p className="mt-3 flex-1 text-[0.95rem] text-paper">{artigo.resumo}</p>
      <div className="mt-7 flex items-center justify-between gap-4 text-xs text-muted">
        <time dateTime={artigo.publicadoEm}>{formatarData(artigo.publicadoEm)}</time>
        <span>{tempoDeLeitura(artigo)} min de leitura</span>
      </div>
    </article>
  );
}
