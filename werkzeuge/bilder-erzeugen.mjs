// Erzeugt die Rohbilder mit der Codex CLI nach bilder/roh/ (nicht eingecheckt), mehrere Bilder pro Aufruf (eine Gruppe).
//   node werkzeuge/bilder-erzeugen.mjs [--umriss] [--gruppe 8] [--parallel 2] [--nur a,b] [--neu]
// Motive: bilder/motive.json. Ein Motiv mit "vorlage" kommt erst dran, wenn seine Vorlagen fertig sind (Runde für Runde),
// die Vorlagen gehen als Referenzbild mit. Vorhandene Rohbilder werden übersprungen: Ein abgebrochener Lauf geht einfach
// weiter, wenn man ihn neu startet. --neu (nur mit --nur) erzeugt die genannten Bilder noch einmal.
// --umriss: macht aus den Farbbildern der Liste "umriss" (bilder/motive.json) Linienzeichnungen zum Anmalen (bilder/roh/linie/).
// Exit 3 heißt: Die Usage ist aus (der Grund steht in der Ausgabe). Danach: werkzeuge/bilder-verarbeiten.sh
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROH = path.join(WURZEL, 'bilder', 'roh');
const daten = JSON.parse(fs.readFileSync(path.join(WURZEL, 'bilder', 'motive.json'), 'utf8'));

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes('--' + n) ? args[args.indexOf('--' + n) + 1] : d);
const groesse = +opt('gruppe', 8);
const parallel = +opt('parallel', 2);
const nur = opt('nur', '') ? opt('nur', '').split(',') : null;
const umriss = args.includes('--umriss');
if (nur && nur.some((id) => !daten.motive[id])) {
  console.error('Unbekannte Motive: ' + nur.filter((id) => !daten.motive[id]).join(' '));
  process.exit(2);
}
// Farbbild (Vorlage für alles) und Ziel dieses Laufs
const quelle = (id) => path.join(ROH, id + '.png');
const ziel = (id) => (umriss ? path.join(ROH, 'linie', id + '.png') : quelle(id));
if (args.includes('--neu')) {
  if (!nur) { console.error('--neu geht nur mit --nur'); process.exit(2); }
  for (const id of nur) fs.rmSync(ziel(id), { force: true });
}

const ENDE = `After generating, copy each image into the current directory under exactly the file names given, then list the files.
Do not write code. Do not generate variations or extras. If you cannot generate images, say so plainly with the reason and stop.`;

const STIL = `Shared style for all: a friendly picture-book illustration for a 6-year-old; soft, rounded, chunky shapes; smooth 3D-like gradients with gentle shading and a subtle highlight; no black outlines; bright clean colours; centred, filling about 85 percent of a square canvas, whole subject visible and not cropped; no text, no letters, no numbers; no background scenery, no ground unless described, no cast shadow. Only animals and characters may have a face: food, plants and objects must have no eyes, no mouth and no face at all. Original designs only, not resembling any existing character or brand. Background: fully transparent.
Where an image names a reference file, keep the same characters and objects, the same style, the same camera angle and the same position and size on the canvas as in that reference, and change only what the description says.`;

function motiv(id) {
  const m = daten.motive[id];
  return typeof m === 'string' ? { id, text: m, vorlage: [] } : { id, text: m.text, vorlage: m.vorlage || [] };
}
const UMRISS = `Turn each referenced image into a colouring-page outline for a 6-year-old child:
- Keep the same subject, same pose, same proportions, and the same position and size on the square canvas.
- Bold, clean, uniform dark lines of about 2.5 percent of the canvas width, with rounded ends. Solid black lines only.
- Pure white background and pure white inside every shape. No shading, no grey, no colour, no gradients, no hatching, no texture.
- Keep it simple with large areas to colour in. Where the subject has a face, keep it clear and friendly. Do not add a face where the reference has none. Leave out small details.
- Closed outer contour. No text, no ground, no extra objects.`;
const alle = umriss
  ? (daten.umriss || []).map((id) => ({ id, text: 'colouring-page outline of the reference', vorlage: [id] }))
  : Object.keys(daten.motive).filter((id) => !id.startsWith('_')).map(motiv);
for (const m of alle) for (const v of m.vorlage) if (!daten.motive[v]) { console.error(m.id + ': Vorlage „' + v + '“ gibt es nicht'); process.exit(2); }

