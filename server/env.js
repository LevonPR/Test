// Loads `.env` from the project root if present. Imported first so that modules
// reading process.env at import time (providers) see the values.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}
