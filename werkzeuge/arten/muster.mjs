// Rätselart „muster“ (Einheit 6 „Muster-Detektivin“): prüfen, lösen, beweisen
//
// Logik gemeinsam mit Blättern und App: web/kern/muster.js (globalThis.WerkstattMuster)
//
// Felder:
//   folge     "rot blau ? blau rot blau"  (? = Lücke in der Mitte)
//   aufgabe   fortsetzen | kobold | zauber | kuerzester | lesen | wachsend
//   weiter    fortsetzen/wachsend: so viele Elemente hängt das Kind an
//   stelle, richtig   kobold: welche Stelle (ab 1) falsch ist und was dort hingehört
//   programm  lesen: Zauber-Kasten-Programm, z. B. "4[rot gelb]"
//   kopf, wachs, runden   wachsend: kopf + 1-mal wachs, kopf + 2-mal wachs, … (runden Runden zu sehen)
//   palette   (App) welche Elemente zur Auswahl stehen; ohne Angabe: alle vier einfachen Perlen,
//             alle Bewegungen oder (zwei Eigenschaften) alle Formen mal alle Farben, die vorkommen
//   kernNurEinmal, mehrereLoesungen   Kennzeichnungen (siehe unten)
//
// Was „eindeutig“ heißt (Auftrag Abschnitt 10, Plan Einheit 6):
//   fortsetzen  Der kürzeste Kern ist bestimmt (jede Kern-Stelle ist zu sehen) und steht mindestens
//               zweimal ganz da (sonst "kernNurEinmal": true). Jede Lücke hat genau eine Füllung:
//               Alle Füllungen der Lücken aus den Elementen der Folge und der Palette werden
//               durchprobiert, genau eine ergibt ein sauberes Muster. Jede andere Kern-Länge bis zur halben Folge, die auch passt,
//               setzt gleich fort.
//   kobold      Die Folge ist kein sauberes Muster. Alle Ein-Element-Reparaturen (jede Stelle, jedes
//               Element der Folge und der Palette) werden durchprobiert: Genau eine macht ein sauberes Muster, und das ist
//               die angegebene. (Ein Element, das nicht in der Folge vorkommt, kann ohnehin nie helfen:
//               Im reparierten Muster kommt jedes Element mindestens zweimal vor.)
//               Sauberes Muster heißt: ein Kern mit höchstens der halben Länge passt (steht zweimal ganz da).
//   zauber      Genau ein Zauber-Kasten (2- bis 5-mal, 1 bis 3 Elemente) malt die ganze Folge.
//   kuerzester  Programm mit den wenigsten Karten (Zauber-Kästen und einzelne Elemente); mehrere gleich
//               kurze nur mit "mehrereLoesungen": true.
//   lesen       Das Programm ist gültig; Lösung ist die ausgerollte Folge.
//   wachsend    Die Folge ist kein sauberes Muster (kein Kern wiederholt sich) und kein einzelner
//               Zauber-Kasten malt sie; Lösung: wie es weitergeht.
import '../../web/kern/muster.js';

const M = globalThis.WerkstattMuster;
const MAX_REIHE = 16;            // so viele Perlen passen in eine Reihe am Blatt
const APP_AUFGABEN = ['fortsetzen', 'kobold', 'zauber'];

const verschieden = (f) => [...new Set(f.filter((x) => x !== null))];
const text = (f) => f.map((x) => (x === null ? '?' : x)).join(' ');

function gleicheGruppe(f, F) {
  const g = new Set(f.filter((x) => x !== null).map(M.gruppe));
  if (g.size > 1) F('Perlen und Bewegungen nicht mischen');
}

