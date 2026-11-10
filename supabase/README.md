# Supabase: CMS de artigos

Esta pasta prepara o banco do CMS. **O site público lê os artigos publicados aqui:** antes de cada build,
`scripts/sincronizar-artigos.mjs` baixa e valida os publicados (com a chave pública) e grava
`src/content/artigos-cms.json`, que não vai para o Git. Rascunhos e campos internos nunca entram no site.
Se a sincronização falhar, o build para e a versão que está no ar continua.

| Arquivo | O que faz |
| --- | --- |
| `migrations/20261105120000_cms_estrutura.sql` | Tabelas, validação do conteúdo, revisões, histórico e pedidos de atualização do site |
| `migrations/20261105120100_cms_seguranca.sql` | Permissões (RLS), MFA obrigatório para admin e bucket privado de imagens |
| `migrations/20261105120200_cms_importacao_artigos.sql` | Os 8 artigos atuais, gerados por `scripts/gerar-importacao-artigos.mjs` |
| `migrations/20261105120300_cms_autorizacoes.sql` | Gestão de autorizações: ninguém altera a própria, sempre resta um admin ativo, funções para o painel |

### O que cada artigo guarda

| Campo pedido | Coluna | Observação |
| --- | --- | --- |
| Título, resumo | `titulo`, `resumo` (e `descricao`, para o Google) | texto simples, sem HTML |
| Slug único | `slug` | único; é o endereço `/artigos/<slug>` |
| Conteúdo | `secoes` | blocos `p`, `lista` e `nota`, validados pelo banco |
| Imagem de capa | `imagem_capa` | caminho no bucket privado `artigos` (o painel ainda não envia imagens) |
| Autor | `criado_por` (quem criou no CMS) e `assinantes` (quem assina no site) | `criado_por` é gravado pelo banco e não pode ser alterado |
| Categoria | `area` | uma das 4 áreas de atuação do site |
| Status | `status` | `rascunho`, `publicado` ou `retirado` (saiu do site, continua salvo) |
| Datas | `publicado_em`, `atualizado_em`, `criado_em`, `modificado_em` | as duas primeiras aparecem no site |

### Quem pode o quê (RLS ativo em todas as tabelas)

| | Visitante | Advogado | Administrador (com MFA) |
| --- | --- | --- | --- |
| Ler artigos | só publicados, só campos públicos | todos | todos |
| Criar artigo | não | sim | sim |
| Editar artigo | não | os que criou ou em que assina | todos |
| Excluir artigo | não | rascunho próprio que nunca foi ao ar | todos |
| Gerenciar autorizações | não | não | sim, exceto a própria |
| Imagens | só as de artigos publicados | ver todas; enviar e apagar na própria pasta | igual ao advogado |

Ninguém promove nem desativa a si mesmo, e o último administrador ativo não pode ser removido nem rebaixado.
O admin sem o segundo fator (MFA) não acessa nada.

## 1. Criar o projeto

