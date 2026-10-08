#!/usr/bin/env node
/**
 * i18n provera: svaki statički ključ iz koda mora postojati u OBA
 * fajla prevoda, a sr.json i en.json moraju imati iste ključeve.
 *
 *   npm run i18n:check            → izveštaj, exit 1 ako nešto fali
 *   node scripts/check-i18n.mjs --list   → svi pronađeni ključevi
 *
 * Dinamički ključevi (template literal) se ne proveravaju — za njih
 * koristi `t.has()` ili ih dodaj ručno.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const src = join(root, "src");
const messages = {
  sr: JSON.parse(readFileSync(join(src, "messages", "sr.json"), "utf8")),
  en: JSON.parse(readFileSync(join(src, "messages", "en.json"), "utf8")),
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

function has(obj, path) {
  return path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj) !== undefined;
}

function flatten(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out.push(key);
  }
  return out;
}

const bindingRe =
  /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([^"]*)"|\{[^}]*namespace:\s*[`"]([^`"]*)[`"][^}]*\}|`([^`]*)`)?\s*\)/g;

const used = new Map(); // key -> files
const dynamic = [];

for (const file of walk(src)) {
  const code = readFileSync(file, "utf8");
  // Bindings in source order — a call resolves to the nearest preceding
  // binding of the same name (several components per file reuse `t`).
  const bindings = [];
  for (const m of code.matchAll(bindingRe)) {
    bindings.push({ name: m[1], ns: m[2] ?? m[3] ?? m[4] ?? "", at: m.index });
  }
  for (const name of new Set(bindings.map((b) => b.name))) {
    const own = bindings.filter((b) => b.name === name);
    const callRe = new RegExp(
      "\\b" + name + "(?:\\.(rich|raw|markup|has))?\\(\\s*([\"`])([^\"`]*)\\2",
      "g"
    );
    for (const m of code.matchAll(callRe)) {
      if (m[1] === "has") continue;
      const binding = own.filter((b) => b.at < m.index).at(-1);
      if (!binding) continue;
      const key = m[3];
      if (m[2] === "`" && key.includes("${")) {
        dynamic.push(`${relative(root, file)}: ${name}(\`${key}\`)`);
        continue;
      }
      if (binding.ns.includes("${")) continue;
      const full = binding.ns ? `${binding.ns}.${key}` : key;
      if (!used.has(full)) used.set(full, new Set());
      used.get(full).add(relative(root, file));
    }
  }
}

if (process.argv.includes("--list")) {
  console.log([...used.keys()].sort().join("\n"));
  process.exit(0);
}

let failed = false;
for (const lang of ["sr", "en"]) {
  const missing = [...used.keys()].filter((k) => !has(messages[lang], k)).sort();
  if (missing.length) {
    failed = true;
    console.log(`\n✗ ${lang}.json — nedostaje ${missing.length} ključeva:`);
    for (const k of missing) console.log(`  ${k}   (${[...used.get(k)].join(", ")})`);
  }
}

const srKeys = new Set(flatten(messages.sr));
const enKeys = new Set(flatten(messages.en));
const onlySr = [...srKeys].filter((k) => !enKeys.has(k));
const onlyEn = [...enKeys].filter((k) => !srKeys.has(k));
if (onlySr.length || onlyEn.length) {
  failed = true;
  if (onlySr.length) console.log(`\n✗ Samo u sr.json:\n  ${onlySr.join("\n  ")}`);
  if (onlyEn.length) console.log(`\n✗ Samo u en.json:\n  ${onlyEn.join("\n  ")}`);
}

if (process.argv.includes("--dynamic")) {
  console.log(`\nDinamički ključevi (ručna provera):\n  ${dynamic.join("\n  ")}`);
}

if (!failed) console.log(`✓ i18n OK — ${used.size} ključeva, sr/en usklađeni.`);
process.exit(failed ? 1 : 0);
