import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const inventoryPath = path.join(rootDir, 'docs', 'redesign', 'inventory.json');
const registryPath = path.join(rootDir, 'src', 'mobile', 'navRegistry.ts');

if (!fs.existsSync(inventoryPath)) {
  console.error('❌ Missing docs/redesign/inventory.json');
  process.exit(1);
}
if (!fs.existsSync(registryPath)) {
  console.error('❌ Missing src/mobile/navRegistry.ts');
  process.exit(1);
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const registrySrc = fs.readFileSync(registryPath, 'utf8');
const registryIds = new Set(
  Array.from(registrySrc.matchAll(/id:\s*["']([^"']+)["']/g)).map((m) => m[1]),
);

let errors = 0;
for (const row of inventory) {
  if (!row.id || !row.label || !row.newLocation || !row.registryId) {
    console.error(`❌ Row ${row.id || '(no id)'} is missing required fields`);
    errors++;
    continue;
  }
  if (!registryIds.has(row.registryId)) {
    console.error(`❌ Row ${row.id} references unknown registryId "${row.registryId}"`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nFailed with ${errors} inventory error(s).`);
  process.exit(1);
}

console.log(`✅ Verified ${inventory.length} inventory rows against ${registryIds.size} navRegistry entries.`);
