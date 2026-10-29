import { AreaPage } from "@/components/AreaPage";
import { getArea } from "@/content/areas";
import { pageMetadata } from "@/lib/seo";

const area = getArea("direito-trabalhista");

export const metadata = pageMetadata({
  title: area.seoTitulo,
  description: area.seoDescricao,
  path: "/areas-de-atuacao/direito-trabalhista",
});

export default function Page() {
  return <AreaPage slug="direito-trabalhista" />;
}
