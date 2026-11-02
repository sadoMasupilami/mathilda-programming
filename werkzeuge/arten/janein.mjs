// Rätselart „janein“ (Einheit 9, Nur Ja oder Nein): prüfen und lösen
//
// Die gemeinsame Logik (Karten 16, 8, 4, 2, 1, Zerlegen, Bewerten, Zeichnungen) steht in
// web/kern/janein.js und ist dieselbe für Löser, Blätter und Web-App.
//
// Felder (raetsel/e9.json), immer "art": "janein" und "aufgabe":
//   lesen   ja: [16, 4, 1] (die Ja-Karten), optional zahl (muss stimmen), optional wahl: [12, 13, 15]
//           (Antworten zum Antippen in der App: verschieden, genau eine richtig)
//           Welche Zahl zeigen die Karten (Lampen, Finger, Nullen und Einsen)?
//   legen   zahl: 13. Lege die Zahl (Karten ankreuzen, Lampen anschalten, Finger heben, Nullen und Einsen schreiben)
//   kobold  zahl: 19 (gemeint), ja: [16, 4, 2, 1] (so liegt es, genau eine Karte falsch)
//   Für alle: anzahl (Karten, 3 bis 6, Standard 5), aussehen: karten (Standard) | lampen | finger | ziffern
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10):
//   - lesen: Summe der Ja-Karten (und nur Karten, die es gibt, jede höchstens einmal); in der App
//     ist genau eine Antwort richtig
//   - legen: Die Zahl hat genau eine Ja/Nein-Schreibweise (alle 2^n Möglichkeiten durchprobiert)
//   - kobold: Genau eine Karte liegt falsch, und genau eine Karte umdrehen repariert es
//   - finger: kein Bild mit nur dem Mittelfinger (die 4 als Hand wird vermieden)

import '../../web/kern/janein.js';

const J = globalThis.WerkstattJaNein;
const AUFGABEN = ['lesen', 'legen', 'kobold'];

function grund(r, F) {
  if (!AUFGABEN.includes(r.aufgabe)) { F('aufgabe muss ' + AUFGABEN.join(', ') + ' sein'); return null; }
  let n;
  try { n = J.anzahl(r.anzahl); } catch (e) { F(e.message); return null; }
  const aussehen = r.aussehen || 'karten';
  if (!J.AUSSEHEN.includes(aussehen)) { F('aussehen: ' + J.AUSSEHEN.join(', ')); return null; }
  if (aussehen === 'finger' && n !== 5) F('Finger gehen nur mit 5 Karten (eine Hand)');
  return { n, aussehen };
}
function jaLesen(r, F, n) {
  try { return J.jaAusWerten(r.ja, n); } catch (e) { F('ja: ' + e.message); return null; }
}
function nurMittelfinger(ja, aussehen) {
  return aussehen === 'finger' && J.ziffern(ja) === '00100';
}
function loesungVon(ja, n) {
  return { zahl: J.wert(ja, n), ja, jaWerte: J.jaWerte(ja, n), rechnung: J.rechnung(ja, n), ziffern: J.ziffern(ja), sprechen: J.sprechen(ja, n) };
}

