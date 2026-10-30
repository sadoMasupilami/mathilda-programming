/* =====================================================================
   Werkstatt-Kern: der Ausführer
   Führt Drachen-Programme im Gitter aus und prüft Ablauf-Reihenfolgen.
   Dieselbe Datei läuft in der Web-App (<script>), beim Bauen der PDFs
   (Chrome) und im Rätsel-Löser (Node: import). Keine Abhängigkeiten.
   Ergebnis: globalThis.WerkstattKern

   Gitter-Regeln (plan/lehrplan.md):
   - x wächst nach rechts, y nach unten, Feld (0, 0) ist links oben
   - Blickrichtung: oben, rechts, unten, links (ohne Angabe: oben)
   - Befehle: vor, links (= links drehen), rechts (= rechts drehen)
   - Wiederhol-Zauber: { wdh: 3, befehle: ['vor'] }, im Text "3[vor]" (2- bis 5-mal, 1 bis 3 Befehle)
   - Stößt der Drache an den Rand oder an ein Hindernis, bleibt er stehen
     und das Programm hört auf (der Kobold hat zugeschlagen).
   - Geschafft: Am Ende des Programms steht der Drache auf dem Ziel und
     hat alle Edelsteine eingesammelt (falls es welche gibt).
   ===================================================================== */
