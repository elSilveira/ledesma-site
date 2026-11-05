// Cadastra (ou testa) o MFA por aplicativo autenticador (TOTP) de uma conta do CMS, enquanto o painel
// /admin não existe. Uso: npm run admin:mfa   (num terminal interativo)
//
// Segurança:
// - e-mail, senha e código são digitados no terminal; a senha não aparece na tela;
// - não aceita senha por argumento, variável ou arquivo (nada fica no histórico do shell nem em disco);
// - a sessão fica só na memória e é encerrada no fim; tokens nunca são impressos;
// - a chave do autenticador aparece uma única vez, só no seu terminal: limpe a tela depois (cls / clear).
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const raiz = path.resolve(import.meta.dirname, "..");
const envLocal = path.join(raiz, ".env.local");
if (fs.existsSync(envLocal)) process.loadEnvFile(envLocal);
const { motivoSegredo } = await import(pathToFileURL(path.join(raiz, "src/lib/supabase/chaves.ts")).href);

const sair = (msg) => {
  console.error(`\n${msg}`);
  process.exit(1);
};

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  sair("Execute num terminal interativo (por exemplo, o terminal do VS Code). Não redirecione entrada nem saída.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !chave) sair("Preencha o .env.local e rode antes: npm run supabase:verificar");
if (motivoSegredo(chave)) sair("A chave do .env.local não é a pública. Use a publishable/anon.");

/** Pergunta no terminal; com `oculto`, o que é digitado não aparece. */
function perguntar(texto, { oculto = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true, historySize: 0 });
    let mudo = false;
    rl._writeToOutput = (s) => {
      if (!mudo) rl.output.write(s);
      else if (/[\r\n]/.test(s)) rl.output.write("\n");
    };
    rl.question(texto, (resposta) => {
      rl.close();
      resolve(resposta);
    });
    mudo = oculto;
  });
}

async function pedirCodigo(supabase, factorId) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const codigo = (await perguntar("Código de 6 dígitos do aplicativo: ")).replace(/\s/g, "");
    if (!/^\d{6}$/.test(codigo)) {
      console.log("  Digite só os 6 números.");
      continue;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo });
    if (!error) return true;
    console.log(`  Código não aceito (${error.message}). Espere o próximo código e tente de novo.`);
  }
  return false;
}

const supabase = createClient(url, chave, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

console.log("Cadastro do MFA do CMS (Ledesma Advocacia)\n");
const email = (await perguntar("E-mail: ")).trim();
const senha = await perguntar("Senha (não aparece enquanto digita): ", { oculto: true });

const login = await supabase.auth.signInWithPassword({ email, password: senha });
if (login.error) sair(`Não foi possível entrar: ${login.error.message}`);
console.log("\nLogin feito.");

try {
  const fatores = await supabase.auth.mfa.listFactors();
  if (fatores.error) throw new Error(`não foi possível ler os fatores: ${fatores.error.message}`);
  const totp = fatores.data.all.filter((f) => f.factor_type === "totp");
  const verificado = totp.find((f) => f.status === "verified");

  let factorId;
  if (verificado) {
    // Já cadastrado: só testa um código para confirmar o acesso de administrador
    console.log("Esta conta já tem MFA cadastrado. Vamos só testar um código.\n");
    factorId = verificado.id;
  } else {
    // Remove tentativas anteriores que não foram concluídas
    for (const f of totp.filter((f) => f.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });

    const cadastro = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Ledesma Advocacia CMS",
      friendlyName: "Aplicativo autenticador",
    });
    if (cadastro.error) {
      throw new Error(
        `${cadastro.error.message}. Confira se o MFA por aplicativo (TOTP) está ativo em Authentication > Multi-Factor.`,
      );
    }
    factorId = cadastro.data.id;
    const chaveTotp = cadastro.data.totp.secret.match(/.{1,4}/g).join(" ");

    console.log("\nNo aplicativo autenticador (Google Authenticator, Microsoft Authenticator, 1Password...):");
    console.log('  1. Toque em "+" e escolha "Inserir chave de configuração" (ou "Digitar chave").');
    console.log("  2. Conta: Ledesma Advocacia CMS");
    console.log(`  3. Chave: ${chaveTotp}`);
    console.log("  4. Tipo: baseado em tempo (padrão).\n");
    console.log("Guarde essa chave só no aplicativo. Não copie para conversas, e-mails ou arquivos.\n");
  }

  if (!(await pedirCodigo(supabase, factorId))) {
    throw new Error("três códigos recusados. Confira o horário do celular (automático) e rode o script de novo.");
  }

  const nivel = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel.data?.currentLevel !== "aal2") throw new Error("a sessão não chegou ao nível com MFA (aal2).");
  console.log("\nMFA confirmado: sessão com segundo fator (aal2).");

  // Prova de acesso: só um admin com MFA consegue listar as autorizações (mostra apenas a contagem)
  const autorizacoes = await supabase.rpc("listar_autorizacoes");
  if (autorizacoes.error) {
    console.log(`Atenção: o acesso de administrador foi recusado (${autorizacoes.error.message}).`);
    console.log("Confira em public.perfis se esta conta tem papel 'admin' e ativo = true.");
  } else {
    console.log(`Acesso de administrador confirmado (${autorizacoes.data.length} autorização(ões) visível(is)).`);
  }
} catch (e) {
  console.error(`\nErro: ${e.message}`);
  process.exitCode = 1;
} finally {
  await supabase.auth.signOut({ scope: "local" });
  console.log("Sessão encerrada. Limpe o terminal agora (cls no PowerShell ou clear no Bash).");
}
