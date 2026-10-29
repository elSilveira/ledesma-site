import Image from "next/image";
import Link from "next/link";
import { enderecoLinha, equipe, formatarOAB, linkMapa, linkTelefone, linkWhatsApp, nomeComTratamento, sedes, site } from "@/config/site";
import { areas, areaHref } from "@/content/areas";
import { Icon } from "./icons";
import { Pending } from "./Pending";

const institucional = [
  { href: "/o-escritorio", label: "O Escritório" },
  { href: "/equipe", label: "Equipe" },
  { href: "/artigos", label: "Artigos" },
  { href: "/noticias", label: "Notícias" },
  { href: "/contato", label: "Contato" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
];

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-gold/15 bg-coal">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr] lg:gap-10">
        <div>
          <Link href="/" aria-label="Ledesma Advocacia – página inicial" className="inline-block">
            <Image src="/brand/logo-completo.png" alt="" width={1012} height={628} className="h-auto w-44" />
          </Link>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
            Escritório com sedes em Toledo (PR) e Iguatemi (MS). Atuação pautada pela {site.valores.map((v) => v.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " e $1")}.
          </p>
          <ul className="mt-6 flex gap-3">
            <li>
              <a
                href={site.redes.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Ledesma Advocacia (abre em nova aba)"
                className="grid size-10 place-items-center border border-gold/25 text-gold transition-colors hover:border-gold hover:text-ivory"
              >
                <Icon name="instagram" className="size-5" />
              </a>
            </li>
            <li>
              <a
                href={site.redes.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook da Ledesma Advocacia (abre em nova aba)"
                className="grid size-10 place-items-center border border-gold/25 text-gold transition-colors hover:border-gold hover:text-ivory"
              >
                <Icon name="facebook" className="size-5" />
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Institucional">
          <h2 className="eyebrow !text-[0.68rem]">Institucional</h2>
          <ul className="mt-5 space-y-2.5 text-sm">
            {institucional.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-paper transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="eyebrow mt-9 !text-[0.68rem]">Áreas</h2>
          <ul className="mt-5 space-y-2.5 text-sm">
            {areas.map((a) => (
              <li key={a.slug}>
                <Link href={areaHref(a.slug)} className="text-paper transition-colors hover:text-gold">
                  {a.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow !text-[0.68rem]">Advogados</h2>
          <ul className="mt-5 space-y-5 text-sm">
            {equipe.map((p) => {
              const wa = linkWhatsApp(p);
              return (
                <li key={p.slug}>
                  <p className="text-ivory">{nomeComTratamento(p)}</p>
                  <p className="text-xs text-muted">{formatarOAB(p.oab)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3">
                    <a href={linkTelefone(p)} className="text-paper transition-colors hover:text-gold">
                      {p.telefoneExibicao}
                    </a>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gold transition-colors hover:text-ivory"
                        aria-label={`WhatsApp de ${p.nomeCurto} (abre em nova aba)`}
                      >
                        <Icon name="whatsapp" className="size-4" /> WhatsApp
                      </a>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow !text-[0.68rem]">Sedes</h2>
          <ul className="mt-5 space-y-5 text-sm">
            {sedes.map((s) => (
              <li key={s.slug}>
                <p className="text-ivory">
                  {s.cidade} – {s.uf}
                </p>
                <a
                  href={linkMapa(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-paper transition-colors hover:text-gold"
                  aria-label={`${enderecoLinha(s)} – abrir no Google Maps (nova aba)`}
                >
                  {s.logradouro}, {s.numero} – {s.bairro}
                </a>
                {!s.cep && <Pending label="CEP" className="ml-2" />}
              </li>
            ))}
          </ul>
          {site.email ? (
            <a href={`mailto:${site.email}`} className="mt-5 inline-flex items-center gap-2 text-sm text-paper hover:text-gold">
              <Icon name="email" className="size-4 text-gold" /> {site.email}
            </a>
          ) : (
            <Pending label="e-mail institucional" className="mt-5" />
          )}
          <h2 className="eyebrow mt-9 !text-[0.68rem]">Consulta processual</h2>
          <ul className="mt-5 space-y-2.5 text-sm">
            {site.consultaProcessual.map((c) => (
              <li key={c.href}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-paper hover:text-gold">
                  {c.rotulo} <Icon name="externo" className="size-3.5" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {site.razaoSocial}. Todos os direitos reservados.
            {site.cnpj ? ` CNPJ ${site.cnpj}.` : <Pending label="CNPJ" className="ml-2" />}
            {site.registroSociedadeOAB ? ` Registro OAB ${site.registroSociedadeOAB}.` : <Pending label="registro da sociedade na OAB" className="ml-2" />}
          </p>
          <p>Conteúdo de caráter exclusivamente informativo, conforme o Código de Ética e Disciplina da OAB.</p>
        </div>
      </div>
    </footer>
  );
}
