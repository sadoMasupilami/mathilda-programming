/* =====================================================================
   Werkstatt-Kern: Ja-Nein-Bäume (Einheit 13)
   Gemeinsame Logik für den Löser (werkzeuge/arten/baum.mjs), die Blätter
   (src/bausteine/e13-baum.js) und die Web-App (web/spiele/baum.js).
   Keine Abhängigkeiten. Ergebnis: globalThis.WerkstattBaum

   Daten eines Rätsels (raetsel/e13.json, art "baum"):
     fragen: { "fluegel": { "text": "Hat es Flügel?", "kurz": "Flügel?" }, … }   (oder nur der Text)
     dinge:  [ { "id": "einhorn", "name": "Einhorn", "bild": "einhorn", "ja": ["horn", "pferd"] }, … ]
             Merkmals-Tabelle: Jede Frage in "ja" beantwortet das Ding mit Ja, alle anderen mit Nein.
     baum:   { "f": "fluegel", "ja": <Knoten>, "nein": <Knoten> }
             Ein Blatt des Baums (Antwort) ist die id eines Dings, null (leer) oder "?" (fehlt).
             "f": "?" ist eine fehlende Frage.
   Ja-Ast immer links (grün), Nein-Ast immer rechts (orange) – wie links drehen
   und rechts drehen. Pfade: "" ist die erste Frage oben, "ja.nein" heißt:
   erst den Ja-Ast, dann den Nein-Ast.
   Die Bilder (Wesen, Tiere, Drachen-Kinder) sind SVG mit Koordinaten 0–100
   und kommen auf Blättern und in der App gleich vor.
   ===================================================================== */
