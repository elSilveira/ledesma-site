import { NoticiasView } from "@/components/NoticiasView";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Notícias Jurídicas",
  description:
    "Notícias recentes do STJ, do ConJur e do Migalhas, organizadas por fonte e classificadas por área: Direito Criminal, Trabalhista, Previdenciário e Família e Sucessões.",
  path: "/noticias",
});

export default function NoticiasPage() {
  return <NoticiasView />;
}
