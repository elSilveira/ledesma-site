-- CMS de artigos da Ledesma Advocacia: estrutura.
-- Tabelas no schema public (expostas pela API, sempre com RLS) e funções internas no schema private (não exposto).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- No Supabase, toda tabela nova em public nasce com acesso total para anon e authenticated pela API.
-- Por isso cada tabela abaixo liga a RLS e revoga esses privilégios logo após ser criada, no mesmo arquivo:
-- nenhuma fica exposta, nem entre uma migration e outra. As políticas e as permissões
-- específicas ficam em 20261105120100_cms_seguranca.sql; até lá, a API não lê nem grava nada.

-- ---------------------------------------------------------------------------
-- Equipe e acesso
-- ---------------------------------------------------------------------------

-- Integrantes que podem assinar artigos (mesmos slugs de src/config/site.ts)
create table public.integrantes (
  slug text primary key check (slug ~ '^[a-z][a-z0-9-]{1,40}$'),
  nome text not null,
  ativo boolean not null default true
);
alter table public.integrantes enable row level security;
revoke all on public.integrantes from anon, authenticated;

insert into public.integrantes (slug, nome) values
  ('gustavo', 'Dr. Gustavo Turatto Ledesma'),
  ('erminio', 'Dr. Erminio Rodrigo Gomes Ledesma'),
  ('amanda', 'Dra. Amanda Gabrielly Frutos da Silva');

create type public.papel_cms as enum ('advogado', 'admin');

-- Quem pode entrar no CMS. Contas são criadas só por convite; sem linha aqui, o login não dá acesso a nada.
create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  integrante text references public.integrantes (slug),
  papel public.papel_cms not null default 'advogado',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint advogado_tem_integrante check (papel = 'admin' or integrante is not null)
);
alter table public.perfis enable row level security;
revoke all on public.perfis from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Artigos
-- ---------------------------------------------------------------------------

-- rascunho: só no CMS · publicado: deve estar no site · retirado: saiu do site, mas continua salvo no CMS
create type public.status_artigo as enum ('rascunho', 'publicado', 'retirado');

create table public.artigos (
  id uuid primary key default gen_random_uuid(),
  -- Campos do tipo Artigo (src/content/articles.ts)
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  titulo text not null,
  descricao text not null,
  resumo text not null,
  area text not null check (
    area in ('direito-criminal-e-penal', 'direito-trabalhista', 'direito-previdenciario', 'direito-de-familia-e-sucessoes')
  ),
  publicado_em date,
  atualizado_em date,
  assinantes text[] not null default '{}',
  palavras_chave text[] not null default '{}',
  secoes jsonb not null default '[]',
  referencias text[] not null default '{}',
  -- Caminho no bucket privado "artigos" (ex.: <uuid do usuário>/<uuid>.webp)
  imagem_capa text check (imagem_capa ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),

  status public.status_artigo not null default 'rascunho',
  -- Conteúdo salvo × conteúdo no ar: "revisao" sobe a cada alteração do conteúdo público;
  -- "revisao_no_ar" só muda quando um deploy concluído no GitHub Pages confirma o que publicou.
  revisao integer not null default 1,
  revisao_no_ar integer,
  no_ar_em timestamptz,

  -- Confirmação humana de revisão quanto às regras de publicidade da OAB, exigida a cada publicação ou edição publicada
  conformidade_confirmada_por uuid references auth.users (id),
  conformidade_confirmada_em timestamptz,

  criado_por uuid references auth.users (id),
  criado_em timestamptz not null default now(),
  modificado_por uuid references auth.users (id),
  modificado_em timestamptz not null default now(),

  constraint publicado_tem_datas check (status <> 'publicado' or (publicado_em is not null and atualizado_em is not null)),
  constraint publicado_tem_conteudo check (status <> 'publicado' or jsonb_array_length(secoes) > 0),
  constraint publicado_tem_conformidade check (status <> 'publicado' or conformidade_confirmada_em is not null)
);
alter table public.artigos enable row level security;
revoke all on public.artigos from anon, authenticated;

create index artigos_status_idx on public.artigos (status);

-- Uma cópia de cada versão: quem mudou o quê e quando (inclusive exclusões)
create table public.artigos_historico (
  id bigint generated always as identity primary key,
  artigo_id uuid not null,
  slug text not null,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  revisao integer,
  dados jsonb not null,
  por uuid,
  em timestamptz not null default now()
);
alter table public.artigos_historico enable row level security;
revoke all on public.artigos_historico from anon, authenticated;

create index artigos_historico_artigo_idx on public.artigos_historico (artigo_id, em desc);

-- ---------------------------------------------------------------------------
-- Atualização do site
-- ---------------------------------------------------------------------------

