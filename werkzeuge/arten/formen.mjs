// Rätselart „formen“ (Einheit 14): Formen-Quadrate
//
// Gemeinsame Logik (Formen als SVG, Prüfen, Backtracking, Lösen in Stufen): web/kern/formen.js
//
// Felder aller Aufgaben: n (2 bis 4), optional formen (Standard: die ersten n von kreis, dreieck,
// quadrat, stern), titel (für die App).
//
// aufgabe "loesen" (Standard): Formen einzeichnen
//   { n: 3, vorgabe: ["KD.", ".QK", "..."], logik?: 2, diagonale?: true, farben?: ["rot", "blau", "gelb"],
//     getrennt?: true, mehrereLoesungen?: true }
//   Der Löser beweist (Abbruch, wenn nicht):
//   - die Vorgabe hat keine doppelten Formen, und es gibt ein leeres Feld
//   - Backtracking über alle Möglichkeiten: genau eine Lösung (sonst "mehrereLoesungen": true)
//   - logik: Das Rätsel geht ohne Raten, höchstens mit dieser Stufe (1 nur eine fehlt,
//     2 Reihe und Spalte zusammen, 3 wo ist Platz?; web/kern/formen.js, logikWeg)
//   - diagonale: Die Schrägen-Regel ist wirklich nötig (ohne sie gäbe es mehr Lösungen)
//   - farben + getrennt: Man kann zuerst nur die Formen, dann nur die Farben lösen (je genau eine Lösung,
//     mit logik auch ohne Raten)
//
// aufgabe "kobold": ein volles Quadrat mit genau einem falschen Feld
//   { n: 4, vorgabe: [4 volle Reihen], kobold: [x, y], richtig: "D" }
//   Der Löser beweist: Es gibt genau eine Änderung eines einzigen Felds, die ein richtiges
//   Formen-Quadrat ergibt, und zwar genau bei kobold mit der Form richtig. Dazu: Nur eine
//   Reihe und nur eine Spalte haben eine Form doppelt, und sie kreuzen sich beim Kobold-Feld
//   (so findet das Kind ihn).
//
// aufgabe "mindestens": Wie viele Formen muss man vorgeben, damit es genau eine Lösung gibt?
//   { n: 3, erwartet: 2, quadrate: 12 }  Der Löser zählt alle Formen-Quadrate (quadrate) und geht alle Vorgaben durch:
//   mit erwartet − 1 Formen hat keine Vorgabe genau eine Lösung, mit erwartet Formen schon.
//   Für n = 3 prüft er zusätzlich die Regel für zwei Formen: genau eine Lösung genau dann,
//   wenn die zwei Formen verschieden sind und nicht in derselben Reihe oder Spalte liegen.
//
// aufgabe "zaehlen": Wie viele Formen-Quadrate gibt es? { n: 3, diagonale?: true, farben?: [...], erwartet: 0 }
//   Backtracking zählt alle (z. B. 3 · 3 mit Schrägen-Regel: keines; Farben und Formen 3 · 3: 72).
//
// aufgabe "duell": das Spiel Formen-Duell (abwechselnd legen, wer nicht legen kann, verliert)
//   n = 4: { n: 4, gewinnt: "zweite" }  Spielbaum: Der Spiegel-Trick der Anleitung (die Zweite legt
//          immer dieselbe Form genau gegenüber) funktioniert gegen jeden Zug.
//   n = 3 ohne Stein: { n: 3, gewinnt: "erste", immer: true }  Ganzer Spielbaum: Jedes Spiel endet
//          nach einer ungeraden Zahl von Karten (5, 7 oder 9), also gewinnt immer die Erste, egal wie
//          beide spielen. Darum braucht das normale Duell den Stein.
//   n = 3 mit Stein: { n: 3, stein: true, gewinnt: "zweite", zufallErste: 44 }  Ein Feld ist gesperrt.
//          Für jedes der 9 Steinfelder der ganze Spielbaum: Wer bei bestem Spiel gewinnt (gewinnt),
//          die genaue Gewinnchance der Ersten in Prozent, wenn beide zufällig legen (zufallErste,
//          gerundet), und dass das Spiel offen ist (Endstellungen mit gerader und ungerader
//          Kartenzahl, Gewinnchance zwischen 30 und 70 Prozent). Alle 9 Steinfelder gleich.

