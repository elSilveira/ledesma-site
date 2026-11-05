-- CMS de artigos: publicação automática no GitHub Pages.
--
-- Fluxo: um pedido de atualização (gerado ao publicar, editar, retirar ou excluir um artigo publicado) avisa a
-- Edge Function "disparar-deploy", que dispara o workflow do GitHub. O workflow informa início, fim ou falha à
-- Edge Function "confirmar-deploy", que usa estas funções (e a confirmar_deploy já existente).
--
-- Segredos ficam fora do repositório: o endereço do projeto e o segredo do aviso são lidos do Vault do Supabase
-- (nomes "cms_projeto_url" e "cms_webhook_segredo"). Enquanto não existirem, nada é disparado e salvar continua
-- funcionando; o agendamento de 30 minutos do workflow segue como alternativa.

create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- Deploys: estado "em andamento" (o workflow já começou)
-- ---------------------------------------------------------------------------

alter table public.deploys drop constraint deploys_situacao_check;
alter table public.deploys add constraint deploys_situacao_check
  check (situacao in ('disparado', 'em_andamento', 'concluido', 'falhou', 'cancelado'));

-- ---------------------------------------------------------------------------
-- Aviso à Edge Function quando surgem pedidos de atualização
-- ---------------------------------------------------------------------------

create function private.avisar_disparo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_segredo text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'cms_projeto_url';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'cms_webhook_segredo';
  if v_url is null or v_segredo is null then
    return null; -- ainda não configurado
  end if;
  -- Chamada assíncrona (pg_net): não atrasa nem impede a gravação do artigo
  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/disparar-deploy',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cms-segredo', v_segredo),
    timeout_milliseconds := 10000
  );
  return null;
exception when others then
  -- O aviso nunca impede salvar o artigo; o agendamento de 30 minutos cobre a falha
  raise warning 'aviso de atualização do site não enviado: %', sqlerrm;
  return null;
end;
$$;

revoke execute on function private.avisar_disparo() from public, anon, authenticated;

-- Cada pedido gera um aviso; a função agrupa os pendentes (preparar_disparo) e dispara o GitHub uma vez só
create trigger pedidos_avisar_disparo
  after insert on public.pedidos_atualizacao
  for each statement execute function private.avisar_disparo();

-- ---------------------------------------------------------------------------
-- Funções usadas pelas Edge Functions (somente com a chave de serviço)
-- ---------------------------------------------------------------------------

-- Agrupa os pedidos pendentes num deploy. Se já houver um disparo recente que ainda não começou a rodar,
-- os novos pedidos entram nele (o workflow ainda vai ler o CMS) e não é preciso disparar de novo.
create function public.preparar_disparo()
returns table (id_deploy bigint, deve_disparar boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('cms_disparo'));

  if not exists (select 1 from public.pedidos_atualizacao where situacao = 'pendente') then
    return query select null::bigint, false;
    return;
  end if;

  select d.id into v_id
    from public.deploys d
   where d.situacao = 'disparado' and d.github_run_id is null and d.disparado_em > now() - interval '10 minutes'
   order by d.id desc
   limit 1;

  if v_id is null then
    insert into public.deploys (situacao) values ('disparado') returning id into v_id;
    update public.pedidos_atualizacao set situacao = 'disparado', deploy_id = v_id where situacao = 'pendente';
    return query select v_id, true;
  else
    update public.pedidos_atualizacao set situacao = 'disparado', deploy_id = v_id where situacao = 'pendente';
    return query select v_id, false;
  end if;
end;
$$;

-- O GitHub recusou o disparo: os pedidos voltam a pendentes (próximo aviso ou o agendamento tentam de novo)
create function public.falha_disparo(p_deploy_id bigint, p_detalhes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.deploys
     set situacao = 'falhou', concluido_em = now(), detalhes = left(p_detalhes, 500)
   where id = p_deploy_id;
  update public.pedidos_atualizacao
     set situacao = 'pendente', deploy_id = null
   where deploy_id = p_deploy_id and situacao = 'disparado';
end;
$$;

-- O workflow começou. "p_iniciado_em" é registrado ANTES de o build ler o CMS: pedidos anteriores a ele
-- entram neste build. Execuções do agendamento (sem p_deploy_id) também são registradas.
create function public.registrar_inicio_deploy(p_deploy_id bigint, p_github_run_id bigint, p_iniciado_em timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_deploy_id is not null and exists (select 1 from public.deploys where id = p_deploy_id and github_run_id is null) then
    update public.deploys
       set github_run_id = p_github_run_id, build_iniciado_em = p_iniciado_em, situacao = 'em_andamento'
     where id = p_deploy_id;
  else
    insert into public.deploys (github_run_id, situacao, build_iniciado_em)
    values (p_github_run_id, 'em_andamento', p_iniciado_em)
    on conflict (github_run_id) do update
      set situacao = 'em_andamento', build_iniciado_em = excluded.build_iniciado_em, concluido_em = null, detalhes = null;
  end if;

  -- Histórico enxuto: deploys terminados há mais de 30 dias e sem pedidos ligados
  delete from public.deploys d
   where d.concluido_em < now() - interval '30 days'
     and d.situacao in ('concluido', 'falhou', 'cancelado')
     and not exists (select 1 from public.pedidos_atualizacao p where p.deploy_id = d.id);
end;
$$;

-- O workflow falhou ou foi cancelado: nada foi para o ar; os pedidos dele voltam a pendentes
create function public.registrar_fim_deploy(p_github_run_id bigint, p_situacao text, p_detalhes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if p_situacao not in ('falhou', 'cancelado') then
    raise exception 'situação inválida: %', p_situacao;
  end if;

  update public.deploys
     set situacao = p_situacao, concluido_em = now(), detalhes = left(p_detalhes, 500)
   where github_run_id = p_github_run_id
  returning id into v_id;

  if v_id is null then
    insert into public.deploys (github_run_id, situacao, concluido_em, detalhes)
    values (p_github_run_id, p_situacao, now(), left(p_detalhes, 500));
  else
    update public.pedidos_atualizacao
       set situacao = 'pendente', deploy_id = null
     where deploy_id = v_id and situacao = 'disparado';
  end if;
end;
$$;

revoke execute on function public.preparar_disparo() from public, anon, authenticated;
revoke execute on function public.falha_disparo(bigint, text) from public, anon, authenticated;
revoke execute on function public.registrar_inicio_deploy(bigint, bigint, timestamptz) from public, anon, authenticated;
revoke execute on function public.registrar_fim_deploy(bigint, text, text) from public, anon, authenticated;
grant execute on function public.preparar_disparo() to service_role;
grant execute on function public.falha_disparo(bigint, text) to service_role;
grant execute on function public.registrar_inicio_deploy(bigint, bigint, timestamptz) to service_role;
grant execute on function public.registrar_fim_deploy(bigint, text, text) to service_role;
