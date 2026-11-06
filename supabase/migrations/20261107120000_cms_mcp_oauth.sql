-- CMS: acesso pelo MCP (Claude, Codex) com OAuth do Supabase Auth.
--
-- O token OAuth é da própria pessoa: a RLS continua valendo igual ao painel. Como o token emitido para o
-- aplicativo pode não carregar a marca do segundo fator (aal2), cada passagem pela tela de autorização
-- (/admin/autorizar, que exige MFA para admin) fica registrada aqui e vale por 30 dias para os tokens OAuth
-- dessa pessoa. Sem esse registro, ou depois de 30 dias, o admin conectado pelo MCP não tem acesso
-- (é só conectar de novo). Sessões normais do painel continuam exigindo aal2, como antes.

create table private.autorizacoes_oauth_mfa (
  user_id uuid primary key references auth.users (id) on delete cascade,
  confirmado_em timestamptz not null default now()
);
alter table private.autorizacoes_oauth_mfa enable row level security;
revoke all on private.autorizacoes_oauth_mfa from public, anon, authenticated;

-- Segundo fator: na sessão (aal2) ou, num token OAuth (tem client_id), pela autorização com MFA registrada
create or replace function private.sessao_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      or (
        coalesce(auth.jwt() ->> 'client_id', '') <> ''
        and exists (
          select 1 from private.autorizacoes_oauth_mfa a
           where a.user_id = auth.uid()
             and a.confirmado_em > now() - interval '30 days'
        )
      );
$$;
-- Mesmas permissões de antes (create or replace mantém as concessões; repetidas aqui por clareza)
revoke execute on function private.sessao_mfa() from public, anon;
grant execute on function private.sessao_mfa() to authenticated;

-- Chamado pela tela de autorização, numa sessão do painel com MFA (nunca por um token OAuth)
create function public.registrar_autorizacao_oauth()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' or coalesce(auth.jwt() ->> 'client_id', '') <> '' then
    raise exception 'autorização exige o segundo fator no painel' using errcode = '42501';
  end if;
  if not exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.ativo) then
    raise exception 'usuário sem autorização no CMS' using errcode = '42501';
  end if;
  insert into private.autorizacoes_oauth_mfa (user_id) values (auth.uid())
  on conflict (user_id) do update set confirmado_em = now();
end;
$$;
revoke execute on function public.registrar_autorizacao_oauth() from public, anon;
grant execute on function public.registrar_autorizacao_oauth() to authenticated;