import '../../web/kern/formen.js';

const FQ = globalThis.WerkstattFormen;
const txt = (z) => FQ.alsText(z).join(' / ');

function pruefeLoesen(r, F) {
  const q = FQ.lies(r);
  const p = FQ.pruefe(q, q.zellen);
  if (p.doppelt.length) F('Vorgabe hat doppelte Formen: ' + p.doppelt.map(FQ.fehlerText).join(' '));
  if (!p.leer.length) F('Kein leeres Feld (für ein volles Quadrat mit Fehler: "aufgabe": "kobold")');
  const l = FQ.loese(q, { max: 50 });
  const anzahlText = l.vollstaendig ? String(l.anzahl) : 'mindestens ' + l.anzahl;
  if (!l.anzahl) return F('Keine Lösung: die Vorgabe lässt sich nicht fertig machen');
  if (l.anzahl > 1 && !r.mehrereLoesungen) F('Es gibt ' + anzahlText + ' Lösungen, z. B. ' + l.loesungen.slice(0, 2).map(txt).join(' | ') + '. Mehr Formen vorgeben oder "mehrereLoesungen": true');
  if (l.anzahl === 1 && r.mehrereLoesungen) F('„mehrereLoesungen“ ist gesetzt, aber es gibt genau eine Lösung');
  const weg = FQ.logikWeg(q);
  if (r.logik !== undefined) {
    if (![1, 2, 3].includes(r.logik)) F('logik muss 1, 2 oder 3 sein');
    else if (!weg.fertig) F('Ohne Raten nicht lösbar (auch nicht mit Stufe 3). "logik" weglassen oder mehr Formen vorgeben');
    else if (weg.stufe > r.logik) F('Braucht Stufe ' + weg.stufe + ' (erlaubt: ' + r.logik + ')');
  }
  // Die App bewertet mit FQ.bewerte: Die Lösung muss dort als geschafft gelten
  if (!FQ.bewerte(r, l.loesungen[0]).geschafft) F('web/kern/formen.js (bewerte) erkennt die Lösung nicht als geschafft');
  const aus = {
    n: q.n, formen: q.formen, farben: q.farben, diagonale: q.diagonale,
    vorgaben: q.n * q.n - p.leer.length, leer: p.leer.length,
    anzahl: l.anzahl, eindeutig: l.anzahl === 1,
    quadrat: FQ.alsText(l.loesungen[0]),
    ohneRaten: weg.fertig, stufe: weg.fertig ? weg.stufe : null,
    schritte: weg.fertig ? weg.schritte.map((s) => ({ x: s.x, y: s.y, f: s.f, c: s.c, stufe: s.stufe })) : null,
  };
  if (l.anzahl > 1) aus.beispiele = l.loesungen.slice(0, 3).map(FQ.alsText);
  if (q.diagonale) {
    const o = FQ.loese(q, { max: 50, ohneDiagonale: true });
    if (l.anzahl === 1 && o.anzahl < 2) F('Die Schrägen-Regel ist nicht nötig: auch ohne sie gibt es nur eine Lösung');
    aus.ohneSchraege = o.vollstaendig ? o.anzahl : '>' + (o.anzahl - 1);
  }
  if (q.farben) {
    const o = FQ.loese(q, { max: 50, ohneKartenRegel: true });
    aus.ohneKartenRegel = o.vollstaendig ? o.anzahl : '>' + (o.anzahl - 1);
    // Getrennt lösbar? Zuerst nur die Formen, dann nur die Farben (je ein eigenes Formen-Quadrat)
    const teil = (wert) => ({ n: q.n, formen: q.formen, vorgabe: q.zellen.map((z) => z.map((c) => (c ? FQ.INFO[q.formen[wert(c)]].kurz : '.')).join('')) });
    const allein = (t) => { const a = FQ.loese(t, { max: 3 }); const w = FQ.logikWeg(t); return { anzahl: a.anzahl, stufe: w.fertig ? w.stufe : null }; };
    aus.formenAllein = allein(teil((c) => q.formen.indexOf(c.f)));
    aus.farbenAllein = allein(teil((c) => q.farben.indexOf(c.c)));
    if (r.getrennt) {
      for (const [name, t] of [['Formen', aus.formenAllein], ['Farben', aus.farbenAllein]]) {
        if (t.anzahl !== 1) F('getrennt: Die ' + name + ' allein haben ' + t.anzahl + ' Lösungen (soll 1)');
        else if (r.logik !== undefined && (t.stufe === null || t.stufe > r.logik)) F('getrennt: Die ' + name + ' allein brauchen ' + (t.stufe === null ? 'Ausprobieren' : 'Stufe ' + t.stufe));
      }
    }
  }
  return aus;
}