function pruefe(r, F) {
  const g = grund(r, F);
  if (!g) return null;
  const { n, aussehen } = g;
  const l = { anzahl: n, aussehen, werte: J.werte(n) };

  if (r.aufgabe === 'lesen') {
    const ja = jaLesen(r, F, n);
    if (!ja) return null;
    Object.assign(l, loesungVon(ja, n));
    if (r.zahl !== undefined && r.zahl !== l.zahl) F('Die Karten ' + l.rechnung + ' zeigen ' + l.zahl + ', nicht ' + r.zahl);
    if (nurMittelfinger(ja, aussehen)) F('Hand mit nur dem Mittelfinger: bitte eine andere Zahl');
    if (r.wahl !== undefined) {
      if (!Array.isArray(r.wahl) || r.wahl.length < 2 || r.wahl.length > 4) F('wahl: 2 bis 4 Zahlen');
      else {
        if (new Set(r.wahl).size !== r.wahl.length) F('wahl: Zahlen doppelt');
        for (const z of r.wahl) if (!Number.isInteger(z) || z < 0 || z > J.groesste(n)) F('wahl: ' + z + ' geht mit ' + n + ' Karten nicht (0 bis ' + J.groesste(n) + ')');
        const richtig = r.wahl.filter((z) => z === l.zahl);
        if (richtig.length !== 1) F('wahl: genau eine Zahl muss stimmen (' + l.zahl + ')');
      }
    }
    return l;
  }

  if (r.aufgabe === 'legen') {
    if (r.ja !== undefined) F('legen: keine ja-Karten angeben (die legt das Kind)');
    try { J.pruefeZahl(r.zahl, n); } catch (e) { F(e.message); return null; }
    const alle = J.alleSchreibweisen(r.zahl, n);
    if (alle.length !== 1) F('Die Zahl ' + r.zahl + ' hat ' + alle.length + ' Schreibweisen (genau eine erwartet)');
    const ja = J.zerlege(r.zahl, n);
    if (J.ziffern(alle[0] || []) !== J.ziffern(ja)) F('Größte Karte zuerst ergibt eine andere Schreibweise als das Durchprobieren');
    if (nurMittelfinger(ja, aussehen)) F('Hand mit nur dem Mittelfinger: bitte eine andere Zahl');
    Object.assign(l, loesungVon(ja, n), { schreibweisen: alle.length });
    if (r.zahl === 0) F('legen: 0 ist als Aufgabe zu leicht (alle Karten weg)');
    return l;
  }

  // kobold
  const gezeigt = jaLesen(r, F, n);
  if (!gezeigt) return null;
  try { J.pruefeZahl(r.zahl, n); } catch (e) { F(e.message); return null; }
  const k = J.kobold(r.zahl, gezeigt, n);
  if (k.falsch.length !== 1) F('Kobold: genau eine Karte soll falsch liegen, es sind ' + k.falsch.length);
  if (k.umdrehen.length !== 1 || k.umdrehen[0] !== k.falsch[0]) F('Kobold: genau eine Karte umdrehen soll es reparieren (gefunden: ' + k.umdrehen.length + ')');
  if (nurMittelfinger(gezeigt, aussehen) || nurMittelfinger(k.richtig, aussehen)) F('Hand mit nur dem Mittelfinger: bitte eine andere Zahl');
  const i = k.falsch[0];
  Object.assign(l, {
    zahl: r.zahl,
    gezeigt: k.gezeigt,
    gezeigtJa: gezeigt,
    rechnungGezeigt: J.rechnung(gezeigt, n),
    falsch: i,
    falschWert: J.werte(n)[i],
    art: gezeigt[i] ? 'zuviel' : 'fehlt',
    ja: k.richtig,
    jaWerte: J.jaWerte(k.richtig, n),
    rechnung: J.rechnung(k.richtig, n),
  });
  return l;
}

function bericht(r) {
  const l = r.loesung || {};
  const a = (l.aussehen && l.aussehen !== 'karten' ? ' [' + l.aussehen + ']' : '') + (l.anzahl && l.anzahl !== 5 ? ' (' + l.anzahl + ' Karten)' : '');
  if (r.aufgabe === 'lesen') return 'lesen: ' + l.rechnung + (l.rechnung && l.rechnung.indexOf('=') < 0 ? ' ist ' + l.zahl : '') + ', Ziffern ' + l.ziffern + a + (r.wahl ? ', App-Wahl ' + r.wahl.join('/') : '');
  if (r.aufgabe === 'legen') return 'legen ' + r.zahl + ': ' + l.rechnung + ', Ziffern ' + l.ziffern + ', ' + l.schreibweisen + ' Schreibweise' + a;
  if (r.aufgabe === 'kobold') return 'kobold ' + r.zahl + ': gelegt ' + l.rechnungGezeigt + ', falsch ist die ' + l.falschWert + 'er-Karte (' + l.art + ')' + a;
  return '';
}

// Für die App: nur die Aufgabe, nie die Lösung (die App rechnet mit web/kern/janein.js nach)
function fuerApp(r) {
  const aus = { id: r.id, art: r.art, aufgabe: r.aufgabe, anzahl: J.anzahl(r.anzahl), aussehen: r.aussehen || 'karten' };
  if (r.aufgabe === 'legen') aus.zahl = r.zahl;
  if (r.aufgabe === 'lesen') { aus.ja = r.ja.slice(); if (r.wahl) aus.wahl = r.wahl.slice(); }
  if (r.aufgabe === 'kobold') { aus.zahl = r.zahl; aus.ja = r.ja.slice(); }
  return aus;
}

export default { art: 'janein', pruefe, bericht, fuerApp };
