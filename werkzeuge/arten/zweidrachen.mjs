// Rätselart „zweidrachen“: zwei Drachen im selben Gitter (Einheit 19 „Großer Roboter-Parcours“, Extra X1)
//
// Regeln (stehen so in der Anleitung von Einheit 19):
//   - Beide Drachen führen ihr Programm gleichzeitig aus, Befehl für Befehl im Takt: In Takt 1 macht jeder
//     seinen ersten ausgeführten Befehl (vor, links drehen, rechts drehen), in Takt 2 den zweiten usw.
//     Zauber-Kasten, Wenn-dann-Kasten, „bis zum Schatz“ und Zaubersprüche zählen wie immer nur die
//     ausgeführten Befehle (web/kern/ausfuehrer.js, schritte). Eine Wenn-Karte kostet keinen Takt.
//   - Ist ein Programm zu Ende, bleibt der Drache in seinem Feld stehen (und steht dort den anderen im Weg).
//   - Zusammenstoß: Nach einem Takt stehen beide im selben Feld. Tauschen beide in einem Takt genau ihre
//     Felder (sie laufen ineinander), ist das auch ein Zusammenstoß; in den Rätseln soll das nicht der
//     erste Zusammenstoß sein (sonst Fehler), damit die Frage „Wo stoßen sie zusammen?“ ein Feld hat.
//   - Der andere Drache ist kein Stein: Wenn-Karten schauen nur auf Steine und den Rand.
//   - Jeder Drache hat sein eigenes Ziel (der grüne meist den Schatz, der blaue den Stern: "zielSymbol").
//
// Daten:  { "id", "art": "zweidrachen", "aufgabe", "b", "h", "hindernisse",
//           "drachen": [ { "farbe": "gruen", "start": {…}, "ziel": {…}, "zielSymbol": "schatz",
//                          "programm": "…", "sprueche": {…} },
//                        { "farbe": "blau", … } ] }
//
// Aufgaben:
//   zusammenstoss  beide Programme gegeben: Sie müssen zusammenstoßen (erster Zusammenstoß im selben Feld).
//                  Lösung: stoss = { takt, x, y, blick: [grün, blau] }. Kein Drache darf vorher anstoßen
//                  (Stein, Rand) oder im Kreis laufen.
//   ohne           beide Programme gegeben: kein Zusammenstoß, und jeder Drache mit Ziel kommt an.
//   planen         Drache 1 hat ein Programm, Drache 2 nur Start und Ziel. Gesucht: das kürzeste Programm aus
//                  Befehlen (vor, links, rechts) für Drache 2, mit dem er ankommt, ohne je mit Drache 1
//                  zusammenzustoßen (auch nicht, wenn er schon steht und Drache 1 noch läuft). Gezählt werden alle
//                  kürzesten; bei mehr als einem nur mit "mehrereLoesungen": true. Optional "beispiel"
//                  (Programm für Drache 2, wird geprüft) und "maxBefehle" (Standard 12).
//                  Dazu: das kürzeste Programm ohne den anderen Drachen und wo es zusammenstößt (für die Lösung).
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10): Beide Programme werden mit demselben Ausführer wie in der App
// Schritt für Schritt ausgeführt (K.ausfuehren) und Takt für Takt verglichen; bei „planen“ sucht eine
// Breitensuche über Feld, Blickrichtung und Takt alle kürzesten Programme.

const FARBEN = ['gruen', 'blau'];
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const RICHT = ['oben', 'rechts', 'unten', 'links'];
const MAX_BEFEHLE = 12;

function weltVon(r, d) {
  const w = { b: r.b, h: r.h, start: d.start, hindernisse: r.hindernisse || [] };
  if (d.ziel) w.ziel = d.ziel;
  if (d.zielSymbol) w.zielSymbol = d.zielSymbol;
  return w;
}
const gleich = (a, b) => a.x === b.x && a.y === b.y;

// Ein Drache allein: Stand nach jedem Takt (Takt 0 = Start). Danach bleibt er stehen.
function lauf(K, r, d, i, F) {
  const w = weltVon(r, d);
  let e;
  try { e = K.ausfuehren(w, d.programm, { sprueche: d.sprueche || {} }); } catch (x) { F('Drache ' + (i + 1) + ': ' + x.message); return null; }
  const s0 = w.start;
  const staende = [{ x: s0.x, y: s0.y, blick: s0.blick || 'oben' }].concat(e.schritte.map((s) => s.nachher));
  return { e, staende, takte: e.schritte.length, karten: K.karten(d.programm, d.sprueche || {}), programm: K.alsText(d.programm) };
}
const standBei = (l, t) => l.staende[Math.min(t, l.staende.length - 1)];

// Erster Zusammenstoß zweier Läufe (oder null)
function ersterStoss(a, b) {
  const T = Math.max(a.staende.length, b.staende.length) - 1;
  for (let t = 1; t <= T; t++) {
    const pa = standBei(a, t), pb = standBei(b, t);
    if (gleich(pa, pb)) return { takt: t, art: 'feld', x: pa.x, y: pa.y, blick: [pa.blick, pb.blick] };
    const va = standBei(a, t - 1), vb = standBei(b, t - 1);
    if (gleich(pa, vb) && gleich(pb, va) && !gleich(pa, va)) return { takt: t, art: 'tausch', x: pa.x, y: pa.y, blick: [pa.blick, pb.blick] };
  }
  return null;
}

