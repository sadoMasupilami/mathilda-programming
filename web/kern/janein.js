/* =====================================================================
   Werkstatt-Kern: Ja/Nein-Zahlen (Einheit 9 „Nur Ja oder Nein“, Rätselart "janein")
   Dieselbe Datei läuft im Rätsel-Löser (Node: import in werkzeuge/arten/janein.mjs),
   beim Bauen der PDFs (Chrome, Bausteine in src/bausteine/e9-janein.js) und in der
   Web-App (web/spiele/janein.js). Keine Abhängigkeiten.
   Ergebnis: globalThis.WerkstattJaNein

   Ja/Nein-Zahlen (Kinderwort für Binärzahlen):
   - Es gibt n Ja/Nein-Karten (Standard 5, erlaubt 3 bis 6). Sie liegen immer in derselben
     Reihenfolge, die größte links: bei 5 Karten 16, 8, 4, 2, 1 Punkte (bei 6 Karten 32 … 1).
     Jede Karte hat doppelt so viele Punkte wie ihr rechter Nachbar.
   - Jede Karte ist entweder da (Ja, Punkte oben, Lampe an, Finger oben, Ziffer 1)
     oder weg (Nein, umgedreht, Lampe aus, Finger eingeklappt, Ziffer 0).
   - Die Zahl ist die Summe der Punkte aller Ja-Karten. Mit 5 Karten gehen 0 bis 31,
     und jede dieser Zahlen hat genau eine Ja/Nein-Schreibweise (größte Karte zuerst).
   - Daten: ja = Liste von Wahrheitswerten, links nach rechts (ja[0] ist die größte Karte).
     In den Rätsel-Daten stehen die Ja-Karten als Punktzahlen: "ja": [16, 4, 1].
   - Finger (5 Karten): kleiner Finger 16, Ringfinger 8, Mittelfinger 4, Zeigefinger 2,
     Daumen 1. Gezeichnet mit dem Daumen rechts, wie die 1er-Karte.
   Bewerten in der App: bewerte(level, antwort), nur nach dem Ergebnis.
   Zeichnungen (SVG-Text, Maße als CSS-Längen): karte, lampe, hand, kaestchen.
   ===================================================================== */
