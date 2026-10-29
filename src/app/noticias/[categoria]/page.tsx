import { notFound } from "next/navigation";
import { NoticiasView } from "@/components/NoticiasView";
import { fontesNoticias, getFonte, noticiasHref } from "@/config/noticias";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return fontesNoticias.map((f) => ({ categoria: f.id }));
}

export async function generateMetadata({ params }: PageProps<"/noticias/[categoria]">) {
  const { categoria } = await params;
  const fonte = getFonte(categoria);
  if (!fonte) return { title: "Categoria não encontrada", robots: { index: false } };
  return pageMetadata({
    title: `Notícias: ${fonte.nome}`,
    description: `${fonte.descricao} Manchetes recentes com link para a fonte original.`,
    path: noticiasHref(fonte.id),
  });
}

export default async function CategoriaPage({ params }: PageProps<"/noticias/[categoria]">) {
  const { categoria } = await params;
  const fonte = getFonte(categoria);
  if (!fonte) notFound();
  return <NoticiasView fonte={fonte} />;
}
