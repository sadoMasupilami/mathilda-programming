/* =====================================================================
   Werkstatt-Kern: Muster (Einheit 6 „Muster-Detektivin“)
   Gemeinsame Logik für Löser (werkzeuge/arten/muster.mjs), Blätter
   (src/bausteine/e6-muster.js) und Web-App (web/spiele/muster.js).
   Keine Abhängigkeiten. Ergebnis: globalThis.WerkstattMuster

   Elemente (Namen in den Rätsel-Daten):
   - Perlen mit fester Form, damit man sie auch schwarz-weiß gedruckt erkennt:
       rot = roter Kreis, blau = blaues Quadrat, gelb = gelbes Dreieck, gruen = grünes Herz
   - Perlen mit zwei Eigenschaften (Schwerer-Teil): "<form>-<farbe>", z. B. "kreis-blau",
       Formen kreis, quadrat, dreieck, herz; Farben rot, blau, gelb, gruen.
       "kreis-rot" ist dieselbe Perle wie "rot" (wird zu "rot" vereinfacht).
       Für Schwarz-Weiß: Doppel-Muster am besten mit blau (dunkel) und gelb (hell).
   - Bewegungen (Klatsch-Muster): klatschen (Hand), stampfen (Fuß), schnipsen (Finger)
   Eine Folge ist eine Liste von Elementen, null (im Text "?") ist eine Lücke.
   Zauber-Kasten wie in Einheit 5: "3[rot blau blau] rot" (2- bis 5-mal,
   1 bis 3 Elemente im Kasten, nicht verschachtelt). Karten: ein Element ist
   1 Karte, ein Zauber-Kasten 1 Karte plus die Elemente darin.

   Muster-Regeln (plan/lehrplan.md, Begriffe Muster und Muster-Kern):
   - Der Muster-Kern ist das kürzeste Stück vom Anfang, das sich immer wiederholt.
   - Ein sauberes Muster zeigt seinen Kern mindestens zweimal ganz.
   ===================================================================== */
