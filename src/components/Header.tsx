"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { areas, areaHref } from "@/content/areas";
import { buttonClasses } from "./Button";
import { Icon } from "./icons";
import { Logo } from "./Logo";

const nav = [
  { href: "/", label: "Início" },
  { href: "/o-escritorio", label: "O Escritório" },
  { href: "/equipe", label: "Equipe" },
  { href: "/areas-de-atuacao", label: "Áreas de Atuação", children: areas.map((a) => ({ href: areaHref(a.slug), label: a.nome })) },
  { href: "/artigos", label: "Artigos" },
  { href: "/noticias", label: "Notícias" },
  { href: "/contato", label: "Contato" },
];

const isActive = (pathname: string | null, href: string) =>
  pathname !== null && (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

/** O pathname só é conhecido em tempo de requisição em rotas dinâmicas: renderiza sem estado ativo como fallback. */
export function Header() {
  return (
    <Suspense fallback={<HeaderView pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  );
}

function HeaderWithPath() {
  return <HeaderView pathname={usePathname()} />;
}

function HeaderView({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Fecha os menus ao navegar
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setAreasOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAreasOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAreasOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled || open ? "border-b border-gold/15 bg-ink/90 backdrop-blur-md" : "border-b border-transparent bg-gradient-to-b from-ink/80 to-transparent"
      }`}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-ivory focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <div className="container-site flex h-20 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-7">
            {nav.map((item) =>
              item.children ? (
                <li key={item.href} className="relative" ref={dropdownRef}>
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={navLinkClass(isActive(pathname, item.href))}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={areasOpen}
                      aria-controls="submenu-areas"
                      aria-label="Abrir lista de áreas de atuação"
                      onClick={() => setAreasOpen((v) => !v)}
                      className="grid size-7 place-items-center text-paper/80 transition-colors hover:text-gold"
                    >
                      <Icon name="setaBaixo" className={`size-3.5 transition-transform duration-300 ${areasOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  <ul
                    id="submenu-areas"
                    hidden={!areasOpen}
                    className="absolute left-1/2 top-full mt-4 w-72 -translate-x-1/2 border border-gold/20 bg-coal/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-md"
                  >
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={pathname === c.href ? "page" : undefined}
                          className={`block px-4 py-3 text-sm transition-colors hover:bg-gold/10 hover:text-ivory ${
                            pathname === c.href ? "text-gold" : "text-paper"
                          }`}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={navLinkClass(isActive(pathname, item.href))}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contato" className={`${buttonClasses("primary")} !px-5 !py-3 max-sm:!hidden lg:max-xl:!hidden`}>
            Fale com o escritório
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center text-ivory lg:hidden"
            aria-expanded={open}
            aria-controls="menu-movel"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "fechar" : "menu"} className="size-6" />
          </button>
        </div>
      </div>

      <div
        id="menu-movel"
        hidden={!open}
        className="h-[calc(100dvh-5rem)] overflow-y-auto border-t border-gold/10 bg-ink lg:hidden"
      >
        <nav aria-label="Navegação principal (celular)" className="container-site py-8">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`flex items-center justify-between border-b border-white/5 py-4 font-serif text-2xl ${
                    isActive(pathname, item.href) ? "text-gold" : "text-ivory"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mb-2 mt-1 space-y-1 border-l border-gold/25 pl-4">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={pathname === c.href ? "page" : undefined}
                          className={`block py-2.5 text-[0.95rem] ${pathname === c.href ? "text-gold" : "text-paper"}`}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <Link href="/contato" className={`${buttonClasses("primary")} mt-8 w-full`}>
            Fale com o escritório
          </Link>
        </nav>
      </div>
    </header>
  );
}

const navLinkClass = (active: boolean) =>
  `relative py-2 text-[0.8rem] font-medium tracking-[0.04em] transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-500 ${
    active ? "text-gold after:scale-x-100" : "text-paper hover:text-ivory after:scale-x-0 hover:after:scale-x-100"
  }`;
