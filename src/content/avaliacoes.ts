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

/** Identificador do perfil do escritório no Google (Ledesma Advocacia, Rua Gen. Estilac Leal, 1467, Toledo - PR). */
const placeId = "ChIJ58BFVKqV85QRqTu6CIWsu4E";

/** Perfil no Google Maps, onde estão todas as avaliações. */
export const perfilGoogle = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

/** Abre direto a janela de escrever avaliação no Google (pede login na conta Google, se preciso). */
export const avaliarNoGoogle = `https://search.google.com/local/writereview?placeid=${placeId}`;

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
