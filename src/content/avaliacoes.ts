/**
 * Avaliações publicadas no perfil do escritório no Google, copiadas literalmente (inclusive grafia) da seção
 * "Depoimentos" do site atual (ledesma.adv.br, widget Trustindex), consultada em 04/11/2026.
 * Seleção de avaliações curtas, sem menção a resultados nem a pessoas fora da equipe. Não editar os textos: são palavras dos clientes. Para atualizar, copie novas avaliações do Google.
 */
export type Avaliacao = {
  autor: string;
  /** AAAA-MM-DD, data de publicação no Google */
  data: string;
  nota: 1 | 2 | 3 | 4 | 5;
  texto: string;
};

/** Perfil do escritório no Google Maps, onde estão todas as avaliações. */
export const perfilGoogle = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Ledesma Advocacia, Toledo - PR")}`;

export const avaliacoes: Avaliacao[] = [
  {
    autor: "Erick Gabriel",
    data: "2025-06-17",
    nota: 5,
    texto: "Ótimo atendimento, sempre buscando a transparência e eficiência com os clientes!!",
  },
  {
    autor: "Fernando Henrique Cardoso",
    data: "2025-06-17",
    nota: 5,
    texto: "Espaço excelente, conta com profissionais muito competentes e qualificados, recomendo!!",
  },
  {
    autor: "Deilson C Miranda",
    data: "2025-06-17",
    nota: 5,
    texto: "Tenho um processo com eles e foram extremamente profissionais, recomendo",
  },
  { autor: "Camila Pedreira", data: "2025-06-17", nota: 5, texto: "Bom atendimento, profissionais de excelência." },
  { autor: "Adilson Da silva", data: "2025-06-22", nota: 5, texto: "Otimos profissionais..." },
];
