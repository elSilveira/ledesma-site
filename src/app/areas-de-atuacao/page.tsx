import { AreaCard } from "@/components/AreaCard";
import { ContactBand } from "@/components/ContactBand";
import { PageHero } from "@/components/PageHero";
import { areas } from "@/content/areas";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Áreas de Atuação",
  description:
    "Áreas de atuação da Ledesma Advocacia em Toledo (PR) e Iguatemi (MS): Direito Criminal e Penal, Direito Trabalhista e Direito Previdenciário.",
  path: "/areas-de-atuacao",
});

export default function AreasPage() {
  return (
    <>
      <PageHero eyebrow="Áreas de atuação" title="Onde o escritório atua" crumbs={[{ name: "Áreas de Atuação", path: "/areas-de-atuacao" }]}>
        <p>Três áreas, cada uma com um advogado responsável e conteúdo informativo sobre os temas mais frequentes.</p>
      </PageHero>
      <section aria-label="Lista de áreas" className="bg-ink py-24">
        <div className="container-site grid gap-5 md:grid-cols-3">
          {areas.map((a, i) => (
            <AreaCard key={a.slug} area={a} index={i} />
          ))}
        </div>
      </section>
      <ContactBand />
    </>
  );
}
