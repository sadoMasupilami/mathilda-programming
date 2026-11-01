/* =====================================================================
   Spiel-Plugin „janein“ (Einheit 9 „Nur Ja oder Nein“): Ja/Nein-Zahlen
   Drei Aufgaben, alles nur Antippen (kein Ziehen):
   - legen:  Die Zahl steht oben. Karten antippen dreht sie um (Lampe an/aus, Finger hoch/runter,
       Kästchen 1/0). Am Anfang sind alle umgedreht (0). „Los“ zählt die Punkte der Ja-Karten langsam
       zusammen (die gezählte Karte leuchtet golden, die Rechnung wächst mit: 16, 16 + 4, 16 + 4 + 1 = 21).
       Stimmt die Zahl: Stern. Sonst sagt die App freundlich „zu viel“ oder „zu wenig“.
   - lesen:  Die Karten liegen schon. Eine von drei Zahlen antippen. Stimmt sie, zählt die App zur Probe
       zusammen, dann Stern. Sonst „zu viel“ oder „zu wenig“ (ohne die richtige Zahl zu verraten).
   - kobold: „Das soll 19 sein!“ Genau eine Karte liegt falsch. Antippen dreht eine Karte um, immer nur
       eine (tippt man eine andere an, liegt die erste wieder wie vorher). „Los“ zählt zusammen.
   Aussehen: karten (auf der Karten-Leiste wie aus Malerkrepp), lampen (am Abend: dunkles Fensterbrett),
   finger (eine Hand, Daumen rechts, Punkte über den Fingern), ziffern (Kästchen mit 1 und 0).
   Bewertet wird nur nach dem Ergebnis, mit web/kern/janein.js wie im Löser (WerkstattJaNein.bewerte,
   wert, rechnung). In den Level-Daten stehen keine Lösungen (legen: nur die Zahl; lesen: die gezeigten
   Karten und drei Zahlen zur Wahl; kobold: die gemeinte Zahl und die falsch gelegten Karten).
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken. Die Tasten bleiben in einem Level immer dieselben.
   Layout: hoch Zahl oben, Karten in der Mitte, Tasten unten; quer Karten links, Zahl und Tasten rechts.
   Die Größe der Karten (der Hand) rechnet das Plugin aus dem Platz im Feld (ResizeObserver).
   ===================================================================== */
