// Löser für die Rätsel der Werkstatt (läuft nur beim Bauen, in Node).
// Benutzt denselben Ausführer wie die Web-App: web/kern/ausfuehrer.js
//
//   kuerzeste(welt)              Breitensuche über Feld, Blickrichtung (und eingesammelte Edelsteine):
//                                Länge des kürzesten Programms, wie viele kürzeste es gibt, Liste
//   mitZauber(welt, maxKarten)   alle Programme mit Wiederhol-Zauber bis maxKarten Karten durchprobieren
//   koboldPruefen(welt, prog, r) kaputtes Programm + gemeinte Reparatur prüfen, alle anderen Reparaturen finden
//   ablaufZaehlen(karten, regeln) alle gültigen Reihenfolgen der Ablauf-Karten zählen
//
// Erweiterte Befehle (plan/lehrplan.md 7.8: Wenn-dann-Kasten, „bis zum Schatz“, Zaubersprüche):
//   mitRegeln(welten, maxKarten, erlaubt, opt)   kleinste Kartenzahl und Anzahl der kürzesten Programme,
//                                optional für mehrere Welten zugleich („ein Programm für alle“)
//   koboldErweitert(welten, prog, sprueche, r, opt)  Kobold-Programme mit Kästen und Sprüchen (Stellen wie "3.dann.1")
//   gleichesVerhalten(welten, a, b, opt)          machen zwei Programme in jeder Welt genau dasselbe?

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

// =====================================================================
// Erweiterte Befehle (plan/lehrplan.md 7.8)
// =====================================================================
export const STANDARD_BEDINGUNGEN = ['stein', 'frei'];
export const NEUE_KAESTEN = ['wenn', 'bis', 'spruch'];
export const ERLAUBT_NAMEN = ['zauber', 'wenn', 'bis', 'spruch'];
const SPIEGEL = { stein: 'frei', frei: 'stein', 'stein-links': 'frei-links', 'frei-links': 'stein-links', 'stein-rechts': 'frei-rechts', 'frei-rechts': 'stein-rechts' };
const WEITER = 0, HALT = 1, BIS_ENDE = 2;

class ZuGross extends Error {}

// Eine Welt als Tabellen: Zustand s = (y · b + x) · 4 + Blickrichtung
function baueWelt(weltDaten) {
  const W = K.welt(weltDaten);
  if (!W.ziel) throw new Error('Kein Ziel im Gitter');
  const { b, h } = W;
  const N = b * h * 4;
  const vor = new Int32Array(N), links = new Int32Array(N), rechts = new Int32Array(N);
  const bed = {};
  for (const name of K.BEDINGUNGEN) bed[name] = new Uint8Array(N);
  for (let y = 0; y < h; y++) for (let x = 0; x < b; x++) for (let r = 0; r < 4; r++) {
    const s = (y * b + x) * 4 + r;
    const n = K.schritt(W, { x, y, r }, 'vor');
    vor[s] = n.stoss ? -1 : (n.y * b + n.x) * 4 + r;
    links[s] = (y * b + x) * 4 + (r + 3) % 4;
    rechts[s] = (y * b + x) * 4 + (r + 1) % 4;
    for (const name of K.BEDINGUNGEN) bed[name][s] = K.bedingung(W, { x, y, r }, name) ? 1 : 0;
  }
  const gem = new Int32Array(b * h);
  W.edelsteine.forEach((k, i) => { const [x, y] = k.split(',').map(Number); gem[y * b + x] = 1 << i; });
  return {
    daten: weltDaten, b, h, vor, links, rechts, bed, gem, voll: (1 << W.edelsteine.length) - 1,
    ziel: W.ziel.y * b + W.ziel.x, start: (W.start.y * b + W.start.x) * 4 + W.start.r,
  };
}

