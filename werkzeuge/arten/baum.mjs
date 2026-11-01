// Rätselart „baum“: Ja-Nein-Bäume (Einheit 13)
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10, plan/lehrplan.md):
//   - Merkmals-Tabelle: jedes Ding beantwortet jede Frage mit Ja oder Nein (dinge[].ja, sonst Nein),
//     jede Frage gibt es, jedes Bild gibt es (web/kern/baum.js), Drachen-Kinder passen zu ihrem Bild.
//   - Baum: Jedes Ding landet genau an seinem Platz, keine zwei Dinge landen am selben Platz,
//     kein Platz bleibt leer (jede Frage teilt), jede Frage passt zur Tabelle.
//   - Fragen-Zahlen (wie viele Fragen bis zu jedem Ding, zusammen, höchstens) werden berechnet.
// Aufgaben (r.aufgabe):
//   einsortieren  Dinge an ihre Plätze setzen (Blatt: Platz-Nummer; App: Ding antippen, dann Platz)
//   folgen        einem Ding (r.wer) durch den Baum folgen (App: Ja/Nein antippen)
//   zeigen        nur ein Baum zum Anschauen (z. B. ein schlechter Baum zum Fragen-Zählen)
//   frage         eine Frage fehlt ("f": "?"): genau eine der r.optionen macht den Baum richtig
//   kobold        der Baum ist falsch: r.reparatur { art: "tauschen", knoten } (Ja und Nein vertauscht)
//                 oder { art: "frage", knoten, frage } (falsche Frage). Alle anderen Ein-Schritt-Reparaturen
//                 werden gesucht; sie müssen an derselben Frage sein (sonst "mehrereLoesungen").
//   neu           r.neu (ein Ding, das noch nicht im Baum steht): Wo landet es, welche Fragen trennen es?
//   bauen         eigener Baum mit höchstens r.maxFragen Fragen: Wie viele solche Bäume gibt es?
//                 r.baum ist ein Beispiel (geprüft). Mehr als einer: "mehrereLoesungen": true.
// Optional: r.wege [["ja","nein"], …] → wo landet man mit diesen Antworten?
import '../../web/kern/baum.js';

const B = globalThis.WerkstattBaum;
const AUFGABEN = ['einsortieren', 'folgen', 'zeigen', 'frage', 'kobold', 'neu', 'bauen'];
const MERKMALE_DRACHE = ['gruen', 'fluegel', 'krone'];

function pruefeTabelle(r, F) {
  if (!r.fragen || typeof r.fragen !== 'object' || !Object.keys(r.fragen).length) { F('fragen fehlen'); return false; }
  for (const [id, f] of Object.entries(r.fragen)) {
    if (id === '?') F('Frage-id „?“ ist reserviert');
    const text = typeof f === 'string' ? f : f && f.text;
    if (!text) F('Frage „' + id + '“ hat keinen Text');
    else if (!/\?$/.test(text)) F('Frage „' + id + '“ endet nicht mit ?');
    if (f && typeof f === 'object' && f.kurz && !/\?$/.test(f.kurz)) F('Kurzfrage „' + id + '“ endet nicht mit ?');
  }
  if (!Array.isArray(r.dinge) || r.dinge.length < 2) { F('dinge: mindestens 2'); return false; }
  const ids = new Set();
  for (const d of r.dinge) {
    if (!d.id) { F('Ding ohne id'); continue; }
    if (ids.has(d.id)) F('Ding „' + d.id + '“ doppelt');
    ids.add(d.id);
    if (d.id === '?') F('Ding-id „?“ ist reserviert');
    if (!d.name) F('Ding „' + d.id + '“ ohne name');
    if (!d.bild || !B.hat(d.bild)) F('Ding „' + d.id + '“: Bild „' + d.bild + '“ gibt es nicht (web/kern/baum.js)');
    if (!Array.isArray(d.ja)) F('Ding „' + d.id + '“: ja-Liste fehlt (auch leer: [])');
    for (const f of d.ja || []) if (!r.fragen[f]) F('Ding „' + d.id + '“: Frage „' + f + '“ gibt es nicht');
    // Drachen-Kinder: Bild und Tabelle müssen zusammenpassen
    if (d.bild && /^drachenkind/.test(d.bild)) {
      const teile = d.bild.split('-');
      for (const m of MERKMALE_DRACHE) {
        if (!r.fragen[m]) continue;
        const imBild = m === 'gruen' ? teile.includes('gruen') : teile.includes(m);
        if (imBild !== (d.ja || []).includes(m)) F('Ding „' + d.id + '“: Bild ' + d.bild + ' passt nicht zur Antwort auf „' + m + '“');
      }
    }
  }
  // Zwei Dinge mit genau denselben Antworten kann kein Baum trennen
  const sig = {};
  for (const d of r.dinge) {
    const k = Object.keys(r.fragen).map((f) => ((d.ja || []).includes(f) ? 1 : 0)).join('');
    if (sig[k]) F('„' + sig[k] + '“ und „' + d.id + '“ beantworten alle Fragen gleich (kein Baum kann sie trennen)');
    sig[k] = d.id;
  }
  return true;
}

