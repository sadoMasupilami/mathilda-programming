/* =====================================================================
   Bausteine für Einheit 18 „Ich erfinde ein Spiel“
   Keine neue Rätselart: Das Beispiel-Spiel „Wettflug zum Wolkenschloss“
   wird hier beim Bauen ausgerechnet (genaue Wahrscheinlichkeiten,
   längste Spieldauer, Züge Schritt für Schritt). Jede Zahl, die in der
   Anleitung oder auf einem Blatt steht, kommt aus diesen Rechnungen oder
   wird mit l="…" gegen sie geprüft (sonst bricht der Build ab).

     <m-e18-plan [spiel="wettflug"] [gr="25"]>
         Spielplan: Start, Felder 1–20, Schloss. Ohne spiel leer (Bastelvorlage);
         in der Lösungsansicht zeigt der leere Plan die Felder des Wettflugs rot.
     <m-e18-strecke spiel="wettflug" bis="12" [gr="13"]>
         Ausschnitt des Plans als eine Reihe (Start bis Feld 12) mit Stern und Wirbelwind.
     <m-e18-test spiel="wettflug" pos="2,10" wuerfe="4" zeige="a|b" [l="10"] [nur-zahl]>
         Antwortkästchen: Wo steht Figur a (die würfelt) bzw. b nach diesen Würfen?
         nur-zahl: nur die Zahl als Text (für die Lösungen in der Anleitung).
     <m-e18-pruefe spiel="wettflug" pos="0,0" wuerfe="3,5,6" erwartet="6,8|sieg:a|offen">
         Unsichtbar: prüft einen Spielverlauf, der in der Anleitung in Worten steht.
     <m-e18-zahl spiel="wettflug" was="…" [zweiter="2"] [l="50"] [feld]>
         Eine ausgerechnete Zahl im Text (feld: als Antwortkästchen mit roter Lösung).
         was: starter (von 100 Spielen gewinnt, wer beginnt), zweiter (gewinnt, wer
         als Zweite/r dran ist), maxZuege, mittelZuege (Median), zuegeVon / zuegeBis
         (10 % und 90 %), schnitt (Durchschnitt, gerundet), minWuerfe (vom Start ins
         Schloss, ohne Sonderfelder), minZuege, felder, ziel, einsenZuege (lauter 1er),
         sechsenZuege (lauter 6er)
     <m-e18-felder spiel="wettflug" art="stern|wirbel">   →  „3, 9 und 15“
     <m-e18-kobold l="unklar|nie|unfair">
         Drei Kästchen zum Ankreuzen (unklar · hört nie auf · unfair), Lösung rot.
     <m-e18-schnecken rot="0" blau="1" [ziel="5"]>     Schnecken-Rennen (Bild)
     <m-e18-sieger rot="0" blau="1" beginnt="rot" frage="wer|fair">
         Ankreuzen: Wer gewinnt? / Ist es fair? Lösung ausgerechnet (immer 1 Feld pro Zug).
     <m-e18-bild name="wirbel|stern|unklar|nie|unfair|schnecke-rot|schnecke-blau|salat|frage|wolke|figur" gr="12">
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  // ---------------------------------------------------------------------
  // Die Spiele. Felder 1..felder, Start = 0, Schloss = felder + 1.
  // Ein Zug: würfeln, so viele Felder vor. Stern: noch einmal würfeln und
  // weiterfliegen. Wirbelwind: die beiden Figuren tauschen die Plätze.
  // Ein Feld wirkt nur für die Figur, die mit dem Würfel darauf landet.
  // Genau treffen ist nicht nötig. Wer zuerst im Schloss ist, gewinnt.
  // ---------------------------------------------------------------------
  const SPIELE = {
    wettflug: { felder: 20, stern: [3, 9, 15], wirbel: [6, 12, 18] },
    sterne: { felder: 20, stern: [3, 9, 15], wirbel: [] },   // Wettflug ohne Wirbelwind
    leer: { felder: 20, stern: [], wirbel: [] },             // leerer Plan, nur würfeln
  };

  function spielVon(name) {
    const s = SPIELE[name];
    if (!s) throw new Error('Unbekanntes Spiel „' + name + '“ (' + Object.keys(SPIELE).join(', ') + ')');
    if (!s._art) {
      s._art = {};
      for (const f of s.stern) s._art[f] = 'stern';
      for (const f of s.wirbel) s._art[f] = 'wirbel';
      s.ziel = s.felder + 1;
    }
    return s;
  }

  // Alle Ausgänge eines Zugs: Spieler am Zug steht auf a, die andere Figur auf b.
  // Ergebnis: Map  'sieg' → Wahrscheinlichkeit  oder  'a,b' (danach, am Zug zuerst) → Wahrsch.
  function zugAusgaenge(s, a, b) {
    const aus = new Map();
    const dazu = (k, p) => aus.set(k, (aus.get(k) || 0) + p);
    (function wurf(x0, p) {
      for (let d = 1; d <= 6; d++) {
        const q = p / 6, x = x0 + d;
        if (x >= s.ziel) dazu('sieg', q);
        else if (s._art[x] === 'stern') wurf(x, q);
        else if (s._art[x] === 'wirbel') dazu(b + ',' + x, q);   // tauschen
        else dazu(x + ',' + b, q);
      }
    })(a, 1);
    return aus;
  }
  const teile = (k) => k.split(',').map(Number);

  // Jeder Wurf macht die Summe beider Feldnummern größer, Tauschen lässt sie gleich:
  // Der Zustandsgraph hat keine Kreise, das Spiel endet sicher. Hier wird das geprüft.
  function analyse(name, start) {
    const s = spielVon(name);
    const key = name + '|' + start.join(',');
    s._analyse = s._analyse || {};
    if (s._analyse[key]) return s._analyse[key];
    const memoP = new Map(), memoL = new Map();
    function pSieg(a, b) {           // Spieler am Zug gewinnt
      const k = a + ',' + b;
      if (memoP.has(k)) return memoP.get(k);
      let p = 0;
      for (const [x, q] of zugAusgaenge(s, a, b)) {
        if (x === 'sieg') p += q;
        else {
          const [na, nb] = teile(x);
          if (na + nb <= a + b) throw new Error('Spiel „' + name + '“: ein Zug macht die Summe nicht größer, Ende nicht sicher');
          p += q * (1 - pSieg(nb, na));
        }
      }
      memoP.set(k, p);
      return p;
    }
    function laengste(a, b) {        // längste mögliche Zahl von Zügen bis zum Ende
      const k = a + ',' + b;
      if (memoL.has(k)) return memoL.get(k);
      let m = 1;
      for (const [x] of zugAusgaenge(s, a, b)) if (x !== 'sieg') { const [na, nb] = teile(x); m = Math.max(m, 1 + laengste(nb, na)); }
      memoL.set(k, m);
      return m;
    }
    // Verteilung der Spieldauer (Züge), Zug für Zug
    let stand = new Map([[start[0] + ',' + start[1], 1]]);
    const ende = [];
    let schnitt = 0, minZuege = null;
    for (let t = 1; stand.size && t <= 400; t++) {
      let fertig = 0;
      const neu = new Map();
      for (const [k, p] of stand) {
        const [a, b] = teile(k);
        for (const [x, q] of zugAusgaenge(s, a, b)) {
          if (x === 'sieg') fertig += p * q;
          else { const [na, nb] = teile(x); const kk = nb + ',' + na; neu.set(kk, (neu.get(kk) || 0) + p * q); }
        }
      }
      ende.push(fertig);
      if (fertig > 0 && minZuege === null) minZuege = t;
      schnitt += t * fertig;
      stand = neu;
    }
    if (stand.size) throw new Error('Spiel „' + name + '“ endet nicht nach 400 Zügen');
    const quantil = (z) => { let k = 0; for (let i = 0; i < ende.length; i++) { k += ende[i]; if (k >= z - 1e-12) return i + 1; } return ende.length; };
    const erg = {
      starter: pSieg(start[0], start[1]),
      maxZuege: laengste(start[0], start[1]),
      schnitt, minZuege,
      median: quantil(0.5), q10: quantil(0.1), q90: quantil(0.9),
    };
    s._analyse[key] = erg;
    return erg;
  }

  // Ein Spielverlauf mit festen Würfen. pos = [a, b], a würfelt zuerst.
  // Ergebnis: { pos, sieger (0 = a, 1 = b, null), zuege, wuerfe (verbraucht), schritte: [...] }
  function spielen(name, pos, wuerfe, opt) {
    const s = spielVon(name);
    const p = pos.slice();
    let wer = 0, i = 0, zuege = 0;
    const schritte = [];
    const naechster = typeof wuerfe === 'function' ? wuerfe : (k) => wuerfe[k];
    const maxZ = (opt && opt.maxZuege) || 1000;
    while (zuege < maxZ) {
      if (naechster(i) === undefined) break;
      zuege++;
      for (;;) {
        const d = naechster(i);
        if (d === undefined) return { pos: p, sieger: null, zuege, wuerfe: i, schritte, offen: true };
        if (!(d >= 1 && d <= 6)) throw new Error('Würfel zeigt ' + d + ' (1 bis 6)');
        i++;
        p[wer] += d;
        const feld = p[wer] >= s.ziel ? 'schloss' : (s._art[p[wer]] || 'leer');
        schritte.push({ wer, d, nach: Math.min(p[wer], s.ziel), feld });
        if (feld === 'schloss') return { pos: p, sieger: wer, zuege, wuerfe: i, schritte };
        if (feld === 'stern') continue;
        if (feld === 'wirbel') { const t = p[0]; p[0] = p[1]; p[1] = t; }
        break;
      }
      wer = 1 - wer;
    }
    return { pos: p, sieger: null, zuege, wuerfe: i, schritte, offen: true };
  }

  // Kleinste Zahl von Würfen vom Start ins Schloss (ohne Sonderfelder: aufrunden)
  function minWuerfe(name) {
    const s = spielVon(name);
    if (s.stern.length || s.wirbel.length) throw new Error('minWuerfe nur für ein Spiel ohne Sonderfelder');
    return Math.ceil(s.ziel / 6);
  }

  // Schnecken-Rennen ohne Würfel: jede Schnecke kriecht in jedem Zug genau 1 Feld.
  function schneckenRennen(rot, blau, ziel, beginnt) {
    const pos = { rot, blau };
    let wer = beginnt;
    for (let z = 1; z <= 100; z++) {
      pos[wer]++;
      if (pos[wer] >= ziel) return { sieger: wer, zuege: z };
      wer = wer === 'rot' ? 'blau' : 'rot';
    }
    throw new Error('Schnecken-Rennen endet nicht');
  }

  // Für Tests in Node (window = globalThis)
  window.__e18 = { SPIELE, spielVon, zugAusgaenge, analyse, spielen, minWuerfe, schneckenRennen };

  // ---------------------------------------------------------------------
  // Bilder (eigene SVG, Koordinaten 0–100)
  // ---------------------------------------------------------------------
  const T = '#1f2340';
  const st = (w) => ' stroke="' + T + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"';
  const BILD = {
    // Wirbelwind: ein Trichter aus Wind-Strichen
    wirbel: (farbig) => {
      const f = farbig ? '#cfe6fb' : 'white';
      return '<path d="M14 20 C30 10 70 10 86 20 C80 30 64 33 50 33 C38 33 22 30 14 20 Z" fill="' + f + '"' + st(4) + '/>' +
        '<path d="M24 40 C38 34 64 34 76 42 C68 50 56 52 48 51 C38 50 30 47 24 40 Z" fill="' + f + '"' + st(4) + '/>' +
        '<path d="M34 60 C44 56 60 56 66 62 C60 68 52 69 46 68 C40 67 36 65 34 60 Z" fill="' + f + '"' + st(4) + '/>' +
        '<path d="M44 78 C48 76 56 76 58 80 C55 84 50 85 47 84" fill="' + f + '"' + st(4) + '/>' +
        '<path d="M50 86 C50 90 48 93 45 95" fill="none"' + st(4) + '/>';
    },
    stern: (farbig) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 19 : 44, a = Math.PI / 5 * i - Math.PI / 2;
        pts.push((50 + r * Math.cos(a)).toFixed(1) + ' ' + (54 + r * Math.sin(a)).toFixed(1));
      }
      return '<path d="M' + pts.join(' L') + ' Z" fill="' + (farbig ? '#f2b705' : 'white') + '"' + st(4) + '/>';
    },
    // Sprechblase mit Fragezeichen: „Was soll ich tun?“
    unklar: () => '<path d="M14 18 H86 A8 8 0 0 1 94 26 V64 A8 8 0 0 1 86 72 H44 L26 90 L30 72 H14 A8 8 0 0 1 6 64 V26 A8 8 0 0 1 14 18 Z" fill="#fff4cc"' + st(4) + '/>' +
      '<path d="M38 36 C38 24 62 24 62 36 C62 46 50 46 50 55" fill="none"' + st(6.5) + '/><circle cx="50" cy="64" r="3.8" fill="' + T + '"/>',
    // Kreis mit Pfeilspitze: „hört nie auf“
    nie: () => '<path d="M78 34 A32 32 0 1 0 82 58" fill="none" stroke="' + T + '" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M64 26 L84 30 L80 10" fill="none" stroke="' + T + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="50" r="7" fill="#e8731a"' + st(3) + '/>',
    // schiefe Waage: „unfair“
    unfair: () => '<path d="M50 12 V84" fill="none"' + st(5) + '/><path d="M30 88 H70" fill="none"' + st(6) + '/>' +
      '<path d="M14 26 L86 46" fill="none"' + st(5) + '/>' +
      '<path d="M14 26 L4 50 H24 Z" fill="#f2b705"' + st(3.5) + '/><path d="M86 46 L76 70 H96 Z" fill="white"' + st(3.5) + '/>' +
      '<circle cx="50" cy="12" r="5" fill="white"' + st(3.5) + '/>',
    schnecke: (farbe) => '<path d="M8 82 C8 70 20 66 34 66 H74 C80 66 84 60 84 54 V38 C84 32 92 32 92 38 V58 C92 74 84 82 70 82 Z" fill="' + farbe + '" fill-opacity="0.35"' + st(4) + '/>' +
      '<path d="M84 38 L80 22 M90 38 L96 24" fill="none"' + st(3.5) + '/><circle cx="80" cy="21" r="3" fill="' + T + '"/><circle cx="96" cy="23" r="3" fill="' + T + '"/>' +
      '<circle cx="44" cy="50" r="26" fill="' + farbe + '"' + st(4) + '/>' +
      '<path d="M44 50 C44 44 54 44 54 52 C54 62 38 64 34 52 C30 38 52 32 60 44 C66 54 62 68 50 72" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>',
    salat: () => '<path d="M50 90 C20 90 8 70 12 50 C16 30 30 22 40 26 C42 14 58 14 60 26 C70 22 86 30 88 50 C92 70 80 90 50 90 Z" fill="#7cc96b"' + st(4) + '/>' +
      '<path d="M50 88 V40 M50 70 L34 56 M50 60 L66 46 M50 78 L68 66" fill="none" stroke="#3f8a35" stroke-width="3.5" stroke-linecap="round"/>',
    frage: () => '<circle cx="50" cy="50" r="44" fill="#fde9f4"' + st(4) + '/>' +
      '<path d="M36 38 C36 22 64 22 64 38 C64 50 50 50 50 60" fill="none"' + st(8) + '/><circle cx="50" cy="73" r="5" fill="' + T + '"/>',
    wolke: () => '<path d="M22 78 C8 78 4 60 18 54 C14 38 34 30 44 40 C50 22 78 24 80 44 C96 44 98 70 82 78 Z" fill="white"' + st(3.5) + '/>',
    // zwei Regel-Zettel übereinander (zwei Regeln, die sich streiten)
    zettel: () => '<g transform="rotate(-10 34 52)"><rect x="8" y="16" width="44" height="60" rx="4" fill="white"' + st(4) + '/>' +
      '<text x="30" y="40" font-family="Andika, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="' + T + '">1</text>' +
      '<path d="M16 54 H44 M16 64 H38" fill="none"' + st(3) + '/></g>' +
      '<g transform="rotate(10 66 52)"><rect x="48" y="22" width="44" height="60" rx="4" fill="white"' + st(4) + '/>' +
      '<text x="70" y="46" font-family="Andika, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="' + T + '">2</text>' +
      '<path d="M56 60 H84 M56 70 H78" fill="none"' + st(3) + '/></g>',
  };
  function bildSVG(name, gr, extra) {
    let inner;
    if (name === 'schnecke-rot') inner = BILD.schnecke('#e0453a');
    else if (name === 'schnecke-blau') inner = BILD.schnecke('#3a7be0');
    else if (name === 'wirbel-farbig') inner = BILD.wirbel(true);
    else if (name === 'stern-farbig') inner = BILD.stern(true);
    else if (BILD[name]) inner = BILD[name](false);
    else return null;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + 'mm" height="' + gr + 'mm"' + (extra || '') + ' aria-hidden="true">' + inner + '</svg>';
  }
  const gruppe = (inner, x, y, g) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (g / 100) + ')">' + inner + '</g>';

  B['m-e18-bild'] = function (el) {
    const name = el.getAttribute('name');
    const s = bildSVG(name, parseFloat(el.getAttribute('gr') || '12'));
    if (!s) return H().fehler(el, 'm-e18-bild: unbekanntes Bild „' + name + '“');
    el.innerHTML = s;
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // Spielplan: 6 Spalten (Spalte 0: Start oben, Schloss unten), 4 Reihen.
  // Weg: Start → 1…5 (nach rechts) → 6…10 (nach links) → 11…15 → 16…20 → Schloss
  // ---------------------------------------------------------------------
  function feldOrt(n, f, g, rg) {       // Feld n (1..20) → linke obere Ecke in mm
    const r = Math.floor((n - 1) / 5), i = (n - 1) % 5;
    const c = r % 2 === 0 ? 1 + i : 5 - i;
    return [c * (f + g), r * (f + rg)];
  }
  function planSVG(spiel, opt) {
    const f = opt.gr || 25, g = opt.abstand || 6, rg = opt.reihenAbstand || 7.5;
    const W = 6 * f + 5 * g, Hh = 4 * f + 3 * rg;
    const s = spiel ? spielVon(spiel) : null;
    const rot = opt.rot;   // Markierungen rot (Lösungsansicht des leeren Plans)
    const mitte = (n) => { const [x, y] = feldOrt(n, f, g, rg); return [x + f / 2, y + f / 2]; };
    const start = [f / 2, f / 2], schloss = [f / 2, 3 * (f + rg) + f / 2];
    const punkte = [start].concat(Array.from({ length: 20 }, (_, i) => mitte(i + 1))).concat([schloss]);
    let o = '<polyline points="' + punkte.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ') + '" fill="none" stroke="#f6c9e3" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>';
    // Start
    o += '<rect x="0.4" y="0.4" width="' + (f - 0.8) + '" height="' + (f - 0.8) + '" rx="4" fill="#eaf6e6" stroke="' + T + '" stroke-width="0.6"/>';
    o += '<text x="' + f / 2 + '" y="' + (f / 2 + 0.3) + '" font-family="Andika, sans-serif" font-weight="700" font-size="6.4" text-anchor="middle" dominant-baseline="central" fill="' + T + '">Start</text>';
    // Schloss
    const sy = 3 * (f + rg);
    o += '<rect x="0.4" y="' + (sy + 0.4) + '" width="' + (f - 0.8) + '" height="' + (f - 0.8) + '" rx="4" fill="#fff4cc" stroke="' + T + '" stroke-width="0.6"/>';
    o += gruppe(H().bildSVG('schloss', 100).replace(/^<svg[^>]*>|<\/svg>$/g, ''), 3, sy + 1.2, f - 6);
    // Platz links in der Mitte: eine Wolke und der Drache (zum Anmalen)
    o += gruppe(BILD.wolke(), 0, f + rg - 1, f);
    o += gruppe(H().bildSVG('drache', 100).replace(/^<svg[^>]*>|<\/svg>$/g, ''), 1, 2 * (f + rg) - 2, f - 2);
    // Felder
    for (let n = 1; n <= 20; n++) {
      const [x, y] = feldOrt(n, f, g, rg);
      o += '<rect x="' + (x + 0.3) + '" y="' + (y + 0.3) + '" width="' + (f - 0.6) + '" height="' + (f - 0.6) + '" rx="3.5" fill="white" stroke="' + T + '" stroke-width="0.6"/>';
      o += '<text x="' + (x + 2.2) + '" y="' + (y + 4.4) + '" font-family="Nunito, sans-serif" font-weight="800" font-size="3.9" fill="#6b6f86">' + n + '</text>';
      if (s && s._art[n]) {
        const name = s._art[n];
        const inner = rot ? BILD[name](false).replace(/#1f2340/g, '#d1335b') : BILD[name](true);
        o += gruppe(inner, x + f * 0.2, y + f * 0.18, f * 0.66);
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + Hh + 'mm" viewBox="-0.5 -0.5 ' + (W + 1) + ' ' + (Hh + 1) + '" role="img" aria-label="Spielplan">' + o + '</svg>';
  }

  B['m-e18-plan'] = function (el) {
    try {
      const spiel = el.getAttribute('spiel');
      const gr = parseFloat(el.getAttribute('gr') || '25');
      if (gr < 20) return H().fehler(el, 'Felder mindestens 20 mm');
      const L = istLoesung(el);
      // leerer Plan: in der Lösungsansicht die Felder des Wettflugs rot
      el.innerHTML = spiel ? planSVG(spiel, { gr }) : planSVG(L ? 'wettflug' : null, { gr, rot: L });
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp');
  };

  // Ausschnitt als eine Reihe: Start, 1 … bis
  B['m-e18-strecke'] = function (el) {
    try {
      const s = spielVon(el.getAttribute('spiel') || 'wettflug');
      const bis = parseInt(el.getAttribute('bis') || '12', 10);
      const f = parseFloat(el.getAttribute('gr') || '13');
      const W = (bis + 1) * f;
      let o = '';
      for (let n = 0; n <= bis; n++) {
        const x = n * f;
        o += '<rect x="' + (x + 0.3) + '" y="0.3" width="' + (f - 0.6) + '" height="' + (f - 0.6) + '" rx="2" fill="' + (n === 0 ? '#eaf6e6' : 'white') + '" stroke="' + T + '" stroke-width="0.5"/>';
        if (n === 0) o += '<text x="' + (x + f / 2) + '" y="' + (f / 2 + 0.2) + '" font-family="Andika, sans-serif" font-weight="700" font-size="' + (f * 0.27).toFixed(2) + '" text-anchor="middle" dominant-baseline="central" fill="' + T + '">Start</text>';
        else {
          o += '<text x="' + (x + f / 2) + '" y="' + (f + 4.2) + '" font-family="Andika, sans-serif" font-weight="700" font-size="' + Math.min(4.6, f * 0.42).toFixed(2) + '" text-anchor="middle" fill="' + T + '">' + n + '</text>';
          if (s._art[n]) o += gruppe(BILD[s._art[n]](true), x + f * 0.12, f * 0.1, f * 0.76);
        }
      }
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + (f + 5.5) + 'mm" viewBox="-0.3 -0.3 ' + (W + 0.6) + ' ' + (f + 5.8) + '" role="img" aria-label="Felder">' + o + '</svg>';
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp');
  };

  const zahlen = (s) => String(s || '').split(',').map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x));

  // Antwortkästchen nach einem Stück Spiel
  B['m-e18-test'] = function (el) {
    const h = H();
    try {
      const name = el.getAttribute('spiel') || 'wettflug';
      const pos = zahlen(el.getAttribute('pos'));
      const w = zahlen(el.getAttribute('wuerfe'));
      if (pos.length !== 2 || !w.length) return h.fehler(el, 'm-e18-test braucht pos="a,b" und wuerfe="…"');
      const e = spielen(name, pos, w);
      if (e.wuerfe !== w.length) return h.fehler(el, 'Nicht alle Würfe werden gebraucht (' + e.wuerfe + ' von ' + w.length + ')');
      if (e.zuege !== 1) return h.fehler(el, 'Die Würfe gehören nicht zu genau einem Zug');
      if (e.sieger !== null) return h.fehler(el, 'Die Figur ist schon im Schloss');
      const wer = el.getAttribute('zeige') === 'b' ? 1 : 0;
      const n = e.pos[wer];
      if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'Ergebnis ist Feld ' + n + ', nicht ' + el.getAttribute('l'));
      // nur-zahl: die Zahl als Text (Lösungen in der Anleitung), sonst ein Antwortkästchen
      if (el.hasAttribute('nur-zahl')) el.textContent = String(n);
      else el.innerHTML = h.feldHTML(String(n), n >= 10 ? '' : 'k');
      el.dataset.loesung = String(n);
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  // Unsichtbare Prüfung eines Verlaufs, der in der Anleitung in Worten steht
  B['m-e18-pruefe'] = function (el) {
    const h = H();
    try {
      const name = el.getAttribute('spiel') || 'wettflug';
      const pos = zahlen(el.getAttribute('pos') || '0,0');
      const w = zahlen(el.getAttribute('wuerfe'));
      const e = spielen(name, pos, w);
      if (e.wuerfe !== w.length) return h.fehler(el, 'Verlauf: nur ' + e.wuerfe + ' von ' + w.length + ' Würfen gebraucht (Spiel vorher aus)');
      const soll = el.getAttribute('erwartet') || '';
      const ist = e.sieger !== null ? 'sieg:' + (e.sieger ? 'b' : 'a') : e.pos.join(',');
      if (soll !== ist) return h.fehler(el, 'Verlauf endet mit „' + ist + '“, in der Anleitung steht „' + soll + '“ (' + e.schritte.map((x) => (x.wer ? 'b' : 'a') + x.d + '→' + x.nach + (x.feld !== 'leer' ? ' ' + x.feld : '')).join(', ') + ')');
      if (el.hasAttribute('zuege') && +el.getAttribute('zuege') !== e.zuege) return h.fehler(el, 'Verlauf hat ' + e.zuege + ' Züge, nicht ' + el.getAttribute('zuege'));
    } catch (e) { return h.fehler(el, e.message); }
    el.innerHTML = '';
    el.classList.add('komp', 'geprueft');
  };

  // Ausgerechnete Zahl
  function zahlVon(el) {
    const name = el.getAttribute('spiel') || 'wettflug';
    const was = el.getAttribute('was');
    const s = spielVon(name);
    const zweiter = parseInt(el.getAttribute('zweiter') || '0', 10);
    const a = () => analyse(name, [0, zweiter]);
    switch (was) {
      case 'starter': return Math.round(100 * a().starter);
      case 'zweiter': return Math.round(100 * (1 - a().starter));
      case 'maxZuege': return a().maxZuege;
      case 'mittelZuege': return a().median;
      case 'zuegeVon': return a().q10;
      case 'zuegeBis': return a().q90;
      case 'schnitt': return Math.round(a().schnitt);
      case 'minZuege': return a().minZuege;
      case 'minWuerfe': return minWuerfe(name);
      case 'felder': return s.felder;
      case 'ziel': return s.ziel;
      case 'einsenZuege': { const e = spielen(name, [0, zweiter], () => 1); if (e.sieger === null) throw new Error('lauter 1er: kein Ende'); return e.zuege; }
      case 'einsenWuerfe': { const e = spielen(name, [0, zweiter], () => 1); return e.wuerfe; }
      case 'sechsenZuege': { const e = spielen(name, [0, zweiter], () => 6); if (e.sieger === null) throw new Error('lauter 6er: kein Ende'); return e.zuege; }
      default: throw new Error('m-e18-zahl: unbekanntes was="' + was + '"');
    }
  }
  B['m-e18-zahl'] = function (el) {
    const h = H();
    let n;
    try { n = zahlVon(el); } catch (e) { return h.fehler(el, e.message); }
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'ausgerechnet: ' + n + ', im Text steht ' + el.getAttribute('l'));
    if (el.hasAttribute('feld')) el.innerHTML = h.feldHTML(String(n), n >= 10 ? '' : 'k');
    else el.textContent = String(n);
    el.dataset.loesung = String(n);
    el.classList.add('komp', 'geprueft');
  };

  B['m-e18-felder'] = function (el) {
    try {
      const s = spielVon(el.getAttribute('spiel') || 'wettflug');
      const l = s[el.getAttribute('art') === 'wirbel' ? 'wirbel' : 'stern'];
      el.textContent = l.length > 1 ? l.slice(0, -1).join(', ') + ' und ' + l[l.length - 1] : String(l[0]);
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // Ankreuzen: Welcher Kobold? / Wer gewinnt? / fair?
  // ---------------------------------------------------------------------
  const KREUZ = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 20 L80 80 M80 20 L20 80" fill="none" stroke="#d1335b" stroke-width="15" stroke-linecap="round"/></svg>';
  function kaestchen(richtig) {
    return '<span class="e18-kreuz' + (richtig ? ' e18-richtig' : '') + '">' + (richtig ? '<span class="e18-x">' + KREUZ + '</span>' : '') + '</span>';
  }
  const KOBOLDE = ['unklar', 'nie', 'unfair'];
  B['m-e18-kobold'] = function (el) {
    const l = el.getAttribute('l');
    if (!KOBOLDE.includes(l)) return H().fehler(el, 'm-e18-kobold l="unklar|nie|unfair"');
    el.innerHTML = KOBOLDE.map((k) => kaestchen(k === l)).join('');
    el.dataset.loesung = l;
    el.classList.add('komp', 'geprueft');
  };

  // Eine Bahn: Start, 1 … ziel-1, Salat. Beide Schnecken in derselben Bahn.
  B['m-e18-schnecken'] = function (el) {
    try {
      const rot = parseInt(el.getAttribute('rot') || '0', 10), blau = parseInt(el.getAttribute('blau') || '0', 10);
      const ziel = parseInt(el.getAttribute('ziel') || '5', 10);
      const f = parseFloat(el.getAttribute('gr') || '15');
      const ab = 1.6;
      let o = '';
      for (let n = 0; n <= ziel; n++) {
        const x = n * (f + ab);
        o += '<rect x="' + (x + 0.3) + '" y="0.3" width="' + (f - 0.6) + '" height="' + (f - 0.6) + '" rx="2.5" fill="' + (n === 0 ? '#eaf6e6' : n === ziel ? '#e9f7c9' : 'white') + '" stroke="' + T + '" stroke-width="0.5"/>';
        if (n === ziel) o += gruppe(BILD.salat(), x + f * 0.12, f * 0.12, f * 0.76);
        else o += '<text x="' + (x + f / 2) + '" y="' + (f + 4.4) + '" font-family="Andika, sans-serif" font-weight="700" font-size="4.2" text-anchor="middle" fill="' + T + '">' + (n === 0 ? 'Start' : n) + '</text>';
        const beide = n === rot && n === blau;
        if (n === rot) o += gruppe(BILD.schnecke('#e0453a'), x + f * 0.08, beide ? 0 : f * 0.1, beide ? f * 0.5 : f * 0.84);
        if (n === blau) o += gruppe(BILD.schnecke('#3a7be0'), x + f * (beide ? 0.45 : 0.08), beide ? f * 0.45 : f * 0.1, beide ? f * 0.5 : f * 0.84);
      }
      const W = (ziel + 1) * (f + ab) - ab;
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + (f + 5.5) + 'mm" viewBox="-0.3 -0.3 ' + (W + 0.6) + ' ' + (f + 5.8) + '" role="img" aria-label="Schnecken-Rennen">' + o + '</svg>';
    } catch (e) { return H().fehler(el, e.message); }
    el.classList.add('komp');
  };

  B['m-e18-sieger'] = function (el) {
    const h = H();
    let e;
    try {
      e = schneckenRennen(parseInt(el.getAttribute('rot') || '0', 10), parseInt(el.getAttribute('blau') || '0', 10),
        parseInt(el.getAttribute('ziel') || '5', 10), el.getAttribute('beginnt') === 'blau' ? 'blau' : 'rot');
    } catch (x) { return h.fehler(el, x.message); }
    const frage = el.getAttribute('frage') || 'wer';
    let html;
    if (frage === 'wer') {
      html = '<span class="e18-wahl">' + kaestchen(e.sieger === 'rot') + '<span>Rot</span></span>' +
        '<span class="e18-wahl">' + kaestchen(e.sieger === 'blau') + '<span>Blau</span></span>';
      el.dataset.loesung = e.sieger;
    } else {
      // Ohne Würfel gewinnt bei denselben Regeln immer dieselbe Schnecke: nie fair
      html = '<span class="e18-wahl">' + kaestchen(false) + '<span>ja</span></span>' +
        '<span class="e18-wahl">' + kaestchen(true) + '<span>nein</span></span>';
      el.dataset.loesung = 'nein';
    }
    if (el.hasAttribute('l') && el.getAttribute('l') !== el.dataset.loesung) return h.fehler(el, 'Lösung ist ' + el.dataset.loesung + ', nicht ' + el.getAttribute('l'));
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };
})();
