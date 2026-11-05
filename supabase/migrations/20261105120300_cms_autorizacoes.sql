-- CMS de artigos: gestão de autorizações.
-- Somente administradores (com MFA) gerenciam quem acessa o CMS; ninguém altera a própria autorização
-- e o último administrador ativo não pode ser removido nem rebaixado.

-- ---------------------------------------------------------------------------
-- Ninguém altera a própria linha em perfis
-- ---------------------------------------------------------------------------

drop policy "perfis: admin cadastra" on public.perfis;
drop policy "perfis: admin altera" on public.perfis;
drop policy "perfis: admin remove" on public.perfis;

create policy "perfis: admin cadastra outros" on public.perfis for insert to authenticated
  with check (private.eh_admin() and user_id <> (select auth.uid()));
create policy "perfis: admin altera outros" on public.perfis for update to authenticated
  using (private.eh_admin() and user_id <> (select auth.uid()))
  with check (private.eh_admin() and user_id <> (select auth.uid()));
create policy "perfis: admin remove outros" on public.perfis for delete to authenticated
  using (private.eh_admin() and user_id <> (select auth.uid()));

-- O usuário de um perfil nunca muda: para autorizar outra pessoa, crie outro perfil
create function private.proteger_perfis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then
    raise exception 'não é permitido trocar o usuário de um perfil';
  end if;

  -- Mantém sempre pelo menos um administrador ativo
  if (tg_op = 'DELETE' and old.papel = 'admin' and old.ativo)
     or (tg_op = 'UPDATE' and old.papel = 'admin' and old.ativo and (new.papel <> 'admin' or not new.ativo)) then
    if (select count(*) from public.perfis where papel = 'admin' and ativo and user_id <> old.user_id) = 0 then
      raise exception 'não é possível remover o último administrador ativo';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger perfis_proteger
  before update or delete on public.perfis
  for each row execute function private.proteger_perfis();

-- ---------------------------------------------------------------------------
-- Funções para o painel de administração (somente admin com MFA)
-- ---------------------------------------------------------------------------

-- Lista as autorizações com o e-mail de cada conta (a tabela de usuários do login não é exposta pela API)
create function public.listar_autorizacoes()
returns table (user_id uuid, email text, papel public.papel_cms, integrante text, ativo boolean, criado_em timestamptz, ultimo_acesso timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.eh_admin() then
    raise exception 'acesso restrito a administradores' using errcode = '42501';
  end if;
  return query
    select p.user_id, u.email::text, p.papel, p.integrante, p.ativo, p.criado_em, u.last_sign_in_at
      from public.perfis p
      join auth.users u on u.id = p.user_id
     order by p.papel desc, u.email;
end;
$$;

-- Autoriza (ou altera a autorização de) uma conta já convidada, pelo e-mail.
-- O convite em si é feito em Authentication > Users > Invite user.
create function public.autorizar_usuario(p_email text, p_papel public.papel_cms, p_integrante text default null, p_ativo boolean default true)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not private.eh_admin() then
    raise exception 'acesso restrito a administradores' using errcode = '42501';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'nenhuma conta com este e-mail: convide a pessoa primeiro em Authentication > Users';
  end if;
  if v_user = auth.uid() then
    raise exception 'não é permitido alterar a própria autorização';
  end if;
  if p_papel = 'advogado' and p_integrante is null then
    raise exception 'advogado precisa estar ligado a um integrante (ex.: gustavo, erminio, amanda)';
  end if;

  insert into public.perfis (user_id, integrante, papel, ativo)
  values (v_user, p_integrante, p_papel, p_ativo)
  on conflict (user_id) do update
    set integrante = excluded.integrante, papel = excluded.papel, ativo = excluded.ativo;
  return v_user;
end;
$$;

revoke execute on function public.listar_autorizacoes() from public, anon;
revoke execute on function public.autorizar_usuario(text, public.papel_cms, text, boolean) from public, anon;
grant execute on function public.listar_autorizacoes() to authenticated;
grant execute on function public.autorizar_usuario(text, public.papel_cms, text, boolean) to authenticated;

-- Autor de cada artigo: criado_por é gravado pelo banco (quem criou no CMS) e não pode ser alterado;
-- os nomes exibidos no site vêm de "assinantes".
comment on column public.artigos.criado_por is 'Autor no CMS (gravado automaticamente, não editável)';
comment on column public.artigos.assinantes is 'Integrantes que assinam o artigo no site';
comment on column public.artigos.area is 'Categoria: área de atuação do site';
comment on column public.artigos.secoes is 'Conteúdo em blocos estruturados (p, lista, nota)';
