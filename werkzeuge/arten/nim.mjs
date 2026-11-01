// Rätselart „nim“: Strategiespiele (Einheit 15 „Gewinnen mit Plan“)
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10: „Strategiespiele: Die Gewinn-Strategie wird per Spielbaum bestätigt“):
// Für jede Stellung rechnet der Löser den ganzen Spielbaum aus (web/kern/nim.js, gewinnt): Wer gewinnt
// bei bestem Spiel beider, und mit welchen Zügen? Jede Aussage in den Rätsel-Daten wird damit geprüft.
//
// Ein Spiel: "spiel": { "form": "steine", "nehmen": [1, 2] }, "steine 1-3", "steine 1-2 verliert",
//            "steine beliebig" (zwei Haufen), "zaehlen 20 1-2" („Wer sagt 20?“)  – siehe web/kern/nim.js
// Stellung:  "haufen": [7] (oder [3, 5]) bzw. bei „Wer sagt …?“ "stand": 0 (zuletzt gesagte Zahl)
// Wer ist dran: "dran": "du" oder "andere" (am Blatt der Drache, in der App der Roboter)
//
// Aufgaben (r.aufgabe):
//   stellung      „Wer gewinnt hier?“ – "gewinner": "du"|"andere" (Pflicht). Optional "zug": { "nimm": 1 }
//                 (bei „Wer sagt …?“ "sag": 5 = bis zu welcher Zahl man zählt): muss der einzige Gewinnzug sein
//                 (sonst "mehrereLoesungen": true). Optional "gegner": "immer1"|"immer2" (fester Roboter statt
//                 bestem Spiel): dann wird geprüft, ob „du“ gegen diese Regel sicher gewinnt.
//   gewinnzahlen  "gewinnzahlen": [3, 6, 9] (Pflicht, aufsteigend) bis "bis" (Steine) bzw. bis zur Zielzahl.
//                 Optional "anfangen": "zuerst"|"zweiter" – wer gewinnt vom Start (Wer sagt …?: Stand 0;
//                 Steine: "start": 10 Steine).
//   regeln        Wenn-dann-Regeln "regeln": [{ "wenn": 4, "dann": 1 }, …]: Jede Regel muss der einzige Gewinnzug
//                 sein. "kobold": [3] = diese Regeln (Nummern ab 1) sind falsch (der Kobold hat sie geschrieben):
//                 Sie dürfen nicht gewinnen, der richtige Zug wird berechnet.
//   spiel         Ein Spiel gegen den Roboter (Web-Level und Blatt-Spielplan): "dran": "du"|"andere".
//                 „du“ muss bei bestem Spiel des Roboters sicher gewinnen können. "tipp" (Pflicht): freundlicher
//                 Hinweis für „Nochmal? Tipp: …“. Geprüft wird auch, dass der Roboter (web/kern/nim.js, roboterZug)
//                 in jeder erreichbaren Stellung einen Gewinnzug nimmt, wenn es einen gibt.
//   baum          Spielbaum zum Zeichnen (Anleitung): höchstens 40 Knoten.
// Lösung (r.loesung) für die Bausteine der Blätter: siehe die Rückgaben unten.
import '../../web/kern/nim.js';

const N = globalThis.WerkstattNim;
const AUFGABEN = ['stellung', 'gewinnzahlen', 'regeln', 'spiel', 'baum'];

function spielVon(r, F) {
  try { return N.lies(r.spiel); } catch (e) { F(e.message); return null; }
}
function stellungVon(v, r, F) {
  try { return N.stellung(v, r); } catch (e) { F(e.message); return null; }
}
function dranVon(r, F) {
  const d = r.dran || 'du';
  if (!['du', 'andere'].includes(d)) F('dran muss "du" oder "andere" sein');
  return d;
}
// Wer gewinnt bei bestem Spiel? (aus Sicht der Stellung, in der „dran“ am Zug ist)
function gewinnerVon(v, h, dran) {
  const dranGewinnt = N.gewinnt(v, h);
  return dranGewinnt ? dran : (dran === 'du' ? 'andere' : 'du');
}
// Ein Zug in Worten (für die Lösung): „nimm 2“, „aus Haufen 2: nimm 3“, „sag 3 und 4“
function zugText(v, h, z) {
  if (v.form === 'zaehlen') {
    const s = N.standVon(v, h);
    const zahlen = [];
    for (let i = 1; i <= z.nimm; i++) zahlen.push(s + i);
    return 'sag ' + (zahlen.length === 1 ? zahlen[0] : zahlen.slice(0, -1).join(', ') + ' und ' + zahlen[zahlen.length - 1]);
  }
  return (h.length > 1 ? 'aus Haufen ' + (z.haufen + 1) + ': ' : '') + 'nimm ' + z.nimm;
}
function gleicherZug(a, b) { return a.haufen === b.haufen && a.nimm === b.nimm; }
// "zug" aus den Daten: { nimm, haufen? } oder { sag } (Wer sagt …?)
function zugAusDaten(v, h, z, F) {
  if (!z || typeof z !== 'object') { F('zug: { "nimm": 1 } oder bei Wer sagt …? { "sag": 5 }'); return null; }
  if (v.form === 'zaehlen') {
    if (z.sag === undefined) { F('Bei „Wer sagt …?“ steht im zug "sag": bis zu welcher Zahl man zählt'); return null; }
    return { haufen: 0, nimm: z.sag - N.standVon(v, h) };
  }
  return { haufen: z.haufen ? z.haufen - 1 : 0, nimm: z.nimm };
}

