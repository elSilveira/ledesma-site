import type { Metadata } from "next";
import { PaginaAutorizar } from "@/components/admin/PaginaAutorizar";

// Tela de consentimento do OAuth (conectar Claude/Codex ao MCP de artigos): fora do sitemap e sem indexação
export const metadata: Metadata = {
  title: "Conectar aplicativo",
  description: "Área restrita da Ledesma Advocacia.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AutorizarPage() {
  return (
    <section className="grain relative min-h-[70vh] overflow-hidden bg-coal pb-24 pt-36 md:pt-44">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-wine/15 blur-[120px]" />
      <div className="container-site relative">
        <p className="eyebrow">Área restrita</p>
        <h1 className="mt-5 text-4xl md:text-5xl">Conectar aplicativo</h1>
        <div className="mt-10">
          <noscript>
            <p className="card max-w-md p-6 text-sm text-paper">Esta página precisa de JavaScript ativado no navegador.</p>
          </noscript>
          <PaginaAutorizar />
        </div>
      </div>
    </section>
  );
}
