/**
 * Dados institucionais centralizados da Ledesma Advocacia.
 *
 * REGRA: nenhum dado é inventado. Campos com valor `null` estão PENDENTES
 * e simplesmente não aparecem no site publicado. Em desenvolvimento, eles
 * aparecem como marcadores tracejados ("Pendente: …") para facilitar a revisão.
 *
 * Execute `npm run pendencias` para listar tudo o que ainda falta preencher.
 *
 * Fontes:
 *  - [cliente]  dados enviados pelo escritório para este projeto
 *  - [site]     dados publicados em https://ledesma.adv.br/ (consultado em out/2026)
 *
 * Este arquivo não importa outros módulos: o script de pendências o lê diretamente com Node.
 */

export type AreaSlug = "direito-criminal-e-penal" | "direito-trabalhista" | "direito-previdenciario";

/** Público atendido na área trabalhista. `null` = ainda não confirmado pelo escritório. */
export type PublicoTrabalhista = "trabalhadores" | "empresas" | "ambos" | null;

export type RegistroOAB = { uf: string; numero: string };

export type Integrante = {
  slug: string;
  tratamento: "Dr." | "Dra.";
  /** Nome curto usado em botões e chamadas. */
  nomeCurto: string;
  /** [cliente] nome completo confirmado pelo escritório. */
  nomeCompleto: string;
  /** [cliente] confirmada pelo envio dos números de inscrição na OAB. */
  profissao: "Advogado" | "Advogada";
  oab: RegistroOAB[];
  area: AreaSlug;
  /** Somente dígitos, com DDI. [cliente] */
  telefone: string;
  /** Exibição do telefone, como informado pelo cliente. */
  telefoneExibicao: string;
  /** O número tem WhatsApp? [site] os três números constam como WhatsApp no site atual. */
  whatsapp: boolean;
  foto: { src: string; alt: string };
  /** Pendentes: preencher somente com informações verificadas. */
  minibio: string | null;
  formacao: string[] | null;
  /** Títulos de especialização só podem ser divulgados se o profissional os possuir formalmente. */
  titulos: string[] | null;
};

export type Sede = {
  slug: string;
  cidade: string;
  uf: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string | null;
  telefone: string | null;
  horario: string | null;
};

const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

export const site = {
  nome: "Ledesma Advocacia",
  /** [site] razão social exibida no rodapé do site atual. */
  razaoSocial: "Ledesma Advocacia S/S",

  /** Domínio ainda não definido. Configure NEXT_PUBLIC_SITE_URL no ambiente de produção. */
  url: envUrl || "http://localhost:3000",
  /** Só permite indexação quando o domínio definitivo estiver configurado. */
  indexavel: Boolean(envUrl) && process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false",
  verificacaoGoogle: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || null,
  /** Token do Cloudflare Web Analytics (estatísticas sem cookies). Sem ele, nenhum script de estatística é carregado. */
  estatisticasToken: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN || null,

  locale: "pt_BR",
  descricao:
    "Ledesma Advocacia: escritório com sedes em Toledo (PR) e Iguatemi (MS), com atuação em Direito Criminal e Penal, Direito Trabalhista e Direito Previdenciário.",

  /** [site] valores declarados no site atual. */
  valores: ["Ética", "Transparência", "Eficiência"],
  /** [site] o site atual informa atendimento a distância ("advocacia digital") para todo o Brasil. */
  atendimentoOnline: true,

  /** [cliente] */
  cnpj: "27.062.854/0001-59" as string | null,
  /** [cliente] */
  registroSociedadeOAB: "OAB/MS 964/2017" as string | null,
  /** [cliente] o escritório não tem e-mail institucional. Se passar a ter, basta preenchê-lo aqui. */
  email: null as string | null,
  /** [cliente] confirmado: mais de 15 anos. */
  anosDeAtuacao: 15 as number | null,
  fundacao: null as string | null,

  /** [cliente] */
  publicoTrabalhista: "ambos" as PublicoTrabalhista,

  redes: {
    /** [site] */
    instagram: "https://www.instagram.com/ledesma.advocacia/",
    /** [site] */
    facebook: "https://www.facebook.com/profile.php?id=100080430601130",
  },

  /** [site] links de consulta processual oferecidos no site atual. */
  consultaProcessual: [
    { rotulo: "Consulta processual TJPR", href: "https://www.tjpr.jus.br/consulta-processual" },
    { rotulo: "Consulta processual TJMS", href: "https://esaj.tjms.jus.br/cpopg5/open.do" },
  ],
} as const;

