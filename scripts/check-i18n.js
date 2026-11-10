import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.resolve(__dirname, '../src/i18n/en.json');
const taPath = path.resolve(__dirname, '../src/i18n/ta.json');

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error: Failed to parse JSON at ${filePath}:`, err.message);
    process.exit(1);
  }
}

function getLeafKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getLeafKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const en = loadJson(enPath);
const ta = loadJson(taPath);

const enKeys = new Set(getLeafKeys(en));
const taKeys = new Set(getLeafKeys(ta));

const missingInTa = [...enKeys].filter((k) => !taKeys.has(k));
const missingInEn = [...taKeys].filter((k) => !enKeys.has(k));

let hasErrors = false;

if (missingInTa.length > 0) {
  console.error('\n❌ Keys present in en.json but missing in ta.json:');
  missingInTa.forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
}

if (missingInEn.length > 0) {
  console.error('\n❌ Keys present in ta.json but missing in en.json:');
  missingInEn.forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
}

if (hasErrors) {
  console.error(`\nFound mismatch in i18n keys! Check failed.\n`);
  process.exit(1);
} else {
  console.log(`\n✓ All ${enKeys.size} i18n keys match perfectly between en.json and ta.json!\n`);
  process.exit(0);
}