(function (g) {
  'use strict';

  const T = '#1f2340';
  const FARBEN = { rot: '#e0453a', blau: '#3a7be0', gelb: '#f5c518', gruen: '#3aa856' };
  const FARBWORT = { rot: 'rot', blau: 'blau', gelb: 'gelb', gruen: 'grün' };
  const FARB_ADJ = { rot: 'rot', blau: 'blau', gelb: 'gelb', gruen: 'grün' };
  const FORMEN = ['kreis', 'quadrat', 'dreieck', 'herz'];
  const FORMWORT = { kreis: 'Kreis', quadrat: 'Quadrat', dreieck: 'Dreieck', herz: 'Herz' };
  // Einfache Perlen: Farbe → feste Form
  const PERLE = { rot: 'kreis', blau: 'quadrat', gelb: 'dreieck', gruen: 'herz' };
  const BEWEGUNGEN = ['klatschen', 'stampfen', 'schnipsen'];
  const WDH_MIN = 2, WDH_MAX = 5, MAX_INNEN = 3;

  // ---------------------------------------------------------------------
  // Elemente
  // ---------------------------------------------------------------------
  function norm(name) {
    const s = String(name || '').trim().toLowerCase();
    if (PERLE[s] || BEWEGUNGEN.includes(s)) return s;
    const m = s.match(/^([a-z]+)-([a-z]+)$/);
    if (m && FORMEN.includes(m[1]) && FARBEN[m[2]]) return PERLE[m[2]] === m[1] ? m[2] : s;
    throw new Error('Unbekanntes Muster-Element „' + name + '“ (rot, blau, gelb, gruen, <form>-<farbe>, klatschen, stampfen, schnipsen)');
  }
  function gruppe(n) { return BEWEGUNGEN.includes(n) ? 'bewegung' : 'perle'; }
  function eigenschaften(n) {
    if (BEWEGUNGEN.includes(n)) return { bewegung: n };
    if (PERLE[n]) return { form: PERLE[n], farbe: n };
    const [form, farbe] = n.split('-');
    return { form, farbe };
  }
  // Wort für Texte: „rot“, „blauer Kreis“, „klatschen“
  function wort(n) {
    const e = eigenschaften(n);
    if (e.bewegung) return n;
    if (PERLE[n]) return FARBWORT[n];
    const endung = { kreis: 'er', quadrat: 'es', dreieck: 'es', herz: 'es' }[e.form];
    return FARB_ADJ[e.farbe] + endung + ' ' + FORMWORT[e.form];
  }
  // Langes Wort, auch für einfache Perlen mit Form: „roter Kreis“
  function wortLang(n) {
    const e = eigenschaften(n);
    if (e.bewegung) return n;
    const endung = { kreis: 'er', quadrat: 'es', dreieck: 'es', herz: 'es' }[e.form];
    return FARB_ADJ[e.farbe] + endung + ' ' + FORMWORT[e.form];
  }

  // ---------------------------------------------------------------------
  // Folgen und Zauber-Kasten-Programme lesen
  // ---------------------------------------------------------------------
  // "rot blau ? blau" oder ["rot", "blau", null, "blau"] → ['rot', 'blau', null, 'blau']
  function lies(f) {
    const roh = Array.isArray(f) ? f : String(f || '').trim().split(/[\s,]+/).filter(Boolean);
    return roh.map((x) => (x === null || x === '?' || x === '_') ? null : norm(x));
  }
  // "3[rot blau blau] rot" → [{ wdh: 3, teile: ['rot', 'blau', 'blau'] }, 'rot']
  function liesProgramm(p) {
    if (Array.isArray(p)) return p.map((t) => (typeof t === 'string' ? norm(t) : pruefeKasten({ wdh: t.wdh, teile: t.teile.map(norm) })));
    const s = String(p || '').trim();
    if (!s) throw new Error('Leeres Muster-Programm');
    const re = /\s*(?:(\d+)\s*\[([^\]\[]*)\]|([a-z-]+))\s*/y;
    const aus = [];
    let pos = 0;
    while (pos < s.length) {
      re.lastIndex = pos;
      const m = re.exec(s);
      if (!m) throw new Error('Muster-Programm nicht lesbar ab „' + s.slice(pos) + '“ (verschachtelt geht nicht)');
      if (m[1]) aus.push(pruefeKasten({ wdh: parseInt(m[1], 10), teile: m[2].trim().split(/\s+/).filter(Boolean).map(norm) }));
      else aus.push(norm(m[3]));
      pos = re.lastIndex;
    }
    return aus;
  }
  function pruefeKasten(k) {
    if (!(k.wdh >= WDH_MIN && k.wdh <= WDH_MAX)) throw new Error(k.wdh + '-mal geht nicht (2- bis 5-mal)');
    if (!k.teile.length || k.teile.length > MAX_INNEN) throw new Error('Im Zauber-Kasten 1 bis 3 Elemente');
    return k;
  }
  function ausrollen(prog) {
    const aus = [];
    for (const t of prog) {
      if (typeof t === 'string') aus.push(t);
      else for (let i = 0; i < t.wdh; i++) aus.push(...t.teile);
    }
    return aus;
  }
  function karten(prog) { return prog.reduce((s, t) => s + (typeof t === 'string' ? 1 : 1 + t.teile.length), 0); }
  function alsText(prog) { return prog.map((t) => (typeof t === 'string' ? t : t.wdh + '[' + t.teile.join(' ') + ']')).join(' '); }
  function gleich(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }

  // ---------------------------------------------------------------------
  // Muster erkennen (Lücken = null sind Platzhalter)
  // ---------------------------------------------------------------------
  // Passt die Folge zur Kern-Länge q? (bekannte Elemente im Abstand q sind gleich)
  function passt(folge, q) {
    for (let i = 0; i + q < folge.length; i++) {
      const a = folge[i], b = folge[i + q];
      if (a !== null && b !== null && a !== b) return false;
    }
    return true;
  }
  // Kern zur Länge q: für jede Stelle im Kern das bekannte Element (null, wenn nirgends bekannt)
  function kernZu(folge, q) {
    const k = new Array(q).fill(null);
    folge.forEach((x, i) => { if (x !== null && k[i % q] === null) k[i % q] = x; });
    return k;
  }
  // Wie oft steht der Kern ganz (ohne Lücke) da, gezählt vom Anfang an?
  function ganzeKerne(folge, q) {
    let n = 0;
    for (let s = 0; s + q <= folge.length; s += q) if (folge.slice(s, s + q).every((x) => x !== null)) n++;
    return n;
  }
  // Kürzester Kern: kleinste Länge q, zu der die Folge passt.
  // bestimmt = jede Kern-Stelle ist irgendwo zu sehen (sonst kann man eine Lücke nicht füllen)
  function kern(folge) {
    const f = lies(folge);
    for (let q = 1; q <= f.length; q++) {
      if (!passt(f, q)) continue;
      const k = kernZu(f, q);
      return { laenge: q, teile: k, ganz: ganzeKerne(f, q), bestimmt: k.every((x) => x !== null) };
    }
    return null;
  }
  // Sauberes Muster: ohne Lücken, und ein Kern steht mindestens zweimal ganz da
  function istSauber(folge) {
    const f = lies(folge);
    if (f.some((x) => x === null)) return false;
    for (let q = 1; 2 * q <= f.length; q++) if (passt(f, q)) return true;
    return false;
  }
  // Lücken füllen und n Elemente anhängen (nach dem kürzesten Kern)
  // → { kern, luecken: [{ i, el }], weiter: [el, …], ganz } oder null
  function fortsetzung(folge, n) {
    const f = lies(folge);
    const k = kern(f);
    if (!k || !k.bestimmt) return null;
    const luecken = [];
    f.forEach((x, i) => { if (x === null) luecken.push({ i, el: k.teile[i % k.laenge] }); });
    const weiter = [];
    for (let j = 0; j < (n || 0); j++) weiter.push(k.teile[(f.length + j) % k.laenge]);
    return { kern: k.teile, laenge: k.laenge, ganz: k.ganz, luecken, weiter };
  }
  // Wie oft wechselt Form und Farbe? (Perlen mit zwei Eigenschaften)
  function eigenschaftsKerne(folge) {
    const f = lies(folge);
    if (f.some((x) => x === null || gruppe(x) !== 'perle')) return null;
    const formen = f.map((x) => eigenschaften(x).form);
    const farben = f.map((x) => eigenschaften(x).farbe);
    const min = (arr) => { for (let q = 1; q <= arr.length; q++) if (passt(arr, q)) return q; return arr.length; };
    return { form: min(formen), farbe: min(farben), formen: kernZu(formen, min(formen)), farben: kernZu(farben, min(farben)) };
  }

  // ---------------------------------------------------------------------
  // Zauber-Kasten für eine Folge
  // ---------------------------------------------------------------------
  // Alle Programme aus genau einem Zauber-Kasten, die die Folge malen
  function einKasten(folge) {
    const f = lies(folge);
    const aus = [];
    for (let k = 1; k <= MAX_INNEN; k++) for (let w = WDH_MIN; w <= WDH_MAX; w++) {
      if (w * k !== f.length) continue;
      if (f.every((x, i) => x === f[i % k])) aus.push([{ wdh: w, teile: f.slice(0, k) }]);
    }
    return aus;
  }
  // Kürzeste Programme (wenigste Karten) mit beliebig vielen Teilen
  // → { karten, anzahl, programme (höchstens max) }
  function kuerzeste(folge, max) {
    const f = lies(folge);
    const n = f.length;
    const grenze = max || 50;
    const best = new Array(n + 1).fill(Infinity);
    const zahl = new Array(n + 1).fill(0);
    best[n] = 0; zahl[n] = 1;
    const zuege = (i) => {
      const z = [{ teil: f[i], len: 1, k: 1 }];
      for (let k = 1; k <= MAX_INNEN; k++) for (let w = WDH_MIN; w <= WDH_MAX; w++) {
        if (i + w * k > n) continue;
        let ok = true;
        for (let j = 0; j < w * k && ok; j++) ok = f[i + j] === f[i + (j % k)];
        if (ok) z.push({ teil: { wdh: w, teile: f.slice(i, i + k) }, len: w * k, k: 1 + k });
      }
      return z;
    };
    for (let i = n - 1; i >= 0; i--) {
      for (const z of zuege(i)) {
        const c = z.k + best[i + z.len];
        if (c < best[i]) { best[i] = c; zahl[i] = zahl[i + z.len]; }
        else if (c === best[i]) zahl[i] += zahl[i + z.len];
      }
    }
    const programme = [];
    (function sammle(i, weg) {
      if (programme.length >= grenze) return;
      if (i === n) { programme.push(weg.slice()); return; }
      for (const z of zuege(i)) {
        if (z.k + best[i + z.len] !== best[i]) continue;
        weg.push(z.teil); sammle(i + z.len, weg); weg.pop();
      }
    })(0, []);
    return { karten: best[0], anzahl: zahl[0], programme };
  }

  // ---------------------------------------------------------------------
  // Wachsendes Muster: kopf + 1-mal wachs, kopf + 2-mal wachs, …
  // ---------------------------------------------------------------------
  function wachsend(kopf, wachs, runden) {
    const k = lies(kopf), w = lies(wachs);
    const aus = [];
    for (let r = 1; r <= runden; r++) { aus.push(...k); for (let j = 0; j < r; j++) aus.push(...w); }
    return aus;
  }

  // ---------------------------------------------------------------------
  // Zeichnungen (SVG, viewBox 0 0 100 100): Blätter und App sehen gleich aus
  // ---------------------------------------------------------------------
  function formPfad(form) {
    if (form === 'kreis') return '<circle cx="50" cy="50" r="39"/>';
    if (form === 'quadrat') return '<rect x="13" y="13" width="74" height="74" rx="7"/>';
    if (form === 'dreieck') return '<path d="M50 9 L92 86 L8 86 Z"/>';
    return '<path d="M50 89 C 24 70, 7 53, 8 34 C 9 17, 24 9, 36 11 C 43 12, 48 17, 50 23 C 52 17, 57 12, 64 11 C 76 9, 91 17, 92 34 C 93 53, 76 70, 50 89 Z"/>';
  }
  // Umriss in zwei Schritten (erst dicker Rand, dann Füllung): so gibt es keine Linien im Inneren
  function umriss(teile, fuell) {
    return '<g fill="' + T + '" stroke="' + T + '" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">' + teile + '</g>' +
      '<g fill="' + fuell + '" stroke="none">' + teile + '</g>';
  }
  const HAND = '<rect x="25" y="22" width="12" height="40" rx="6"/><rect x="39" y="11" width="12" height="50" rx="6"/>' +
    '<rect x="53" y="15" width="12" height="46" rx="6"/><rect x="67" y="27" width="11" height="35" rx="5.5"/>' +
    '<rect x="24" y="46" width="55" height="42" rx="19"/><rect x="11" y="49" width="12" height="32" rx="6" transform="rotate(-38 17 65)"/>';
  const FUSS = '<path d="M47 38 C 64 35, 74 49, 71 64 C 69 79, 62 93, 48 93 C 35 93, 30 82, 32 68 C 34 54, 31 40, 47 38 Z"/>' +
    '<circle cx="35" cy="27" r="8.5"/><circle cx="50" cy="21" r="6.5"/><circle cx="62" cy="23" r="5.5"/><circle cx="71" cy="29" r="5"/><circle cx="77" cy="38" r="4.5"/>';
  const FINGER = '<rect x="22" y="48" width="54" height="44" rx="19"/><rect x="26" y="12" width="13" height="48" rx="6.5"/>' +
    '<rect x="52" y="18" width="13" height="44" rx="6.5" transform="rotate(-24 58 60)"/>';
  function svg(name, opt) {
    const n = norm(name);
    const o = opt || {};
    let inner;
    if (n === 'klatschen') {
      inner = umriss(HAND, '#f9d2b0') +
        '<path d="M85 22 L93 14 M88 37 L97 35 M81 9 L84 2" fill="none" stroke="' + T + '" stroke-width="4.5" stroke-linecap="round"/>';
    } else if (n === 'stampfen') {
      inner = umriss(FUSS, '#e0a060') +
        '<path d="M14 80 L5 84 M16 92 L7 97 M86 80 L95 84 M84 92 L93 97" fill="none" stroke="' + T + '" stroke-width="4.5" stroke-linecap="round"/>';
    } else if (n === 'schnipsen') {
      inner = umriss(FINGER, '#f9d2b0') +
        '<path d="M50 8 L56 1 M55 18 L65 15 M57 29 L67 30" fill="none" stroke="#e8a400" stroke-width="5.5" stroke-linecap="round"/>';
    } else {
      const e = eigenschaften(n);
      inner = '<g fill="' + FARBEN[e.farbe] + '" stroke="' + T + '" stroke-width="' + (o.dick ? 7 : 5.5) + '" stroke-linejoin="round">' + formPfad(e.form) + '</g>';
    }
    const gr = o.gr ? ' width="' + o.gr + '" height="' + o.gr + '"' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"' + gr + ' role="img" aria-label="' + wort(n) + '">' + inner + '</svg>';
  }

  g.WerkstattMuster = {
    FARBEN, FORMEN, PERLE, BEWEGUNGEN, WDH_MIN, WDH_MAX, MAX_INNEN,
    norm, gruppe, eigenschaften, wort, wortLang, lies, liesProgramm, ausrollen, karten, alsText, gleich,
    passt, kernZu, ganzeKerne, kern, istSauber, fortsetzung, eigenschaftsKerne,
    einKasten, kuerzeste, wachsend, svg,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
