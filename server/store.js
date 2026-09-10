import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Tiny JSON file store. Writes are debounced and atomic (write temp, rename), so a
 * crash mid-write never leaves a truncated file behind.
 */
export function createStore(file, { debounceMs = 500 } = {}) {
  let timer = null;
  let pending = null;

  function load() {
    if (!existsSync(file)) return null;
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`[store] could not read ${file}: ${err.message}`);
      return null;
    }
  }

  function writeNow(data) {
    mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, file);
  }

  function schedule(getData) {
    pending = getData;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, debounceMs);
  }

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!pending) return;
    const getData = pending;
    pending = null;
    try {
      writeNow(getData());
    } catch (err) {
      console.error(`[store] could not write ${file}: ${err.message}`);
    }
  }

  return { file, load, schedule, flush };
}