function pruefeFortsetzen(r, F) {
  const f = M.lies(r.folge);
  gleicheGruppe(f, F);
  const weiter = r.weiter ?? 0;
  const luecken = f.map((x, i) => (x === null ? i : -1)).filter((i) => i >= 0);
  if (!(weiter >= 0 && weiter <= 6)) F('weiter: 0 bis 6');
  if (!luecken.length && !weiter) F('Nichts zu tun: keine Lücke und weiter = 0');
  if (f.length + weiter > MAX_REIHE) F('Höchstens ' + MAX_REIHE + ' Elemente in einer Reihe (mit den leeren Plätzen)');
  if (f[0] === null) F('Die erste Stelle darf keine Lücke sein');
  if (luecken.length > 4) F('Höchstens 4 Lücken');
  const k = M.kern(f);
  if (!k.bestimmt) return F('Eine Lücke lässt sich nicht füllen: Kern-Stelle nirgends zu sehen (' + text(k.teile) + ')');
  if (k.laenge === f.length) return F('Kein Muster: Der Kern ist die ganze Folge');
  if (k.ganz < 2 && !r.kernNurEinmal) F('Der Kern (' + text(k.teile) + ') steht nur ' + k.ganz + '-mal ganz da. Länger machen oder "kernNurEinmal": true');
  if (k.ganz >= 2 && r.kernNurEinmal) F('"kernNurEinmal" gesetzt, aber der Kern steht ' + k.ganz + '-mal ganz da');
  const soll = M.fortsetzung(f, weiter);
  // Beweis 1: jede Lücke hat genau eine Füllung (alle Füllungen aus den Elementen der Folge durchprobieren)
  const A = [...new Set(verschieden(f).concat(palette(r, f)))];
  const gueltig = [];
  (function probiere(j, g) {
    if (j === luecken.length) { if (M.istSauber(g)) gueltig.push(luecken.map((i) => g[i])); return; }
    for (const a of A) { g[luecken[j]] = a; probiere(j + 1, g); }
    g[luecken[j]] = null;
  })(0, f.slice());
  if (luecken.length) {
    if (gueltig.length !== 1) F('Die Lücken haben ' + gueltig.length + ' mögliche Füllungen: ' + gueltig.slice(0, 4).map((x) => x.join(' ')).join(' | '));
    else if (!M.gleich(gueltig[0], soll.luecken.map((l) => l.el))) F('Füllung passt nicht zum kürzesten Kern');
  }
  // Beweis 2: jede andere passende Kern-Länge bis zur halben Folge setzt gleich fort
  const voll = f.slice();
  soll.luecken.forEach((l) => { voll[l.i] = l.el; });
  const andere = [];
  for (let q = 1; 2 * q <= voll.length; q++) {
    if (!M.passt(voll, q)) continue;
    const kq = M.kernZu(voll, q);
    const w = [];
    for (let j = 0; j < weiter; j++) w.push(kq[(voll.length + j) % q]);
    if (!M.gleich(w, soll.weiter)) andere.push(q + ': ' + w.join(' '));
  }
  if (andere.length) F('Fortsetzung nicht eindeutig, andere Kern-Längen: ' + andere.join(' | '));
  const l = { kern: soll.kern, laenge: soll.laenge, ganz: soll.ganz, luecken: soll.luecken, weiter: soll.weiter, voll: voll.concat(soll.weiter) };
  const ek = M.eigenschaftsKerne(voll);
  if (ek && (ek.form !== ek.farbe || ek.form !== soll.laenge)) l.eigenschaften = ek;
  return l;
}

