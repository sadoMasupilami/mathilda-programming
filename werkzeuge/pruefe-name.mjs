// Datenschutz-Prüfung (AUFTRAG.md Abschnitt 8, Variante B):
// Der Name des Kindes darf in keiner Datei stehen, die ins Repo kommt.
// Geprüft werden alle eingecheckten und alle neuen, nicht ignorierten Dateien.
//
//   node werkzeuge/pruefe-name.mjs        Name aus kind.json

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function pruefeNamen(name) {
  if (!name) return [];
  let dateien;
  try {
    dateien = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: WURZEL, encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch (e) {
    return ['Namens-Prüfung: git ls-files geht nicht (' + e.message + ')'];
  }
  const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const fehler = [];
  for (const d of dateien) {
    const voll = path.join(WURZEL, d);
    if (re.test(d)) fehler.push('Datenschutz: Dateiname enthält den Namen: ' + d);
    if (!fs.existsSync(voll) || fs.statSync(voll).isDirectory()) continue;
    const inhalt = fs.readFileSync(voll);
    if (inhalt.includes(0) && !/\.(svg|json|js|mjs|html|css|md|txt|yml)$/.test(d)) {
      if (re.test(inhalt.toString('latin1'))) fehler.push('Datenschutz: Name in Binärdatei ' + d);
      continue;
    }
    const zeilen = inhalt.toString('utf8').split('\n');
    zeilen.forEach((z, i) => { if (re.test(z)) fehler.push('Datenschutz: Name in ' + d + ':' + (i + 1) + ' – bitte {{KIND}} verwenden'); });
  }
  return fehler;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const kindDatei = path.join(WURZEL, 'kind.json');
  if (!fs.existsSync(kindDatei)) { console.log('kind.json fehlt – nichts zu prüfen'); process.exit(0); }
  const f = pruefeNamen(JSON.parse(fs.readFileSync(kindDatei, 'utf8')).KIND);
  if (f.length) { for (const x of f) console.log('❌ ' + x); process.exit(1); }
  console.log('✅ Der Name steht in keiner Datei, die ins Repo kommt.');
}