function pruefeKobold(r, F) {
  const q = FQ.lies(r);
  if (q.farben) return F('Kobold-Quadrate nur ohne Farben');
  const p = FQ.pruefe(q, q.zellen);
  if (p.leer.length) return F('Ein Kobold-Quadrat ist voll (' + p.leer.length + ' Felder leer)');
  if (p.ok) return F('Kein Fehler im Quadrat: der Kobold fehlt');
  const reparaturen = [];
  for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) {
    for (const w of FQ.werteVon(q)) {
      if (FQ.gleich(w, q.zellen[y][x])) continue;
      const z = FQ.kopie(q.zellen);
      z[y][x] = w;
      if (FQ.pruefe(q, z).ok) reparaturen.push({ x, y, f: w.f, quadrat: FQ.alsText(z) });
    }
  }
  if (reparaturen.length !== 1) return F('Genau ein falsches Feld soll es geben: ' + reparaturen.length + ' Ein-Feld-Reparaturen möglich (' + reparaturen.map((a) => a.x + ',' + a.y + '=' + FQ.INFO[a.f].kurz).join(' ') + ')');
  const rep = reparaturen[0];
  // Die App bewertet mit FQ.bewerte: Die Reparatur gilt, das unveränderte Quadrat nicht
  if (!FQ.bewerte(r, FQ.lies({ n: q.n, formen: q.formen, vorgabe: rep.quadrat }).zellen).geschafft) F('web/kern/formen.js (bewerte) erkennt die Reparatur nicht als geschafft');
  if (FQ.bewerte(r, q.zellen).geschafft) F('web/kern/formen.js (bewerte) hält das Kobold-Quadrat schon für geschafft');
  if (!Array.isArray(r.kobold) || r.kobold[0] !== rep.x || r.kobold[1] !== rep.y) F('Das falsche Feld ist [' + rep.x + ', ' + rep.y + '], nicht ' + JSON.stringify(r.kobold));
  const richtig = FQ.BUCHSTABE[r.richtig] || r.richtig;
  if (r.richtig !== undefined && richtig !== rep.f) F('Richtig wäre ' + FQ.INFO[rep.f].name + ', nicht ' + r.richtig);
  // So findet das Kind den Kobold: genau eine Reihe und eine Spalte mit einer doppelten Form
  const reihen = new Set(p.doppelt.filter((d) => d.art === 'reihe').map((d) => d.nr));
  const spalten = new Set(p.doppelt.filter((d) => d.art === 'spalte').map((d) => d.nr));
  if (reihen.size !== 1 || spalten.size !== 1 || !reihen.has(rep.y) || !spalten.has(rep.x)) F('Es soll genau eine Reihe und eine Spalte mit doppelter Form geben, die sich beim Kobold-Feld kreuzen');
  return {
    n: q.n, formen: q.formen, feld: [rep.x, rep.y], falsch: q.zellen[rep.y][rep.x].f, richtig: rep.f,
    quadrat: rep.quadrat, doppelt: p.doppelt.map((d) => ({ art: d.art, nr: d.nr, f: d.f, felder: d.felder })),
  };
}