// Übersetzte Programmteile: 0 vor, 1 links, 2 rechts, { t: 'r', name } Aufruf,
// { t: 'w', c, dann, sonst } Wenn-dann, { t: 'z', n, inhalt } Zauber-Kasten, { t: 'b', inhalt } bis zum Schatz
function uebersetze(t) {
  if (typeof t === 'string') return K.BEFEHLE.indexOf(t);
  if (t.spruch) return { t: 'r', name: t.spruch };
  if (t.wenn) return { t: 'w', c: t.wenn, dann: t.dann.map(uebersetze), sonst: t.sonst.map(uebersetze) };
  if (t.bis) return { t: 'b', inhalt: t.befehle.map(uebersetze) };
  return { t: 'z', n: t.wdh, inhalt: t.befehle.map(uebersetze) };
}
function knotenText(k) {
  if (typeof k === 'number') return K.BEFEHLE[k];
  if (k.t === 'r') return '@' + k.name;
  if (k.t === 'w') return 'wenn[' + k.c + ': ' + k.dann.map(knotenText).join(' ') + (k.sonst.length ? ' sonst ' + k.sonst.map(knotenText).join(' ') : '') + ']';
  return (k.t === 'b' ? 'bis' : k.n) + '[' + k.inhalt.map(knotenText).join(' ') + ']';
}
function knotenKarten(k) {
  if (typeof k === 'number' || k.t === 'r') return 1;
  if (k.t === 'w') return 1 + k.dann.length + k.sonst.length;
  return 1 + k.inhalt.reduce((s, x) => s + knotenKarten(x), 0);
}
function ruft(k) {
  if (typeof k === 'number') return false;
  if (k.t === 'r') return true;
  if (k.t === 'w') return k.dann.some(ruft) || k.sonst.some(ruft);
  return k.inhalt.some(ruft);
}

// Schnelle Ausführung (gleiche Regeln wie K.ausfuehren, ohne Anzeige-Daten).
// C = { s, m (Edelsteine), n (ausgeführte Befehle), bis (Tiefe), f (0 gut, 1 Stoß, 2 zu lang) }
function laeufer(zaehle) {
  const MAXS = K.MAX_SCHRITTE;
  function lauf(Wc, C, k, sp) {
    if (typeof k === 'number') {
      if (C.n >= MAXS) { C.f = 2; return HALT; }
      let s2;
      if (k === 0) { s2 = Wc.vor[C.s]; if (s2 < 0) { C.f = 1; return HALT; } }
      else s2 = k === 1 ? Wc.links[C.s] : Wc.rechts[C.s];
      C.s = s2; C.n++;
      zaehle();
      const pos = s2 >> 2;
      C.m |= Wc.gem[pos];
      return C.bis > 0 && pos === Wc.ziel ? BIS_ENDE : WEITER;
    }
    switch (k.t) {
      case 'r': return liste(Wc, C, sp[k.name], sp);
      case 'w': return liste(Wc, C, Wc.bed[k.c][C.s] ? k.dann : k.sonst, sp);
      case 'z':
        for (let i = 0; i < k.n; i++) { const e = liste(Wc, C, k.inhalt, sp); if (e) return e; }
        return WEITER;
      default: {   // 'b': bis zum Schatz
        if ((C.s >> 2) === Wc.ziel) return WEITER;
        C.bis++;
        let e;
        for (;;) {
          const n0 = C.n;
          e = liste(Wc, C, k.inhalt, sp);
          if (e) break;
          if (C.n === n0) { C.f = 2; e = HALT; break; }
        }
        C.bis--;
        if (e === BIS_ENDE) return C.bis > 0 ? BIS_ENDE : WEITER;
        return e;
      }
    }
  }
  function liste(Wc, C, l, sp) {
    for (let i = 0; i < l.length; i++) { const e = lauf(Wc, C, l[i], sp); if (e) return e; }
    return WEITER;
  }
  return lauf;
}

// Alle Folgen der Länge n aus einer Liste
function folgen(atome, n) {
  let aus = [[]];
  for (let i = 0; i < n; i++) { const neu = []; for (const f of aus) for (const a of atome) neu.push(f.concat([a])); aus = neu; }
  return aus;
}
const gleichAtom = (a, b) => (typeof a === 'number' ? a === b : typeof b !== 'number' && a.t === 'r' && b.t === 'r' && a.name === b.name);

