import Link from "next/link";
import { enderecoLinha, equipe, formatarOAB, linkMapa, linkWhatsApp, nomeComTratamento, sedes, site } from "@/config/site";
import { areas, areaHref } from "@/content/areas";
import { Icon } from "./icons";
import { Pending } from "./Pending";

const explore = [
  { href: "/o-escritorio", label: "O escritório" },
  { href: "/equipe", label: "Equipe" },
  { href: "/artigos", label: "Artigos" },
  { href: "/noticias", label: "Notícias" },
  { href: "/contato", label: "Contato" },
];

const titulo = "font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t-2 border-gold/70 bg-coal text-sm">
      <div className="container-site">
        <div className="grid grid-cols-2 gap-x-8 gap-y-9 py-10 lg:grid-cols-[0.8fr_0.8fr_1.4fr_1.2fr] lg:gap-x-10">
          <nav aria-label="Explore">
            <h2 className={titulo}>Explore</h2>
            <ul className="mt-4 space-y-2">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ivory transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Áreas de atuação">
            <h2 className={titulo}>Áreas de atuação</h2>
            <ul className="mt-4 space-y-2">
              {areas.map((a) => (
                <li key={a.slug}>
                  <Link href={areaHref(a.slug)} className="text-paper transition-colors hover:text-gold">
                    {a.nomeCurto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 lg:col-span-1">
            <h2 className={titulo}>Fale com nossa equipe</h2>
            <ul className="mt-4">
              {equipe.map((p) => {
                const wa = linkWhatsApp(p);
                return (
                  <li key={p.slug} className="flex items-start justify-between gap-4 border-b border-white/10 py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-ivory">{nomeComTratamento(p)}</p>
                      <p className="text-xs text-muted">{formatarOAB(p.oab)}</p>
                    </div>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 text-gold transition-colors hover:text-ivory"
                        aria-label={`WhatsApp de ${p.nomeCurto} (abre em nova aba)`}
                      >
                        WhatsApp <Icon name="externo" className="size-3.5" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-x-8 gap-y-9 lg:col-span-1 lg:grid-cols-1 lg:gap-y-7">
            <div>
              <h2 className={titulo}>Nossas sedes</h2>
              <ul className="mt-4 space-y-2.5">
                {sedes.map((s) => (
                  <li key={s.slug}>
                    <p className="text-paper">
                      {s.cidade} – {s.uf}
                    </p>
                    <a
                      href={linkMapa(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted transition-colors hover:text-gold"
                      aria-label={`${enderecoLinha(s)} – abrir no Google Maps (nova aba)`}
                    >
                      {s.logradouro}, {s.numero} – {s.bairro}
                    </a>
                    {!s.cep && <Pending label="CEP" className="ml-2" />}
                  </li>
                ))}
              </ul>
              {site.email ? (
                <a href={`mailto:${site.email}`} className="mt-3 inline-flex items-center gap-2 text-paper hover:text-gold">
                  <Icon name="email" className="size-4 text-gold" /> {site.email}
                </a>
              ) : (
                <Pending label="e-mail institucional" className="mt-3" />
              )}
            </div>

            <div>
              <h2 className={titulo}>Consulta processual</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {site.consultaProcessual.map((c) => (
                  <li key={c.href}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${c.rotulo} (abre em nova aba)`}
                      className="inline-flex items-center gap-2 border border-white/15 bg-ink/60 px-4 py-2 text-ivory transition-colors hover:border-gold hover:text-gold"
                    >
                      {c.rotulo.replace(/^Consulta processual\s*/i, "")} <Icon name="externo" className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="mt-4 flex gap-2">
                <li>
                  <a
                    href={site.redes.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram da Ledesma Advocacia (abre em nova aba)"
                    className="grid size-9 place-items-center border border-gold/25 text-gold transition-colors hover:border-gold hover:text-ivory"
                  >
                    <Icon name="instagram" className="size-4" />
                  </a>
                </li>
                <li>
                  <a
                    href={site.redes.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook da Ledesma Advocacia (abre em nova aba)"
                    className="grid size-9 place-items-center border border-gold/25 text-gold transition-colors hover:border-gold hover:text-ivory"
                  >
                    <Icon name="facebook" className="size-4" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {site.razaoSocial} · Todos os direitos reservados
            {site.cnpj ? ` · CNPJ ${site.cnpj}` : <Pending label="CNPJ" className="ml-2" />}
            {site.registroSociedadeOAB ? ` · Registro OAB ${site.registroSociedadeOAB}` : <Pending label="registro da sociedade na OAB" className="ml-2" />}
            <span className="block md:inline"><span className="hidden md:inline"> · </span>Conteúdo informativo, conforme o Código de Ética e Disciplina da OAB.</span>
          </p>
          <Link href="/politica-de-privacidade" className="shrink-0 transition-colors hover:text-gold">
            Política de privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