(function () {
  'use strict';
  const J = window.WerkstattJaNein;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  if (!J) return;

  const T = '#1f2340';
  const HAUT = '#f8d9bd';
  const HAUT_LINIE = '#e3b48f';
  const GOLD = '#f2b705';
  const GOLD_HELL = '#fff4cc';
  const BLAU = '#3d5ccc';
  const BLAU_HELL = '#e9eefc';
  const ohneKopf = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const r1 = (x) => Math.round(x * 10) / 10;

  // Wörter je nach Aussehen
  const WORT = {
    karten: {
      ding: 'Karte', dinge: 'Karten', eine: 'eine Karte', die: 'die falsche Karte', sie: 'sie',
      legen: (z) => 'Lege die ' + z + '! Tippe eine Karte an, dann dreht sie sich um.',
      lesen: 'Welche Zahl zeigen die Karten? Umgedreht zählt nicht.',
      kobold: 'Der Kobold hat eine Karte falsch gelegt. Tippe sie an!',
      zuerst: 'Tippe zuerst Karten an. Dann drehen sie sich um.',
      nochmalSchauen: 'Zähl die Punkte nochmal!',
      geaendert: 'Umgedreht!',
      nurEine: 'Nur eine Karte ist falsch. Die andere liegt wieder wie vorher.',
      ja: 'da', nein: 'umgedreht',
    },
    lampen: {
      ding: 'Lampe', dinge: 'Lampen', eine: 'eine Lampe', die: 'die falsche Lampe', sie: 'sie',
      legen: (z) => 'Lass die ' + z + ' leuchten! Tippe eine Lampe an: an oder aus.',
      lesen: 'Welche Zahl leuchtet? Lampe aus zählt nicht.',
      kobold: 'Der Kobold hat eine Lampe falsch geschaltet. Tippe sie an!',
      zuerst: 'Tippe zuerst Lampen an. Dann leuchten sie.',
      nochmalSchauen: 'Schau nochmal, welche Lampen leuchten!',
      geaendert: 'Umgeschaltet!',
      nurEine: 'Nur eine Lampe ist falsch. Die andere ist wieder wie vorher.',
      ja: 'an', nein: 'aus',
    },
    finger: {
      ding: 'Finger', dinge: 'Finger', eine: 'einen Finger', die: 'den falschen Finger', sie: 'ihn',
      legen: (z) => 'Zeig die ' + z + ' mit den Fingern! Tippe einen Finger an.',
      lesen: 'Welche Zahl zeigt die Hand? Unten zählt nicht.',
      kobold: 'Der Kobold hat einen Finger falsch gezeigt. Tippe ihn an!',
      zuerst: 'Tippe zuerst Finger an. Dann gehen sie hoch.',
      nochmalSchauen: 'Schau nochmal, welche Finger oben sind!',
      geaendert: 'Bewegt!',
      nurEine: 'Nur ein Finger ist falsch. Der andere ist wieder wie vorher.',
      ja: 'oben', nein: 'unten',
    },
    ziffern: {
      ding: 'Ziffer', dinge: 'Ziffern', eine: 'ein Kästchen', die: 'die falsche Ziffer', sie: 'sie',
      legen: (z) => 'Schreib die ' + z + ' mit 1 und 0! Tippe ein Kästchen an.',
      lesen: 'Welche Zahl ist das? 1 heißt Ja, 0 heißt Nein.',
      kobold: 'Der Kobold hat eine Ziffer falsch geschrieben. Tippe sie an!',
      zuerst: 'Tippe zuerst Kästchen an. Dann steht dort 1.',
      nochmalSchauen: 'Schau nochmal, wo eine 1 steht!',
      geaendert: 'Geändert!',
      nurEine: 'Nur eine Ziffer ist falsch. Die andere ist wieder wie vorher.',
      ja: '1', nein: '0',
    },
  };

  // ---------------------------------------------------------------------
  // Bilder
  // ---------------------------------------------------------------------
  // Kleine Karte als Bild für die Meldung (Punkte oben)
  const KARTE_ICON = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<g transform="translate(6 8) rotate(-8 25 42) scale(0.6)">' + ohneKopf(J.karte(4, { nummer: false })) + '</g>' +
    '<g transform="translate(40 10) rotate(8 25 42) scale(0.6)">' + ohneKopf(J.karte(1, { ja: false })) + '</g></svg>';
  const LAMPE_ICON = '<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(14 0) scale(0.72)">' + ohneKopf(J.lampe(1, { nummer: false })) + '</g></svg>';
  const HAND_ICON = '<svg viewBox="0 0 140 140" aria-hidden="true"><g transform="translate(0 2)">' + ohneKopf(J.hand([false, false, false, true, true])) + '</g></svg>';
  const ICONS = { karten: KARTE_ICON, lampen: LAMPE_ICON, finger: HAND_ICON, ziffern: KARTE_ICON };

  // Paket-Bild: drei Karten, hinten eine umgedrehte (Nein), vorne zwei mit Punkten (Ja)
  function paketBild() {
    const k = (svg, x, y, w) => svg.replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + r1(w * 1.4) + '" ');
    return '<svg class="janein-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g>' + k(J.karte(2, { ja: false }), 29, 4, 42) + '</g>' +
      '<g transform="rotate(-10 25 60)">' + k(J.karte(4, { nummer: false }), 4, 31, 42) + '</g>' +
      '<g transform="rotate(10 75 60)">' + k(J.karte(1, { nummer: false }), 54, 31, 42) + '</g></svg>';
  }

  // ---------------------------------------------------------------------
  // Die Hand der App: wie am Blatt (Daumen rechts, kleiner Finger links, Zahlen über den Fingern),
  // aber jeder Finger hat seine eigene Spalte zum Antippen (mindestens 48 px breit, mindestens
  // 8 px Abstand). Die Spalte reicht von oben bis unten: Antippen irgendwo darin bewegt den Finger.
  //   p: Abstand von Finger zu Finger, c: Breite einer Spalte, g: Lücke. Alles in px.
  // ---------------------------------------------------------------------
  const LAENGE = [1.0, 1.28, 1.4, 1.24];   // kleiner Finger, Ring-, Mittel-, Zeigefinger (mal p)
  // Wie groß darf die Hand im Platz W · H sein? Mit Platz eine runde Handfläche (2 p hoch), sonst flacher.
  function handGroesse(W, H, max) {
    const pW = (W - 8) / 5.05, pRund = (H - 12) / 3.8, pFlach = (H - 12) / 3.0;
    const p = Math.min(pW, max, Math.max(pRund, Math.min(58, pFlach)));
    return Math.floor(Math.max(58, p));
  }
  function handMasse(p, H) {
    const g = Math.max(10, Math.round(p * 0.15));
    const c = p - g;
    const m = 4;
    const lh = Math.round(p * 0.4);                         // Zahlen-Reihe oben
    const pt = lh + Math.round(p * LAENGE[2]) + 6;          // Oberkante der Handfläche
    const ph = Math.round(Math.max(p * 1.2, Math.min(p * 2, (H || 0) - pt - 6)));
    const w = Math.round(m + 4 * p + c + p * 0.22);
    const h = pt + ph + 6;
    const rechts = m + 4 * p + c * 0.62;                    // rechter Rand der Handfläche
    const daumen = { x: rechts - p * 0.2, y: pt + p * 0.82, w: c * 0.76, l: p * 1.22, dreh: 24 };
    return { p, g, c, m, lh, pt, ph, w, h, rechts, daumen };
  }
  function spalteX(hm, i) { return hm.m + i * hm.p; }
  // Breite der Spalte: der Daumen (ganz rechts) bekommt den Rest bis zum Rand, er steht schräg hinaus
  function spalteB(hm, i) { return i < 4 ? hm.c : hm.w - spalteX(hm, 4); }

  function handSvg(ja, hm, opt) {
    opt = opt || {};
    const mark = opt.mark || [];
    const { p, c, m, lh, pt, ph, w, h, daumen } = hm;
    const sw = r1(Math.max(2.5, p * 0.045));
    const st = ' stroke="' + T + '" stroke-width="' + sw + '"';
    const geist = ' fill="none" stroke="#c3c6d6" stroke-width="2.5" stroke-dasharray="7 6"';
    let s = '<svg class="janein-hand-bild" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">';
    // Markierung der Spalte: gezählt (gold), gerade gezählt (gold, kräftig), umgedreht (blau gestrichelt)
    for (let i = 0; i < 5; i++) {
      const mk = mark[i];
      if (!mk) continue;
      const x = spalteX(hm, i) + 2, y = 2, ww = spalteB(hm, i) - 4, hh = h - 4;
      const blau = mk === 'gedreht';
      s += '<rect x="' + r1(x) + '" y="' + y + '" width="' + r1(ww) + '" height="' + hh + '" rx="' + r1(c * 0.3) + '" fill="' + (blau ? BLAU_HELL : GOLD_HELL) + '" stroke="' + (blau ? BLAU : GOLD) + '" stroke-width="' + (mk === 'gezaehlt' ? 3 : 5) + '"' + (blau ? ' stroke-dasharray="10 6"' : '') + '/>';
    }
    // Daumen oben (hinter der Handfläche, die deckt seinen Ansatz zu)
    const dg = ' transform="translate(' + r1(daumen.x) + ' ' + r1(daumen.y) + ') rotate(' + daumen.dreh + ')"';
    const dRect = (l, extra) => '<rect x="' + r1(-daumen.w / 2) + '" y="' + r1(-l) + '" width="' + r1(daumen.w) + '" height="' + r1(l + p * 0.3) + '" rx="' + r1(daumen.w / 2) + '"' + extra + '/>';
    if (ja[4]) {
      s += '<g' + dg + '>' + dRect(daumen.l, ' fill="' + HAUT + '"' + st) +
        '<path d="M' + r1(-daumen.w / 2 + 7) + ' ' + r1(-daumen.l + 13) + ' Q0 ' + r1(-daumen.l + 6) + ' ' + r1(daumen.w / 2 - 7) + ' ' + r1(-daumen.l + 13) + '" fill="none" stroke="' + HAUT_LINIE + '" stroke-width="' + r1(sw * 0.8) + '" stroke-linecap="round"/></g>';
    } else if (opt.geist) s += '<g' + dg + '>' + dRect(daumen.l, geist) + '</g>';
    // vier Finger oben (hinter der Handfläche); eingeklappte zeichnet erst die Handfläche, darauf liegen sie
    for (let i = 0; i < 4; i++) {
      const x = spalteX(hm, i) + 2, fw = c - 4;
      const oben = pt - Math.round(p * LAENGE[i]);
      if (!ja[i]) {
        if (opt.geist) s += '<rect x="' + r1(x + 1) + '" y="' + oben + '" width="' + r1(fw - 2) + '" height="' + (pt - oben) + '" rx="' + r1(fw / 2) + '"' + geist + '/>';
        continue;
      }
      s += '<rect x="' + r1(x) + '" y="' + oben + '" width="' + r1(fw) + '" height="' + r1(pt + p * 0.5 - oben) + '" rx="' + r1(fw / 2) + '" fill="' + HAUT + '"' + st + '/>' +
        '<path d="M' + r1(x + 7) + ' ' + (oben + 13) + ' Q' + r1(x + fw / 2) + ' ' + (oben + 6) + ' ' + r1(x + fw - 7) + ' ' + (oben + 13) + '" fill="none" stroke="' + HAUT_LINIE + '" stroke-width="' + r1(sw * 0.8) + '" stroke-linecap="round"/>';
    }
    // Handfläche: oben ohne Linie (die Finger wachsen heraus), rechts eine Schulter zum Daumen, unten rund
    const l = m - 1, r = hm.rechts, u = pt + ph, rb = Math.min(p * 0.9, ph * 0.5);
    const xs = spalteX(hm, 3) + c;
    s += '<path d="M' + r1(l) + ' ' + pt + ' L' + r1(xs) + ' ' + pt + ' C' + r1(xs + p * 0.3) + ' ' + pt + ' ' + r1(r) + ' ' + r1(pt + p * 0.1) + ' ' + r1(r) + ' ' + r1(pt + p * 0.5) +
      ' L' + r1(r) + ' ' + r1(u - rb) + ' C' + r1(r) + ' ' + r1(u - rb * 0.3) + ' ' + r1(r - rb * 0.45) + ' ' + r1(u) + ' ' + r1(r - rb) + ' ' + r1(u) +
      ' L' + r1(l + rb) + ' ' + r1(u) + ' C' + r1(l + rb * 0.45) + ' ' + r1(u) + ' ' + r1(l) + ' ' + r1(u - rb * 0.3) + ' ' + r1(l) + ' ' + r1(u - rb) + ' Z" fill="' + HAUT + '"' + st + ' stroke-linejoin="round"/>';
    s += '<rect x="' + r1(l + sw) + '" y="' + r1(pt - sw) + '" width="' + r1(xs - l - sw) + '" height="' + r1(sw * 2) + '" fill="' + HAUT + '"/>';
    // Eingeklappte Finger: nach unten auf die Handfläche geklappt (oben der Knöchel, unten die Fingerspitze)
    for (let i = 0; i < 4; i++) {
      if (ja[i]) continue;
      const x = spalteX(hm, i) + 3, fw = c - 6;
      const o = pt - Math.round(p * 0.16), un = pt + Math.min(p * 0.95, ph * 0.58);
      const gy = o + (un - o) * 0.46;   // Falte am Fingergelenk
      s += '<rect x="' + r1(x) + '" y="' + o + '" width="' + r1(fw) + '" height="' + r1(un - o) + '" rx="' + r1(fw / 2) + '" fill="' + HAUT + '"' + st + '/>' +
        '<path d="M' + r1(x + fw * 0.3) + ' ' + r1(gy) + ' Q' + r1(x + fw / 2) + ' ' + r1(gy + p * 0.06) + ' ' + r1(x + fw * 0.7) + ' ' + r1(gy) + '" fill="none" stroke="' + HAUT_LINIE + '" stroke-width="' + r1(sw * 0.9) + '" stroke-linecap="round"/>';
    }
    // Daumen eingeklappt: liegt quer unten auf der Handfläche (zum größten Teil in seiner Spalte)
    if (!ja[4]) {
      const dx1 = spalteX(hm, 4) - p * 0.28, dx2 = r - p * 0.06, dh = Math.min(p * 0.48, ph * 0.3), dy = pt + Math.min(p * 0.95, ph * 0.58) + p * 0.1;
      s += '<rect x="' + r1(dx1) + '" y="' + r1(dy) + '" width="' + r1(dx2 - dx1) + '" height="' + r1(dh) + '" rx="' + r1(dh / 2) + '" fill="' + HAUT + '"' + st + '/>' +
        '<path d="M' + r1(dx1 + 13) + ' ' + r1(dy + 7) + ' Q' + r1(dx1 + 6) + ' ' + r1(dy + dh / 2) + ' ' + r1(dx1 + 13) + ' ' + r1(dy + dh - 7) + '" fill="none" stroke="' + HAUT_LINIE + '" stroke-width="' + r1(sw * 0.8) + '" stroke-linecap="round"/>';
    }
    // Zahlen über den Fingern (wie die Schlüssel-Hand am Blatt)
    const wv = J.werte(5);
    for (let i = 0; i < 5; i++) {
      const cx = i < 4 ? spalteX(hm, i) + c / 2 : daumen.x + Math.sin(daumen.dreh * Math.PI / 180) * daumen.l;
      s += '<text x="' + r1(cx) + '" y="' + r1(lh / 2 + 1) + '" font-family="Andika, sans-serif" font-size="' + r1(Math.max(16, p * 0.3)) + '" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + T + '">' + wv[i] + '</text>';
    }
    return s + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  function neu(api) {
    const lv = api.lv;
    const z = api.zustand;
    for (const k of Object.keys(z)) if (!['beob', 'masse', 'groesse'].includes(k)) delete z[k];
    z.aufgabe = lv.aufgabe;
    z.aussehen = lv.aussehen || 'karten';
    z.n = J.anzahl(lv.anzahl);
    z.werte = J.werte(z.n);
    z.w = WORT[z.aussehen] || WORT.karten;
    if (z.aufgabe === 'legen') z.anfang = z.werte.map(() => false);           // alle umgedreht: 0
    else z.anfang = J.jaAusWerten(lv.ja, z.n);                                 // so liegen sie da
    z.ja = z.anfang.slice();
    z.gedreht = null;      // kobold: die eine umgedrehte Karte
    z.gewaehlt = null;     // lesen: die angetippte Zahl
    z.zaehl = null;        // { liste, k, fertig } beim Zusammenzählen
    z.ergebnis = null;     // null | 'nicht' | 'geschafft'
    z.laeuft = false;
    z.fertig = false;
    z.geaendert = false;
  }
  const tippbar = (z) => z.aufgabe !== 'lesen';

  // Markierungen einer Stelle: 'zaehlt' (wird gerade gezählt) oder 'gezaehlt', dazu 'gedreht' (Kobold)
  function markenVon(z, i) {
    const m = [];
    if (z.zaehl) {
      const pos = z.zaehl.liste.indexOf(i);
      if (pos >= 0 && pos === z.zaehl.k && !z.zaehl.fertig) m.push('zaehlt');
      else if (pos >= 0 && pos <= z.zaehl.k) m.push('gezaehlt');
    }
    if (z.aufgabe === 'kobold' && z.gedreht === i) m.push('gedreht');
    return m;
  }
  // Für die Hand eine Markierung pro Finger: gerade gezählt vor umgedreht vor gezählt
  function markVon(z, i) {
    const m = markenVon(z, i);
    return m.includes('zaehlt') ? 'zaehlt' : m.includes('gedreht') ? 'gedreht' : m[0] || '';
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Feld
  // ---------------------------------------------------------------------
  function geruest(api) {
    const z = api.zustand;
    if (!api.feld) return;
    api.feld.innerHTML = '<div class="janein-feld janein-' + z.aussehen + '">' +
      '<div class="janein-buehne"><div class="janein-inhalt"><div class="janein-dinge"></div>' +
      '<div class="janein-rechnung" aria-live="polite"></div></div></div></div>';
  }
  function ding(api, i, inhalt, cls) {
    const z = api.zustand;
    const name = (z.aussehen === 'finger' ? J.FINGER[i] : z.w.ding + ' ' + z.werte[i]) + ': ' + (z.ja[i] ? z.w.ja : z.w.nein);
    const k = 'janein-ding ' + cls + (z.ja[i] ? ' janein-ja' : ' janein-nein') + markenVon(z, i).map((x) => ' janein-' + x).join('');
    if (!tippbar(z)) return '<span class="' + k + '" data-i="' + i + '" role="img" aria-label="' + api.esc(name) + '">' + inhalt + '</span>';
    return '<button class="' + k + '" data-aktion="janein-dreh" data-i="' + i + '" data-umschalter aria-label="' + api.esc(name) + '"' +
      (z.laeuft || z.fertig ? ' disabled' : '') + '>' + inhalt + '</button>';
  }

  function zeichneDinge(api) {
    const z = api.zustand;
    const buehne = api.feld && api.feld.querySelector('.janein-buehne');
    const innen = buehne && buehne.querySelector('.janein-dinge');
    const rechnung = buehne && buehne.querySelector('.janein-rechnung');
    if (!innen || !rechnung) return;
    // Platz für die Karten: die Bühne ohne die Rechnung darunter (und 8 px Abstand)
    const rh = rechnung.offsetHeight;
    const W = buehne.clientWidth, H = buehne.clientHeight - rh - 8;
    if (W < 10 || H < 10) return;
    z.masse = { W: buehne.clientWidth, H: buehne.clientHeight, rh };
    const gross = Math.min(window.innerWidth, window.innerHeight) >= 700;
    const n = z.n;
    const svgVoll = (svg) => svg.replace('<svg ', '<svg width="100%" height="100%" aria-hidden="true" ').replace(/ role="img" aria-label="[^"]*"/, '');
    let html = '';
    if (z.aussehen === 'finger') {
      const hm = handMasse(handGroesse(W, H, gross ? 124 : 92), H);
      const mark = [0, 1, 2, 3, 4].map((i) => markVon(z, i));
      let knoepfe = '';
      if (tippbar(z)) {
        for (let i = 0; i < 5; i++) {
          const mk = mark[i];
          const name = J.FINGER[i] + ' (' + z.werte[i] + '): ' + (z.ja[i] ? z.w.ja : z.w.nein);
          knoepfe += '<button class="janein-finger' + (z.ja[i] ? ' janein-ja' : ' janein-nein') + (mk ? ' janein-' + mk : '') + '" data-aktion="janein-dreh" data-i="' + i + '" data-umschalter aria-label="' + api.esc(name) + '"' +
            ' style="left:' + spalteX(hm, i) + 'px;top:0;width:' + r1(spalteB(hm, i)) + 'px;height:' + hm.h + 'px"' + (z.laeuft || z.fertig ? ' disabled' : '') + '></button>';
        }
      }
      html = '<div class="janein-hand" style="width:' + hm.w + 'px;height:' + hm.h + 'px" role="img" aria-label="Hand: ' + api.esc(z.ja.map((x, i) => J.FINGER[i] + ' ' + (x ? 'oben' : 'unten')).join(', ')) + '">' +
        handSvg(z.ja, hm, { mark, geist: tippbar(z) }) + knoepfe + '</div>';
    } else if (z.aussehen === 'ziffern') {
      const g = gross ? 14 : 10;
      const lh = gross ? 30 : 22;
      const w = Math.floor(Math.max(tippbar(z) ? 48 : 36, Math.min((W - (n - 1) * g) / n, H - lh - 6, gross ? 110 : 76)));
      let r = '';
      for (let i = 0; i < n; i++) {
        r += '<span class="janein-platz"><span class="janein-wert">' + z.werte[i] + '</span>' +
          ding(api, i, '<span class="janein-ziffer-text">' + (z.ja[i] ? '1' : '0') + '</span>', 'janein-ziffer') + '</span>';
      }
      html = '<div class="janein-reihe" style="--w:' + w + 'px;--g:' + g + 'px;--lh:' + lh + 'px">' + r + '</div>';
    } else if (z.aussehen === 'lampen') {
      const g = gross ? 16 : 8;
      const pad = gross ? 16 : 10;
      const w = Math.floor(Math.max(tippbar(z) ? 48 : 36, Math.min((W - 2 * pad - (n - 1) * g) / n, (H - 2 * pad) / 1.4, gross ? 140 : 100)));
      let r = '';
      for (let i = 0; i < n; i++) r += ding(api, i, svgVoll(J.lampe(z.werte[i], { an: z.ja[i], hell: true })), 'janein-lampe');
      html = '<div class="janein-nacht" style="--w:' + w + 'px;--g:' + g + 'px;--pad:' + pad + 'px"><div class="janein-reihe">' + r + '</div></div>';
    } else {
      const g = gross ? 16 : n >= 6 ? 8 : 10;
      const lh = gross ? 40 : 28;
      const w = Math.floor(Math.max(tippbar(z) ? 48 : 36, Math.min((W - (n - 1) * g - 8) / n, (H - lh - 6) / 1.4, gross ? 150 : 110)));
      let r = '', l = '';
      for (let i = 0; i < n; i++) {
        r += ding(api, i, svgVoll(J.karte(z.werte[i], { ja: z.ja[i] })), 'janein-karte');
        l += '<span class="janein-leiste-zahl">' + z.werte[i] + '</span>';
      }
      html = '<div class="janein-karten-block" style="--w:' + w + 'px;--g:' + g + 'px;--lh:' + lh + 'px"><div class="janein-reihe">' + r + '</div>' +
        '<div class="janein-leiste" aria-hidden="true">' + l + '</div></div>';
    }
    innen.innerHTML = html;
  }

  function zeichneRechnung(api) {
    const z = api.zustand;
    const box = api.feld && api.feld.querySelector('.janein-rechnung');
    if (!box) return;
    if (!z.zaehl) {
      box.innerHTML = '';
      box.classList.remove('janein-gut', 'janein-anders');
      if (z.masse && box.offsetHeight !== z.masse.rh) zeichneDinge(api);
      return;
    }
    const t = z.zaehl.liste.slice(0, z.zaehl.k + 1).map((i) => z.werte[i]);
    let s = '';
    if (z.zaehl.fertig) {
      const summe = J.wert(z.ja, z.n);
      if (t.length === 0) s = '<span class="janein-summe">0</span>';
      else if (t.length === 1) s = '<span class="janein-summe">' + summe + '</span>';
      else s = t.map((v) => '<span>' + v + '</span>').join('<span class="janein-plus">+</span>') + '<span class="janein-plus">=</span><span class="janein-summe">' + summe + '</span>';
    } else {
      s = t.map((v, j) => '<span' + (j === t.length - 1 ? ' class="janein-neu"' : '') + '>' + v + '</span>').join('<span class="janein-plus">+</span>');
    }
    if (z.aussehen === 'ziffern' && z.zaehl.fertig) s = '<span class="janein-ziffernfolge">' + J.ziffern(z.ja) + '</span><span class="janein-plus">ist</span>' + s;
    box.innerHTML = '<span class="janein-rechnung-zeile">' + s + '</span>';
    box.classList.toggle('janein-gut', z.ergebnis === 'geschafft');
    box.classList.toggle('janein-anders', z.ergebnis === 'nicht');
    // Braucht die Rechnung zwei Zeilen, werden die Karten etwas kleiner
    if (z.masse && box.offsetHeight !== z.masse.rh) zeichneDinge(api);
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Zahl (oben bzw. rechts) und Tasten
  // ---------------------------------------------------------------------
  function zeichneZiel(api) {
    const z = api.zustand;
    const box = api.programm;
    if (!box) return;
    const lv = api.lv;
    let s;
    if (z.aufgabe === 'legen') {
      s = '<span class="janein-ziel-text">' + (z.aussehen === 'lampen' ? 'Leuchten soll' : z.aussehen === 'finger' ? 'Zeig die' : z.aussehen === 'ziffern' ? 'Schreib die' : 'Lege die') + '</span>' +
        '<span class="janein-blase">' + lv.zahl + '</span>';
    } else if (z.aufgabe === 'kobold') {
      s = '<span class="janein-sprech">Das soll <b>' + lv.zahl + '</b> sein!</span>';
    } else {
      const g = z.gewaehlt;
      s = '<span class="janein-gleich">=</span><span class="janein-kasten' + (g === null ? ' janein-leer' : '') + (z.ergebnis === 'nicht' ? ' janein-anders' : '') + '">' + (g === null ? '?' : g) + '</span>';
    }
    box.innerHTML = '<div class="janein-ziel janein-ziel-' + z.aufgabe + '">' + s + '</div>';
  }

  function zeichneTasten(api) {
    const z = api.zustand;
    const box = api.tasten;
    if (!box) return;
    if (z.aufgabe === 'lesen') {
      let r = '';
      for (const x of api.lv.wahl || []) {
        r += api.taste('janein-zahl', '<span>' + x + '</span>', { cls: 'janein-zahl' + (z.gewaehlt === x ? ' janein-gewaehlt' : ''), daten: 'data-zahl="' + x + '"', label: 'Die Zahl ' + x, aus: z.laeuft || z.fertig });
      }
      box.innerHTML = '<div class="reihe janein-wahl" data-n="' + (api.lv.wahl || []).length + '">' + r + '</div>';
      return;
    }
    const nichts = z.aufgabe === 'kobold' ? z.gedreht === null : !z.ja.some(Boolean);
    box.innerHTML = '<div class="reihe">' +
      api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: z.aufgabe === 'kobold' ? 'Nochmal: so wie es der Kobold gelegt hat' : 'Nochmal: alle ' + z.w.dinge + ' wie am Anfang' }) +
      api.taste('los', api.ICON.los + '<span>Los</span>', { cls: 'breit los', aus: z.laeuft || z.fertig, grau: nichts }) +
      '</div>';
  }

  function zeichne(api) {
    zeichneZiel(api);
    zeichneTasten(api);
    zeichneDinge(api);
    zeichneRechnung(api);
  }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  function icon(api) {
    const z = api.zustand;
    return z.aufgabe === 'kobold' ? api.sym('kobold') : ICONS[z.aussehen] || KARTE_ICON;
  }
  function grundMeldung(api) {
    const z = api.zustand;
    const lv = api.lv;
    const profi = z.n !== 5 ? 'Profi mit ' + z.n + ' ' + z.w.dinge + ': ' : '';
    if (z.aufgabe === 'legen') return api.meldung(profi + z.w.legen(lv.zahl), '', icon(api));
    if (z.aufgabe === 'lesen') return api.meldung(profi + z.w.lesen + ' Tippe die Zahl an.', '', icon(api));
    return api.meldung(profi + z.w.kobold, '', icon(api));
  }

  // ---------------------------------------------------------------------
  // Antippen: umdrehen (legen, kobold), Zahl wählen (lesen)
  // ---------------------------------------------------------------------
  function vorAenderung(api) {
    const z = api.zustand;
    if (z.laeuft || z.fertig) return false;
    z.zaehl = null;
    z.ergebnis = null;
    return true;
  }
  function dreh(api, i) {
    const z = api.zustand;
    if (!tippbar(z) || !Number.isInteger(i) || i < 0 || i >= z.n) return;
    if (!vorAenderung(api)) return;
    if (z.aufgabe === 'legen') {
      z.ja[i] = !z.ja[i];
      z.geaendert = true;
      zeichne(api);
      if (!z.ja.some(Boolean)) return grundMeldung(api);
      return api.meldung('Fertig mit der ' + api.lv.zahl + '? Dann tippe auf „Los“!', 'hinweis', icon(api));
    }
    // kobold: immer nur eine Stelle umgedreht
    let zurueck = false;
    if (z.gedreht === i) z.gedreht = null;
    else { zurueck = z.gedreht !== null; z.gedreht = i; }
    z.ja = z.anfang.slice();
    if (z.gedreht !== null) z.ja[z.gedreht] = !z.ja[z.gedreht];
    zeichne(api);
    if (z.gedreht === null) return grundMeldung(api);
    if (zurueck) return api.meldung(z.w.nurEine, 'hinweis', api.sym('kobold'));
    api.meldung(z.w.geaendert + ' Stimmt es jetzt? Tippe auf „Los“.', 'hinweis', api.sym('kobold'));
  }

  function wahl(api, x) {
    const z = api.zustand;
    if (z.aufgabe !== 'lesen' || z.laeuft || z.fertig) return;
    z.gewaehlt = x;
    // Bewertet mit dem Kern (die richtige Zahl steht nirgends in den Daten)
    const b = J.bewerte(api.lv, x);
    if (b.ok) {
      z.ergebnis = null;
      return zaehle(api, () => {
        z.fertig = true;
        z.ergebnis = 'geschafft';
        zeichne(api);
        api.geschafft({ zusatz: rechnungText(z) });
      });
    }
    z.ergebnis = 'nicht';
    z.zaehl = null;
    zeichne(api);
    api.meldung(x + ' ist ' + (b.art === 'zuviel' ? 'zu viel' : 'zu wenig') + '. ' + z.w.nochmalSchauen, 'hinweis', icon(api));
  }

  // Die Rechnung für das Geschafft-Fenster, ohne Zeilenumbruch mitten in der Rechnung (geschützte Leerzeichen)
  function rechnungText(z) { return J.rechnung(z.ja, z.n).replace(/ /g, '\u00a0'); }

  // ---------------------------------------------------------------------
  // Los: die Punkte der Ja-Karten langsam zusammenzählen, dann bewerten
  // ---------------------------------------------------------------------
  function zaehle(api, danach) {
    const z = api.zustand;
    const liste = [];
    z.ja.forEach((x, i) => { if (x) liste.push(i); });
    z.zaehl = { liste, k: -1, fertig: false };
    z.laeuft = true;
    api.laeuft(true);
    zeichne(api);
    api.meldung('Zusammenzählen …', 'laeuft', icon(api));
    // Etwa eine Karte pro Sekunde (bei TEMPO 600: 900 ms), damit das Kind mitzählen kann
    const tempo = Math.max(30, Math.round(api.TEMPO * 1.5));
    const schritt = () => {
      if (z.zaehl.k + 1 < liste.length) {
        z.zaehl.k++;
        zeichneDinge(api);
        zeichneRechnung(api);
        api.spaeter(schritt, tempo);
        return;
      }
      z.zaehl.fertig = true;
      z.laeuft = false;
      api.laeuft(false);
      danach(J.wert(z.ja, z.n));
    };
    api.spaeter(schritt, Math.min(250, api.TEMPO));
  }

  function los(api) {
    const z = api.zustand;
    if (z.laeuft || z.fertig || z.aufgabe === 'lesen') return;
    if (z.aufgabe === 'kobold' && z.gedreht === null) return api.meldung('Tippe zuerst ' + z.w.die + ' an.', 'hinweis', api.sym('kobold'));
    if (z.aufgabe === 'legen' && !z.ja.some(Boolean)) return api.meldung(z.w.zuerst, 'hinweis', icon(api));
    z.ergebnis = null;
    zaehle(api, (ist) => {
      // Bewertet mit dem Kern: legen nach der Zahl der gelegten Karten, kobold nach der umgedrehten Stelle
      const b = J.bewerte(api.lv, z.aufgabe === 'legen' ? z.ja.slice() : z.gedreht);
      if (b.ok) {
        z.fertig = true;
        z.ergebnis = 'geschafft';
        zeichne(api);
        const r = rechnungText(z);
        const zus = z.aussehen === 'ziffern' ? J.ziffern(z.ja) + ' ist ' + r : r;
        return api.geschafft({ zusatz: z.aufgabe === 'kobold' ? 'Kobold erwischt! ' + zus : zus });
      }
      z.ergebnis = 'nicht';
      zeichne(api);
      if (z.aufgabe === 'kobold') return api.meldung('Das ist ' + ist + ', nicht ' + api.lv.zahl + '. Such den Kobold nochmal!', 'hinweis', api.sym('kobold'));
      const art = ist > api.lv.zahl ? 'zu viel' : 'zu wenig';
      api.meldung('Das ist ' + ist + '. ' + art.charAt(0).toUpperCase() + art.slice(1) + '! Probier es nochmal.', 'hinweis', icon(api));
    });
  }

  // ---------------------------------------------------------------------
  // Plugin
  // ---------------------------------------------------------------------
  function start(api) {
    neu(api);
    const sp = api.feld && api.feld.closest('.spiel');
    if (sp) sp.classList.add('janein-' + api.lv.aufgabe, 'janein-aussehen-' + (api.lv.aussehen || 'karten'));
    geruest(api);
    zeichne(api);
    // Neu zeichnen, wenn sich der Platz ändert (Drehen, längere Rechnung): Größe der Karten anpassen.
    // Gleich im ResizeObserver (nicht erst im nächsten Bild): Die Bühne selbst ändert sich dabei nicht.
    // Dazu das resize-Ereignis des Fensters, falls ein Browser den ResizeObserver spät meldet.
    const z = api.zustand;
    const buehne = api.feld && api.feld.querySelector('.janein-buehne');
    stopp(api);
    if (!buehne) return;
    z.groesse = () => {
      if (!buehne.isConnected) return;
      const m = z.masse;
      if (!m || Math.abs(buehne.clientWidth - m.W) > 1 || Math.abs(buehne.clientHeight - m.H) > 1) zeichneDinge(api);
    };
    if (window.ResizeObserver) {
      z.beob = new ResizeObserver(z.groesse);
      z.beob.observe(buehne);
    }
    window.addEventListener('resize', z.groesse);
  }
  function stopp(api) {
    const z = api.zustand;
    if (!z) return;
    if (z.beob) { z.beob.disconnect(); z.beob = null; }
    if (z.groesse) { window.removeEventListener('resize', z.groesse); z.groesse = null; }
  }

  SPIELE.janein = {
    icon: () => paketBild(),
    start,
    grundMeldung,
    klick(aktion, el, api) {
      if (aktion === 'janein-dreh') return dreh(api, parseInt(el.dataset.i, 10));
      if (aktion === 'janein-zahl') return wahl(api, parseInt(el.dataset.zahl, 10));
    },
    los,
    nochmal(api) {
      neu(api);
      api.laeuft(false);
      zeichne(api);
      grundMeldung(api);
    },
    stopp,
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man ein Paket oder Level direkt (QR-Code am Blatt, Neuladen), fehlte sonst das
  // Paket-Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const DATEN = window.WERKSTATT_DATEN;
    if (!app || !ans || !DATEN || !['start', 'block', 'paket', 'level'].includes(ans)) return;
    if (!DATEN.pakete.some((p) => p.art === 'janein' || p.levels.some((l) => l.art === 'janein'))) return;
    // Schon richtig gezeichnet (ein anderes Plugin hat neu zeichnen lassen)?
    if (ans === 'level' && app.querySelector('.janein-feld')) return;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const b = document.createElement('button');
    b.hidden = true;
    let m;
    if (!h) b.dataset.aktion = 'heim';
    else if ((m = /^block-([a-d])$/i.exec(h))) { b.dataset.aktion = 'block'; b.dataset.block = m[1].toLowerCase(); }
    else if ((m = /^(e\d+)$/i.exec(h))) { b.dataset.aktion = 'paket'; b.dataset.paket = m[1].toLowerCase(); }
    else if ((m = /^(e\d+)\/(\d+)$/i.exec(h))) { b.dataset.aktion = 'level'; b.dataset.paket = m[1].toLowerCase(); b.dataset.i = String(parseInt(m[2], 10) - 1); }
    else return;
    app.appendChild(b);
    b.click();
    if (b.isConnected) b.remove();
  })();
})();