// Wenn-dann-Kästen mit genau `kosten` Karten. Gespiegelte Paare (wenn[stein: A sonst B] macht genau dasselbe
// wie wenn[frei: B sonst A]) werden einmal gebaut und doppelt gezählt (mult). wenn[c: X sonst X] mit einem
// Befehl ist nie das kürzeste (X allein spart 2 Karten) und fällt weg.
function wennListe(kosten, zweigAtome, bed) {
  const aus = [];
  for (let d = 1; d <= K.MAX_DANN; d++) {
    const s = kosten - 1 - d;
    if (s < 0 || s > K.MAX_SONST) continue;
    const dannL = folgen(zweigAtome, d), sonstL = folgen(zweigAtome, s);
    for (const c of bed) {
      let mult = 1;
      if (s > 0 && bed.includes(SPIEGEL[c])) { if (c.indexOf('frei') === 0) continue; mult = 2; }
      for (const dann of dannL) for (const sonst of sonstL) {
        if (d === 1 && s === 1 && gleichAtom(dann[0], sonst[0])) continue;
        aus.push({ k: { t: 'w', c, dann, sonst }, mult });
      }
    }
  }
  return aus;
}

// Bausteine nach Kartenzahl für eine Umgebung (Programm oder Zauberspruch)
function baukasten(darf, bed, rufe, imSpruch, mehrereWelten) {
  const cache = new Map();
  const befehle = [0, 1, 2].map((k) => ({ k, mult: 1 }));
  const aufrufe = imSpruch ? [] : rufe.map((name) => ({ k: { t: 'r', name }, mult: 1 }));
  const zweigAtome = [0, 1, 2].concat(imSpruch ? [] : rufe.map((name) => ({ t: 'r', name })));
  const wennNach = (k) => {
    if (!darf.has('wenn') || k < 2) return [];
    const key = 'w' + k;
    if (!cache.has(key)) cache.set(key, wennListe(k, zweigAtome, bed));
    return cache.get(key);
  };
  // Inhalt eines Zauber-Kastens: 1 bis 3 Teile (Befehle, Aufrufe, Wenn-dann), zusammen genau `kosten` Karten
  const atomeNach = (k) => (k === 1 ? befehle.concat(aufrufe) : wennNach(k));
  function inhalte(kosten, cb) {
    const folge = [];
    const rek = (rest, mult) => {
      if (rest === 0) { if (folge.length) cb(folge.slice(), mult); return; }
      if (folge.length >= K.MAX_INNEN) return;
      for (let c = 1; c <= rest; c++) for (const a of atomeNach(c)) { folge.push(a.k); rek(rest - c, mult * a.mult); folge.pop(); }
    };
    rek(kosten, 1);
  }
  // Ein Teil (im Programm bzw. im Spruch) mit genau k Karten
  function teile(k, cb) {
    if (k === 1) { for (const a of befehle.concat(aufrufe)) cb(a.k, 1); }
    // Ein Wenn-dann-Kasten außerhalb eines Zauber-Kastens wird im Programm genau einmal ausgeführt:
    // Bei einer Welt ist dann der gewählte Zweig allein immer kürzer. Im Spruch kann er öfter drankommen.
    if (k >= 2 && (imSpruch || mehrereWelten)) for (const a of wennNach(k)) cb(a.k, a.mult);
    if (k >= 2 && darf.has('zauber')) inhalte(k - 1, (inh, mult) => { for (let n = K.WDH_MIN; n <= K.WDH_MAX; n++) cb({ t: 'z', n, inhalt: inh }, mult); });
    if (k >= 2 && darf.has('bis')) inhalte(k - 1, (inh, mult) => cb({ t: 'b', inhalt: inh }, mult));
  }
  return { teile };
}

