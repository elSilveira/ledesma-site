import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { Pending } from "@/components/Pending";
import {
  enderecoLinha,
  equipe,
  formatarOAB,
  linkMapa,
  linkTelefone,
  linkWhatsApp,
  mensagemPadrao,
  nomeComTratamento,
  sedes,
  site,
} from "@/config/site";
import { getArea } from "@/content/areas";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contato",
  description:
    "Fale com a Ledesma Advocacia: WhatsApp e telefone dos advogados por área de atuação e endereços das sedes em Toledo (PR) e Iguatemi (MS).",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <>
      <PageHero eyebrow="Contato" title="Fale com o escritório" crumbs={[{ name: "Contato", path: "/contato" }]}>
        <p>Entre em contato diretamente com o advogado responsável pela área do seu assunto ou envie uma mensagem pelo formulário.</p>
      </PageHero>

      <section className="bg-ink py-20 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.35fr]">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl md:text-3xl">Advogados por área</h2>
              <ul className="mt-7 space-y-4">
                {equipe.map((p) => {
                  const area = getArea(p.area);
                  const wa = linkWhatsApp(p, mensagemPadrao(p, area.nome));
                  return (
                    <li key={p.slug} className="card p-6">
                      <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold">
                        <Icon name={area.icone} className="size-4" /> {area.nome}
                      </p>
                      <p className="mt-3 font-serif text-xl text-ivory">{nomeComTratamento(p)}</p>
                      <p className="text-xs text-muted">{formatarOAB(p.oab)}</p>
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-gold hover:text-ivory"
                            aria-label={`WhatsApp de ${p.nomeCurto}, ${p.telefoneExibicao} (abre em nova aba)`}
                          >
                            <Icon name="whatsapp" className="size-5" /> WhatsApp
                          </a>
                        )}
                        <a href={linkTelefone(p)} className="inline-flex items-center gap-2 text-paper hover:text-ivory">
                          <Icon name="telefone" className="size-4.5 text-gold" /> {p.telefoneExibicao}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl">Sedes</h2>
              <ul className="mt-7 space-y-6">
                {sedes.map((s) => (
                  <li key={s.slug} id={s.slug} className="flex scroll-mt-28 gap-4">
                    <Icon name="local" className="mt-1 size-6 shrink-0 text-gold" />
                    <div>
                      <p className="font-serif text-lg text-ivory">
                        {s.cidade} – {s.uf}
                      </p>
                      <p className="text-sm text-paper">{enderecoLinha(s)}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {s.horario ? <p className="text-sm text-muted">{s.horario}</p> : <Pending label="horário" />}
                        {s.cep ? <p className="text-sm text-muted">CEP {s.cep}</p> : <Pending label="CEP" />}
                      </div>
                      <a
                        href={linkMapa(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-gold hover:text-ivory"
                      >
                        Abrir no Google Maps <Icon name="externo" className="size-3.5" />
                        <span className="sr-only">(abre em nova aba)</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl">Outros canais</h2>
              <ul className="mt-6 space-y-3 text-sm">
                {site.email && (
                  <li>
                    <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-paper hover:text-gold">
                      <Icon name="email" className="size-5 text-gold" /> {site.email}
                    </a>
                  </li>
                )}
                <li>
                  <a href={site.redes.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-paper hover:text-gold">
                    <Icon name="instagram" className="size-5 text-gold" /> @ledesma.advocacia
                    <span className="sr-only">(Instagram, abre em nova aba)</span>
                  </a>
                </li>
                <li>
                  <a href={site.redes.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-paper hover:text-gold">
                    <Icon name="facebook" className="size-5 text-gold" /> Facebook
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
