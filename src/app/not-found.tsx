import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="grain relative flex min-h-[80vh] items-center overflow-hidden bg-coal pt-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 size-[32rem] rounded-full bg-wine/15 blur-[120px]" />
      <div className="container-site relative">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-5 text-4xl md:text-6xl">Página não encontrada</h1>
        <p className="mt-6 max-w-xl text-paper">O endereço acessado não existe ou foi alterado. Use os links abaixo para continuar a navegação.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href="/">Página inicial</ButtonLink>
          <ButtonLink href="/contato" variant="outline">
            Contato
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
