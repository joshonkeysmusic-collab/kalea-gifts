/**
 * Catalogue admin CLI.
 *
 *   npm run catalog:import -- path/to/products.csv            validate, then write public/catalog.custom.json
 *   npm run catalog:import -- products.json --append          add to what is already there instead of replacing it
 *   npm run catalog:import -- products.csv --check            validate only, write nothing
 *   npm run catalog:audit                                     coverage dashboard for built-in + uploaded gifts
 *   npm run catalog:audit -- --strict                         exit with an error when any gap is found
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { SEED_CATALOG, mergeCatalog } from '../src/engine/catalog';
import { ONBOARDING_TIPS, auditCatalog, formatCoverage } from '../src/engine/coverage';
import { formatIssues, productsFromCsv, productsFromJson } from '../src/engine/ingest';
import type { Product } from '../src/engine/product';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name: string) => argv.includes(`--${name}`);
const value = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out');
const command = positional[0] === 'audit' || positional[0] === 'import' ? positional.shift()! : undefined;
const outPath = resolve(value('out') ?? 'public/catalog.custom.json');
const seedIds = SEED_CATALOG.map((i) => i.id);

function readExisting(): Product[] {
  if (!existsSync(outPath)) return [];
  const r = productsFromJson(readFileSync(outPath, 'utf8'));
  return r.products;
}

function report(products: Product[], strict: boolean) {
  const r = auditCatalog(mergeCatalog(SEED_CATALOG, products));
  console.log(`\n${formatCoverage(r)}`);
  if (!r.ok) console.log(`\nHow to balance the catalogue:\n${ONBOARDING_TIPS.map((t) => `  - ${t}`).join('\n')}`);
  if (strict && !r.ok) {
    console.error('\nCoverage check failed (--strict).');
    process.exitCode = 1;
  }
}

if (command === 'audit' || (!command && positional.length === 0)) {
  console.log(`Catalogue: ${seedIds.length} built-in + ${readExisting().length} uploaded (${outPath})`);
  report(readExisting(), flag('strict'));
} else {
  const file = positional[0];
  if (!file || !existsSync(file)) {
    console.error(file ? `File not found: ${file}` : 'Usage: npm run catalog:import -- <products.csv | products.json> [--append] [--check] [--out file]');
    process.exit(1);
  }
  const text = readFileSync(file, 'utf8');
  const existing = flag('append') ? readExisting() : [];
  const ext = extname(file).toLowerCase();
  const opts = { existingIds: [...seedIds, ...existing.map((p) => p.id)] };
  const result = ext === '.json' ? productsFromJson(text, opts) : productsFromCsv(text, opts);

  if (result.issues.length) console.log(formatIssues(result.issues, ext === '.json' ? 'item' : 'row'));
  if (!result.ok) {
    console.error(`\n${result.issues.filter((i) => i.level === 'error').length} error(s). Nothing was written. Fix them and run the import again.`);
    process.exit(1);
  }

  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const p of result.products) byId.set(p.id, p);
  const products = [...byId.values()];
  console.log(`\n${result.products.length} product(s) are valid${flag('append') ? `, ${products.length} in total after merging` : ''}.`);
  if (flag('check')) console.log('Check only: nothing was written.');
  else {
    writeFileSync(outPath, `${JSON.stringify(products, null, 2)}\n`);
    console.log(`Wrote ${outPath}. Deploy the app to publish them.`);
  }
  report(products, flag('strict'));
}