1. Em [supabase.com](https://supabase.com), crie um projeto. Região sugerida: **South America (São Paulo)**.
2. Guarde a senha do banco num gerenciador de senhas. Ela não vai para o site.

## 2. Aplicar as migrations

**Opção A, pelo painel:** abra **SQL Editor**, cole o conteúdo de cada arquivo de `migrations/` **na ordem do nome**
e clique em **Run**. Um arquivo por vez.

> **Aviso "This query creates tables without enabling Row Level Security":** o detector do SQL Editor pode mostrar
> esse aviso mesmo assim. Nestas migrations, cada tabela liga a RLS e perde os acessos automáticos logo na linha
> seguinte ao `create table`. Se o aviso aparecer, escolha a opção que **ativa a RLS** (ela só repete o que o
> arquivo já faz). Nunca escolha rodar sem RLS.

**Opção B, pela linha de comando:**

```bash
npx supabase login
npx supabase link --project-ref nsekingemfkvfuzwwqcs
npx supabase db push
```

Para conferir, rode no SQL Editor:

```sql
-- RLS: as 6 tabelas devem aparecer com rls_ativa = true e pelo menos uma política
select c.relname as tabela, c.relrowsecurity as rls_ativa,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- Artigos importados
select slug, status, revisao, revisao_no_ar from public.artigos order by publicado_em;
```

O resultado deve ter 8 linhas, todas `publicado`, com revisão 1 e revisão no ar 1. Desde a integração, esses
artigos vêm só do CMS (não há mais cópia no código, então nada duplica e um artigo retirado não reaparece).

> Se `src/content/articles.ts` mudar **antes** de aplicar a importação, gere o arquivo de novo:
> `node scripts/gerar-importacao-artigos.mjs`. Depois de aplicado, não gere mais.

## 3. Configurar o login

Em **Authentication**:

1. **Sign In / Providers → Email:** deixe ativo, **desligue "Allow new users to sign up"** (cadastro só por convite)
   e mantenha **"Confirm email"** ligado.
2. **Sign In / Providers → senhas:** tamanho mínimo de 10 caracteres, exigindo letras e números. Se o plano
   permitir, ligue a proteção contra senhas vazadas.
3. **Multi-Factor → TOTP (aplicativo autenticador):** ative. O banco já exige o segundo fator para o administrador:
   sem ele, a conta admin não acessa nada.
4. **URL Configuration:**
   - Site URL: `https://elsilveira.github.io/ledesma-site/admin/`
   - Redirect URLs: `https://elsilveira.github.io/ledesma-site/admin/**` e `http://localhost:3000/admin/**`

   O `/ledesma-site` precisa estar presente: é o caminho do site no GitHub Pages. Os links de convite e de
   recuperação de senha só voltam para endereços desta lista.
5. **E-mails:** o envio padrão do Supabase tem limite baixo por hora e serve só para testes. Antes de convidar os
   advogados, configure um SMTP próprio em **Project Settings → Authentication → SMTP**. Os textos dos e-mails
   (convite e recuperação de senha) podem ser traduzidos em **Email Templates**.

## 4. Autorizar os usuários

Convidar cria a conta; **autorizar** é o que dá acesso ao CMS. Conta convidada e não autorizada entra, mas não vê nada.

1. **Authentication → Users → Invite user**, com o e-mail de cada pessoa.
2. **Primeiro administrador** (só uma vez, no **SQL Editor**, que roda como dono do banco):

```sql
insert into public.perfis (user_id, integrante, papel)
select id, null, 'admin' from auth.users where email = 'email-do-admin@exemplo.com';
-- Se o admin também for advogado, troque null pelo slug dele (gustavo, erminio ou amanda).
```

3. **Advogados:** pelo mesmo SQL Editor:

```sql
insert into public.perfis (user_id, integrante, papel)
select id, 'gustavo', 'advogado' from auth.users where email = 'email-do-gustavo@exemplo.com';
-- Repita com 'erminio' e 'amanda' e os respectivos e-mails.
```

   Quando o painel `/admin` existir, o administrador fará isso por lá. O painel usa as funções
   `public.autorizar_usuario(email, papel, integrante, ativo)` e `public.listar_autorizacoes()`, que só funcionam
   para um admin logado com MFA e recusam alterar a própria autorização.

4. **Bloquear alguém** sem apagar o histórico:

```sql
update public.perfis set ativo = false
where user_id = (select id from auth.users where email = 'email@exemplo.com');
```

Para conferir as autorizações:

```sql
select u.email, p.papel, p.integrante, p.ativo
from public.perfis p join auth.users u on u.id = p.user_id order by p.papel desc, u.email;
```

## 5. Variáveis

**No computador** (`.env.local`, que não vai para o Git):

```
NEXT_PUBLIC_SUPABASE_URL=https://<id-do-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Onde encontrar (ou pelo botão **Connect**, no topo do painel do projeto):

| Variável | Onde | Formato |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → Data API → Project URL** | `https://<id>.supabase.co`, sem barra no final |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Project Settings → API Keys → Publishable key** | começa com `sb_publishable_` (em projetos antigos: a chave `anon`) |

Os dois valores são públicos por natureza; quem protege os dados é o RLS.
**Nunca** use a chave `service_role`/secreta (`sb_secret_`), a senha do banco ou um token do GitHub numa variável
`NEXT_PUBLIC_`: o build recusa esses valores e para com erro, mostrando só o nome da variável.

Para conferir tudo (conexão, migrations, acesso público e cadastro desligado):

```bash
npm run supabase:verificar
```

**No GitHub** (só serão usadas na etapa de deploy): **Settings → Secrets and variables → Actions → Variables**,
crie `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` com os mesmos valores.

## 6. Conferir o acesso público

Com a chave pública, a API deve devolver só os artigos publicados e só os campos públicos:

```bash
curl "https://<id>.supabase.co/rest/v1/artigos?select=slug,status" -H "apikey: <publishable key>"
```

Pedir um campo interno (por exemplo `select=criado_por`) deve dar erro de permissão.

## Como o modelo funciona

- **Status:** `rascunho` (só no CMS), `publicado` (deve estar no site) e `retirado` (saiu do site, mas continua salvo).
- **Salvo × no ar:** `revisao` sobe a cada mudança no conteúdo. `revisao_no_ar` só muda quando um deploy
  **concluído** no GitHub Pages confirma o que publicou (`confirmar_deploy`, chamada só pelo servidor). O painel
  deve mostrar "no ar" apenas quando as duas coincidem.
- **Atualização do site:** publicar, editar um publicado, retirar ou excluir gera uma linha em
  `pedidos_atualizacao`. Na próxima etapa, uma Edge Function lê esses pedidos e dispara o workflow.
- **Conformidade:** publicar, ou alterar o conteúdo de um artigo publicado, exige marcar a confirmação de revisão
  quanto à publicidade da OAB. O banco registra quem confirmou e quando. Essa confirmação é humana: o sistema
  valida formato e segurança do texto, não o mérito.
- **Conteúdo:** só os blocos `p`, `lista` e `nota`, sem HTML, sem caracteres de controle e com links apenas `https`.
- **Imagens:** bucket **privado**. Imagem de rascunho só é vista por membros; imagem de artigo publicado pode ser
  baixada com a chave pública, que é o que o build fará. Imagem usada por artigo publicado não pode ser apagada.
- **Permissões:** advogado cria artigos e edita os que criou ou em que assina; admin (com MFA) edita e exclui qualquer
  um e gerencia perfis. Todas as versões ficam em `artigos_historico`.

## Deploy no GitHub Pages

O workflow sincroniza os artigos antes do build. Para isso, crie no GitHub, em **Settings → Secrets and variables →
Actions → Variables**, as variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (os mesmos valores do `.env.local`).
Sem elas, o deploy para na sincronização e o site no ar continua como está.

## Publicação automática

Ao publicar, editar um artigo publicado, retirar ou excluir um publicado, o site é refeito sozinho:

1. o banco cria um pedido em `pedidos_atualizacao` e avisa a Edge Function **disparar-deploy** (gatilho com pg_net,
   endereço e segredo lidos do Vault);
2. a função confere o segredo, agrupa os pedidos (`preparar_disparo`) e dispara o workflow do GitHub;
3. o workflow avisa a Edge Function **confirmar-deploy** no início, no fim (`confirmar_deploy`) ou na falha;
4. o painel mostra "Atualizando o site", "Site atualizado" ou o erro, e só marca "No ar" depois da confirmação.

O agendamento de 30 minutos do workflow continua como alternativa: se o disparo falhar, a próxima execução
publica as alterações e as confirma.

| Onde | Nome | Valor |
| --- | --- | --- |
| Vault do Supabase | `cms_projeto_url` | endereço do projeto (`https://<id>.supabase.co`) |
| Vault do Supabase | `cms_webhook_segredo` | segredo aleatório A |
| Segredos das Edge Functions | `CMS_WEBHOOK_SEGREDO` | o mesmo segredo A |
| Segredos das Edge Functions | `GITHUB_TOKEN` | token granular só deste repositório, **Actions: Read and write** |
| Segredos das Edge Functions | `GITHUB_REPOSITORIO` | `elSilveira/ledesma-site` |
| Segredos das Edge Functions | `CMS_DEPLOY_SEGREDO` | segredo aleatório B |
| GitHub (Actions > Secrets) | `CMS_DEPLOY_SEGREDO` | o mesmo segredo B |
| GitHub (Actions > Variables) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | já usados pela sincronização |

As duas funções ficam em `supabase/functions/` e são publicadas **com a verificação de JWT desligada**: quem
chama é o banco e o GitHub, protegidos pelos segredos A e B. O token do GitHub existe só nos segredos da função.

## Próximas etapas (ainda não feitas)

1. Recuperação de senha e definição de senha no primeiro acesso pelo painel.
