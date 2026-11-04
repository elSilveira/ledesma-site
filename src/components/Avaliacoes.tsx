import { avaliacoes, perfilGoogle } from "@/content/avaliacoes";
import { ButtonExternal } from "./Button";
import { Carrossel } from "./Carrossel";
import { SectionHeading } from "./SectionHeading";

const formatarData = (iso: string) => iso.split("-").reverse().join("/");

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

function Estrelas({ nota }: { nota: number }) {
  return (
    <span role="img" aria-label={`Nota ${nota} de 5`} className="flex gap-0.5 text-gold">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className={`size-4 ${i < nota ? "fill-current" : "fill-steel"}`}>
          <path d="m10 1.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5Z" />
        </svg>
      ))}
    </span>
  );
}

/** Marca do Google, nas cores oficiais, para identificar a origem das avaliações. */
function LogoGoogle({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9Z" />
    </svg>
  );
}

/** Avaliações reais de clientes no Google (`src/content/avaliacoes.ts`), exibidas na página de contato. */
export function Avaliacoes() {
  if (avaliacoes.length === 0) return null;

  return (
    <section aria-labelledby="avaliacoes" className="grain relative overflow-hidden border-t border-gold/10 bg-coal py-20 md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 size-[30rem] rounded-full bg-wine/10 blur-[120px]" />
      <div className="container-site relative">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="Depoimentos" title="O que dizem os clientes" id="avaliacoes">
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <LogoGoogle className="size-5 shrink-0" />
              Avaliações publicadas por clientes no perfil do escritório no Google.
            </p>
          </SectionHeading>
          <ButtonExternal href={perfilGoogle} variant="outline" icon="externo" data-reveal aria-label="Ver todas as avaliações no Google (abre em nova aba)">
            Ver todas no Google
          </ButtonExternal>
        </div>

        <div data-reveal className="mt-12">
          <Carrossel rotulo="Avaliações de clientes no Google">
            {avaliacoes.map((a) => (
              <figure key={a.autor} className="card flex w-full flex-col gap-5 p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <Estrelas nota={a.nota} />
                  <LogoGoogle className="size-4.5 shrink-0" />
                </div>
                <blockquote className="flex-1 text-[0.95rem] leading-relaxed text-paper">{a.texto}</blockquote>
                <figcaption className="flex items-center gap-3 border-t border-white/5 pt-5">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-wine-deep font-serif text-sm text-ivory ring-1 ring-wine/60">
                    {iniciais(a.autor)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ivory">{a.autor}</span>
                    <span className="block text-xs text-muted">
                      Google · <time dateTime={a.data}>{formatarData(a.data)}</time>
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </Carrossel>
        </div>
      </div>
    </section>
  );
}
