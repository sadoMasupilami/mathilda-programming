// Web-App bauen: web/ + Rätsel-Daten → _site/ (das veröffentlicht GitHub Pages)
//
//   node werkzeuge/web-bauen.mjs                         echte Rätsel aus raetsel/
//   node werkzeuge/web-bauen.mjs --raetsel tests/fixtures/web-raetsel   eigene Test-Daten
//   node werkzeuge/web-bauen.mjs --ziel anderer-ordner
//
// Braucht nur Node 22 (läuft auch in GitHub Actions ohne Nix, ohne npm install).
// 1. Alle Rätsel lösen und prüfen (werkzeuge/raetsel.mjs) – Abbruch bei Fehlern
// 2. _site/ = Kopie von web/ + _site/daten.js (window.WERKSTATT_DATEN, nur was die App braucht)
// 3. Build-Version (Hash über alle Dateien) in den Cache-Namen des Service Workers und in die Seite
// 4. Prüfen: jedes Zeichen der App-Texte und Level-Daten ist in der gekürzten Schrift (web/fonts/zeichen.txt),
//    keine http(s)-Adresse in den geladenen Dateien, jedes Web-Level ist in der App spielbar.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pruefeAlle, webDaten } from './raetsel.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, std) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : std;
};
const RAETSEL = path.resolve(WURZEL, arg('--raetsel', 'raetsel'));
const ZIEL = path.resolve(WURZEL, arg('--ziel', '_site'));
const WEB = path.join(WURZEL, 'web');
const fehler = [];
const warnungen = [];

// ---------------------------------------------------------------------
// 1. Rätsel
// ---------------------------------------------------------------------
const erg = pruefeAlle(RAETSEL);
if (erg.fehler.length) {
  console.log('❌ ' + erg.fehler.length + ' Rätsel-Fehler (' + path.relative(WURZEL, RAETSEL) + '):');
  for (const f of erg.fehler) console.log('  • ' + f);
  process.exit(1);
}
const daten = webDaten(erg);
// Die App bewertet nur nach dem Ergebnis: gemeinte Reparatur, Beispiel- und Lösungsprogramme gehören nicht in die Daten
for (const p of daten.pakete) for (const l of p.levels) { delete l.reparatur; delete l.beispiel; delete l.loesung; }
const SPIELBAR = ['pfad', 'kobold', 'ablauf'];
for (const p of daten.pakete) {
  if (!SPIELBAR.includes(p.art)) fehler.push('Paket ' + p.paket + ': web.art „' + p.art + '“ kann die App nicht (' + SPIELBAR.join(', ') + ')');
  if (p.levels.length < 1) fehler.push('Paket ' + p.paket + ': keine Levels');
  if (p.levels.length < 5 || p.levels.length > 7) warnungen.push('Paket ' + p.paket + ' hat ' + p.levels.length + ' Levels (geplant 5–7)');
  for (const l of p.levels) {
    if (!SPIELBAR.includes(l.art)) fehler.push('Level ' + l.id + ': art „' + l.art + '“ ist in der App nicht spielbar (' + SPIELBAR.join(', ') + ')');
    if ((l.art === 'pfad' || l.art === 'kobold') && !l.ziel) fehler.push('Level ' + l.id + ': ohne Ziel nicht spielbar');
    if (l.art === 'pfad' && l.maxKarten && l.maxKarten > 12) fehler.push('Level ' + l.id + ': maxKarten höchstens 12');
  }
}
if (!daten.pakete.length) warnungen.push('Keine Level-Pakete gefunden – die App zeigt eine leere Startseite');

// ---------------------------------------------------------------------
// 2. Dateien kopieren
// ---------------------------------------------------------------------
fs.rmSync(ZIEL, { recursive: true, force: true });
function kopiere(von, nach) {
  fs.mkdirSync(nach, { recursive: true });
  for (const e of fs.readdirSync(von, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const a = path.join(von, e.name), b = path.join(nach, e.name);
    if (e.isDirectory()) kopiere(a, b);
    else fs.copyFileSync(a, b);
  }
}
kopiere(WEB, ZIEL);
fs.writeFileSync(path.join(ZIEL, 'daten.js'),
  '/* Level-Daten der Denk-Werkstatt, erzeugt von werkzeuge/web-bauen.mjs aus raetsel/*.json */\n' +
  'window.WERKSTATT_DATEN = ' + JSON.stringify(daten) + ';\n');

// Bilder für Ablauf-Karten nur einbinden, wenn es den Katalog gibt (sonst zeigt die App nur Text)
const indexPfad = path.join(ZIEL, 'index.html');
let index = fs.readFileSync(indexPfad, 'utf8');
const mitBildern = fs.existsSync(path.join(ZIEL, 'kern', 'bilder.js'));
index = index.replace('<!-- BILDER -->', mitBildern ? '<script src="kern/bilder.js"></script>' : '');
fs.writeFileSync(indexPfad, index);

function alleDateien(ordner, basis = ordner) {
  const aus = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) aus.push(...alleDateien(p, basis));
    else aus.push(path.relative(basis, p).split(path.sep).join('/'));
  }
  return aus.sort();
}

// ---------------------------------------------------------------------
// 3. Version und Service Worker
// ---------------------------------------------------------------------
const dateien = alleDateien(ZIEL);
const hash = crypto.createHash('sha256');
for (const d of dateien) { hash.update(d + '\0'); hash.update(fs.readFileSync(path.join(ZIEL, d))); }
const VERSION = hash.digest('hex').slice(0, 12);

