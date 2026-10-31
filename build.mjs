// Denk- und Programmier-Werkstatt – baut die PDFs aus src/ und raetsel/
//
//   node build.mjs                 ganzes Buch + Kopiervorlagen  → out/
//   node build.mjs --nur 03        nur Einheit 03 (Anleitung + Blätter) → out/teil-03.pdf
//   node build.mjs --nur rahmen    nur die Rahmenseiten (Titel, Sammelpass …)
//   node build.mjs --png           zusätzlich jede Seite als Bild → out/seiten/
//   node build.mjs --dpi 110       Auflösung der Seitenbilder (Standard 70)
//
// Braucht Node 20+, playwright-core und Google Chrome (oder WERKSTATT_CHROME=/pfad/zu/chrome),
// außerdem poppler (pdfinfo, pdftoppm), zbar (zbarimg), qrencode und Python mit fontTools.
// Mit Nix holt ./baue.sh alles.
//
// Datenschutz (AUFTRAG.md Abschnitt 8, Variante B): Der Name des Kindes steht nur in kind.json
// (nicht eingecheckt). In den Quellen steht {{KIND}}; hier wird er eingesetzt.
//
// Bricht ab, wenn ein Rätsel nicht eindeutig ist, eine Rechnung falsch ist, ein Blatt überläuft,
// ein Zeichen in der Schrift fehlt, ein QR-Code nicht lesbar ist oder der Name in den Quellen steht.

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pruefeAlle } from './werkzeuge/raetsel.mjs';
import { pruefeNamen } from './werkzeuge/pruefe-name.mjs';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(WURZEL, 'src');
const OUT = path.join(WURZEL, 'out');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const nur = opt('--nur', null);
const mitPng = args.includes('--png');
const dpi = parseInt(opt('--dpi', '70'), 10);

