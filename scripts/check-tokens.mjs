import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(__dirname, '..', 'src', 'mobile');

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
}

const files = walk(mobileDir);
let violations = 0;
for (const f of files) {
  const rel = path.relative(path.resolve(__dirname, '..'), f);
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const matches = line.match(HEX_RE);
    if (matches) {
      console.error(`❌ Hardcoded hex ${matches.join(', ')} in ${rel}:${idx + 1}`);
      violations++;
    }
  });
}

if (violations > 0) {
  console.error(`\nFound ${violations} hardcoded hex color(s) in src/mobile/**/*.tsx. Use CSS tokens instead.`);
  process.exit(1);
}
console.log(`✅ Checked ${files.length} mobile TSX files — 0 hardcoded hex colors.`);