// Alle Formen-Quadrate n · n (als Zahlen 0 … n−1)
function alleQuadrate(n, ersteReiheFest) {
  const aus = [];
  const z = Array.from({ length: n }, () => new Array(n).fill(-1));
  function setze(i) {
    if (i === n * n) { aus.push(z.map((r) => r.slice())); return; }
    const x = i % n, y = (i / n) | 0;
    if (ersteReiheFest && y === 0) { z[0][x] = x; setze(i + 1); return; }
    for (let v = 0; v < n; v++) {
      let ok = true;
      for (let k = 0; k < n && ok; k++) if (z[y][k] === v || z[k][x] === v) ok = false;
      if (!ok) continue;
      z[y][x] = v;
      setze(i + 1);
      z[y][x] = -1;
    }
  }
  setze(0);
  return aus;
}
function teilmengen(m, k, fn) {
  const a = [];
  (function weiter(start) {
    if (a.length === k) { fn(a); return; }
    for (let i = start; i < m; i++) { a.push(i); weiter(i + 1); a.pop(); }
  })(0);
}

function pruefeMindestens(r, F) {
  const n = r.n;
  if (!Number.isInteger(n) || n < 2 || n > 4) return F('n muss 2 bis 4 sein');
  const formen = FQ.formenVon(r);
  // Ob eine Vorgabe genau eine Lösung hat, hängt nicht davon ab, welche Form welche Nummer hat:
  // es reichen die Quadrate mit fester erster Reihe (alle anderen entstehen durch Umbenennen).
  const quadrate = alleQuadrate(n, true);
  const anzahlAlle = alleQuadrate(n, false).length;
  const zuQ = (zahlen, felder) => {
    const v = Array.from({ length: n }, () => new Array(n).fill('.'));
    for (const i of felder) { const x = i % n, y = (i / n) | 0; v[y][x] = FQ.INFO[formen[zahlen[y][x]]].kurz; }
    return { n, formen, vorgabe: v.map((z) => z.join('')) };
  };
  // Abkürzung (spart Zeit, ändert nichts am Ergebnis): Bleiben zwei Reihen (oder zwei Spalten) ganz leer
  // oder fehlen zwei Formen ganz, kann man sie in jeder Lösung tauschen: dann gibt es sicher zwei Lösungen.
  const sicherMehrere = (qz, felder) => {
    const reihen = new Set(), spalten = new Set(), werte = new Set();
    for (const i of felder) { const x = i % n, y = (i / n) | 0; reihen.add(y); spalten.add(x); werte.add(qz[y][x]); }
    return reihen.size < n - 1 || spalten.size < n - 1 || werte.size < n - 1;
  };
  let mindestens = null, beispiel = null, eindeutigeK = 0, alleK = 0;
  for (let k = 1; k <= n * n && mindestens === null; k++) {
    let treffer = 0, gesamt = 0, erstes = null;
    for (const qz of quadrate) {
      teilmengen(n * n, k, (felder) => {
        gesamt++;
        if (sicherMehrere(qz, felder)) return;
        const v = zuQ(qz, felder);
        if (FQ.loese(v, { max: 2 }).anzahl === 1) { treffer++; if (!erstes) erstes = v.vorgabe; }
      });
    }
    if (treffer) { mindestens = k; beispiel = erstes; eindeutigeK = treffer; alleK = gesamt; }
  }
  if (r.erwartet !== undefined && r.erwartet !== mindestens) F('Mindestens ' + mindestens + ' Formen nötig, nicht ' + r.erwartet);
  if (r.quadrate !== undefined && r.quadrate !== anzahlAlle) F('Es gibt ' + anzahlAlle + ' Formen-Quadrate ' + n + ' · ' + n + ', nicht ' + r.quadrate);
  const aus = { n, formen, mindestens, beispiel, quadrate: anzahlAlle, anteil: eindeutigeK + ' von ' + alleK + ' Vorgaben (bei fester erster Reihe)' };
  if (n === 3) {
    // Regel für zwei Formen: verschieden und nicht in derselben Reihe oder Spalte → genau eine Lösung
    let regelOk = true, faelle = 0;
    for (const qz of quadrate) {
      teilmengen(9, 2, ([a, b]) => {
        faelle++;
        const xa = a % 3, ya = (a / 3) | 0, xb = b % 3, yb = (b / 3) | 0;
        const vorhergesagt = qz[ya][xa] !== qz[yb][xb] && xa !== xb && ya !== yb;
        const echt = FQ.loese(zuQ(qz, [a, b]), { max: 2 }).anzahl === 1;
        if (vorhergesagt !== echt) regelOk = false;
      });
    }
    if (!regelOk) F('Die Regel für zwei Formen stimmt nicht');
    aus.regelZweiFormen = regelOk;
    aus.regelFaelle = faelle;
  }
  return aus;
}

