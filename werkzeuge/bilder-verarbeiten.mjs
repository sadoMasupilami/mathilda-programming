// Macht aus den Rohbildern (bilder/roh/, siehe werkzeuge/bilder-erzeugen.mjs) die eingecheckten Bilder:
//   bilder/erzeugt/<id>.webp   512 px, Rand gesäubert, Motiv mittig, alle gleich groß im Bild
//   web/kern/erzeugt.js        dieselben Bilder als data:-Adressen für Blätter, Web-App und Prüfung
//   bilder/erzeugt/umriss/<id>.svg  Linienzeichnung zum Anmalen (Liste "umriss", aus bilder/roh/linie/), als Vektor;
//                              build.mjs gibt sie den Heft-Bildern (<m-bild>) mit
// Bilder derselben "gruppe" (bilder/motive.json) bekommen denselben Ausschnitt, damit eine Bildfolge gleich groß bleibt.
// Baut jedes Mal alles neu. Braucht ImageMagick und potrace:
//   nix shell nixpkgs#imagemagick nixpkgs#potrace nixpkgs#nodejs_22 -c node werkzeuge/bilder-verarbeiten.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROH = path.join(WURZEL, 'bilder', 'roh');
const AUS = path.join(WURZEL, 'bilder', 'erzeugt');
const JS = path.join(WURZEL, 'web', 'kern', 'erzeugt.js');
const daten = JSON.parse(fs.readFileSync(path.join(WURZEL, 'bilder', 'motive.json'), 'utf8'));
const magick = (...a) => execFileSync('magick', a, { encoding: 'utf8' }).trim();
const t = fs.mkdtempSync(path.join(os.tmpdir(), 'bilder-'));
process.on('exit', () => fs.rmSync(t, { recursive: true, force: true }));

const motive = Object.entries(daten.motive).map(([id, m]) => ({ id, gruppe: typeof m === 'object' && m.gruppe ? m.gruppe : id }));
const fehler = [];
const da = motive.filter((m) => {
  if (fs.existsSync(path.join(ROH, m.id + '.png'))) return true;
  fehler.push(m.id + ': kein Rohbild');
  return false;
});

// 1. Maske je Bild (Alpha hart, kleine Reste und Löcher weg, Rand 3 px einziehen gegen den Farbsaum) und Inhalts-Rahmen
const rahmen = {};
for (const m of da) {
  const roh = path.join(ROH, m.id + '.png');
  const norm = path.join(t, m.id + '.png');
  magick(roh, '-resize', '1024x1024!', norm);
  const deckung = +magick(norm, '-alpha', 'extract', '-format', '%[fx:mean]', 'info:');
  if (deckung > 0.97) { fehler.push(m.id + ': kein durchsichtiger Hintergrund'); continue; }
  magick(norm, '-alpha', 'extract', '-threshold', '50%',
    '-define', 'connected-components:area-threshold=200', '-define', 'connected-components:mean-color=true', '-connected-components', '8',
    '-threshold', '50%', '-morphology', 'Close', 'Disk:3', '-morphology', 'Erode', 'Disk:3', path.join(t, m.id + '-maske.png'));
  const [w, h, x, y] = magick(path.join(t, m.id + '-maske.png'), '-format', '%@', 'info:').match(/\d+/g).map(Number);
  rahmen[m.id] = { x, y, w, h };
}

