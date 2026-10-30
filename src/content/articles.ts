import type { AreaSlug } from "@/config/site";

/**
 * Artigos informativos.
 *
 * Antes de publicar: cada texto deve ser revisado e aprovado pelo(a) advogado(a)
 * responsável pela área (campo `revisadoPor`). Enquanto `revisadoPor` for `null`,
 * o artigo é assinado institucionalmente pelo escritório.
 *
 * Para adicionar um artigo, inclua um novo objeto nesta lista: a página,
 * o sitemap, os dados estruturados e os links internos são gerados automaticamente.
 */

export type Bloco =
  | { tipo: "p"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "nota"; texto: string };

export type Artigo = {
  slug: string;
  titulo: string;
  /** Meta description: até ~155 caracteres. */
  descricao: string;
  resumo: string;
  area: AreaSlug;
  /** ISO 8601 (AAAA-MM-DD). */
  publicadoEm: string;
  atualizadoEm: string;
  /** Slug do integrante da equipe que revisou o texto. Pendente até a revisão. */
  revisadoPor: string | null;
  palavrasChave: string[];
  secoes: { titulo: string; blocos: Bloco[] }[];
  referencias: string[];
};

export const artigos: Artigo[] = [
  {
    slug: "audiencia-de-custodia-o-que-e-e-como-funciona",
    titulo: "Audiência de custódia: o que é e como funciona",
    descricao:
      "Entenda o que é a audiência de custódia, quando ela acontece, quem participa e quais decisões o juiz pode tomar após uma prisão em flagrante.",
    resumo: "O que acontece nas primeiras horas após uma prisão em flagrante e quais decisões o juiz pode tomar.",
    area: "direito-criminal-e-penal",
    publicadoEm: "2026-10-28",
    atualizadoEm: "2026-10-28",
    revisadoPor: "erminio",
    palavrasChave: ["audiência de custódia", "prisão em flagrante", "liberdade provisória", "advogado criminalista Toledo"],
    secoes: [
      {
        titulo: "O que é a audiência de custódia",
        blocos: [
          {
            tipo: "p",
            texto:
              "A audiência de custódia é o ato em que a pessoa presa é apresentada a um juiz para que ele avalie a prisão. Ela foi regulamentada pelo Conselho Nacional de Justiça na Resolução nº 213/2015 e, desde a Lei nº 13.964/2019, está prevista expressamente no art. 310 do Código de Processo Penal.",
          },
          {
            tipo: "p",
            texto:
              "Pela lei, a audiência deve ocorrer em até 24 horas após o recebimento do auto de prisão em flagrante, com a presença do acusado, de seu advogado constituído ou da Defensoria Pública e do Ministério Público.",
          },
        ],
      },
      {
        titulo: "O que o juiz analisa",
        blocos: [
          {
            tipo: "p",
            texto:
              "A audiência de custódia não julga se a pessoa é culpada ou inocente. O juiz examina a legalidade da prisão e a necessidade de mantê-la, além de verificar se houve maus-tratos ou outras irregularidades.",
          },
        ],
      },
      {
        titulo: "Quais decisões podem ser tomadas",
        blocos: [
          { tipo: "p", texto: "De acordo com o art. 310 do Código de Processo Penal, o juiz deve, de forma fundamentada:" },
          {
            tipo: "lista",
            itens: [
              "relaxar a prisão, quando ela for ilegal;",
              "converter a prisão em flagrante em prisão preventiva, quando presentes os requisitos legais e quando as medidas cautelares diversas da prisão forem insuficientes;",
              "conceder liberdade provisória, com ou sem fiança, podendo impor medidas cautelares como comparecimento periódico em juízo ou proibição de se ausentar da comarca.",
            ],
          },
        ],
      },
      {
        titulo: "Qual é o papel da defesa",
        blocos: [
          {
            tipo: "p",
            texto:
              "A defesa técnica pode conversar reservadamente com a pessoa presa antes da audiência, apontar ilegalidades e apresentar argumentos e documentos sobre as condições pessoais do custodiado, como residência fixa e ocupação lícita, que são relevantes para a decisão.",
          },
          {
            tipo: "nota",
            texto:
              "Cada situação tem particularidades. Este texto é informativo e não substitui a análise individual do caso por um advogado.",
          },
        ],
      },
    ],
    referencias: [
      "Código de Processo Penal, art. 310 (redação da Lei nº 13.964/2019)",
      "Resolução CNJ nº 213/2015",
      "Constituição Federal, art. 5º, LXII a LXVI",
    ],
  },
  {
    slug: "direitos-da-pessoa-presa-em-flagrante",
    titulo: "Direitos da pessoa presa em flagrante",
    descricao:
      "Conheça os direitos garantidos pela Constituição à pessoa presa em flagrante: comunicação da prisão, direito ao silêncio e assistência de advogado.",
    resumo: "As garantias constitucionais que se aplicam desde o momento da prisão.",
    area: "direito-criminal-e-penal",
    publicadoEm: "2026-10-28",
    atualizadoEm: "2026-10-28",
    revisadoPor: "erminio",
    palavrasChave: ["prisão em flagrante", "direitos do preso", "direito ao silêncio", "advogado criminal Toledo PR"],
    secoes: [
      {
        titulo: "Quando a prisão em flagrante é possível",
        blocos: [
          {
            tipo: "p",
            texto:
              "O art. 302 do Código de Processo Penal considera em flagrante quem está cometendo a infração, quem acaba de cometê-la, quem é perseguido logo após em situação que faça presumir ser o autor, ou quem é encontrado logo depois com instrumentos, armas ou objetos que façam presumir a autoria.",
          },
        ],
      },
      {
        titulo: "Garantias previstas na Constituição",
        blocos: [
          { tipo: "p", texto: "O art. 5º da Constituição Federal assegura à pessoa presa, entre outros direitos:" },
          {
            tipo: "lista",
            itens: [
              "a comunicação imediata da prisão e do local onde se encontra ao juiz competente e à família ou pessoa por ela indicada (inciso LXII);",
              "a informação sobre seus direitos, entre os quais o de permanecer calada, e a assistência da família e de advogado (inciso LXIII);",
              "a identificação dos responsáveis por sua prisão ou por seu interrogatório policial (inciso LXIV);",
              "o relaxamento imediato da prisão ilegal pela autoridade judiciária (inciso LXV).",
            ],
          },
        ],
      },
      {
        titulo: "O que acontece depois",
        blocos: [
          {
            tipo: "p",
            texto:
              "Lavrado o auto de prisão em flagrante, ele é encaminhado ao juiz, e a pessoa presa deve ser apresentada em audiência de custódia. Nela, o juiz decide se a prisão será relaxada, convertida em preventiva ou substituída por liberdade provisória.",
          },
          {
            tipo: "nota",
            texto: "Conteúdo de caráter informativo. A orientação adequada depende da análise das circunstâncias de cada caso.",
          },
        ],
      },
    ],
    referencias: ["Constituição Federal, art. 5º, LXI a LXVI", "Código de Processo Penal, arts. 302, 304 e 310"],
  },
  {
    slug: "horas-extras-o-que-diz-a-clt",
    titulo: "Horas extras: o que diz a CLT",
    descricao:
      "Limite diário, adicional mínimo e banco de horas: entenda as regras gerais da CLT e da Constituição sobre a jornada extraordinária.",
    resumo: "Limite diário, adicional mínimo e banco de horas nas regras gerais da legislação trabalhista.",
    area: "direito-trabalhista",
    publicadoEm: "2026-10-28",
    atualizadoEm: "2026-10-28",
    revisadoPor: "gustavo",
    palavrasChave: ["horas extras", "CLT", "banco de horas", "advogado trabalhista Toledo"],
    secoes: [
      {
        titulo: "Jornada normal de trabalho",
        blocos: [
          {
            tipo: "p",
            texto:
              "A Constituição Federal (art. 7º, XIII) fixa a duração normal do trabalho em até oito horas diárias e 44 horas semanais, facultada a compensação de horários e a redução da jornada mediante acordo ou convenção coletiva.",
          },
        ],
      },
      {
        titulo: "Limite e adicional",
        blocos: [
          {
            tipo: "p",
            texto:
              "Pelo art. 59 da CLT, a jornada pode ser acrescida de horas extras em número não excedente de duas por dia, por acordo individual, convenção ou acordo coletivo.",
          },
          {
            tipo: "p",
            texto:
              "A remuneração da hora extra deve ser, no mínimo, 50% superior à da hora normal (CF, art. 7º, XVI). Convenções e acordos coletivos podem prever percentuais maiores.",
          },
        ],
      },
      {
        titulo: "Banco de horas",
        blocos: [
          { tipo: "p", texto: "A CLT permite que as horas extras sejam compensadas em vez de pagas, observadas as seguintes regras gerais:" },
          {
            tipo: "lista",
            itens: [
              "por acordo ou convenção coletiva, a compensação deve ocorrer em até um ano (art. 59, § 2º);",
              "por acordo individual escrito, a compensação deve ocorrer em até seis meses (art. 59, § 5º);",
              "havendo rescisão sem a compensação integral, as horas não compensadas devem ser pagas (art. 59, § 3º).",
            ],
          },
        ],
      },
      {
        titulo: "Registro de jornada",
        blocos: [
          {
            tipo: "p",
            texto:
              "Estabelecimentos com mais de 20 trabalhadores devem registrar os horários de entrada e saída (art. 74, § 2º, da CLT). Esses registros costumam ser a principal prova em discussões sobre horas extras.",
          },
          {
            tipo: "nota",
            texto:
              "Há regras específicas para determinadas categorias e regimes, como teletrabalho e escala 12x36. Consulte um advogado para avaliar a sua situação.",
          },
        ],
      },
    ],
    referencias: ["Constituição Federal, art. 7º, XIII e XVI", "CLT, arts. 59 e 74"],
  },
  {
    slug: "verbas-rescisorias-dispensa-sem-justa-causa",
    titulo: "Verbas rescisórias na dispensa sem justa causa",
    descricao:
      "Saldo de salário, aviso prévio, férias, 13º e FGTS: entenda o que é devido no fim do contrato sem justa causa e qual é o prazo de pagamento.",
    resumo: "O que é devido quando o contrato termina por iniciativa do empregador e qual é o prazo para o pagamento.",
    area: "direito-trabalhista",
    publicadoEm: "2026-10-29",
    atualizadoEm: "2026-10-29",
    revisadoPor: "gustavo",
    palavrasChave: ["verbas rescisórias", "dispensa sem justa causa", "aviso prévio", "multa do FGTS", "advogado trabalhista Toledo"],
    secoes: [
      {
        titulo: "O que é devido",
        blocos: [
          { tipo: "p", texto: "Na dispensa sem justa causa, as verbas rescisórias incluem, como regra geral:" },
          {
            tipo: "lista",
            itens: [
              "saldo de salário pelos dias trabalhados no mês da rescisão;",
              "aviso prévio, trabalhado ou indenizado;",
              "13º salário proporcional aos meses trabalhados no ano;",
              "férias vencidas, se houver, e férias proporcionais, sempre acrescidas de um terço (CF, art. 7º, XVII);",
              "depósito do FGTS do mês da rescisão e indenização de 40% sobre o saldo da conta vinculada (Lei nº 8.036/1990, art. 18, § 1º).",
            ],
          },
        ],
      },
      {
        titulo: "Aviso prévio proporcional",
        blocos: [
          {
            tipo: "p",
            texto:
              "O aviso prévio é de 30 dias para quem tem até um ano de serviço na mesma empresa. A Lei nº 12.506/2011 acrescenta três dias por ano completo de serviço, até o máximo de 90 dias.",
          },
        ],
      },
      {
        titulo: "Prazo para pagamento",
        blocos: [
          {
            tipo: "p",
            texto:
              "A entrega dos documentos da rescisão e o pagamento das verbas devem ocorrer em até dez dias contados do término do contrato (CLT, art. 477, § 6º). O atraso sujeita o empregador a multa em favor do empregado no valor de um salário, salvo quando o próprio trabalhador der causa à mora (art. 477, § 8º).",
          },
        ],
      },
      {
        titulo: "FGTS e seguro-desemprego",
        blocos: [
          {
            tipo: "p",
            texto:
              "A dispensa sem justa causa permite o saque do saldo do FGTS (Lei nº 8.036/1990, art. 20, I). O seguro-desemprego depende do cumprimento dos requisitos da Lei nº 7.998/1990, como o tempo mínimo de trabalho exigido para cada solicitação.",
          },
        ],
      },
      {
        titulo: "Rescisão por acordo",
        blocos: [
          {
            tipo: "p",
            texto:
              "Desde a Lei nº 13.467/2017, empregado e empregador podem encerrar o contrato por acordo (CLT, art. 484-A). Nesse caso, o aviso prévio indenizado e a indenização sobre o FGTS são pagos pela metade, as demais verbas são devidas integralmente, é possível movimentar até 80% do saldo do FGTS e não há direito ao seguro-desemprego.",
          },
          {
            tipo: "nota",
            texto:
              "Convenções coletivas podem prever direitos adicionais, e o cálculo depende do histórico de cada contrato. Este conteúdo é informativo e não substitui a análise individual do caso.",
          },
        ],
      },
    ],
    referencias: [
      "Constituição Federal, art. 7º, XVII e XXI",
      "CLT, arts. 477 e 484-A",
      "Lei nº 12.506/2011 (aviso prévio proporcional)",
      "Lei nº 8.036/1990 (FGTS), arts. 18 e 20",
      "Lei nº 7.998/1990 (seguro-desemprego)",
    ],
  },
  {
    slug: "bpc-loas-quem-tem-direito",
    titulo: "BPC/LOAS: quem tem direito ao benefício",
    descricao:
      "Saiba quem pode receber o Benefício de Prestação Continuada (BPC/LOAS), quais são os critérios de renda e as principais regras do benefício.",
    resumo: "Requisitos, critério de renda e características do benefício assistencial previsto na LOAS.",
    area: "direito-previdenciario",
    publicadoEm: "2026-10-28",
    atualizadoEm: "2026-10-28",
    revisadoPor: "amanda",
    palavrasChave: ["BPC", "LOAS", "benefício assistencial", "INSS", "advogada previdenciária Toledo"],
    secoes: [
      {
        titulo: "O que é o BPC",
        blocos: [
          {
            tipo: "p",
            texto:
              "O Benefício de Prestação Continuada (BPC), previsto na Lei Orgânica da Assistência Social (Lei nº 8.742/1993), garante um salário mínimo mensal à pessoa idosa ou à pessoa com deficiência que comprove não possuir meios de prover a própria manutenção nem de tê-la provida por sua família.",
          },
          {
            tipo: "p",
            texto:
              "Por ser um benefício assistencial, não exige contribuições ao INSS, embora o requerimento seja feito ao próprio INSS.",
          },
        ],
      },
      {
        titulo: "Quem pode receber",
        blocos: [
          {
            tipo: "lista",
            itens: [
              "pessoa idosa com 65 anos ou mais;",
              "pessoa com deficiência de qualquer idade, entendida como aquela com impedimento de longo prazo, de natureza física, mental, intelectual ou sensorial, avaliado por perícia médica e social.",
            ],
          },
        ],
      },
      {
        titulo: "Critério de renda e cadastro",
        blocos: [
          {
            tipo: "p",
            texto:
              "Como regra, a renda familiar mensal por pessoa deve ser igual ou inferior a 1/4 do salário mínimo (art. 20, § 3º, da Lei nº 8.742/1993). A lei prevê situações em que outros elementos podem ser considerados na avaliação da condição de vulnerabilidade.",
          },
          {
            tipo: "p",
            texto:
              "É necessária a inscrição do requerente e de sua família no Cadastro Único para Programas Sociais (CadÚnico), com os dados atualizados.",
          },
        ],
      },
      {
        titulo: "Características do benefício",
        blocos: [
          {
            tipo: "lista",
            itens: [
              "não há pagamento de 13º salário;",
              "o benefício não gera pensão por morte aos dependentes;",
              "o benefício deve ser revisto periodicamente para avaliar a continuidade das condições que lhe deram origem (art. 21).",
            ],
          },
          {
            tipo: "nota",
            texto:
              "As regras de cálculo de renda e de avaliação da deficiência têm detalhes que variam conforme o caso. Este conteúdo é informativo.",
          },
        ],
      },
    ],
    referencias: ["Lei nº 8.742/1993 (LOAS), arts. 20 e 21", "Constituição Federal, art. 203, V"],
  },
  {
    slug: "aposentadoria-rural-por-idade-requisitos",
    titulo: "Aposentadoria rural por idade: requisitos",
    descricao:
      "Idade mínima, tempo de atividade rural e documentos: entenda as regras gerais da aposentadoria por idade do trabalhador rural e do segurado especial.",
    resumo: "Idade mínima, comprovação da atividade no campo e os documentos que costumam ser usados como prova.",
    area: "direito-previdenciario",
    publicadoEm: "2026-10-29",
    atualizadoEm: "2026-10-29",
    revisadoPor: "amanda",
    palavrasChave: ["aposentadoria rural", "segurado especial", "trabalhador rural", "INSS", "advogada previdenciária Toledo"],
    secoes: [
      {
        titulo: "Idade mínima",
        blocos: [
          {
            tipo: "p",
            texto:
              "O trabalhador rural tem direito à aposentadoria por idade com cinco anos a menos que o trabalhador urbano: 60 anos para homens e 55 anos para mulheres (CF, art. 201, § 7º, II, e Lei nº 8.213/1991, art. 48, § 1º).",
          },
        ],
      },
      {
        titulo: "Quem é segurado especial",
        blocos: [
          {
            tipo: "p",
            texto:
              "A Lei nº 8.213/1991 (art. 11, VII) considera segurado especial, entre outros, o produtor rural, parceiro, meeiro ou arrendatário que explora atividade agropecuária em área de até quatro módulos fiscais, individualmente ou em regime de economia familiar, além do pescador artesanal. O cônjuge e os filhos que trabalham com o grupo familiar também podem ser segurados especiais.",
          },
        ],
      },
      {
        titulo: "Tempo de atividade rural",
        blocos: [
          {
            tipo: "p",
            texto:
              "O segurado especial não precisa comprovar contribuições mensais. Ele deve demonstrar o exercício de atividade rural, ainda que de forma descontínua, no período imediatamente anterior ao requerimento ou ao cumprimento da idade, por tempo igual à carência do benefício, que é de 180 meses (arts. 25, II, 39, I, e 48, § 2º). Nesse caso, o valor da aposentadoria é de um salário mínimo.",
          },
        ],
      },
      {
        titulo: "Como comprovar",
        blocos: [
          {
            tipo: "p",
            texto:
              "A lei exige início de prova material: a prova exclusivamente testemunhal não basta (Lei nº 8.213/1991, art. 55, § 3º, e Súmula 149 do STJ). Entre os documentos que costumam ser usados estão:",
          },
          {
            tipo: "lista",
            itens: [
              "contratos de arrendamento, parceria ou comodato rural;",
              "bloco de notas do produtor rural e notas fiscais de venda da produção;",
              "documentos do imóvel rural, como escritura ou certificado de cadastro (CCIR);",
              "registros civis e escolares em que conste a profissão de lavrador ou agricultor;",
              "autodeclaração do segurado especial, que é confrontada com as bases de dados do governo (art. 38-B).",
            ],
          },
        ],
      },
      {
        titulo: "Quem trabalhou no campo e na cidade",
        blocos: [
          {
            tipo: "p",
            texto:
              "Quem não reúne tempo rural suficiente pode ter direito à aposentadoria por idade híbrida, que soma períodos de atividade rural e urbana (art. 48, § 3º), com idade mínima diferente da aposentadoria rural.",
          },
          {
            tipo: "nota",
            texto:
              "A análise dos documentos e do período a ser comprovado varia conforme a história de trabalho de cada pessoa. Este conteúdo é informativo e não substitui a orientação individual.",
          },
        ],
      },
    ],
    referencias: [
      "Constituição Federal, art. 201, § 7º, II",
      "Lei nº 8.213/1991, arts. 11, VII, 25, 38-B, 39, 48 e 55, § 3º",
      "Súmula 149 do Superior Tribunal de Justiça",
    ],
  },
];

export const getArtigo = (slug: string) => artigos.find((a) => a.slug === slug);

export const artigosPorArea = (area: AreaSlug) => artigos.filter((a) => a.area === area);

export const artigosOrdenados = () => [...artigos].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));

export const artigoHref = (slug: string) => `/artigos/${slug}`;

export const tempoDeLeitura = (a: Artigo) => {
  const texto = a.secoes
    .flatMap((s) => [s.titulo, ...s.blocos.flatMap((b) => (b.tipo === "lista" ? b.itens : [b.texto]))])
    .join(" ");
  return Math.max(1, Math.round(texto.split(/\s+/).length / 200));
};

export const formatarData = (iso: string) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dia} de ${meses[mes - 1]} de ${ano}`;
};