// Der Roboter nimmt in jeder erreichbaren Stellung einen Gewinnzug, wenn es einen gibt
function pruefeRoboter(v, h, F) {
  const gesehen = new Set();
  const stapel = [h];
  let n = 0;
  while (stapel.length) {
    const x = stapel.pop();
    const k = x.join(',');
    if (gesehen.has(k) || N.istEnde(x)) continue;
    gesehen.add(k);
    if (++n > 5000) { F('Zu viele Stellungen zum Prüfen'); return; }
    const z = N.roboterZug(v, x);
    if (!N.zugOk(v, x, z)) { F('Roboter macht einen verbotenen Zug bei ' + k); return; }
    if (N.gewinnt(v, x) && N.gewinnt(v, N.nach(x, z))) { F('Roboter verschenkt den Sieg bei ' + k); return; }
    for (const y of N.zuege(v, x)) stapel.push(N.nach(x, y));
  }
}

function pruefeStellung(r, F, v, h) {
  const dran = dranVon(r, F);
  if (!['du', 'andere'].includes(r.gewinner)) return F('stellung braucht "gewinner": "du" oder "andere"');
  const gegner = r.gegner || 'gut';
  let gewinner;
  if (gegner === 'gut') gewinner = gewinnerVon(v, h, dran);
  else {
    try { gewinner = N.kannGewinnen(v, h, dran === 'du' ? 'du' : 'roboter', gegner) ? 'du' : 'andere'; } catch (e) { return F(e.message); }
  }
  if (gewinner !== r.gewinner) F('Der Spielbaum sagt: ' + (gewinner === 'du' ? 'du gewinnst' : 'der andere gewinnt') + ' (nicht ' + r.gewinner + ')' + (gegner !== 'gut' ? ' gegen die Regel ' + gegner : ''));
  const gz = N.gewinnZuege(v, h);
  const l = {
    spiel: v.text, haufen: h, stand: v.form === 'zaehlen' ? N.standVon(v, h) : null, dran, gegner, gewinner,
    dranGewinnt: N.gewinnt(v, h), gewinnZuege: gz, gewinnZuegeText: gz.map((z) => zugText(v, h, z)),
  };
  if (r.zug) {
    if (gegner !== 'gut') F('zug nur ohne gegner');
    const z = zugAusDaten(v, h, r.zug, F);
    if (z) {
      if (!N.zugOk(v, h, z)) F('zug ist nicht erlaubt: ' + JSON.stringify(r.zug));
      else if (!gz.some((y) => gleicherZug(y, z))) F('zug ' + zugText(v, h, z) + ' gewinnt nicht (Gewinnzüge: ' + (gz.map((y) => zugText(v, h, y)).join(', ') || 'keine') + ')');
      if (gz.length > 1 && !r.mehrereLoesungen) F('Es gibt ' + gz.length + ' Gewinnzüge (' + gz.map((y) => zugText(v, h, y)).join(', ') + '): "mehrereLoesungen": true');
      l.zug = z;
      l.zugText = zugText(v, h, z);
      l.nachher = N.nach(h, z);
    }
  }
  return l;
}