(function (g) {
  'use strict';

  const T = '#1f2340';
  const FARBE = {
    tinte: T, ja: '#1f9d55', nein: '#e8731a', frage: '#fff4cc', blatt: '#ffffff',
    rot: '#d1335b', grau: '#6b6f86', hell: '#f3f4f9', aktiv: '#fff0e3',
  };
  const s = (w) => ' stroke="' + T + '" stroke-width="' + (w || 3) + '" stroke-linejoin="round" stroke-linecap="round"';
  const fl = (f, w) => ' fill="' + f + '"' + s(w);
  const li = (w) => ' fill="none"' + s(w);
  const auge = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 2.4) + '" fill="' + T + '"/>' +
    '<circle cx="' + (x + (r || 2.4) * 0.35) + '" cy="' + (y - (r || 2.4) * 0.35) + '" r="' + ((r || 2.4) * 0.35) + '" fill="#ffffff"/>';
  const grosAuge = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"' + fl('#ffffff', 2.5) + '/>' + auge(x + r * 0.15, y + r * 0.1, r * 0.48);

  // ---------------------------------------------------------------------
  // Bilder
  // ---------------------------------------------------------------------
  // Pferd von der Seite (Einhorn, Flügelpferd), schaut nach rechts
  function pferd(o) {
    const k = o.koerper, m = o.maehne;
    let x = '';
    // Schweif
    x += '<path d="M21 50 C8 48 2 62 5 78 C9 72 12 69 16 69 C13 62 16 56 23 57 Z"' + fl(m, 2.5) + '/>';
    // hintere Beine (etwas dunkler)
    x += '<rect x="28" y="62" width="8" height="22" rx="3.5"' + fl(o.dunkel, 2.5) + '/><rect x="58" y="62" width="8" height="22" rx="3.5"' + fl(o.dunkel, 2.5) + '/>';
    // Flügel hinter dem Körper
    if (o.fluegel) {
      x += '<path d="M36 50 C20 42 14 22 22 6 C27 15 34 17 40 17 C38 24 42 29 48 30 C46 36 50 40 55 42 C50 48 43 51 36 50 Z"' + fl('#eaf4ff', 2.5) + '/>' +
        '<path d="M27 19 C31 28 36 35 42 42 M38 27 C41 33 45 38 49 42"' + li(2) + '/>';
    }
    // Körper
    x += '<ellipse cx="44" cy="56" rx="27" ry="15"' + fl(k, 3) + '/>';
    // vordere Beine
    x += '<rect x="20" y="63" width="8" height="22" rx="3.5"' + fl(k, 2.5) + '/><rect x="50" y="63" width="8" height="22" rx="3.5"' + fl(k, 2.5) + '/>';
    // Hufe
    for (const hx of [20, 28, 50, 58]) x += '<rect x="' + (hx - 0.5) + '" y="81" width="9" height="6" rx="2"' + fl(o.huf, 2) + '/>';
    // Hals und Kopf
    x += '<path d="M54 50 C56 40 59 31 63 24 L80 26 C78 36 75 45 71 54 Z"' + fl(k, 3) + '/>';
    x += '<path d="M61 23 C62 12 77 9 84 15 L94 29 C97 35 92 42 86 40 L71 36 C63 34 59 29 61 23 Z"' + fl(k, 3) + '/>';
    x += '<path d="M65 15 L65 4 L73 11 Z"' + fl(k, 2.5) + '/>';
    // Mähne
    x += '<path d="M70 9 C59 9 55 19 53 27 C51 35 49 42 45 48 L54 50 C57 42 60 34 64 27 C66 21 70 17 77 15 Z"' + fl(m, 2.5) + '/>';
    x += auge(76, 21, 2.4) + '<circle cx="89" cy="34" r="1.3" fill="' + T + '"/>';
    x += '<path d="M83 38 C85 39 87 39 88 38"' + li(1.6) + '/>';
    if (o.horn) {
      x += '<path d="M70 13 L85 0 L78 17 Z"' + fl('#f2b705', 2.5) + '/>' +
        '<path d="M74.5 11 L79.5 12.6 M78.5 6.6 L82.2 7.6"' + li(1.6) + '/>';
    }
    return x;
  }

  // Drache von vorne (Drachen-Kinder, Drache). o: { farbe, fluegel, krone, feuer }
  const DRACHEN_FARBE = {
    gruen: { k: '#7cc96b', d: '#3f8a35', b: '#e9f7c9' },
    blau: { k: '#7fb2f0', d: '#2f63b8', b: '#e6f0ff' },
  };
  function drache(o) {
    const f = DRACHEN_FARBE[o.farbe || 'gruen'];
    let x = '';
    if (o.fluegel) {
      x += '<path d="M36 50 C24 36 12 32 3 38 C9 42 9 48 6 54 C12 52 16 56 15 62 C22 58 28 60 32 64 Z"' + fl(f.d, 2.5) + '/>' +
        '<path d="M64 50 C76 36 88 32 97 38 C91 42 91 48 94 54 C88 52 84 56 85 62 C78 58 72 60 68 64 Z"' + fl(f.d, 2.5) + '/>';
    }
    // Schwanz
    x += '<path d="M64 80 C78 82 86 74 84 64 C88 68 92 66 92 60 C94 72 86 90 66 88 Z"' + fl(f.k, 2.5) + '/>';
    // Körper und Bauch
    x += '<path d="M50 40 C66 40 72 56 72 72 C72 86 62 92 50 92 C38 92 28 86 28 72 C28 56 34 40 50 40 Z"' + fl(f.k, 3) + '/>';
    x += '<path d="M50 52 C59 52 63 62 63 73 C63 82 57 86 50 86 C43 86 37 82 37 73 C37 62 41 52 50 52 Z" fill="' + f.b + '"/>';
    x += '<path d="M42 64 H58 M41 72 H59 M43 80 H57" fill="none" stroke="' + f.d + '" stroke-width="1.8" stroke-linecap="round"/>';
    // Arme und Füße
    x += '<path d="M31 62 C25 66 25 72 30 74"' + fl(f.k, 2.5) + '/><path d="M69 62 C75 66 75 72 70 74"' + fl(f.k, 2.5) + '/>';
    x += '<ellipse cx="38" cy="92" rx="8" ry="4.5"' + fl(f.k, 2.5) + '/><ellipse cx="62" cy="92" rx="8" ry="4.5"' + fl(f.k, 2.5) + '/>';
    // Kopf
    x += '<path d="M50 8 C64 8 72 17 72 28 C72 40 62 46 50 46 C38 46 28 40 28 28 C28 17 36 8 50 8 Z"' + fl(f.k, 3) + '/>';
    x += '<ellipse cx="50" cy="36" rx="11" ry="7" fill="' + f.b + '"/>';
    x += '<circle cx="46" cy="34" r="1.3" fill="' + T + '"/><circle cx="54" cy="34" r="1.3" fill="' + T + '"/>';
    x += '<path d="M43 40 C47 43 53 43 57 40"' + li(2.2) + '/>';
    x += grosAuge(40, 24, 5.2) + grosAuge(60, 24, 5.2);
    if (o.krone) {
      x += '<path d="M36 13 L38 -2 L44 6 L50 -5 L56 6 L62 -2 L64 13 Z"' + fl('#f2b705', 2.5) + '/>' +
        '<circle cx="50" cy="7" r="2" fill="#e94f64"/>';
    } else {
      x += '<path d="M44 10 L47 3 L50 9 L53 3 L56 10"' + fl(f.d, 2.2) + '/>';
    }
    if (o.feuer) {
      x += '<path d="M70 36 C80 30 86 34 98 26 C94 34 98 38 92 44 C96 46 92 52 86 50 C82 50 78 46 72 42 Z"' + fl('#f28c28', 2.2) + '/>' +
        '<path d="M74 39 C80 36 84 38 90 34 C88 40 90 43 85 45 C82 45 78 42 74 40 Z" fill="#ffd23f"/>';
    }
    return '<g transform="translate(3 6) scale(0.94)">' + x + '</g>';
  }

  const BILDER = {
    einhorn: pferd({ horn: true, koerper: '#ffffff', dunkel: '#eceaf6', maehne: '#c9a0ff', huf: '#b9bdd3' }),
    fluegelpferd: pferd({ fluegel: true, koerper: '#f6e7c8', dunkel: '#e8d4ad', maehne: '#b86b2c', huf: '#8a6a4a' }),
    drache: drache({ farbe: 'gruen', fluegel: true, feuer: true }),
    fee:
      // Flügel
      '<path d="M48 44 C36 26 18 22 12 32 C8 42 24 50 46 50 Z"' + fl('#cfe8ff', 2.5) + '/>' +
      '<path d="M52 44 C64 26 82 22 88 32 C92 42 76 50 54 50 Z"' + fl('#cfe8ff', 2.5) + '/>' +
      '<path d="M46 52 C32 54 22 64 28 70 C34 74 44 64 48 56 Z"' + fl('#e6f3ff', 2.5) + '/>' +
      '<path d="M54 52 C68 54 78 64 72 70 C66 74 56 64 52 56 Z"' + fl('#e6f3ff', 2.5) + '/>' +
      // Beine und Schuhe
      '<path d="M45 80 L44 92 M55 80 L56 92"' + li(3) + '/>' +
      '<ellipse cx="42.5" cy="93" rx="4" ry="2.6"' + fl('#c25a9e', 2) + '/><ellipse cx="57.5" cy="93" rx="4" ry="2.6"' + fl('#c25a9e', 2) + '/>' +
      // Kleid
      '<path d="M44 44 L56 44 L68 82 C56 86 44 86 32 82 Z"' + fl('#f07fb0', 3) + '/>' +
      '<path d="M38 70 L41 72 M50 74 L50 77 M60 70 L58 72"' + li(2) + '/>' +
      // Arme, Stab mit Stern
      '<path d="M45 48 C38 54 34 58 30 56"' + li(3) + '/>' +
      '<path d="M55 48 C62 50 66 46 70 40"' + li(3) + '/>' +
      '<path d="M71 40 L80 18"' + li(2.5) + '/>' +
      '<path d="M80 8 L82.6 14.4 L89.5 14.9 L84.2 19.3 L85.9 26 L80 22.4 L74.1 26 L75.8 19.3 L70.5 14.9 L77.4 14.4 Z"' + fl('#f2b705', 2) + '/>' +
      // Kopf mit Haaren
      '<path d="M36 30 C34 16 42 8 50 8 C58 8 66 16 64 30 C66 36 62 40 58 38 L42 38 C38 40 34 36 36 30 Z"' + fl('#f2c14e', 2.5) + '/>' +
      '<circle cx="50" cy="27" r="11"' + fl('#f9d2b0', 2.5) + '/>' +
      '<path d="M39 24 C42 15 58 15 61 24 C55 20 46 20 39 24 Z" fill="#f2c14e"/>' +
      auge(46, 27, 1.7) + auge(54, 27, 1.7) +
      '<path d="M46 32 C48 34 52 34 54 32"' + li(2) + '/>' +
      '<circle cx="43" cy="31" r="2" fill="#f7a8b8"/><circle cx="57" cy="31" r="2" fill="#f7a8b8"/>',
    meerjungfrau:
      // Wellen
      '<path d="M4 92 C12 87 20 87 28 92 C36 97 44 97 52 92 C60 87 68 87 76 92 C84 97 92 97 98 92"' + ' fill="none" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/>' +
      // Haare hinten
      '<path d="M34 22 C30 36 30 50 36 58 L64 58 C70 50 70 36 66 22 Z"' + fl('#f06a3c', 2.5) + '/>' +
      // Schwanz mit Flosse
      '<path d="M38 54 L62 54 C64 66 60 74 66 80 C70 84 76 84 80 82 L78 88 C70 92 58 88 52 80 C44 70 38 64 38 54 Z"' + fl('#3fb8a8', 3) + '/>' +
      '<path d="M78 84 C82 74 92 72 96 76 C92 80 90 84 92 90 C86 88 82 88 78 84 Z"' + fl('#2f9488', 2.5) + '/>' +
      '<path d="M44 62 C47 64 50 64 53 62 M48 70 C51 72 54 72 57 70 M54 77 C57 79 60 79 63 77"' + ' fill="none" stroke="#2f9488" stroke-width="2" stroke-linecap="round"/>' +
      // Körper und Arme
      '<path d="M42 38 L58 38 L60 56 L40 56 Z"' + fl('#f9d2b0', 3) + '/>' +
      '<path d="M41 44 C34 48 32 54 36 58 M59 44 C66 48 68 54 64 58"' + li(3) + '/>' +
      '<ellipse cx="45.5" cy="45" rx="4.5" ry="3.6"' + fl('#b98cf0', 2) + '/><ellipse cx="54.5" cy="45" rx="4.5" ry="3.6"' + fl('#b98cf0', 2) + '/>' +
      // Kopf
      '<circle cx="50" cy="26" r="11"' + fl('#f9d2b0', 2.5) + '/>' +
      '<path d="M38 26 C36 12 64 12 62 26 C58 18 44 18 38 26 Z"' + fl('#f06a3c', 2.5) + '/>' +
      auge(46, 27, 1.7) + auge(54, 27, 1.7) +
      '<path d="M46 32 C48 34 52 34 54 32"' + li(2) + '/>',
    eule:
      '<path d="M50 14 C70 14 80 30 80 52 C80 76 68 90 50 90 C32 90 20 76 20 52 C20 30 30 14 50 14 Z"' + fl('#b07a45', 3) + '/>' +
      '<path d="M26 22 L30 8 L40 18 Z"' + fl('#b07a45', 2.5) + '/><path d="M74 22 L70 8 L60 18 Z"' + fl('#b07a45', 2.5) + '/>' +
      '<path d="M50 50 C62 50 68 60 68 72 C68 82 60 88 50 88 C40 88 32 82 32 72 C32 60 38 50 50 50 Z" fill="#ecd3a8"/>' +
      '<path d="M42 62 L45 65 L48 62 M52 62 L55 65 L58 62 M44 72 L47 75 L50 72 M50 72 L53 75 L56 72 M46 81 L49 84 L52 81"' + ' fill="none" stroke="#8a5a32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M22 50 C14 58 14 72 24 80 C28 70 28 60 22 50 Z"' + fl('#8a5a32', 2.5) + '/><path d="M78 50 C86 58 86 72 76 80 C72 70 72 60 78 50 Z"' + fl('#8a5a32', 2.5) + '/>' +
      '<circle cx="38" cy="36" r="11"' + fl('#ffffff', 2.5) + '/><circle cx="62" cy="36" r="11"' + fl('#ffffff', 2.5) + '/>' +
      '<circle cx="38" cy="36" r="7" fill="#f2b705"/><circle cx="62" cy="36" r="7" fill="#f2b705"/>' +
      auge(38, 36, 4) + auge(62, 36, 4) +
      '<path d="M46 44 L54 44 L50 52 Z"' + fl('#f28c28', 2) + '/>' +
      '<path d="M40 90 L38 96 M44 90 L44 96 M56 90 L56 96 M60 90 L62 96"' + ' fill="none" stroke="#f28c28" stroke-width="3" stroke-linecap="round"/>',
    ente:
      '<path d="M4 80 C12 75 20 75 28 80 C36 85 44 85 52 80 C60 75 68 75 76 80 C84 85 92 85 98 80 L98 98 L4 98 Z" fill="#cfe6fb"/>' +
      '<path d="M4 80 C12 75 20 75 28 80 C36 85 44 85 52 80 C60 75 68 75 76 80 C84 85 92 85 98 80"' + ' fill="none" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M14 54 C10 46 16 42 22 46 C30 40 44 44 56 50 C62 46 66 50 64 56 C70 64 66 78 50 80 L28 80 C16 78 10 66 14 54 Z"' + fl('#ffd23f', 3) + '/>' +
      '<path d="M26 56 C34 52 44 54 50 62 C42 66 32 66 26 56 Z"' + fl('#f2b705', 2.5) + '/>' +
      '<circle cx="66" cy="34" r="15"' + fl('#ffd23f', 3) + '/>' +
      '<path d="M58 46 C56 50 56 52 58 54"' + li(2.5) + '/>' +
      '<path d="M78 34 C86 32 94 34 96 38 C92 42 84 42 78 40 Z"' + fl('#f28c28', 2.5) + '/>' +
      auge(69, 29, 2.4),
    fisch:
      '<path d="M70 50 L92 32 C94 44 94 56 92 68 Z"' + fl('#f28c28', 3) + '/>' +
      '<path d="M8 50 C18 30 38 22 56 26 C66 28 72 38 74 50 C72 62 66 72 56 74 C38 78 18 70 8 50 Z"' + fl('#ffa94d', 3) + '/>' +
      '<path d="M38 26 C44 16 54 14 60 20 C56 24 52 26 48 26 Z"' + fl('#f28c28', 2.5) + '/>' +
      '<path d="M40 74 C44 82 50 84 54 80 C50 78 48 76 46 74 Z"' + fl('#f28c28', 2.5) + '/>' +
      '<path d="M42 40 C46 44 46 52 42 56 M52 38 C56 44 56 54 52 60 M62 40 C65 46 65 54 62 58"' + ' fill="none" stroke="#d9661a" stroke-width="2.2" stroke-linecap="round"/>' +
      auge(24, 44, 3) +
      '<path d="M12 54 C15 56 18 56 20 55"' + li(2) + '/>' +
      '<circle cx="14" cy="22" r="3.5"' + ' fill="none" stroke="#5aa9e6" stroke-width="2"/><circle cx="8" cy="12" r="2.5"' + ' fill="none" stroke="#5aa9e6" stroke-width="2"/>',
    frosch:
      '<ellipse cx="50" cy="88" rx="44" ry="9"' + fl('#3f8a35', 2.5) + '/>' +
      // Hinterbeine
      '<path d="M22 70 C10 70 8 84 18 86 L32 86 C28 80 30 74 34 72 Z"' + fl('#5cb85c', 2.5) + '/>' +
      '<path d="M78 70 C90 70 92 84 82 86 L68 86 C72 80 70 74 66 72 Z"' + fl('#5cb85c', 2.5) + '/>' +
      // Körper
      '<path d="M50 36 C70 36 80 48 80 62 C80 76 66 84 50 84 C34 84 20 76 20 62 C20 48 30 36 50 36 Z"' + fl('#7cc96b', 3) + '/>' +
      '<path d="M50 56 C62 56 68 64 68 72 C68 80 60 84 50 84 C40 84 32 80 32 72 C32 64 38 56 50 56 Z" fill="#e3f5c8"/>' +
      // Vorderbeine
      '<path d="M38 70 L36 86 M62 70 L64 86"' + li(3) + '/>' +
      '<path d="M30 87 L36 85 L42 87 M58 87 L64 85 L70 87"' + li(2.5) + '/>' +
      // Augen oben
      '<circle cx="36" cy="34" r="10"' + fl('#7cc96b', 3) + '/><circle cx="64" cy="34" r="10"' + fl('#7cc96b', 3) + '/>' +
      grosAuge(36, 33, 6) + grosAuge(64, 33, 6) +
      '<path d="M32 52 C42 60 58 60 68 52"' + li(3) + '/>' +
      '<circle cx="28" cy="50" r="3" fill="#f7a8b8"/><circle cx="72" cy="50" r="3" fill="#f7a8b8"/>',
    katze:
      // Schwanz
      '<path d="M66 82 C82 84 90 72 86 58 C84 52 90 50 92 56 C98 72 88 92 66 90 Z"' + fl('#f2a65a', 2.5) + '/>' +
      // Körper
      '<path d="M50 44 C66 44 72 62 72 76 C72 88 62 92 50 92 C38 92 28 88 28 76 C28 62 34 44 50 44 Z"' + fl('#f2a65a', 3) + '/>' +
      '<path d="M50 58 C57 58 60 68 60 78 C60 86 56 90 50 90 C44 90 40 86 40 78 C40 68 43 58 50 58 Z" fill="#fde6c8"/>' +
      '<path d="M38 88 C38 92 44 93 46 90 M54 90 C56 93 62 92 62 88"' + li(2.5) + '/>' +
      // Kopf mit Ohren
      '<path d="M28 30 L26 8 L42 18 Z"' + fl('#f2a65a', 2.5) + '/><path d="M72 30 L74 8 L58 18 Z"' + fl('#f2a65a', 2.5) + '/>' +
      '<path d="M30 24 L29 13 L37 18 Z" fill="#f7a8b8"/><path d="M70 24 L71 13 L63 18 Z" fill="#f7a8b8"/>' +
      '<ellipse cx="50" cy="32" rx="22" ry="17"' + fl('#f2a65a', 3) + '/>' +
      '<path d="M44 16 L45 22 M50 15 L50 21 M56 16 L55 22"' + ' fill="none" stroke="#c76f22" stroke-width="2.2" stroke-linecap="round"/>' +
      auge(42, 30, 2.6) + auge(58, 30, 2.6) +
      '<path d="M47 36 L53 36 L50 39 Z" fill="#e07a94"/>' +
      '<path d="M50 39 C48 42 45 42 44 41 M50 39 C52 42 55 42 56 41"' + li(1.8) + '/>' +
      '<path d="M40 37 L26 35 M40 40 L27 42 M60 37 L74 35 M60 40 L73 42"' + li(1.4) + '/>' +
      '<path d="M32 60 L38 62 M30 70 L37 71 M68 60 L62 62 M70 70 L63 71"' + ' fill="none" stroke="#c76f22" stroke-width="2.2" stroke-linecap="round"/>',
    biene:
      // Flügel
      '<ellipse cx="40" cy="26" rx="12" ry="18" transform="rotate(-20 40 26)"' + fl('#dff1ff', 2.5) + '/>' +
      '<ellipse cx="58" cy="24" rx="11" ry="17" transform="rotate(18 58 24)"' + fl('#dff1ff', 2.5) + '/>' +
      // Beine
      '<path d="M34 66 L28 78 M46 70 L44 82 M58 68 L60 80"' + li(2.5) + '/>' +
      // Stachel
      '<path d="M84 52 L96 56 L84 60 Z"' + fl(T, 1.5) + '/>' +
      // Körper mit Streifen
      '<ellipse cx="56" cy="56" rx="28" ry="17"' + fl('#ffd23f', 3) + '/>' +
      '<path d="M48 40 C44 48 44 64 48 72 L56 73 C52 64 52 48 56 39 Z" fill="' + T + '"/>' +
      '<path d="M64 40 C60 48 60 64 64 72 L71 70 C68 62 68 50 71 42 Z" fill="' + T + '"/>' +
      '<ellipse cx="56" cy="56" rx="28" ry="17"' + li(3) + '/>' +
      // Kopf
      '<circle cx="24" cy="54" r="13"' + fl('#ffd23f', 3) + '/>' +
      '<path d="M20 42 C16 32 12 28 8 28 M28 42 C30 32 34 28 38 28"' + li(2.2) + '/>' +
      '<circle cx="8" cy="28" r="2.5" fill="' + T + '"/><circle cx="38" cy="28" r="2.5" fill="' + T + '"/>' +
      auge(20, 52, 2.4) +
      '<path d="M16 60 C19 62 22 62 24 60"' + li(2) + '/>',
    schnecke:
      '<path d="M8 86 C30 90 60 90 92 86"' + ' fill="none" stroke="#b9e3a0" stroke-width="4" stroke-linecap="round"/>' +
      // Körper
      '<path d="M10 84 C12 76 20 74 30 76 L70 76 C76 72 78 62 76 52 C82 50 88 54 88 62 C88 74 82 84 72 84 Z"' + fl('#f2d7a0', 3) + '/>' +
      '<path d="M78 52 L74 34 M84 54 L88 36"' + li(2.5) + '/>' +
      '<circle cx="74" cy="33" r="3" fill="' + T + '"/><circle cx="88" cy="35" r="3" fill="' + T + '"/>' +
      auge(81, 62, 2.2) +
      '<path d="M78 70 C80 72 84 72 86 70"' + li(2) + '/>' +
      // Haus
      '<circle cx="42" cy="52" r="26"' + fl('#e0a060', 3) + '/>' +
      '<path d="M42 52 C42 48 48 48 48 53 C48 60 38 60 37 52 C36 42 50 40 54 50 C58 62 44 70 34 64 C24 58 26 38 40 33 C54 28 66 40 66 52"' + li(2.8) + '/>',
    marienkaefer:
      // Beine
      '<path d="M26 44 L14 38 M24 58 L10 58 M26 72 L14 80 M74 44 L86 38 M76 58 L90 58 M74 72 L86 80"' + li(2.8) + '/>' +
      // Kopf
      '<circle cx="50" cy="22" r="13"' + fl(T, 2) + '/>' +
      '<path d="M44 12 C40 6 36 4 32 6 M56 12 C60 6 64 4 68 6"' + li(2.2) + '/>' +
      '<circle cx="45" cy="20" r="3" fill="#ffffff"/><circle cx="55" cy="20" r="3" fill="#ffffff"/>' +
      // Panzer
      '<path d="M50 30 C70 30 80 46 80 60 C80 78 66 90 50 90 C34 90 20 78 20 60 C20 46 30 30 50 30 Z"' + fl('#e0453a', 3) + '/>' +
      '<path d="M50 31 L50 90"' + li(2.5) + '/>' +
      '<circle cx="36" cy="48" r="5" fill="' + T + '"/><circle cx="64" cy="48" r="5" fill="' + T + '"/>' +
      '<circle cx="32" cy="66" r="5.5" fill="' + T + '"/><circle cx="68" cy="66" r="5.5" fill="' + T + '"/>' +
      '<circle cx="42" cy="80" r="4" fill="' + T + '"/><circle cx="58" cy="80" r="4" fill="' + T + '"/>',
    // kleine Zeichen für die Frage-Karten der Drachen-Kinder
    'zeichen-gruen': '<circle cx="50" cy="50" r="36"' + fl('#7cc96b', 5) + '/>',
    'zeichen-fluegel': '<path d="M8 76 C24 40 58 14 94 20 C84 30 86 40 92 50 C80 46 70 52 70 62 C58 56 46 60 38 72 C30 66 18 68 8 76 Z"' + fl('#3f8a35', 5) + '/>' +
      '<path d="M20 70 C40 46 62 30 90 22 M44 66 C56 50 66 40 90 22"' + li(4) + '/>',
    'zeichen-krone': '<path d="M14 76 L16 26 L34 48 L50 18 L66 48 L84 26 L86 76 Z"' + fl('#f2b705', 5) + '/>',
  };
  // Drachen-Kinder: "drachenkind-gruen-fluegel-krone", "drachenkind-blau" …
  function drachenkindTeile(name) {
    const t = String(name).split('-');
    if (t[0] !== 'drachenkind') return null;
    const o = { farbe: 'gruen', fluegel: false, krone: false };
    for (const w of t.slice(1)) {
      if (w === 'gruen' || w === 'blau') o.farbe = w;
      else if (w === 'fluegel') o.fluegel = true;
      else if (w === 'krone') o.krone = true;
      else return null;
    }
    return o;
  }
  function inhalt(name) {
    if (Object.prototype.hasOwnProperty.call(BILDER, name)) return BILDER[name];
    const o = drachenkindTeile(name);
    if (o) return drache(o);
    throw new Error('Unbekanntes Bild „' + name + '“. Es gibt: ' + namen().join(', ') + ', drachenkind-gruen|blau[-fluegel][-krone]');
  }
  function hat(name) {
    return Object.prototype.hasOwnProperty.call(BILDER, name) || !!drachenkindTeile(name);
  }
  function namen() { return Object.keys(BILDER).filter((n) => n.indexOf('zeichen-') !== 0); }
  // Ein Bild als eigenständiges <svg>. groesse: z. B. '22mm' oder '64' (px); ohne Angabe 100 %
  function bild(name, groesse, extra) {
    const gr = groesse === undefined ? '100%' : String(groesse);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '"' +
      (extra || '') + ' aria-hidden="true" overflow="visible">' + inhalt(name) + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Logik
  // ---------------------------------------------------------------------
  const istBlatt = (k) => k === null || k === undefined || typeof k !== 'object';
  const SEITEN = ['ja', 'nein'];
  function frageText(fragen, id, kurz) {
    if (id === '?') return '?';
    const f = fragen && fragen[id];
    if (f === undefined) throw new Error('Unbekannte Frage „' + id + '“');
    if (typeof f === 'string') return f;
    return (kurz && f.kurz) || f.text;
  }
  function antwort(ding, frage) {
    if (!ding) throw new Error('Ding fehlt');
    return (ding.ja || []).indexOf(frage) >= 0;
  }
  const pfadText = (weg) => weg.join('.');
  const wegVon = (pfad) => (pfad ? String(pfad).split('.') : []);
  function bei(baum, pfad) {
    let k = baum;
    for (const sch of wegVon(pfad)) {
      if (istBlatt(k)) throw new Error('Pfad „' + pfad + '“ geht über ein Blatt hinaus');
      k = k[sch];
    }
    return k;
  }
  function kopie(k) { return istBlatt(k) ? k : { f: k.f, ja: kopie(k.ja), nein: kopie(k.nein) }; }
  // neuer Baum, in dem der Knoten am Pfad ersetzt ist (fn bekommt die Kopie des alten Knotens)
  function aendere(baum, pfad, fn) {
    const weg = wegVon(pfad);
    const neu = kopie(baum);
    if (!weg.length) return fn(neu);
    let k = neu;
    for (let i = 0; i < weg.length - 1; i++) k = k[weg[i]];
    k[weg[weg.length - 1]] = fn(k[weg[weg.length - 1]]);
    return neu;
  }
  const tausche = (baum, pfad) => aendere(baum, pfad, (k) => ({ f: k.f, ja: k.nein, nein: k.ja }));
  const mitFrage = (baum, pfad, f) => aendere(baum, pfad, (k) => ({ f, ja: k.ja, nein: k.nein }));
  // Alle Antworten (Blätter des Baums) von links nach rechts: { pfad, weg, inhalt, nr, tiefe }
  function blaetter(baum) {
    const aus = [];
    (function geh(k, weg) {
      if (istBlatt(k)) { aus.push({ pfad: pfadText(weg), weg: weg.slice(), inhalt: k === undefined ? null : k, nr: aus.length + 1, tiefe: weg.length }); return; }
      geh(k.ja, weg.concat('ja'));
      geh(k.nein, weg.concat('nein'));
    })(baum, []);
    return aus;
  }
  // Alle Fragen im Baum: { pfad, weg, f, tiefe }
  function fragenImBaum(baum) {
    const aus = [];
    (function geh(k, weg) {
      if (istBlatt(k)) return;
      aus.push({ pfad: pfadText(weg), weg: weg.slice(), f: k.f, tiefe: weg.length });
      geh(k.ja, weg.concat('ja'));
      geh(k.nein, weg.concat('nein'));
    })(baum, []);
    return aus;
  }
  function tiefe(baum) { return istBlatt(baum) ? 0 : 1 + Math.max(tiefe(baum.ja), tiefe(baum.nein)); }
  // Einem Ding durch den Baum folgen: { weg, pfad, blatt (Inhalt), nr, fragen }
  function folge(baum, ding) {
    const weg = [];
    let k = baum;
    while (!istBlatt(k)) {
      if (k.f === '?') throw new Error('Der Baum hat noch eine fehlende Frage');
      const sch = antwort(ding, k.f) ? 'ja' : 'nein';
      weg.push(sch);
      k = k[sch];
    }
    const pfad = pfadText(weg);
    const nr = blaetter(baum).find((b) => b.pfad === pfad).nr;
    return { weg, pfad, blatt: k === undefined ? null : k, nr, fragen: weg.length };
  }
  // Einem Weg aus Antworten folgen ("ja nein ja"): { pfad, blatt, nr } oder null (Weg passt nicht)
  function wegFolgen(baum, antworten) {
    const weg = Array.isArray(antworten) ? antworten : String(antworten).trim().split(/[\s,]+/);
    let k = baum;
    for (const a of weg) {
      if (istBlatt(k) || SEITEN.indexOf(a) < 0) return null;
      k = k[a];
    }
    if (!istBlatt(k)) return null;
    const pfad = pfadText(weg);
    return { pfad, blatt: k === undefined ? null : k, nr: blaetter(baum).find((b) => b.pfad === pfad).nr };
  }
  // Wer landet wo? { pfad: [ding-ids] } (aus der Merkmals-Tabelle, ohne die Blätter anzuschauen)
  function bewohner(baum, dinge) {
    const aus = {};
    for (const b of blaetter(baum)) aus[b.pfad] = [];
    for (const d of dinge) aus[folge(baum, d).pfad].push(d.id);
    return aus;
  }
  // Ist der Baum richtig? Jedes Ding landet genau bei sich, keine zwei Dinge gleich, kein Blatt leer.
  // dinge: die Dinge, die im Baum vorkommen sollen.
  function pruefe(baum, dinge) {
    const fehler = [];
    const falsch = [];
    const bl = blaetter(baum);
    const ids = dinge.map((d) => d.id);
    const landet = {};
    for (const d of dinge) {
      const e = folge(baum, d);
      landet[d.id] = e;
      if (e.blatt !== d.id) falsch.push({ ding: d.id, pfad: e.pfad, nr: e.nr, bei: e.blatt });
    }
    const gezaehlt = {};
    for (const b of bl) {
      if (b.inhalt === null || b.inhalt === '?') continue;
      gezaehlt[b.inhalt] = (gezaehlt[b.inhalt] || 0) + 1;
      if (ids.indexOf(b.inhalt) < 0) fehler.push('Antwort „' + b.inhalt + '“ gibt es nicht in der Merkmals-Tabelle');
    }
    for (const id of ids) {
      if (!gezaehlt[id]) fehler.push('„' + id + '“ steht an keinem Platz im Baum');
      else if (gezaehlt[id] > 1) fehler.push('„' + id + '“ steht ' + gezaehlt[id] + '-mal im Baum');
    }
    const belegt = {};
    for (const d of dinge) {
      const p = landet[d.id].pfad;
      if (belegt[p]) fehler.push('„' + d.id + '“ und „' + belegt[p] + '“ landen am selben Platz');
      belegt[p] = d.id;
    }
    for (const b of bl) if (!belegt[b.pfad]) fehler.push('Am Platz ' + b.nr + ' landet kein Ding (eine Frage teilt nicht)');
    return { ok: !fehler.length && !falsch.length, fehler, falsch, landet };
  }
  // Belegung prüfen (App: Dinge an Plätze gesetzt). belegung: { pfad: ding-id }
  function pruefeBelegung(baum, dinge, belegung) {
    const falsch = [];
    for (const d of dinge) {
      const soll = folge(baum, d).pfad;
      const ist = Object.keys(belegung).find((p) => belegung[p] === d.id);
      if (ist !== soll) falsch.push({ ding: d.id, ist: ist === undefined ? null : ist, soll });
    }
    return { ok: !falsch.length, falsch };
  }
  // Fragen-Zahlen: pro Ding, wie viele Fragen der Baum stellt, bis es gefunden ist
  function fragenZahlen(baum, dinge) {
    const pro = {};
    let summe = 0, max = 0;
    for (const d of dinge) { const n = folge(baum, d).fragen; pro[d.id] = n; summe += n; if (n > max) max = n; }
    return { pro, summe, max, karten: fragenImBaum(baum).length };
  }
  // Teilt eine Frage eine Gruppe? { ja: [ids], nein: [ids] }
  function teile(dinge, f) {
    const ja = [], nein = [];
    for (const d of dinge) (antwort(d, f) ? ja : nein).push(d.id);
    return { ja, nein };
  }
  // Wie viele verschiedene Bäume mit höchstens maxTiefe Fragen trennen alle Dinge? (nur Fragen aus fragenIds)
  function zaehleBaeume(dinge, fragenIds, maxTiefe) {
    const memo = {};
    function z(gruppe, rest) {
      if (gruppe.length === 1) return 1;
      if (rest === 0) return 0;
      const key = gruppe.map((d) => d.id).sort().join(',') + '|' + rest;
      if (memo[key] !== undefined) return memo[key];
      let n = 0;
      for (const f of fragenIds) {
        const ja = gruppe.filter((d) => antwort(d, f));
        const nein = gruppe.filter((d) => !antwort(d, f));
        if (!ja.length || !nein.length) continue;
        n += z(ja, rest - 1) * z(nein, rest - 1);
      }
      memo[key] = n;
      return n;
    }
    return z(dinge, maxTiefe);
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Baum als SVG (Blätter und App gleich)
  // Maße in Einheiten (auf den Blättern mm). Ja-Ast links, Nein-Ast rechts.
  // ---------------------------------------------------------------------
  const STANDARD = { frageB: 42, frageH: 15, blattB: 26, blattH: 28, luft: 4, ebene: 26, schrift: 4.9, nameSchrift: 4.6, bildGr: 18, rand: 1.5 };
  // grobe Breite eines Textes in Andika fett (Einheiten pro Schriftgröße)
  function textBreite(t, gr) {
    let w = 0;
    for (const c of String(t)) {
      if ('iljI.,:;!|\''.indexOf(c) >= 0) w += 0.3;
      else if (c === ' ') w += 0.3;
      else if ('mwMW'.indexOf(c) >= 0) w += 0.86;
      else if (c >= 'A' && c <= 'Z' || 'ÄÖÜ'.indexOf(c) >= 0) w += 0.66;
      else if ('ftr'.indexOf(c) >= 0) w += 0.4;
      else w += 0.56;
    }
    return w * gr;
  }
  // Text auf höchstens 2 Zeilen umbrechen; Schrift wird nötigenfalls kleiner
  function umbrechen(text, breite, gr) {
    const woerter = String(text).split(/\s+/).filter(Boolean);
    for (let g2 = gr; g2 >= gr * 0.7; g2 -= gr * 0.05) {
      if (textBreite(text, g2) <= breite) return { zeilen: [text], gr: g2 };
      let beste = null;
      for (let i = 1; i < woerter.length; i++) {
        const a = woerter.slice(0, i).join(' '), b = woerter.slice(i).join(' ');
        const m = Math.max(textBreite(a, g2), textBreite(b, g2));
        if (m <= breite && (!beste || m < beste.m)) beste = { m, zeilen: [a, b] };
      }
      if (beste) return { zeilen: beste.zeilen, gr: g2 };
    }
    return { zeilen: [text], gr: gr * 0.7 };
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  const n2 = (x) => Math.round(x * 100) / 100;

  // Lage aller Knoten: { breite, hoehe, fragen: [{pfad, x, y, b, h, f}], blaetter: [{pfad, x, y, b, h, nr, inhalt}], aeste: [...] }
  // x, y: Mitte oben des Kastens
  function layout(baum, opt) {
    const o = Object.assign({}, STANDARD, opt || {});
    // Ein Frage-Kasten ist mindestens so breit, dass die Ja- und die Nein-Pille nebeneinander passen
    o.frageB = Math.max(o.frageB, 2 * pillenBreite(o.schrift * 0.9) + 3);
    const tiefeMax = tiefe(baum);
    const breite = (k) => istBlatt(k) ? o.blattB + o.luft : Math.max(o.frageB + o.luft, breite(k.ja) + breite(k.nein));
    const fr = [], bl = [], ae = [];
    let nr = 0;
    function setze(k, x0, weg) {
      const w = breite(k);
      const y = weg.length * o.ebene;
      if (istBlatt(k)) {
        nr++;
        const yy = o.unten ? tiefeMax * o.ebene : y;
        const knoten = { pfad: pfadText(weg), weg: weg.slice(), x: x0 + w / 2, y: yy, b: o.blattB, h: o.blattH, nr, inhalt: k === undefined ? null : k };
        bl.push(knoten);
        return knoten;
      }
      const wj = breite(k.ja), wn = breite(k.nein);
      const start = x0 + (w - wj - wn) / 2;
      const kj = setze(k.ja, start, weg.concat('ja'));
      const kn = setze(k.nein, start + wj, weg.concat('nein'));
      const knoten = { pfad: pfadText(weg), weg: weg.slice(), x: (kj.x + kn.x) / 2, y, b: o.frageB, h: o.frageH, f: k.f };
      fr.push(knoten);
      ae.push({ von: knoten.pfad, nach: kj.pfad, seite: 'ja', kind: kj, eltern: knoten });
      ae.push({ von: knoten.pfad, nach: kn.pfad, seite: 'nein', kind: kn, eltern: knoten });
      return knoten;
    }
    const wurzel = setze(baum, 0, []);
    void wurzel;
    const alle = fr.concat(bl);
    const minX = Math.min.apply(null, alle.map((k) => k.x - k.b / 2)) - o.rand;
    const maxX = Math.max.apply(null, alle.map((k) => k.x + k.b / 2)) + o.rand;
    const maxY = Math.max.apply(null, alle.map((k) => k.y + k.h)) + o.rand;
    for (const k of alle) { k.x = n2(k.x - minX); k.y = n2(k.y + o.rand); }
    return { breite: n2(maxX - minX), hoehe: n2(maxY + o.rand), fragen: fr, blaetter: bl, aeste: ae, o };
  }

  // Pille "Ja" / "Nein" (Mitte x, y)
  function pille(seite, x, y, gr) {
    const t = seite === 'ja' ? 'Ja' : 'Nein';
    const h = gr * 1.3, w = textBreite(t, gr) + gr * 0.9;
    return '<g class="baum-pille baum-' + seite + '"><rect x="' + n2(x - w / 2) + '" y="' + n2(y - h / 2) + '" width="' + n2(w) + '" height="' + n2(h) + '" rx="' + n2(h / 2) + '" fill="' + FARBE[seite] + '" stroke="#ffffff" stroke-width="' + n2(gr * 0.12) + '"/>' +
      '<text x="' + n2(x) + '" y="' + n2(y + gr * 0.35) + '" font-size="' + n2(gr) + '" font-weight="700" text-anchor="middle" fill="#ffffff" font-family="Andika, sans-serif">' + t + '</text></g>';
  }
  function pillenBreite(gr) { return textBreite('Nein', gr) + gr * 0.9; }

  // Baum als SVG. opt (alles optional):
  //   fragen, dinge       für Texte, Bilder, Namen
  //   leer: true          Antworten nicht zeigen (leere Kästchen)
  //   inhalt: { pfad: id } diese Antworten zeigen (auch bei leer)
  //   rot: [pfade]        diese Antworten rot umranden (Lösung)
  //   nummern: true       Platz-Nummer an jeder Antwort
  //   namen: true         Name unter dem Bild
  //   kurz: true          kurze Fragen ("Flügel?")
  //   luecke: { text, rot } Text für die fehlende Frage "?" (z. B. die Lösung in Rot)
  //   kreis: pfad         Frage rot einkreisen (Kobold-Lösung)
  //   weg: ['ja', …]      Weg hervorheben;  aktiv: pfad  Frage hervorheben (App)
  //   breite              Breite des <svg> (z. B. '100%'); sonst Einheiten als mm
  function svg(baum, opt) {
    const L = layout(baum, opt);
    const o = L.o;
    const fragen = o.fragen || {};
    const dinge = {};
    for (const d of o.dinge || []) dinge[d.id] = d;
    const gr = o.schrift;
    const pb = pillenBreite(gr * 0.9);
    const wegPfade = {};
    if (o.weg) for (let i = 1; i <= o.weg.length; i++) wegPfade[pfadText(o.weg.slice(0, i))] = true;
    let x = '';
    // Äste
    for (const a of L.aeste) {
      const e = a.eltern, k = a.kind;
      const x1 = e.x + (a.seite === 'ja' ? -1 : 1) * (e.b / 2 - pb / 2 - 0.8);
      const y1 = e.y + e.h;
      const x2 = k.x, y2 = k.y;
      const dick = wegPfade[a.nach] ? 2.2 : 1.2;
      x += '<path class="baum-ast" data-ast="' + a.nach + '" d="M' + n2(x1) + ' ' + n2(y1) + ' C' + n2(x1) + ' ' + n2(y1 + (y2 - y1) * 0.6) + ' ' + n2(x2) + ' ' + n2(y2 - (y2 - y1) * 0.6) + ' ' + n2(x2) + ' ' + n2(y2) + '" fill="none" stroke="' + FARBE[a.seite] + '" stroke-width="' + dick + '" stroke-linecap="round"/>';
    }
    // Fragen
    for (const k of L.fragen) {
      const aktiv = o.aktiv !== undefined && o.aktiv !== null && o.aktiv === k.pfad;
      const fehlt = k.f === '?';
      x += '<g class="baum-frage" data-knoten="' + k.pfad + '">';
      x += '<rect x="' + n2(k.x - k.b / 2) + '" y="' + n2(k.y) + '" width="' + k.b + '" height="' + k.h + '" rx="2.5" fill="' + (fehlt ? '#ffffff' : aktiv ? FARBE.aktiv : FARBE.frage) + '" stroke="' + (aktiv ? FARBE.nein : T) + '" stroke-width="' + (aktiv ? 1.1 : 0.6) + '"' + (fehlt ? ' stroke-dasharray="2 1.4"' : '') + '/>';
      let text, farbe = T, groesse = gr;
      if (fehlt && o.luecke && o.luecke.text) { text = o.luecke.text; farbe = o.luecke.rot ? FARBE.rot : T; }
      else if (fehlt) { text = '?'; farbe = FARBE.grau; groesse = gr * 1.5; }
      else text = frageText(fragen, k.f, o.kurz);
      const u = umbrechen(text, k.b - 3, groesse);
      const zh = u.gr * 1.12;
      const oben = k.y + (k.h - gr * 0.55 - zh * u.zeilen.length) / 2 + u.gr * 0.84;
      u.zeilen.forEach((z, i) => {
        x += '<text x="' + n2(k.x) + '" y="' + n2(oben + i * zh) + '" font-size="' + n2(u.gr) + '" font-weight="700" text-anchor="middle" fill="' + farbe + '" font-family="Andika, sans-serif">' + esc(z) + '</text>';
      });
      x += pille('ja', k.x - k.b / 2 + pb / 2 + 0.8, k.y + k.h, gr * 0.9) + pille('nein', k.x + k.b / 2 - pb / 2 - 0.8, k.y + k.h, gr * 0.9);
      if (o.kreis !== undefined && o.kreis !== null && o.kreis === k.pfad) {
        x += '<ellipse cx="' + n2(k.x) + '" cy="' + n2(k.y + k.h / 2) + '" rx="' + n2(k.b / 2 + 5) + '" ry="' + n2(k.h / 2 + 6) + '" fill="none" stroke="' + FARBE.rot + '" stroke-width="1.1"/>';
      }
      x += '</g>';
    }
    // Antworten
    const rot = new Set(o.rot || []);
    for (const k of L.blaetter) {
      let id = k.inhalt;
      if (o.leer) id = null;
      if (o.inhalt && Object.prototype.hasOwnProperty.call(o.inhalt, k.pfad)) id = o.inhalt[k.pfad];
      const istRot = rot.has(k.pfad);
      const fehlt = id === '?';
      x += '<g class="baum-antwort" data-blatt="' + k.nr + '" data-pfad="' + k.pfad + '">';
      x += '<rect x="' + n2(k.x - k.b / 2) + '" y="' + n2(k.y) + '" width="' + k.b + '" height="' + k.h + '" rx="2.5" fill="#ffffff" stroke="' + (istRot ? FARBE.rot : T) + '" stroke-width="' + (istRot ? 1.1 : 0.6) + '"' + (fehlt ? ' stroke-dasharray="2 1.4"' : '') + '/>';
      if (id && !fehlt) {
        const d = dinge[id];
        const bgr = o.bildGr;
        const mitName = o.namen && d && d.name;
        const by = k.y + (mitName ? 1.2 : (k.h - bgr) / 2);
        x += '<svg x="' + n2(k.x - bgr / 2) + '" y="' + n2(by) + '" width="' + bgr + '" height="' + bgr + '" viewBox="0 0 100 100" overflow="visible">' + inhalt(d ? d.bild : id) + '</svg>';
        if (mitName) {
          const ng = Math.min(o.nameSchrift, (k.b - 2) / (textBreite(d.name, 1)));
          x += '<text x="' + n2(k.x) + '" y="' + n2(k.y + k.h - 2.2) + '" font-size="' + n2(ng) + '" font-weight="700" text-anchor="middle" fill="' + (istRot ? FARBE.rot : T) + '" font-family="Andika, sans-serif">' + esc(d.name) + '</text>';
        }
      } else if (fehlt) {
        x += '<text x="' + n2(k.x) + '" y="' + n2(k.y + k.h / 2 + gr * 0.55) + '" font-size="' + n2(gr * 1.5) + '" font-weight="700" text-anchor="middle" fill="' + FARBE.grau + '" font-family="Andika, sans-serif">?</text>';
      }
      if (o.nummern) {
        const r = gr * 0.62;
        x += '<circle cx="' + n2(k.x - k.b / 2 + r + 0.4) + '" cy="' + n2(k.y + r + 0.4) + '" r="' + n2(r) + '" fill="' + T + '"/>' +
          '<text x="' + n2(k.x - k.b / 2 + r + 0.4) + '" y="' + n2(k.y + r + 0.4 + gr * 0.33) + '" font-size="' + n2(gr * 0.9) + '" font-weight="700" text-anchor="middle" fill="#ffffff" font-family="Andika, sans-serif">' + k.nr + '</text>';
      }
      x += '</g>';
    }
    const w = o.breite || (L.breite + 'mm');
    const h = o.breite ? '' : ' height="' + L.hoehe + 'mm"';
    return '<svg xmlns="http://www.w3.org/2000/svg" class="baum-svg" viewBox="0 0 ' + L.breite + ' ' + L.hoehe + '" width="' + w + '"' + h + ' role="img" aria-label="Ja-Nein-Baum">' + x + '</svg>';
  }

  g.WerkstattBaum = {
    FARBE, STANDARD, BILDER, bild, inhalt, hat, namen,
    istBlatt, frageText, antwort, bei, kopie, aendere, tausche, mitFrage, blaetter, fragenImBaum, tiefe,
    folge, wegFolgen, bewohner, pruefe, pruefeBelegung, fragenZahlen, teile, zaehleBaeume,
    layout, svg, textBreite, umbrechen, pfadText, wegVon,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
