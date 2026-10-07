// Bundles dist/ into one self-contained HTML file (for claude.ai artifact previews).
// Usage: npm run preview:single   (builds in single mode, then runs this) or
//        node scripts/single-file.mjs <out.html>
import { readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'dist-single/gift-match-single.html';
const dir = 'dist-single';
const html = readFileSync(`${dir}/index.html`, 'utf8');
const css = [...html.matchAll(/href="\/(assets\/[^"]+\.css)"/g)].map((m) => readFileSync(`${dir}/${m[1]}`, 'utf8')).join('\n');
const js = [...html.matchAll(/src="\/(assets\/[^"]+\.js)"/g)].map((m) => readFileSync(`${dir}/${m[1]}`, 'utf8')).join('\n');
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)?.[0] ?? '';

const page = `<title>Kalea Gifts</title>
<meta name="theme-color" content="#0B0809" />
${fonts}
<style>
/* Single dark look by design (Thumbnail Pop); background set explicitly. */
:root { color-scheme: dark; } body { background: #0B0809; }
${css}
</style>
<div id="root"></div>
<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;
writeFileSync(out, page);
console.log(`wrote ${out} (${(page.length / 1024).toFixed(0)} KB)`);
