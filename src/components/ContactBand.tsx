import Link from "next/link";
import { equipe, linkWhatsApp, mensagemPadrao, nomeComTratamento } from "@/config/site";
import { getArea } from "@/content/areas";
import { buttonClasses } from "./Button";
import { Icon } from "./icons";
import { delay } from "./PageHero";

/** Faixa de contato: cada área leva diretamente ao(à) advogado(a) responsável. */
export function ContactBand({ title = "Fale com o escritório" }: { title?: string }) {
  return (
    <section aria-labelledby="faixa-contato" className="relative overflow-hidden border-y border-gold/15 bg-gradient-to-br from-wine-deep/70 via-coal to-coal">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/2 size-[28rem] -translate-y-1/2 rounded-full bg-wine/25 blur-[110px]" />
      <div className="container-site relative grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div data-reveal>
          <p className="eyebrow">Contato</p>
          <h2 id="faixa-contato" className="mt-4 text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="mt-5 max-w-md text-paper">
            Escolha a área do seu assunto para conversar diretamente com o advogado responsável ou envie uma mensagem pelo formulário.
          </p>
          <Link href="/contato" className={`${buttonClasses("outline")} mt-8`}>
            Ir para o formulário <Icon name="seta" className="size-4" />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {equipe.map((p, i) => {
            const area = getArea(p.area);
            const wa = linkWhatsApp(p, mensagemPadrao(p, area.nome));
            if (!wa) return null;
            return (
              <li key={p.slug} data-reveal style={delay(i * 100)}>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-interactive group flex h-full flex-col p-6"
                  aria-label={`${area.nome}: conversar com ${nomeComTratamento(p)} pelo WhatsApp (abre em nova aba)`}
                >
                  <Icon name={area.icone} className="size-7 text-gold" />
                  <span className="mt-5 font-serif text-lg leading-snug text-ivory">{area.nome}</span>
                  <span className="mt-1 text-sm text-muted">{p.nomeCurto}</span>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
                    <Icon name="whatsapp" className="size-4" /> WhatsApp
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