function pruefeKobold(r, F) {
  const f = M.lies(r.folge);
  gleicheGruppe(f, F);
  if (f.some((x) => x === null)) return F('kobold: keine Lücken');
  if (f.length > MAX_REIHE) F('Höchstens ' + MAX_REIHE + ' Elemente');
  if (!r.stelle || !r.richtig) return F('kobold braucht stelle (ab 1) und richtig');
  const i0 = r.stelle - 1;
  if (i0 < 0 || i0 >= f.length) return F('stelle außerhalb der Folge');
  const richtig = M.norm(r.richtig);
  if (f[i0] === richtig) F('An Stelle ' + r.stelle + ' steht schon ' + richtig);
  if (M.istSauber(f)) F('Die Folge ist schon ein sauberes Muster – wo ist der Kobold?');
  const rep = f.slice(); rep[i0] = richtig;
  if (!M.istSauber(rep)) return F('Mit der Reparatur wird es kein sauberes Muster: ' + text(rep));
  const A = [...new Set(verschieden(f).concat(palette(r, f)))];
  const alle = [];
  for (let i = 0; i < f.length; i++) for (const a of A) {
    if (a === f[i]) continue;
    const g = f.slice(); g[i] = a;
    if (M.istSauber(g)) alle.push({ stelle: i + 1, richtig: a });
  }
  const auch = alle.filter((x) => !(x.stelle === r.stelle && x.richtig === richtig));
  if (auch.length && !r.mehrereLoesungen) F('Auch andere Reparaturen machen ein sauberes Muster: ' + auch.map((x) => 'Stelle ' + x.stelle + ' → ' + x.richtig).join(', '));
  if (!auch.length && r.mehrereLoesungen) F('"mehrereLoesungen" gesetzt, aber es gibt genau eine Reparatur');
  const k = M.kern(rep);
  const l = { stelle: r.stelle, falsch: f[i0], richtig, kern: k.teile, laenge: k.laenge, repariert: rep, auch, geprueft: f.length * (A.length - 1) };
  const ek = M.eigenschaftsKerne(rep);
  if (ek && (ek.form !== ek.farbe || ek.form !== k.laenge)) {
    l.eigenschaften = ek;
    const e1 = M.eigenschaften(f[i0]), e2 = M.eigenschaften(richtig);
    l.anders = [e1.form !== e2.form ? 'form' : null, e1.farbe !== e2.farbe ? 'farbe' : null].filter(Boolean);
  }
  return l;
}

function pruefeZauber(r, F) {
  const f = M.lies(r.folge);
  gleicheGruppe(f, F);
  if (f.some((x) => x === null)) return F('zauber: keine Lücken');
  const p = M.einKasten(f);
  if (!p.length) return F('Kein einzelner Zauber-Kasten (2- bis 5-mal, 1 bis 3 Elemente) malt diese Folge');
  if (p.length > 1 && !r.mehrereLoesungen) F('Mehrere Zauber-Kästen malen die Folge: ' + p.map(M.alsText).join(' | '));
  const kz = M.kuerzeste(f);
  return { programm: M.alsText(p[0]), wdh: p[0][0].wdh, teile: p[0][0].teile, karten: M.karten(p[0]), alle: p.map(M.alsText), minKarten: kz.karten, laenge: f.length };
}

function pruefeKuerzester(r, F) {
  const f = M.lies(r.folge);
  gleicheGruppe(f, F);
  if (f.some((x) => x === null)) return F('kuerzester: keine Lücken');
  const k = M.kuerzeste(f, 40);
  if (k.anzahl > 1 && !r.mehrereLoesungen) F('Es gibt ' + k.anzahl + ' Programme mit ' + k.karten + ' Karten: ' + k.programme.slice(0, 4).map(M.alsText).join(' | ') + '. Ändern oder "mehrereLoesungen": true');
  if (k.anzahl === 1 && r.mehrereLoesungen) F('"mehrereLoesungen" gesetzt, aber es gibt genau ein kürzestes Programm');
  return { karten: k.karten, anzahl: k.anzahl, programme: k.programme.map(M.alsText), laenge: f.length, einKasten: M.einKasten(f).map(M.alsText) };
}

function pruefeLesen(r, F) {
  if (!r.programm) return F('lesen braucht ein programm');
  const p = M.liesProgramm(r.programm);
  const f = M.ausrollen(p);
  gleicheGruppe(f, F);
  if (f.length > MAX_REIHE) F('Das Programm malt ' + f.length + ' Elemente, höchstens ' + MAX_REIHE);
  const anzahl = {};
  f.forEach((x) => { anzahl[x] = (anzahl[x] || 0) + 1; });
  return { programm: M.alsText(p), folge: f, karten: M.karten(p), anzahl };
}

function pruefeWachsend(r, F) {
  if (!r.kopf || !r.wachs || !r.runden) return F('wachsend braucht kopf, wachs und runden');
  const weiter = r.weiter ?? 0;
  const f = M.wachsend(r.kopf, r.wachs, r.runden);
  gleicheGruppe(f, F);
  const mehr = M.wachsend(r.kopf, r.wachs, r.runden + 3);
  if (f.length + weiter > MAX_REIHE) F('Höchstens ' + MAX_REIHE + ' Elemente in einer Reihe');
  if (M.istSauber(f)) F('Das ist ein normales Muster (Kern wiederholt sich) – kein wachsendes');
  if (M.einKasten(f).length) F('Ein einzelner Zauber-Kasten malt diese Folge');
  const w = mehr.slice(f.length, f.length + weiter);
  return { folge: f, weiter: w, naechsteRunde: M.wachsend(r.kopf, r.wachs, r.runden + 1).slice(f.length), kuerzeste: M.kuerzeste(f.concat(w), 3).karten };
}