// ---------------------------------------------------------------------
// Name und Einstellungen
// ---------------------------------------------------------------------
const werkstatt = JSON.parse(fs.readFileSync(path.join(WURZEL, 'werkstatt.json'), 'utf8'));
const kindDatei = path.join(WURZEL, 'kind.json');
if (!fs.existsSync(kindDatei)) {
  console.error('❌ kind.json fehlt. Lege sie an (wird nicht eingecheckt):\n   cp kind.beispiel.json kind.json\n   und trag dort den Vornamen ein.');
  process.exit(2);
}
const kind = JSON.parse(fs.readFileSync(kindDatei, 'utf8'));
const KIND = String(kind.KIND || '').trim();
if (!KIND || /[{}<>&"]/.test(KIND)) { console.error('❌ kind.json: "KIND" fehlt oder enthält Sonderzeichen'); process.exit(2); }
const pagesBasis = (kind.pagesBasis || werkstatt.pagesBasis).replace(/\/?$/, '/');
const setzeName = (s) => s.replace(/\{\{KIND\}\}/g, KIND);

const alleFehler = [];
const namensFehler = pruefeNamen(KIND);
alleFehler.push(...namensFehler);
// Der Name in der Web-Adresse (QR-Codes) und im Repo-Namen ist so gewollt: keine Prüfung, keine Warnung

// ---------------------------------------------------------------------
// Rätsel prüfen und lösen (dieselben Daten wie die Web-App)
// ---------------------------------------------------------------------
const raetsel = pruefeAlle();
// Bei Teil-Builds (--nur 03) zählen nur Fehler in den Rätseln dieser Einheiten
const wichtig = (f) => !nur || !nur.split(',').some((m) => /^\d+$/.test(m)) ||
  nur.split(',').some((m) => /^\d+$/.test(m) && new RegExp('^e' + parseInt(m, 10) + '[.-]').test(f)) || !/^e\d+[\w-]*\.json/.test(f);
const raetselFehler = raetsel.fehler.filter(wichtig);
for (const f of raetsel.fehler.filter((x) => !wichtig(x))) console.log('⚠️  (andere Einheit) ' + f);
if (raetselFehler.length) {
  console.log('\n❌ Rätsel-Prüfung: ' + raetselFehler.length + ' Fehler');
  for (const f of raetselFehler) console.log('  • ' + f);
  process.exit(1);
}
console.log('🧩 ' + Object.keys(raetsel.raetsel).length + ' Rätsel gelöst und geprüft');

// QR-Codes (nur für Pakete mit Web-Levels): qrencode, Fehlerkorrektur M, Ruhezone 4 Module
const qr = {};
for (const p of Object.values(raetsel.pakete)) {
  if (!p.web) continue;
  const url = pagesBasis + '#' + p.paket;
  const svg = execFileSync('qrencode', ['-t', 'SVG', '-l', 'M', '-m', '4', '--svg-path', '-o', '-', url], { encoding: 'utf8' });
  qr[p.paket] = { url, svg: svg.replace(/<\?xml[^>]*>\s*/, '').replace(/<!--[\s\S]*?-->\s*/g, '') };
}

// ---------------------------------------------------------------------
// HTML zusammenbauen
// ---------------------------------------------------------------------
const buch = JSON.parse(fs.readFileSync(path.join(SRC, 'buch.json'), 'utf8'));
let teile = buch.teile;
if (nur) {
  const muster = nur.split(',');
  teile = teile.concat(buch.extras || []).filter((t) => muster.some((m) => /^\d+$/.test(m) ? t.startsWith('einheiten/' + m) : t.includes(m)));
  if (!teile.length) {
    console.error('Kein Teil passt zu --nur ' + nur);
    process.exit(2);
  }
}
const name = nur ? 'teil-' + nur.replace(/[^\w-]+/g, '_') : 'denk-werkstatt';

fs.mkdirSync(OUT, { recursive: true });
// Stylesheet mit eingesetztem Namen (für „Beispielsätze: {{KIND}}“) nach out/, Schriften relativ zu src/
fs.writeFileSync(path.join(OUT, 'styles.css'), setzeName(fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8')).replace(/url\("fonts\//g, 'url("../src/fonts/'));
const bausteine = fs.readdirSync(path.join(SRC, 'bausteine')).filter((d) => d.endsWith('.js')).sort();
const kernDateien = ['ausfuehrer.js', 'symbole.js', 'bilder.js'].filter((d) => fs.existsSync(path.join(WURZEL, 'web', 'kern', d)));
const daten = { raetsel: raetsel.raetsel, pakete: raetsel.pakete, qr, kind: KIND, titel: werkstatt.titel, stand: werkstatt.stand, teilBuild: !!nur };
const html =
  '<!doctype html>\n<html lang="de-AT">\n<head>\n<meta charset="utf-8">\n<title>' + KIND + 's ' + werkstatt.titel + '</title>\n' +
  '<link rel="stylesheet" href="styles.css">\n' +
  '<script>window.__WERKSTATT = ' + JSON.stringify(daten).replace(/</g, '\\u003c') + ';</script>\n' +
  kernDateien.map((d) => '<script src="../web/kern/' + d + '"></script>\n').join('') +
  bausteine.map((d) => '<script src="../src/bausteine/' + d + '"></script>\n').join('') +
  '<script src="../src/components.js"></script>\n</head>\n<body>\n' +
  teile.map((t) => '<!-- ===== ' + t + ' ===== -->\n' + setzeName(fs.readFileSync(path.join(SRC, t), 'utf8'))).join('\n') +
  '\n</body>\n</html>\n';
const htmlDatei = path.join(OUT, name + '.html');
fs.writeFileSync(htmlDatei, html);

function poppler(prog, a) {
  return execFileSync(prog, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}
function seitenAnzahl(pdf) {
  const m = poppler('pdfinfo', [pdf]).match(/Pages:\s+(\d+)/);
  return m ? +m[1] : 0;
}
function ziele(pdf) {
  // Benannte Sprungziele (Chrome legt sie für verlinkte ids an) → Seitenzahl
  const map = {};
  for (const z of poppler('pdfinfo', ['-dests', pdf]).split('\n')) {
    const m = z.match(/^\s*(\d+)\s+\[.*\]\s+"(.+)"\s*$/);
    if (m) map[m[2]] = +m[1];
  }
  return map;
}

// Zeichen, die eine Schrift wirklich enthält (fontTools)
function zeichenDerSchriften() {
  const cache = path.join(OUT, '.schrift-zeichen.json');
  const dateien = { Andika: ['Andika-Regular.ttf', 'Andika-Bold.ttf', 'Andika-Italic.ttf'], Nunito: ['Nunito-Variable.ttf', 'Nunito-Italic-Variable.ttf'] };
  const stempel = JSON.stringify(Object.values(dateien).flat().map((d) => fs.statSync(path.join(SRC, 'fonts', d)).mtimeMs));
  if (fs.existsSync(cache)) {
    const c = JSON.parse(fs.readFileSync(cache, 'utf8'));
    if (c.stempel === stempel) return c.zeichen;
  }
  const zeichen = {};
  for (const [fam, liste] of Object.entries(dateien)) {
    // Ein Zeichen zählt nur, wenn es in allen Schnitten der Familie vorhanden ist
    let gemeinsam = null;
    for (const d of liste) {
      const out = execFileSync('python3', ['-c', 'import sys; from fontTools.ttLib import TTFont; print(" ".join(str(c) for c in TTFont(sys.argv[1]).getBestCmap().keys()))', path.join(SRC, 'fonts', d)], { encoding: 'utf8' });
      const s = new Set(out.trim().split(/\s+/).map(Number));
      gemeinsam = gemeinsam ? new Set([...gemeinsam].filter((c) => s.has(c))) : s;
    }
    zeichen[fam] = [...gemeinsam];
  }
  fs.writeFileSync(cache, JSON.stringify({ stempel, zeichen }));
  return zeichen;
}

const chromePfad = process.env.WERKSTATT_CHROME;
const browser = await chromium.launch(chromePfad ? { executablePath: chromePfad } : { channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 665, height: 1100 } }); // 176 mm = Satzspiegel der Anleitung
  const konsole = [];
  page.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });
  page.on('pageerror', (e) => konsole.push(e.message));
  // Keine Anfragen ins Netz: nur Dateien aus dem Repo
  await page.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : (konsole.push('Netzwerk-Anfrage blockiert: ' + r.request().url()), r.abort())));
  await page.emulateMedia({ media: 'print' });
  await page.goto(pathToFileURL(htmlDatei).href);
  await page.waitForFunction(() => window.__fertig === true, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);

  const erg = await page.evaluate(() => window.__pruefe());
  alleFehler.push(...erg.fehler, ...konsole.map((k) => 'Browser: ' + k));

  // Jedes Zeichen muss in der Schrift sein, mit der es gesetzt ist
  const vorhanden = zeichenDerSchriften();
  for (const [fam, zeichen] of Object.entries(erg.zeichen)) {
    const v = new Set(vorhanden[fam] || []);
    if (!vorhanden[fam]) { alleFehler.push('Text in unbekannter Schrift „' + fam + '“: ' + zeichen.slice(0, 40).join('')); continue; }
    const fehlt = zeichen.filter((c) => !v.has(c.codePointAt(0)));
    if (fehlt.length) alleFehler.push('Zeichen fehlen in ' + fam + ': ' + fehlt.map((c) => '„' + c + '“ (U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ')').join(', '));
  }

  // PDF erzeugen, Seitenzahlen eintragen, nochmal erzeugen
  const pdf = path.join(OUT, name + '.pdf');
  const pdfOpt = { path: pdf, preferCSSPageSize: true, printBackground: true, outline: false, tagged: true };
  await page.pdf(pdfOpt);
  // Seitenzahlen eintragen, bis sie stabil sind: „(S. 17)“ kann Zeilen verlängern und Umbrüche verschieben
  let fehlend = [];
  let stabil = false;
  for (let runde = 0; runde < 4 && !stabil; runde++) {
    const vorher = JSON.stringify(ziele(pdf));
    fehlend = await page.evaluate((m) => window.__setzeSeiten(m), ziele(pdf));
    await page.pdf(pdfOpt);
    stabil = JSON.stringify(ziele(pdf)) === vorher;
  }
  if (!stabil) alleFehler.push('Seitenzahlen werden nicht stabil: das Eintragen von „(S. n)“ verschiebt immer wieder Seitenumbrüche');
  if (!nur) for (const f of fehlend) alleFehler.push('Seitenzahl für Ziel „' + f + '“ nicht gefunden');

  const zielMap = ziele(pdf);
  const festeIds = await page.evaluate(() => Array.from(document.querySelectorAll('.seite[id]'))
    .filter((s) => !s.closest('.loesungsmodus') && getComputedStyle(s).display !== 'none').map((s) => s.id));
  const gesamt = seitenAnzahl(pdf);
  console.log('\n📄 ' + path.relative(WURZEL, pdf) + ' – ' + gesamt + ' Seiten');

  // QR-Codes aus dem gerenderten Seitenbild zurücklesen
  const qrSoll = await page.evaluate(() => Array.from(document.querySelectorAll('m-qr'))
    .filter((q) => !q.closest('.loesungsmodus')).map((q) => ({ seite: q.closest('.seite') && q.closest('.seite').id, url: q.dataset.url })));
  const qrOrdner = path.join(OUT, '.qr-' + name);
  fs.rmSync(qrOrdner, { recursive: true, force: true });
  fs.mkdirSync(qrOrdner, { recursive: true });
  let qrGelesen = 0;
  const lies = (seite) => {
    const bild = path.join(qrOrdner, 's' + seite);
    poppler('pdftoppm', ['-r', '150', '-f', String(seite), '-l', String(seite), '-png', '-singlefile', pdf, bild]);
    try { return execFileSync('zbarimg', ['-q', '--raw', '-Sdisable', '-Sqrcode.enable', bild + '.png'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean); } catch (e) { return []; }
  };
  let alleSeiten = null; // nur nötig, wenn eine Seite kein Sprungziel hat (Teil-Builds)
  for (const q of qrSoll) {
    const s = zielMap[q.seite];
    if (s) {
      const gelesen = lies(s);
      if (!gelesen.includes(q.url)) alleFehler.push('QR-Code auf Seite ' + s + ' (' + q.seite + ') nicht lesbar oder falsch: soll ' + q.url + ', gelesen: ' + (gelesen.join(', ') || 'nichts'));
      else qrGelesen++;
    } else {
      if (!alleSeiten) alleSeiten = Array.from({ length: gesamt }, (_, i) => lies(i + 1));
      const treffer = alleSeiten.findIndex((g) => g.includes(q.url));
      if (treffer < 0) alleFehler.push('QR-Code ' + q.url + ' (' + q.seite + ') auf keiner Seite lesbar');
      else qrGelesen++;
    }
  }

  // Kopiervorlagen (nur die Seiten des Kindes)
  if (!nur) {
    await page.evaluate(() => document.body.classList.add('vorlagen'));
    const sichtbar = await page.evaluate(() => Array.from(document.querySelectorAll('.seite'))
      .filter((s) => !s.closest('.loesungsmodus') && getComputedStyle(s).display !== 'none').length);
    const vorlagenPdf = path.join(OUT, 'kopiervorlagen.pdf');
    await page.pdf({ ...pdfOpt, path: vorlagenPdf });
    const n = seitenAnzahl(vorlagenPdf);
    console.log('📄 ' + path.relative(WURZEL, vorlagenPdf) + ' – ' + n + ' Seiten');
    if (n !== sichtbar) alleFehler.push('Kopiervorlagen: ' + n + ' PDF-Seiten, aber ' + sichtbar + ' feste Seiten – irgendwo läuft eine Seite über oder es entsteht eine Leerseite');
    await page.evaluate(() => document.body.classList.remove('vorlagen'));
  } else {
    // Bei Teil-Builds: feste Seiten zählen gegen Abstand der Sprungziele
    for (let i = 0; i < festeIds.length - 1; i++) {
      const a = zielMap[festeIds[i]], b = zielMap[festeIds[i + 1]];
      if (a && b && b - a !== 1) alleFehler.push('Zwischen ' + festeIds[i] + ' (S. ' + a + ') und ' + festeIds[i + 1] + ' (S. ' + b + ') liegen ' + (b - a - 1) + ' Seiten zu viel');
    }
  }

  if (mitPng) {
    const ordner = path.join(OUT, nur ? 'seiten-' + nur.replace(/[^\w-]+/g, '_') : 'seiten');
    fs.rmSync(ordner, { recursive: true, force: true });
    fs.mkdirSync(ordner, { recursive: true });
    poppler('pdftoppm', ['-r', String(dpi), '-png', pdf, path.join(ordner, 's')]);
    console.log('🖼  Seitenbilder: ' + path.relative(WURZEL, ordner) + '/ (' + fs.readdirSync(ordner).length + ' Bilder, ' + dpi + ' dpi)');
  }

  const s = erg.statistik;
  console.log('🔢 Geprüft: ' + s.bausteine + ' Bausteine mit Lösung, ' + s.gleichungenText + ' Rechnungen im Text, ' + s.blaetter + ' feste Seiten/Blätter, ' +
    qrGelesen + '/' + qrSoll.length + ' QR-Codes zurückgelesen, ' + Object.values(erg.zeichen).reduce((a, z) => a + z.length, 0) + ' verschiedene Zeichen');
  if (erg.warnungen.length) {
    console.log('\n⚠️  ' + erg.warnungen.length + ' Warnung(en):');
    for (const w of erg.warnungen) console.log('  • ' + w);
  }
} finally {
  await browser.close();
}
if (alleFehler.length) {
  console.log('\n❌ ' + alleFehler.length + ' Fehler:');
  for (const f of alleFehler) console.log('  • ' + f);
} else {
  console.log('\n✅ Keine Fehler.');
}
process.exit(alleFehler.length ? 1 : 0);