// Formen-Duell: Spielbaum und Trick
//   Brett als Zahlen: 0 leer, 1 … n Formen, -1 Stein (dort darf keine Karte hin)
function pruefeDuell(r, F) {
  const n = r.n;
  if (n !== 3 && n !== 4) return F('Formen-Duell nur 3 · 3 oder 4 · 4');
  if (r.stein && n !== 3) return F('Formen-Duell mit Stein nur 3 · 3');
  const N = n * n;
  const erlaubt = (b, i, f) => {
    const x = i % n, y = (i / n) | 0;
    for (let k = 0; k < n; k++) if (b[y * n + k] === f || b[k * n + x] === f) return false;
    return !b[i];
  };
  const zuege = (b) => {
    const z = [];
    for (let i = 0; i < N; i++) if (!b[i]) for (let f = 1; f <= n; f++) if (erlaubt(b, i, f)) z.push([i, f]);
    return z;
  };
  if (n === 4) {
    // Die Zweite spiegelt: dieselbe Form genau gegenüber
    const gegenueber = (i) => N - 1 - i;
    let trickOk = true, zustaende = 0;
    const gesehen = new Set();
    (function spiel(b) {
      const key = b.join('');
      if (gesehen.has(key)) return;
      gesehen.add(key);
      zustaende++;
      for (const [i, f] of zuege(b)) {
        b[i] = f;
        const j = gegenueber(i);
        if (!erlaubt(b, j, f)) trickOk = false;
        else { b[j] = f; spiel(b); b[j] = 0; }
        b[i] = 0;
        if (!trickOk) return;
      }
    })(new Array(N).fill(0));
    if (!trickOk) F('Der Spiegel-Trick funktioniert nicht gegen jeden Zug');
    if (r.gewinnt !== undefined && r.gewinnt !== 'zweite') F('Mit dem Spiegel-Trick gewinnt die zweite, nicht die ' + r.gewinnt);
    return { n, gewinnt: 'zweite', trickOk, zustaende };
  }
  // n = 3: der ganze Spielbaum (für jedes Steinfeld bzw. ohne Stein)
  function baum(start) {
    const sieg = new Map();     // Gewinnt, wer am Zug ist (bei bestem Spiel)?
    const chance = new Map();   // Gewinnchance dessen, der am Zug ist, wenn beide zufällig legen
    const enden = new Set();    // Kartenzahl in den Endstellungen
    const karten = (b) => b.filter((v) => v > 0).length;
    (function gehe(b) {
      const key = b.join(',');
      if (sieg.has(key)) return;
      const z = zuege(b);
      if (!z.length) { sieg.set(key, false); chance.set(key, 0); enden.add(karten(b)); return; }
      let w = false, c = 0;
      for (const [i, f] of z) {
        b[i] = f;
        gehe(b);
        const k = b.join(',');
        if (!sieg.get(k)) w = true;
        c += 1 - chance.get(k);
        b[i] = 0;
      }
      sieg.set(key, w);
      chance.set(key, c / z.length);
    })(start.slice());
    const key = start.join(',');
    return { ersteGewinnt: sieg.get(key), zufallErste: chance.get(key), enden: [...enden].sort((a, b) => a - b), stellungen: sieg.size };
  }
  if (!r.stein) {
    const b = baum(new Array(N).fill(0));
    if (!b.ersteGewinnt) F('Spielbaum ohne Stein: Die Erste gewinnt nicht');
    const immer = b.enden.every((k) => k % 2 === 1);
    if (r.immer && !immer) F('Ohne Stein endet nicht jedes Spiel mit einer ungeraden Kartenzahl: ' + b.enden.join(', '));
    if (r.gewinnt !== undefined && r.gewinnt !== 'erste') F('Ohne Stein gewinnt die erste, nicht die ' + r.gewinnt);
    return { n, gewinnt: 'erste', immer, enden: b.enden, stellungen: b.stellungen };
  }
  const proFeld = [];
  for (let s = 0; s < N; s++) {
    const start = new Array(N).fill(0);
    start[s] = -1;
    proFeld.push(baum(start));
  }
  const b0 = proFeld[0];
  for (let s = 1; s < N; s++) {
    const b = proFeld[s];
    if (b.ersteGewinnt !== b0.ersteGewinnt || Math.abs(b.zufallErste - b0.zufallErste) > 1e-9) F('Mit Stein: Steinfeld ' + s + ' gibt ein anderes Ergebnis als Feld 0');
  }
  const gewinnt = b0.ersteGewinnt ? 'erste' : 'zweite';
  const prozent = Math.round(b0.zufallErste * 100);
  const offen = b0.enden.some((k) => k % 2 === 0) && b0.enden.some((k) => k % 2 === 1) && b0.zufallErste > 0.3 && b0.zufallErste < 0.7;
  if (!offen) F('Mit Stein ist das Spiel nicht offen (Endstellungen ' + b0.enden.join(', ') + ', Erste gewinnt zufällig ' + prozent + ' %)');
  if (r.gewinnt !== undefined && r.gewinnt !== gewinnt) F('Mit Stein gewinnt bei bestem Spiel die ' + gewinnt + ', nicht die ' + r.gewinnt);
  if (r.zufallErste !== undefined && r.zufallErste !== prozent) F('Mit Stein gewinnt die Erste bei zufälligem Legen in ' + prozent + ' von 100 Spielen, nicht ' + r.zufallErste);
  return { n, stein: true, gewinnt, zufallErste: prozent, enden: b0.enden, stellungen: b0.stellungen, steinfelder: N };
}

