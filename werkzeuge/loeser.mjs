// Löser für die Rätsel der Werkstatt (läuft nur beim Bauen, in Node).
// Benutzt denselben Ausführer wie die Web-App: web/kern/ausfuehrer.js
//
//   kuerzeste(welt)              Breitensuche über Feld, Blickrichtung (und eingesammelte Edelsteine):
//                                Länge des kürzesten Programms, wie viele kürzeste es gibt, Liste
//   mitZauber(welt, maxKarten)   alle Programme mit Wiederhol-Zauber bis maxKarten Karten durchprobieren
//   koboldPruefen(welt, prog, r) kaputtes Programm + gemeinte Reparatur prüfen, alle anderen Reparaturen finden
//   ablaufZaehlen(karten, regeln) alle gültigen Reihenfolgen der Ablauf-Karten zählen

import '../web/kern/ausfuehrer.js';

export const K = globalThis.WerkstattKern;
const BEF = K.BEFEHLE;

// ---------------------------------------------------------------------
// Kürzeste Programme (nur vor, links, rechts)
// ---------------------------------------------------------------------
export function kuerzeste(weltDaten, opt = {}) {
  const W = K.welt(weltDaten);
  if (!W.ziel) throw new Error('Kein Ziel im Gitter');
  const maxListe = opt.maxListe ?? 20;
  const nE = W.edelsteine.length;
  const voll = (1 << nE) - 1;
  const eIndex = new Map(W.edelsteine.map((k, i) => [k, i]));
  const key = (x, y, r, m) => ((m * W.h + y) * W.b + x) * 4 + r;
  const start = { x: W.start.x, y: W.start.y, r: W.start.r, m: 0 };

  // Zustandsgraph aufbauen
  const knoten = new Map(); // key → { z, nach: [[befehl, key]] }
  const offen = [start];
  knoten.set(key(start.x, start.y, start.r, 0), { z: start, nach: [] });
  while (offen.length) {
    const z = offen.pop();
    const k = key(z.x, z.y, z.r, z.m);
    for (const b of BEF) {
      const n = K.schritt(W, z, b);
      if (n.stoss) continue;
      const e = eIndex.get(n.x + ',' + n.y);
      const m = e === undefined ? z.m : z.m | (1 << e);
      const nk = key(n.x, n.y, n.r, m);
      knoten.get(k).nach.push([b, nk]);
      if (!knoten.has(nk)) {
        const nz = { x: n.x, y: n.y, r: n.r, m };
        knoten.set(nk, { z: nz, nach: [] });
        offen.push(nz);
      }
    }
  }
  const istZiel = (z) => z.x === W.ziel.x && z.y === W.ziel.y && z.m === voll;

  // Breitensuche vom Start, Anzahl kürzester Wege mitzählen
  const s0 = key(start.x, start.y, start.r, 0);
  const dist = new Map([[s0, 0]]);
  const anz = new Map([[s0, 1n]]);
  let ebene = [s0];
  let laenge = -1;
  while (ebene.length && laenge < 0) {
    if (ebene.some((k) => istZiel(knoten.get(k).z))) { laenge = dist.get(ebene[0]); break; }
    const neu = [];
    for (const k of ebene) {
      for (const [, nk] of knoten.get(k).nach) {
        if (!dist.has(nk)) { dist.set(nk, dist.get(k) + 1); anz.set(nk, 0n); neu.push(nk); }
        if (dist.get(nk) === dist.get(k) + 1) anz.set(nk, anz.get(nk) + anz.get(k));
      }
    }
    ebene = neu;
  }
  if (laenge < 0) return { erreichbar: false };
  const ziele = ebene.filter((k) => istZiel(knoten.get(k).z));
  const anzahl = ziele.reduce((s, k) => s + anz.get(k), 0n);

  // Alle kürzesten aufzählen (rückwärts über die Ebenen)
  const vor = new Map(); // key → [[befehl, vorgängerKey]]
  for (const [k, kn] of knoten) {
    if (!dist.has(k)) continue;
    for (const [b, nk] of kn.nach) {
      if (dist.get(nk) === dist.get(k) + 1) {
        if (!vor.has(nk)) vor.set(nk, []);
        vor.get(nk).push([b, k]);
      }
    }
  }
  const programme = [];
  const rueck = (k, suffix) => {
    if (programme.length >= maxListe) return;
    if (k === s0) { programme.push(suffix.slice().reverse()); return; }
    for (const [b, pk] of vor.get(k) || []) { suffix.push(b); rueck(pk, suffix); suffix.pop(); }
  };
  for (const zk of ziele) rueck(zk, []);
  programme.sort((a, b) => a.join(' ').localeCompare(b.join(' ')));
  // Gegenprobe mit dem Ausführer
  for (const p of programme) {
    const e = K.ausfuehren(weltDaten, p);
    if (!e.geschafft || p.length !== laenge) throw new Error('Löser und Ausführer sind sich nicht einig bei ' + p.join(' '));
  }
  return { erreichbar: true, laenge, anzahl: Number(anzahl), programme };
}

