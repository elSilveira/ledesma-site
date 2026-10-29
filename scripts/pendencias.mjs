// Lista as informações que ainda precisam ser fornecidas antes da publicação.
// Uso: npm run pendencias   (requer Node 22.18+ para importar TypeScript diretamente)
import { listarPendencias } from "../src/config/site.ts";

const itens = listarPendencias();
console.log(`\nPendências antes da publicação (${itens.length}):\n`);
for (const item of itens) console.log(`  • ${item}`);
console.log("\nEdite src/config/site.ts e configure as variáveis do arquivo .env.example.\n");