const AUFGABEN = { fortsetzen: pruefeFortsetzen, kobold: pruefeKobold, zauber: pruefeZauber, kuerzester: pruefeKuerzester, lesen: pruefeLesen, wachsend: pruefeWachsend };

// Auswahl in der App: ohne Angabe alle vier einfachen Perlen, alle Bewegungen,
// bei Perlen mit zwei Eigenschaften alle Formen mal alle Farben, die vorkommen
function palette(r, f) {
  if (r.palette) return M.lies(r.palette);
  const v = verschieden(f);
  if (v.every((x) => M.gruppe(x) === 'bewegung')) return M.BEWEGUNGEN.slice();
  if (!v.some((x) => x.includes('-'))) return Object.keys(M.PERLE);
  const ek = v.map(M.eigenschaften);
  const formen = M.FORMEN.filter((fo) => ek.some((e) => e.form === fo));
  const farben = Object.keys(M.FARBEN).filter((fa) => ek.some((e) => e.farbe === fa));
  const aus = [];
  for (const fa of farben) for (const fo of formen) aus.push(M.norm(fo + '-' + fa));
  return aus;
}

export default {
  art: 'muster',
  pruefe(r, F) {
    const aufgabe = r.aufgabe;
    const fn = AUFGABEN[aufgabe];
    if (!fn) return F('aufgabe muss ' + Object.keys(AUFGABEN).join(', ') + ' sein');
    if (r.palette) M.lies(r.palette);
    return fn(r, F);
  },
  bericht(r) {
    const l = r.loesung || {};
    const t = (a) => (a || []).join(' ');
    if (r.aufgabe === 'fortsetzen') return 'Kern ' + l.laenge + ' (' + t(l.kern) + '), ' + l.ganz + '× ganz' + ((l.luecken || []).length ? ', Lücken: ' + l.luecken.map((x) => x.el).join(' ') : '') + (l.weiter && l.weiter.length ? ', weiter: ' + t(l.weiter) : '') + (l.eigenschaften ? ', Form alle ' + l.eigenschaften.form + ', Farbe alle ' + l.eigenschaften.farbe : '');
    if (r.aufgabe === 'kobold') return 'Stelle ' + l.stelle + ': ' + l.falsch + ' → ' + l.richtig + ', Kern ' + t(l.kern) + ', ' + l.geprueft + ' Reparaturen geprüft, andere: ' + (l.auch || []).length;
    if (r.aufgabe === 'zauber') return l.programm + ' (' + l.karten + ' Karten, kürzestes überhaupt ' + l.minKarten + ')';
    if (r.aufgabe === 'kuerzester') return l.karten + ' Karten, ' + l.anzahl + '×: ' + (l.programme || []).slice(0, 3).join(' | ');
    if (r.aufgabe === 'lesen') return l.programm + ' → ' + t(l.folge);
    if (r.aufgabe === 'wachsend') return t(l.folge) + ' → ' + t(l.weiter);
    return '';
  },
  // Für die App: nur was sie zum Spielen braucht, keine Lösung (Kobold-Stelle, Füllung, Programm)
  fuerApp(r) {
    if (!APP_AUFGABEN.includes(r.aufgabe)) throw new Error('Muster-Level ' + r.id + ': aufgabe „' + r.aufgabe + '“ kann die App nicht (' + APP_AUFGABEN.join(', ') + ')');
    const f = M.lies(r.folge);
    const aus = { id: r.id, art: r.art, aufgabe: r.aufgabe, folge: f, palette: palette(r, f) };
    if (r.aufgabe === 'fortsetzen') aus.weiter = r.weiter || 0;
    if (r.aufgabe === 'zauber' && r.loesung) aus.minKarten = r.loesung.karten;
    if (r.titel) aus.titel = r.titel;
    return aus;
  },
};
