/* =====================================================================
   Werkstatt-Kern: Bilder für Ablauf-Karten (SVG)
   Einfache, freundliche, farbige Zeichnungen mit dicken dunklen
   Konturen (wie die Symbole in symbole.js). Jedes Bild ist ohne Text
   erkennbar; der Text steht zusätzlich auf der Karte.
   Dieselbe Datei verwenden die Blätter (src/bausteine/e3-ablauf.js)
   und die Web-App (Ablauf-Levels mit "bild" und "text").
   Koordinaten: 0–100. Keine ids, keine Masken (Bilder kommen oft
   mehrfach auf einer Seite vor).
   Ergebnis: globalThis.WerkstattBilder
   ===================================================================== */
(function (g) {
  'use strict';

  const T = '#1f2340';
  const F = {
    holz: '#c98a3e', krume: '#f6dfa8', butter: '#ffe27a', butterDunkel: '#f2b705',
    schinken: '#f39bb0', schinkenHell: '#fde0e7', gurke: '#7cc96b', gurkeHell: '#e3f5c8',
    kaese: '#ffd23f', teller: '#ffffff', tellerInnen: '#e8eefc', tisch: '#e0a060',
    haut: '#f9d2b0', haar: '#8a5a32', wasser: '#8fd3ff', schaum: '#ffffff',
    buerste: '#2b6fd6', tube: '#e94f64', becher: '#7cc96b', becken: '#ffffff',
    hose: '#3d6fb6', unterhose: '#9fd3f5', socken: '#e94f64', schuh: '#7a5cc8', sohle: '#ffffff',
    pulli: '#f07fb0', drache: '#7cc96b', dracheDunkel: '#3f8a35', bauch: '#e9f7c9', gold: '#f2b705',
    ei: '#d8f0c8', eiFleck: '#8fcf72', nest: '#b86b2c', nestHell: '#e0a060',
    schnee: '#ffffff', schneeSchatten: '#dceefe', boden: '#cfe6fb', karotte: '#f28c28', hut: '#2e3150',
  };
  const s = (w) => ' stroke="' + T + '" stroke-width="' + (w || 3.5) + '" stroke-linejoin="round" stroke-linecap="round"';
  const fl = (farbe, w) => ' fill="' + farbe + '"' + s(w);
  const linie = (w) => ' fill="none"' + s(w);

  // ---------------------------------------------------------------------
  // Bausteine für die Jause: Teller und Brotscheibe (Toast-Form)
  // ---------------------------------------------------------------------
  const TELLER_KLEIN = '<ellipse cx="50" cy="84" rx="45" ry="11"' + fl(F.teller) + '/>' +
    '<ellipse cx="50" cy="83" rx="31" ry="6"' + fl(F.tellerInnen, 2) + '/>';
  const BROT_RAND = 'M24 80 L24 44 C13 42 13 22 30 20 C38 9 62 9 70 20 C87 22 87 42 76 44 L76 80 Z';
  const BROT_INNEN = 'M30 74 L30 39 C22 37 21 28 33 26.5 C40 17 60 17 67 26.5 C79 28 78 37 70 39 L70 74 Z';
  function brot(innen) {
    return '<path d="' + BROT_RAND + '"' + fl(F.holz) + '/>' +
      '<path d="' + BROT_INNEN + '"' + fl(innen || F.krume, 2.5) + '/>';
  }
  const BUTTER_SCHWUNG = '<path d="M36 44 C44 40 54 48 64 42 M36 56 C46 52 54 60 64 54" fill="none" stroke="' + F.butterDunkel + '" stroke-width="3" stroke-linecap="round"/>';
  const SCHINKEN = '<path d="M31 40 C30 32 38 27 46 30 C52 25 62 27 66 33 C72 37 71 45 67 49 C71 56 68 65 61 67 C56 73 45 73 40 68 C32 68 28 60 31 54 C27 50 27 44 31 40 Z"' + fl(F.schinkenHell, 2.5) + '/>' +
    '<path d="M35 42 C35 36 41 32 47 35 C52 31 60 33 62 38 C67 41 66 47 63 50 C66 56 63 62 58 63 C54 68 46 68 43 64 C37 64 34 58 36 54 C33 51 33 46 35 42 Z" fill="' + F.schinken + '"/>' +
    '<path d="M42 46 C46 44 50 48 54 46 M44 56 C48 54 52 58 56 56" fill="none" stroke="#e07a94" stroke-width="2.4" stroke-linecap="round"/>';
  const KAESE = '<path d="M28 34 L72 34 L72 72 L28 72 Z"' + fl(F.kaese, 2.5) + '/>' +
    '<circle cx="40" cy="45" r="5"' + fl('#f2b705', 2) + '/><circle cx="60" cy="52" r="6.5"' + fl('#f2b705', 2) + '/>' +
    '<circle cx="42" cy="63" r="3.5"' + fl('#f2b705', 2) + '/><circle cx="63" cy="40" r="3"' + fl('#f2b705', 2) + '/>';
  function gurkenScheibe(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + fl(F.gurke, 2.5) + '/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 3.5) + '" fill="' + F.gurkeHell + '"/>' +
      '<circle cx="' + (cx - 2.5) + '" cy="' + (cy - 1.5) + '" r="1.2" fill="#8fbf5a"/><circle cx="' + (cx + 2.5) + '" cy="' + (cy - 1.5) + '" r="1.2" fill="#8fbf5a"/><circle cx="' + cx + '" cy="' + (cy + 2.5) + '" r="1.2" fill="#8fbf5a"/>';
  }
  const GURKEN = gurkenScheibe(40, 42, 10) + gurkenScheibe(60, 47, 10) + gurkenScheibe(46, 62, 10);

  // ---------------------------------------------------------------------
  // Gesicht (für Zähne putzen), Blick nach vorne
  // ---------------------------------------------------------------------
  function gesicht(cx, cy, r, mund) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + fl(F.haut) + '/>' +
      // Haare
      '<path d="M' + (cx - r) + ' ' + (cy - 2) + ' C' + (cx - r) + ' ' + (cy - r * 1.25) + ' ' + (cx + r) + ' ' + (cy - r * 1.25) + ' ' + (cx + r) + ' ' + (cy - 2) +
      ' C' + (cx + r * 0.6) + ' ' + (cy - r * 0.55) + ' ' + (cx + r * 0.1) + ' ' + (cy - r * 0.7) + ' ' + (cx - r * 0.2) + ' ' + (cy - r * 0.45) +
      ' C' + (cx - r * 0.45) + ' ' + (cy - r * 0.7) + ' ' + (cx - r * 0.8) + ' ' + (cy - r * 0.5) + ' ' + (cx - r) + ' ' + (cy - 2) + ' Z"' + fl(F.haar, 3) + '/>' +
      // Augen
      '<circle cx="' + (cx - r * 0.38) + '" cy="' + (cy + r * 0.05) + '" r="2.6" fill="' + T + '"/>' +
      '<circle cx="' + (cx + r * 0.38) + '" cy="' + (cy + r * 0.05) + '" r="2.6" fill="' + T + '"/>' +
      // Wangen
      '<circle cx="' + (cx - r * 0.62) + '" cy="' + (cy + r * 0.35) + '" r="3.2" fill="#f4a3a3" opacity="0.8"/>' +
      '<circle cx="' + (cx + r * 0.62) + '" cy="' + (cy + r * 0.35) + '" r="3.2" fill="#f4a3a3" opacity="0.8"/>' +
      (mund || '');
  }
  function zahnbuerste(x1, y1, x2, y2) {
    // Griff von (x1,y1) nach (x2,y2), Kopf am Ende (x2,y2)
    const w = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    const l = Math.hypot(x2 - x1, y2 - y1);
    return '<g transform="translate(' + x1 + ' ' + y1 + ') rotate(' + w.toFixed(1) + ')">' +
      '<rect x="0" y="-4" width="' + l + '" height="8" rx="4"' + fl(F.buerste, 3) + '/>' +
      '<rect x="' + (l - 20) + '" y="-12" width="20" height="8" rx="2"' + fl('#ffffff', 2.5) + '/>' +
      '<path d="M' + (l - 16) + ' -12 V-4 M' + (l - 11) + ' -12 V-4 M' + (l - 6) + ' -12 V-4" fill="none" stroke="#9aa3c7" stroke-width="1.5"/>' +
      '</g>';
  }
  function tropfen(x, y, gr, farbe) {
    const k = gr || 1;
    return '<path d="M' + x + ' ' + (y - 6 * k) + ' C' + (x + 4 * k) + ' ' + (y - 1 * k) + ' ' + (x + 4 * k) + ' ' + (y + 3 * k) + ' ' + x + ' ' + (y + 3 * k) +
      ' C' + (x - 4 * k) + ' ' + (y + 3 * k) + ' ' + (x - 4 * k) + ' ' + (y - 1 * k) + ' ' + x + ' ' + (y - 6 * k) + ' Z"' + fl(farbe || F.wasser, 2) + '/>';
  }
  function blase(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"' + fl(F.schaum, 2) + '/>'; }

  // ---------------------------------------------------------------------
  // Drachen-Ei: Nest, Ei, Baby
  // ---------------------------------------------------------------------
  const NEST_HINTEN = '<path d="M10 70 C12 60 88 60 90 70 Z"' + fl(F.nestHell, 3) + '/>';
  const NEST_VORNE = '<path d="M8 70 C10 94 90 94 92 70 C80 78 20 78 8 70 Z"' + fl(F.nest, 3.5) + '/>' +
    '<path d="M16 78 C30 84 44 80 56 86 M44 78 C58 82 70 78 84 80 M24 86 C36 88 46 90 60 89" fill="none" stroke="' + F.nestHell + '" stroke-width="2.6" stroke-linecap="round"/>';
  function ei(dreh) {
    const rot = dreh ? ' transform="rotate(' + dreh + ' 50 72)"' : '';
    return '<g' + rot + '><ellipse cx="50" cy="48" rx="22" ry="28"' + fl(F.ei) + '/>' +
      '<circle cx="42" cy="38" r="4" fill="' + F.eiFleck + '"/><circle cx="58" cy="48" r="5" fill="' + F.eiFleck + '"/><circle cx="45" cy="60" r="3.5" fill="' + F.eiFleck + '"/><circle cx="57" cy="31" r="2.5" fill="' + F.eiFleck + '"/></g>';
  }
  const WACKEL = '<path d="M16 36 C12 42 12 50 16 56 M22 40 C19 44 19 48 22 52 M84 36 C88 42 88 50 84 56 M78 40 C81 44 81 48 78 52"' + linie(3) + '/>';
  const RISS = '<path d="M30 46 L36 40 L41 47 L47 39 L52 47 L58 40 L63 47 L70 42"' + linie(3) + '/>' +
    '<path d="M47 39 L45 31 M58 40 L62 33"' + linie(2.5) + '/>';
  const SCHALE_UNTEN = '<path d="M28 52 L35 46 L41 53 L47 45 L53 53 L59 46 L65 53 L72 48 C74 70 66 78 50 78 C34 78 26 70 28 52 Z"' + fl(F.ei) + '/>' +
    '<circle cx="44" cy="66" r="3.5" fill="' + F.eiFleck + '"/><circle cx="58" cy="62" r="4" fill="' + F.eiFleck + '"/>';
  function babyKopf(cx, cy) {
    return '<path d="M' + (cx - 11) + ' ' + (cy - 12) + ' L' + (cx - 15) + ' ' + (cy - 24) + ' L' + (cx - 4) + ' ' + (cy - 16) + ' Z M' + (cx + 11) + ' ' + (cy - 12) + ' L' + (cx + 15) + ' ' + (cy - 24) + ' L' + (cx + 4) + ' ' + (cy - 16) + ' Z"' + fl(F.gold, 2.5) + '/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="17" ry="15"' + fl(F.drache) + '/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + 6) + '" rx="10" ry="6" fill="' + F.bauch + '"/>' +
      '<circle cx="' + (cx - 6.5) + '" cy="' + (cy - 3) + '" r="4" fill="white"' + s(1.8) + '/><circle cx="' + (cx + 6.5) + '" cy="' + (cy - 3) + '" r="4" fill="white"' + s(1.8) + '/>' +
      '<circle cx="' + (cx - 6) + '" cy="' + (cy - 2.5) + '" r="2" fill="' + T + '"/><circle cx="' + (cx + 6) + '" cy="' + (cy - 2.5) + '" r="2" fill="' + T + '"/>' +
      '<path d="M' + (cx - 5) + ' ' + (cy + 6) + ' C' + (cx - 2) + ' ' + (cy + 9) + ' ' + (cx + 2) + ' ' + (cy + 9) + ' ' + (cx + 5) + ' ' + (cy + 6) + '"' + linie(2.2) + '/>';
  }

  // ---------------------------------------------------------------------
  // Schneemann
  // ---------------------------------------------------------------------
  const BODEN = '<path d="M4 88 C24 82 76 82 96 88 L96 96 L4 96 Z" fill="' + F.boden + '"/>' +
    '<path d="M4 88 C24 82 76 82 96 88"' + linie(3) + '/>';
  function flocke(x, y, r) {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const w = Math.PI / 3 * i + Math.PI / 2;
      const dx = Math.round(r * Math.cos(w) * 10) / 10, dy = Math.round(r * Math.sin(w) * 10) / 10;
      d += 'M' + (x - dx) + ' ' + (y - dy) + ' L' + (x + dx) + ' ' + (y + dy) + ' ';
    }
    return '<path d="' + d.trim() + '"' + linie(2) + '/>';
  }
  const FLOCKEN = flocke(14, 20, 5) + flocke(86, 16, 5) + flocke(82, 46, 4) + flocke(18, 52, 3.5);
  const KUGEL_GROSS = '<circle cx="50" cy="68" r="20"' + fl(F.schnee) + '/><path d="M36 78 C42 84 58 84 64 78" fill="none" stroke="' + F.schneeSchatten + '" stroke-width="4" stroke-linecap="round"/>';
  const KUGEL_MITTEL = '<circle cx="50" cy="39" r="14"' + fl(F.schnee) + '/><circle cx="50" cy="35" r="2" fill="' + T + '"/><circle cx="50" cy="43" r="2" fill="' + T + '"/>';
  const KUGEL_KOPF = '<circle cx="50" cy="17" r="10"' + fl(F.schnee) + '/>' +
    '<circle cx="46" cy="15" r="1.6" fill="' + T + '"/><circle cx="54" cy="15" r="1.6" fill="' + T + '"/>' +
    '<path d="M50 18 L60 20 L50 21 Z" fill="' + F.karotte + '"' + s(1.5) + '/>';
  const HUT = '<path d="M38 9 H62" ' + linie(4) + '/><rect x="42" y="-4" width="16" height="12" rx="1.5"' + fl(F.hut, 2.5) + '/>' +
    '<rect x="37" y="7" width="26" height="4" rx="2"' + fl(F.hut, 2.5) + '/><path d="M42 4 H58" stroke="#d1335b" stroke-width="2.5"/>';

  // etwas kleiner, damit der Hut ins Bild passt (Boden bleibt bei y = 88)
  function schneemann(inhalt) { return '<g transform="translate(7.5 13.2) scale(0.85)">' + inhalt + '</g>'; }

  // ---------------------------------------------------------------------
  // Der Katalog
  // ---------------------------------------------------------------------
  const BILDER = {
    // Jause
    teller:
      '<rect x="4" y="74" width="92" height="22" rx="4"' + fl(F.tisch, 3) + '/>' +
      '<ellipse cx="50" cy="66" rx="44" ry="17"' + fl(F.teller) + '/>' +
      '<ellipse cx="50" cy="65" rx="29" ry="10"' + fl(F.tellerInnen, 2.2) + '/>' +
      '<path d="M78 16 V40 M72 16 V30 C72 36 84 36 84 30 V16" ' + linie(3) + '/>' +
      '<path d="M78 40 V52"' + linie(5) + '/>',
    brot: TELLER_KLEIN + brot(),
    butter: TELLER_KLEIN + brot(F.butter) + BUTTER_SCHWUNG +
      '<g transform="rotate(-38 80 30)"><rect x="74" y="-6" width="12" height="28" rx="5"' + fl('#9aa3c7', 3) + '/>' +
      '<path d="M74 22 H86 L85 50 C85 56 75 56 75 50 Z"' + fl('#eef0f7', 3) + '/>' +
      '<path d="M76 44 C78 50 83 50 85 44 L85 50 C85 56 75 56 75 50 Z" fill="' + F.butter + '"' + s(2) + '/></g>',
    schinken: TELLER_KLEIN + brot(F.butter) + SCHINKEN,
    gurke: TELLER_KLEIN + brot(F.butter) + GURKEN,
    kaese: TELLER_KLEIN + brot(F.butter) + KAESE,
    essen: TELLER_KLEIN +
      '<path d="M24 80 L24 44 C13 42 13 22 30 20 C38 9 50 8 56 11 C55 18 62 22 67 19 C67 26 74 30 79 27 C83 33 81 40 76 44 L76 80 Z"' + fl(F.holz) + '/>' +
      '<path d="M30 74 L30 39 C22 37 21 28 33 26.5 C40 18 48 16 52 17.5 C54 24 61 28 66 27 C68 32 73 35 74 35 C74 37 72 39 70 39 L70 74 Z"' + fl(F.butter, 2.5) + '/>' +
      '<path d="M33 45 C32 38 39 34 46 37 C52 33 60 36 61 42 C66 45 65 52 61 55 C64 62 60 68 54 68 C49 72 41 71 38 67 C32 66 30 60 33 56 C30 53 30 48 33 45 Z" fill="' + F.schinken + '"' + s(2.5) + '/>' +
      '<circle cx="84" cy="56" r="2.2" fill="' + F.holz + '"/><circle cx="90" cy="64" r="1.6" fill="' + F.holz + '"/><circle cx="83" cy="68" r="1.8" fill="' + F.holz + '"/>',

    // Zähne putzen
    zahnpasta:
      zahnbuerste(8, 78, 66, 78) +
      '<path d="M50 64 C50 58 56 56 60 58 C64 55 68 58 66 63 Z"' + fl('#ffffff', 2.2) + '/>' +
      '<path d="M53 61 C56 59 60 60 63 61" fill="none" stroke="#5ab0e8" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g transform="rotate(35 70 32)"><path d="M54 6 H86 L82 50 H58 Z"' + fl(F.tube) + '/>' +
      '<path d="M56 12 H84" ' + linie(2.5) + '/><rect x="64" y="50" width="12" height="7" rx="1.5"' + fl('#ffffff', 2.5) + '/>' +
      '<path d="M60 24 H80 M61 32 H79" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/></g>',
    putzen:
      gesicht(46, 50, 32,
        '<ellipse cx="46" cy="68" rx="11" ry="7"' + fl('#b8394f', 2.8) + '/>' +
        '<rect x="38" y="63" width="16" height="4" rx="1.5" fill="white"/>') +
      zahnbuerste(96, 66, 50, 68) +
      blase(34, 74, 4) + blase(58, 76, 3.5) + blase(30, 66, 2.8) + blase(62, 82, 2.5) + blase(40, 80, 3),
    ausspucken:
      '<path d="M8 66 H92 C92 86 74 96 50 96 C26 96 8 86 8 66 Z"' + fl(F.becken) + '/>' +
      '<path d="M18 66 C18 80 32 88 50 88 C68 88 82 80 82 66"' + linie(2.2) + '/>' +
      '<ellipse cx="50" cy="80" rx="5" ry="2.5" fill="' + T + '"/>' +
      gesicht(44, 28, 20, '<ellipse cx="47" cy="40" rx="4.5" ry="3.5"' + fl('#b8394f', 2.2) + '/>') +
      tropfen(49, 52, 0.9, F.schaum) + tropfen(53, 61, 0.8, F.wasser) + tropfen(46, 66, 0.7, F.schaum) +
      '<path d="M86 66 V50 C86 44 78 44 76 46"' + linie(4) + '/>',
    ausspuelen:
      gesicht(40, 48, 30, '<ellipse cx="52" cy="62" rx="6" ry="4.5"' + fl('#b8394f', 2.4) + '/>') +
      '<g transform="rotate(-28 74 66)"><path d="M58 50 H90 L86 88 H62 Z"' + fl(F.becher) + '/>' +
      '<path d="M60 58 H88" fill="none" stroke="' + F.wasser + '" stroke-width="4"/>' +
      '<path d="M58 50 H90"' + linie(3.5) + '/></g>' +
      tropfen(58, 76, 0.7) + tropfen(64, 86, 0.6),

    // Anziehen
    unterhose:
      '<path d="M12 26 H88 V40 C88 54 72 60 62 78 H38 C28 60 12 54 12 40 Z"' + fl(F.unterhose) + '/>' +
      '<path d="M12 36 H88"' + linie(3) + '/>' +
      '<path d="M26 44 C30 56 36 64 40 74 M74 44 C70 56 64 64 60 74" fill="none" stroke="#5aa0e6" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="34" cy="48" r="3" fill="#ffffff"/><circle cx="50" cy="56" r="3" fill="#ffffff"/><circle cx="66" cy="48" r="3" fill="#ffffff"/><circle cx="50" cy="44" r="2.4" fill="#ffffff"/>',
    hose:
      '<path d="M26 8 H74 L82 92 H58 L50 36 L42 92 H18 Z"' + fl(F.hose) + '/>' +
      '<path d="M26 18 H74"' + linie(3) + '/>' +
      '<path d="M34 8 V18 M50 8 V18 M66 8 V18" stroke="' + T + '" stroke-width="2.5"/>' +
      '<path d="M30 18 C32 26 38 28 42 26 M70 18 C68 26 62 28 58 26" fill="none" stroke="#9fc0ec" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M50 18 V34" stroke="#9fc0ec" stroke-width="2.5"/>',
    socken:
      '<g transform="translate(-10 0)"><path d="M30 8 H50 V56 C50 64 56 68 64 68 H68 C78 68 82 76 78 84 C76 90 70 92 62 92 H40 C32 92 30 86 30 78 Z"' + fl('#ffffff') + '/>' +
      '<path d="M30 8 H50 V22 H30 Z" fill="' + F.socken + '"' + s(3) + '/><path d="M30 32 H50 M30 42 H50" stroke="' + F.socken + '" stroke-width="4"/>' +
      '<path d="M62 92 C58 84 62 74 68 68" fill="none" stroke="' + F.socken + '" stroke-width="4"/></g>' +
      '<g transform="translate(26 -4)"><path d="M30 8 H50 V56 C50 64 56 68 64 68 H68 C78 68 82 76 78 84 C76 90 70 92 62 92 H40 C32 92 30 86 30 78 Z"' + fl('#ffffff') + '/>' +
      '<path d="M30 8 H50 V22 H30 Z" fill="' + F.socken + '"' + s(3) + '/><path d="M30 32 H50 M30 42 H50" stroke="' + F.socken + '" stroke-width="4"/>' +
      '<path d="M62 92 C58 84 62 74 68 68" fill="none" stroke="' + F.socken + '" stroke-width="4"/></g>',
    schuhe:
      '<g transform="translate(0 -22)"><path d="M8 72 C8 60 16 54 26 54 L38 54 C46 54 50 46 52 38 L64 38 C66 50 72 56 86 60 C94 62 94 76 90 80 L12 80 C9 79 8 76 8 72 Z"' + fl(F.schuh) + '/>' +
      '<path d="M8 72 H92" ' + linie(3) + '/><path d="M10 72 C8 78 10 80 12 80 L90 80 C93 78 93 74 92 72 Z" fill="' + F.sohle + '"' + s(3) + '/>' +
      '<path d="M54 46 L62 50 M52 52 L62 56 M48 56 L58 60" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></g>' +
      '<g transform="translate(0 16)"><path d="M8 72 C8 60 16 54 26 54 L38 54 C46 54 50 46 52 38 L64 38 C66 50 72 56 86 60 C94 62 94 76 90 80 L12 80 C9 79 8 76 8 72 Z"' + fl(F.schuh) + '/>' +
      '<path d="M8 72 H92" ' + linie(3) + '/><path d="M10 72 C8 78 10 80 12 80 L90 80 C93 78 93 74 92 72 Z" fill="' + F.sohle + '"' + s(3) + '/>' +
      '<path d="M54 46 L62 50 M52 52 L62 56 M48 56 L58 60" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></g>',
    pullover:
      '<path d="M36 12 C42 20 58 20 64 12 L82 18 C88 22 90 30 92 40 L96 74 L82 77 L74 44 V90 H26 V44 L18 77 L4 74 L8 40 C10 30 12 22 18 18 Z"' + fl(F.pulli) + '/>' +
      '<path d="M36 12 C42 22 58 22 64 12"' + linie(3) + '/>' +
      '<path d="M26 82 H74 M5.4 67 L19.2 70 M94.6 67 L80.8 70"' + linie(2.5) + '/>' +
      '<path d="M50 66 C44 60 38 56 38 50 C38 45 42 42 46 42 C48 42 50 44 50 46 C50 44 52 42 54 42 C58 42 62 45 62 50 C62 56 56 60 50 66 Z"' + fl('#ffffff', 2.5) + '/>',

    // Drachen-Ei
    ei: NEST_HINTEN + ei() + NEST_VORNE,
    eiwackelt: NEST_HINTEN + ei(-14) + WACKEL + NEST_VORNE,
    eirisse: NEST_HINTEN + ei(10) + RISS + WACKEL +
      '<path d="M26 22 L22 16 M74 22 L78 16 M50 12 V5"' + linie(2.5) + '/>' + NEST_VORNE,
    schluepfen: NEST_HINTEN + babyKopf(50, 42) +
      // obere Schale als Hütchen
      '<path d="M37 30 C38 16 62 16 63 30 L58 26 L53 31 L48 25 L43 31 Z" fill="' + F.ei + '"' + s(3) + '/>' +
      '<circle cx="48" cy="22" r="2.5" fill="' + F.eiFleck + '"/>' +
      SCHALE_UNTEN + NEST_VORNE,
    drachenbaby:
      // leeres Nest mit Schalen unten
      '<g transform="translate(26 54) scale(0.48)">' + NEST_HINTEN + SCHALE_UNTEN + NEST_VORNE + '</g>' +
      // fliegender kleiner Drache
      '<path d="M40 34 C30 18 16 16 6 22 C14 26 16 32 14 38 C22 34 30 36 36 42 Z"' + fl(F.dracheDunkel, 3) + '/>' +
      '<path d="M36 46 C30 54 20 56 12 52 L8 58 L6 48 C16 50 24 46 30 40 Z"' + fl(F.drache, 3) + '/>' +
      '<ellipse cx="46" cy="42" rx="17" ry="11"' + fl(F.drache) + '/>' +
      '<ellipse cx="46" cy="46" rx="10" ry="5" fill="' + F.bauch + '"/>' +
      '<path d="M52 34 C60 18 74 14 86 18 C78 22 76 28 78 34 C70 30 62 32 56 38 Z"' + fl(F.dracheDunkel, 3) + '/>' +
      '<path d="M66 22 L64 12 L72 18 Z M76 22 L78 12 L82 21 Z"' + fl(F.gold, 2.2) + '/>' +
      '<ellipse cx="72" cy="30" rx="13" ry="11"' + fl(F.drache) + '/>' +
      '<circle cx="76" cy="27" r="3.4" fill="white"' + s(1.5) + '/><circle cx="77" cy="27" r="1.7" fill="' + T + '"/>' +
      '<path d="M78 35 C81 36 84 35 86 33"' + linie(2) + '/>' +
      '<path d="M40 52 L38 58 M50 52 L50 58"' + linie(3) + '/>',

    // Schneemann
    schneekugel: BODEN + FLOCKEN + schneemann(KUGEL_GROSS),
    schneezwei: BODEN + FLOCKEN + schneemann(KUGEL_GROSS + KUGEL_MITTEL),
    schneedrei: BODEN + FLOCKEN + schneemann(KUGEL_GROSS + KUGEL_MITTEL + KUGEL_KOPF),
    schneehut: BODEN + FLOCKEN + schneemann(KUGEL_GROSS + KUGEL_MITTEL + KUGEL_KOPF + '<g transform="translate(0 2)">' + HUT + '</g>'),
  };

  // Ein Bild als eigenständiges <svg>. groesse: z. B. '22mm' oder '64' (px); ohne Angabe 100 %
  function bild(name, groesse, extra) {
    if (!BILDER[name]) throw new Error('Unbekanntes Bild „' + name + '“. Es gibt: ' + Object.keys(BILDER).join(', '));
    const gr = groesse === undefined ? '100%' : String(groesse);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '"' +
      (extra || '') + ' aria-hidden="true" overflow="visible">' + BILDER[name] + '</svg>';
  }
  function hat(name) { return Object.prototype.hasOwnProperty.call(BILDER, name); }

  g.WerkstattBilder = { BILDER, bild, hat, namen: () => Object.keys(BILDER) };
})(typeof globalThis !== 'undefined' ? globalThis : this);