// Zaubersprüche mit genau `kosten` Karten Inhalt (1 bis 4 Teile; ein einzelner Befehl ist nie sinnvoll)
function spruchKoerper(kasten, kosten, cb) {
  const folge = [];
  const rek = (rest, mult) => {
    if (rest === 0) {
      if (folge.length && !(folge.length === 1 && typeof folge[0] === 'number')) cb(folge.slice(), mult);
      return;
    }
    if (folge.length >= K.MAX_SPRUCH) return;
    for (let c = 1; c <= rest; c++) kasten.teile(c, (t, m) => { folge.push(t); rek(rest - c, mult * m); folge.pop(); });
  };
  rek(kosten, 1);
}

// ---------------------------------------------------------------------
// mitRegeln: kleinste Kartenzahl, mit der der Drache in allen Welten ankommt
//   welten:    eine Welt oder eine Liste (ein Programm muss in allen geschafft sein)
//   erlaubt:   Liste aus 'zauber', 'wenn', 'bis', 'spruch' (Befehle gehen immer)
//   opt.bedingungen: erlaubte Bedingungen (Standard stein, frei)
//   opt.sprueche:    vorgegebene Sprüche { stern: '…' } (zählen nicht als Karten)
//   opt.spruchFrei:  ['stern'] Spruch, den das Kind selbst schreibt (zählt: 1 Karte + Inhalt); höchstens einer
//   opt.maxArbeit:   Rechen-Grenze (Standard 30 Millionen Schritte); darüber vollstaendig: false
// Ergebnis: { vollstaendig, erreichbar, minKarten, anzahlMin, kuerzeste: [{ programm, sprueche }], arbeit, grund }
//   Gezählt wird jede Kartenfolge (auch gespiegelte Wenn-Karten: wenn[stein: A sonst B] und wenn[frei: B sonst A]
//   sind zwei Lösungen). Programme mit mehr als 60 ausgeführten Befehlen zählen nicht.
// Verfahren: Breitensuche nach Kartenzahl über die Zustände (Feld, Blick, Edelsteine, Befehlszähler je Welt);
// gleiche Zustände mit gleicher Kartenzahl werden zusammengelegt (nur gezählt). Beschnitten wird:
// Stoß, mehr als 60 Befehle, Wenn-dann außerhalb eines Kastens bei einer Welt, wenn[c: X sonst X],
// Sprüche aus einem einzigen Befehl, Sprüche, die nie aufgerufen werden.
// ---------------------------------------------------------------------
export function mitRegeln(welten, maxKarten, erlaubt = [], opt = {}) {
  const liste = (Array.isArray(welten) ? welten : [welten]).map(baueWelt);
  const darf = new Set(erlaubt);
  for (const e of darf) if (!ERLAUBT_NAMEN.includes(e)) throw new Error('Unbekannt in erlaubt: „' + e + '“ (' + ERLAUBT_NAMEN.join(', ') + ')');
  const bed = darf.has('wenn') ? (opt.bedingungen || STANDARD_BEDINGUNGEN) : [];
  const fest = darf.has('spruch') ? K.liesSprueche(opt.sprueche || {}) : {};
  const frei = darf.has('spruch') ? (opt.spruchFrei || []) : [];
  const maxListe = opt.maxListe ?? 20;
  const maxArbeit = opt.maxArbeit ?? 30e6;
  let arbeit = 0;
  const zaehle = () => { if (++arbeit > maxArbeit) throw new ZuGross(); };
  const lauf = laeufer(zaehle);
  if (frei.length > 1) return { vollstaendig: false, erreichbar: null, grund: 'mehr als ein freier Zauberspruch', arbeit };
  const spFest = {};
  for (const [n, l] of Object.entries(fest)) spFest[n] = l.map(uebersetze);
  const nW = liste.length;
  const C = { s: 0, m: 0, n: 0, bis: 0, f: 0 };

  // Ein Durchlauf der Breitensuche mit festen Sprüchen sp; startKosten = Karten für den freien Spruch
  function suche(sp, rufe, startKosten, grenze, mussRufen) {
    const kasten = baukasten(darf, bed, rufe, false, nW > 1);
    const st0 = new Int32Array(nW * 3);
    liste.forEach((w, i) => { st0[3 * i] = w.start; });
    const schicht = new Map();
    schicht.set(startKosten, new Map([['0', { st: st0, ruf: 0, anz: 1, vor: [] }]]));
    for (let t = startKosten + 1; t <= grenze; t++) {
      const neu = new Map();
      for (let c = t - 1; c >= startKosten; c--) {
        const alt = schicht.get(c);
        if (!alt || !alt.size) continue;
        const knoten = Array.from(alt.values());
        kasten.teile(t - c, (teil, mult) => {
          const r = mussRufen && ruft(teil) ? 1 : 0;
          for (const kn of knoten) {
            const st = new Int32Array(nW * 3);
            let ok = true;
            for (let w = 0; w < nW && ok; w++) {
              C.s = kn.st[3 * w]; C.m = kn.st[3 * w + 1]; C.n = kn.st[3 * w + 2]; C.bis = 0; C.f = 0;
              lauf(liste[w], C, teil, sp);
              if (C.f) ok = false;
              else { st[3 * w] = C.s; st[3 * w + 1] = C.m; st[3 * w + 2] = C.n; }
            }
            zaehle();
            if (!ok) continue;
            const ru = kn.ruf | r;
            const key = st.join(',') + '|' + ru;
            let z = neu.get(key);
            if (!z) { z = { st, ruf: ru, anz: 0, vor: [] }; neu.set(key, z); }
            z.anz += kn.anz * mult;
            z.vor.push([kn, teil, mult]);
          }
        });
      }
      schicht.set(t, neu);
      const loes = [];
      for (const z of neu.values()) {
        if (mussRufen && !z.ruf) continue;
        let da = true;
        for (let w = 0; w < nW && da; w++) da = (z.st[3 * w] >> 2) === liste[w].ziel && z.st[3 * w + 1] === liste[w].voll;
        if (da) loes.push(z);
      }
      if (loes.length) {
        // Programme zurückverfolgen (höchstens maxListe)
        const progs = [];
        const rueck = (z, suffix) => {
          if (progs.length >= maxListe) return;
          if (!z.vor.length) { progs.push(suffix.slice().reverse().map(knotenText).join(' ')); return; }
          for (const [v, teil] of z.vor) { suffix.push(teil); rueck(v, suffix); suffix.pop(); if (progs.length >= maxListe) return; }
        };
        for (const z of loes) rueck(z, []);
        return { min: t, anzahl: loes.reduce((s, z) => s + z.anz, 0), programme: progs };
      }
    }
    return null;
  }

  try {
    const grenze = maxKarten;
    let best = null;
    let anzahl = 0;
    let kuerzeste = [];
    const nimm = (r, spText) => {
      if (!r) return;
      if (best === null || r.min < best) { best = r.min; anzahl = 0; kuerzeste = []; }
      if (r.min === best) {
        anzahl += r.anzahl;
        for (const p of r.programme) if (kuerzeste.length < maxListe) kuerzeste.push({ programm: p, sprueche: spText });
      }
    };
    // ohne den freien Spruch
    nimm(suche(spFest, Object.keys(spFest), 0, grenze, false), {});
    // mit dem freien Spruch: jeder mögliche Inhalt, aufsteigend nach Karten
    if (frei.length) {
      const name = frei[0];
      const kastenSp = baukasten(darf, bed, [], true, true);
      for (let kosten = 2; ; kosten++) {
        const obergrenze = best === null ? grenze : Math.min(grenze, best);
        if (1 + kosten + 1 > obergrenze) break;
        spruchKoerper(kastenSp, kosten, (koerper) => {
          const ob = best === null ? grenze : Math.min(grenze, best);
          if (1 + kosten + 1 > ob) return;
          const sp = Object.assign({}, spFest, { [name]: koerper });
          const r = suche(sp, Object.keys(spFest).concat([name]), 1 + kosten, ob, true);
          nimm(r, { [name]: koerper.map(knotenText).join(' ') });
        });
      }
    }
    if (best === null) return { vollstaendig: true, erreichbar: false, maxKarten, arbeit };
    // Gegenprobe mit dem Ausführer
    for (const p of kuerzeste) {
      const sp = Object.assign({}, opt.sprueche || {}, p.sprueche);
      for (const w of liste) {
        if (!K.ausfuehren(w.daten, p.programm, { sprueche: sp }).geschafft) throw new Error('Löser und Ausführer sind sich nicht einig bei ' + p.programm);
      }
      if (K.karten(p.programm, p.sprueche) !== best) throw new Error('Kartenzahl stimmt nicht bei ' + p.programm);
    }
    return { vollstaendig: true, erreichbar: true, minKarten: best, anzahlMin: anzahl, kuerzeste, maxKarten, arbeit };
  } catch (e) {
    if (e instanceof ZuGross) return { vollstaendig: false, erreichbar: null, grund: 'Suche zu groß (über ' + maxArbeit + ' Schritte)', arbeit };
    throw e;
  }
}

