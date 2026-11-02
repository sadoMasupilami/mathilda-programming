/* =====================================================================
   Werkstatt-Kern: Logikrätsel (Einheit 12)
   Gemeinsam für Löser (werkzeuge/arten/logik.mjs), Blätter
   (src/bausteine/e12-logik.js) und Web-App (web/spiele/logik.js):
   - Bilder (SVG) für Tiere und Dinge, damit Blatt und App gleich aussehen
   - Hinweis-Regeln lesen und auswerten (wahr, falsch, und, oder, nicht)
   - Logikgitter lösen: Backtracking über alle Zuordnungen
   - eine fertige Zuordnung prüfen (die App bewertet nur das Ergebnis)
   Ohne Abhängigkeiten. Ergebnis: globalThis.WerkstattLogik

   Logikgitter: n Zeilen (Tiere) und n Spalten (Dinge), n = 2 bis 4.
   Jedes Tier hat genau ein Ding, jedes Ding gehört genau einem Tier.
   Regel-Text (nur in den Rätsel-Daten, nie auf dem Blatt):
     drache=apfel           der Drache hat (mag) den Apfel
     drache!=apfel          der Drache hat den Apfel nicht
     a & b                  und (beide Teile wahr)
     a | b                  oder (mindestens ein Teil wahr), bindet schwächer als &
   Satz-Text mit Bildern: "Der {drache} mag kein {eis}." – {name} zeigt Bild
   und Wort, {name|anderes Wort} ein anderes Wort.
   ===================================================================== */
