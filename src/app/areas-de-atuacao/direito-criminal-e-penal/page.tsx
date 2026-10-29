import { AreaPage } from "@/components/AreaPage";
import { getArea } from "@/content/areas";
import { pageMetadata } from "@/lib/seo";

const area = getArea("direito-criminal-e-penal");

export const metadata = pageMetadata({
  title: area.seoTitulo,
  description: area.seoDescricao,
  path: "/areas-de-atuacao/direito-criminal-e-penal",
});

export default function Page() {
  return <AreaPage slug="direito-criminal-e-penal" />;
}