// Wie viele Formen-Quadrate gibt es (mit Schrägen-Regel, mit Farben)? Für Sätze wie „Ohne Anfang gibt es 72“.
function pruefeZaehlen(r, F) {
  const n = r.n;
  const leer = { n, formen: r.formen, farben: r.farben, diagonale: r.diagonale, vorgabe: Array.from({ length: n }, () => (r.farben ? new Array(n).fill('.').join(' ') : '.'.repeat(n))) };
  const l = FQ.loese(leer, { max: 100000 });
  if (!l.vollstaendig) return F('Zu viele zum Zählen');
  if (r.erwartet !== undefined && r.erwartet !== l.anzahl) F('Es gibt ' + l.anzahl + ' solche Formen-Quadrate, nicht ' + r.erwartet);
  return { n, diagonale: !!r.diagonale, farben: r.farben || null, anzahl: l.anzahl, beispiel: l.loesungen[0] ? FQ.alsText(l.loesungen[0]) : null };
}

function pruefe(r, F) {
  const a = r.aufgabe || 'loesen';
  if (a === 'loesen') return pruefeLoesen(r, F);
  if (a === 'zaehlen') return pruefeZaehlen(r, F);
  if (a === 'kobold') return pruefeKobold(r, F);
  if (a === 'mindestens') return pruefeMindestens(r, F);
  if (a === 'duell') return pruefeDuell(r, F);
  return F('aufgabe muss loesen, kobold, mindestens, zaehlen oder duell sein');
}

