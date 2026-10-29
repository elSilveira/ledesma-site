import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

type Crumb = { name: string; path: string };

export const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** Abertura das páginas internas, com trilha de navegação (e seus dados estruturados). */
export function PageHero({
  eyebrow,
  title,
  children,
  crumbs,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  crumbs: Crumb[];
  aside?: ReactNode;
}) {
  const all = [{ name: "Início", path: "/" }, ...crumbs];
  return (
    <section className="grain relative overflow-hidden border-b border-gold/10 bg-coal pb-16 pt-36 md:pb-20 md:pt-44">
      <JsonLd data={breadcrumbJsonLd(all)} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-wine/15 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[8%] hidden w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent lg:block" />
      <div className="container-site relative grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <nav aria-label="Trilha de navegação" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {all.map((c, i) => (
                <li key={c.path} className="flex items-center gap-2">
                  {i < all.length - 1 ? (
                    <>
                      <Link href={c.path} className="transition-colors hover:text-gold">
                        {c.name}
                      </Link>
                      <span aria-hidden="true" className="text-gold/50">
                        /
                      </span>
                    </>
                  ) : (
                    <span aria-current="page" className="text-paper">
                      {c.name}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <p className="eyebrow hero-rise">{eyebrow}</p>
          <h1 className="hero-rise mt-5 text-4xl md:text-5xl lg:text-[3.6rem]" style={delay(120)}>
            {title}
          </h1>
          {children && (
            <div className="hero-rise mt-6 max-w-2xl text-[1.05rem] text-paper" style={delay(240)}>
              {children}
            </div>
          )}
        </div>
        {aside && (
          <div className="hero-rise" style={delay(300)}>
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
