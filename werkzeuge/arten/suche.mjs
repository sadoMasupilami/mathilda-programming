// Rätselart „suche“ (Einheit 10, Sortieren und Suchen): prüfen und lösen
//
// Die gemeinsame Logik (Sortier-Netz laufen lassen, Nachbarn tauschen, Halbier-Suche,
// Zeichnungen) steht in web/kern/suche.js und ist dieselbe für Löser, Blätter und Web-App.
//
// Felder (raetsel/e10.json), immer "art": "suche" und "aufgabe":
//   netz         bahnen: 3, vergleiche: [[1, 2], [2, 3], [1, 2]], optional start: [7, 2, 5]
//                Zahlen durch das Sortier-Netz laufen lassen (Blatt und App).
//                optional "sortiertNicht": true für ein absichtlich kaputtes Netz
//   netzKobold   wie netz mit start und kobold: 2 (an Vergleichs-Stelle 2 geht die größere Zahl
//                zum kleinen Punkt). Auf dem Blatt stehen alle Zahlen, wie der Kobold sie gelegt hat.
//   netzFrage    wie netz ohne start, frage: "alleTauschen" (welche Reihenfolge von 1..n tauscht an
//                jeder Vergleichs-Stelle?) oder "keinTausch" (welche tauscht nie?)
//   tauschen     zahlen: [4, 1, 5, 2, 3], aussehen: "zahl" | "turm" (App: zwei Nachbarn antippen)
//   hoechstens   bis: 16. Wie viele Fragen braucht die Halbier-Suche für 1 bis 16 höchstens?
//   naechste     bis: 16, geheim: 11. Das ganze Spiel am Blatt: immer genau in der Mitte fragen.
//   frageKobold  bis: 16, geheim: 11, fragen: [8, 12, 9, 11, 10]. Genau eine Frage ist schlecht.
//   raten        bis: 16 (App: der Computer denkt sich eine Zahl, das Kind fragt)
//   Für alle: optional titel (kurzer Text für die App)
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10):
//   - Sortier-Netze werden mit ALLEN n! Reihenfolgen geprüft: Sie sortieren immer (oder, mit
//     sortiertNicht, absichtlich nicht; dann werden die Reihenfolgen genannt, die schiefgehen).
//   - netzKobold: Genau eine Vergleichs-Stelle hat falsch herum sortiert, am Ziel ist es nicht sortiert.
//   - netzFrage: Genau eine Reihenfolge passt.
//   - hoechstens: Die Halbier-Leiter (halbieren, bei ungerader Zahl die größere Hälfte, bis 1)
//     ergibt dieselbe Zahl wie der Spielbaum über alle Pläne (minimax): Mit keinem Plan geht
//     es im schlimmsten Fall mit weniger Fragen.
//   - naechste: Bei jeder Frage ist die Mitte eindeutig (gerade Anzahl übrig), die Antworten folgen
//     aus der geheimen Zahl, am Ende bleibt genau sie übrig.
//   - frageKobold: Genau eine der Fragen ist schlecht oder unnütz, alle anderen sind gut,
//     und nach der letzten Frage ist genau die geheime Zahl übrig.

import '../../web/kern/suche.js';

const S = globalThis.WerkstattSuche;
const AUFGABEN = ['netz', 'netzKobold', 'netzFrage', 'tauschen', 'hoechstens', 'naechste', 'frageKobold', 'raten'];
const APP = ['netz', 'tauschen', 'raten'];

// Spielbaum über alle Pläne: f[m] = wenigste Fragen, die im schlimmsten Fall reichen, wenn m Zahlen
// übrig sind. Eine Frage teilt m in k und m − k (1 ≤ k < m), dann geht es im größeren Teil weiter.
const MINIMAX = [0, 0];
function minimax(n) {
  for (let m = MINIMAX.length; m <= n; m++) {
    let best = Infinity;
    for (let k = 1; k < m; k++) {
      const w = 1 + Math.max(MINIMAX[k], MINIMAX[m - k]);
      if (w < best) best = w;
    }
    MINIMAX[m] = best;
  }
  return MINIMAX[n];
}