function pruefeForm(baum, r, F, erlaubt) {
  let ok = true;
  (function geh(k, pfad) {
    if (B.istBlatt(k)) {
      if (k === null || k === undefined) { if (!erlaubt.leer) { F('Leerer Platz bei „' + pfad + '“'); ok = false; } return; }
      if (k === '?') { if (!erlaubt.fehlt) { F('„?“ als Antwort bei „' + pfad + '“ nicht erlaubt'); ok = false; } return; }
      if (typeof k !== 'string' || !r.dinge.some((d) => d.id === k)) { F('Antwort „' + k + '“ bei „' + pfad + '“ gibt es nicht in dinge'); ok = false; }
      return;
    }
    if (k.f === '?') { if (!erlaubt.frageFehlt) { F('Fehlende Frage „?“ nur bei aufgabe "frage"'); ok = false; } }
    else if (!r.fragen[k.f]) { F('Frage „' + k.f + '“ bei „' + pfad + '“ gibt es nicht in fragen'); ok = false; }
    if (k.ja === undefined || k.nein === undefined) { F('Frage bei „' + pfad + '“ braucht ja und nein'); ok = false; return; }
    geh(k.ja, pfad ? pfad + '.ja' : 'ja');
    geh(k.nein, pfad ? pfad + '.nein' : 'nein');
  })(baum, '');
  return ok;
}

const fragenText = (r, f) => B.frageText(r.fragen, f);
// Dinge, die im Baum vorkommen sollen (bei "neu" ohne das neue Ding)
const dingeImBaum = (r) => r.dinge.filter((d) => d.id !== r.neu);

function zahlen(r, baum, dinge) {
  const z = B.fragenZahlen(baum, dinge);
  const plaetze = {};
  for (const b of B.blaetter(baum)) if (b.inhalt) plaetze[b.inhalt] = b.nr;
  return { plaetze, tiefen: z.pro, summe: z.summe, max: z.max, frageKarten: z.karten, blaetter: B.blaetter(baum).map((b) => ({ nr: b.nr, pfad: b.pfad, ding: b.inhalt, tiefe: b.tiefe })) };
}

function richtig(r, baum, F, wort) {
  const p = B.pruefe(baum, dingeImBaum(r));
  for (const f of p.fehler) F((wort || 'Baum') + ': ' + f);
  for (const x of p.falsch) F((wort || 'Baum') + ': „' + x.ding + '“ landet bei Platz ' + x.nr + ' („' + x.bei + '“)');
  return p.ok;
}