-- Cada mudança que afeta o site gera um pedido. A Edge Function de deploy consome os pendentes
-- e um deploy confirmado marca como "no_ar" os pedidos anteriores ao início do build.
create table public.pedidos_atualizacao (
  id bigint generated always as identity primary key,
  artigo_id uuid,
  slug text not null,
  motivo text not null check (motivo in ('publicacao', 'edicao', 'retirada', 'exclusao')),
  revisao integer,
  situacao text not null default 'pendente' check (situacao in ('pendente', 'disparado', 'no_ar', 'falhou')),
  deploy_id bigint,
  criado_por uuid,
  criado_em timestamptz not null default now()
);
alter table public.pedidos_atualizacao enable row level security;
revoke all on public.pedidos_atualizacao from anon, authenticated;

create index pedidos_atualizacao_situacao_idx on public.pedidos_atualizacao (situacao, criado_em);

-- Execuções do workflow do GitHub Pages disparadas ou confirmadas pelo CMS
create table public.deploys (
  id bigint generated always as identity primary key,
  situacao text not null default 'disparado' check (situacao in ('disparado', 'concluido', 'falhou', 'cancelado')),
  github_run_id bigint unique,
  disparado_em timestamptz not null default now(),
  build_iniciado_em timestamptz,
  concluido_em timestamptz,
  -- slug -> revisão incluída no build, gravado pelo próprio build
  manifesto jsonb,
  detalhes text
);
alter table public.deploys enable row level security;
revoke all on public.deploys from anon, authenticated;