function netzGrund(r, F) {
  try { S.pruefeNetz(r.bahnen, r.vergleiche); } catch (e) { F(e.message); return false; }
  if (r.vergleiche.length > 12) { F('Höchstens 12 Vergleichs-Stellen (eine Seite)'); return false; }
  return true;
}
function startPruefen(r, F) {
  try { S.pruefeZahlen(r.start, r.bahnen, 'start'); } catch (e) { F(e.message); return false; }
  if (S.istSortiert(r.start)) F('start ist schon sortiert, da passiert nichts');
  return true;
}
function netzStatistik(r) {
  const alle = S.pruefeAlle(r.bahnen, r.vergleiche);
  const basis = Array.from({ length: r.bahnen }, (_, i) => i + 1);
  const proReihe = S.reihenfolgen(basis).map((p) => ({ p, t: S.laufen(r.bahnen, r.vergleiche, p).tausche }));
  const alleTauschen = proReihe.filter((x) => x.t === r.vergleiche.length).map((x) => x.p);
  const keinTausch = proReihe.filter((x) => x.t === 0).map((x) => x.p);
  return { alle, alleTauschen, keinTausch, meisteTausche: Math.max.apply(null, proReihe.map((x) => x.t)) };
}

function pruefe(r, F) {
  if (!AUFGABEN.includes(r.aufgabe)) { F('aufgabe muss ' + AUFGABEN.join(', ') + ' sein'); return null; }
  if (r.titel !== undefined && (typeof r.titel !== 'string' || r.titel.length > 40)) F('titel: kurzer Text (höchstens 40 Zeichen)');

  if (r.aufgabe === 'netz' || r.aufgabe === 'netzKobold' || r.aufgabe === 'netzFrage') {
    if (!netzGrund(r, F)) return null;
    const st = netzStatistik(r);
    const l = {
      bahnen: r.bahnen, vergleiche: r.vergleiche, zeilen: S.zeilen(r.bahnen, r.vergleiche),
      immer: st.alle.immer, reihenfolgen: st.alle.anzahl, nichtSortiert: st.alle.nichtSortiert.slice(0, 30),
      anzahlNichtSortiert: st.alle.nichtSortiert.length, alleTauschen: st.alleTauschen, keinTausch: st.keinTausch, meisteTausche: st.meisteTausche,
    };
    if (r.sortiertNicht) {
      if (r.aufgabe !== 'netz') F('sortiertNicht geht nur bei aufgabe netz');
      if (st.alle.immer) F('sortiertNicht gesetzt, aber das Netz sortiert alle ' + st.alle.anzahl + ' Reihenfolgen');
    } else if (!st.alle.immer) {
      F('Das Netz sortiert nicht immer: ' + st.alle.nichtSortiert.length + ' von ' + st.alle.anzahl + ' Reihenfolgen gehen schief, z. B. ' +
        st.alle.nichtSortiert.slice(0, 3).map((p) => p.join(' ')).join(' | ') + ' (absichtlich? "sortiertNicht": true)');
    }

    if (r.aufgabe === 'netz') {
      if (r.start !== undefined) {
        if (!startPruefen(r, F)) return l;
        const lauf = S.laufen(r.bahnen, r.vergleiche, r.start);
        Object.assign(l, { start: r.start.slice(), schritte: lauf.schritte, ende: lauf.ende, sortiert: lauf.sortiert, tausche: lauf.tausche, werte: S.werteAusLauf(r.bahnen, r.start, lauf) });
        if (!r.sortiertNicht && !lauf.sortiert) F('Am Ziel ist es nicht sortiert (Löser-Fehler?)');
      }
      return l;
    }

    if (r.aufgabe === 'netzKobold') {
      if (!startPruefen(r, F)) return l;
      if (!Number.isInteger(r.kobold) || r.kobold < 1 || r.kobold > r.vergleiche.length) { F('kobold: Nummer einer Vergleichs-Stelle (1 bis ' + r.vergleiche.length + ')'); return l; }
      const richtig = S.laufen(r.bahnen, r.vergleiche, r.start);
      const gezeigt = S.laufen(r.bahnen, r.vergleiche, r.start, r.kobold);
      // Prüfen wie das Kind: an welcher Vergleichs-Stelle steht die größere Zahl am kleinen Punkt?
      const falsch = gezeigt.schritte.filter((s) => s.raus[0] > s.raus[1]).map((s) => s.nr);
      if (falsch.length !== 1 || falsch[0] !== r.kobold) F('Genau eine Vergleichs-Stelle soll falsch sein, gefunden: ' + (falsch.join(', ') || 'keine'));
      if (gezeigt.sortiert) F('Am Ziel ist es trotz Kobold sortiert, man merkt nichts. Andere Vergleichs-Stelle oder andere Zahlen');
      const ks = gezeigt.schritte[r.kobold - 1];
      Object.assign(l, {
        start: r.start.slice(), kobold: r.kobold, stelle: { a: ks.a, b: ks.b, rein: ks.rein, raus: ks.raus, warGetauscht: ks.getauscht },
        gezeigt: S.werteAusLauf(r.bahnen, r.start, gezeigt), endeGezeigt: gezeigt.ende,
        richtig: S.werteAusLauf(r.bahnen, r.start, richtig), ende: richtig.ende, schritte: richtig.schritte,
      });
      return l;
    }

    // netzFrage
    const frage = r.frage;
    if (!['alleTauschen', 'keinTausch'].includes(frage)) { F('frage: alleTauschen oder keinTausch'); return l; }
    const treffer = frage === 'alleTauschen' ? st.alleTauschen : st.keinTausch;
    if (treffer.length !== 1) F(frage + ': ' + treffer.length + ' Reihenfolgen passen (genau eine erwartet)' + (treffer.length ? ': ' + treffer.map((p) => p.join(' ')).join(' | ') : ''));
    if (treffer.length) {
      const lauf = S.laufen(r.bahnen, r.vergleiche, treffer[0]);
      Object.assign(l, { frage, antwort: treffer[0], start: treffer[0], schritte: lauf.schritte, ende: lauf.ende, werte: S.werteAusLauf(r.bahnen, treffer[0], lauf) });
    }
    return l;
  }

  if (r.aufgabe === 'tauschen') {
    try { S.pruefeZahlen(r.zahlen, Array.isArray(r.zahlen) ? r.zahlen.length : 0, 'zahlen'); } catch (e) { F(e.message); return null; }
    if (r.zahlen.length < 3 || r.zahlen.length > 6) F('tauschen: 3 bis 6 Zahlen');
    const aussehen = r.aussehen || 'zahl';
    if (!['zahl', 'turm'].includes(aussehen)) F('aussehen: zahl oder turm');
    if (aussehen === 'turm' && r.zahlen.some((z) => z < 1 || z > 8)) F('Türme: 1 bis 8 Steine');
    if (S.istSortiert(r.zahlen)) F('zahlen sind schon sortiert');
    const weg = S.tauschWeg(r.zahlen);
    const fs = S.fehlstellen(r.zahlen);
    if (weg.length !== fs) F('Löser-Fehler: Tauschweg ' + weg.length + ', Fehlstellen ' + fs);
    let a = r.zahlen.slice();
    for (const i of weg) a = S.tausche(a, i);
    if (!S.istSortiert(a)) F('Löser-Fehler: Tauschweg sortiert nicht');
    return { zahlen: r.zahlen.slice(), aussehen, wenigsteTausche: fs, weg, ende: a };
  }

  // Halbier-Suche
  let bis;
  try { bis = S.pruefeBis(r.bis); } catch (e) { F(e.message); return null; }
  if (bis > 1000) F('bis höchstens 1000 (Spielbaum)');
  const h = S.hoechstens(bis);
  const leiter = S.leiter(bis);
  const mm = minimax(Math.min(bis, 1000));
  if (leiter.length - 1 !== h) F('Löser-Fehler: Halbier-Leiter hat ' + (leiter.length - 1) + ' Schritte, hoechstens sagt ' + h);
  if (mm !== h) F('Spielbaum sagt ' + mm + ' Fragen, Halbieren sagt ' + h);
  const l = { bis, fragen: h, leiter, minimax: mm, immerEinsMehr: bis - 1 };

  if (r.aufgabe === 'hoechstens' || r.aufgabe === 'raten') {
    if (r.aufgabe === 'raten' && bis > 100) F('raten in der App: höchstens bis 100');
    return l;
  }

  if (!Number.isInteger(r.geheim) || r.geheim < 1 || r.geheim > bis) { F('geheim: Zahl von 1 bis ' + bis); return l; }

  if (r.aufgabe === 'naechste') {
    const sp = S.spiel(bis, r.geheim);
    sp.schritte.forEach((s, i) => { if (!s.eindeutig) F('Frage ' + (i + 1) + ': Bei ' + s.von + ' bis ' + s.bis + ' gibt es zwei Mitten (' + S.mitten(s.von, s.bis).join(' und ') + '), nicht eindeutig'); });
    if (sp.gefunden !== r.geheim) F('Löser-Fehler: gefunden ' + sp.gefunden + ' statt ' + r.geheim);
    if (sp.fragen !== h) F('Das Spiel braucht ' + sp.fragen + ' Fragen, höchstens nötig sind ' + h);
    if (r.vorgegeben !== undefined && (!Number.isInteger(r.vorgegeben) || r.vorgegeben < 0 || r.vorgegeben >= sp.fragen)) F('vorgegeben: 0 bis ' + (sp.fragen - 1) + ' Fragen schon fertig');
    return Object.assign(l, { geheim: r.geheim, schritte: sp.schritte, gefunden: sp.gefunden, gebraucht: sp.fragen, vorgegeben: r.vorgegeben || 0 });
  }

  // frageKobold
  if (!Array.isArray(r.fragen) || r.fragen.length < 2 || !r.fragen.every(Number.isInteger)) { F('fragen: Liste von Zahlen'); return l; }
  const ns = S.nachspielen(bis, r.geheim, r.fragen);
  ns.schritte.forEach((s, i) => { if (s.von === s.bis) F('Frage ' + (i + 1) + ': Die Zahl war schon gefunden'); });
  if (ns.gefunden !== r.geheim) F('Nach der letzten Frage ist ' + (ns.gefunden === null ? 'noch mehr als eine Zahl übrig (' + ns.von + ' bis ' + ns.bis + ')' : 'die ' + ns.gefunden + ' übrig') + ', gemeint ist ' + r.geheim);
  const schlecht = ns.schritte.map((s, i) => ({ i: i + 1, art: s.art })).filter((s) => s.art !== 'gut');
  if (schlecht.length !== 1) F('Genau eine Frage soll schlecht sein, es sind ' + schlecht.length + ' (' + schlecht.map((s) => s.i + ': ' + s.art).join(', ') + ')');
  if (r.fragen.length <= h) F('Der Kobold braucht ' + r.fragen.length + ' Fragen, das sind nicht mehr als mit Halbieren (' + h + ')');
  return Object.assign(l, { geheim: r.geheim, schritte: ns.schritte, gebraucht: r.fragen.length, schlecht: schlecht.length ? schlecht[0].i : null, schlechtArt: schlecht.length ? schlecht[0].art : null });
}

