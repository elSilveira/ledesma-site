import { type NextRequest, NextResponse } from "next/server";
import { fontesNoticias } from "@/config/noticias";
import { equipe } from "@/config/site";
import { artigos } from "@/content/articles";

const validos: Record<string, Set<string>> = {
  artigos: new Set(artigos.map((a) => a.slug)),
  noticias: new Set(fontesNoticias.map((f) => f.id)),
  equipe: new Set(equipe.map((p) => p.slug)),
};

/**
 * Com Cache Components, a resposta da página começa a ser transmitida antes de `notFound()`,
 * o que fixaria o status em 200. Esta verificação devolve um 404 real para artigos, categorias e advogados inexistentes.
 */
export function proxy(request: NextRequest) {
  const [, secao, slug] = request.nextUrl.pathname.replace(/\/$/, "").split("/");
  if (validos[secao]?.has(decodeURIComponent(slug ?? ""))) return NextResponse.next();
  // Rota inexistente: o Next.js responde com a página not-found e status 404
  return NextResponse.rewrite(new URL("/_pagina-nao-encontrada", request.url));
}

export const config = {
  matcher: [
    "/artigos/:slug",
    "/noticias/:categoria",
    // Só endereços de página: as fotos ficam em /equipe/*.webp
    "/equipe/:slug([a-z-]+)",
  ],
};