// Machen zwei Programme in jeder Welt genau dasselbe (gleiche Befehle, gleicher Stoß, gleiches Ende)?
export function gleichesVerhalten(welten, a, b, opt = {}) {
  for (const w of Array.isArray(welten) ? welten : [welten]) {
    const ea = K.ausfuehren(w, a, { sprueche: opt.spruecheA || opt.sprueche });
    const eb = K.ausfuehren(w, b, { sprueche: opt.spruecheB || opt.sprueche });
    const fa = ea.schritte.map((s) => s.befehl).join(' '), fb = eb.schritte.map((s) => s.befehl).join(' ');
    if (fa !== fb || !!ea.stoss !== !!eb.stoss || ea.zuLang !== eb.zuLang) return { gleich: false, a: fa, b: fb };
  }
  return { gleich: true };
}

// ---------------------------------------------------------------------
// Kobold-Programme mit Kästen und Zaubersprüchen
// Stellen (1-basiert): "3" = Teil 3 im Programm, "3.2" = 2. Teil im Zauber-Kasten 3,
//   "3.dann.1" / "3.sonst.1" = im Wenn-dann-Kasten 3, "3.2.sonst.1", "@stern.2" = 2. Teil im Stern-Spruch.
// Reparaturen: { art: 'tauschen', stelle, befehl }   (befehl: vor, links, rechts oder @stern …)
//              { art: 'loeschen', stelle }            (ein Befehl oder Aufruf fällt weg)
//              { art: 'einfuegen', stelle, befehl }   (danach steht der neue Befehl an der Stelle)
//              { art: 'bedingung', stelle, bedingung } (andere Wenn-Karte)
//              { art: 'zahl', stelle, wdh }            (anderes „n-mal“)
// ---------------------------------------------------------------------
function baumVon(programm, sprueche) {
  return { programm: K.lies(programm), sprueche: K.liesSprueche(sprueche || {}) };
}
function baumKopie(b) { return JSON.parse(JSON.stringify(b)); }
export function baumText(b) {
  return { programm: b.programm.map(K.teilText).join(' '), sprueche: Object.fromEntries(Object.entries(b.sprueche).map(([n, l]) => [n, l.map(K.teilText).join(' ')])) };
}
const baumSchluessel = (b) => JSON.stringify(baumText(b));

