import type { AreaSlug, PublicoTrabalhista } from "@/config/site";
import type { IconName } from "@/components/icons";

/**
 * Conteúdo das áreas de atuação.
 * Linguagem informativa (Provimento OAB nº 205/2021): sem promessas de resultado,
 * sem apelos emocionais e sem atribuir títulos de especialista.
 */

export type Topico = { titulo: string; texto: string; icone: IconName };

export type Secao = {
  id: string;
  titulo: string;
  introducao: string;
  topicos: Topico[];
};

export type Area = {
  slug: AreaSlug;
  nome: string;
  nomeCurto: string;
  icone: IconName;
  /** Título SEO e descrição meta. */
  seoTitulo: string;
  seoDescricao: string;
  resumo: string;
  introducao: string[];
  secoes: Secao[];
  /** Blocos exibidos conforme o público confirmado (somente área trabalhista). */
  porPublico?: Partial<Record<Exclude<PublicoTrabalhista, null>, Secao>>;
  perguntas: { pergunta: string; resposta: string }[];
};

export const areas: Area[] = [
  {
    slug: "direito-criminal-e-penal",
    nome: "Direito Criminal e Penal",
    nomeCurto: "Criminal e Penal",
    icone: "balanca",
    seoTitulo: "Direito Criminal e Penal em Toledo – PR",
    seoDescricao:
      "Atuação em Direito Criminal e Penal em Toledo (PR) e Iguatemi (MS): inquérito policial, prisão em flagrante, audiência de custódia, ação penal, recursos, habeas corpus e execução penal.",
    resumo: "Acompanhamento técnico em todas as fases da persecução penal, da investigação à execução da pena.",
    introducao: [
      "No uso cotidiano, “Direito Criminal” e “Direito Penal” designam a mesma área. Tecnicamente, o Direito Penal reúne as normas que definem crimes e penas, enquanto o Direito Processual Penal regula o caminho do processo: investigação, acusação, defesa, julgamento e recursos.",
      "A atuação do escritório nessa área reúne as duas dimensões, com acompanhamento técnico desde a fase de investigação, sempre com sigilo profissional e respeito às garantias previstas na Constituição Federal.",
    ],
    secoes: [
      {
        id: "investigacao",
        titulo: "Fase de investigação",
        introducao: "Antes de existir um processo, a pessoa investigada já tem direitos que podem ser exercidos com orientação técnica.",
        topicos: [
          { titulo: "Inquérito policial", texto: "Acompanhamento de depoimentos e diligências, acesso aos autos e manifestações na fase investigativa.", icone: "documento" },
          { titulo: "Prisão em flagrante", texto: "Análise da legalidade da prisão e dos requisitos para a liberdade provisória ou medidas cautelares diversas.", icone: "algema" },
          { titulo: "Audiência de custódia", texto: "Assistência na audiência em que o juiz avalia a prisão, em regra no prazo de 24 horas.", icone: "martelo" },
        ],
      },
      {
        id: "processo",
        titulo: "Ação penal",
        introducao: "Com o recebimento da denúncia, começa o processo penal propriamente dito.",
        topicos: [
          { titulo: "Defesa no processo criminal", texto: "Resposta à acusação, produção de provas, audiências de instrução e alegações finais.", icone: "escudo" },
          { titulo: "Tribunal do Júri", texto: "Atuação nos processos de crimes dolosos contra a vida, da fase de pronúncia ao plenário.", icone: "colunas" },
        ],
      },
      {
        id: "recursos",
        titulo: "Recursos e habeas corpus",
        introducao: "Decisões podem ser revistas pelos tribunais por meio dos instrumentos previstos em lei.",
        topicos: [
          { titulo: "Recursos criminais", texto: "Apelação, recurso em sentido estrito e demais recursos cabíveis contra decisões judiciais.", icone: "documento" },
          { titulo: "Habeas corpus", texto: "Instrumento constitucional contra prisão ilegal ou ameaça ilegal à liberdade de locomoção.", icone: "chave" },
        ],
      },
      {
        id: "execucao",
        titulo: "Execução penal",
        introducao: "Após a condenação definitiva, a Lei de Execução Penal garante direitos durante o cumprimento da pena.",
        topicos: [
          { titulo: "Acompanhamento da execução", texto: "Pedidos de progressão de regime, livramento condicional, remição e demais direitos previstos na Lei nº 7.210/1984.", icone: "relogio" },
        ],
      },
    ],
    perguntas: [
      {
        pergunta: "Direito Criminal e Direito Penal são a mesma coisa?",
        resposta:
          "Na prática, as expressões são usadas como sinônimas. Em sentido técnico, o Direito Penal define crimes e penas, e o Direito Processual Penal disciplina o processo. A atuação criminal envolve as duas áreas.",
      },
      {
        pergunta: "Fui intimado para depor na delegacia. Preciso de advogado?",
        resposta:
          "A Constituição assegura o direito à assistência de advogado e o direito de permanecer em silêncio. A presença de um advogado não é obrigatória em todos os atos, mas a orientação prévia ajuda a compreender a condição em que a pessoa está sendo ouvida e os direitos aplicáveis.",
      },
      {
        pergunta: "O atendimento é sigiloso?",
        resposta:
          "Sim. O sigilo profissional é dever do advogado, previsto no Estatuto da Advocacia (Lei nº 8.906/1994) e no Código de Ética e Disciplina da OAB.",
      },
    ],
  },
  {
    slug: "direito-trabalhista",
    nome: "Direito Trabalhista",
    nomeCurto: "Trabalhista",
    icone: "maleta",
    seoTitulo: "Direito Trabalhista em Toledo – PR",
    seoDescricao:
      "Atuação em Direito Trabalhista em Toledo (PR) e Iguatemi (MS): verbas rescisórias, horas extras, FGTS, reconhecimento de vínculo, acidente de trabalho e estabilidade.",
    resumo: "Orientação e atuação em questões decorrentes da relação de emprego, com base na CLT e na Constituição.",
    introducao: [
      "O Direito do Trabalho regula a relação entre empregados e empregadores: contratação, jornada, remuneração, segurança, estabilidade e extinção do contrato.",
      "A atuação abrange a análise de cada situação concreta, a orientação sobre direitos e deveres e, quando necessário, o acompanhamento de processos na Justiça do Trabalho.",
    ],
    secoes: [
      {
        id: "temas",
        titulo: "Temas frequentes",
        introducao: "Algumas das questões trabalhistas que o escritório acompanha:",
        topicos: [
          { titulo: "Horas extras e jornada", texto: "Controle de jornada, adicional de horas extras, banco de horas e intervalos.", icone: "relogio" },
          { titulo: "Rescisão do contrato", texto: "Verbas rescisórias, aviso prévio, rescisão indireta e dispensa por justa causa.", icone: "documento" },
          { titulo: "Reconhecimento de vínculo", texto: "Situações em que estão presentes os requisitos da relação de emprego sem registro formal.", icone: "aperto" },
          { titulo: "FGTS", texto: "Verificação dos depósitos mensais e da multa rescisória quando aplicável.", icone: "moeda" },
          { titulo: "Acidente de trabalho", texto: "Doença ocupacional, acidente típico, estabilidade acidentária e responsabilidades.", icone: "escudo" },
          { titulo: "Estabilidade da gestante", texto: "Garantia provisória de emprego desde a confirmação da gravidez até cinco meses após o parto.", icone: "pessoas" },
        ],
      },
    ],
    porPublico: {
      trabalhadores: {
        id: "trabalhadores",
        titulo: "Para trabalhadores",
        introducao: "Orientação a empregados sobre seus direitos durante e após o contrato de trabalho.",
        topicos: [
          { titulo: "Análise de documentos", texto: "Avaliação de contracheques, termos de rescisão, cartões de ponto e extratos do FGTS.", icone: "documento" },
          { titulo: "Reclamação trabalhista", texto: "Acompanhamento do processo na Justiça do Trabalho, das audiências aos recursos.", icone: "martelo" },
        ],
      },
      empresas: {
        id: "empresas",
        titulo: "Para empresas",
        introducao: "Apoio a empregadores na prevenção e na condução de questões trabalhistas.",
        topicos: [
          { titulo: "Consultoria preventiva", texto: "Revisão de rotinas, contratos e políticas internas à luz da legislação trabalhista.", icone: "escudo" },
          { titulo: "Defesa em reclamações", texto: "Atuação em processos trabalhistas movidos contra a empresa.", icone: "martelo" },
        ],
      },
    },
    perguntas: [
      {
        pergunta: "Qual é o prazo para entrar com uma ação trabalhista?",
        resposta:
          "Pela Constituição Federal (art. 7º, XXIX), o prazo é de até dois anos após o fim do contrato, podendo-se discutir os créditos dos últimos cinco anos. Cada caso deve ser analisado individualmente.",
      },
      {
        pergunta: "Quais documentos devo reunir para uma consulta?",
        resposta:
          "Em geral, carteira de trabalho, contrato, contracheques, termo de rescisão, extrato do FGTS e registros de jornada, quando houver. A lista exata depende da situação.",
      },
    ],
  },
  {
    slug: "direito-previdenciario",
    nome: "Direito Previdenciário",
    nomeCurto: "Previdenciário",
    icone: "guardaChuva",
    seoTitulo: "Direito Previdenciário em Toledo – PR",
    seoDescricao:
      "Atuação em Direito Previdenciário em Toledo (PR) e Iguatemi (MS): aposentadorias, BPC/LOAS, pensão por morte, salário-maternidade e benefícios por incapacidade junto ao INSS.",
    resumo: "Orientação sobre benefícios do INSS e acompanhamento de pedidos administrativos e judiciais.",
    introducao: [
      "O Direito Previdenciário trata dos benefícios do Regime Geral de Previdência Social, administrado pelo INSS, e do Benefício de Prestação Continuada da assistência social (BPC/LOAS).",
      "A atuação envolve a análise do histórico contributivo, a orientação sobre os requisitos de cada benefício e o acompanhamento de requerimentos no INSS e, quando necessário, na Justiça.",
    ],
    secoes: [
      {
        id: "beneficios",
        titulo: "Benefícios",
        introducao: "Alguns dos benefícios com que o escritório trabalha:",
        topicos: [
          { titulo: "Aposentadoria urbana e rural", texto: "Análise dos requisitos de idade, tempo de contribuição e atividade rural, conforme as regras vigentes e de transição.", icone: "calendario" },
          { titulo: "Aposentadoria especial", texto: "Para quem trabalhou exposto a agentes nocivos à saúde, com comprovação por documentos como o PPP.", icone: "escudo" },
          { titulo: "BPC/LOAS", texto: "Benefício assistencial à pessoa idosa a partir de 65 anos ou à pessoa com deficiência, conforme critérios de renda.", icone: "aperto" },
          { titulo: "Pensão por morte", texto: "Benefício pago aos dependentes do segurado falecido, de acordo com a lei.", icone: "pessoas" },
          { titulo: "Salário-maternidade", texto: "Benefício devido em razão de parto, adoção ou guarda judicial para fins de adoção.", icone: "coracao" },
          { titulo: "Benefícios por incapacidade", texto: "Auxílio por incapacidade temporária (antigo auxílio-doença) e aposentadoria por incapacidade permanente.", icone: "documento" },
        ],
      },
    ],
    perguntas: [
      {
        pergunta: "O INSS negou meu benefício. O que pode ser feito?",
        resposta:
          "É possível apresentar recurso administrativo ao Conselho de Recursos da Previdência Social ou, conforme o caso, buscar a via judicial. A melhor alternativa depende do motivo do indeferimento e dos documentos disponíveis.",
      },
      {
        pergunta: "Como consultar meu histórico de contribuições?",
        resposta:
          "O extrato do CNIS pode ser obtido pelo aplicativo ou site Meu INSS. Ele é o ponto de partida para avaliar qualquer pedido de aposentadoria.",
      },
    ],
  },
];

export const getArea = (slug: AreaSlug) => areas.find((a) => a.slug === slug)!;

export const areaHref = (slug: AreaSlug) => `/areas-de-atuacao/${slug}`;