// ---------------------------------------------------------------------
// Programme mit Wiederhol-Zauber: alle bis maxKarten durchprobieren
// Ein Befehl = 1 Karte, ein Zauber-Kasten = 1 Karte + die Befehle darin.
// ---------------------------------------------------------------------
function zauberTeile(maxInnen) {
  const teile = BEF.map((b) => ({ t: b, k: 1 }));
  const koerper = [[]];
  for (let n = 1; n <= maxInnen; n++) {
    const neu = [];
    for (const k of koerper.filter((x) => x.length === n - 1)) for (const b of BEF) neu.push(k.concat(b));
    koerper.push(...neu);
  }
  for (let w = K.WDH_MIN; w <= K.WDH_MAX; w++) {
    for (const k of koerper) if (k.length) teile.push({ t: { wdh: w, befehle: k }, k: 1 + k.length });
  }
  return teile;
}

export function mitZauber(weltDaten, maxKarten, opt = {}) {
  const W = K.welt(weltDaten);
  const maxInnen = opt.maxInnen ?? K.MAX_INNEN;
  const maxListe = opt.maxListe ?? 20;
  const teile = zauberTeile(maxInnen);
  const beispiele = new Map(); // karten → Programme (höchstens maxListe)
  const zaehler = new Map(); // karten → Anzahl
  const zaehlerMitKasten = new Map();
  let min = Infinity;
  const lauf = (z, offen, prog, karten) => {
    // Ist das bisherige Programm schon eine Lösung?
    if (prog.length && W.ziel && z.x === W.ziel.x && z.y === W.ziel.y && offen.size === 0) {
      zaehler.set(karten, (zaehler.get(karten) || 0) + 1);
      if (prog.some((x) => typeof x !== 'string')) zaehlerMitKasten.set(karten, (zaehlerMitKasten.get(karten) || 0) + 1);
      if (karten < min) min = karten;
      if (!beispiele.has(karten)) beispiele.set(karten, []);
      if (beispiele.get(karten).length < maxListe) beispiele.get(karten).push(prog.slice());
    }
    for (const t of teile) {
      if (karten + t.k > maxKarten) continue;
      let zz = z;
      const of = new Set(offen);
      let ok = true;
      const liste = typeof t.t === 'string' ? [t.t] : Array.from({ length: t.t.wdh }, () => t.t.befehle).flat();
      for (const b of liste) {
        const n = K.schritt(W, zz, b);
        if (n.stoss) { ok = false; break; }
        zz = n;
        of.delete(zz.x + ',' + zz.y);
      }
      if (!ok) continue;
      prog.push(t.t);
      lauf(zz, of, prog, karten + t.k);
      prog.pop();
    }
  };
  lauf({ x: W.start.x, y: W.start.y, r: W.start.r }, new Set(W.edelsteine), [], 0);
  if (min === Infinity) return { erreichbar: false, maxKarten };
  const kuerzeste = beispiele.get(min);
  for (const p of kuerzeste) if (!K.ausfuehren(weltDaten, p).geschafft) throw new Error('Ausführer widerspricht Löser: ' + K.alsText(p));
  const mitKasten = Array.from(zaehlerMitKasten.keys());
  return {
    erreichbar: true,
    minKarten: min,
    anzahlMin: zaehler.get(min),
    kuerzeste,
    minKartenMitKasten: mitKasten.length ? Math.min(...mitKasten) : null,
    anzahlBis: (k) => Array.from(zaehler.entries()).filter(([kk]) => kk <= k).reduce((s, [, v]) => s + v, 0),
    beispiele: (k) => beispiele.get(k) || [],
  };
}

