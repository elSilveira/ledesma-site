import type { Metadata } from "next";
import { equipe, formatarOAB, nomeComTratamento, sedes, site } from "@/config/site";
import { areas, areaHref } from "@/content/areas";
import { artigoHref, type Artigo } from "@/content/articles";

export const OG_IMAGE = { url: "/og/ledesma-advocacia.jpg", width: 1200, height: 630, alt: "Ledesma Advocacia" };

// Concatena em vez de usar new URL(): site.url pode ter subcaminho (GitHub Pages)
export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Metadados por página: título, descrição, canonical e Open Graph coerentes entre si. */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      title,
      description,
      siteName: site.nome,
      locale: site.locale,
      images: [OG_IMAGE],
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

const orgId = absoluteUrl("/#organizacao");

/** Dados estruturados do escritório: apenas informações confirmadas (sem avaliações, sem horários não informados). */
export function organizationJsonLd() {
  const sameAs = [site.redes.instagram, site.redes.facebook];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LegalService",
        "@id": orgId,
        name: site.nome,
        legalName: site.razaoSocial,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/brand/logo-completo.png"),
        image: absoluteUrl(OG_IMAGE.url),
        description: site.descricao,
        sameAs,
        ...(site.email ? { email: site.email } : {}),
        areaServed: sedes.map((s) => ({ "@type": "City", name: `${s.cidade} – ${s.uf}` })),
        knowsAbout: areas.map((a) => a.nome),
        address: sedes.map(postalAddress),
        department: sedes.map((s) => ({
          "@type": "LegalService",
          "@id": absoluteUrl(`/contato#${s.slug}`),
          name: `${site.nome} – ${s.cidade}/${s.uf}`,
          address: postalAddress(s),
          ...(s.telefone ? { telephone: s.telefone } : {}),
          parentOrganization: { "@id": orgId },
        })),
        employee: equipe.map((p) => ({ "@id": absoluteUrl(`/equipe#${p.slug}`) })),
      },
      ...equipe.map((p) => ({
        "@type": "Person",
        "@id": absoluteUrl(`/equipe#${p.slug}`),
        name: nomeComTratamento(p),
        jobTitle: p.profissao,
        image: absoluteUrl(p.foto.src),
        telephone: `+${p.telefone}`,
        worksFor: { "@id": orgId },
        knowsAbout: areas.find((a) => a.slug === p.area)?.nome,
        identifier: p.oab.map((r) => ({ "@type": "PropertyValue", propertyID: `OAB/${r.uf}`, value: r.numero })),
        description: `${p.profissao} · ${formatarOAB(p.oab)}`,
      })),
    ],
  };
}

function postalAddress(s: (typeof sedes)[number]) {
  return {
    "@type": "PostalAddress",
    streetAddress: `${s.logradouro}, ${s.numero}`,
    addressLocality: s.cidade,
    addressRegion: s.uf,
    addressCountry: "BR",
    ...(s.cep ? { postalCode: s.cep } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function articleJsonLd(a: Artigo) {
  const revisor = a.revisadoPor ? equipe.find((p) => p.slug === a.revisadoPor) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titulo,
    description: a.descricao,
    datePublished: a.publicadoEm,
    dateModified: a.atualizadoEm,
    inLanguage: "pt-BR",
    mainEntityOfPage: absoluteUrl(artigoHref(a.slug)),
    image: absoluteUrl(OG_IMAGE.url),
    keywords: a.palavrasChave.join(", "),
    about: { "@type": "Thing", name: areas.find((x) => x.slug === a.area)?.nome, url: absoluteUrl(areaHref(a.area)) },
    author: revisor
      ? { "@type": "Person", "@id": absoluteUrl(`/equipe#${revisor.slug}`), name: nomeComTratamento(revisor) }
      : { "@id": orgId, "@type": "Organization", name: site.nome },
    publisher: { "@id": orgId, "@type": "Organization", name: site.nome, logo: absoluteUrl("/brand/logo-completo.png") },
  };
}

export function faqJsonLd(perguntas: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((q) => ({
      "@type": "Question",
      name: q.pergunta,
      acceptedAnswer: { "@type": "Answer", text: q.resposta },
    })),
  };
}
