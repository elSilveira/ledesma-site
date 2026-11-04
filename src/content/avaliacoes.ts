/**
 * Avaliações publicadas no perfil do escritório no Google, copiadas literalmente (inclusive grafia) da seção
 * "Depoimentos" do site atual (ledesma.adv.br, widget Trustindex), consultada em 04/11/2026.
 * Não editar os textos: são palavras dos clientes. Para atualizar, copie novas avaliações do Google.
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
    autor: "Alete Soares Soares",
    data: "2025-06-21",
    nota: 5,
    texto:
      "Advocacia Ledesma\nMuito obrigada aos profissionais.\nProfissionalismo e dedicação. Dou grata, muito grata pela ajuda e apoio. Agradeço a atenção e competência em lidar com o meu caso.\nVocês são exemplos de profissionais a serem seguidos.\nQue Deus continue dando sabedoria do Céu para casos super difíceis, poi cuidado, atenção e amor tem sobrando.\nMinha gratidão Dr. Rodrigo e Dr. Gustavo\nObrigada de coração.\nSuper indico quem faz o bem.\nImagina vocês que fazem o melhor.\nObrigada mais uma vez.",
  },
  {
    autor: "carlos magno Pedrosa",
    data: "2025-06-17",
    nota: 5,
    texto:
      "Um escritório de uma eficiência e capacidade de explicar e agir de maneira clara e correta, onde sou cliente e muito satisfeito pelo meus casos resolvidos em pouco tempo e satisfatórios.",
  },
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
  {
    autor: "Camila Pedreira",
    data: "2025-06-17",
    nota: 5,
    texto: "Bom atendimento, profissionais de excelência.",
  },
  { autor: "Adilson Da silva", data: "2025-06-22", nota: 5, texto: "Otimos profissionais..." },
  { autor: "machado angelica", data: "2025-06-17", nota: 5, texto: "ótimos profissionais." },
];