(function (g) {
  'use strict';

  const MIN_KARTEN = 3;
  const MAX_KARTEN = 6;
  const STANDARD = 5;
  const AUSSEHEN = ['karten', 'lampen', 'finger', 'ziffern'];
  const FINGER = ['kleiner Finger', 'Ringfinger', 'Mittelfinger', 'Zeigefinger', 'Daumen'];

  const T = '#1f2340';
  const GRAU = '#6b6f86';
  const ROT = '#d1335b';
  const FARBEN = {
    tuerkis: { punkt: '#0f8f87', rand: T },
    orange: { punkt: '#e0701b', rand: T },
  };
  const RUECKEN = '#d8dbe6';
  const RUECKEN_RAND = '#9a9fb4';

  // ---------------------------------------------------------------------
  // Zahlen und Karten
  // ---------------------------------------------------------------------
  function anzahl(n) {
    if (n === undefined || n === null) return STANDARD;
    if (!Number.isInteger(n) || n < MIN_KARTEN || n > MAX_KARTEN) throw new Error('Anzahl der Karten: ' + MIN_KARTEN + ' bis ' + MAX_KARTEN + ' (nicht ' + n + ')');
    return n;
  }
  // Punkte der Karten von links nach rechts: [16, 8, 4, 2, 1]
  function werte(n) {
    n = anzahl(n);
    const w = [];
    for (let i = n - 1; i >= 0; i--) w.push(Math.pow(2, i));
    return w;
  }
  function groesste(n) { return Math.pow(2, anzahl(n)) - 1; }
  function istKarte(v, n) { return werte(n).indexOf(v) >= 0; }

  function pruefeZahl(zahl, n) {
    if (!Number.isInteger(zahl)) throw new Error('Zahl muss eine ganze Zahl sein (nicht ' + zahl + ')');
    if (zahl < 0 || zahl > groesste(n)) throw new Error('Mit ' + anzahl(n) + ' Karten gehen nur 0 bis ' + groesste(n) + ' (nicht ' + zahl + ')');
    return zahl;
  }
  // Größte Karte zuerst: passt sie noch hinein, ist sie da (Ja), sonst weg (Nein)
  function zerlege(zahl, n) {
    pruefeZahl(zahl, n);
    let rest = zahl;
    return werte(n).map((v) => { if (rest >= v) { rest -= v; return true; } return false; });
  }
  function pruefeJa(ja, n) {
    const w = werte(n);
    if (!Array.isArray(ja) || ja.length !== w.length || ja.some((x) => typeof x !== 'boolean')) throw new Error('ja: ' + w.length + ' Wahrheitswerte (links nach rechts)');
    return ja;
  }
  function wert(ja, n) {
    const w = werte(n);
    pruefeJa(ja, n);
    return ja.reduce((s, x, i) => s + (x ? w[i] : 0), 0);
  }
  // [16, 4, 1] → [true, false, true, false, true]
  function jaAusWerten(liste, n) {
    const w = werte(n);
    if (!Array.isArray(liste)) throw new Error('Ja-Karten als Liste von Punktzahlen, z. B. [16, 4, 1]');
    const doppelt = liste.filter((v, i) => liste.indexOf(v) !== i);
    if (doppelt.length) throw new Error('Karte ' + doppelt[0] + ' doppelt: Jede Karte gibt es nur einmal');
    for (const v of liste) if (w.indexOf(v) < 0) throw new Error('Eine Karte mit ' + v + ' Punkten gibt es nicht (Karten: ' + w.join(', ') + ')');
    return w.map((v) => liste.indexOf(v) >= 0);
  }
  function jaWerte(ja, n) {
    const w = werte(n);
    pruefeJa(ja, n);
    return w.filter((v, i) => ja[i]);
  }
  // Alle Schreibweisen einer Zahl (jede Karte da oder weg): Beweis, dass es genau eine gibt
  function alleSchreibweisen(zahl, n) {
    n = anzahl(n);
    const aus = [];
    for (let m = 0; m < Math.pow(2, n); m++) {
      const ja = [];
      for (let i = 0; i < n; i++) ja.push(((m >> (n - 1 - i)) & 1) === 1);
      if (wert(ja, n) === zahl) aus.push(ja);
    }
    return aus;
  }
  // Nullen und Einsen (Schwerer-Teil): Ja = 1, Nein = 0, links die größte Karte
  function ziffern(ja) { return ja.map((x) => (x ? '1' : '0')).join(''); }
  function vonZiffern(s) {
    const t = String(s || '');
    if (!/^[01]+$/.test(t)) throw new Error('Nur Nullen und Einsen: „' + t + '“');
    return t.split('').map((c) => c === '1');
  }
  // „8 + 4 + 1 = 13“, eine Karte: „8“, keine: „0“
  function rechnung(ja, n) {
    const t = jaWerte(ja, n);
    if (!t.length) return '0';
    if (t.length === 1) return String(t[0]);
    return t.join(' + ') + ' = ' + wert(ja, n);
  }
  // „16 nein, 8 ja, 4 ja, 2 nein, 1 ja“
  function sprechen(ja, n) {
    const w = werte(n);
    pruefeJa(ja, n);
    return w.map((v, i) => v + ' ' + (ja[i] ? 'ja' : 'nein')).join(', ');
  }
  function unterschiede(a, b) {
    const aus = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) aus.push(i);
    return aus;
  }
  // Kobold: gemeint ist zahl, gelegt ist gezeigt (genau eine Karte falsch?)
  function kobold(zahl, gezeigt, n) {
    const richtig = zerlege(zahl, n);
    pruefeJa(gezeigt, n);
    const falsch = unterschiede(richtig, gezeigt);
    // Welche Karte muss man umdrehen, damit es stimmt? (Probe: jede einzelne Karte)
    const umdrehen = [];
    for (let i = 0; i < gezeigt.length; i++) {
      const neu = gezeigt.slice();
      neu[i] = !neu[i];
      if (wert(neu, n) === zahl) umdrehen.push(i);
    }
    return { richtig, falsch, umdrehen, gezeigt: wert(gezeigt, n) };
  }

  // ---------------------------------------------------------------------
  // Bewerten in der Web-App (nur nach dem Ergebnis)
  //   legen:  antwort = ja-Liste (Karten, wie {{KIND}} sie gelegt hat)
  //   lesen:  antwort = gewählte Zahl
  //   kobold: antwort = Stelle (0 = links) der Karte, die {{KIND}} umdreht
  // ---------------------------------------------------------------------
  function bewerte(level, antwort) {
    const n = anzahl(level.anzahl);
    if (level.aufgabe === 'legen') {
      const ist = wert(antwort, n);
      if (ist === level.zahl) return { ok: true, ist };
      return { ok: false, ist, art: ist > level.zahl ? 'zuviel' : 'zuwenig' };
    }
    if (level.aufgabe === 'lesen') {
      const soll = wert(jaAusWerten(level.ja, n), n);
      return { ok: antwort === soll, art: antwort > soll ? 'zuviel' : 'zuwenig' };
    }
    if (level.aufgabe === 'kobold') {
      const gezeigt = jaAusWerten(level.ja, n);
      if (!Number.isInteger(antwort) || antwort < 0 || antwort >= n) return { ok: false };
      const neu = gezeigt.slice();
      neu[antwort] = !neu[antwort];
      const ist = wert(neu, n);
      return { ok: ist === level.zahl, ist };
    }
    throw new Error('Unbekannte Aufgabe „' + level.aufgabe + '“');
  }

  // ---------------------------------------------------------------------
  // Zeichnungen
  // ---------------------------------------------------------------------
  const r1 = (x) => Math.round(x * 10) / 10;
  function masse(opt, w, h) {
    const b = opt && opt.breite, hh = opt && opt.hoehe;
    return (b ? ' width="' + b + '"' : '') + (hh ? ' height="' + hh + '"' : '') + ' viewBox="0 0 ' + w + ' ' + h + '"';
  }
  function svgKopf(opt, w, h, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg"' + masse(opt, w, h) + ' role="img" aria-label="' + label + '">';
  }

  // Punkte einer Karte: jede Karte ist zwei Karten der nächstkleineren Sorte,
  // abwechselnd untereinander (2, 8, 32) und nebeneinander (4, 16). Vierergruppen mit Abstand.
  function punkteEinheit(v) {
    if (v === 1) return [[0, 0]];
    const halb = punkteEinheit(v / 2);
    const xs = halb.map((p) => p[0]), ys = halb.map((p) => p[1]);
    const stufe = Math.round(Math.log(v) / Math.LN2);       // 1 für 2, 2 für 4 …
    const senkrecht = stufe % 2 === 1;
    const gross = senkrecht ? Math.max(...ys) - Math.min(...ys) : Math.max(...xs) - Math.min(...xs);
    const abstand = gross + (stufe <= 2 ? 1 : 1.3);
    const aus = [];
    for (const p of halb) {
      if (senkrecht) { aus.push([p[0], p[1] - abstand / 2]); aus.push([p[0], p[1] + abstand / 2]); }
      else { aus.push([p[0] - abstand / 2, p[1]]); aus.push([p[0] + abstand / 2, p[1]]); }
    }
    return aus;
  }
  // in Kartenmaßen (100 · 140): Mitte (50, 61), Punkt-Abstand 19 (gleich groß auf allen Karten bis 16), höchstens 74 breit und 84 hoch
  function punkte(v) {
    const e = punkteEinheit(v);
    const xs = e.map((p) => p[0]), ys = e.map((p) => p[1]);
    const breit = Math.max(...xs) - Math.min(...xs), hoch = Math.max(...ys) - Math.min(...ys);
    const teil = Math.min(19, 74 / Math.max(breit, 0.001), 84 / Math.max(hoch, 0.001));
    const r = teil * 0.37;
    return { r, liste: e.map((p) => [50 + p[0] * teil, 61 + p[1] * teil]) };
  }

  // Eine Ja/Nein-Karte.
  //   opt.ja: true = Punkte oben (Standard), false = umgedreht (grauer Rücken)
  //   opt.form: 'leer' = blasse Punkte zum Ankreuzen; opt.nummer: Zahl unten (Standard: ja)
  //   opt.farbe: 'tuerkis' | 'orange'; opt.markiert: roter gestrichelter Rahmen (Lösung)
  //   opt.rahmen: false = ohne Rand (Bastelvorlage: die Schnittlinie ist der Rand); opt.breite / opt.hoehe: CSS-Längen
  function karte(v, opt) {
    opt = opt || {};
    const ja = opt.ja !== false;
    const f = FARBEN[opt.farbe] || FARBEN.tuerkis;
    let s = svgKopf(opt, 100, 140, ja ? 'Karte mit ' + v + ' Punkten' : 'Karte umgedreht');
    if (ja) {
      const leer = opt.form === 'leer';
      s += opt.rahmen === false
        ? ''
        : '<rect x="3" y="3" width="94" height="134" rx="10" fill="#ffffff" stroke="' + (leer ? GRAU : f.rand) + '" stroke-width="' + (leer ? 3 : 4) + '"/>';
      const p = punkte(v);
      for (const [x, y] of p.liste) {
        s += leer
          ? '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(p.r) + '" fill="#eef0f5" stroke="#b9bdd3" stroke-width="1.6"/>'
          : '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(p.r) + '" fill="' + f.punkt + '"/>';
      }
      if (opt.nummer !== false) {
        s += '<text data-nebenschrift="" x="50" y="123" font-family="Andika, sans-serif" font-size="25" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + (leer ? GRAU : T) + '">' + v + '</text>';
      }
    } else {
      s += '<rect x="3" y="3" width="94" height="134" rx="10" fill="' + RUECKEN + '" stroke="' + RUECKEN_RAND + '" stroke-width="3"/>' +
        '<rect x="13" y="13" width="74" height="114" rx="6" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="7 6"/>';
    }
    if (opt.markiert) s += '<rect x="1.5" y="1.5" width="97" height="137" rx="11" fill="none" stroke="' + ROT + '" stroke-width="5" stroke-dasharray="11 7"/>';
    return s + '</svg>';
  }

  // Eine Lampe (Glühbirne) an oder aus, darunter die Punktzahl ihres Platzes
  //   opt.hell: Punktzahl hell (für einen dunklen Hintergrund, Lampen am Abend in der Web-App)
  function lampe(v, opt) {
    opt = opt || {};
    const an = opt.an !== false;
    let s = svgKopf(opt, 100, 140, 'Lampe ' + (an ? 'an' : 'aus'));
    if (an) {
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 - 90) * Math.PI / 180;
        if (i === 2 || i === 6) continue; // unten und oben am Sockel keine Strahlen
        const x1 = 50 + Math.cos(a) * 37, y1 = 52 + Math.sin(a) * 37, x2 = 50 + Math.cos(a) * 47, y2 = 52 + Math.sin(a) * 47;
        s += '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="#f2b705" stroke-width="5" stroke-linecap="round"/>';
      }
    }
    const glas = an ? '#ffd84a' : '#eceef4';
    const rand = an ? '#c98a00' : '#9a9fb4';
    s += '<path d="M50 24 C33 24 24 37 24 51 C24 62 31 68 36 75 C38 78 38 81 38 84 L62 84 C62 81 62 78 64 75 C69 68 76 62 76 51 C76 37 67 24 50 24 Z" fill="' + glas + '" stroke="' + rand + '" stroke-width="3.5" stroke-linejoin="round"/>';
    if (an) s += '<path d="M38 46 C39 39 43 35 49 34" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>';
    else s += '<path d="M44 82 L44 66 C44 60 56 60 56 66 L56 82" fill="none" stroke="#b9bdd3" stroke-width="2.5"/>';
    s += '<rect x="38" y="86" width="24" height="6" rx="2" fill="#a3a8b8" stroke="' + T + '" stroke-width="2"/>' +
      '<rect x="38" y="93" width="24" height="6" rx="2" fill="#a3a8b8" stroke="' + T + '" stroke-width="2"/>' +
      '<path d="M42 100 L58 100 L54 106 L46 106 Z" fill="' + T + '"/>';
    if (opt.nummer !== false) s += '<text data-nebenschrift="" x="50" y="125" font-family="Andika, sans-serif" font-size="25" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + (opt.hell ? '#fffdf8' : T) + '">' + v + '</text>';
    if (opt.markiert) s += '<rect x="2" y="2" width="96" height="136" rx="12" fill="none" stroke="' + ROT + '" stroke-width="5" stroke-dasharray="11 7"/>';
    return s + '</svg>';
  }

  // Eine Hand mit 5 Fingern (Daumen rechts). ja: 5 Wahrheitswerte, links nach rechts
  // (kleiner Finger 16, Ringfinger 8, Mittelfinger 4, Zeigefinger 2, Daumen 1).
  // opt.nummern: Punktzahl über jedem Finger (Schlüssel-Hand); opt.markiert: Stelle 0–4 rot einkreisen
  const HAND_FINGER = [
    { x: 24, b: 17, spitze: 34 },  // kleiner Finger
    { x: 46, b: 19, spitze: 12 },  // Ringfinger
    { x: 68, b: 19, spitze: 3 },   // Mittelfinger
    { x: 90, b: 19, spitze: 14 },  // Zeigefinger
  ];
  function hand(ja, opt) {
    opt = opt || {};
    if (!Array.isArray(ja) || ja.length !== 5) throw new Error('Hand: genau 5 Finger');
    const haut = '#f8d9bd', rand = T;
    const oben = opt.nummern ? 18 : 4;
    let s = svgKopf(opt, 140, 136 + oben, 'Hand');
    s += '<g transform="translate(0 ' + oben + ')">';
    // Daumen oben: zuerst zeichnen, der Handballen deckt seinen Ansatz zu
    if (ja[4]) s += '<rect x="-9.5" y="-31" width="19" height="52" rx="9.5" transform="translate(104 90) rotate(35)" fill="' + haut + '" stroke="' + rand + '" stroke-width="3"/>';
    HAND_FINGER.forEach((f, i) => {
      const top = ja[i] ? f.spitze : 54;
      s += '<rect x="' + (f.x - f.b / 2) + '" y="' + top + '" width="' + f.b + '" height="' + (80 - top) + '" rx="' + (f.b / 2) + '" fill="' + haut + '" stroke="' + rand + '" stroke-width="3"/>';
      if (ja[i]) s += '<path d="M' + (f.x - f.b / 2 + 4) + ' ' + (top + 9) + ' Q' + f.x + ' ' + (top + 4) + ' ' + (f.x + f.b / 2 - 4) + ' ' + (top + 9) + '" fill="none" stroke="#e3b48f" stroke-width="2.2" stroke-linecap="round"/>';
    });
    // Handballen, oben ohne Linie (die Finger wachsen heraus)
    s += '<path d="M13 70 C13 67 15 66 17 66 L98 66 C101 66 102 68 102 72 L102 102 C102 120 90 132 70 132 L44 132 C26 132 12 120 12 102 Z" fill="' + haut + '" stroke="' + rand + '" stroke-width="3" stroke-linejoin="round"/>';
    s += '<rect x="16" y="63" width="84" height="8" fill="' + haut + '"/>';
    // eingeklappte Finger: Knöchel-Bogen auf dem Handballen
    HAND_FINGER.forEach((f, i) => {
      if (!ja[i]) s += '<path d="M' + (f.x - f.b / 2 + 1.5) + ' 73 Q' + f.x + ' 81 ' + (f.x + f.b / 2 - 1.5) + ' 73" fill="none" stroke="' + rand + '" stroke-width="2.6" stroke-linecap="round"/>';
    });
    // Daumen eingeklappt: liegt quer über dem Handballen
    if (!ja[4]) s += '<rect x="56" y="88" width="44" height="18" rx="9" fill="' + haut + '" stroke="' + rand + '" stroke-width="3"/>';
    s += '</g>';
    if (opt.nummern) {
      // Punktzahl über jeder Fingerspitze (gestaffelt wie die Finger), beim Daumen rechts daneben
      const w = werte(5);
      const pos = HAND_FINGER.map((f, i) => [i === 0 ? f.x - 4 : f.x, oben + (ja[i] ? f.spitze : 54) - 11]).concat([[130, oben + (ja[4] ? 50 : 84)]]);
      pos.forEach((p, i) => {
        s += '<text x="' + p[0] + '" y="' + p[1] + '" font-family="Andika, sans-serif" font-size="20" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + T + '">' + w[i] + '</text>';
      });
    }
    if (Number.isInteger(opt.markiert) && opt.markiert >= 0 && opt.markiert <= 4) {
      const i = opt.markiert;
      const cx = i === 4 ? (ja[4] ? 118 : 80) : HAND_FINGER[i].x;
      const cy = oben + (i === 4 ? (ja[4] ? 72 : 97) : (ja[i] ? HAND_FINGER[i].spitze + 16 : 66));
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="17" fill="none" stroke="' + ROT + '" stroke-width="4.5" stroke-dasharray="8 5"/>';
    }
    return s + '</svg>';
  }

  // Ankreuz-Kästchen (für „Lege die Zahl“ am Papier): leer oder mit rotem Kreuz (Lösung)
  function kaestchen(kreuz, opt) {
    opt = opt || {};
    let s = svgKopf(opt, 40, 40, kreuz ? 'Kästchen angekreuzt' : 'Kästchen');
    s += '<rect x="3" y="3" width="34" height="34" rx="5" fill="#ffffff" stroke="' + T + '" stroke-width="3"/>';
    if (kreuz) s += '<path d="M11 11 L29 29 M29 11 L11 29" stroke="' + ROT + '" stroke-width="5.5" stroke-linecap="round"/>';
    return s + '</svg>';
  }

  g.WerkstattJaNein = {
    MIN_KARTEN, MAX_KARTEN, STANDARD, AUSSEHEN, FINGER, FARBEN,
    anzahl, werte, groesste, istKarte, pruefeZahl, zerlege, wert, jaAusWerten, jaWerte,
    alleSchreibweisen, ziffern, vonZiffern, rechnung, sprechen, unterschiede, kobold, bewerte,
    punkte, karte, lampe, hand, kaestchen,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
