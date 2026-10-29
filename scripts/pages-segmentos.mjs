// Pós-build do export estático (GitHub Pages).
// O export grava os segmentos de prefetch em subpastas (`__next.artigos/$d$slug/__PAGE__.txt`), mas o
// navegador os pede com nome achatado (`__next.artigos.$d$slug.__PAGE__.txt`). Sem a cópia, cada link
// prefetchado gera um 404 e a navegação cai para recarga completa da página.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.argv[2] ?? "out");
let copiados = 0;

function percorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("__next.")) achatar(dir, p);
    else percorrer(p);
  }
}

function achatar(base, pasta) {
  for (const e of fs.readdirSync(pasta, { withFileTypes: true, recursive: true })) {
    if (!e.isFile()) continue;
    const origem = path.join(e.parentPath, e.name);
    const destino = path.join(base, path.relative(base, origem).split(path.sep).join("."));
    fs.copyFileSync(origem, destino);
    copiados++;
  }
}

percorrer(OUT);
console.log(`Segmentos de prefetch achatados: ${copiados}`);
