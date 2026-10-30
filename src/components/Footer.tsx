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

const titulo = "font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-gold";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t-2 border-gold/70 bg-coal text-[0.95rem]">
      <div className="container-site">
        {/* Navegação e equipe */}
        <div className="grid gap-8 py-8 md:grid-cols-2 md:gap-12">
          <nav aria-label="Rodapé">
            <h2 className={titulo}>Explore</h2>
            <ul className="mt-3 space-y-1.5">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ivory transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className={`${titulo} mt-6`}>Áreas de atuação</h2>
            <ul className="mt-3 space-y-1.5">
              {areas.map((a) => (
                <li key={a.slug}>
                  <Link href={areaHref(a.slug)} className="text-paper transition-colors hover:text-gold">
                    {a.nomeCurto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={titulo}>Fale com nossa equipe</h2>
            <ul className="mt-3">
              {equipe.map((p) => {
                const wa = linkWhatsApp(p);
                return (
                  <li key={p.slug} className="border-b border-white/10 py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                    <p className="text-ivory">{nomeComTratamento(p)}</p>
                    <p className="text-xs text-muted">{formatarOAB(p.oab)}</p>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-gold transition-colors hover:text-ivory"
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
        </div>

        {/* Sedes e consulta processual */}
        <div className="grid gap-8 border-t border-white/10 py-7 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className={titulo}>Nossas sedes</h2>
            <ul className="mt-3 space-y-2.5">
              {sedes.map((s) => (
                <li key={s.slug}>
                  <p className="text-paper">
                    {s.cidade} – {s.uf}
                  </p>
                  <a
                    href={linkMapa(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-muted transition-colors hover:text-gold"
                    aria-label={`${enderecoLinha(s)} – abrir no Google Maps (nova aba)`}
                  >
                    {s.logradouro}, {s.numero} – {s.bairro}
                    {s.cep && ` · CEP ${s.cep}`}
                  </a>
                  {!s.cep && <Pending label="CEP" className="ml-2" />}
                </li>
              ))}
            </ul>
            {site.email && (
              <a href={`mailto:${site.email}`} className="mt-3 inline-flex items-center gap-2 text-sm text-paper hover:text-gold">
                <Icon name="email" className="size-4 text-gold" /> {site.email}
              </a>
            )}
          </div>

          <div>
            <h2 className={titulo}>Consulta processual</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
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

        {/* Rodapé final */}
        <div className="flex flex-col gap-2 border-t border-white/10 py-4 text-xs text-muted md:flex-row md:items-start md:justify-between">
          <div>
            <p>
              © {site.razaoSocial} · Todos os direitos reservados
              {site.cnpj ? ` · CNPJ ${site.cnpj}` : <Pending label="CNPJ" className="ml-2" />}
              {site.registroSociedadeOAB ? ` · Registro ${site.registroSociedadeOAB}` : <Pending label="registro da sociedade na OAB" className="ml-2" />}
            </p>
            <p className="mt-0.5">Conteúdo de caráter exclusivamente informativo, conforme o Código de Ética e Disciplina da OAB.</p>
          </div>
          <Link href="/politica-de-privacidade" className="shrink-0 transition-colors hover:text-gold">
            Política de privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