function bericht(r) {
  const l = r.loesung || {};
  const a = r.aufgabe || 'loesen';
  if (a === 'loesen') return l.n + '·' + l.n + ', ' + l.vorgaben + ' vorgegeben, ' + l.anzahl + ' Lösung(en), ' + (l.ohneRaten ? 'ohne Raten (Stufe ' + l.stufe + ')' : 'mit Ausprobieren') +
    (l.ohneSchraege !== undefined ? ', ohne Schrägen-Regel ' + l.ohneSchraege : '') + (l.ohneKartenRegel !== undefined ? ', ohne Karten-Regel ' + l.ohneKartenRegel : '') + ': ' + (l.quadrat || []).join(' ');
  if (a === 'kobold') return 'Kobold bei [' + l.feld + ']: ' + l.falsch + ' statt ' + l.richtig;
  if (a === 'mindestens') return 'mindestens ' + l.mindestens + ' Formen (' + l.quadrate + ' Quadrate), z. B. ' + (l.beispiel || []).join(' ') + (l.regelZweiFormen ? ', Regel für 2 Formen stimmt' : '');
  if (a === 'zaehlen') return l.anzahl + ' Formen-Quadrate ' + l.n + '·' + l.n + (l.diagonale ? ' mit Schrägen' : '') + (l.farben ? ' mit Farben' : '');
  if (a === 'duell') {
    if (l.n === 4) return 'gewinnt: zweite (Spiegel-Trick gegen jeden Zug geprüft, ' + l.zustaende + ' Stellungen)';
    if (l.stein) return 'mit Stein (alle ' + l.steinfelder + ' Felder gleich): bei bestem Spiel gewinnt die ' + l.gewinnt + ', zufällig die Erste in ' + l.zufallErste + ' %, Spiele enden nach ' + l.enden.join('/') + ' Karten (' + l.stellungen + ' Stellungen)';
    return 'ohne Stein: gewinnt ' + (l.immer ? 'immer' : 'bei bestem Spiel') + ' die ' + l.gewinnt + ', Spiele enden nach ' + l.enden.join('/') + ' Karten (' + l.stellungen + ' Stellungen)';
  }
  return '';
}

// Für die App: nur das Rätsel, nie die Lösung (beim Kobold auch nicht, welches Feld falsch ist).
// Die App (web/spiele/formen.js) kann Formen einzeichnen (loesen, auch mit Schrägen) und den Kobold
// reparieren, aber keine Farben wählen: andere Web-Levels brechen den Bau ab.
function fuerApp(r) {
  const a = r.aufgabe || 'loesen';
  if (a !== 'loesen' && a !== 'kobold') throw new Error('Web-Level ' + r.id + ': aufgabe „' + a + '“ kann die App nicht (nur loesen und kobold)');
  if (r.farben) throw new Error('Web-Level ' + r.id + ': Farben und Formen kann die App nicht (nur Formen)');
  const q = FQ.lies(r);
  return {
    id: r.id, art: r.art, titel: r.titel || '', aufgabe: a,
    n: q.n, formen: q.formen, farben: q.farben, diagonale: q.diagonale,
    vorgabe: FQ.alsText(q.zellen),
  };
}

export default { art: 'formen', pruefe, bericht, fuerApp };