alter table public.pedidos_atualizacao
  add constraint pedidos_deploy_fk foreign key (deploy_id) references public.deploys (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Validação
-- ---------------------------------------------------------------------------

-- Texto simples e seguro: sem marcação HTML, sem caracteres de controle e com links somente https.
-- O site renderiza os blocos como texto (React escapa o conteúdo); esta checagem impede que o banco
-- aceite conteúdo que só faria sentido como HTML ou script.
create function private.texto_seguro(t text, maximo integer)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  url text;
begin
  if t is null or char_length(btrim(t)) = 0 or char_length(t) > maximo then
    return false;
  end if;
  if t ~ '[<>]' or t ~ '[[:cntrl:]]' or t ~* '(javascript|vbscript|data|file)[[:space:]]*:' then
    return false;
  end if;
  for url in select m[1] from regexp_matches(t, '([a-zA-Z][a-zA-Z0-9+.-]*://[^[:space:]]*)', 'g') as m loop
    if not private.url_segura(rtrim(url, '.,;:)')) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- Link aceito: https, domínio com ponto, sem usuário/senha embutidos
create function private.url_segura(u text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select u ~ '^https://[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+(:[0-9]{2,5})?(/[^[:space:]<>"''`]*)?$'
     and char_length(u) <= 500;
$$;

-- Blocos aceitos (os mesmos do tipo Bloco): {tipo:"p",texto} · {tipo:"nota",texto} · {tipo:"lista",itens[]}
create function private.validar_secoes(secoes jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  secao jsonb;
  bloco jsonb;
  item jsonb;
begin
  if jsonb_typeof(secoes) <> 'array' or jsonb_array_length(secoes) > 30 then
    raise exception 'secoes deve ser uma lista com até 30 seções';
  end if;
  for secao in select * from jsonb_array_elements(secoes) loop
    if jsonb_typeof(secao) <> 'object' or (secao - 'titulo' - 'blocos') <> '{}'::jsonb
       or jsonb_typeof(secao -> 'titulo') <> 'string' or jsonb_typeof(secao -> 'blocos') <> 'array'
       or jsonb_array_length(secao -> 'blocos') = 0 then
      raise exception 'seção inválida: use apenas "titulo" e "blocos" (não vazio)';
    end if;
    if not private.texto_seguro(secao ->> 'titulo', 160) then
      raise exception 'título de seção inválido: %', left(secao ->> 'titulo', 60);
    end if;
    for bloco in select * from jsonb_array_elements(secao -> 'blocos') loop
      case bloco ->> 'tipo'
        when 'p', 'nota' then
          if (bloco - 'tipo' - 'texto') <> '{}'::jsonb or jsonb_typeof(bloco -> 'texto') <> 'string'
             or not private.texto_seguro(bloco ->> 'texto', 2000) then
            raise exception 'bloco de texto inválido: %', left(bloco::text, 80);
          end if;
        when 'lista' then
          if (bloco - 'tipo' - 'itens') <> '{}'::jsonb or jsonb_typeof(bloco -> 'itens') <> 'array'
             or jsonb_array_length(bloco -> 'itens') = 0 or jsonb_array_length(bloco -> 'itens') > 30 then
            raise exception 'lista inválida: %', left(bloco::text, 80);
          end if;
          for item in select * from jsonb_array_elements(bloco -> 'itens') loop
            if jsonb_typeof(item) <> 'string' or not private.texto_seguro(item #>> '{}', 1000) then
              raise exception 'item de lista inválido: %', left(item::text, 80);
            end if;
          end loop;
        else
          raise exception 'tipo de bloco não permitido: %', coalesce(bloco ->> 'tipo', '(vazio)');
      end case;
    end loop;
  end loop;
end;
$$;

-- Campos que formam o conteúdo publicado; mudar qualquer um deles gera nova revisão
create function private.conteudo_publico(a public.artigos)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', a.slug, 'titulo', a.titulo, 'descricao', a.descricao, 'resumo', a.resumo, 'area', a.area,
    'publicado_em', a.publicado_em, 'atualizado_em', a.atualizado_em, 'assinantes', a.assinantes,
    'palavras_chave', a.palavras_chave, 'secoes', a.secoes, 'referencias', a.referencias, 'imagem_capa', a.imagem_capa
  );
$$;

-- security definer: as funções de validação ficam no schema private, fechado para os usuários da API
create function private.antes_de_gravar_artigo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text;
  conteudo_mudou boolean;
  confirmou boolean;
  importacao boolean := coalesce(current_setting('cms.importacao', true), '') = 'on';
  -- Importação ou servidor (confirmar_deploy): podem gravar os campos de "no ar"
  sistema boolean := importacao or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
begin
  -- Textos curtos
  if not private.texto_seguro(new.titulo, 160) then raise exception 'título inválido'; end if;
  if not private.texto_seguro(new.descricao, 200) then raise exception 'descrição inválida (até 200 caracteres)'; end if;
  if not private.texto_seguro(new.resumo, 300) then raise exception 'resumo inválido (até 300 caracteres)'; end if;
  if cardinality(new.palavras_chave) > 12 then raise exception 'use até 12 palavras-chave'; end if;
  foreach t in array new.palavras_chave loop
    if not private.texto_seguro(t, 80) then raise exception 'palavra-chave inválida: %', t; end if;
  end loop;
  if cardinality(new.referencias) > 20 then raise exception 'use até 20 referências'; end if;
  foreach t in array new.referencias loop
    if not private.texto_seguro(t, 300) then raise exception 'referência inválida: %', left(t, 60); end if;
  end loop;
  perform private.validar_secoes(new.secoes);

  -- Assinantes: integrantes cadastrados, sem repetição
  if cardinality(new.assinantes) <> (select count(distinct x) from unnest(new.assinantes) as x) then
    raise exception 'assinante repetido';
  end if;
  if exists (select 1 from unnest(new.assinantes) as x where x not in (select slug from public.integrantes)) then
    raise exception 'assinante desconhecido';
  end if;

  if tg_op = 'INSERT' then
    new.revisao := 1;
    new.criado_em := now();
    if not importacao then
      new.revisao_no_ar := null;
      new.no_ar_em := null;
      new.criado_por := auth.uid();
    end if;
    confirmou := new.conformidade_confirmada_em is not null;
    conteudo_mudou := true;
  else
    -- Campos controlados pelo sistema não mudam por edição
    new.id := old.id;
    new.criado_por := old.criado_por;
    new.criado_em := old.criado_em;
    if not sistema then
      new.revisao_no_ar := old.revisao_no_ar;
      new.no_ar_em := old.no_ar_em;
    end if;
    conteudo_mudou := private.conteudo_publico(new) is distinct from private.conteudo_publico(old);
    new.revisao := old.revisao + case when conteudo_mudou then 1 else 0 end;
    confirmou := new.conformidade_confirmada_em is distinct from old.conformidade_confirmada_em
                 and new.conformidade_confirmada_em is not null;
  end if;

  -- A confirmação de conformidade sempre registra quem confirmou e quando (o horário vem do banco)
  if confirmou and not importacao then
    new.conformidade_confirmada_em := now();
    new.conformidade_confirmada_por := auth.uid();
  elsif tg_op = 'UPDATE' and not confirmou then
    new.conformidade_confirmada_em := old.conformidade_confirmada_em;
    new.conformidade_confirmada_por := old.conformidade_confirmada_por;
  end if;

  -- Publicar, ou alterar o conteúdo de um artigo publicado, exige nova confirmação
  if new.status = 'publicado' and not importacao
     and (tg_op = 'INSERT' or old.status <> 'publicado' or conteudo_mudou) and not confirmou then
    raise exception 'confirme a revisão de conformidade (publicidade da OAB) antes de publicar';
  end if;

  -- Atualização feita só pelo sistema (ex.: marcar o que está no ar) não conta como edição
  if tg_op = 'UPDATE' and sistema and not importacao
     and (to_jsonb(new) - 'revisao_no_ar' - 'no_ar_em') = (to_jsonb(old) - 'revisao_no_ar' - 'no_ar_em') then
    return new;
  end if;

  new.modificado_em := now();
  if not importacao then
    new.modificado_por := auth.uid();
  end if;
  return new;
end;
$$;

create trigger artigos_antes_de_gravar
  before insert or update on public.artigos
  for each row execute function private.antes_de_gravar_artigo();

-- Histórico e pedidos de atualização do site
create function private.depois_de_gravar_artigo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  motivo text;
  importacao boolean := coalesce(current_setting('cms.importacao', true), '') = 'on';
begin
  -- Só os campos de "no ar" mudaram (confirmação de deploy): não é uma nova versão nem pede novo deploy
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'revisao_no_ar' - 'no_ar_em') = (to_jsonb(old) - 'revisao_no_ar' - 'no_ar_em') then
    return null;
  end if;

  if tg_op = 'DELETE' then
    insert into public.artigos_historico (artigo_id, slug, operacao, revisao, dados, por)
    values (old.id, old.slug, tg_op, old.revisao, to_jsonb(old), auth.uid());
  else
    insert into public.artigos_historico (artigo_id, slug, operacao, revisao, dados, por)
    values (new.id, new.slug, tg_op, new.revisao, to_jsonb(new), auth.uid());
  end if;

  if importacao then
    return null;
  end if;

  -- O site precisa ser refeito quando algo publicado entra, muda ou sai
  if tg_op = 'INSERT' and new.status = 'publicado' then
    motivo := 'publicacao';
  elsif tg_op = 'UPDATE' and new.status = 'publicado' and old.status <> 'publicado' then
    motivo := 'publicacao';
  elsif tg_op = 'UPDATE' and new.status = 'publicado' and new.revisao <> old.revisao then
    motivo := 'edicao';
  elsif tg_op = 'UPDATE' and old.status = 'publicado' and new.status <> 'publicado' then
    motivo := 'retirada';
  elsif tg_op = 'DELETE' and (old.status = 'publicado' or old.revisao_no_ar is not null) then
    motivo := 'exclusao';
  end if;

  if motivo is not null then
    insert into public.pedidos_atualizacao (artigo_id, slug, motivo, revisao, criado_por)
    values (
      case when tg_op = 'DELETE' then null else new.id end,
      case when tg_op = 'DELETE' then old.slug else new.slug end,
      motivo,
      case when tg_op = 'DELETE' then null else new.revisao end,
      auth.uid()
    );
  end if;
  return null;
end;
$$;

create trigger artigos_depois_de_gravar
  after insert or update or delete on public.artigos
  for each row execute function private.depois_de_gravar_artigo();

-- ---------------------------------------------------------------------------
-- Confirmação de deploy (chamada somente pelo servidor, com a chave de serviço)
-- ---------------------------------------------------------------------------

-- Recebe o manifesto gravado pelo build ({"slug": revisão, ...}) de um deploy concluído no GitHub Pages
-- e atualiza o que está efetivamente no ar. Pedidos criados antes do início do build passam a "no_ar".
create function public.confirmar_deploy(p_github_run_id bigint, p_build_iniciado_em timestamptz, p_manifesto jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deploy bigint;
begin
  if jsonb_typeof(p_manifesto) <> 'object' then
    raise exception 'manifesto inválido';
  end if;

  insert into public.deploys (github_run_id, situacao, build_iniciado_em, concluido_em, manifesto)
  values (p_github_run_id, 'concluido', p_build_iniciado_em, now(), p_manifesto)
  on conflict (github_run_id) do update
    set situacao = 'concluido', build_iniciado_em = excluded.build_iniciado_em,
        concluido_em = now(), manifesto = excluded.manifesto
  returning id into v_deploy;

  -- Artigos presentes no build: marca a revisão publicada
  update public.artigos a
     set revisao_no_ar = (p_manifesto ->> a.slug)::integer, no_ar_em = now()
   where p_manifesto ? a.slug
     and a.revisao_no_ar is distinct from (p_manifesto ->> a.slug)::integer;

  -- Artigos ausentes do build: não estão mais no ar
  update public.artigos a
     set revisao_no_ar = null, no_ar_em = null
   where not (p_manifesto ? a.slug) and a.revisao_no_ar is not null;

  update public.pedidos_atualizacao
     set situacao = 'no_ar', deploy_id = v_deploy
   where situacao in ('pendente', 'disparado') and criado_em < p_build_iniciado_em;
end;
$$;

-- Funções em public também nascem executáveis por todos: esta é só do servidor
revoke execute on function public.confirmar_deploy(bigint, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.confirmar_deploy(bigint, timestamptz, jsonb) to service_role;
