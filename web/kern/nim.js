/* =====================================================================
   Werkstatt-Kern: Strategiespiele (Einheit 15 „Gewinnen mit Plan“)
   Gemeinsame Logik für den Löser (werkzeuge/arten/nim.mjs), die Blätter
   (src/bausteine/e15-nim.js) und die Web-App (web/spiele/nim.js).
   Keine Abhängigkeiten. Ergebnis: globalThis.WerkstattNim

   Ein Spiel (Variante) als Objekt oder kurzer Text:
     { "form": "steine", "nehmen": [1, 2], "letzter": "gewinnt" }   "steine 1-2"
     { "form": "steine", "nehmen": [1, 2, 3] }                       "steine 1-3"
     { "form": "steine", "nehmen": [1, 3] }                          "steine 1,3"
     { "form": "steine", "nehmen": [1, 2], "letzter": "verliert" }   "steine 1-2 verliert"
     { "form": "steine", "nehmen": "beliebig" }                      "steine beliebig"  (zwei Haufen: aus EINEM Haufen beliebig viele)
     { "form": "zaehlen", "bis": 20, "nehmen": [1, 2] }              "zaehlen 20 1-2"  („Wer sagt 20?“: 1 oder 2 Zahlen weiterzählen)
   Steine-Spiel: Die Spieler nehmen abwechselnd Steine. Wer den letzten Stein nimmt,
   gewinnt (bei "verliert": verliert). „nehmen“ enthält immer die 1, so kann man
   immer ziehen, solange ein Stein liegt.
   Wer sagt 20?: Abwechselnd 1 oder 2 Zahlen weiterzählen, wer 20 sagt, gewinnt.
   Das ist dasselbe wie das Steine-Spiel mit 20 Steinen: Wer die Zahl s gesagt hat,
   lässt 20 − s Steine liegen.

   Eine Stellung ist eine Liste von Haufen, z. B. [7] oder [3, 5]; bei „Wer sagt 20?“
   der Stand (die zuletzt gesagte Zahl, 0 = noch niemand hat etwas gesagt).
   Ein Zug: { haufen: 0, nimm: 2 }  (bei „Wer sagt“: nimm = wie viele Zahlen man sagt)

   Gewinnzahl: eine Zahl, die man mit seinem Zug „macht“ (beim Steine-Spiel: so viele
   Steine lässt man liegen; bei „Wer sagt 20?“: die Zahl, die man zuletzt sagt). Wer eine
   Gewinnzahl machen kann und danach gut weiterspielt, gewinnt immer. Fachlich: die
   Verlust-Stellungen für den, der dran ist (P-Positionen), berechnet per Spielbaum.

   Der Roboter (App) spielt gut: Gibt es einen Gewinnzug, nimmt er den kleinsten.
   Sonst nimmt er mal 1, mal 2 … Steine (fest nach der Zahl der Steine) und hofft auf einen Fehler.
   ===================================================================== */