// Breitensuche: kürzeste Programme für Drache 2, ohne mit Drache 1 (fester Lauf a) zusammenzustoßen
function planen(K, r, a, d2, maxL) {
  const W = K.welt(weltVon(r, d2));
  const z = d2.ziel;
  const T0 = a.staende.length - 1;
  const A = (t) => standBei(a, t);
  // nach dem Ankommen in Feld f zum Takt t: läuft Drache 1 später noch hinein?
  const ruhigAb = (f, t) => { for (let u = t + 1; u <= T0; u++) if (gleich(A(u), f)) return false; return true; };
  const key = (s) => s.x + ',' + s.y + ',' + s.r;
  let ebene = new Map([[key(W.start), { s: W.start, n: 1, von: [] }]]);
  const ebenen = [ebene];
  for (let t = 0; t <= maxL; t++) {
    // Ziel erreicht in Takt t?
    const ziele = [...ebene.values()].filter((k) => k.s.x === z.x && k.s.y === z.y && ruhigAb(k.s, t));
    if (ziele.length && t > 0) {
      const anzahl = ziele.reduce((s, k) => s + k.n, 0);
      // Programme aufzählen (rückwärts), höchstens 50
      const progs = [];
      const zurueck = (k, tt, rest) => {
        if (progs.length >= 50) return;
        if (tt === 0) { progs.push(rest.slice().reverse()); return; }
        for (const [vk, bef] of k.von) { rest.push(bef); zurueck(ebenen[tt - 1].get(vk), tt - 1, rest); rest.pop(); }
      };
      for (const k of ziele) zurueck(k, t, []);
      return { laenge: t, anzahl, programme: progs };
    }
    if (t === maxL) break;
    const neu = new Map();
    for (const [k, v] of ebene) {
      for (const bef of K.BEFEHLE) {
        const n = K.schritt(W, v.s, bef);
        if (n.stoss) continue;
        const pa0 = A(t), pa1 = A(t + 1);
        if (gleich(n, pa1)) continue;                                   // selbes Feld
        if (gleich(n, pa0) && gleich(pa1, v.s) && !gleich(n, v.s)) continue;  // Tausch
        const nk = key(n);
        if (!neu.has(nk)) neu.set(nk, { s: n, n: 0, von: [] });
        const e = neu.get(nk);
        e.n += v.n;
        e.von.push([k, bef]);
      }
    }
    ebene = neu;
    ebenen.push(ebene);
    if (!ebene.size) break;
  }
  return null;
}

