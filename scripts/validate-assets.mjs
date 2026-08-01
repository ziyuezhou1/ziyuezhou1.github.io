import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'assets/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.bundledAssets)) {
  throw new Error('assets/manifest.json must use schemaVersion 1 and define bundledAssets.');
}

const required = ['id', 'path', 'kind', 'author', 'license', 'source', 'notes'];
const ids = new Set();
for (const asset of manifest.bundledAssets) {
  for (const field of required) {
    if (typeof asset[field] !== 'string' || asset[field].trim() === '') {
      throw new Error('Asset entry is missing ' + field + ': ' + JSON.stringify(asset));
    }
  }
  if (ids.has(asset.id)) throw new Error('Duplicate asset id: ' + asset.id);
  ids.add(asset.id);
  if (!asset.path.startsWith('procedural://')) await access(resolve(root, asset.path));
}

console.log('Validated ' + manifest.bundledAssets.length + ' bundled asset records.');