function pruefeGewinnzahlen(r, F, v) {
  if (!Array.isArray(r.gewinnzahlen)) return F('gewinnzahlen: [ … ] fehlt');
  const bis = v.form === 'zaehlen' ? v.bis : r.bis;
  if (v.form !== 'zaehlen' && !(bis >= 1 && bis <= N.MAX_HAUFEN)) return F('bis fehlt (größte Zahl der Liste)');
  let gz;
  try { gz = N.gewinnzahlen(v, bis); } catch (e) { return F(e.message); }
  if (gz.join(',') !== r.gewinnzahlen.join(',')) F('Gewinnzahlen laut Spielbaum: ' + gz.join(', ') + ' (in den Daten: ' + r.gewinnzahlen.join(', ') + ')');
  const l = { spiel: v.text, bis, gewinnzahlen: gz };
  if (v.form === 'zaehlen' || r.start) {
    const h = v.form === 'zaehlen' ? [v.bis] : [r.start];
    const ersterGewinnt = N.gewinnt(v, h);
    l.ersterGewinnt = ersterGewinnt;
    l.ersterZug = N.gewinnZuege(v, h).map((z) => zugText(v, h, z));
    if (r.anfangen && r.anfangen !== (ersterGewinnt ? 'zuerst' : 'zweiter')) F('anfangen: Der Spielbaum sagt, ' + (ersterGewinnt ? 'wer anfängt, gewinnt' : 'wer als Zweiter dran ist, gewinnt'));
  } else if (r.anfangen) F('anfangen braucht bei Steinen "start"');
  return l;
}

function pruefeRegeln(r, F, v) {
  if (!Array.isArray(r.regeln) || !r.regeln.length) return F('regeln: [{ "wenn": 4, "dann": 1 }, …] fehlt');
  const kobold = r.kobold || [];
  for (const k of kobold) if (!(k >= 1 && k <= r.regeln.length)) F('kobold: Regel ' + k + ' gibt es nicht');
  const aus = r.regeln.map((g, i) => {
    const nr = i + 1;
    const h = [g.wenn];
    if (!(g.wenn >= 1 && g.wenn <= N.MAX_HAUFEN)) { F('Regel ' + nr + ': wenn muss 1 bis ' + N.MAX_HAUFEN + ' sein'); return null; }
    const gz = N.gewinnZuege(v, h).map((z) => z.nimm);
    const z = { haufen: 0, nimm: g.dann };
    const erlaubt = N.zugOk(v, h, z);
    const gut = erlaubt && !N.gewinnt(v, N.nach(h, z));
    const falsch = kobold.includes(nr);
    if (!erlaubt) F('Regel ' + nr + ': „nimm ' + g.dann + '“ ist bei ' + g.wenn + ' Steinen nicht erlaubt');
    if (!gz.length) F('Regel ' + nr + ': Bei ' + g.wenn + ' Steinen gibt es keinen Gewinnzug (Gewinnzahl) – keine Regel dafür');
    if (falsch && gut) F('Regel ' + nr + ' soll vom Kobold sein, gewinnt aber');
    if (!falsch && !gut) F('Regel ' + nr + ': „Wenn ' + g.wenn + ', nimm ' + g.dann + '“ gewinnt nicht (richtig: nimm ' + gz.join(' oder ') + ')');
    if (gz.length > 1 && !r.mehrereLoesungen) F('Regel ' + nr + ': mehrere Gewinnzüge (' + gz.join(', ') + ')');
    return { wenn: g.wenn, dann: g.dann, vorgabe: !!g.vorgabe, gut, kobold: falsch, richtig: gz, bleiben: g.wenn - (gz[0] || 0) };
  });
  if (r.kobold && !kobold.length) F('kobold: [] ist leer');
  return { spiel: v.text, regeln: aus };
}

