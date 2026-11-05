-- Importação dos 8 artigos que estavam em src/content/articles.ts.
-- Gerado por scripts/gerar-importacao-artigos.mjs; não edite à mão.
-- Os artigos entram publicados e marcados como já no ar (revisão 1), sem disparar atualização do site.
-- Rodar de novo não duplica: slugs já existentes são ignorados.

select set_config('cms.importacao', 'on', false);

insert into public.artigos (
  slug, titulo, descricao, resumo, area, publicado_em, atualizado_em, assinantes, palavras_chave,
  secoes, referencias, status, revisao_no_ar, no_ar_em, conformidade_confirmada_em
)
select
  x.slug, x.titulo, x.descricao, x.resumo, x.area, x.publicado_em, x.atualizado_em,
  array(select jsonb_array_elements_text(x.assinantes)),
  array(select jsonb_array_elements_text(x.palavras_chave)),
  x.secoes,
  array(select jsonb_array_elements_text(x.referencias)),
  'publicado', 1, now(), now()
from jsonb_to_recordset($artigos$[
  {
    "slug": "audiencia-de-custodia-o-que-e-e-como-funciona",
    "titulo": "Audiência de custódia: o que é e como funciona",
    "descricao": "Entenda o que é a audiência de custódia, quando ela acontece, quem participa e quais decisões o juiz pode tomar após uma prisão em flagrante.",
    "resumo": "O que acontece nas primeiras horas após uma prisão em flagrante e quais decisões o juiz pode tomar.",
    "area": "direito-criminal-e-penal",
    "publicado_em": "2026-10-28",
    "atualizado_em": "2026-10-28",
    "assinantes": [
      "erminio"
    ],
    "palavras_chave": [
      "audiência de custódia",
      "prisão em flagrante",
      "liberdade provisória",
      "advogado criminalista Toledo"
    ],
    "secoes": [
      {
        "titulo": "O que é a audiência de custódia",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A audiência de custódia é o ato em que a pessoa presa é apresentada a um juiz para que ele avalie a prisão. Ela foi regulamentada pelo Conselho Nacional de Justiça na Resolução nº 213/2015 e, desde a Lei nº 13.964/2019, está prevista expressamente no art. 310 do Código de Processo Penal."
          },
          {
            "tipo": "p",
            "texto": "Pela lei, a audiência deve ocorrer em até 24 horas após o recebimento do auto de prisão em flagrante, com a presença do acusado, de seu advogado constituído ou da Defensoria Pública e do Ministério Público."
          }
        ]
      },
      {
        "titulo": "O que o juiz analisa",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A audiência de custódia não julga se a pessoa é culpada ou inocente. O juiz examina a legalidade da prisão e a necessidade de mantê-la, além de verificar se houve maus-tratos ou outras irregularidades."
          }
        ]
      },
      {
        "titulo": "Quais decisões podem ser tomadas",
        "blocos": [
          {
            "tipo": "p",
            "texto": "De acordo com o art. 310 do Código de Processo Penal, o juiz deve, de forma fundamentada:"
          },
          {
            "tipo": "lista",
            "itens": [
              "relaxar a prisão, quando ela for ilegal;",
              "converter a prisão em flagrante em prisão preventiva, quando presentes os requisitos legais e quando as medidas cautelares diversas da prisão forem insuficientes;",
              "conceder liberdade provisória, com ou sem fiança, podendo impor medidas cautelares como comparecimento periódico em juízo ou proibição de se ausentar da comarca."
            ]
          }
        ]
      },
      {
        "titulo": "Qual é o papel da defesa",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A defesa técnica pode conversar reservadamente com a pessoa presa antes da audiência, apontar ilegalidades e apresentar argumentos e documentos sobre as condições pessoais do custodiado, como residência fixa e ocupação lícita, que são relevantes para a decisão."
          },
          {
            "tipo": "nota",
            "texto": "Cada situação tem particularidades. Este texto é informativo e não substitui a análise individual do caso por um advogado."
          }
        ]
      }
    ],
    "referencias": [
      "Código de Processo Penal, art. 310 (redação da Lei nº 13.964/2019)",
      "Resolução CNJ nº 213/2015",
      "Constituição Federal, art. 5º, LXII a LXVI"
    ]
  },
  {
    "slug": "direitos-da-pessoa-presa-em-flagrante",
    "titulo": "Direitos da pessoa presa em flagrante",
    "descricao": "Conheça os direitos garantidos pela Constituição à pessoa presa em flagrante: comunicação da prisão, direito ao silêncio e assistência de advogado.",
    "resumo": "As garantias constitucionais que se aplicam desde o momento da prisão.",
    "area": "direito-criminal-e-penal",
    "publicado_em": "2026-10-28",
    "atualizado_em": "2026-10-28",
    "assinantes": [
      "erminio"
    ],
    "palavras_chave": [
      "prisão em flagrante",
      "direitos do preso",
      "direito ao silêncio",
      "advogado criminal Toledo PR"
    ],
    "secoes": [
      {
        "titulo": "Quando a prisão em flagrante é possível",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O art. 302 do Código de Processo Penal considera em flagrante quem está cometendo a infração, quem acaba de cometê-la, quem é perseguido logo após em situação que faça presumir ser o autor, ou quem é encontrado logo depois com instrumentos, armas ou objetos que façam presumir a autoria."
          }
        ]
      },
      {
        "titulo": "Garantias previstas na Constituição",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O art. 5º da Constituição Federal assegura à pessoa presa, entre outros direitos:"
          },
          {
            "tipo": "lista",
            "itens": [
              "a comunicação imediata da prisão e do local onde se encontra ao juiz competente e à família ou pessoa por ela indicada (inciso LXII);",
              "a informação sobre seus direitos, entre os quais o de permanecer calada, e a assistência da família e de advogado (inciso LXIII);",
              "a identificação dos responsáveis por sua prisão ou por seu interrogatório policial (inciso LXIV);",
              "o relaxamento imediato da prisão ilegal pela autoridade judiciária (inciso LXV)."
            ]
          }
        ]
      },
      {
        "titulo": "O que acontece depois",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Lavrado o auto de prisão em flagrante, ele é encaminhado ao juiz, e a pessoa presa deve ser apresentada em audiência de custódia. Nela, o juiz decide se a prisão será relaxada, convertida em preventiva ou substituída por liberdade provisória."
          },
          {
            "tipo": "nota",
            "texto": "Conteúdo de caráter informativo. A orientação adequada depende da análise das circunstâncias de cada caso."
          }
        ]
      }
    ],
    "referencias": [
      "Constituição Federal, art. 5º, LXI a LXVI",
      "Código de Processo Penal, arts. 302, 304 e 310"
    ]
  },
  {
    "slug": "horas-extras-o-que-diz-a-clt",
    "titulo": "Horas extras: o que diz a CLT",
    "descricao": "Limite diário, adicional mínimo e banco de horas: entenda as regras gerais da CLT e da Constituição sobre a jornada extraordinária.",
    "resumo": "Limite diário, adicional mínimo e banco de horas nas regras gerais da legislação trabalhista.",
    "area": "direito-trabalhista",
    "publicado_em": "2026-10-28",
    "atualizado_em": "2026-10-28",
    "assinantes": [
      "gustavo"
    ],
    "palavras_chave": [
      "horas extras",
      "CLT",
      "banco de horas",
      "advogado trabalhista Toledo"
    ],
    "secoes": [
      {
        "titulo": "Jornada normal de trabalho",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A Constituição Federal (art. 7º, XIII) fixa a duração normal do trabalho em até oito horas diárias e 44 horas semanais, facultada a compensação de horários e a redução da jornada mediante acordo ou convenção coletiva."
          }
        ]
      },
      {
        "titulo": "Limite e adicional",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Pelo art. 59 da CLT, a jornada pode ser acrescida de horas extras em número não excedente de duas por dia, por acordo individual, convenção ou acordo coletivo."
          },
          {
            "tipo": "p",
            "texto": "A remuneração da hora extra deve ser, no mínimo, 50% superior à da hora normal (CF, art. 7º, XVI). Convenções e acordos coletivos podem prever percentuais maiores."
          }
        ]
      },
      {
        "titulo": "Banco de horas",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A CLT permite que as horas extras sejam compensadas em vez de pagas, observadas as seguintes regras gerais:"
          },
          {
            "tipo": "lista",
            "itens": [
              "por acordo ou convenção coletiva, a compensação deve ocorrer em até um ano (art. 59, § 2º);",
              "por acordo individual escrito, a compensação deve ocorrer em até seis meses (art. 59, § 5º);",
              "havendo rescisão sem a compensação integral, as horas não compensadas devem ser pagas (art. 59, § 3º)."
            ]
          }
        ]
      },
      {
        "titulo": "Registro de jornada",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Estabelecimentos com mais de 20 trabalhadores devem registrar os horários de entrada e saída (art. 74, § 2º, da CLT). Esses registros costumam ser a principal prova em discussões sobre horas extras."
          },
          {
            "tipo": "nota",
            "texto": "Há regras específicas para determinadas categorias e regimes, como teletrabalho e escala 12x36. Consulte um advogado para avaliar a sua situação."
          }
        ]
      }
    ],
    "referencias": [
      "Constituição Federal, art. 7º, XIII e XVI",
      "CLT, arts. 59 e 74"
    ]
  },
  {
    "slug": "verbas-rescisorias-dispensa-sem-justa-causa",
    "titulo": "Verbas rescisórias na dispensa sem justa causa",
    "descricao": "Saldo de salário, aviso prévio, férias, 13º e FGTS: entenda o que é devido no fim do contrato sem justa causa e qual é o prazo de pagamento.",
    "resumo": "O que é devido quando o contrato termina por iniciativa do empregador e qual é o prazo para o pagamento.",
    "area": "direito-trabalhista",
    "publicado_em": "2026-10-29",
    "atualizado_em": "2026-10-29",
    "assinantes": [
      "gustavo"
    ],
    "palavras_chave": [
      "verbas rescisórias",
      "dispensa sem justa causa",
      "aviso prévio",
      "multa do FGTS",
      "advogado trabalhista Toledo"
    ],
    "secoes": [
      {
        "titulo": "O que é devido",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Na dispensa sem justa causa, as verbas rescisórias incluem, como regra geral:"
          },
          {
            "tipo": "lista",
            "itens": [
              "saldo de salário pelos dias trabalhados no mês da rescisão;",
              "aviso prévio, trabalhado ou indenizado;",
              "13º salário proporcional aos meses trabalhados no ano;",
              "férias vencidas, se houver, e férias proporcionais, sempre acrescidas de um terço (CF, art. 7º, XVII);",
              "depósito do FGTS do mês da rescisão e indenização de 40% sobre o saldo da conta vinculada (Lei nº 8.036/1990, art. 18, § 1º)."
            ]
          }
        ]
      },
      {
        "titulo": "Aviso prévio proporcional",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O aviso prévio é de 30 dias para quem tem até um ano de serviço na mesma empresa. A Lei nº 12.506/2011 acrescenta três dias por ano completo de serviço, até o máximo de 90 dias."
          }
        ]
      },
      {
        "titulo": "Prazo para pagamento",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A entrega dos documentos da rescisão e o pagamento das verbas devem ocorrer em até dez dias contados do término do contrato (CLT, art. 477, § 6º). O atraso sujeita o empregador a multa em favor do empregado no valor de um salário, salvo quando o próprio trabalhador der causa à mora (art. 477, § 8º)."
          }
        ]
      },
      {
        "titulo": "FGTS e seguro-desemprego",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A dispensa sem justa causa permite o saque do saldo do FGTS (Lei nº 8.036/1990, art. 20, I). O seguro-desemprego depende do cumprimento dos requisitos da Lei nº 7.998/1990, como o tempo mínimo de trabalho exigido para cada solicitação."
          }
        ]
      },
      {
        "titulo": "Rescisão por acordo",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Desde a Lei nº 13.467/2017, empregado e empregador podem encerrar o contrato por acordo (CLT, art. 484-A). Nesse caso, o aviso prévio indenizado e a indenização sobre o FGTS são pagos pela metade, as demais verbas são devidas integralmente, é possível movimentar até 80% do saldo do FGTS e não há direito ao seguro-desemprego."
          },
          {
            "tipo": "nota",
            "texto": "Convenções coletivas podem prever direitos adicionais, e o cálculo depende do histórico de cada contrato. Este conteúdo é informativo e não substitui a análise individual do caso."
          }
        ]
      }
    ],
    "referencias": [
      "Constituição Federal, art. 7º, XVII e XXI",
      "CLT, arts. 477 e 484-A",
      "Lei nº 12.506/2011 (aviso prévio proporcional)",
      "Lei nº 8.036/1990 (FGTS), arts. 18 e 20",
      "Lei nº 7.998/1990 (seguro-desemprego)"
    ]
  },
  {
    "slug": "bpc-loas-quem-tem-direito",
    "titulo": "BPC/LOAS: quem tem direito ao benefício",
    "descricao": "Saiba quem pode receber o Benefício de Prestação Continuada (BPC/LOAS), quais são os critérios de renda e as principais regras do benefício.",
    "resumo": "Requisitos, critério de renda e características do benefício assistencial previsto na LOAS.",
    "area": "direito-previdenciario",
    "publicado_em": "2026-10-28",
    "atualizado_em": "2026-10-28",
    "assinantes": [
      "amanda"
    ],
    "palavras_chave": [
      "BPC",
      "LOAS",
      "benefício assistencial",
      "INSS",
      "advogada previdenciária Toledo"
    ],
    "secoes": [
      {
        "titulo": "O que é o BPC",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O Benefício de Prestação Continuada (BPC), previsto na Lei Orgânica da Assistência Social (Lei nº 8.742/1993), garante um salário mínimo mensal à pessoa idosa ou à pessoa com deficiência que comprove não possuir meios de prover a própria manutenção nem de tê-la provida por sua família."
          },
          {
            "tipo": "p",
            "texto": "Por ser um benefício assistencial, não exige contribuições ao INSS, embora o requerimento seja feito ao próprio INSS."
          }
        ]
      },
      {
        "titulo": "Quem pode receber",
        "blocos": [
          {
            "tipo": "lista",
            "itens": [
              "pessoa idosa com 65 anos ou mais;",
              "pessoa com deficiência de qualquer idade, entendida como aquela com impedimento de longo prazo, de natureza física, mental, intelectual ou sensorial, avaliado por perícia médica e social."
            ]
          }
        ]
      },
      {
        "titulo": "Critério de renda e cadastro",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Como regra, a renda familiar mensal por pessoa deve ser igual ou inferior a 1/4 do salário mínimo (art. 20, § 3º, da Lei nº 8.742/1993). A lei prevê situações em que outros elementos podem ser considerados na avaliação da condição de vulnerabilidade."
          },
          {
            "tipo": "p",
            "texto": "É necessária a inscrição do requerente e de sua família no Cadastro Único para Programas Sociais (CadÚnico), com os dados atualizados."
          }
        ]
      },
      {
        "titulo": "Características do benefício",
        "blocos": [
          {
            "tipo": "lista",
            "itens": [
              "não há pagamento de 13º salário;",
              "o benefício não gera pensão por morte aos dependentes;",
              "o benefício deve ser revisto periodicamente para avaliar a continuidade das condições que lhe deram origem (art. 21)."
            ]
          },
          {
            "tipo": "nota",
            "texto": "As regras de cálculo de renda e de avaliação da deficiência têm detalhes que variam conforme o caso. Este conteúdo é informativo."
          }
        ]
      }
    ],
    "referencias": [
      "Lei nº 8.742/1993 (LOAS), arts. 20 e 21",
      "Constituição Federal, art. 203, V"
    ]
  },
  {
    "slug": "aposentadoria-rural-por-idade-requisitos",
    "titulo": "Aposentadoria rural por idade: requisitos",
    "descricao": "Idade mínima, tempo de atividade rural e documentos: entenda as regras gerais da aposentadoria por idade do trabalhador rural e do segurado especial.",
    "resumo": "Idade mínima, comprovação da atividade no campo e os documentos que costumam ser usados como prova.",
    "area": "direito-previdenciario",
    "publicado_em": "2026-10-29",
    "atualizado_em": "2026-10-29",
    "assinantes": [
      "amanda"
    ],
    "palavras_chave": [
      "aposentadoria rural",
      "segurado especial",
      "trabalhador rural",
      "INSS",
      "advogada previdenciária Toledo"
    ],
    "secoes": [
      {
        "titulo": "Idade mínima",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O trabalhador rural tem direito à aposentadoria por idade com cinco anos a menos que o trabalhador urbano: 60 anos para homens e 55 anos para mulheres (CF, art. 201, § 7º, II, e Lei nº 8.213/1991, art. 48, § 1º)."
          }
        ]
      },
      {
        "titulo": "Quem é segurado especial",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A Lei nº 8.213/1991 (art. 11, VII) considera segurado especial, entre outros, o produtor rural, parceiro, meeiro ou arrendatário que explora atividade agropecuária em área de até quatro módulos fiscais, individualmente ou em regime de economia familiar, além do pescador artesanal. O cônjuge e os filhos que trabalham com o grupo familiar também podem ser segurados especiais."
          }
        ]
      },
      {
        "titulo": "Tempo de atividade rural",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O segurado especial não precisa comprovar contribuições mensais. Ele deve demonstrar o exercício de atividade rural, ainda que de forma descontínua, no período imediatamente anterior ao requerimento ou ao cumprimento da idade, por tempo igual à carência do benefício, que é de 180 meses (arts. 25, II, 39, I, e 48, § 2º). Nesse caso, o valor da aposentadoria é de um salário mínimo."
          }
        ]
      },
      {
        "titulo": "Como comprovar",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A lei exige início de prova material: a prova exclusivamente testemunhal não basta (Lei nº 8.213/1991, art. 55, § 3º, e Súmula 149 do STJ). Entre os documentos que costumam ser usados estão:"
          },
          {
            "tipo": "lista",
            "itens": [
              "contratos de arrendamento, parceria ou comodato rural;",
              "bloco de notas do produtor rural e notas fiscais de venda da produção;",
              "documentos do imóvel rural, como escritura ou certificado de cadastro (CCIR);",
              "registros civis e escolares em que conste a profissão de lavrador ou agricultor;",
              "autodeclaração do segurado especial, que é confrontada com as bases de dados do governo (art. 38-B)."
            ]
          }
        ]
      },
      {
        "titulo": "Quem trabalhou no campo e na cidade",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Quem não reúne tempo rural suficiente pode ter direito à aposentadoria por idade híbrida, que soma períodos de atividade rural e urbana (art. 48, § 3º), com idade mínima diferente da aposentadoria rural."
          },
          {
            "tipo": "nota",
            "texto": "A análise dos documentos e do período a ser comprovado varia conforme a história de trabalho de cada pessoa. Este conteúdo é informativo e não substitui a orientação individual."
          }
        ]
      }
    ],
    "referencias": [
      "Constituição Federal, art. 201, § 7º, II",
      "Lei nº 8.213/1991, arts. 11, VII, 25, 38-B, 39, 48 e 55, § 3º",
      "Súmula 149 do Superior Tribunal de Justiça"
    ]
  },
  {
    "slug": "inventario-em-cartorio-quando-e-possivel",
    "titulo": "Inventário em cartório: quando é possível e como funciona",
    "descricao": "Entenda quando o inventário pode ser feito em cartório, quais são os requisitos, o prazo para abertura e os documentos que costumam ser pedidos.",
    "resumo": "Requisitos do inventário extrajudicial, prazo de abertura e efeitos da escritura de partilha.",
    "area": "direito-de-familia-e-sucessoes",
    "publicado_em": "2026-11-04",
    "atualizado_em": "2026-11-04",
    "assinantes": [
      "gustavo",
      "erminio",
      "amanda"
    ],
    "palavras_chave": [
      "inventário em cartório",
      "inventário extrajudicial",
      "partilha de bens",
      "herança",
      "advogado de família Toledo"
    ],
    "secoes": [
      {
        "titulo": "O que é o inventário",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O inventário é o procedimento que reúne os bens, os direitos e as dívidas deixados pela pessoa falecida, identifica os herdeiros e define a partilha. Sem ele, os bens continuam em nome do falecido e não podem ser transferidos ou vendidos regularmente."
          },
          {
            "tipo": "p",
            "texto": "Ele pode ser judicial, conduzido por um juiz, ou extrajudicial, feito por escritura pública em cartório de notas. A via extrajudicial foi criada pela Lei nº 11.441/2007 e hoje está prevista no art. 610 do Código de Processo Civil."
          }
        ]
      },
      {
        "titulo": "Quando o inventário pode ser feito em cartório",
        "blocos": [
          {
            "tipo": "lista",
            "itens": [
              "todos os herdeiros estão de acordo com a partilha dos bens;",
              "os interessados estão assistidos por advogado, que também assina a escritura (art. 610, § 2º, do CPC);",
              "o imposto sobre a transmissão (ITCMD) é recolhido antes da lavratura da escritura."
            ]
          },
          {
            "tipo": "p",
            "texto": "Quando há testamento ou herdeiros menores ou incapazes, o Código de Processo Civil prevê, como regra, o inventário judicial. Normas do Conselho Nacional de Justiça admitem a via extrajudicial também nesses casos, em situações específicas e com requisitos próprios, que precisam ser verificados antes de escolher o caminho."
          }
        ]
      },
      {
        "titulo": "Prazo para abrir o inventário",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Pelo art. 611 do CPC, o inventário deve ser aberto em até dois meses a contar do falecimento e concluído nos doze meses seguintes, prazo que pode ser prorrogado. A abertura fora do prazo pode gerar multa sobre o ITCMD, conforme a lei de cada estado."
          }
        ]
      },
      {
        "titulo": "Documentos que costumam ser pedidos",
        "blocos": [
          {
            "tipo": "lista",
            "itens": [
              "certidão de óbito;",
              "documentos pessoais do falecido, do cônjuge ou companheiro e dos herdeiros, com as certidões de casamento ou nascimento;",
              "documentos dos bens, como matrículas atualizadas dos imóveis, documentos de veículos e extratos de contas e aplicações;",
              "certidões negativas de débitos;",
              "comprovante de recolhimento do ITCMD."
            ]
          },
          {
            "tipo": "p",
            "texto": "A lista exata varia conforme o cartório, o estado e os bens envolvidos."
          }
        ]
      },
      {
        "titulo": "O que a escritura permite fazer",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A escritura pública de inventário e partilha é documento suficiente para o registro dos imóveis em nome dos herdeiros, para a transferência de veículos e para o levantamento de valores depositados em bancos (art. 610, § 1º, do CPC), sem necessidade de decisão judicial."
          },
          {
            "tipo": "nota",
            "texto": "Cada inventário tem particularidades, como dívidas, bens em mais de um estado ou herdeiros que moram fora. Este conteúdo é informativo e não substitui a análise do caso."
          }
        ]
      }
    ],
    "referencias": [
      "Código de Processo Civil, arts. 610 e 611",
      "Lei nº 11.441/2007",
      "Resolução CNJ nº 35/2007"
    ]
  },
  {
    "slug": "pensao-alimenticia-como-o-valor-e-definido",
    "titulo": "Pensão alimentícia: como o valor é definido e o que fazer se não for paga",
    "descricao": "Saiba como a pensão alimentícia é calculada, quando pode ser revista e quais medidas a lei prevê quando o pagamento não é feito.",
    "resumo": "Critérios para fixar a pensão, revisão do valor e medidas de cobrança previstas no Código de Processo Civil.",
    "area": "direito-de-familia-e-sucessoes",
    "publicado_em": "2026-11-04",
    "atualizado_em": "2026-11-04",
    "assinantes": [
      "gustavo",
      "erminio",
      "amanda"
    ],
    "palavras_chave": [
      "pensão alimentícia",
      "revisão de pensão",
      "alimentos",
      "cobrança de pensão",
      "advogado de família Toledo"
    ],
    "secoes": [
      {
        "titulo": "Quem pode pedir pensão",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O Código Civil permite que parentes, cônjuges e companheiros peçam uns aos outros os alimentos de que necessitam para viver de modo compatível com a sua condição social (art. 1.694). O caso mais comum é o dos filhos menores, a quem os pais devem sustento."
          },
          {
            "tipo": "p",
            "texto": "Os alimentos não se limitam à comida: incluem despesas com educação, saúde, moradia, vestuário e lazer."
          }
        ]
      },
      {
        "titulo": "Como o valor é definido",
        "blocos": [
          {
            "tipo": "p",
            "texto": "O valor é fixado na proporção das necessidades de quem recebe e dos recursos de quem paga (art. 1.694, § 1º, do Código Civil). A lei não estabelece um percentual fixo: o valor de 30% do salário, muitas vezes citado, não está previsto em lei e depende das circunstâncias de cada caso."
          },
          {
            "tipo": "p",
            "texto": "A pensão pode ser fixada em percentual da remuneração, com desconto direto em folha de pagamento, ou em valor fixo, geralmente vinculado ao salário mínimo."
          }
        ]
      },
      {
        "titulo": "Revisão e fim da pensão",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Se a situação financeira de quem paga ou as necessidades de quem recebe mudarem, é possível pedir a redução, o aumento ou a exoneração da pensão (art. 1.699 do Código Civil). Enquanto não houver nova decisão ou acordo homologado, continua valendo o valor fixado."
          },
          {
            "tipo": "p",
            "texto": "A pensão dos filhos não termina automaticamente aos 18 anos. Segundo a Súmula 358 do STJ, o cancelamento depende de decisão judicial, após o filho ter oportunidade de se manifestar, e a obrigação pode continuar, por exemplo, enquanto ele estiver estudando."
          }
        ]
      },
      {
        "titulo": "Quando a pensão não é paga",
        "blocos": [
          {
            "tipo": "p",
            "texto": "Com a decisão ou o acordo que fixou a pensão, é possível pedir o cumprimento na Justiça. O Código de Processo Civil prevê as seguintes medidas:"
          },
          {
            "tipo": "lista",
            "itens": [
              "intimação do devedor para pagar, provar que pagou ou justificar a impossibilidade em 3 dias (art. 528);",
              "protesto da decisão judicial em cartório (art. 528, § 1º);",
              "prisão civil de 1 a 3 meses, em regime fechado e separado dos presos comuns, em relação às três últimas prestações anteriores ao pedido e às que vencerem no curso do processo (art. 528, §§ 3º, 4º e 7º, e Súmula 309 do STJ);",
              "desconto em folha de pagamento e penhora de bens (arts. 529 e 530)."
            ]
          }
        ]
      },
      {
        "titulo": "Pensão durante a gravidez",
        "blocos": [
          {
            "tipo": "p",
            "texto": "A gestante pode pedir alimentos gravídicos para cobrir despesas da gravidez, como consultas, exames e parto (Lei nº 11.804/2008). Após o nascimento, eles se convertem em pensão alimentícia para a criança, até eventual revisão."
          },
          {
            "tipo": "nota",
            "texto": "O valor e as medidas cabíveis dependem dos documentos e da situação de cada família. Este conteúdo é informativo e não substitui a análise do caso."
          }
        ]
      }
    ],
    "referencias": [
      "Código Civil, arts. 1.694 a 1.699",
      "Código de Processo Civil, arts. 528 a 530",
      "Lei nº 11.804/2008 (alimentos gravídicos)",
      "Súmulas 309 e 358 do Superior Tribunal de Justiça"
    ]
  }
]$artigos$::jsonb) as x(
  slug text, titulo text, descricao text, resumo text, area text, publicado_em date, atualizado_em date,
  assinantes jsonb, palavras_chave jsonb, secoes jsonb, referencias jsonb
)
on conflict (slug) do nothing;

select set_config('cms.importacao', 'off', false);