export function stelleFinden(baum, stelle) {
  const text = String(stelle).trim();
  const teile = text.split('.');
  let spruch = null;
  if (teile[0].charAt(0) === '@') spruch = teile.shift().slice(1);
  let l = spruch ? baum.sprueche[spruch] : baum.programm;
  if (!l) throw new Error('Stelle „' + text + '“: den Spruch gibt es nicht');
  let ort = spruch ? 'spruch' : 'programm';
  if (!teile.length) throw new Error('Stelle „' + text + '“: Nummer fehlt');
  let i = null;
  for (let j = 0; j < teile.length; j++) {
    if (!/^\d+$/.test(teile[j])) throw new Error('Stelle „' + text + '“: „' + teile[j] + '“ ist keine Nummer');
    i = parseInt(teile[j], 10) - 1;
    if (j === teile.length - 1) break;
    const t = l[i];
    if (!t || typeof t !== 'object' || t.spruch) throw new Error('Stelle „' + text + '“: an ' + teile.slice(0, j + 1).join('.') + ' steht kein Kasten');
    if (teile[j + 1] === 'dann' || teile[j + 1] === 'sonst') {
      if (!t.wenn) throw new Error('Stelle „' + text + '“: ' + teile.slice(0, j + 1).join('.') + ' ist kein Wenn-dann-Kasten');
      l = t[teile[j + 1]];
      ort = teile[j + 1];
      j++;
      if (j === teile.length - 1) throw new Error('Stelle „' + text + '“: nach „' + teile[j] + '“ fehlt die Nummer');
    } else {
      if (!t.befehle) throw new Error('Stelle „' + text + '“: ' + teile.slice(0, j + 1).join('.') + ' ist kein Zauber-Kasten');
      l = t.befehle;
      ort = 'kasten';
    }
  }
  return { liste: l, i, ort, imSpruch: !!spruch };
}
const alsTeil = (b) => (String(b).charAt(0) === '@' ? { spruch: String(b).slice(1) } : b);
const istBlatt = (t) => typeof t === 'string' || !!(t && t.spruch);