function prompt(gruppe) {
  return 'Use your built-in image generation tool to generate exactly ' + gruppe.length + ' images, one for each item below, and nothing else.\n\n' +
    (umriss ? UMRISS : STIL) + '\n\nImages:\n' +
    gruppe.map((a, i) => (i + 1) + '. ' + a.id + '.png: ' + a.text +
      (a.vorlage.length ? ' (reference' + (a.vorlage.length > 1 ? 's' : '') + ': ' + a.vorlage.map((v) => 'vorlage-' + v + '.png').join(', ') + ')' : '')).join('\n') +
    '\n\n' + ENDE;
}

// Ein Aufruf: legt seine Bilder in einem eigenen Ordner ab und übernimmt nur, was wirklich da ist
function lauf(gruppe) {
  return new Promise((fertig) => {
    const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'bilder-'));
    const a = ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', ordner, prompt(gruppe)];
    const vorlagen = new Set(gruppe.flatMap((x) => x.vorlage));
    for (const v of vorlagen) { const name = 'vorlage-' + v + '.png'; fs.copyFileSync(quelle(v), path.join(ordner, name)); a.push('-i', name); }
    const log = [];
    const p = spawn('codex', a, { cwd: ordner, stdio: ['ignore', 'pipe', 'pipe'] });
    p.stdout.on('data', (d) => log.push(d));
    p.stderr.on('data', (d) => log.push(d));
    p.on('close', (code) => {
      const fehlen = [];
      for (const x of gruppe) {
        const q = path.join(ordner, x.id + '.png');
        if (fs.existsSync(q)) { fs.mkdirSync(path.dirname(ziel(x.id)), { recursive: true }); fs.copyFileSync(q, ziel(x.id)); } else fehlen.push(x.id);
      }
      const text = Buffer.concat(log).toString();
      fs.rmSync(ordner, { recursive: true, force: true });
      fertig({ code, fehlen, text });
    });
  });
}

const LIMIT = /usage limit|limit reached|hit your|rate.?limit|quota|too many requests|\b429\b|exceeded/i;
const gewollt = (m) => !nur || nur.includes(m.id);
let usageAus = null;
let leer = 0;
for (let runde = 1; !usageAus && leer < 2; runde++) {
  const offen = alle.filter((m) => gewollt(m) && !fs.existsSync(ziel(m.id)));
  const bereit = offen.filter((m) => m.vorlage.every((v) => fs.existsSync(quelle(v))));
  if (!bereit.length) break;
  console.log('Runde ' + runde + ': ' + bereit.length + ' von ' + offen.length + ' offenen Bildern bereit, Gruppen zu ' + groesse + ', ' + parallel + ' parallel');
  const gruppen = [];
  for (let i = 0; i < bereit.length; i += groesse) gruppen.push(bereit.slice(i, i + groesse));
  let neu = 0;
  async function arbeiter() {
    while (gruppen.length && !usageAus && leer < 2) {
      const g = gruppen.shift();
      const e = await lauf(g);
      const gut = g.length - e.fehlen.length;
      neu += gut;
      console.log((e.fehlen.length ? '⚠️  ' : '✅ ') + gut + '/' + g.length + ': ' + g.map((x) => x.id).join(' ') + (e.fehlen.length ? ' | fehlt: ' + e.fehlen.join(' ') : ''));
      if (!e.fehlen.length) { leer = 0; continue; }
      const zeile = e.text.split('\n').filter((z) => LIMIT.test(z) && !/^\s*-/.test(z)).pop();
      if (zeile && gut === 0) usageAus = zeile.slice(0, 300);
      else if (gut === 0) { leer++; console.log(e.text.split('\n').slice(-12).join('\n').slice(0, 1200)); }
    }
  }
  await Promise.all(Array.from({ length: parallel }, arbeiter));
  if (!neu) leer++;
}

const rest = alle.filter((m) => gewollt(m) && !fs.existsSync(ziel(m.id)));
const zahl = alle.filter(gewollt).length;
console.log('Fertig: ' + (zahl - rest.length) + '/' + zahl + (rest.length ? ', offen: ' + rest.map((a) => a.id).join(' ') : ''));
if (usageAus) { console.log('🛑 USAGE AUS: ' + usageAus); process.exit(3); }
process.exit(rest.length ? 1 : 0);