function pruefeBaum(r, F) {
  if (!AUFGABEN.includes(r.aufgabe)) return F('aufgabe muss sein: ' + AUFGABEN.join(', '));
  if (!pruefeTabelle(r, F)) return null;
  if (!r.baum || B.istBlatt(r.baum)) return F('baum fehlt (oben steht eine Frage)');
  const L = { aufgabe: r.aufgabe };

  if (r.aufgabe === 'frage') {
    if (!pruefeForm(r.baum, r, F, { frageFehlt: true })) return null;
    const luecken = B.fragenImBaum(r.baum).filter((k) => k.f === '?');
    if (luecken.length !== 1) return F('Bei aufgabe "frage" fehlt genau eine Frage („?“), nicht ' + luecken.length);
    if (!Array.isArray(r.optionen) || r.optionen.length < 2) return F('optionen: mindestens 2 Fragen zur Auswahl');
    for (const o of r.optionen) if (!r.fragen[o]) F('Option „' + o + '“ gibt es nicht in fragen');
    const pfad = luecken[0].pfad;
    const passt = [], warum = {};
    for (const o of r.optionen) {
      const b = B.mitFrage(r.baum, pfad, o);
      const p = B.pruefe(b, r.dinge);
      if (p.ok) passt.push(o);
      else warum[o] = p.falsch.map((x) => ({ ding: x.ding, bei: x.bei, nr: x.nr }));
    }
    if (passt.length !== 1) return F('Genau eine Option muss passen, es passen ' + passt.length + ' (' + passt.join(', ') + ')');
    // Auch andere Fragen aus der Tabelle (nicht in den Optionen) zur Info
    const auch = Object.keys(r.fragen).filter((f) => !r.optionen.includes(f) && B.pruefe(B.mitFrage(r.baum, pfad, f), r.dinge).ok);
    const voll = B.mitFrage(r.baum, pfad, passt[0]);
    Object.assign(L, { pfad, frage: passt[0], text: fragenText(r, passt[0]), warum, auchAusTabelle: auch }, zahlen(r, voll, r.dinge));
    return L;
  }

  if (!pruefeForm(r.baum, r, F, {})) return null;

  if (r.aufgabe === 'kobold') {
    const rep = r.reparatur;
    if (!rep || !['tauschen', 'frage'].includes(rep.art) || typeof rep.knoten !== 'string') return F('reparatur: { "art": "tauschen" | "frage", "knoten": "ja.nein" (… "frage": id) }');
    const knoten = B.bei(r.baum, rep.knoten);
    if (B.istBlatt(knoten)) return F('reparatur.knoten „' + rep.knoten + '“ ist keine Frage');
    const kaputt = B.pruefe(r.baum, r.dinge);
    if (kaputt.ok) return F('Der Kobold-Baum ist schon richtig – nichts zu finden');
    const repariert = rep.art === 'tauschen' ? B.tausche(r.baum, rep.knoten) : B.mitFrage(r.baum, rep.knoten, rep.frage);
    if (rep.art === 'frage' && !r.fragen[rep.frage]) return F('reparatur.frage „' + rep.frage + '“ gibt es nicht');
    if (!richtig(r, repariert, F, 'Reparierter Baum')) return null;
    // alle Ein-Schritt-Reparaturen suchen
    const alle = [];
    for (const k of B.fragenImBaum(r.baum)) {
      if (B.pruefe(B.tausche(r.baum, k.pfad), r.dinge).ok) alle.push({ art: 'tauschen', knoten: k.pfad });
      for (const f of Object.keys(r.fragen)) {
        if (f === k.f) continue;
        if (B.pruefe(B.mitFrage(r.baum, k.pfad, f), r.dinge).ok) alle.push({ art: 'frage', knoten: k.pfad, frage: f, text: fragenText(r, f) });
      }
    }
    const gemeint = (a) => a.art === rep.art && a.knoten === rep.knoten && (a.art === 'tauschen' || a.frage === rep.frage);
    if (!alle.some(gemeint)) return F('Die gemeinte Reparatur wurde nicht gefunden (Löser-Fehler?)');
    const andereStellen = alle.filter((a) => a.knoten !== rep.knoten);
    if (andereStellen.length && !r.mehrereLoesungen) F('Der Kobold steckt nicht eindeutig in einer Frage: auch ' + andereStellen.map((a) => a.knoten + ' (' + a.art + ')').join(', ') + ' repariert den Baum');
    Object.assign(L, {
      knoten: rep.knoten, art: rep.art, frage: knoten.f, text: fragenText(r, knoten.f),
      falsch: kaputt.falsch.map((x) => ({ ding: x.ding, bei: x.bei, nr: x.nr })),
      auch: alle.filter((a) => !gemeint(a)),
    }, zahlen(r, repariert, r.dinge));
    return L;
  }

  if (r.aufgabe === 'neu') {
    const neu = r.dinge.find((d) => d.id === r.neu);
    if (!neu) return F('neu: Ding „' + r.neu + '“ gibt es nicht in dinge');
    if (B.blaetter(r.baum).some((b) => b.inhalt === r.neu)) return F('Das neue Ding steht schon im Baum');
    if (!richtig(r, r.baum, F)) return null;
    const e = B.folge(r.baum, neu);
    const bei = r.dinge.find((d) => d.id === e.blatt);
    const trennen = Object.keys(r.fragen).filter((f) => B.antwort(neu, f) !== B.antwort(bei, f))
      .map((f) => ({ frage: f, text: fragenText(r, f), ja: B.antwort(neu, f) ? neu.id : bei.id, nein: B.antwort(neu, f) ? bei.id : neu.id }));
    // Fragen, die schon im Baum stehen, trennen die beiden nie (sie landen ja am selben Platz)
    const imBaum = new Set(B.fragenImBaum(r.baum).map((k) => k.f));
    const neueFragen = trennen.filter((t) => !imBaum.has(t.frage));
    if (!neueFragen.length) return F('Keine Frage in der Tabelle trennt „' + neu.id + '“ und „' + bei.id + '“');
    Object.assign(L, { neu: neu.id, landetBei: bei.id, nr: e.nr, weg: e.weg, trennen: neueFragen }, zahlen(r, r.baum, dingeImBaum(r)));
    return L;
  }

  // einsortieren, folgen, zeigen, bauen: der Baum muss richtig sein
  if (!richtig(r, r.baum, F)) return null;
  Object.assign(L, zahlen(r, r.baum, r.dinge));
  L.tiefe = B.tiefe(r.baum);

  if (r.aufgabe === 'folgen') {
    const d = r.dinge.find((x) => x.id === r.wer);
    if (!d) return F('folgen: wer „' + r.wer + '“ gibt es nicht in dinge');
    const e = B.folge(r.baum, d);
    Object.assign(L, { wer: d.id, weg: e.weg, nr: e.nr, fragenBis: e.fragen });
  }
  if (r.aufgabe === 'bauen') {
    const max = r.maxFragen;
    if (!Number.isInteger(max) || max < 1) return F('bauen: maxFragen fehlt');
    if (L.tiefe > max) F('Das Beispiel braucht ' + L.tiefe + ' Fragen, erlaubt sind ' + max);
    const ids = Object.keys(r.fragen);
    const anzahl = B.zaehleBaeume(r.dinge, ids, max);
    if (!anzahl) return F('Mit höchstens ' + max + ' Fragen geht es nicht');
    if (anzahl > 1 && !r.mehrereLoesungen) F('Es gibt ' + anzahl + ' verschiedene Bäume mit höchstens ' + max + ' Fragen – "mehrereLoesungen": true setzen');
    if (anzahl === 1 && r.mehrereLoesungen) F('„mehrereLoesungen“ gesetzt, aber es gibt genau einen Baum');
    let minFragen = 1;
    while (!B.zaehleBaeume(r.dinge, ids, minFragen)) minFragen++;
    Object.assign(L, { maxFragen: max, anzahlBaeume: anzahl, minFragen });
  }
  if (r.wege) {
    if (!Array.isArray(r.wege)) return F('wege: Liste von Antwort-Listen');
    L.wege = r.wege.map((w) => {
      const e = B.wegFolgen(r.baum, w);
      if (!e) { F('Weg „' + [].concat(w).join(' ') + '“ endet nicht genau an einem Platz'); return null; }
      return { weg: w, nr: e.nr, ding: e.blatt };
    });
  }
  return L;
}

