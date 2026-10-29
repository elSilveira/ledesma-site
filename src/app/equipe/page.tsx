import { ContactBand } from "@/components/ContactBand";
import { PageHero } from "@/components/PageHero";
import { TeamCard } from "@/components/TeamCard";
import { equipe } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Nossa Equipe",
  description:
    "Conheça os advogados da Ledesma Advocacia: Dra. Amanda (Direito Previdenciário), Dr. Gustavo (Direito Trabalhista) e Dr. Erminio (Direito Criminal e Penal).",
  path: "/equipe",
});

export default function EquipePage() {
  return (
    <>
      <PageHero eyebrow="Nossa equipe" title="Os advogados do escritório" crumbs={[{ name: "Equipe", path: "/equipe" }]}>
        <p>Cada área de atuação conta com um profissional responsável, com contato direto pelo telefone ou pelo WhatsApp.</p>
      </PageHero>

      <section aria-label="Perfis profissionais" className="bg-ink py-24">
        <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((p, i) => (
            <TeamCard key={p.slug} pessoa={p} index={i} detalhado />
          ))}
        </div>
        <p className="container-site mt-12 text-xs text-muted">
          As inscrições na OAB podem ser consultadas no Cadastro Nacional dos Advogados, em{" "}
          <a href="https://cna.oab.org.br/" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:text-ivory">
            cna.oab.org.br
          </a>
          .
        </p>
      </section>

      <ContactBand />
    </>
  );
}