(function (g) {
  'use strict';

  const FARBE = {
    tinte: '#1f2340', grau: '#6b6f86', linie: '#b9bdd3', rot: '#d1335b',
    gold: '#f2b705', goldHell: '#fff4cc', start: '#e3f5c8', weg: '#ffffff', wegRand: '#c23a8c',
  };
  // Muggelsteine: flache Glassteine in fröhlichen Farben (hell, dunkel, Glanz)
  const STEINFARBEN = [
    ['#7fc4f2', '#2b6fd6'], ['#8fdba6', '#1f9d55'], ['#c9a6f2', '#7a4fd1'],
    ['#f7a6c6', '#c23a8c'], ['#ffd76a', '#d39400'], ['#9be3dc', '#0f8f87'],
  ];
  const MAX_HAUFEN = 30;          // mehr Steine liegen nie auf dem Tisch
  const MAX_BIS = 40;             // „Wer sagt 40?“ ist das Größte

  // ---------------------------------------------------------------------
  // Spiel lesen
  // ---------------------------------------------------------------------
  function liesNehmen(t) {
    if (t === 'beliebig') return 'beliebig';
    if (Array.isArray(t)) return t.slice().map(Number).sort((a, b) => a - b);
    const s = String(t);
    let m = s.match(/^(\d+)-(\d+)$/);
    if (m) { const a = []; for (let i = +m[1]; i <= +m[2]; i++) a.push(i); return a; }
    if (/^\d+(,\d+)*$/.test(s)) return s.split(',').map(Number).sort((a, b) => a - b);
    throw new Error('nehmen „' + s + '“ nicht lesbar (z. B. 1-2, 1-3, 1,3, beliebig)');
  }
  function lies(spiel) {
    if (!spiel) throw new Error('spiel fehlt');
    let v;
    if (typeof spiel === 'string') {
      const t = spiel.trim().split(/\s+/);
      if (t[0] === 'steine') {
        v = { form: 'steine', nehmen: liesNehmen(t[1] || '1-2'), letzter: t.includes('verliert') ? 'verliert' : 'gewinnt' };
      } else if (t[0] === 'zaehlen') {
        v = { form: 'zaehlen', bis: parseInt(t[1], 10), nehmen: liesNehmen(t[2] || '1-2'), letzter: 'gewinnt' };
      } else throw new Error('spiel „' + spiel + '“: beginnt mit steine oder zaehlen');
    } else {
      v = { form: spiel.form || 'steine', nehmen: liesNehmen(spiel.nehmen || [1, 2]), letzter: spiel.letzter || 'gewinnt' };
      if (v.form === 'zaehlen') v.bis = parseInt(spiel.bis, 10);
    }
    if (!['steine', 'zaehlen'].includes(v.form)) throw new Error('form muss steine oder zaehlen sein');
    if (!['gewinnt', 'verliert'].includes(v.letzter)) throw new Error('letzter muss gewinnt oder verliert sein');
    if (v.nehmen !== 'beliebig') {
      if (!v.nehmen.length || v.nehmen[0] !== 1) throw new Error('nehmen muss die 1 enthalten (sonst kann man stecken bleiben)');
      if (v.nehmen.some((k) => !(k >= 1 && k <= 5)) || new Set(v.nehmen).size !== v.nehmen.length) throw new Error('nehmen: 1 bis 5, jede Zahl einmal');
    }
    if (v.form === 'zaehlen') {
      if (!(v.bis >= 5 && v.bis <= MAX_BIS)) throw new Error('bis muss 5 bis ' + MAX_BIS + ' sein');
      if (v.nehmen === 'beliebig') throw new Error('Wer sagt …? braucht nehmen wie 1-2');
      if (v.letzter !== 'gewinnt') throw new Error('Wer sagt …?: wer die Zahl sagt, gewinnt');
    }
    v.text = alsText(v);
    return v;
  }
  function nehmenText(v) {
    if (v.nehmen === 'beliebig') return 'beliebig viele';
    const n = v.nehmen;
    if (n.length === 1) return String(n[0]);
    const zusammen = n.every((k, i) => i === 0 || k === n[i - 1] + 1);
    if (zusammen && n.length > 2) return n.slice(0, -1).join(', ') + ' oder ' + n[n.length - 1];
    return n.slice(0, -1).join(', ') + ' oder ' + n[n.length - 1];
  }
  function alsText(v) {
    const n = v.nehmen === 'beliebig' ? 'beliebig' : (v.nehmen.every((k, i) => i === 0 || k === v.nehmen[i - 1] + 1) && v.nehmen.length > 1
      ? v.nehmen[0] + '-' + v.nehmen[v.nehmen.length - 1] : v.nehmen.join(','));
    if (v.form === 'zaehlen') return 'zaehlen ' + v.bis + ' ' + n;
    return 'steine ' + n + (v.letzter === 'verliert' ? ' verliert' : '');
  }
  // Wie das Spiel in Kinderworten heißt (Blätter, App)
  function regelSatz(v) {
    if (v.form === 'zaehlen') return 'Sagt abwechselnd ' + nehmenText(v) + ' Zahlen weiter. Wer ' + v.bis + ' sagt, gewinnt.';
    if (v.nehmen === 'beliebig') return 'Nimm aus einem Haufen so viele Steine, wie du willst (mindestens 1). Wer den letzten Stein nimmt, ' + (v.letzter === 'verliert' ? 'verliert.' : 'gewinnt.');
    return 'Nimm ' + nehmenText(v) + ' Steine. Wer den letzten Stein nimmt, ' + (v.letzter === 'verliert' ? 'verliert.' : 'gewinnt.');
  }

  // ---------------------------------------------------------------------
  // Stellung und Züge
  // ---------------------------------------------------------------------
  // Stellung aus den Rätsel-Daten: { haufen: [7] } oder { stand: 0 } (Wer sagt …?)
  function stellung(v, r) {
    if (v.form === 'zaehlen') {
      const s = r.stand === undefined ? 0 : parseInt(r.stand, 10);
      if (!(s >= 0 && s < v.bis)) throw new Error('stand muss 0 bis ' + (v.bis - 1) + ' sein');
      return [v.bis - s];
    }
    const h = Array.isArray(r.haufen) ? r.haufen.map(Number) : [parseInt(r.haufen, 10)];
    if (!h.length || h.length > 2) throw new Error('haufen: 1 oder 2 Haufen');
    if (h.some((x) => !(x >= 0 && x <= MAX_HAUFEN))) throw new Error('haufen: 0 bis ' + MAX_HAUFEN + ' Steine');
    if (h.every((x) => x === 0)) throw new Error('haufen: es liegt kein Stein mehr');
    if (h.length === 2 && v.nehmen !== 'beliebig') throw new Error('zwei Haufen nur mit nehmen "beliebig"');
    return h;
  }
  // Stand bei „Wer sagt …?“ aus der Stellung
  const standVon = (v, h) => v.bis - h[0];
  function erlaubt(v, n) {
    if (v.nehmen === 'beliebig') { const a = []; for (let k = 1; k <= n; k++) a.push(k); return a; }
    return v.nehmen.filter((k) => k <= n);
  }
  function zuege(v, h) {
    const z = [];
    h.forEach((n, i) => { for (const k of erlaubt(v, n)) z.push({ haufen: i, nimm: k }); });
    return z;
  }
  function zugOk(v, h, z) {
    return !!z && Number.isInteger(z.haufen) && z.haufen >= 0 && z.haufen < h.length && erlaubt(v, h[z.haufen]).includes(z.nimm);
  }
  function nach(h, z) { const n = h.slice(); n[z.haufen] -= z.nimm; return n; }
  const istEnde = (h) => h.every((x) => x === 0);

  // ---------------------------------------------------------------------
  // Spielbaum: Gewinnt, wer jetzt dran ist (bei bestem Spiel beider)?
  // ---------------------------------------------------------------------
  const MEMO = new Map();
  function schluessel(v, h) { return alsText(v) + '|' + h.slice().sort((a, b) => a - b).join(','); }
  function gewinnt(v, h) {
    if (istEnde(h)) return v.letzter === 'verliert';   // der andere hat den letzten Stein genommen
    const s = schluessel(v, h);
    if (MEMO.has(s)) return MEMO.get(s);
    let w = false;
    for (const z of zuege(v, h)) if (!gewinnt(v, nach(h, z))) { w = true; break; }
    MEMO.set(s, w);
    return w;
  }
  // Züge, nach denen der andere verliert (bei bestem Spiel)
  function gewinnZuege(v, h) { return zuege(v, h).filter((z) => !gewinnt(v, nach(h, z))); }
  // Gewinnzahlen eines Spiels mit einem Haufen, bis zu einer Grenze (aufsteigend)
  //   Steine: so viele Steine lässt man liegen (1 … bis; 0 heißt: schon gewonnen, wird nicht gelistet)
  //   Wer sagt …?: die Zahlen, die man sagen möchte (1 … v.bis)
  function gewinnzahlen(v, bis) {
    const aus = [];
    if (v.nehmen === 'beliebig') throw new Error('Gewinnzahlen gibt es nur mit einem Haufen');
    if (v.form === 'zaehlen') {
      for (let s = 1; s <= v.bis; s++) if (!gewinnt(v, [v.bis - s])) aus.push(s);
      return aus;
    }
    for (let n = 1; n <= bis; n++) if (!gewinnt(v, [n])) aus.push(n);
    return aus;
  }
  // Ist eine Zahl (Steine, die liegen bleiben / gesagte Zahl) eine Gewinnzahl?
  function istGewinnzahl(v, x) {
    if (v.form === 'zaehlen') return x >= 0 && x <= v.bis && !gewinnt(v, [v.bis - x]);
    return !gewinnt(v, [x]);
  }

  // ---------------------------------------------------------------------
  // Roboter und feste Regeln
  // ---------------------------------------------------------------------
  // Der gute Roboter: kleinster Gewinnzug. Gibt es keinen, nimmt er aus dem größten Haufen
  // mal 1, mal 2 … (je nach Zahl der Steine, immer gleich: so bleibt die App vorhersagbar) und hofft auf einen Fehler.
  function roboterZug(v, h) {
    const gz = gewinnZuege(v, h);
    if (gz.length) return gz.slice().sort((a, b) => a.nimm - b.nimm || a.haufen - b.haufen)[0];
    let gross = 0;
    h.forEach((n, i) => { if (n > h[gross]) gross = i; });
    if (v.nehmen === 'beliebig') return { haufen: gross, nimm: 1 };
    const erl = erlaubt(v, h[gross]);
    const summe = h.reduce((a, b) => a + b, 0);
    return { haufen: gross, nimm: erl[summe % erl.length] };
  }
  // Feste Roboter-Regeln (Spiel „Der Roboter mit der festen Regel“): „gut“, „immer1“, „immer2“
  function regelZug(v, h, regel) {
    if (regel === 'gut') return roboterZug(v, h);
    let gross = 0;
    h.forEach((n, i) => { if (n > h[gross]) gross = i; });
    const erl = erlaubt(v, h[gross]);
    if (regel === 'immer1') return { haufen: gross, nimm: 1 };
    if (regel === 'immer2') return { haufen: gross, nimm: erl.includes(2) ? 2 : erl[erl.length - 1] };
    throw new Error('Unbekannte Roboter-Regel „' + regel + '“ (gut, immer1, immer2)');
  }
  // Kann „du“ gegen einen Roboter mit dieser Regel sicher gewinnen?
  //   dran: 'du' oder 'roboter'. Ergebnis: true/false
  function kannGewinnen(v, h, dran, regel) {
    regel = regel || 'gut';
    const memo = new Map();
    function geh(h2, du) {
      const k = h2.join(',') + (du ? 'd' : 'r');
      if (memo.has(k)) return memo.get(k);
      let w;
      if (istEnde(h2)) {
        // wer zuletzt gezogen hat, hat den letzten Stein genommen
        const letzterWarDu = !du;
        w = v.letzter === 'gewinnt' ? letzterWarDu : !letzterWarDu;
      } else if (du) {
        w = zuege(v, h2).some((z) => geh(nach(h2, z), false));
      } else {
        w = geh(nach(h2, regelZug(v, h2, regel)), true);
      }
      memo.set(k, w);
      return w;
    }
    return geh(h, dran === 'du');
  }
  // Eine Beispiel-Partie: „du“ spielt den kleinsten Gewinnzug (sonst 1), der Roboter spielt gut.
  // Ergebnis: [{ wer: 'du'|'roboter', zug, nachher: [...] }, …], sieger
  function partie(v, h, dran, regel) {
    const aus = [];
    let du = dran === 'du';
    let x = h.slice();
    let n = 0;
    while (!istEnde(x) && n++ < 200) {
      let z;
      if (du) {
        const gz = gewinnZuege(v, x);
        z = gz.length ? gz.slice().sort((a, b) => a.nimm - b.nimm || a.haufen - b.haufen)[0] : { haufen: x.findIndex((k) => k > 0), nimm: 1 };
      } else z = regelZug(v, x, regel || 'gut');
      x = nach(x, z);
      aus.push({ wer: du ? 'du' : 'roboter', zug: z, nachher: x.slice() });
      du = !du;
    }
    const letzter = aus.length ? aus[aus.length - 1].wer : null;
    const sieger = v.letzter === 'gewinnt' ? letzter : (letzter === 'du' ? 'roboter' : 'du');
    return { zuege: aus, sieger };
  }
  // Wer hat gewonnen, wenn nach einem Zug von „wer“ nichts mehr liegt?
  function siegerNachLetztem(v, wer) {
    if (v.letzter === 'gewinnt') return wer;
    return wer === 'du' ? 'roboter' : 'du';
  }

  // ---------------------------------------------------------------------
  // Spielbaum zum Zeichnen (nur kleine Stellungen): alle Züge, nicht zusammengefasst
  //   Knoten: { haufen, dranGewinnt, zug (der hierher führt), kinder: [...] }
  // ---------------------------------------------------------------------
  function baum(v, h, maxKnoten) {
    let zahl = 0;
    const grenze = maxKnoten || 40;
    function geh(h2, zug) {
      zahl++;
      if (zahl > grenze) throw new Error('Spielbaum hat mehr als ' + grenze + ' Knoten – kleinere Stellung wählen');
      const k = { haufen: h2.slice(), dranGewinnt: gewinnt(v, h2), zug: zug || null, kinder: [] };
      for (const z of zuege(v, h2)) k.kinder.push(geh(nach(h2, z), z));
      return k;
    }
    const wurzel = geh(h, null);
    return { wurzel, knoten: zahl };
  }

  // ---------------------------------------------------------------------
  // Zeichnungen (SVG, Maße in mm; masse: false → nur viewBox, für die App)
  // ---------------------------------------------------------------------
  function kopf(w, h, o, inhalt, label) {
    const groesse = o && o.masse === false ? '' : ' width="' + r2(w) + 'mm" height="' + r2(h) + 'mm"';
    return '<svg xmlns="http://www.w3.org/2000/svg"' + groesse + ' viewBox="0 0 ' + r2(w) + ' ' + r2(h) + '" role="img" aria-label="' + (label || '') + '">' + inhalt + '</svg>';
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  // Ein Muggelstein (flacher Glasstein von oben), Mitte (x, y), Durchmesser d
  function stein(x, y, d, nr, weg) {
    const [hell, dunkel] = STEINFARBEN[(nr || 0) % STEINFARBEN.length];
    const r = d / 2;
    if (weg) {
      return '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r * 0.92) + '" fill="none" stroke="' + FARBE.linie + '" stroke-width="' + r2(d * 0.05) + '" stroke-dasharray="' + r2(d * 0.12) + ' ' + r2(d * 0.1) + '"/>';
    }
    return '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r * 0.94) + '" fill="' + hell + '" stroke="' + dunkel + '" stroke-width="' + r2(d * 0.07) + '"/>' +
      '<circle cx="' + r2(x + r * 0.12) + '" cy="' + r2(y + r * 0.12) + '" r="' + r2(r * 0.55) + '" fill="' + dunkel + '" opacity="0.18"/>' +
      '<ellipse cx="' + r2(x - r * 0.3) + '" cy="' + r2(y - r * 0.34) + '" rx="' + r2(r * 0.3) + '" ry="' + r2(r * 0.18) + '" fill="#ffffff" opacity="0.85" transform="rotate(-30 ' + r2(x - r * 0.3) + ' ' + r2(y - r * 0.34) + ')"/>';
  }
  // Ein Haufen als Reihen von Steinen (höchstens proReihe pro Reihe), weg = so viele schon genommen (nur App)
  //   o: { gr: Durchmesser mm (11), proReihe (5), abstand (2), weg (0), versatz (Farbe), masse }
  function steineSVG(n, o) {
    o = o || {};
    const d = o.gr || 11, pro = o.proReihe || 5, a = o.abstand === undefined ? d * 0.22 : o.abstand;
    const weg = o.weg || 0;
    const gesamt = n + weg;
    const reihen = Math.max(1, Math.ceil(gesamt / pro));
    const spalten = Math.max(1, Math.min(gesamt, pro));
    const w = spalten * d + (spalten - 1) * a + 1, h = reihen * d + (reihen - 1) * a + 1;
    let s = '';
    for (let i = 0; i < gesamt; i++) {
      const sp = i % pro, ze = Math.floor(i / pro);
      s += stein(0.5 + d / 2 + sp * (d + a), 0.5 + d / 2 + ze * (d + a), d, i + (o.versatz || 0), i >= n);
    }
    return kopf(w, h, o, s, n + (n === 1 ? ' Stein' : ' Steine'));
  }
  // Kleiner Haufen als Kachel-Bild (App): ein paar Steine übereinander
  function iconSVG() {
    let s = '';
    const pos = [[30, 70], [52, 72], [74, 68], [41, 52], [63, 52], [52, 34]];
    pos.forEach((p, i) => { s += stein(p[0], p[1], 24, i); });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' + s + '</svg>';
  }

  // Zahlen-Weg für „Wer sagt …?“: Felder 0 … bis als Schlange (Reihe 1 nach rechts, Reihe 2 zurück …)
  //   o: { feld (mm, 22), proReihe (7), luecke (mm zwischen Reihen, 7), markiert: [Zahlen mit rotem Ring],
  //        gold: [Zahlen gelb hinterlegt], drache: Feld mit dem Drachen (Zahl, Standard 0 = Start; false = keiner),
  //        schatz: true, masse,
  //        fuellung: { Zahl: Farbe } (App: wer die Zahl gesagt hat), ringFarbe (statt Rot, App: Vorschau) }
  function wegFelder(bis, pro) {
    const f = [];
    for (let z = 0; z <= bis; z++) {
      const ze = Math.floor(z / pro), i = z % pro;
      const sp = ze % 2 === 0 ? i : pro - 1 - i;
      f.push({ zahl: z, ze, sp });
    }
    return f;
  }
  function wegSVG(bis, o) {
    o = o || {};
    const F = o.feld || 22, pro = o.proReihe || 7, L = o.luecke === undefined ? 7 : o.luecke;
    const felder = wegFelder(bis, pro);
    const reihen = Math.ceil((bis + 1) / pro);
    const rand = 1.2;
    const w = pro * F + 2 * rand, h = reihen * F + (reihen - 1) * L + 2 * rand;
    const xy = (f) => [rand + f.sp * F, rand + f.ze * (F + L)];
    const markiert = new Set(o.markiert || []);
    const gold = new Set(o.gold || []);
    const S = g.WerkstattSymbole;
    let s = '';
    // Verbindungen zwischen den Reihen (Bogen am Rand)
    for (let ze = 0; ze < reihen - 1; ze++) {
      const letzte = felder.find((f) => f.zahl === (ze + 1) * pro - 1);
      if (!letzte) continue;
      const [x, y] = xy(letzte);
      const bx = x + F * 0.5;
      s += '<rect x="' + r2(bx - F * 0.22) + '" y="' + r2(y + F - 0.5) + '" width="' + r2(F * 0.44) + '" height="' + r2(L + 1) + '" fill="' + FARBE.goldHell + '" stroke="' + FARBE.wegRand + '" stroke-width="0.5"/>';
    }
    for (const f of felder) {
      const [x, y] = xy(f);
      const istStart = f.zahl === 0, istZiel = f.zahl === bis;
      const drachePos = o.drache === false ? -1 : (typeof o.drache === 'number' ? o.drache : 0);
      const fill = (o.fuellung && o.fuellung[f.zahl]) || (istStart ? FARBE.start : gold.has(f.zahl) ? FARBE.goldHell : FARBE.weg);
      s += '<rect x="' + r2(x + 0.6) + '" y="' + r2(y + 0.6) + '" width="' + r2(F - 1.2) + '" height="' + r2(F - 1.2) + '" rx="' + r2(F * 0.16) + '" fill="' + fill + '" stroke="' + FARBE.wegRand + '" stroke-width="0.7"/>';
      const zahlGr = F * 0.4;
      if (istStart) {
        s += '<text x="' + r2(x + F / 2) + '" y="' + r2(y + (drachePos === 0 ? F * 0.9 : F / 2 + F * 0.08)) + '" font-family="Andika, sans-serif" font-size="' + r2(F * 0.23) + '" font-weight="700" text-anchor="middle" fill="' + FARBE.tinte + '">Start</text>';
      } else if (istZiel && o.schatz !== false && S) {
        s += '<g transform="translate(' + r2(x + F * 0.2) + ' ' + r2(y + F * 0.04) + ') scale(' + r2(F * 0.6 / 100) + ')">' + S.inhalt('schatz') + '</g>';
        s += '<text x="' + r2(x + F / 2) + '" y="' + r2(y + F * 0.9) + '" font-family="Andika, sans-serif" font-size="' + r2(F * 0.3) + '" font-weight="700" text-anchor="middle" fill="' + FARBE.tinte + '">' + f.zahl + '</text>';
      } else if (f.zahl === drachePos) {
        // Drache steht auf dem Feld: Zahl klein unten (wie bei Start und Schatz)
        s += '<text x="' + r2(x + F / 2) + '" y="' + r2(y + F * 0.9) + '" font-family="Andika, sans-serif" font-size="' + r2(F * 0.3) + '" font-weight="700" text-anchor="middle" fill="' + FARBE.tinte + '">' + f.zahl + '</text>';
      } else {
        s += '<text x="' + r2(x + F / 2) + '" y="' + r2(y + F / 2 + zahlGr * 0.36) + '" font-family="Andika, sans-serif" font-size="' + r2(zahlGr) + '" font-weight="700" text-anchor="middle" fill="' + FARBE.tinte + '">' + f.zahl + '</text>';
      }
      if (S && f.zahl === drachePos) {
        // Drache schaut in Laufrichtung (Reihe 1, 3 … nach rechts, Reihe 2, 4 … nach links)
        const rechts = f.ze % 2 === 0;
        const gr = f.zahl === 0 ? 0.68 : 0.6;
        const dx = f.zahl === 0 ? F * 0.16 : F * 0.2, dy = f.zahl === 0 ? F * 0.04 : F * 0.02;
        s += '<g transform="translate(' + r2(x + dx) + ' ' + r2(y + dy) + ') scale(' + r2(F * gr / 100) + ') rotate(' + (rechts ? 90 : 270) + ' 50 50)">' + S.inhalt('drache') + '</g>';
      }
      if (markiert.has(f.zahl)) s += '<circle cx="' + r2(x + F / 2) + '" cy="' + r2(y + F / 2) + '" r="' + r2(F * 0.4) + '" fill="none" stroke="' + (o.ringFarbe || FARBE.rot) + '" stroke-width="' + r2(F * 0.07) + '"/>';
    }
    return kopf(w, h, o, s, 'Zahlen-Weg von 0 bis ' + bis);
  }

  // Spielbaum als Bild: Knoten = Kreise mit der Zahl der Steine, Gewinnzahlen gold,
  // an den Kanten „1“ oder „2“ (wie viele genommen werden). Zeilen abwechselnd du / der andere.
  //   o: { knoten (mm Durchmesser, 9), dx (mm zwischen Blättern, 12), dy (mm zwischen Ebenen, 15), links: Beschriftung je Ebene, masse }
  function baumSVG(v, h, o) {
    o = o || {};
    const b = baum(v, h, o.maxKnoten || 40).wurzel;
    const D = o.knoten || 9, DX = o.dx || 12, DY = o.dy || 15;
    const randL = o.links ? (o.linksBreite || 22) : 2;
    let blaetter = 0, tiefe = 0;
    (function lege(k, t) {
      k.t = t; tiefe = Math.max(tiefe, t);
      if (!k.kinder.length) { k.x = blaetter++ * DX; return; }
      k.kinder.forEach((c) => lege(c, t + 1));
      k.x = (k.kinder[0].x + k.kinder[k.kinder.length - 1].x) / 2;
    })(b, 0);
    const w = randL + (blaetter - 1) * DX + D + 4, hh = tiefe * DY + D + 4;
    const X = (k) => randL + D / 2 + 2 + k.x, Y = (k) => D / 2 + 2 + k.t * DY;
    let kanten = '', knoten = '', schrift = '';
    (function zeichne(k) {
      for (const c of k.kinder) {
        kanten += '<line x1="' + r2(X(k)) + '" y1="' + r2(Y(k)) + '" x2="' + r2(X(c)) + '" y2="' + r2(Y(c)) + '" stroke="' + FARBE.grau + '" stroke-width="0.45"/>';
        const mx = (X(k) + X(c)) / 2, my = (Y(k) + Y(c)) / 2;
        schrift += '<circle cx="' + r2(mx) + '" cy="' + r2(my) + '" r="2.1" fill="#ffffff" stroke="' + FARBE.grau + '" stroke-width="0.3"/>' +
          '<text x="' + r2(mx) + '" y="' + r2(my + 1.05) + '" font-family="Nunito, sans-serif" font-size="2.9" font-weight="800" text-anchor="middle" fill="' + FARBE.grau + '">' + c.zug.nimm + '</text>';
        zeichne(c);
      }
      const p = !k.dranGewinnt;   // Gewinnzahl: wer hier dran ist, verliert
      const zahl = k.haufen.join('|');
      knoten += '<circle cx="' + r2(X(k)) + '" cy="' + r2(Y(k)) + '" r="' + r2(D / 2) + '" fill="' + (p ? FARBE.gold : '#ffffff') + '" stroke="' + FARBE.tinte + '" stroke-width="' + (p ? 0.7 : 0.45) + '"/>' +
        '<text x="' + r2(X(k)) + '" y="' + r2(Y(k) + D * 0.17) + '" font-family="Andika, sans-serif" font-size="' + r2(D * 0.48) + '" font-weight="700" text-anchor="middle" fill="' + FARBE.tinte + '">' + zahl + '</text>';
    })(b);
    let links = '';
    if (o.links) for (let t = 0; t <= tiefe; t++) {
      links += '<text x="1" y="' + r2(D / 2 + 2 + t * DY + 1.2) + '" font-family="Nunito, sans-serif" font-size="3.2" font-weight="700" fill="' + FARBE.grau + '">' + (o.links[t % o.links.length]) + '</text>';
    }
    return kopf(w, hh, o, links + kanten + schrift + knoten, 'Spielbaum');
  }

  g.WerkstattNim = {
    FARBE, STEINFARBEN, MAX_HAUFEN, MAX_BIS,
    lies, alsText, nehmenText, regelSatz, stellung, standVon, erlaubt, zuege, zugOk, nach, istEnde,
    gewinnt, gewinnZuege, gewinnzahlen, istGewinnzahl, roboterZug, regelZug, kannGewinnen, partie, siegerNachLetztem,
    baum, stein, steineSVG, iconSVG, wegFelder, wegSVG, baumSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
