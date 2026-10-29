import Link from "next/link";
import { type Area, areaHref } from "@/content/areas";
import { Icon } from "./icons";
import { delay } from "./PageHero";

export function AreaCard({ area, index }: { area: Area; index: number }) {
  return (
    <article data-reveal style={delay(index * 110)} className="card card-interactive group flex flex-col p-8 md:p-10">
      <span aria-hidden="true" className="absolute right-6 top-6 font-serif text-5xl text-white/[0.05]">
        0{index + 1}
      </span>
      <span className="grid size-14 place-items-center border border-gold/30 text-gold transition-colors duration-500 group-hover:border-gold group-hover:bg-gold/5">
        <Icon name={area.icone} className="size-7" />
      </span>
      <h3 className="mt-8 text-2xl">
        <Link href={areaHref(area.slug)} className="after:absolute after:inset-0">
          {area.nome}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-[0.95rem] text-paper">{area.resumo}</p>
      <p aria-hidden="true" className="mt-8 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-gold">
        Saiba mais
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="size-4 transition-transform duration-300 group-hover:translate-x-1">
          <path d="M4 12h15m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </p>
    </article>
  );
}