function bericht(r) {
  const l = r.loesung || {};
  const zahlen = (a) => (a || []).join(' ');
  switch (r.aufgabe) {
    case 'netz': return 'netz ' + r.bahnen + ' Bahnen, ' + r.vergleiche.length + ' Vergleichs-Stellen, ' + (l.immer ? 'sortiert alle ' + l.reihenfolgen : 'sortiert ' + l.anzahlNichtSortiert + ' von ' + l.reihenfolgen + ' NICHT') +
      (l.start ? '; ' + zahlen(l.start) + ' → ' + zahlen(l.ende) + ' (' + l.tausche + '× getauscht)' : '');
    case 'netzKobold': return 'netzKobold: ' + zahlen(l.start) + ', Kobold an Stelle ' + l.kobold + ' → ' + zahlen(l.endeGezeigt) + ' (richtig ' + zahlen(l.ende) + ')';
    case 'netzFrage': return 'netzFrage ' + r.frage + ': ' + zahlen(l.antwort);
    case 'tauschen': return 'tauschen ' + zahlen(l.zahlen) + ': wenigstens ' + l.wenigsteTausche + ' Tausche';
    case 'hoechstens': return 'hoechstens 1–' + l.bis + ': ' + l.fragen + ' Fragen (Leiter ' + zahlen(l.leiter) + ', Spielbaum ' + l.minimax + ', immer 1 mehr: ' + l.immerEinsMehr + ')';
    case 'naechste': return 'naechste 1–' + l.bis + ', geheim ' + l.geheim + ': ' + (l.schritte || []).map((s) => '>' + s.x + (s.ja ? ' ja' : ' nein')).join(', ') + ' → ' + l.gefunden + ' (' + l.gebraucht + ' Fragen)';
    case 'frageKobold': return 'frageKobold 1–' + l.bis + ', geheim ' + l.geheim + ': ' + l.gebraucht + ' Fragen, schlecht ist Frage ' + l.schlecht + ' (' + l.schlechtArt + ')';
    case 'raten': return 'raten 1–' + l.bis + ': höchstens ' + l.fragen + ' Fragen';
    default: return '';
  }
}

// Für die App: nur die Aufgabe, nie die Lösung (die App rechnet mit web/kern/suche.js nach)
function fuerApp(r) {
  if (!APP.includes(r.aufgabe)) throw new Error('Level ' + r.id + ': aufgabe „' + r.aufgabe + '“ gibt es in der App nicht (' + APP.join(', ') + ')');
  const aus = { id: r.id, art: r.art, aufgabe: r.aufgabe };
  if (r.titel) aus.titel = r.titel;
  if (r.aufgabe === 'netz') {
    if (!r.start) throw new Error('Level ' + r.id + ': ein Sortier-Netz in der App braucht start');
    aus.bahnen = r.bahnen; aus.vergleiche = r.vergleiche.map((v) => v.slice()); aus.start = r.start.slice();
  }
  if (r.aufgabe === 'tauschen') { aus.zahlen = r.zahlen.slice(); aus.aussehen = r.aussehen || 'zahl'; }
  if (r.aufgabe === 'raten') aus.bis = r.bis;
  return aus;
}

export default { art: 'suche', pruefe, bericht, fuerApp };