// Was der Service Worker vorab in den Cache legt: alles, was die App lädt (keine Lizenz- und Listen-Texte)
const imCache = ['./'].concat(dateien.filter((d) => d !== 'sw.js' && !d.endsWith('.txt')));
for (const d of ['sw.js', 'index.html']) {
  const p = path.join(ZIEL, d);
  let t = fs.readFileSync(p, 'utf8');
  if (!t.includes('__VERSION__')) fehler.push(d + ': Platzhalter __VERSION__ fehlt');
  t = t.split('__VERSION__').join(VERSION);
  if (d === 'sw.js') {
    if (!t.includes('__DATEIEN__')) fehler.push('sw.js: Platzhalter __DATEIEN__ fehlt');
    t = t.replace('__DATEIEN__', JSON.stringify(imCache));
  }
  fs.writeFileSync(p, t);
}

// ---------------------------------------------------------------------
// 4. Prüfungen
// ---------------------------------------------------------------------
// 4a. Jedes Zeichen in der Schrift
const zeichenDatei = path.join(WEB, 'fonts', 'zeichen.txt');
const inSchrift = new Set();
if (!fs.existsSync(zeichenDatei)) fehler.push('web/fonts/zeichen.txt fehlt (werkzeuge/mit-nix.sh node werkzeuge/schriften.mjs)');
else {
  for (const z of fs.readFileSync(zeichenDatei, 'utf8').split('\n')) {
    const m = /^U\+([0-9A-F]{4,6})\b/.exec(z);
    if (m) inSchrift.add(parseInt(m[1], 16));
  }
}
const ohneKommentare = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '');
const texte = [];
texte.push(['index.html', ohneKommentare(fs.readFileSync(path.join(ZIEL, 'index.html'), 'utf8'))]);
texte.push(['app.js', ohneKommentare(fs.readFileSync(path.join(ZIEL, 'app.js'), 'utf8'))]);
(function sammle(x, wo) {
  if (typeof x === 'string') texte.push([wo, x]);
  else if (Array.isArray(x)) x.forEach((y) => sammle(y, wo));
  else if (x && typeof x === 'object') for (const v of Object.values(x)) sammle(v, wo);
})(daten, 'daten.js (Level-Daten)');
const fehlt = new Map();
for (const [wo, t] of texte) {
  for (const ch of t) {
    const c = ch.codePointAt(0);
    if (c < 0x20) continue;            // Zeilenumbrüche, Tabulatoren
    if (!inSchrift.has(c)) {
      if (!fehlt.has(ch)) fehlt.set(ch, new Set());
      fehlt.get(ch).add(wo);
    }
  }
}
for (const [ch, wo] of fehlt) {
  fehler.push('Zeichen „' + ch + '“ (U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ') fehlt in der Schrift – in ' + [...wo].join(', ') +
    '. Anderes Zeichen verwenden oder in werkzeuge/schriften.mjs ergänzen.');
}

// 4b. Keine externen Adressen in den Dateien, die die App lädt (nur relative Pfade).
//     Erlaubt sind nur die XML-Namensräume von SVG (keine Anfrage, nur ein Name).
const NAMENSRAEUME = new Set(['http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xlink', 'http://www.w3.org/1999/xhtml']);
for (const d of dateien) {
  if (!/\.(html|js|css|webmanifest|json|svg)$/.test(d)) continue;
  const t = fs.readFileSync(path.join(ZIEL, d), 'utf8');
  for (const m of t.matchAll(/https?:\/\/[^\s"'<>()`\\]*/g)) {
    if (!NAMENSRAEUME.has(m[0])) fehler.push(d + ': externe Adresse „' + m[0] + '“ (nur relative Pfade erlaubt)');
  }
  for (const m of t.matchAll(/(?:src|href)\s*=\s*["']\/\/|url\(\s*["']?\/\//g)) fehler.push(d + ': Adresse ohne Protokoll „' + m[0] + '“');
  if (/\bimport\s*\(|@import/.test(t) && d.endsWith('.css')) fehler.push(d + ': @import nicht erlaubt');
}

// 4c. Datenschutz: Name des Kindes (nur lokal prüfbar, kind.json ist nicht eingecheckt)
const kindDatei = path.join(WURZEL, 'kind.json');
if (fs.existsSync(kindDatei)) {
  try {
    const name = JSON.parse(fs.readFileSync(kindDatei, 'utf8')).KIND;
    if (name && name !== 'Kind') {
      const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      for (const d of dateien) {
        if (re.test(d) || re.test(fs.readFileSync(path.join(ZIEL, d)).toString('latin1')) || re.test(fs.readFileSync(path.join(ZIEL, d), 'utf8'))) {
          fehler.push('Datenschutz: der Name des Kindes steht in ' + d);
        }
      }
    }
  } catch (e) { fehler.push('kind.json nicht lesbar: ' + e.message); }
}

// ---------------------------------------------------------------------
for (const w of warnungen) console.log('⚠️  ' + w);
if (fehler.length) {
  console.log('❌ ' + fehler.length + ' Fehler beim Bauen der Web-App:');
  for (const f of fehler) console.log('  • ' + f);
  process.exit(1);
}
const groesse = dateien.reduce((s, d) => s + fs.statSync(path.join(ZIEL, d)).size, 0);
console.log('🌐 Web-App gebaut: ' + path.relative(WURZEL, ZIEL) + '/ (' + dateien.length + ' Dateien, ' + Math.round(groesse / 1024) + ' KB), Version ' + VERSION +
  (mitBildern ? ', mit Bildern' : ', ohne Bilder-Katalog'));
console.log('   Rätsel aus ' + path.relative(WURZEL, RAETSEL) + '/: ' + (daten.pakete.map((p) => p.paket + ' ' + p.art + ' (' + p.levels.length + ' Levels, „' + p.schluesselwort + '“)').join(', ') || 'keine Pakete'));
console.log('✅ Keine Fehler.');
