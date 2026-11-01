/* =====================================================================
   Werkstatt-Kern: Kästchenbilder und Kästchen-Codes (Einheit 8)
   Dieselbe Datei läuft im Rätsel-Löser (Node: import), beim Bauen der
   PDFs (Chrome) und in der Web-App (<script>). Keine Abhängigkeiten.
   Ergebnis: globalThis.WerkstattKaestchen

   Ein Kästchenbild ist ein Rechteck aus Kästchen, jedes Kästchen hat
   eine Farbe. Der Kästchen-Code beschreibt es Zeile für Zeile, von
   links nach rechts: „3 weiß, 2 schwarz, 3 weiß“.

   Schreibweise in den Rätsel-Daten (raetsel/e8.json):
     Bild:   ein Text pro Zeile, ein Zeichen pro Kästchen:
             "." = weiß, "#" = schwarz, sonst der Buchstabe der Farbe (FARBEN)
     Zeile:  "3w 2s 3w"          (Zahl und Farbe, durch Leerzeichen getrennt)
             "3[1s 1w] 1s"       Zauber-Kasten in der Zeile: „3-mal: 1 schwarz, 1 weiß“,
                                  dann 1 schwarz (2- bis 5-mal, 1 bis 3 Teile im Kasten)
     Code:   Liste von Zeilen, oder ein Text mit ";" zwischen den Zeilen
             "4{1w 4s 1w}"       Zauber-Kasten für Zeilen: diese Zeile 4-mal untereinander
             "3{1s 1w / 1w 1s}"  im Schwerer-Teil eine Gruppe von 2 bis 3 Zeilen
             Nicht verschachtelt: In einem Zeilen-Kasten steht kein Kasten in der Zeile.
     Nur Zahlen (Profi): "3 2 3" heißt 3 weiß, 2 schwarz, 3 weiß (immer abwechselnd,
             zuerst weiß; beginnt die Zeile schwarz, steht vorne eine 0).
   Länge eines Codes = wie viele Zahlen man schreibt (wie Karten zählen in Einheit 5):
     jeder Teil („3 weiß“) 1 Zahl, ein Zauber-Kasten 1 Zahl („3-mal“) plus alles darin.
   ===================================================================== */