// 2. Gemeinsamer Ausschnitt je Gruppe: Vereinigung der Rahmen, quadratisch, mittig
const ausschnitt = {};
for (const m of da) {
  const r = rahmen[m.id];
  if (!r) continue;
  const a = ausschnitt[m.gruppe] || { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  ausschnitt[m.gruppe] = { x1: Math.min(a.x1, r.x), y1: Math.min(a.y1, r.y), x2: Math.max(a.x2, r.x + r.w), y2: Math.max(a.y2, r.y + r.h) };
}

// 3. Weiche Kante, zuschneiden, auf 944 von 1024 bringen (gleicher Rand bei allen), als WebP 512 px
fs.mkdirSync(AUS, { recursive: true });
for (const d of fs.readdirSync(AUS)) if (d.endsWith('.webp') && !da.some((m) => m.id + '.webp' === d)) fs.rmSync(path.join(AUS, d));
const bilder = {};
for (const m of da) {
  if (!rahmen[m.id]) continue;
  const a = ausschnitt[m.gruppe];
  const seite = Math.max(a.x2 - a.x1, a.y2 - a.y1);
  const x = Math.round((a.x1 + a.x2 - seite) / 2), y = Math.round((a.y1 + a.y2 - seite) / 2);
  const voll = path.join(t, m.id + '-voll.png');
  magick(path.join(t, m.id + '.png'), '(', path.join(t, m.id + '-maske.png'), '-blur', '0x1.2', ')', '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
    '-compose', 'Over', '-background', 'none', '-gravity', 'NorthWest', '-extent', seite + 'x' + seite + (x >= 0 ? '+' : '') + x + (y >= 0 ? '+' : '') + y,
    '+repage', '-resize', '944x944', '-gravity', 'center', '-extent', '1024x1024', voll);
  const webp = path.join(AUS, m.id + '.webp');
  magick(voll, '-resize', '512x512', '-quality', '82', '-define', 'webp:alpha-quality=90', '-define', 'webp:method=6', webp);
  bilder[m.id] = 'data:image/webp;base64,' + fs.readFileSync(webp).toString('base64');
}

fs.writeFileSync(JS,
  '/* Erzeugte Bilder (bilder/motive.json, bilder/erzeugt/HERKUNFT.md) als data:-Adressen, 512 px, quadratisch.\n' +
  '   Nicht von Hand ändern: werkzeuge/bilder-verarbeiten.mjs schreibt diese Datei.\n' +
  '   Die Kern-Dateien (symbole.js, bilder.js, logik.js, baum.js) nehmen ein Bild von hier, wenn es da ist,\n' +
  '   sonst ihre eigene Zeichnung. Ergebnis: globalThis.WerkstattErzeugt */\n' +
  '(function (g) {\n  \'use strict\';\n  g.WerkstattErzeugt = {\n' +
  Object.entries(bilder).map(([id, uri]) => '    ' + JSON.stringify(id) + ': ' + JSON.stringify(uri)).join(',\n') +
  '\n  };\n})(typeof globalThis !== \'undefined\' ? globalThis : this);\n');

// 4. Linienzeichnungen: Linien hart, gleich groß wie das Farbbild, als Vektor (weiße Fläche innen, Linien in Tinte)
const UMRISS = path.join(AUS, 'umriss');
fs.rmSync(UMRISS, { recursive: true, force: true });
fs.mkdirSync(UMRISS, { recursive: true });
const pfad = (pbm, t2) => {
  execFileSync('potrace', [pbm, '-b', 'svg', '--flat', '-t', String(t2), '-a', '1.2', '-O', '0.6', '-W', '512pt', '-H', '512pt', '-o', path.join(t, 'p.svg')]);
  const svg = fs.readFileSync(path.join(t, 'p.svg'), 'utf8').replace(/\n/g, ' ');
  return { tr: svg.match(/<g transform="([^"]*)"/)[1], d: svg.match(/ d="([^"]*)"/)[1] };
};
for (const id of daten.umriss || []) {
  const roh = path.join(ROH, 'linie', id + '.png');
  if (!fs.existsSync(roh)) { fehler.push(id + ': keine Linienzeichnung (bilder/roh/linie/)'); continue; }
  const l = path.join(t, 'l.png');
  magick(roh, '-background', 'white', '-alpha', 'remove', '-colorspace', 'Gray', '-threshold', '55%', '-trim', '+repage',
    '-resize', '944x944', '-background', 'white', '-gravity', 'center', '-extent', '1024x1024', '-threshold', '55%', l);
  magick(l, path.join(t, 'l.pbm'));
  // Außen fluten (kleine Lücken vorher schließen), der Rest ist die weiße Fläche
  magick(l, '-morphology', 'Erode', 'Disk:3', '-bordercolor', 'white', '-border', '1', '-fill', 'red', '-draw', 'color 0,0 floodfill', '-shave', '1x1',
    '-fill', 'black', '+opaque', 'red', '-fill', 'white', '-opaque', 'red', '-morphology', 'Erode', 'Disk:3', path.join(t, 's.pbm'));
  const li = pfad(path.join(t, 'l.pbm'), 12), fl = pfad(path.join(t, 's.pbm'), 20);
  fs.writeFileSync(path.join(UMRISS, id + '.svg'), '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path transform="' + fl.tr + '" fill="#fff" d="' + fl.d +
    '"/><path transform="' + li.tr + '" fill="#1f2340" d="' + li.d + '"/></svg>\n');
}

const groesse = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log('✅ ' + Object.keys(bilder).length + ' Bilder, web/kern/erzeugt.js ' + groesse(JS) + ', ' + fs.readdirSync(UMRISS).length + ' Linienzeichnungen');
for (const f of fehler) console.log('❌ ' + f);
process.exit(fehler.length ? 1 : 0);
