import type { Metadata, Viewport } from "next";
import { Montserrat, PT_Serif } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { RevealObserver } from "@/components/RevealObserver";
import { site } from "@/config/site";
import { OG_IMAGE, organizationJsonLd } from "@/lib/seo";
import "./globals.css";

// Tipografia institucional do site atual da Ledesma Advocacia
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Ledesma Advocacia | Advogados em Toledo – PR",
    template: "%s | Ledesma Advocacia",
  },
  description: site.descricao,
  applicationName: site.nome,
  authors: [{ name: site.razaoSocial }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.nome,
    locale: site.locale,
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  robots: site.indexavel
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false },
  ...(site.verificacaoGoogle ? { verification: { google: site.verificacaoGoogle } } : {}),
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${ptSerif.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        {/* Habilita as animações de revelação apenas quando há JavaScript */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={organizationJsonLd()} />
        <Header />
        <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