// ---------------------------------------------------------------------
// Kobold-Programme: genau ein Fehler (falscher, fehlender oder überzähliger Befehl)
// reparatur: { art: 'tauschen' | 'einfuegen' | 'loeschen', stelle: 1-basiert, befehl }
//   tauschen:  Befehl an der Stelle wird durch befehl ersetzt
//   einfuegen: befehl wird so eingefügt, dass er danach an der Stelle steht
//   loeschen:  Befehl an der Stelle fällt weg
// ---------------------------------------------------------------------
export function wendeReparaturAn(prog, r) {
  const p = K.lies(prog).slice();
  if (p.some((t) => typeof t !== 'string')) throw new Error('Kobold-Programme ohne Zauber-Kasten');
  const i = r.stelle - 1;
  if (r.art === 'tauschen') {
    if (i < 0 || i >= p.length) throw new Error('Stelle ' + r.stelle + ' gibt es nicht');
    if (p[i] === r.befehl) throw new Error('Tauschen gegen denselben Befehl');
    p[i] = r.befehl;
  } else if (r.art === 'einfuegen') {
    if (i < 0 || i > p.length) throw new Error('Stelle ' + r.stelle + ' gibt es nicht');
    p.splice(i, 0, r.befehl);
  } else if (r.art === 'loeschen') {
    if (i < 0 || i >= p.length) throw new Error('Stelle ' + r.stelle + ' gibt es nicht');
    p.splice(i, 1);
  } else throw new Error('Unbekannte Reparatur ' + r.art);
  return p;
}

export function alleReparaturen(prog) {
  const p = K.lies(prog);
  const aus = [];
  for (let i = 0; i < p.length; i++) {
    for (const b of BEF) if (b !== p[i]) aus.push({ art: 'tauschen', stelle: i + 1, befehl: b });
    aus.push({ art: 'loeschen', stelle: i + 1 });
  }
  for (let i = 0; i <= p.length; i++) for (const b of BEF) aus.push({ art: 'einfuegen', stelle: i + 1, befehl: b });
  return aus;
}

export function koboldPruefen(weltDaten, prog, reparatur) {
  const kaputt = K.ausfuehren(weltDaten, prog);
  if (kaputt.geschafft) throw new Error('Das Kobold-Programm kommt ohne Reparatur an');
  const gemeint = wendeReparaturAn(prog, reparatur);
  const richtig = K.ausfuehren(weltDaten, gemeint);
  if (!richtig.geschafft) throw new Error('Die gemeinte Reparatur kommt nicht an: ' + gemeint.join(' '));
  const auch = [];
  const gesehen = new Set([gemeint.join(' ')]);
  for (const r of alleReparaturen(prog)) {
    const neu = wendeReparaturAn(prog, r);
    const t = neu.join(' ');
    if (gesehen.has(t)) continue;
    gesehen.add(t);
    if (K.ausfuehren(weltDaten, neu).geschafft) auch.push({ reparatur: r, programm: neu });
  }
  // Stellen, deren Löschen bzw. Einfügen genau dasselbe Programm ergibt (z. B. in „vor vor vor“)
  const gleicheStellen = [];
  if (reparatur.art !== 'tauschen') {
    const p = K.lies(prog);
    const grenze = reparatur.art === 'loeschen' ? p.length : p.length + 1;
    for (let st = 1; st <= grenze; st++) {
      const neu = wendeReparaturAn(prog, { ...reparatur, stelle: st });
      if (neu.join(' ') === gemeint.join(' ')) gleicheStellen.push(st);
    }
  }
  return { kaputt, gemeint, auch, gleicheStellen: gleicheStellen.length ? gleicheStellen : [reparatur.stelle] };
}

// ---------------------------------------------------------------------
// Ablauf-Karten: alle Reihenfolgen zählen, die alle Regeln erfüllen
// ---------------------------------------------------------------------
export function ablaufZaehlen(ids, regeln, opt = {}) {
  const maxListe = opt.maxListe ?? 50;
  for (const [a, b] of regeln) {
    if (!ids.includes(a) || !ids.includes(b)) throw new Error('Regel mit unbekannter Karte: ' + a + ' vor ' + b);
  }
  const loesungen = [];
  let anzahl = 0;
  const benutzt = new Set();
  const reihe = [];
  const weiter = () => {
    if (reihe.length === ids.length) {
      if (!K.pruefeReihenfolge(regeln, reihe).ok) throw new Error('Interner Fehler beim Ablauf-Zählen');
      anzahl++;
      if (loesungen.length < maxListe) loesungen.push(reihe.slice());
      return;
    }
    for (const id of ids) {
      if (benutzt.has(id)) continue;
      // Alle Karten, die vor id kommen müssen, müssen schon liegen
      if (regeln.some(([a, b]) => b === id && !benutzt.has(a))) continue;
      benutzt.add(id); reihe.push(id);
      weiter();
      benutzt.delete(id); reihe.pop();
    }
  };
  weiter();
  return { anzahl, loesungen };
}