/** [cliente] endereços, CEPs e horários informados. As sedes não têm telefone fixo (confirmado pelo cliente). */
export const sedes: Sede[] = [
  {
    slug: "toledo-pr",
    cidade: "Toledo",
    uf: "PR",
    logradouro: "Rua General Estilac Leal",
    numero: "1.467",
    bairro: "Centro",
    cep: "85900-092",
    telefone: null,
    horario: "Segunda a sexta, das 8h às 12h e das 13h às 18h",
  },
  {
    slug: "iguatemi-ms",
    cidade: "Iguatemi",
    uf: "MS",
    logradouro: "Rua Francisco Martins Rodrigues",
    numero: "653",
    bairro: "Centro",
    cep: "79960-000",
    telefone: null,
    horario: "Segunda a sexta, das 8h às 12h e das 13h às 18h",
  },
];

/** Ordem conforme enviada pelo cliente. Fotos: sessão oficial publicada em ledesma.adv.br. */
export const equipe: Integrante[] = [
  {
    slug: "amanda",
    tratamento: "Dra.",
    nomeCurto: "Dra. Amanda",
    nomeCompleto: "Amanda Gabrielly Frutos da Silva",
    profissao: "Advogada",
    oab: [{ uf: "MS", numero: "31.010" }],
    area: "direito-previdenciario",
    telefone: "5567993125666",
    telefoneExibicao: "(67) 9 9312-5666",
    whatsapp: true,
    foto: { src: "/equipe/amanda.webp", alt: "Retrato da Dra. Amanda Gabrielly Frutos da Silva" },
    /** [cliente] texto enviado pelo próprio profissional. */
    minibio:
      "Sou advogada há 2 anos, com atuação voltada à área previdenciária, área pela qual tenho grande interesse e dedicação. Atualmente estou realizando cursos para me especializar ainda mais em Direito Previdenciário, buscando sempre ampliar meus conhecimentos e evoluir profissionalmente, com o compromisso de oferecer um atendimento próximo, responsável e dedicado a cada cliente.",
    formacao: [
      "Graduação em Direito pela Universidade Paranaense (UNIPAR)",
    ],
    titulos: null,
  },
  {
    slug: "gustavo",
    tratamento: "Dr.",
    nomeCurto: "Dr. Gustavo",
    nomeCompleto: "Gustavo Turatto Ledesma",
    profissao: "Advogado",
    oab: [{ uf: "MS", numero: "31.011" }],
    area: "direito-trabalhista",
    telefone: "5567999213677",
    telefoneExibicao: "(67) 9 9921-3677",
    whatsapp: true,
    foto: { src: "/equipe/gustavo.webp", alt: "Retrato do Dr. Gustavo Turatto Ledesma" },
    /** [cliente] texto enviado pelo próprio profissional. */
    minibio:
      "Sou advogado há 2 anos, com atuação voltada à área trabalhista, área pela qual tenho grande interesse e dedicação. Atualmente curso pós-graduação em Direito do Trabalho e Processo do Trabalho, buscando sempre ampliar meus conhecimentos e evoluir profissionalmente, com o compromisso de oferecer um atendimento próximo, responsável e dedicado a cada cliente.",
    formacao: [
      "Graduação em Direito pela Universidade Paranaense (UNIPAR)",
      "Pós-graduação em Direito do Trabalho e Processo do Trabalho (em andamento)",
    ],
    titulos: null,
  },
  {
    slug: "erminio",
    tratamento: "Dr.",
    nomeCurto: "Dr. Erminio",
    nomeCompleto: "Erminio Rodrigo Gomes Ledesma",
    profissao: "Advogado",
    oab: [
      { uf: "MS", numero: "14.249" },
      { uf: "PR", numero: "98.646" },
    ],
    area: "direito-criminal-e-penal",
    telefone: "5567996381323",
    telefoneExibicao: "(67) 9 9638-1323",
    whatsapp: true,
    foto: { src: "/equipe/erminio.webp", alt: "Retrato do Dr. Erminio Rodrigo Gomes Ledesma" },
    /** [cliente] texto enviado pelo próprio profissional. */
    minibio:
      "Sou advogado há 16 anos, com atuação voltada à área criminalista, área pela qual tenho grande interesse e dedicação. Busco sempre ampliar meus conhecimentos e evoluir profissionalmente, com o compromisso de oferecer um atendimento próximo, responsável e dedicado a cada cliente.",
    formacao: [
      "Graduação em Direito pela Universidade Paranaense (UNIPAR)",
      "Pós-graduação em Direito Penal e Processo Penal",
      "Pós-graduação em Tribunal do Júri (em andamento)",
      "Pós-graduação em Recursos e Penas (em andamento)",
    ],
    titulos: null,
  },
];