function pruefeSpiel(r, F, v, h) {
  const dran = dranVon(r, F);
  if (!r.tipp || typeof r.tipp !== 'string') F('spiel braucht "tipp" (für „Nochmal? Tipp: …“)');
  else if (r.tipp.length > 110) F('tipp ist zu lang für das Handy (höchstens 110 Zeichen)');
  const gewinner = gewinnerVon(v, h, dran);
  if (gewinner !== 'du') F('Hier kann „du“ nicht sicher gewinnen – der Roboter gewinnt bei gutem Spiel. Stellung ändern.');
  pruefeRoboter(v, h, F);
  const p = N.partie(v, h, dran === 'du' ? 'du' : 'roboter');
  if (p.sieger !== 'du') F('Beispiel-Partie geht verloren (Löser-Fehler?)');
  const duZuege = p.zuege.filter((x) => x.wer === 'du').length;
  if (duZuege < 2 && !r.kurz) F('„du“ gewinnt schon mit einem Zug – zu leicht für ein Spiel (sonst "kurz": true)');
  const l = {
    spiel: v.text, haufen: h, stand: v.form === 'zaehlen' ? N.standVon(v, h) : null, dran, gewinner,
    gewinnZuege: dran === 'du' ? N.gewinnZuege(v, h) : [],
    gewinnZuegeText: dran === 'du' ? N.gewinnZuege(v, h).map((z) => zugText(v, h, z)) : [],
    partie: p.zuege.map((x, i) => ({ wer: x.wer, zug: x.zug, nachher: x.nachher, text: zugText(v, i === 0 ? h : p.zuege[i - 1].nachher, x.zug) })),
  };
  if (h.length === 1) {
    const bis = v.form === 'zaehlen' ? v.bis : h[0];
    l.gewinnzahlen = N.gewinnzahlen(v, bis);
  }
  if (r.gewinnzahlen && (!l.gewinnzahlen || l.gewinnzahlen.join(',') !== r.gewinnzahlen.join(','))) F('gewinnzahlen laut Spielbaum: ' + (l.gewinnzahlen || []).join(', '));
  return l;
}

function pruefeBaum(r, F, v, h) {
  try {
    const b = N.baum(v, h, 40);
    return { spiel: v.text, haufen: h, knoten: b.knoten, dranGewinnt: N.gewinnt(v, h) };
  } catch (e) { return F(e.message); }
}

export default {
  art: 'nim',
  pruefe(r, F) {
    const aufgabe = r.aufgabe;
    if (!AUFGABEN.includes(aufgabe)) return F('aufgabe muss ' + AUFGABEN.join(', ') + ' sein');
    const v = spielVon(r, F);
    if (!v) return null;
    if (aufgabe === 'gewinnzahlen') return pruefeGewinnzahlen(r, F, v);
    if (aufgabe === 'regeln') {
      if (v.form !== 'steine' || v.nehmen === 'beliebig') return F('regeln nur beim Steine-Spiel mit einem Haufen');
      return pruefeRegeln(r, F, v);
    }
    const h = stellungVon(v, r, F);
    if (!h) return null;
    if (aufgabe === 'stellung') return pruefeStellung(r, F, v, h);
    if (aufgabe === 'spiel') return pruefeSpiel(r, F, v, h);
    return pruefeBaum(r, F, v, h);
  },
  bericht(r) {
    const l = r.loesung || {};
    if (r.aufgabe === 'stellung') return l.spiel + ' [' + (l.stand !== null ? 'Stand ' + l.stand : (l.haufen || []).join('|')) + '] dran ' + l.dran + ' → ' + l.gewinner + (l.zugText ? ' (' + l.zugText + ')' : '') + (l.gegner !== 'gut' ? ' gegen ' + l.gegner : '');
    if (r.aufgabe === 'gewinnzahlen') return l.spiel + ': Gewinnzahlen ' + (l.gewinnzahlen || []).join(' ') + (l.ersterGewinnt !== undefined ? ', wer anfängt ' + (l.ersterGewinnt ? 'gewinnt (' + l.ersterZug.join(', ') + ')' : 'verliert') : '');
    if (r.aufgabe === 'regeln') return (l.regeln || []).map((g) => g.wenn + '→' + g.dann + (g.gut ? '' : '✗(' + g.richtig.join('/') + ')')).join(' ');
    if (r.aufgabe === 'spiel') return l.spiel + ' [' + (l.stand !== null ? 'Stand ' + l.stand : (l.haufen || []).join('|')) + '] dran ' + l.dran + ': ' + (l.partie || []).map((p) => (p.wer === 'du' ? 'D:' : 'R:') + p.zug.nimm).join(' ');
    if (r.aufgabe === 'baum') return l.spiel + ' [' + (l.haufen || []).join('|') + '] ' + l.knoten + ' Knoten';
    return '';
  },
  // Die App bekommt nur das Spiel, die Stellung, wer anfängt, den Tipp – nie die Gewinnzüge
  fuerApp(r) {
    const v = N.lies(r.spiel);
    const aus = { id: r.id, art: 'nim', aufgabe: r.aufgabe, spiel: { form: v.form, nehmen: v.nehmen, letzter: v.letzter }, dran: r.dran || 'du' };
    if (v.form === 'zaehlen') { aus.spiel.bis = v.bis; aus.stand = r.stand || 0; } else aus.haufen = N.stellung(v, r);
    for (const f of ['titel', 'text', 'tipp']) if (r[f]) aus[f] = r[f];
    return aus;
  },
};