export default {
  art: 'zweidrachen',
  pruefe(r, F, ctx) {
    const K = ctx.K;
    const aufgabe = r.aufgabe;
    if (!['zusammenstoss', 'ohne', 'planen'].includes(aufgabe)) return F('aufgabe: zusammenstoss, ohne oder planen');
    if (!Array.isArray(r.drachen) || r.drachen.length !== 2) return F('"drachen" muss genau 2 Drachen haben');
    for (const [i, d] of r.drachen.entries()) {
      if (d.farbe !== FARBEN[i]) F('Drache ' + (i + 1) + ': farbe muss „' + FARBEN[i] + '“ sein (1 grün, 2 blau)');
      try { K.welt(weltVon(r, d)); } catch (e) { return F('Drache ' + (i + 1) + ': ' + e.message); }
    }
    const [d1, d2] = r.drachen;
    if (gleich(d1.start, d2.start)) return F('Beide Drachen starten im selben Feld');
    if (d1.ziel && d2.ziel && gleich(d1.ziel, d2.ziel)) F('Beide Drachen haben dasselbe Ziel');
    for (const [i, d] of r.drachen.entries()) {
      const o = r.drachen[1 - i];
      if (d.ziel && gleich(d.ziel, o.start)) F('Das Ziel von Drache ' + (i + 1) + ' liegt auf dem Startfeld des anderen');
    }
    if (!d1.programm) return F('Drache 1 braucht ein programm');
    const a = lauf(K, r, d1, 0, F);
    if (!a) return null;
    const pruefeLauf = (l, i, d) => {
      if (l.e.stoss) F('Drache ' + (i + 1) + ' stößt an (Befehl ' + (l.e.stoss.nr + 1) + ')');
      if (l.e.zuLang) F('Drache ' + (i + 1) + ' läuft im Kreis');
      if (K.karten(d.programm, d.sprueche || {}) > MAX_BEFEHLE) F('Drache ' + (i + 1) + ': mehr als ' + MAX_BEFEHLE + ' Karten');
    };
    pruefeLauf(a, 0, d1);
    const aus = { aufgabe, drachen: [{ programm: a.programm, takte: a.takte, karten: a.karten, staende: a.staende, geschafft: a.e.geschafft, ende: a.e.ende }] };
    if (aufgabe === 'planen') {
      if (d2.programm) return F('Bei „planen“ hat Drache 2 kein programm (das schreibt das Kind)');
      if (!d2.ziel) return F('Drache 2 braucht ein Ziel');
      if (d1.ziel && !a.e.geschafft) F('Drache 1 kommt mit seinem Programm nicht an');
      const maxL = r.maxBefehle ?? MAX_BEFEHLE;
      const p = planen(K, r, a, d2, maxL);
      if (!p) return F('Drache 2 kommt mit höchstens ' + maxL + ' Befehlen nicht ohne Zusammenstoß an');
      if (p.anzahl > 1 && !r.mehrereLoesungen) F('Es gibt ' + p.anzahl + ' kürzeste Programme (' + p.laenge + ' Befehle) für Drache 2, z. B. ' + p.programme.slice(0, 4).map((x) => x.join(' ')).join(' | ') + '. Rätsel ändern oder "mehrereLoesungen": true');
      if (p.anzahl === 1 && r.mehrereLoesungen) F('„mehrereLoesungen“ gesetzt, aber es gibt genau ein kürzestes Programm');
      // Ohne den anderen Drachen: kürzeste Programme und ob sie zusammenstoßen
      const k = ctx.LOESER.kuerzeste(weltVon(r, d2));
      const ohne = k.programme.map((pr) => {
        const l = lauf(K, r, { ...d2, programm: pr.join(' ') }, 1, F);
        return { programm: pr.join(' '), stoss: l ? ersterStoss(a, l) : null };
      });
      aus.planen = { laenge: p.laenge, anzahl: p.anzahl, programme: p.programme.map((x) => x.join(' ')), ohneAnderen: { laenge: k.laenge, anzahl: k.anzahl, programme: ohne } };
      if (ohne.every((o) => !o.stoss)) F('Ohne den anderen Drachen stößt kein kürzestes Programm zusammen: Die Aufgabe ist zu leicht (der andere Drache stört nicht)');
      const bsp = r.beispiel || aus.planen.programme[0];
      const l = lauf(K, r, { ...d2, programm: bsp }, 1, F);
      if (l) {
        pruefeLauf(l, 1, { programm: bsp });
        if (!l.e.geschafft) F('Das Beispiel für Drache 2 kommt nicht an');
        const s = ersterStoss(a, l);
        if (s) F('Das Beispiel für Drache 2 stößt in Takt ' + s.takt + ' zusammen');
        if (r.beispiel && l.takte !== p.laenge) F('Das Beispiel hat ' + l.takte + ' Befehle, das kürzeste nur ' + p.laenge);
        aus.drachen.push({ programm: l.programm, takte: l.takte, karten: l.karten, staende: l.staende, geschafft: l.e.geschafft, ende: l.e.ende });
      }
      return aus;
    }
    if (!d2.programm) return F('Drache 2 braucht ein programm');
    const b = lauf(K, r, d2, 1, F);
    if (!b) return null;
    pruefeLauf(b, 1, d2);
    aus.drachen.push({ programm: b.programm, takte: b.takte, karten: b.karten, staende: b.staende, geschafft: b.e.geschafft, ende: b.e.ende });
    const s = ersterStoss(a, b);
    aus.stoss = s;
    if (aufgabe === 'zusammenstoss') {
      if (!s) F('Die Drachen stoßen nicht zusammen');
      else if (s.art === 'tausch') F('Der erste Zusammenstoß ist ein Tausch (Takt ' + s.takt + '): Das ist am Blatt schwer zu sehen, bitte ändern');
      // vor dem Zusammenstoß darf keiner anstoßen
    } else if (aufgabe === 'ohne') {
      if (s) F('Die Drachen stoßen in Takt ' + s.takt + ' zusammen (' + s.art + ')');
      for (const [i, d] of r.drachen.entries()) if (d.ziel && !aus.drachen[i].geschafft) F('Drache ' + (i + 1) + ' kommt nicht an');
    }
    return aus;
  },
  bericht(r) {
    const l = r.loesung || {};
    const p = (l.drachen || []).map((d) => d.programm + ' (' + d.takte + ' Takte)').join(' / ');
    if (l.aufgabe === 'planen' && l.planen) return 'grün ' + p.split(' / ')[0] + '; blau kürzest ' + l.planen.laenge + ' Befehle, ' + l.planen.anzahl + '×: ' + l.planen.programme.slice(0, 3).join(' | ') + '; ohne Grün ' + l.planen.ohneAnderen.laenge + ' (' + l.planen.ohneAnderen.programme.map((o) => o.programm + (o.stoss ? ' stößt T' + o.stoss.takt : ' frei')).join(', ') + ')';
    if (l.stoss) return p + '; Zusammenstoß Takt ' + l.stoss.takt + ' in ' + l.stoss.x + ',' + l.stoss.y + ' (' + l.stoss.art + ')';
    return p + '; kein Zusammenstoß';
  },
  fuerApp(r) {
    const { loesung, paket, ...rest } = r;
    void loesung; void paket;
    return rest;
  },
};