(function (g) {
  'use strict';

  const FARBEN = {
    w: { name: 'weiß', hex: '#ffffff' },
    s: { name: 'schwarz', hex: '#1f2340' },
    r: { name: 'rot', hex: '#e0453a' },
    g: { name: 'grün', hex: '#3aa856' },
    b: { name: 'blau', hex: '#3a7be0' },
    e: { name: 'gelb', hex: '#f5c518' },
    o: { name: 'orange', hex: '#f08a24' },
    n: { name: 'braun', hex: '#9a5b2c' },
  };
  const TINTE = '#1f2340';
  const ROT = '#d1335b';
  const ZAUBER = '#7a4fd1';
  const WDH_MIN = 2;
  const WDH_MAX = 5;
  const MAX_INNEN = 3;       // Teile in einem Zauber-Kasten der Zeile (wie Befehle in Einheit 5)
  const MAX_ZEILEN = 3;      // Zeilen in einem Zeilen-Kasten (Gruppe)
  const MAX_LAUF = 20;

  function farbe(f) {
    if (!FARBEN[f]) throw new Error('Unbekannte Farbe „' + f + '“ (' + Object.keys(FARBEN).join(', ') + ')');
    return f;
  }
  function wdhOk(w) {
    if (!(w >= WDH_MIN && w <= WDH_MAX)) throw new Error(w + '-mal geht nicht (' + WDH_MIN + ' bis ' + WDH_MAX + ')');
    return w;
  }

  // ---------------------------------------------------------------------
  // Lesen
  //   Zeile:   { teile: [ { n, f } | { wdh, teile: [ { n, f } … ] } ] }
  //   Eintrag: Zeile | { wdh, zeilen: [ Zeile … ] }
  // ---------------------------------------------------------------------
  function liesLauf(n, f) {
    const z = parseInt(n, 10);
    if (!(z >= 1 && z <= MAX_LAUF)) throw new Error('Zahl ' + n + ' geht nicht (1 bis ' + MAX_LAUF + ')');
    return { n: z, f: farbe(f) };
  }
  function liesZeile(text) {
    if (text && typeof text === 'object' && Array.isArray(text.teile)) return text;
    const s = String(text === undefined || text === null ? '' : text).trim();
    if (!s) throw new Error('Leere Code-Zeile');
    const re = /\s*(?:(\d+)\s*\[([^\]\[{}]*)\]|(\d+)\s*([a-z]))\s*/y;
    const teile = [];
    let pos = 0;
    while (pos < s.length) {
      re.lastIndex = pos;
      const m = re.exec(s);
      if (!m) throw new Error('Code-Zeile nicht lesbar ab „' + s.slice(pos) + '“ (ein Kasten im Kasten geht nicht)');
      if (m[1]) {
        const innen = liesZeile(m[2]).teile;
        if (innen.some((t) => t.wdh)) throw new Error('Kein Kasten im Kasten');
        if (innen.length < 1 || innen.length > MAX_INNEN) throw new Error('Im Zauber-Kasten 1 bis ' + MAX_INNEN + ' Teile');
        teile.push({ wdh: wdhOk(parseInt(m[1], 10)), teile: innen });
      } else teile.push(liesLauf(m[3], m[4]));
      pos = re.lastIndex;
    }
    return { teile };
  }
  // "0 2 6": abwechselnd weiß und schwarz, zuerst weiß (nur vorne darf 0 stehen)
  function liesZahlen(text) {
    const z = String(text).trim().split(/\s+/).map((x) => parseInt(x, 10));
    if (!z.length || z.some((x) => !(x >= 0))) throw new Error('Nur-Zahlen-Zeile „' + text + '“ nicht lesbar');
    const teile = [];
    z.forEach((n, i) => {
      if (n === 0) { if (i !== 0) throw new Error('0 nur ganz vorne (wenn die Zeile schwarz beginnt)'); return; }
      teile.push(liesLauf(n, i % 2 === 0 ? 'w' : 's'));
    });
    if (!teile.length) throw new Error('Leere Zeile');
    return { teile };
  }
  function liesEintrag(e) {
    if (e && typeof e === 'object' && !Array.isArray(e)) {
      if (Array.isArray(e.teile)) return e;
      if (e.wdh !== undefined) return kastenZeilen(e.wdh, e.zeilen || []);
    }
    const s = String(e).trim();
    const m = /^(\d+)\s*\{([^{}]*)\}$/.exec(s);
    if (m) return kastenZeilen(parseInt(m[1], 10), m[2].split('/'));
    if (/[{}]/.test(s)) throw new Error('Zeilen-Kasten nicht lesbar: „' + s + '“ (so: 4{1w 4s 1w})');
    return liesZeile(s);
  }
  function kastenZeilen(w, zeilen) {
    wdhOk(w);
    const zz = zeilen.map(liesZeile);
    if (zz.length < 1 || zz.length > MAX_ZEILEN) throw new Error('Im Zeilen-Kasten 1 bis ' + MAX_ZEILEN + ' Zeilen');
    if (zz.some((z) => z.teile.some((t) => t.wdh))) throw new Error('Kein Kasten im Kasten: im Zeilen-Kasten stehen nur einfache Zeilen');
    return { wdh: w, zeilen: zz };
  }
  function liesCode(code) {
    let liste = code;
    if (typeof code === 'string') liste = code.split(';').map((x) => x.trim()).filter(Boolean);
    if (!Array.isArray(liste) || !liste.length) throw new Error('Code braucht mindestens eine Zeile');
    return liste.map(liesEintrag);
  }
  const istKasten = (e) => e && e.zeilen !== undefined;

  // ---------------------------------------------------------------------
  // Schreiben (Text)
  // ---------------------------------------------------------------------
  function teilText(t) { return t.wdh ? t.wdh + '[' + t.teile.map(teilText).join(' ') + ']' : t.n + t.f; }
  function zeileText(z) { return liesZeile(z).teile.map(teilText).join(' '); }
  function eintragText(e) {
    e = liesEintrag(e);
    return istKasten(e) ? e.wdh + '{' + e.zeilen.map(zeileText).join(' / ') + '}' : zeileText(e);
  }
  function codeText(code) { return liesCode(code).map(eintragText); }
  // in Worten: „3 weiß, 2 schwarz, 3 weiß“ / „3-mal: 1 schwarz, 1 weiß“
  function teilWorte(t) {
    if (t.wdh) return t.wdh + '-mal: ' + t.teile.map(teilWorte).join(', ');
    return t.n + ' ' + FARBEN[t.f].name;
  }
  // nach einem Zauber-Kasten geht es mit „dann“ weiter: „3-mal: 1 schwarz, 1 weiß, dann 1 schwarz“
  function zeileWorte(z) {
    const t = liesZeile(z).teile;
    return t.map((x, i) => (i === 0 ? '' : t[i - 1].wdh ? ', dann ' : ', ') + teilWorte(x)).join('');
  }

  // ---------------------------------------------------------------------
  // Ausrollen: Code → Bild (Liste von Zeilen, jede eine Liste von Farben)
  // ---------------------------------------------------------------------
  function rolleZeile(z) {
    const aus = [];
    for (const t of liesZeile(z).teile) {
      if (t.wdh) for (let i = 0; i < t.wdh; i++) for (const u of t.teile) for (let k = 0; k < u.n; k++) aus.push(u.f);
      else for (let k = 0; k < t.n; k++) aus.push(t.f);
    }
    return aus;
  }
  // Zeilen des ausgerollten Codes mit Herkunft: [{ reihe, eintrag, wiederholung }]
  function zeilenListe(code) {
    const aus = [];
    liesCode(code).forEach((e, i) => {
      if (istKasten(e)) {
        for (let w = 0; w < e.wdh; w++) e.zeilen.forEach((z) => aus.push({ zeile: z, eintrag: i, runde: w + 1 }));
      } else aus.push({ zeile: e, eintrag: i, runde: 0 });
    });
    return aus;
  }
  function ausrollen(code) { return zeilenListe(code).map((x) => rolleZeile(x.zeile)); }

  // ---------------------------------------------------------------------
  // Zählen: wie viele Zahlen hat der Code?
  // ---------------------------------------------------------------------
  function zahlenZeile(z) { return liesZeile(z).teile.reduce((s, t) => s + (t.wdh ? 1 + t.teile.length : 1), 0); }
  function zahlen(code) {
    return liesCode(code).reduce((s, e) => s + (istKasten(e) ? 1 + e.zeilen.reduce((a, z) => a + zahlenZeile(z), 0) : zahlenZeile(e)), 0);
  }

  // ---------------------------------------------------------------------
  // Bilder
  // ---------------------------------------------------------------------
  const ZEICHEN = { '.': 'w', '#': 's' };
  function liesBild(bild) {
    if (!Array.isArray(bild) || !bild.length) throw new Error('Bild braucht mindestens eine Zeile');
    return bild.map((z) => {
      if (Array.isArray(z)) return z.map(farbe);
      return Array.from(String(z)).map((c) => farbe(ZEICHEN[c] || c));
    });
  }
  function bildText(bild) {
    return liesBild(bild).map((z) => z.map((f) => (f === 'w' ? '.' : f === 's' ? '#' : f)).join(''));
  }
  function pruefeRechteck(bild) {
    const b = liesBild(bild);
    const w = b[0].length;
    b.forEach((z, i) => { if (z.length !== w) throw new Error('Bild-Zeile ' + (i + 1) + ' hat ' + z.length + ' Kästchen, die erste hat ' + w); });
    return { b: w, h: b.length };
  }
  function laeufe(reihe) {
    const aus = [];
    for (const f of reihe) {
      const l = aus[aus.length - 1];
      if (l && l.f === f) l.n++;
      else aus.push({ n: 1, f });
    }
    return aus;
  }
  function zeileAusReihe(reihe) { return { teile: laeufe(reihe) }; }
  function codeAusBild(bild) { return liesBild(bild).map((r) => zeileText(zeileAusReihe(r))); }
  function spalten(bild) {
    const b = liesBild(bild);
    return b[0].map((_, x) => b.map((z) => z[x]));
  }
  function codeSpalten(bild) { return spalten(bild).map((r) => zeileText(zeileAusReihe(r))); }
  function zahlenOhneKasten(bild) { return liesBild(bild).reduce((s, r) => s + laeufe(r).length, 0); }
  function farbenIn(bild) {
    const s = new Set();
    liesBild(bild).forEach((z) => z.forEach((f) => s.add(f)));
    return Object.keys(FARBEN).filter((f) => s.has(f));
  }
  function zaehleFarben(bild) {
    const n = {};
    liesBild(bild).forEach((z) => z.forEach((f) => { n[f] = (n[f] || 0) + 1; }));
    return n;
  }
  function gleicheReihe(a, b) { return a.length === b.length && a.every((f, i) => f === b[i]); }
  // Nummern (ab 0) der Zeilen, in denen sich zwei Bilder unterscheiden
  function unterschiede(a, b) {
    const A = liesBild(a), B = liesBild(b);
    const n = Math.max(A.length, B.length);
    const aus = [];
    for (let i = 0; i < n; i++) if (!A[i] || !B[i] || !gleicheReihe(A[i], B[i])) aus.push(i);
    return aus;
  }
  function gleich(a, b) { return unterschiede(a, b).length === 0; }
  function spiegelReihe(r) { return r.slice().reverse(); }
  function spiegel(bild) { return liesBild(bild).map(spiegelReihe); }
  function spiegelgleicheReihe(r) { return gleicheReihe(r, spiegelReihe(r)); }
  function spiegelgleich(bild) { return liesBild(bild).every(spiegelgleicheReihe); }
  // Nur Zahlen (zuerst weiß, dann abwechselnd): nur für Bilder aus weiß und schwarz
  function nurZahlen(reihe) {
    const l = laeufe(reihe);
    if (l.some((t) => t.f !== 'w' && t.f !== 's')) throw new Error('Nur Zahlen geht nur mit weiß und schwarz');
    const z = l.map((t) => t.n);
    return l.length && l[0].f === 's' ? [0].concat(z) : z;
  }

  // ---------------------------------------------------------------------
  // Der kürzeste Code mit Zauber-Kasten (in der Zeile und für Zeilen, nicht verschachtelt)
  // ---------------------------------------------------------------------
  function kuerzesteZeile(reihe) {
    const r = reihe.slice();
    const n = r.length;
    const best = new Array(n + 1).fill(Infinity);
    const wahl = new Array(n + 1).fill(null);
    best[n] = 0;
    for (let i = n - 1; i >= 0; i--) {
      // ein Teil „L Farbe“
      for (let L = 1; i + L <= n && r[i + L - 1] === r[i]; L++) {
        const c = 1 + best[i + L];
        if (c < best[i]) { best[i] = c; wahl[i] = { n: L, f: r[i] }; }
      }
      // ein Zauber-Kasten: Inhalt der Länge p, w-mal
      for (let p = 1; i + 2 * p <= n; p++) {
        const inhalt = r.slice(i, i + p);
        const teile = laeufe(inhalt);
        if (teile.length > MAX_INNEN) continue;
        for (let w = WDH_MIN; w <= WDH_MAX && i + w * p <= n; w++) {
          let ok = true;
          for (let k = 0; k < w * p && ok; k++) ok = r[i + k] === inhalt[k % p];
          if (!ok) break;
          const c = 1 + teile.length + best[i + w * p];
          if (c < best[i]) { best[i] = c; wahl[i] = { wdh: w, teile, laenge: w * p }; }
        }
      }
    }
    const teile = [];
    for (let i = 0; i < n;) {
      const t = wahl[i];
      teile.push(t.wdh ? { wdh: t.wdh, teile: t.teile } : t);
      i += t.wdh ? t.laenge : t.n;
    }
    return { zahlen: best[0], zeile: { teile } };
  }
  function kuerzester(bild) {
    const B = liesBild(bild);
    const h = B.length;
    const best = new Array(h + 1).fill(Infinity);
    const wahl = new Array(h + 1).fill(null);
    best[h] = 0;
    const einzeln = B.map(kuerzesteZeile);
    for (let j = h - 1; j >= 0; j--) {
      const c1 = einzeln[j].zahlen + best[j + 1];
      if (c1 < best[j]) { best[j] = c1; wahl[j] = { einzeln: true }; }
      for (let q = 1; q <= MAX_ZEILEN && j + 2 * q <= h; q++) {
        for (let w = WDH_MIN; w <= WDH_MAX && j + w * q <= h; w++) {
          let ok = true;
          for (let k = 0; k < w * q && ok; k++) ok = gleicheReihe(B[j + k], B[j + (k % q)]);
          if (!ok) break;
          let inhalt = 0;
          for (let k = 0; k < q; k++) inhalt += laeufe(B[j + k]).length;
          const c = 1 + inhalt + best[j + w * q];
          if (c < best[j]) { best[j] = c; wahl[j] = { wdh: w, q }; }
        }
      }
    }
    const code = [];
    for (let j = 0; j < h;) {
      const t = wahl[j];
      if (t.einzeln) { code.push(zeileText(einzeln[j].zeile)); j++; }
      else {
        const zz = [];
        for (let k = 0; k < t.q; k++) zz.push(zeileText(zeileAusReihe(B[j + k])));
        code.push(t.wdh + '{' + zz.join(' / ') + '}');
        j += t.wdh * t.q;
      }
    }
    return { zahlen: best[0], code };
  }

  // ---------------------------------------------------------------------
  // Bewerten (Web-App): nur nach dem Ergebnis
  // ---------------------------------------------------------------------
  // gemalt: Bild (Liste von Zeilen). soll: Bild. Ergebnis: geschafft und die falschen Zeilen (ab 0)
  function bewerteBild(soll, gemalt) {
    const falsch = unterschiede(soll, gemalt);
    return { geschafft: falsch.length === 0, falsch };
  }
  // Malen nach Code: der Code sagt, was rauskommen soll
  function bewerteMalen(code, gemalt) { return bewerteBild(ausrollen(code), gemalt); }
  // Code (vom Kind gebaut oder repariert) malt das Bild?
  function bewerteCode(soll, code) {
    let ist;
    try { ist = ausrollen(code); } catch (e) { return { geschafft: false, falsch: [], fehler: e.message }; }
    return bewerteBild(soll, ist);
  }

  // ---------------------------------------------------------------------
  // Zeichnen (SVG): Blätter und App sehen gleich aus
  // ---------------------------------------------------------------------
  // Ein kleines Farb-Quadrat für den Code (viewBox 0–100). Weiß: nur Rand.
  function farbSVG(f, opt) {
    const o = opt || {};
    const hex = FARBEN[farbe(f)].hex;
    const rand = o.rand || TINTE;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"' + (o.gr ? ' width="' + o.gr + '" height="' + o.gr + '"' : '') + '>' +
      '<rect x="7" y="7" width="86" height="86" rx="10" fill="' + hex + '" stroke="' + rand + '" stroke-width="' + (o.dick || 8) + '"/></svg>';
  }
  // Kästchen-Gitter mit (oder ohne) Farben. Jedes Kästchen 10 Einheiten.
  //   opt.zeigen      Farben malen (sonst leer)
  //   opt.nummern     Zeilennummern links
  //   opt.einheit     'mm': width/height in mm (1 Einheit = 1 mm, Kästchen 1 cm); sonst opt.breite
  //   opt.b, opt.h    Größe, wenn bild fehlt (leeres Gitter)
  //   opt.rot         Zeilen (ab 0), die rot umrandet werden
  //   opt.kreis       Zeilennummern (ab 0), die rot eingekreist werden
  //   opt.ueber       Kästchen über die Breite hinaus (Kobold: Zeile zu lang) gestrichelt zeigen
  function bildSVG(bild, opt) {
    const o = opt || {};
    const B = bild ? liesBild(bild) : null;
    const h = B ? B.length : o.h;
    const b = o.b || (B ? Math.max.apply(null, B.map((z) => z.length)) : 0);
    const z = 10;
    const links = o.nummern ? 8 : 0.5;
    const extra = o.ueber && B ? Math.max(0, Math.max.apply(null, B.map((r) => r.length)) - b) : 0;
    const W = links + (b + extra) * z + 0.5, H = h * z + 1;
    const y0 = 0.5;
    let s = '<rect x="' + links + '" y="' + y0 + '" width="' + (b * z) + '" height="' + (h * z) + '" fill="#ffffff"/>';
    if (o.nummern) {
      for (let j = 0; j < h; j++) {
        const kreis = o.kreis && o.kreis.includes(j);
        if (kreis) s += '<circle cx="' + (links - 4) + '" cy="' + (y0 + j * z + 5) + '" r="3.6" fill="none" stroke="' + ROT + '" stroke-width="0.7"/>';
        s += '<text x="' + (links - 4) + '" y="' + (y0 + j * z + 5.2) + '" font-size="5.2" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + (kreis ? ROT : '#6b6f86') + '" font-family="Andika, sans-serif">' + (j + 1) + '</text>';
      }
    }
    if (B && o.zeigen) {
      B.forEach((r, j) => r.forEach((f, i) => {
        if (f === 'w') return;
        if (i >= b && !o.ueber) return;
        s += '<rect x="' + (links + i * z) + '" y="' + (y0 + j * z) + '" width="' + z + '" height="' + z + '" fill="' + FARBEN[f].hex + '"' + (i >= b ? ' opacity="0.45"' : '') + '/>';
      }));
    }
    for (let i = 0; i <= b; i++) s += '<line x1="' + (links + i * z) + '" y1="' + y0 + '" x2="' + (links + i * z) + '" y2="' + (y0 + h * z) + '" stroke="' + TINTE + '" stroke-width="' + (i === 0 || i === b ? 0.5 : 0.25) + '"/>';
    for (let j = 0; j <= h; j++) s += '<line x1="' + links + '" y1="' + (y0 + j * z) + '" x2="' + (links + b * z) + '" y2="' + (y0 + j * z) + '" stroke="' + TINTE + '" stroke-width="' + (j === 0 || j === h ? 0.5 : 0.25) + '"/>';
    if (extra) {
      B.forEach((r, j) => {
        for (let i = b; i < r.length; i++) s += '<rect x="' + (links + i * z) + '" y="' + (y0 + j * z) + '" width="' + z + '" height="' + z + '" fill="none" stroke="' + ROT + '" stroke-width="0.4" stroke-dasharray="1.2 0.8"/>';
      });
    }
    if (o.rot) o.rot.forEach((j) => { s += '<rect x="' + (links - 0.2) + '" y="' + (y0 + j * z - 0.2) + '" width="' + (b * z + 0.4) + '" height="' + (z + 0.4) + '" fill="none" stroke="' + ROT + '" stroke-width="0.9"/>'; });
    const gr = o.einheit === 'mm' ? ' width="' + W + 'mm" height="' + H + 'mm"' : (o.breite ? ' width="' + o.breite + '"' : '');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '"' + gr + ' role="img" aria-label="Kästchenbild">' + s + '</svg>';
  }

  g.WerkstattKaestchen = {
    FARBEN, TINTE, ROT, ZAUBER, WDH_MIN, WDH_MAX, MAX_INNEN, MAX_ZEILEN, MAX_LAUF,
    liesZeile, liesZahlen, liesEintrag, liesCode, istKasten,
    zeileText, eintragText, codeText, teilWorte, zeileWorte,
    rolleZeile, zeilenListe, ausrollen, zahlenZeile, zahlen,
    liesBild, bildText, pruefeRechteck, laeufe, zeileAusReihe, codeAusBild, spalten, codeSpalten,
    zahlenOhneKasten, farbenIn, zaehleFarben, gleicheReihe, unterschiede, gleich,
    spiegel, spiegelgleich, spiegelgleicheReihe, nurZahlen,
    kuerzesteZeile, kuerzester,
    bewerteBild, bewerteMalen, bewerteCode,
    farbSVG, bildSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
