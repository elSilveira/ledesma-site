-- CMS de artigos: permissões, RLS e armazenamento de imagens.
--
-- Quem acessa o quê:
--   anon (público e o build do site)  -> só artigos publicados, só os campos públicos, e as imagens desses artigos
--   advogado (perfil ativo)          -> lê tudo do CMS; cria artigos; edita os que criou ou em que assina
--   admin (perfil ativo + MFA)       -> tudo acima, edita qualquer artigo, exclui e gerencia perfis
--   service_role (só no servidor)    -> confirma deploys (Edge Function)
-- O admin sem o segundo fator (aal2) não tem acesso nenhum: o MFA é exigido aqui, no banco.

-- ---------------------------------------------------------------------------
-- Funções usadas nas políticas
-- ---------------------------------------------------------------------------

create function private.sessao_mfa()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- Perfil ativo; para admin, só com MFA na sessão
create function private.eh_membro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
     where p.user_id = auth.uid() and p.ativo
       and (p.papel <> 'admin' or private.sessao_mfa())
  );
$$;

create function private.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
     where p.user_id = auth.uid() and p.ativo and p.papel = 'admin'
  ) and private.sessao_mfa();
$$;

-- Slug do integrante ligado ao usuário (null para admin sem assinatura)
create function private.meu_integrante()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.integrante from public.perfis p where p.user_id = auth.uid() and p.ativo;
$$;

-- As políticas executam estas funções com o papel de quem consulta; as demais funções internas ficam fechadas
grant usage on schema private to anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.sessao_mfa(), private.eh_membro(), private.eh_admin(), private.meu_integrante() to authenticated;

-- ---------------------------------------------------------------------------
-- Privilégios: começa fechado e libera só o necessário
-- ---------------------------------------------------------------------------
-- A RLS e a revogação já são feitas em 20261105120000_cms_estrutura.sql, logo após cada tabela ser criada.
-- Repetir aqui não muda nada (os comandos podem rodar mais de uma vez) e garante o estado mesmo em bancos
-- onde a primeira migration foi aplicada numa versão anterior.

revoke all on public.integrantes, public.perfis, public.artigos, public.artigos_historico,
  public.pedidos_atualizacao, public.deploys from anon, authenticated;

alter table public.integrantes enable row level security;
alter table public.perfis enable row level security;
alter table public.artigos enable row level security;
alter table public.artigos_historico enable row level security;
alter table public.pedidos_atualizacao enable row level security;
alter table public.deploys enable row level security;

-- Integrantes
grant select, insert, update on public.integrantes to authenticated;
create policy "integrantes: membros leem" on public.integrantes for select to authenticated using (private.eh_membro());
create policy "integrantes: admin cadastra" on public.integrantes for insert to authenticated with check (private.eh_admin());
create policy "integrantes: admin altera" on public.integrantes for update to authenticated using (private.eh_admin()) with check (private.eh_admin());

-- Perfis
grant select, insert, update, delete on public.perfis to authenticated;
create policy "perfis: cada um vê o seu, admin vê todos" on public.perfis for select to authenticated
  using (user_id = (select auth.uid()) or private.eh_admin());
create policy "perfis: admin cadastra" on public.perfis for insert to authenticated with check (private.eh_admin());
create policy "perfis: admin altera" on public.perfis for update to authenticated using (private.eh_admin()) with check (private.eh_admin());
create policy "perfis: admin remove" on public.perfis for delete to authenticated using (private.eh_admin());

-- Artigos: público lê só os publicados, e só os campos que vão para o site
grant select (
  slug, titulo, descricao, resumo, area, publicado_em, atualizado_em, assinantes,
  palavras_chave, secoes, referencias, imagem_capa, status, revisao
) on public.artigos to anon;
create policy "artigos: público lê publicados" on public.artigos for select to anon using (status = 'publicado');

-- Artigos: membros (somente as colunas editáveis; revisão, "no ar" e autoria são do sistema)
grant select, delete on public.artigos to authenticated;
grant insert (
  slug, titulo, descricao, resumo, area, publicado_em, atualizado_em, assinantes,
  palavras_chave, secoes, referencias, imagem_capa, status, conformidade_confirmada_em
) on public.artigos to authenticated;
grant update (
  slug, titulo, descricao, resumo, area, publicado_em, atualizado_em, assinantes,
  palavras_chave, secoes, referencias, imagem_capa, status, conformidade_confirmada_em
) on public.artigos to authenticated;

create policy "artigos: membros leem" on public.artigos for select to authenticated using (private.eh_membro());
create policy "artigos: membros criam" on public.artigos for insert to authenticated with check (private.eh_membro());
create policy "artigos: autor, assinante ou admin edita" on public.artigos for update to authenticated
  using (
    private.eh_membro()
    and (private.eh_admin() or criado_por = (select auth.uid()) or private.meu_integrante() = any (assinantes))
  )
  with check (
    private.eh_membro()
    and (private.eh_admin() or criado_por = (select auth.uid()) or private.meu_integrante() = any (assinantes))
  );
-- Excluir: admin exclui qualquer um (inclusive publicado, o que gera atualização do site);
-- o autor só exclui rascunho que nunca esteve no ar. Para tirar do site, use o status "retirado".
create policy "artigos: exclusão" on public.artigos for delete to authenticated
  using (
    private.eh_admin()
    or (private.eh_membro() and criado_por = (select auth.uid()) and status = 'rascunho' and revisao_no_ar is null)
  );

-- Histórico, pedidos e deploys: só leitura para membros (gravados pelos gatilhos e pelo servidor)
grant select on public.artigos_historico, public.pedidos_atualizacao, public.deploys to authenticated;
create policy "historico: membros leem" on public.artigos_historico for select to authenticated using (private.eh_membro());
create policy "pedidos: membros leem" on public.pedidos_atualizacao for select to authenticated using (private.eh_membro());
create policy "deploys: membros leem" on public.deploys for select to authenticated using (private.eh_membro());

-- Confirmação de deploy: só o servidor
revoke execute on function public.confirmar_deploy(bigint, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.confirmar_deploy(bigint, timestamptz, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Imagens (Storage): bucket privado
-- ---------------------------------------------------------------------------
-- Não há URL pública. Imagem de rascunho só é vista por membros; imagem de artigo publicado pode ser
-- baixada com a chave pública (é o que o build faz) pelo endpoint autenticado do Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artigos', 'artigos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "artigos (imagens): público baixa as de artigos publicados" on storage.objects for select to anon
  using (
    bucket_id = 'artigos'
    and exists (select 1 from public.artigos a where a.status = 'publicado' and a.imagem_capa = objects.name)
  );

create policy "artigos (imagens): membros veem" on storage.objects for select to authenticated
  using (bucket_id = 'artigos' and private.eh_membro());

-- Envio só na pasta do próprio usuário: <uuid do usuário>/<uuid>.<ext>
create policy "artigos (imagens): membros enviam na própria pasta" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'artigos'
    and private.eh_membro()
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  );

-- Trocar ou apagar: só na própria pasta e nunca uma imagem usada por artigo publicado
create policy "artigos (imagens): membros alteram as próprias" on storage.objects for update to authenticated
  using (
    bucket_id = 'artigos' and private.eh_membro()
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.artigos a where a.status = 'publicado' and a.imagem_capa = objects.name)
  );

create policy "artigos (imagens): membros apagam as próprias" on storage.objects for delete to authenticated
  using (
    bucket_id = 'artigos' and private.eh_membro()
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.artigos a where a.status = 'publicado' and a.imagem_capa = objects.name)
  );