(function (g) {
  'use strict';

  const RICHTUNGEN = ['oben', 'rechts', 'unten', 'links'];
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const BEFEHLE = ['vor', 'links', 'rechts'];
  const WDH_MIN = 2;
  const WDH_MAX = 5;
  const MAX_INNEN = 3;   // höchstens 3 Befehle in einem Zauber-Kasten (Papier, Löser und App gleich)

  function richtung(name) {
    if (name === undefined || name === null || name === '') return 0;
    const i = RICHTUNGEN.indexOf(name);
    if (i < 0) throw new Error('Unbekannte Blickrichtung „' + name + '“');
    return i;
  }

  // ---------------------------------------------------------------------
  // Programme lesen und schreiben
  //   Text:   "vor vor rechts 3[vor links]"
  //   Daten:  ['vor', 'vor', 'rechts', { wdh: 3, befehle: ['vor', 'links'] }]
  // ---------------------------------------------------------------------
  function lies(p) {
    if (Array.isArray(p)) return p.map(pruefeTeil);
    if (typeof p !== 'string') throw new Error('Programm muss Text oder Liste sein');
    const text = p.trim();
    const teile = [];
    const re = /\s*(?:(\d+)\s*\[([^\]]*)\]|([a-zäöü]+))\s*/y;
    let pos = 0;
    while (pos < text.length) {
      re.lastIndex = pos;
      const m = re.exec(text);
      if (!m) throw new Error('Programm nicht lesbar ab „' + text.slice(pos) + '“');
      if (m[1]) teile.push(pruefeTeil({ wdh: parseInt(m[1], 10), befehle: m[2].trim().split(/\s+/).filter(Boolean) }));
      else teile.push(pruefeTeil(m[3]));
      pos = re.lastIndex;
    }
    return teile;
  }
  function pruefeTeil(t) {
    if (typeof t === 'string') {
      if (!BEFEHLE.includes(t)) throw new Error('Unbekannter Befehl „' + t + '“ (erlaubt: vor, links, rechts)');
      return t;
    }
    if (t && typeof t === 'object' && Number.isInteger(t.wdh) && Array.isArray(t.befehle)) {
      if (t.wdh < WDH_MIN || t.wdh > WDH_MAX) throw new Error('Wiederhol-Zauber: ' + t.wdh + '-mal geht nicht (2 bis 5)');
      if (!t.befehle.length) throw new Error('Leerer Zauber-Kasten');
      if (t.befehle.length > MAX_INNEN) throw new Error('Höchstens ' + MAX_INNEN + ' Befehle in einem Zauber-Kasten');
      for (const b of t.befehle) {
        if (typeof b !== 'string') throw new Error('Kein Zauber-Kasten im Zauber-Kasten (verschachtelt kommt erst später)');
        pruefeTeil(b);
      }
      return { wdh: t.wdh, befehle: t.befehle.slice() };
    }
    throw new Error('Unbekannter Programmteil ' + JSON.stringify(t));
  }
  function alsText(prog) {
    return lies(prog).map((t) => (typeof t === 'string' ? t : t.wdh + '[' + t.befehle.join(' ') + ']')).join(' ');
  }

  // Karten zählen: ein Befehl ist 1 Karte, ein Zauber-Kasten 1 Karte plus die Befehle darin
  function karten(prog) {
    return lies(prog).reduce((s, t) => s + (typeof t === 'string' ? 1 : 1 + t.befehle.length), 0);
  }
  // Befehle, die der Drache wirklich ausführt (Wiederhol-Zauber ausgerollt)
  function ausrollen(prog) {
    const aus = [];
    lies(prog).forEach((t, i) => {
      if (typeof t === 'string') aus.push({ befehl: t, teil: i, innen: null, runde: null });
      else for (let r = 0; r < t.wdh; r++) t.befehle.forEach((b, j) => aus.push({ befehl: b, teil: i, innen: j, runde: r }));
    });
    return aus;
  }

  // ---------------------------------------------------------------------
  // Welt: { b, h, start: {x, y, blick}, ziel: {x, y}, hindernisse: [[x, y]], edelsteine: [[x, y]] }
  // ---------------------------------------------------------------------
  function welt(w) {
    if (!w || !Number.isInteger(w.b) || !Number.isInteger(w.h) || w.b < 1 || w.h < 1) throw new Error('Gitter braucht b und h');
    const imGitter = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w.b && y < w.h;
    const s = w.start || {};
    if (!imGitter(s.x, s.y)) throw new Error('Startfeld liegt nicht im Gitter');
    const hind = new Set();
    for (const [x, y] of w.hindernisse || []) {
      if (!imGitter(x, y)) throw new Error('Hindernis ' + x + ',' + y + ' liegt nicht im Gitter');
      hind.add(x + ',' + y);
    }
    if (hind.has(s.x + ',' + s.y)) throw new Error('Hindernis auf dem Startfeld');
    let ziel = null;
    if (w.ziel) {
      if (!imGitter(w.ziel.x, w.ziel.y)) throw new Error('Ziel liegt nicht im Gitter');
      if (hind.has(w.ziel.x + ',' + w.ziel.y)) throw new Error('Hindernis auf dem Ziel');
      ziel = { x: w.ziel.x, y: w.ziel.y };
    }
    const edel = (w.edelsteine || []).map(([x, y]) => {
      if (!imGitter(x, y) || hind.has(x + ',' + y)) throw new Error('Edelstein ' + x + ',' + y + ' liegt nicht frei im Gitter');
      if (x === s.x && y === s.y) throw new Error('Edelstein auf dem Startfeld');
      return x + ',' + y;
    });
    if (new Set(edel).size !== edel.length) throw new Error('Zwei Edelsteine im selben Feld');
    return {
      b: w.b, h: w.h,
      start: { x: s.x, y: s.y, r: richtung(s.blick) },
      ziel, hindernisse: hind, edelsteine: edel, imGitter,
      frei: (x, y) => imGitter(x, y) && !hind.has(x + ',' + y),
    };
  }

  // Ein einzelner Befehl: neuer Zustand oder { stoss: 'rand' | 'hindernis' }
  function schritt(W, z, befehl) {
    if (befehl === 'links') return { x: z.x, y: z.y, r: (z.r + 3) % 4 };
    if (befehl === 'rechts') return { x: z.x, y: z.y, r: (z.r + 1) % 4 };
    const nx = z.x + DX[z.r], ny = z.y + DY[z.r];
    if (!W.imGitter(nx, ny)) return { stoss: 'rand' };
    if (W.hindernisse.has(nx + ',' + ny)) return { stoss: 'hindernis' };
    return { x: nx, y: ny, r: z.r };
  }

  // ---------------------------------------------------------------------
  // Programm ausführen
  // Ergebnis:
  //   schritte: [{ nr, befehl, teil, innen, runde, vorher, nachher }]
  //   stoss:    null | { nr, teil, innen, runde, art: 'rand'|'hindernis', befehl }
  //   ende:     { x, y, blick }
  //   gesammelt: Anzahl eingesammelter Edelsteine
  //   geschafft: true, wenn am Ende auf dem Ziel und alles eingesammelt
  // ---------------------------------------------------------------------
  function ausfuehren(weltDaten, prog, opt) {
    const W = weltDaten && weltDaten.imGitter ? weltDaten : welt(weltDaten);
    const liste = ausrollen(prog);
    const max = (opt && opt.max) || 1000;
    let z = { x: W.start.x, y: W.start.y, r: W.start.r };
    const offen = new Set(W.edelsteine);
    const schritte = [];
    let stoss = null;
    for (let i = 0; i < liste.length && i < max; i++) {
      const s = liste[i];
      const n = schritt(W, z, s.befehl);
      if (n.stoss) {
        stoss = { nr: i, teil: s.teil, innen: s.innen, runde: s.runde, art: n.stoss, befehl: s.befehl };
        break;
      }
      schritte.push({ nr: i, befehl: s.befehl, teil: s.teil, innen: s.innen, runde: s.runde, vorher: zustand(z), nachher: zustand(n) });
      z = n;
      offen.delete(z.x + ',' + z.y);
    }
    const amZiel = !!W.ziel && z.x === W.ziel.x && z.y === W.ziel.y;
    return {
      schritte, stoss, ende: zustand(z),
      gesammelt: W.edelsteine.length - offen.size,
      geschafft: !stoss && amZiel && offen.size === 0,
      amZiel,
    };
  }
  function zustand(z) { return { x: z.x, y: z.y, blick: RICHTUNGEN[z.r] }; }

  // Wo steht der Drache nach n Befehlen? (n zählt ausgeführte Befehle, Wiederhol-Zauber ausgerollt)
  function standNach(weltDaten, prog, n) {
    const e = ausfuehren(weltDaten, prog, { max: n });
    if (e.stoss && e.stoss.nr < n) return null;
    return n === 0 ? zustand(welt(weltDaten).start) : e.schritte[n - 1].nachher;
  }

  // ---------------------------------------------------------------------
  // Ablauf-Karten: Regeln [[a, b], …] heißen „a kommt vor b“
  // ---------------------------------------------------------------------
  function pruefeReihenfolge(regeln, reihenfolge) {
    const pos = {};
    reihenfolge.forEach((id, i) => { pos[id] = i; });
    const verletzt = [];
    for (const [a, b] of regeln) {
      if (pos[a] === undefined || pos[b] === undefined) continue;
      if (pos[a] > pos[b]) verletzt.push([a, b]);
    }
    return { ok: verletzt.length === 0, verletzt };
  }

  g.WerkstattKern = {
    RICHTUNGEN, BEFEHLE, WDH_MIN, WDH_MAX, MAX_INNEN,
    lies, alsText, karten, ausrollen, welt, schritt, ausfuehren, standNach, pruefeReihenfolge,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