function bericht(r) {
  const l = r.loesung || {};
  const z = l.tiefen ? ' · Fragen ' + Object.entries(l.tiefen).map(([d, n]) => d + ' ' + n).join(', ') + ' (zusammen ' + l.summe + ', höchstens ' + l.max + ', Frage-Karten ' + l.frageKarten + ')' : '';
  if (r.aufgabe === 'frage') return 'fehlende Frage: ' + l.frage + ' („' + l.text + '“)' + (l.auchAusTabelle && l.auchAusTabelle.length ? ', auch aus der Tabelle: ' + l.auchAusTabelle.join(', ') : '') + z;
  if (r.aufgabe === 'kobold') return 'Kobold bei ' + l.knoten + ' („' + l.text + '“, ' + l.art + '), falsch: ' + (l.falsch || []).map((x) => x.ding).join(', ') + '; auch: ' + (l.auch || []).map((a) => a.knoten + ' ' + a.art + (a.frage ? ' ' + a.frage : '')).join(', ') + z;
  if (r.aufgabe === 'neu') return r.neu + ' landet bei ' + l.landetBei + ' (Platz ' + l.nr + '); neue Frage z. B. ' + (l.trennen || []).map((t) => t.frage).join(', ');
  if (r.aufgabe === 'bauen') return l.anzahlBaeume + ' Bäume mit höchstens ' + l.maxFragen + ' Fragen (weniger geht nicht: mindestens ' + l.minFragen + ')' + z;
  if (r.aufgabe === 'folgen') return r.wer + ': ' + (l.weg || []).join(' ') + ' → Platz ' + l.nr + z;
  return 'Plätze ' + Object.entries(l.plaetze || {}).map(([d, n]) => d + ' ' + n).join(', ') + (l.wege ? ' · Wege ' + l.wege.map((w) => w && (w.weg.join('-') + '→' + w.ding)).join(', ') : '') + z;
}

// Für die App: keine Lösungen. Die Antworten an den Plätzen rechnet die App selbst aus der
// Merkmals-Tabelle aus (WerkstattBaum.bewohner); nur bei "frage" stehen sie im Baum (sie gehören zur Aufgabe).
function ohneAntworten(k) {
  if (B.istBlatt(k)) return null;
  return { f: k.f, ja: ohneAntworten(k.ja), nein: ohneAntworten(k.nein) };
}
function fuerApp(r) {
  const aus = {
    id: r.id, art: r.art, titel: r.titel, aufgabe: r.aufgabe,
    fragen: r.fragen,
    dinge: r.dinge.map((d) => ({ id: d.id, name: d.name, bild: d.bild, ja: d.ja.slice() })),
    baum: r.aufgabe === 'frage' ? r.baum : ohneAntworten(r.baum),
  };
  if (r.aufgabe === 'frage') aus.optionen = r.optionen.slice();
  if (r.aufgabe === 'folgen') aus.wer = r.wer;
  return aus;
}

export default { art: 'baum', pruefe: pruefeBaum, bericht, fuerApp };
