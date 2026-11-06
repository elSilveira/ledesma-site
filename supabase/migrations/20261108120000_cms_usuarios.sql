-- CMS: área de usuários no painel.
--
-- Contas novas são criadas pela Edge Function "gerenciar-usuarios" (só admin com MFA), com senha aleatória
-- enviada por e-mail. No primeiro acesso a pessoa define a própria senha e cadastra o MFA, que passa a ser
-- exigido de todas as contas criadas pelo painel.

alter table public.perfis add column trocar_senha boolean not null default false;
comment on column public.perfis.trocar_senha is 'Senha temporária: pedir uma senha nova no próximo acesso';

-- A própria pessoa, depois de definir a senha nova no painel, tira a marca (só da própria linha)
create function public.concluir_troca_senha()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfis set trocar_senha = false where user_id = auth.uid() and trocar_senha;
$$;
revoke execute on function public.concluir_troca_senha() from public, anon;
grant execute on function public.concluir_troca_senha() to authenticated;

-- Quem chama é admin com MFA? (usado pela Edge Function com o token de quem chamou)
create function public.sou_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.eh_admin();
$$;
revoke execute on function public.sou_admin() from public, anon;
grant execute on function public.sou_admin() to authenticated;

-- Lista de usuários para o painel: agora com senha pendente e MFA
drop function public.listar_autorizacoes();
create function public.listar_autorizacoes()
returns table (
  user_id uuid, email text, papel public.papel_cms, integrante text, ativo boolean, criado_em timestamptz,
  ultimo_acesso timestamptz, trocar_senha boolean, tem_mfa boolean
)
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
    select p.user_id, u.email::text, p.papel, p.integrante, p.ativo, p.criado_em, u.last_sign_in_at, p.trocar_senha,
           exists (select 1 from auth.mfa_factors f where f.user_id = p.user_id and f.status = 'verified')
      from public.perfis p
      join auth.users u on u.id = p.user_id
     order by p.ativo desc, p.papel desc, u.email;
end;
$$;
revoke execute on function public.listar_autorizacoes() from public, anon;
grant execute on function public.listar_autorizacoes() to authenticated;
