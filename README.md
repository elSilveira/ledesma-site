# Ledesma Advocacia — site institucional

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4. Sem dependências além das do projeto base.

## Comandos

```bash
npm install
npm run dev          # desenvolvimento: http://localhost:3000 (mostra os marcadores "Pendente: …")
npm run build        # build de produção
npm start            # servir o build
npm run lint
npm run typecheck    # requer tipos de rota gerados (rode `npx next typegen` ou um build antes)
npm run pendencias   # lista o que falta preencher antes da publicação
```

## Onde editar

| O quê | Arquivo |
| --- | --- |
| Dados do escritório, sedes, equipe, telefones, redes, público trabalhista | `src/config/site.ts` |
| Textos das áreas de atuação | `src/content/areas.ts` |
| Artigos (basta adicionar um objeto; página, sitemap e links internos são gerados) | `src/content/articles.ts` |
| Fontes de notícias (RSS): nome, tipo, local de referência, URL do feed | `src/config/noticias.ts` |
| Leitura dos feeds, classificação por área/tribunal/região | `src/lib/noticias.ts` |
| Cores e tipografia | `src/app/globals.css` (bloco `@theme`) |

Campos `null` em `site.ts` são **pendentes**: não aparecem no site publicado. Em desenvolvimento aparecem como marcadores tracejados.

## Antes de publicar

1. Copie `.env.example` para `.env.local` (ou configure na hospedagem) e defina `NEXT_PUBLIC_SITE_URL` com o domínio definitivo.
   Sem ele, o site gera `robots.txt` bloqueando tudo e metatag `noindex`.
2. Rode `npm run pendencias` e preencha os itens.
3. Defina `publicoTrabalhista` em `site.ts` (`"trabalhadores"`, `"empresas"` ou `"ambos"`): os blocos correspondentes aparecem automaticamente.
4. Peça a cada advogado que revise os artigos da sua área e preencha `revisadoPor` com o slug (`"amanda"`, `"gustavo"`, `"erminio"`).
5. Google Search Console: crie a propriedade do domínio, copie o código da tag HTML para `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, publique e envie `/sitemap.xml`.

## Imagens

Logotipo e fotografias foram obtidos do site oficial atual (ledesma.adv.br). O logotipo foi recolorido para fundo escuro
(louros e balança em marfim, "L" em bordô, "ADVOCACIA" em dourado). Para trocar uma foto, substitua o arquivo em
`public/equipe/` mantendo o nome, ou altere `foto.src` em `site.ts`.

## Notícias

`/noticias` reúne os feeds RSS do STJ, do ConJur e do Migalhas; cada fonte tem sua página (`/noticias/<id>`) e uma aba
na página inicial. Os feeds são lidos no servidor e ficam em cache por 30 minutos (`cacheLife` em `src/lib/noticias.ts`).
Só são exibidos manchete, resumo curto, imagem de destaque, data e link para a matéria original. A imagem vem do
próprio feed ou, quando ele não traz nenhuma (Migalhas), da `og:image` da página da matéria, e é carregada direto do
servidor da fonte. A página `/noticias` mostra 6 notícias e o botão "Carregar mais" acrescenta 6 por vez. Uma fonte fora do ar é omitida, sem
quebrar a página. A classificação por área do escritório, tribunal e menção a PR/MS é automática, feita por palavras-chave.

Em hospedagem serverless, o cache em memória não é compartilhado entre instâncias; nesse caso, considere `use cache: remote`.

A Pesquisa Pronta do STJ (`scon.stj.jus.br/SCON/PesquisaProntaFeed`) responde com uma verificação antirrobô que exige
navegador, por isso aparece como indisponível. Se o STJ liberar o acesso automatizado ao feed, ela passa a aparecer sem alterações no código.

## Prévia no GitHub Pages

`.github/workflows/pages.yml` publica um export estático a cada push na `main` e a cada 30 minutos (para atualizar
as notícias). O Pages não roda servidor Node, então esse build:

- desliga Cache Components e usa só `use cache` (`GITHUB_PAGES=true` em `next.config.ts`);
- remove `src/proxy.ts`, `robots.ts` e `sitemap.ts` (o 404 vem do `404.html`; a prévia fica com `noindex`);
- serve as imagens sem otimização (`src/lib/image-loader.ts`) e prefixa o caminho do repositório (`NEXT_PUBLIC_BASE_PATH`);
- roda `scripts/pages-segmentos.mjs`, que corrige o nome dos arquivos de prefetch gerados pelo export.

O build com servidor (`npm run build && npm start`) continua sendo o recomendado para o domínio definitivo.

## Formulário de contato

O escritório não tem e-mail institucional, e não há servidor de envio. O formulário valida os dados e abre o WhatsApp do advogado da área escolhida
com a mensagem pronta; nada é armazenado pelo site. Para enviar por e-mail, será preciso integrar um serviço de envio.
