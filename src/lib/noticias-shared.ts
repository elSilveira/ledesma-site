import type { AreaSlug } from "@/config/site";

/** Tipos e formatação das notícias, utilizáveis em componentes de servidor e de cliente. */

export type Tribunal = "STF" | "STJ" | "TST" | "TSE" | "CNJ" | "TRF" | "TRT" | "TJ" | "TRE";

export type Noticia = {
  id: string;
  fonte: string;
  titulo: string;
  resumo: string;
  link: string;
  /** ISO 8601 */
  data: string | null;
  autor: string | null;
  /** Imagem de destaque publicada pela própria fonte (exibida a partir do servidor dela). */
  imagem: string | null;
  areas: AreaSlug[];
  tribunais: Tribunal[];
  /** Menciona Paraná, Mato Grosso do Sul ou os tribunais dessas regiões. */
  regional: boolean;
};

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export const formatarDataNoticia = (iso: string | null) => (iso ? formatoData.format(new Date(iso)).replace(".", "") : "");