(function (g) {
  'use strict';

  const T = '#1f2340';
  const s = (w) => ' stroke="' + T + '" stroke-width="' + (w || 3.2) + '" stroke-linejoin="round" stroke-linecap="round"';
  const fl = (f, w) => ' fill="' + f + '"' + s(w);
  const ohne = ' fill="none"';
  const auge = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"' + fl('#ffffff', 2.4) + '/>' +
    '<circle cx="' + (x + r * 0.15) + '" cy="' + (y + r * 0.15) + '" r="' + (r * 0.55) + '" fill="' + T + '"/>' +
    '<circle cx="' + (x + r * 0.35) + '" cy="' + (y - r * 0.2) + '" r="' + (r * 0.2) + '" fill="#ffffff"/>';

  // Farben (druckfreundlich, kräftig)
  const F = {
    drache: '#7cc96b', dracheDunkel: '#3f8a35', bauch: '#e9f7c9', gold: '#f2b705',
    weiss: '#ffffff', maehne: '#b58ae8', maehne2: '#f39bc8', schnauze: '#fde4f0',
    katze: '#f6a54a', katzeStreif: '#d9822b', katzeHell: '#fde3c2', nase: '#e94f64',
    hase: '#c7b29c', haseHell: '#f2e9df', ohrInnen: '#f7c0cf',
    eule: '#a8774a', euleHell: '#e8cfa8', euleDunkel: '#7a5432',
    apfel: '#e0453a', blatt: '#3aa856', stiel: '#8a5a32',
    tuete: '#e0a060', tueteDunkel: '#b8763a', kugel1: '#f39bc8', kugel2: '#fff3d6',
    teig: '#f6dfa8', creme: '#ffffff', glasur: '#f39bc8', kirsche: '#e0453a',
    karotte: '#f28c28', fisch: '#6cc0ef', fischDunkel: '#2b6fd6',
    rot: '#e0453a', blau: '#3a7be0', gelb: '#f5c518', gruen: '#3aa856',
  };

  // ---------------------------------------------------------------------
  // Bilder: Koordinaten 0–100, keine ids (Bilder kommen oft mehrfach vor)
  //   muetze: wo eine Mütze auf dem Kopf sitzt (Szene „Wer hat was?“): Mitte x, Unterkante y, Breite w, Drehung r
  // ---------------------------------------------------------------------
  const DRACHE =
    // Flügel und Schwanz
    '<path d="M30 60 C14 52 6 58 4 70 C12 66 16 70 16 76 C22 72 27 74 31 78 Z"' + fl(F.dracheDunkel, 2.8) + '/>' +
    '<path d="M70 60 C86 52 94 58 96 70 C88 66 84 70 84 76 C78 72 73 74 69 78 Z"' + fl(F.dracheDunkel, 2.8) + '/>' +
    '<path d="M66 88 C80 92 86 84 84 76 L90 74 L86 70 C92 86 82 98 64 94 Z"' + fl(F.drache, 2.8) + '/>' +
    // Körper und Bauch
    '<ellipse cx="50" cy="73" rx="21" ry="22"' + fl(F.drache) + '/>' +
    '<ellipse cx="50" cy="77" rx="12.5" ry="15"' + fl(F.bauch, 2.4) + '/>' +
    '<path d="M42 72 H58 M41 79 H59 M43 86 H57"' + ohne + s(1.8) + '/>' +
    // Füße
    '<ellipse cx="37" cy="94" rx="8" ry="4.5"' + fl(F.drache, 2.8) + '/>' +
    '<ellipse cx="63" cy="94" rx="8" ry="4.5"' + fl(F.drache, 2.8) + '/>' +
    // Hörnchen und Kopf
    '<path d="M33 27 L28 10 L41 22 Z"' + fl(F.gold, 2.6) + '/>' +
    '<path d="M67 27 L72 10 L59 22 Z"' + fl(F.gold, 2.6) + '/>' +
    '<ellipse cx="50" cy="37" rx="23" ry="19"' + fl(F.drache) + '/>' +
    '<ellipse cx="50" cy="45" rx="13" ry="8"' + fl(F.bauch, 2.4) + '/>' +
    '<circle cx="45.5" cy="44" r="1.6" fill="' + T + '"/><circle cx="54.5" cy="44" r="1.6" fill="' + T + '"/>' +
    '<path d="M44 49 C47 51.5 53 51.5 56 49"' + ohne + s(2.2) + '/>' +
    auge(40, 33, 5.5) + auge(60, 33, 5.5);

  const EINHORN =
    // Mähne hinten
    '<path d="M30 30 C20 40 22 56 16 66 C26 66 30 60 32 54 C30 64 34 74 28 82 C40 80 42 68 40 58 Z"' + fl(F.maehne, 2.8) + '/>' +
    '<path d="M70 30 C80 40 78 56 84 66 C74 66 70 60 68 54 C70 64 66 74 72 82 C60 80 58 68 60 58 Z"' + fl(F.maehne2, 2.8) + '/>' +
    // Hals und Brust
    '<path d="M36 62 C34 76 30 88 28 98 L72 98 C70 88 66 76 64 62 Z"' + fl(F.weiss) + '/>' +
    // Ohren
    '<path d="M33 30 L28 12 L42 24 Z"' + fl(F.weiss, 2.8) + '/>' +
    '<path d="M67 30 L72 12 L58 24 Z"' + fl(F.weiss, 2.8) + '/>' +
    '<path d="M32 26 L30.5 18 L37 24 Z" fill="' + F.maehne2 + '"/><path d="M68 26 L69.5 18 L63 24 Z" fill="' + F.maehne2 + '"/>' +
    // Kopf und Schnauze
    '<ellipse cx="50" cy="42" rx="20" ry="21"' + fl(F.weiss) + '/>' +
    '<ellipse cx="50" cy="56" rx="14" ry="10"' + fl(F.schnauze, 2.6) + '/>' +
    '<ellipse cx="45" cy="56" rx="1.6" ry="2.2" fill="' + T + '"/><ellipse cx="55" cy="56" rx="1.6" ry="2.2" fill="' + T + '"/>' +
    '<path d="M45 61 C48 63 52 63 55 61"' + ohne + s(2) + '/>' +
    auge(42, 40, 5) + auge(58, 40, 5) +
    '<circle cx="35" cy="49" r="3" fill="' + F.maehne2 + '" opacity="0.7"/><circle cx="65" cy="49" r="3" fill="' + F.maehne2 + '" opacity="0.7"/>' +
    // Stirnlocke und Horn
    '<path d="M40 24 C44 18 54 18 58 23 C54 22 50 26 48 30 C46 26 43 24 40 24 Z"' + fl(F.maehne, 2.4) + '/>' +
    '<path d="M45 23 L51 1 L56 22 Z"' + fl(F.gold, 2.6) + '/>' +
    '<path d="M47 16 L54 13 M46.5 20 L55 17"' + ohne + s(1.8) + '/>';

  const KATZE =
    // Schwanz
    '<path d="M70 90 C86 92 92 80 88 66 C86 60 90 56 94 58" fill="none" stroke="' + T + '" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M70 90 C86 92 92 80 88 66 C86 60 90 56 94 58" fill="none" stroke="' + F.katze + '" stroke-width="5" stroke-linecap="round"/>' +
    // Körper
    '<path d="M30 98 C26 80 32 64 50 62 C68 64 74 80 70 98 Z"' + fl(F.katze) + '/>' +
    '<path d="M40 98 C38 84 42 74 50 72 C58 74 62 84 60 98 Z" fill="' + F.katzeHell + '"/>' +
    '<path d="M42 98 V90 M58 98 V90"' + ohne + s(2) + '/>' +
    // Ohren
    '<path d="M27 38 L25 10 L46 24 Z"' + fl(F.katze) + '/>' +
    '<path d="M73 38 L75 10 L54 24 Z"' + fl(F.katze) + '/>' +
    '<path d="M30 31 L29.5 17 L40 25 Z" fill="' + F.katzeHell + '"/><path d="M70 31 L70.5 17 L60 25 Z" fill="' + F.katzeHell + '"/>' +
    // Kopf
    '<ellipse cx="50" cy="42" rx="26" ry="22"' + fl(F.katze) + '/>' +
    '<path d="M44 21 L46 28 M50 20 V28 M56 21 L54 28"' + ohne + ' stroke="' + F.katzeStreif + '" stroke-width="2.6" stroke-linecap="round"/>' +
    '<ellipse cx="50" cy="52" rx="11" ry="8" fill="' + F.katzeHell + '"/>' +
    '<path d="M46.5 48 L53.5 48 L50 52 Z" fill="' + F.nase + '" stroke="' + T + '" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M50 52 V55 M50 55 C47 58 44 57 43 55 M50 55 C53 58 56 57 57 55"' + ohne + s(2) + '/>' +
    '<path d="M38 50 L22 47 M38 54 L23 56 M62 50 L78 47 M62 54 L77 56"' + ohne + s(1.6) + '/>' +
    '<ellipse cx="40" cy="39" rx="5" ry="6"' + fl('#bfe08a', 2.2) + '/><ellipse cx="60" cy="39" rx="5" ry="6"' + fl('#bfe08a', 2.2) + '/>' +
    '<ellipse cx="40" cy="39.5" rx="1.8" ry="4.2" fill="' + T + '"/><ellipse cx="60" cy="39.5" rx="1.8" ry="4.2" fill="' + T + '"/>';

  const HASE =
    // Ohren
    '<path d="M38 36 C30 22 30 4 38 3 C46 4 46 22 44 36 Z"' + fl(F.hase) + '/>' +
    '<path d="M62 36 C70 22 70 4 62 3 C54 4 54 22 56 36 Z"' + fl(F.hase) + '/>' +
    '<path d="M38.5 30 C35 20 35 10 38.5 9 C42 10 42 20 41 30 Z" fill="' + F.ohrInnen + '"/>' +
    '<path d="M61.5 30 C65 20 65 10 61.5 9 C58 10 58 20 59 30 Z" fill="' + F.ohrInnen + '"/>' +
    // Körper
    '<path d="M30 98 C26 82 32 66 50 64 C68 66 74 82 70 98 Z"' + fl(F.hase) + '/>' +
    '<ellipse cx="50" cy="86" rx="13" ry="12" fill="' + F.haseHell + '"/>' +
    '<ellipse cx="38" cy="96" rx="9" ry="4"' + fl(F.haseHell, 2.6) + '/><ellipse cx="62" cy="96" rx="9" ry="4"' + fl(F.haseHell, 2.6) + '/>' +
    // Kopf
    '<ellipse cx="50" cy="50" rx="22" ry="19"' + fl(F.hase) + '/>' +
    '<ellipse cx="50" cy="58" rx="10" ry="7" fill="' + F.haseHell + '"/>' +
    '<ellipse cx="50" cy="54" rx="3.2" ry="2.4" fill="' + F.nase + '" stroke="' + T + '" stroke-width="1.4"/>' +
    '<path d="M50 56.5 V59 M50 59 C48 61.5 45.5 61 45 59 M50 59 C52 61.5 54.5 61 55 59"' + ohne + s(1.8) + '/>' +
    '<path d="M46 63 H54 V67 H46 Z" fill="#ffffff" stroke="' + T + '" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 63 V67"' + ohne + s(1.2) + '/>' +
    auge(41, 47, 4.6) + auge(59, 47, 4.6) +
    '<circle cx="35" cy="56" r="2.8" fill="' + F.ohrInnen + '"/><circle cx="65" cy="56" r="2.8" fill="' + F.ohrInnen + '"/>';

  const EULE =
    // Ohrbüschel
    '<path d="M26 26 L22 8 L38 20 Z"' + fl(F.euleDunkel, 2.8) + '/>' +
    '<path d="M74 26 L78 8 L62 20 Z"' + fl(F.euleDunkel, 2.8) + '/>' +
    // Körper
    '<path d="M50 14 C76 14 84 36 82 58 C80 82 68 96 50 96 C32 96 20 82 18 58 C16 36 24 14 50 14 Z"' + fl(F.eule) + '/>' +
    '<path d="M50 54 C64 54 70 66 68 78 C66 90 58 94 50 94 C42 94 34 90 32 78 C30 66 36 54 50 54 Z" fill="' + F.euleHell + '"/>' +
    '<path d="M42 66 C44 69 46 69 48 66 M52 66 C54 69 56 69 58 66 M38 76 C40 79 42 79 44 76 M48 78 C50 81 52 81 54 78 M58 76 C60 79 62 79 64 76"' + ohne + ' stroke="' + F.euleDunkel + '" stroke-width="2" stroke-linecap="round"/>' +
    // Flügel
    '<path d="M20 50 C10 62 12 80 24 88 C26 76 26 62 20 50 Z"' + fl(F.euleDunkel, 2.6) + '/>' +
    '<path d="M80 50 C90 62 88 80 76 88 C74 76 74 62 80 50 Z"' + fl(F.euleDunkel, 2.6) + '/>' +
    // Augen
    '<circle cx="37" cy="38" r="12"' + fl('#ffffff', 2.8) + '/><circle cx="63" cy="38" r="12"' + fl('#ffffff', 2.8) + '/>' +
    '<circle cx="38" cy="39" r="6" fill="' + T + '"/><circle cx="62" cy="39" r="6" fill="' + T + '"/>' +
    '<circle cx="40" cy="36.5" r="2" fill="#ffffff"/><circle cx="64" cy="36.5" r="2" fill="#ffffff"/>' +
    '<path d="M46 46 L54 46 L50 55 Z"' + fl(F.gold, 2.2) + '/>' +
    // Füße
    '<path d="M40 95 V99 M44 95 V99 M56 95 V99 M60 95 V99"' + ohne + ' stroke="' + F.gold + '" stroke-width="3.4" stroke-linecap="round"/>';

  const APFEL =
    '<path d="M50 30 C40 22 20 24 18 46 C16 68 32 92 44 90 C48 89 52 89 56 90 C68 92 84 68 82 46 C80 24 60 22 50 30 Z"' + fl(F.apfel) + '/>' +
    '<path d="M30 44 C30 38 34 34 38 33"' + ohne + ' stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>' +
    '<path d="M50 31 C50 22 52 16 56 10"' + ohne + ' stroke="' + T + '" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M50 31 C50 22 52 16 56 10"' + ohne + ' stroke="' + F.stiel + '" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M54 20 C60 8 74 8 80 12 C74 22 62 24 54 20 Z"' + fl(F.blatt, 2.6) + '/>' +
    '<path d="M56 19 C64 16 70 14 76 13"' + ohne + s(1.6) + '/>';

  const EIS =
    // Tüte (Stanitzel)
    '<path d="M28 50 L50 97 L72 50 Z"' + fl(F.tuete) + '/>' +
    '<path d="M35 58 L58 82 M41 52 L63 74 M50 52 L67 66 M65 58 L42 82 M59 52 L37 74 M50 52 L33 66"' + ohne + ' stroke="' + F.tueteDunkel + '" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M28 50 L50 97 L72 50 Z"' + ohne + s(3.2) + '/>' +
    // Kugeln
    '<path d="M26 50 C20 46 22 36 30 36 C30 26 46 24 50 32 C54 24 70 26 70 36 C78 36 80 46 74 50 C66 54 34 54 26 50 Z"' + fl(F.kugel2) + '/>' +
    '<circle cx="50" cy="24" r="15"' + fl(F.kugel1) + '/>' +
    '<path d="M42 18 C44 15 47 14 50 14"' + ohne + ' stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="50" cy="7" r="4.5"' + fl(F.kirsche, 2.4) + '/>';

  const KUCHEN =
    // Torte von der Seite: Teig, Creme, Glasur mit Tropfen, Kirsche
    '<path d="M14 46 L14 82 C14 90 86 90 86 82 L86 46 Z"' + fl(F.teig) + '/>' +
    '<path d="M14 64 C14 70 86 70 86 64 L86 70 C86 76 14 76 14 70 Z" fill="' + F.creme + '" stroke="' + T + '" stroke-width="2.2"/>' +
    '<ellipse cx="50" cy="46" rx="36" ry="11"' + fl(F.glasur) + '/>' +
    '<path d="M14 46 C14 54 18 58 20 54 C22 60 26 62 28 56 C30 62 36 64 38 58 C42 64 46 62 48 58 C52 64 58 62 60 57 C64 62 70 62 72 56 C76 60 80 58 82 54 C84 57 86 54 86 46"' + fl(F.glasur) + '/>' +
    '<path d="M28 42 L30 40 M40 39 L42 41 M60 40 L62 38 M70 44 L72 42 M50 48 L52 46"' + ohne + ' stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>' +
    '<path d="M50 38 C50 30 54 24 60 20"' + ohne + s(2.6) + '/>' +
    '<circle cx="50" cy="38" r="7.5"' + fl(F.kirsche, 2.8) + '/>' +
    '<circle cx="47.5" cy="35.5" r="2" fill="#ffffff" opacity="0.8"/>';

  const KAROTTE =
    '<path d="M60 22 C64 12 62 6 58 2 M62 22 C70 14 78 14 84 16 M64 26 C74 24 82 30 86 36"' + ohne + ' stroke="' + T + '" stroke-width="7.5" stroke-linecap="round"/>' +
    '<path d="M60 22 C64 12 62 6 58 2 M62 22 C70 14 78 14 84 16 M64 26 C74 24 82 30 86 36"' + ohne + ' stroke="' + F.blatt + '" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M54 22 C64 18 76 28 72 38 C62 62 36 86 18 92 C12 94 8 90 10 84 C16 66 40 34 54 22 Z"' + fl(F.karotte) + '/>' +
    '<path d="M50 36 L58 40 M40 50 L48 54 M30 66 L38 69 M22 78 L28 80"' + ohne + s(2.2) + '/>';

  const FISCH =
    '<path d="M74 50 L94 30 C96 42 96 58 94 70 Z"' + fl(F.fischDunkel) + '/>' +
    '<path d="M8 50 C18 28 44 22 62 30 C70 34 76 42 78 50 C76 58 70 66 62 70 C44 78 18 72 8 50 Z"' + fl(F.fisch) + '/>' +
    '<path d="M40 27 C46 16 58 16 62 28"' + fl(F.fischDunkel, 2.6) + '/>' +
    '<path d="M42 58 C48 66 56 66 58 60"' + fl(F.fischDunkel, 2.4) + '/>' +
    '<path d="M48 40 C52 44 52 52 48 58 M58 40 C62 44 62 52 58 58"' + ohne + ' stroke="' + F.fischDunkel + '" stroke-width="2.4" stroke-linecap="round"/>' +
    auge(26, 45, 5.2) +
    '<path d="M13 54 C16 56 19 56 21 54"' + ohne + s(2) + '/>';

  function muetze(farbe) {
    // Zipfelmütze mit Bommel, Krempe unten (Unterkante bei y = 92)
    return '<path d="M18 76 C20 52 34 26 62 14 C58 30 70 48 82 76 Z"' + fl(farbe) + '/>' +
      '<path d="M30 52 C40 50 56 50 68 54 M24 64 C38 62 60 62 76 66"' + ohne + ' stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>' +
      '<rect x="12" y="74" width="76" height="18" rx="7"' + fl('#ffffff') + '/>' +
      '<path d="M22 78 V88 M32 78 V88 M42 78 V88 M52 78 V88 M62 78 V88 M72 78 V88 M80 78 V88"' + ohne + ' stroke="' + farbe + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="64" cy="13" r="10"' + fl('#ffffff') + '/>' +
      '<path d="M58 10 L70 16 M60 18 L68 8 M64 3 V23"' + ohne + ' stroke="' + farbe + '" stroke-width="2" stroke-linecap="round" opacity="0.7"/>';
  }

  const BILDER = {
    drache: { wort: 'Drache', svg: DRACHE, muetze: { x: 50, y: 26, w: 40, r: 0 } },
    einhorn: { wort: 'Einhorn', svg: EINHORN, muetze: { x: 68, y: 28, w: 32, r: 24 } },
    katze: { wort: 'Katze', svg: KATZE, muetze: { x: 50, y: 26, w: 38, r: -8 } },
    hase: { wort: 'Hase', svg: HASE, muetze: { x: 50, y: 35, w: 30, r: 0 } },
    eule: { wort: 'Eule', svg: EULE, muetze: { x: 50, y: 19, w: 38, r: 0 } },
    apfel: { wort: 'Apfel', svg: APFEL },
    eis: { wort: 'Eis', svg: EIS },
    kuchen: { wort: 'Kuchen', svg: KUCHEN },
    karotte: { wort: 'Karotte', svg: KAROTTE },
    fisch: { wort: 'Fisch', svg: FISCH },
    'muetze-rot': { wort: 'rote Mütze', kurz: 'rot', svg: muetze(F.rot), istMuetze: true },
    'muetze-blau': { wort: 'blaue Mütze', kurz: 'blau', svg: muetze(F.blau), istMuetze: true },
    'muetze-gelb': { wort: 'gelbe Mütze', kurz: 'gelb', svg: muetze(F.gelb), istMuetze: true },
    'muetze-gruen': { wort: 'grüne Mütze', kurz: 'grün', svg: muetze(F.gruen), istMuetze: true },
  };

  const hat = (name) => Object.prototype.hasOwnProperty.call(BILDER, name);
  // Wort zu einem Namen: eigenes Wort (woerter) vor dem Bild-Katalog, sonst der Name selbst
  function wort(name, woerter) {
    if (woerter && woerter[name]) return woerter[name];
    return hat(name) ? BILDER[name].wort : name;
  }
  function kurz(name, woerter) {
    if (woerter && woerter[name]) return woerter[name];
    return hat(name) ? (BILDER[name].kurz || BILDER[name].wort) : name;
  }
  // groesse: CSS-Länge ('12mm', '100%') oder Zahl (dann mm)
  function bild(name, groesse, titel) {
    if (!hat(name)) return '';
    const gr = typeof groesse === 'number' ? groesse + 'mm' : (groesse || '100%');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '" role="img" aria-label="' +
      (titel || BILDER[name].wort) + '">' + BILDER[name].svg + '</svg>';
  }
  // Szene: Tier mit Mütze auf dem Kopf und einem Ding in der Hand (unten rechts)
  function szeneBild(tier, dinge, groesse) {
    if (!hat(tier)) return '';
    const gr = typeof groesse === 'number' ? groesse + 'mm' : (groesse || '100%');
    const b = BILDER[tier];
    let inner = b.svg;
    const m = (dinge || []).find((d) => hat(d) && BILDER[d].istMuetze);
    if (m && b.muetze) {
      const k = b.muetze;
      const sc = k.w / 76;   // Krempe ist 76 breit, Unterkante bei y = 92, Mitte x = 50
      inner += '<g transform="translate(' + k.x + ' ' + k.y + ') rotate(' + k.r + ') scale(' + sc + ') translate(-50 -88)">' + BILDER[m].svg + '</g>';
    }
    const ding = (dinge || []).filter((d) => hat(d) && !BILDER[d].istMuetze);
    ding.forEach((d, i) => {
      inner += '<g transform="translate(' + (64 - i * 34) + ' 58) scale(0.46)">' + '<circle cx="50" cy="50" r="48" fill="#ffffff" stroke="' + T + '" stroke-width="3"/>' +
        '<g transform="translate(12 12) scale(0.76)">' + BILDER[d].svg + '</g></g>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -24 112 130" width="' + gr + '" height="' + gr + '" role="img" aria-label="' + b.wort + '">' + inner + '</svg>';
  }
  // Zeichen im Gitter: Kreis = Ja, Kreuz = Nein (viewBox 0–100)
  function zeichen(art, farbe, dick) {
    const f = farbe || T;
    const w = dick || 9;
    const inner = art === 'ja'
      ? '<circle cx="50" cy="50" r="31" fill="none" stroke="' + f + '" stroke-width="' + w + '"/>'
      : '<path d="M24 24 L76 76 M76 24 L24 76" fill="none" stroke="' + f + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' + inner + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Satz mit Bildern: "Der {drache} mag kein {eis}." -> Teile
  // ---------------------------------------------------------------------
  function satz(text, woerter) {
    const teile = [];
    const re = /\{([a-z0-9-]+)(?:\|([^}]*))?\}/g;
    let pos = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > pos) teile.push({ text: text.slice(pos, m.index) });
      teile.push({ name: m[1], bild: hat(m[1]), wort: m[2] !== undefined ? m[2] : wort(m[1], woerter) });
      pos = re.lastIndex;
    }
    if (pos < text.length) teile.push({ text: text.slice(pos) });
    return teile;
  }
  // Satz ohne Bilder (nur Wörter), z. B. für Meldungen
  function satzText(text, woerter) {
    return satz(text, woerter).map((t) => (t.text !== undefined ? t.text : t.wort)).join('');
  }
  const tokenNamen = (text) => satz(text).filter((t) => t.name).map((t) => t.name);

  // ---------------------------------------------------------------------
  // Regeln: "a=x & b!=y | c=z" -> { oder: [ { und: [ { a, x, nicht } ] } ] }
  // ---------------------------------------------------------------------
  function liesRegel(text) {
    const t = String(text || '').trim();
    if (!t) throw new Error('Leere Regel');
    const oder = t.split('|').map((teil) => {
      const und = teil.split('&').map((at) => {
        const m = at.trim().match(/^([a-z0-9-]+)\s*(!?=)\s*([a-z0-9-]+)$/);
        if (!m) throw new Error('Regel nicht lesbar: „' + at.trim() + '“ (erlaubt: a=x, a!=x, &, |)');
        return { a: m[1], x: m[3], nicht: m[2] === '!=' };
      });
      return { und };
    });
    return { oder };
  }
  function regelText(r) {
    return r.oder.map((k) => k.und.map((at) => at.a + (at.nicht ? '!=' : '=') + at.x).join(' & ')).join(' | ');
  }
  function atome(r) { return r.oder.reduce((a, k) => a.concat(k.und), []); }
  // Wert mit drei Möglichkeiten: true, false, null (noch offen). hatFn(a, x) -> true/false/null
  function wert(r, hatFn) {
    let offenOder = false;
    for (const k of r.oder) {
      let w = true;
      for (const at of k.und) {
        let v = hatFn(at.a, at.x);
        if (v !== null) v = at.nicht ? !v : v;
        if (v === false) { w = false; break; }
        if (v === null) w = null;
      }
      if (w === true) return true;
      if (w === null) offenOder = true;
    }
    return offenOder ? null : false;
  }
  // Teile eines Oder-Satzes einzeln auswerten (für die Prüfung „beide wahr?“)
  function teilWerte(r, hatFn) {
    return r.oder.map((k) => wert({ oder: [k] }, hatFn));
  }

  // ---------------------------------------------------------------------
  // Logikgitter lösen: Backtracking über alle Zuordnungen
  //   r: { zeilen, spalten, hinweise: [{ regel }] }, opt: { ohne: [Index…], nur: [Index…], max }
  //   -> { anzahl, loesungen: [{ zeile: spalte }], schritte }
  // ---------------------------------------------------------------------
  function loese(r, opt) {
    opt = opt || {};
    const zeilen = r.zeilen, spalten = r.spalten;
    const max = opt.max || 50;
    let idx = (r.hinweise || []).map((h, i) => i);
    if (opt.nur) idx = idx.filter((i) => opt.nur.includes(i));
    if (opt.ohne) idx = idx.filter((i) => !opt.ohne.includes(i));
    const regeln = idx.map((i) => liesRegel(r.hinweise[i].regel));
    const zu = {};          // zeile -> spalte
    const vergeben = {};    // spalte -> zeile
    const hatFn = (a, x) => {
      if (zu[a] !== undefined) return zu[a] === x;
      if (vergeben[x] !== undefined) return false;   // das Ding hat schon ein anderes Tier
      return null;
    };
    const loesungen = [];
    let anzahl = 0, schritte = 0;
    (function weiter(i) {
      if (anzahl >= max) return;
      if (i === zeilen.length) {
        anzahl++;
        loesungen.push(Object.assign({}, zu));
        return;
      }
      for (const x of spalten) {
        if (vergeben[x] !== undefined) continue;
        schritte++;
        zu[zeilen[i]] = x; vergeben[x] = zeilen[i];
        // zurückgehen, sobald ein Hinweis sicher falsch ist
        if (!regeln.some((rg) => wert(rg, hatFn) === false)) weiter(i + 1);
        delete zu[zeilen[i]]; delete vergeben[x];
      }
    })(0);
    return { anzahl, loesungen, schritte, abgebrochen: anzahl >= max };
  }

  // Fertiges Gitter prüfen (App): ja = { zeile: spalte } aus den Ja-Feldern (Kreisen)
  //   -> { ok, ohneJa: [zeilen ohne Kreis], doppelt: [zeilen/spalten mit mehr als einem Kreis], verletzt: [Hinweis-Index] }
  function pruefeGitter(r, jaListe) {
    const proZeile = {}, proSpalte = {};
    for (const [a, x] of jaListe) {
      (proZeile[a] = proZeile[a] || []).push(x);
      (proSpalte[x] = proSpalte[x] || []).push(a);
    }
    const ohneJa = r.zeilen.filter((a) => !proZeile[a]);
    const doppelt = r.zeilen.filter((a) => proZeile[a] && proZeile[a].length > 1)
      .concat(r.spalten.filter((x) => proSpalte[x] && proSpalte[x].length > 1));
    const verletzt = [];
    if (!ohneJa.length && !doppelt.length) {
      const zu = {};
      r.zeilen.forEach((a) => { zu[a] = proZeile[a][0]; });
      (r.hinweise || []).forEach((h, i) => {
        if (wert(liesRegel(h.regel), (a, x) => zu[a] === x) !== true) verletzt.push(i);
      });
    }
    return { ok: !ohneJa.length && !doppelt.length && !verletzt.length, ohneJa, doppelt, verletzt };
  }

  // Szene (Wahr oder falsch?): [{ tier, hat: [...] }] -> hatFn
  function szeneHat(szene) {
    const m = {};
    for (const t of szene) m[t.tier] = new Set(t.hat || []);
    return (a, x) => !!(m[a] && m[a].has(x));
  }

  g.WerkstattLogik = {
    BILDER, FARBEN: F, hat, wort, kurz, bild, szeneBild, zeichen,
    satz, satzText, tokenNamen,
    liesRegel, regelText, atome, wert, teilWerte, loese, pruefeGitter, szeneHat,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