export function wendeReparaturAnBaum(baum, r) {
  const b = baumKopie(baum);
  const o = stelleFinden(b, r.stelle);
  if (r.art !== 'einfuegen' && (o.i < 0 || o.i >= o.liste.length)) throw new Error('Stelle ' + r.stelle + ' gibt es nicht');
  const t = o.liste[o.i];
  if (r.art === 'tauschen') {
    if (!istBlatt(t)) throw new Error('Stelle ' + r.stelle + ': tauschen geht nur bei Befehlen und Aufrufen');
    if (K.teilText(t) === String(r.befehl)) throw new Error('Tauschen gegen denselben Befehl');
    o.liste[o.i] = alsTeil(r.befehl);
  } else if (r.art === 'loeschen') {
    if (!istBlatt(t)) throw new Error('Stelle ' + r.stelle + ': streichen geht nur bei Befehlen und Aufrufen');
    o.liste.splice(o.i, 1);
  } else if (r.art === 'einfuegen') {
    if (o.i < 0 || o.i > o.liste.length) throw new Error('Stelle ' + r.stelle + ' gibt es nicht');
    o.liste.splice(o.i, 0, alsTeil(r.befehl));
  } else if (r.art === 'bedingung') {
    if (!t || !t.wenn) throw new Error('Stelle ' + r.stelle + ' ist kein Wenn-dann-Kasten');
    if (t.wenn === r.bedingung) throw new Error('Tauschen gegen dieselbe Wenn-Karte');
    t.wenn = r.bedingung;
  } else if (r.art === 'zahl') {
    if (!t || t.wdh === undefined) throw new Error('Stelle ' + r.stelle + ' ist kein Zauber-Kasten mit Zahl');
    if (t.wdh === r.wdh) throw new Error('Tauschen gegen dieselbe Zahl');
    t.wdh = r.wdh;
  } else throw new Error('Unbekannte Reparatur ' + r.art);
  // gültig nach den Regeln? (Größen der Kästen, Verschachtelung)
  return baumVon(b.programm, b.sprueche);
}

function alleOrte(baum) {
  const elemente = [], luecken = [];
  const geh = (l, praefix, ort, imSpruch) => {
    l.forEach((t, i) => {
      const st = praefix + (i + 1);
      elemente.push({ stelle: st, t, ort, imSpruch });
      if (t && t.wenn) { geh(t.dann, st + '.dann.', 'zweig', imSpruch); geh(t.sonst, st + '.sonst.', 'zweig', imSpruch); }
      else if (t && t.befehle) geh(t.befehle, st + '.', 'kasten', imSpruch);
    });
    for (let i = 0; i <= l.length; i++) luecken.push({ stelle: praefix + (i + 1), ort, imSpruch });
  };
  geh(baum.programm, '', 'programm', false);
  for (const [n, l] of Object.entries(baum.sprueche)) geh(l, '@' + n + '.', 'spruch', true);
  return { elemente, luecken };
}