/** Foto oficial da equipe reunida. */
export const fotoEquipe = {
  src: "/equipe/equipe.webp",
  alt: "Dr. Gustavo Turatto Ledesma, Dr. Erminio Rodrigo Gomes Ledesma e Dra. Amanda Gabrielly Frutos da Silva",
  width: 925,
  height: 658,
};

export const formatarOAB = (oab: RegistroOAB[]) => oab.map((r) => `OAB/${r.uf} ${r.numero}`).join(" · ");

export const nomeComTratamento = (p: Integrante) => `${p.tratamento} ${p.nomeCompleto}`;

export const enderecoLinha = (s: Sede) => `${s.logradouro}, ${s.numero} – ${s.bairro}, ${s.cidade} – ${s.uf}`;

export const linkMapa = (s: Sede) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${s.logradouro}, ${s.numero.replace(".", "")}, ${s.bairro}, ${s.cidade} - ${s.uf}`,
  )}`;

export const linkWhatsApp = (p: Integrante, mensagem?: string) =>
  p.whatsapp
    ? `https://wa.me/${p.telefone}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`
    : null;

export const linkTelefone = (p: Integrante) => `tel:+${p.telefone}`;

export const responsavelPorArea = (area: AreaSlug) => equipe.find((p) => p.area === area);

export const mensagemPadrao = (p: Integrante, areaNome: string) =>
  `Olá, ${p.nomeCurto}. Gostaria de solicitar um atendimento sobre ${areaNome}.`;

/** Lista as pendências para a revisão antes da publicação. */
export function listarPendencias(): string[] {
  const p: string[] = [];
  if (!envUrl) p.push("Domínio definitivo (variável NEXT_PUBLIC_SITE_URL)");
  if (!site.verificacaoGoogle) p.push("Código de verificação do Google Search Console (NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)");
  if (!site.estatisticasToken) p.push("Token do Cloudflare Web Analytics para as estatísticas de visitas (NEXT_PUBLIC_CF_ANALYTICS_TOKEN)");
  if (!site.cnpj) p.push("CNPJ da sociedade");
  if (!site.registroSociedadeOAB) p.push("Número de registro da sociedade na OAB");
  if (site.anosDeAtuacao === null) p.push("Tempo de atuação do escritório ");
  if (site.publicoTrabalhista === null) p.push("Público da área trabalhista: trabalhadores, empresas ou ambos");
  for (const s of sedes) {
    if (!s.cep) p.push(`CEP da sede de ${s.cidade}/${s.uf}`);
    if (!s.horario) p.push(`Horário de atendimento da sede de ${s.cidade}/${s.uf}`);
  }
  for (const m of equipe) {
    if (!m.minibio) p.push(`${m.nomeCurto}: minibiografia`);
    if (!m.formacao) p.push(`${m.nomeCurto}: formação acadêmica`);
  }
  return p;
}
