/* =====================================================================
   Werkstatt-Kern: Symbole und Gitter-Grafik (SVG)
   Einmal gezeichnet, überall gleich: Blätter, Anleitung, Befehlskarten,
   Web-App. Nie als Schriftzeichen (kein ← → ★ in Texten).
   Koordinaten der Symbole: 0–100. Feste Farben, damit Druck und
   Bildschirm gleich aussehen.
   Ergebnis: globalThis.WerkstattSymbole
   ===================================================================== */
(function (g) {
  'use strict';

  const FARBE = {
    tinte: '#1f2340',
    vor: '#2b6fd6',        // blau
    links: '#1f9d55',      // grün
    rechts: '#e8731a',     // orange (wie die markierte rechte Pfote)
    drache: '#7cc96b',
    dracheDunkel: '#3f8a35',
    bauch: '#e9f7c9',
    gold: '#f2b705',
    goldHell: '#fff4cc',
    stein: '#a3a8b8',
    steinDunkel: '#6b6f86',
    holz: '#b86b2c',
    holzHell: '#e0a060',
    rot: '#d1335b',
    feld: '#ffffff',
    feldLinie: '#1f2340',
    weg: '#d1335b',
    zauber: '#7a4fd1',
    zauberHell: '#f1ebff',
  };

  const T = FARBE.tinte;
  const strich = (w) => ' stroke="' + T + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"';

  function sternPfad(cx, cy, R, r, n) {
    n = n || 5; r = r || R * 0.45;
    let d = '';
    for (let i = 0; i < 2 * n; i++) {
      const rad = i % 2 === 0 ? R : r;
      const w = Math.PI / n * i - Math.PI / 2;
      d += (i ? 'L' : 'M') + (Math.round((cx + rad * Math.cos(w)) * 100) / 100) + ' ' + (Math.round((cy + rad * Math.sin(w)) * 100) / 100);
    }
    return d + 'Z';
  }

  // ---------------------------------------------------------------------
  // Befehle: dicker Pfeil auf weißem Grund, Farbe je Befehl
  //   vor:    gerader Pfeil nach oben
  //   links:  Pfeil, der nach oben geht und nach links abbiegt (Drehung auf der Stelle)
  //   rechts: gespiegelt
  // ---------------------------------------------------------------------
  const VOR = '<path d="M50 12 L80 46 L62 46 L62 88 L38 88 L38 46 L20 46 Z" fill="' + FARBE.vor + '"' + strich(4) + '/>';
  // Bogen: von unten Mitte hinauf, Viertelkreis nach links, Pfeilspitze zeigt nach links
  const LINKS = '<path d="M64 90 L64 52 C64 34 54 28 42 28 L38 28 L38 12 L10 37 L38 62 L38 46 L42 46 C44 46 46 48 46 52 L46 90 Z" fill="' + FARBE.links + '"' + strich(4) + '/>';
  const RECHTS = '<g transform="translate(100 0) scale(-1 1)"><path d="M64 90 L64 52 C64 34 54 28 42 28 L38 28 L38 12 L10 37 L38 62 L38 46 L42 46 C44 46 46 48 46 52 L46 90 Z" fill="' + FARBE.rechts + '"' + strich(4) + '/></g>';

  // ---------------------------------------------------------------------
  // Drache von oben, Nase nach oben (Blickrichtung). Rechte Pfote orange.
  // ---------------------------------------------------------------------
  const DRACHE =
    // Schwanz
    '<path d="M50 70 C50 84 42 90 34 92 L30 98 L26 90 C36 86 40 80 40 70 Z" fill="' + FARBE.drache + '"' + strich(3) + '/>' +
    // Flügel
    '<path d="M36 46 C22 38 12 42 6 54 C14 52 18 56 18 62 C24 58 30 60 34 64 Z" fill="' + FARBE.dracheDunkel + '"' + strich(3) + '/>' +
    '<path d="M64 46 C78 38 88 42 94 54 C86 52 82 56 82 62 C76 58 70 60 66 64 Z" fill="' + FARBE.dracheDunkel + '"' + strich(3) + '/>' +
    // Pfoten (vorne links grün, vorne rechts orange = rechte Pfote)
    '<ellipse cx="33" cy="44" rx="7" ry="6" fill="' + FARBE.drache + '"' + strich(3) + '/>' +
    '<ellipse cx="67" cy="44" rx="7" ry="6" fill="' + FARBE.rechts + '"' + strich(3) + '/>' +
    '<ellipse cx="35" cy="70" rx="6" ry="5.5" fill="' + FARBE.drache + '"' + strich(3) + '/>' +
    '<ellipse cx="65" cy="70" rx="6" ry="5.5" fill="' + FARBE.drache + '"' + strich(3) + '/>' +
    // Körper
    '<ellipse cx="50" cy="56" rx="17" ry="21" fill="' + FARBE.drache + '"' + strich(3.5) + '/>' +
    '<ellipse cx="50" cy="59" rx="9" ry="13" fill="' + FARBE.bauch + '" stroke="none"/>' +
    // Rückenzacken
    '<path d="M50 40 L46 46 L54 46 Z M50 50 L46 56 L54 56 Z M50 60 L46 66 L54 66 Z" fill="' + FARBE.gold + '"' + strich(2) + '/>' +
    // Kopf mit Hörnchen
    '<path d="M38 24 L34 14 L43 20 Z M62 24 L66 14 L57 20 Z" fill="' + FARBE.gold + '"' + strich(2.5) + '/>' +
    '<ellipse cx="50" cy="28" rx="14" ry="13" fill="' + FARBE.drache + '"' + strich(3.5) + '/>' +
    // Schnauze = Nase vorne (zeigt die Blickrichtung)
    '<path d="M41 22 C42 8 58 8 59 22 Z" fill="' + FARBE.drache + '"' + strich(3) + '/>' +
    '<circle cx="46.5" cy="13.5" r="1.6" fill="' + T + '"/><circle cx="53.5" cy="13.5" r="1.6" fill="' + T + '"/>' +
    // Augen
    '<circle cx="43" cy="26" r="3.6" fill="white"' + strich(1.5) + '/><circle cx="57" cy="26" r="3.6" fill="white"' + strich(1.5) + '/>' +
    '<circle cx="43" cy="25" r="1.8" fill="' + T + '"/><circle cx="57" cy="25" r="1.8" fill="' + T + '"/>' +
    // Blick-Pfeil vor der Nase
    '<path d="M50 0 L57 8 L43 8 Z" fill="' + T + '"/>';

  // ---------------------------------------------------------------------
  // Gegenstände im Gitter
  // ---------------------------------------------------------------------
  const SCHATZ =
    '<path d="M14 46 L86 46 L86 86 L14 86 Z" fill="' + FARBE.holz + '"' + strich(4) + '/>' +
    '<path d="M14 46 C14 20 86 20 86 46 Z" fill="' + FARBE.holzHell + '"' + strich(4) + '/>' +
    '<path d="M14 58 L86 58" fill="none"' + strich(3) + '/>' +
    '<path d="M30 28 L30 86 M70 28 L70 86" fill="none" stroke="' + FARBE.gold + '" stroke-width="6"/>' +
    '<path d="M30 28 L30 86 M70 28 L70 86" fill="none"' + strich(1.5) + ' stroke-dasharray="0"/>' +
    '<rect x="42" y="50" width="16" height="18" rx="3" fill="' + FARBE.gold + '"' + strich(3) + '/>' +
    '<circle cx="50" cy="58" r="2.5" fill="' + T + '"/>' +
    '<path d="' + sternPfad(80, 18, 8, 3.2, 4) + '" fill="' + FARBE.gold + '"' + strich(1.5) + '/>';
  const STERN = '<path d="' + sternPfad(50, 53, 44, 19) + '" fill="' + FARBE.gold + '"' + strich(4) + '/>';
  const STERN_LEER = '<path d="' + sternPfad(50, 53, 44, 19) + '" fill="white" stroke="' + FARBE.gold + '" stroke-width="5" stroke-linejoin="round"/>';
  const ZIEL =
    '<path d="M28 92 L28 10" fill="none"' + strich(5) + '/>' +
    '<path d="M28 12 L84 12 L84 52 L28 52 Z" fill="white"' + strich(4) + '/>' +
    '<path d="M28 12 H42 V26 H28 Z M56 12 H70 V26 H56 Z M42 26 H56 V40 H42 Z M70 26 H84 V40 H70 Z M28 40 H42 V52 H28 Z M56 40 H70 V52 H56 Z" fill="' + T + '"/>' +
    '<ellipse cx="28" cy="92" rx="12" ry="4" fill="' + FARBE.steinDunkel + '"/>';
  const HINDERNIS =
    '<path d="M10 82 C6 64 16 44 30 38 C36 22 58 16 70 28 C86 30 96 52 90 70 C92 80 86 88 74 88 L22 88 C14 88 10 86 10 82 Z" fill="' + FARBE.stein + '"' + strich(4) + '/>' +
    '<path d="M30 52 C36 48 42 50 44 56 M60 40 C66 40 70 44 70 50 M56 70 C62 66 70 68 72 74" fill="none" stroke="' + FARBE.steinDunkel + '" stroke-width="3.5" stroke-linecap="round"/>';
  const EDELSTEIN =
    '<path d="M14 38 L30 16 H70 L86 38 L50 88 Z" fill="#8fd3ff"' + strich(4) + '/>' +
    '<path d="M14 38 H86 M30 16 L40 38 L50 16 L60 38 L70 16 M40 38 L50 88 L60 38" fill="none"' + strich(2.5) + '/>';
  const KOBOLD =
    '<path d="M22 40 L4 26 L26 32 Z M78 40 L96 26 L74 32 Z" fill="#9ad16b"' + strich(3) + '/>' +
    '<ellipse cx="50" cy="66" rx="24" ry="22" fill="#c25a9e"' + strich(3.5) + '/>' +
    '<circle cx="50" cy="42" r="24" fill="#9ad16b"' + strich(3.5) + '/>' +
    '<path d="M28 30 C30 6 70 6 72 30 C62 24 38 24 28 30 Z" fill="#c25a9e"' + strich(3) + '/>' +
    '<circle cx="78" cy="10" r="5" fill="' + FARBE.gold + '"' + strich(2.5) + '/><path d="M70 22 L77 13" fill="none"' + strich(2.5) + '/>' +
    '<circle cx="41" cy="42" r="5" fill="white"' + strich(2) + '/><circle cx="59" cy="42" r="5" fill="white"' + strich(2) + '/>' +
    '<circle cx="42" cy="43" r="2.3" fill="' + T + '"/><circle cx="58" cy="43" r="2.3" fill="' + T + '"/>' +
    '<path d="M40 54 C46 60 54 60 60 54" fill="none"' + strich(3) + '/>' +
    '<path d="M46 56 L48 60 L50 56" fill="white"' + strich(1.5) + '/>';
  const HAKEN = '<path d="M14 54 L38 78 L86 24" fill="none" stroke="' + FARBE.links + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>';

  const SYMBOLE = {
    vor: VOR, links: LINKS, rechts: RECHTS, drache: DRACHE, schatz: SCHATZ, stern: STERN, sternLeer: STERN_LEER,
    ziel: ZIEL, hindernis: HINDERNIS, edelstein: EDELSTEIN, kobold: KOBOLD, haken: HAKEN,
  };
  const NAMEN = { vor: 'vor', links: 'links drehen', rechts: 'rechts drehen' };

  // Ein Symbol als eigenständiges <svg>. groesse: z. B. '14mm' oder '48' (px)
  function symbol(name, groesse, extra) {
    if (!SYMBOLE[name]) throw new Error('Unbekanntes Symbol „' + name + '“');
    const gr = groesse === undefined ? '100%' : String(groesse);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '"' +
      (extra || '') + ' aria-hidden="true">' + SYMBOLE[name] + '</svg>';
  }
  // Nur der Inhalt (für eigene <g>-Gruppen)
  function inhalt(name) { return SYMBOLE[name]; }

  // ---------------------------------------------------------------------
  // Gitter: ein Feld = 100 Einheiten. Gibt ein vollständiges <svg> zurück.
  //   welt: { b, h, start: {x, y, blick}, ziel, hindernisse, edelsteine, zielSymbol }
  //   opt.breite / opt.hoehe: Größe des <svg> (z. B. '120mm'); sonst viewBox-Größe
  //   opt.weg: Liste von Zuständen [{x, y, blick}] → rote Linie (Lösung)
  //   opt.drache: { x, y, blick } statt Start (z. B. Web-App während des Laufens)
  //   opt.ohneDrache, opt.geist: Drache am Ende des Wegs halb durchsichtig zeigen
  //   opt.stoss: { x, y } Feld, an dem der Kobold zugeschlagen hat
  //   opt.leer: Felder ohne Ziel/Edelsteine (zum Selberzeichnen)
  // ---------------------------------------------------------------------
  const DREH = { oben: 0, rechts: 90, unten: 180, links: 270 };
  function figur(name, x, y, blick, extra) {
    const r = DREH[blick || 'oben'] || 0;
    return '<g transform="translate(' + (x * 100 + 8) + ' ' + (y * 100 + 8) + ') rotate(' + r + ' 42 42) scale(0.84)"' + (extra || '') + '>' + SYMBOLE[name] + '</g>';
  }
  function gegenstand(name, x, y, gr) {
    const s = gr || 0.72;
    const o = (1 - s) * 50;
    return '<g transform="translate(' + (x * 100 + o) + ' ' + (y * 100 + o) + ') scale(' + s + ')">' + SYMBOLE[name] + '</g>';
  }
  function gitter(welt, opt) {
    opt = opt || {};
    const B = welt.b * 100, H = welt.h * 100;
    const rand = 6;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-rand) + ' ' + (-rand) + ' ' + (B + 2 * rand) + ' ' + (H + 2 * rand) + '"' +
      (opt.breite ? ' width="' + opt.breite + '"' : '') + (opt.hoehe ? ' height="' + opt.hoehe + '"' : '') +
      (opt.klasse ? ' class="' + opt.klasse + '"' : '') + ' role="img" aria-label="' + (opt.label || 'Gitter') + '">';
    s += '<rect x="0" y="0" width="' + B + '" height="' + H + '" fill="' + FARBE.feld + '"/>';
    if (opt.startFeld !== false && welt.start) {
      s += '<rect x="' + (welt.start.x * 100 + 4) + '" y="' + (welt.start.y * 100 + 4) + '" width="92" height="92" rx="10" fill="#eaf6e6"/>';
    }
    for (let i = 1; i < welt.b; i++) s += '<line x1="' + i * 100 + '" y1="0" x2="' + i * 100 + '" y2="' + H + '" stroke="' + FARBE.feldLinie + '" stroke-width="2.5"/>';
    for (let j = 1; j < welt.h; j++) s += '<line x1="0" y1="' + j * 100 + '" x2="' + B + '" y2="' + j * 100 + '" stroke="' + FARBE.feldLinie + '" stroke-width="2.5"/>';
    s += '<rect x="0" y="0" width="' + B + '" height="' + H + '" fill="none" stroke="' + FARBE.feldLinie + '" stroke-width="6" rx="4"/>';
    for (const [x, y] of welt.hindernisse || []) s += gegenstand('hindernis', x, y, 0.8);
    if (!opt.leer) {
      const gesammelt = new Set((opt.gesammelt || []).map((p) => p.join ? p.join(',') : p));
      for (const [x, y] of welt.edelsteine || []) if (!gesammelt.has(x + ',' + y)) s += gegenstand('edelstein', x, y, 0.6);
      if (welt.ziel) s += gegenstand(welt.zielSymbol || 'schatz', welt.ziel.x, welt.ziel.y, 0.74);
    }
    if (opt.weg && opt.weg.length) {
      const pkt = [[welt.start.x, welt.start.y]].concat(opt.weg.map((z) => [z.x, z.y]));
      const d = pkt.filter((p, i) => i === 0 || p[0] !== pkt[i - 1][0] || p[1] !== pkt[i - 1][1])
        .map((p, i) => (i ? 'L' : 'M') + (p[0] * 100 + 50) + ' ' + (p[1] * 100 + 50)).join(' ');
      s += '<path d="' + d + '" fill="none" stroke="' + FARBE.weg + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>';
    }
    if (opt.stoss) {
      s += '<circle cx="' + (opt.stoss.x * 100 + 50) + '" cy="' + (opt.stoss.y * 100 + 50) + '" r="46" fill="none" stroke="' + FARBE.rot + '" stroke-width="6" stroke-dasharray="14 10"/>';
    }
    if (!opt.ohneDrache && welt.start) {
      const d = opt.drache || welt.start;
      s += '<g class="drache-figur">' + figur('drache', d.x, d.y, d.blick) + '</g>';
    }
    if (opt.geist && opt.weg && opt.weg.length) {
      const e = opt.weg[opt.weg.length - 1];
      s += figur('drache', e.x, e.y, e.blick, ' opacity="0.45"');
    }
    s += '</svg>';
    return s;
  }

  g.WerkstattSymbole = { FARBE, NAMEN, SYMBOLE, symbol, inhalt, gitter, figur, sternPfad };
})(typeof globalThis !== 'undefined' ? globalThis : this);