export function alleReparaturenBaum(baum, opt = {}) {
  const bed = opt.bedingungen || K.BEDINGUNGEN;
  const rufe = (opt.rufe || Object.keys(baum.sprueche)).map((n) => '@' + n);
  const { elemente, luecken } = alleOrte(baum);
  const aus = [];
  for (const e of elemente) {
    const t = e.t;
    if (istBlatt(t)) {
      const jetzt = K.teilText(t);
      for (const b of K.BEFEHLE.concat(e.imSpruch ? [] : rufe)) if (b !== jetzt) aus.push({ art: 'tauschen', stelle: e.stelle, befehl: b });
      aus.push({ art: 'loeschen', stelle: e.stelle });
    } else if (t.wenn) {
      for (const c of bed) if (c !== t.wenn) aus.push({ art: 'bedingung', stelle: e.stelle, bedingung: c });
    } else if (t.wdh !== undefined) {
      for (let n = K.WDH_MIN; n <= K.WDH_MAX; n++) if (n !== t.wdh) aus.push({ art: 'zahl', stelle: e.stelle, wdh: n });
    }
  }
  for (const l of luecken) for (const b of K.BEFEHLE.concat(l.imSpruch ? [] : rufe)) aus.push({ art: 'einfuegen', stelle: l.stelle, befehl: b });
  return aus;
}

// Kobold-Programm mit Kästen/Sprüchen prüfen: kaputt kommt (in mindestens einer Welt) nicht an,
// die gemeinte Reparatur in allen; dazu alle anderen Ein-Karten-Reparaturen, die auch ankommen.
export function koboldErweitert(welten, programm, sprueche, reparatur, opt = {}) {
  const ws = Array.isArray(welten) ? welten : [welten];
  const baum = baumVon(programm, sprueche);
  const geschafft = (b) => ws.every((w) => K.ausfuehren(w, b.programm, { sprueche: b.sprueche }).geschafft);
  if (geschafft(baum)) throw new Error('Das Kobold-Programm kommt ohne Reparatur an');
  const gemeint = wendeReparaturAnBaum(baum, reparatur);
  if (!geschafft(gemeint)) throw new Error('Die gemeinte Reparatur kommt nicht an: ' + baumText(gemeint).programm);
  const gesehen = new Set([baumSchluessel(gemeint), baumSchluessel(baum)]);
  const auch = [];
  for (const r of alleReparaturenBaum(baum, opt)) {
    let neu;
    try { neu = wendeReparaturAnBaum(baum, r); } catch (e) { continue; }
    const s = baumSchluessel(neu);
    if (gesehen.has(s)) continue;
    gesehen.add(s);
    if (geschafft(neu)) auch.push({ reparatur: r, ...baumText(neu) });
  }
  // Stellen, deren Streichen bzw. Einfügen dasselbe Programm ergibt (z. B. in „vor vor vor“)
  const gleicheStellen = [];
  const ziel = baumSchluessel(gemeint);
  if (reparatur.art === 'loeschen' || reparatur.art === 'einfuegen') {
    const { elemente, luecken } = alleOrte(baum);
    for (const e of reparatur.art === 'loeschen' ? elemente : luecken) {
      let neu;
      try { neu = wendeReparaturAnBaum(baum, { ...reparatur, stelle: e.stelle }); } catch (x) { continue; }
      if (baumSchluessel(neu) === ziel) gleicheStellen.push(e.stelle);
    }
  }
  const kaputt = K.ausfuehren(ws[0], baum.programm, { sprueche: baum.sprueche });
  return {
    kaputt, kaputtWelten: ws.map((w) => K.ausfuehren(w, baum.programm, { sprueche: baum.sprueche }).geschafft),
    gemeint: baumText(gemeint), auch,
    gleicheStellen: gleicheStellen.length ? gleicheStellen : [String(reparatur.stelle)],
  };
}
