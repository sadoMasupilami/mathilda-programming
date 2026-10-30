// Schriften und App-Symbole für die Web-App erzeugen (läuft nur lokal, Ergebnis wird eingecheckt).
//
//   werkzeuge/mit-nix.sh node werkzeuge/schriften.mjs
//
// 1. Andika Regular und Bold aus src/fonts/*.ttf auf die benötigten Zeichen kürzen (pyftsubset,
//    WOFF2) → web/fonts/andika-regular.woff2, web/fonts/andika-bold.woff2
//    Dazu die Liste der wirklich enthaltenen Zeichen → web/fonts/zeichen.txt
//    (werkzeuge/web-bauen.mjs prüft damit jedes Zeichen der App-Texte und Level-Daten, auch in CI ohne Python)
//    und die Lizenztexte (SIL OFL) → web/fonts/OFL.txt, web/fonts/LIZENZEN.txt
// 2. App-Symbol (Drache aus web/kern/symbole.js) → web/icons/symbol.svg und PNG 180/192/512 (rsvg-convert)
//
// Braucht pyftsubset (fontTools + brotli), python3 und rsvg-convert: alles in werkzeuge/mit-nix.sh.
// Fehlt in zeichen.txt ein Zeichen, das ein Text braucht: unten in ZEICHEN ergänzen und neu laufen lassen.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(WURZEL, 'src', 'fonts');
const FONTS = path.join(WURZEL, 'web', 'fonts');
const ICONS = path.join(WURZEL, 'web', 'icons');

// Gewünschte Zeichen: Grundschrift (ASCII), Latin-1 (Umlaute, ß, é …) und typografische Zeichen
// (österreichische Anführungszeichen „…“, Gedankenstrich, Mal-Punkt ·, Auslassung …).
const BEREICHE = [
  [0x20, 0x7e],
  [0xa0, 0xff],
];
const EINZELN = [0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2026, 0x2022, 0x20ac, 0x2009, 0x202f, 0x2212];
const ZEICHEN = [];
for (const [a, b] of BEREICHE) for (let c = a; c <= b; c++) ZEICHEN.push(c);
ZEICHEN.push(...EINZELN);
const UNICODES = ZEICHEN.map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0')).join(',');

const SCHNITTE = [
  { quelle: 'Andika-Regular.ttf', ziel: 'andika-regular.woff2' },
  { quelle: 'Andika-Bold.ttf', ziel: 'andika-bold.woff2' },
];

fs.mkdirSync(FONTS, { recursive: true });
fs.mkdirSync(ICONS, { recursive: true });

// ---------------------------------------------------------------------
// 1. Schriften kürzen
// ---------------------------------------------------------------------
const enthalten = [];
for (const s of SCHNITTE) {
  const ziel = path.join(FONTS, s.ziel);
  execFileSync('pyftsubset', [
    path.join(QUELLE, s.quelle),
    '--unicodes=' + UNICODES,
    '--flavor=woff2',
    '--layout-features=kern,liga,locl,mark,mkmk,ccmp',
    '--no-hinting',
    '--desubroutinize',
    '--name-IDs=*',
    '--output-file=' + ziel,
  ], { stdio: 'inherit' });
  const cps = execFileSync('python3', ['-c',
    'import sys; from fontTools.ttLib import TTFont; print(" ".join(str(c) for c in sorted(TTFont(sys.argv[1]).getBestCmap().keys())))', ziel],
  { encoding: 'utf8' }).trim().split(/\s+/).map(Number);
  enthalten.push(new Set(cps));
  console.log('🔤 ' + s.ziel + ': ' + cps.length + ' Zeichen, ' + Math.round(fs.statSync(ziel).size / 1024) + ' KB');
}
// Ein Zeichen zählt nur, wenn es in beiden Schnitten vorhanden ist
const gemeinsam = [...enthalten[0]].filter((c) => enthalten.every((m) => m.has(c))).sort((a, b) => a - b);
const fehlend = ZEICHEN.filter((c) => !gemeinsam.includes(c));
if (fehlend.length) console.log('⚠️  Nicht in Andika: ' + fehlend.map((c) => 'U+' + c.toString(16).toUpperCase()).join(' '));
const name = (c) => (c === 0x20 ? 'Leerzeichen' : c === 0xa0 ? 'geschütztes Leerzeichen' : c === 0xad ? 'weicher Trennstrich' : c === 0x2009 ? 'schmales Leerzeichen' : c === 0x202f ? 'schmales geschütztes Leerzeichen' : String.fromCodePoint(c));
fs.writeFileSync(path.join(FONTS, 'zeichen.txt'),
  '# Zeichen in web/fonts/andika-regular.woff2 und andika-bold.woff2 (beide Schnitte)\n' +
  '# Erzeugt von werkzeuge/schriften.mjs – nicht von Hand ändern.\n' +
  '# werkzeuge/web-bauen.mjs prüft, dass jedes Zeichen der App-Texte und Level-Daten hier steht.\n' +
  gemeinsam.map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0') + ' ' + name(c)).join('\n') + '\n');

fs.copyFileSync(path.join(QUELLE, 'OFL-Andika.txt'), path.join(FONTS, 'OFL.txt'));
fs.writeFileSync(path.join(FONTS, 'LIZENZEN.txt'),
  'Schrift: Andika (Regular und Bold), Copyright SIL International.\n' +
  'Lizenz: SIL Open Font License 1.1, vollständiger Text in OFL.txt.\n' +
  '\n' +
  'Die Dateien andika-regular.woff2 und andika-bold.woff2 sind auf die Zeichen in zeichen.txt\n' +
  'gekürzt (pyftsubset aus fontTools) und ins Format WOFF2 umgewandelt. Erzeugt mit\n' +
  'werkzeuge/schriften.mjs aus src/fonts/Andika-Regular.ttf und src/fonts/Andika-Bold.ttf.\n' +
  'Die Schrift wird nur lokal mit der Web-App ausgeliefert, nicht von fremden Servern geladen.\n');

// ---------------------------------------------------------------------
// 2. App-Symbol: der Drache aus symbole.js auf blauem Grund, im Kreis (sicher für „maskable“)
// ---------------------------------------------------------------------
await import('../web/kern/symbole.js');
const S = globalThis.WerkstattSymbole;
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">' +
  '<rect width="512" height="512" fill="#3d5ccc"/>' +
  '<circle cx="256" cy="256" r="192" fill="#ffffff"/>' +
  '<circle cx="256" cy="256" r="192" fill="none" stroke="#1f2340" stroke-width="10"/>' +
  '<g transform="translate(106 106) scale(3)">' + S.inhalt('drache') + '</g>' +
  '</svg>\n';
fs.writeFileSync(path.join(ICONS, 'symbol.svg'), svg);
for (const gr of [180, 192, 512]) {
  execFileSync('rsvg-convert', ['-w', String(gr), '-h', String(gr), '-o', path.join(ICONS, 'symbol-' + gr + '.png'), path.join(ICONS, 'symbol.svg')]);
}
console.log('🐉 App-Symbol: web/icons/symbol.svg, symbol-180.png, symbol-192.png, symbol-512.png');
console.log('✅ ' + gemeinsam.length + ' Zeichen in web/fonts/zeichen.txt');
