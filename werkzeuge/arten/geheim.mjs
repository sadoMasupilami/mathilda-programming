// Rätselart „geheim“ (Einheit 7, Geheimschrift der Feen): prüfen und lösen
//
// Die gemeinsame Logik (Buchstaben verschieben, Wortliste, Feen-Zeichen, Bilder, Rad)
// steht in web/kern/geheim.js und ist dieselbe für Löser, Blätter und Web-App.
//
// Felder (raetsel/e7.json), immer "art": "geheim" und "aufgabe":
//   lesen      klartext, geheimtext, schluessel (1–25), optional bilder: ["mond", …]
//              Geheimtext mit gegebener Schlüssel-Zahl lesen (Bild anmalen / antippen)
//   schreiben  klartext, geheimtext, schluessel (0–26), optional bild, tasten: ["E", …] (App)
//              ein Wort in Geheimschrift schreiben
//   kobold     klartext (gemeint), geheimtext (gedruckt, mit genau einem falschen Buchstaben), schluessel
//   knacken    klartext, geheimtext, schluessel, optional bereich: [1, 5] (Hinweis am Blatt),
//              bilder, haeufigkeit: true (der häufigste Buchstabe des Klartexts ist das E)
//              Schlüssel-Zahl unbekannt: genau eine Zahl 1–25 ergibt nur Wörter der Wortliste
//   zeichen    klartext (in Feen-Zeichen gedruckt), optional bilder
//   kette      klartext, schluessel: [3, 4], geheimtext (zwei Schlüssel hintereinander)
//   liste      woerter: ["POLSTER", …], schluessel (Feen-Post zum Abschreiben)
//
// Was bewiesen wird (AUFTRAG.md Abschnitt 10, „Geheimtexte: genau eine Lösung“):
//   - nur A bis Z und einzelne Leerzeichen, keine Umlaute, kein ß
//   - Klartext + Schlüssel ergibt genau den gedruckten Geheimtext, und Lesen ergibt wieder den Klartext
//   - mit Bildern: genau ein Bild passt (beim Knacken: genau ein Bild ist überhaupt eine Verschiebung)
//   - kobold: genau ein Buchstabe ist falsch, das falsch gelesene Wort steht nicht in der Wortliste,
//     und an keiner anderen Stelle macht ein anderer Buchstabe lauter Wörter der Wortliste
//   - knacken: genau eine Schlüssel-Zahl 1–25 ergibt nur Wörter der Wortliste (Wortliste in
//     web/kern/geheim.js, WORTE; außerhalb der Liste ist das nicht bewiesen, siehe Bericht)

import '../../web/kern/geheim.js';

const G = globalThis.WerkstattGeheim;
const AUFGABEN = ['lesen', 'schreiben', 'kobold', 'knacken', 'zeichen', 'kette', 'liste'];

function text(F, r, feld) {
  const t = r[feld];
  const f = G.pruefeText(t);
  if (f) { F(feld + ' „' + t + '“: ' + f); return null; }
  return t;
}
function schluessel(F, r, von, bis) {
  const k = r.schluessel;
  if (!Number.isInteger(k) || k < von || k > bis) { F('schluessel muss eine ganze Zahl von ' + von + ' bis ' + bis + ' sein'); return null; }
  return k;
}
// Geheimtext passt zu Klartext und Schlüssel (in beide Richtungen)
function passt(F, klar, geheim, k) {
  const soll = G.schreiben(klar, k);
  if (soll !== geheim) F('Klartext „' + klar + '“ mit Schlüssel-Zahl ' + k + ' ergibt „' + soll + '“, gedruckt ist „' + geheim + '“');
  if (G.lesen(geheim, k) !== klar) F('Geheimtext „' + geheim + '“ mit Schlüssel-Zahl ' + k + ' gelesen ergibt nicht „' + klar + '“');
}
// Bilder: alle vorhanden, verschieden; passend(wort) entscheidet, welches Bild passt
function pruefeBilder(F, r, passend, was) {
  if (r.bilder === undefined) return null;
  if (!Array.isArray(r.bilder) || r.bilder.length < 2 || r.bilder.length > 4) { F('bilder: 2 bis 4 Bilder'); return null; }
  if (new Set(r.bilder).size !== r.bilder.length) F('bilder doppelt');
  for (const b of r.bilder) if (!G.hatBild(b)) F('Unbekanntes Bild „' + b + '“ (web/kern/geheim.js, BILDER: ' + Object.keys(G.BILDER).join(', ') + ')');
  const treffer = r.bilder.filter((b) => G.hatBild(b) && passend(G.wortVonBild(b)));
  if (treffer.length !== 1) F('Genau ein Bild muss passen (' + was + '), es passen: ' + (treffer.join(', ') || 'keines'));
  return treffer[0] || null;
}
// Ist w (gleich lang wie t) irgendeine Verschiebung von t?
function istVerschiebung(t, w) {
  if (!w || w.length !== t.length) return false;
  for (let k = 0; k < G.N; k++) if (G.schreiben(t, k) === w) return true;
  return false;
}

const pruefen = {
  lesen(r, F) {
    const klar = text(F, r, 'klartext'), geheim = text(F, r, 'geheimtext'), k = schluessel(F, r, 1, 25);
    if (!klar || !geheim || k === null) return null;
    passt(F, klar, geheim, k);
    const bild = pruefeBilder(F, r, (w) => w === klar, 'Wort „' + klar + '“');
    return { klartext: klar, geheimtext: geheim, schluessel: k, bild };
  },
  schreiben(r, F) {
    const klar = text(F, r, 'klartext'), geheim = text(F, r, 'geheimtext'), k = schluessel(F, r, 0, 26);
    if (!klar || !geheim || k === null) return null;
    passt(F, klar, geheim, k);
    if (r.bild !== undefined) {
      if (!G.hatBild(r.bild)) F('Unbekanntes Bild „' + r.bild + '“');
      else if (G.wortVonBild(r.bild) !== klar) F('Bild „' + r.bild + '“ ist ' + G.wortVonBild(r.bild) + ', nicht ' + klar);
    }
    if (r.tasten !== undefined) {
      const t = r.tasten;
      if (!Array.isArray(t) || t.some((b) => typeof b !== 'string' || !/^[A-Z]$/.test(b))) F('tasten: einzelne Buchstaben A bis Z');
      else {
        if (new Set(t).size !== t.length) F('tasten doppelt');
        if (t.length > 8) F('Höchstens 8 Buchstaben-Tasten (Handy)');
        const fehlt = Array.from(new Set(geheim.replace(/ /g, ''))).filter((b) => !t.includes(b));
        if (fehlt.length) F('tasten: es fehlen ' + fehlt.join(', '));
        if (t.length <= new Set(geheim.replace(/ /g, '')).size) F('tasten: mindestens ein Buchstabe zum Ausprobieren mehr als nötig');
      }
    }
    return { klartext: klar, geheimtext: geheim, schluessel: k };
  },
  kobold(r, F) {
    const klar = text(F, r, 'klartext'), geheim = text(F, r, 'geheimtext'), k = schluessel(F, r, 1, 25);
    if (!klar || !geheim || k === null) return null;
    if (!G.nurWorte(klar)) F('Der gemeinte Brief „' + klar + '“ hat Wörter, die nicht in der Wortliste stehen');
    const richtig = G.schreiben(klar, k);
    if (richtig.length !== geheim.length) return F('Geheimtext ist anders lang als der richtige („' + richtig + '“)');
    const u = G.unterschiede(richtig, geheim);
    if (u.length !== 1) return F('Genau ein Buchstabe muss falsch sein, es sind ' + u.length + ' (richtig wäre „' + richtig + '“)');
    const i = u[0];
    if (richtig[i] === ' ' || geheim[i] === ' ') return F('Der Kobold darf kein Leerzeichen verschieben');
    const gelesen = G.lesen(geheim, k);
    const woerter = gelesen.split(' ');
    let pos = 0, wortNr = 0;
    for (let w = 0; w < woerter.length; w++) { if (i >= pos && i < pos + woerter[w].length) { wortNr = w; break; } pos += woerter[w].length + 1; }
    const falschesWort = woerter[wortNr];
    if (G.istWort(falschesWort)) F('Das falsch gelesene Wort „' + falschesWort + '“ ist auch ein echtes Wort – der Kobold wäre nicht zu finden');
    // Andere Reparaturen mit einem Buchstaben, nach denen alles echte Wörter sind
    const auch = [];
    for (let j = 0; j < geheim.length; j++) {
      if (geheim[j] === ' ') continue;
      for (const b of G.ABC) {
        if (b === geheim[j] || (j === i && b === richtig[i])) continue;
        const neu = geheim.slice(0, j) + b + geheim.slice(j + 1);
        const t = G.lesen(neu, k);
        if (G.nurWorte(t)) auch.push({ stelle: j + 1, geheim: b, text: t });
      }
    }
    // Eindeutig: Nur an der Kobold-Stelle macht ein anderer Buchstabe aus dem Brief lauter echte Wörter.
    // Sonst wüsste das Kind nicht, welchen Buchstaben es einkreisen soll.
    const woanders = auch.filter((a) => a.stelle !== i + 1);
    if (woanders.length) F('Kobold nicht eindeutig: auch ' + woanders.map((a) => 'Stelle ' + a.stelle + ' mit ' + a.geheim + ' („' + a.text + '“)').join(', ') + ' ergibt lauter echte Wörter');
    return {
      klartext: klar, geheimtext: geheim, schluessel: k, stelle: i + 1, falsch: geheim[i], richtig: richtig[i],
      gelesen, falschesWort, richtigesWort: klar.split(' ')[wortNr], gelesenFalsch: gelesen[i], gelesenRichtig: klar[i], auch,
    };
  },
  knacken(r, F) {
    const klar = text(F, r, 'klartext'), geheim = text(F, r, 'geheimtext'), k = schluessel(F, r, 1, 25);
    if (!klar || !geheim || k === null) return null;
    passt(F, klar, geheim, k);
    if (!G.nurWorte(klar)) F('„' + klar + '“: nicht alle Wörter stehen in der Wortliste (web/kern/geheim.js, WORTE)');
    const treffer = G.knacken(geheim);
    if (treffer.length !== 1 || treffer[0].schluessel !== k) {
      F('Knacken nicht eindeutig: Schlüssel-Zahlen mit echten Wörtern: ' + (treffer.map((t) => t.schluessel + ' (' + t.text + ')').join(', ') || 'keine'));
    }
    if (r.bereich !== undefined) {
      const b = r.bereich;
      if (!Array.isArray(b) || b.length !== 2 || !(b[0] >= 1 && b[1] <= 25 && b[0] < b[1])) F('bereich: [von, bis] mit 1 ≤ von < bis ≤ 25');
      else if (k < b[0] || k > b[1]) F('Schlüssel-Zahl ' + k + ' liegt nicht im Bereich ' + b[0] + ' bis ' + b[1]);
    }
    let haeufig = null;
    if (r.haeufigkeit) {
      const h = G.haeufigkeit(klar);
      if (h[0][0] !== 'E' || (h[1] && h[1][1] === h[0][1])) F('haeufigkeit: Das E muss allein der häufigste Buchstabe sein (' + h.slice(0, 3).map((x) => x[0] + ' ' + x[1]).join(', ') + ')');
      const hg = G.haeufigkeit(geheim);
      haeufig = { buchstabe: hg[0][0], anzahl: hg[0][1], schluessel: G.abstand('E', hg[0][0]), zweiter: hg[1] ? hg[1] : null };
      if (haeufig.schluessel !== k) F('haeufigkeit: Vom E zum häufigsten Geheim-Buchstaben sind es ' + haeufig.schluessel + ', nicht ' + k);
    }
    // Bilder: genau ein Bild-Wort ist überhaupt eine Verschiebung des Geheimtexts (so prüft die App)
    const bild = pruefeBilder(F, r, (w) => istVerschiebung(geheim, w), 'eine Verschiebung von „' + geheim + '“');
    if (bild && G.wortVonBild(bild) !== klar) F('Das passende Bild „' + bild + '“ ist nicht der Klartext');
    const versuche = [];
    for (let s = 1; s <= 25; s++) versuche.push({ schluessel: s, text: G.lesen(geheim, s) });
    return { klartext: klar, geheimtext: geheim, schluessel: k, bild, haeufig, versuche, eindeutig: treffer.length === 1 };
  },
  zeichen(r, F) {
    const klar = text(F, r, 'klartext');
    if (!klar) return null;
    const bild = pruefeBilder(F, r, (w) => w === klar, 'Wort „' + klar + '“');
    return { klartext: klar, zeichen: Array.from(klar).map((b) => (b === ' ' ? null : G.feenTeile(b))), bild };
  },
  kette(r, F) {
    const klar = text(F, r, 'klartext'), geheim = text(F, r, 'geheimtext');
    const ks = r.schluessel;
    if (!Array.isArray(ks) || ks.length < 2 || ks.some((k) => !Number.isInteger(k) || k < 1 || k > 25)) return F('kette: schluessel ist eine Liste von Zahlen 1 bis 25');
    if (!klar || !geheim) return null;
    let t = klar;
    const schritte = [];
    for (const k of ks) { t = G.schreiben(t, k); schritte.push({ schluessel: k, text: t }); }
    if (t !== geheim) F('Mit ' + ks.join(' und dann ') + ' wird „' + klar + '“ zu „' + t + '“, gedruckt ist „' + geheim + '“');
    const summe = ks.reduce((a, b) => a + b, 0);
    if (G.schreiben(klar, summe) !== geheim) F('Mit der Summe ' + summe + ' kommt nicht dasselbe heraus');
    return { klartext: klar, geheimtext: geheim, schluessel: ks, schritte, summe, wieEiner: summe % 26 };
  },
  liste(r, F) {
    const k = schluessel(F, r, 1, 25);
    if (!Array.isArray(r.woerter) || !r.woerter.length) return F('liste braucht woerter');
    const paare = [];
    for (const w of r.woerter) {
      const f = G.pruefeText(w);
      if (f) { F('„' + w + '“: ' + f); continue; }
      paare.push([w, G.schreiben(w, k)]);
    }
    if (new Set(r.woerter).size !== r.woerter.length) F('woerter doppelt');
    return { schluessel: k, paare };
  },
};

export default {
  art: 'geheim',
  pruefe(r, F) {
    if (!AUFGABEN.includes(r.aufgabe)) return F('aufgabe muss ' + AUFGABEN.join(', ') + ' sein');
    return pruefen[r.aufgabe](r, F);
  },
  bericht(r) {
    const l = r.loesung || {};
    if (r.aufgabe === 'kobold') return 'kobold: Stelle ' + l.stelle + ' ' + l.falsch + ' statt ' + l.richtig + ' (liest „' + l.falschesWort + '“), andere Reparaturen: ' + (l.auch || []).length;
    if (r.aufgabe === 'knacken') {
      const andere = (l.versuche || []).filter((v) => v.schluessel !== l.schluessel).map((v) => v.text);
      return 'knacken: ' + r.geheimtext + ' = ' + l.klartext + ' mit ' + l.schluessel + ', sonst z. B. ' + andere.slice(0, 3).join(' | ') + (l.haeufig ? '; häufigster ' + l.haeufig.buchstabe + ' ' + l.haeufig.anzahl + '-mal' : '');
    }
    if (r.aufgabe === 'kette') return 'kette: ' + r.klartext + ' mit ' + r.schluessel.join('+') + ' = ' + r.geheimtext + ' (wie ' + l.summe + ')';
    if (r.aufgabe === 'liste') return 'liste (' + l.schluessel + '): ' + (l.paare || []).map((p) => p.join('=')).join(' ');
    if (r.aufgabe === 'zeichen') return 'zeichen: ' + r.klartext + (l.bild ? ' (Bild ' + l.bild + ')' : '');
    return r.aufgabe + ': ' + r.klartext + ' mit ' + r.schluessel + ' = ' + r.geheimtext + (l.bild ? ' (Bild ' + l.bild + ')' : '');
  },
  // Die App bewertet nach dem Ergebnis mit web/kern/geheim.js: keine Lösungen in die Daten
  fuerApp(r) {
    const basis = { id: r.id, art: r.art, aufgabe: r.aufgabe };
    if (r.aufgabe === 'lesen') return { ...basis, geheimtext: r.geheimtext, schluessel: r.schluessel, bilder: r.bilder };
    if (r.aufgabe === 'schreiben') return { ...basis, klartext: r.klartext, schluessel: r.schluessel, bild: r.bild, tasten: r.tasten };
    if (r.aufgabe === 'knacken') return { ...basis, geheimtext: r.geheimtext, bilder: r.bilder, bereich: r.bereich };
    // Feen-Zeichen: nur die Zeichen (Form und Punkte), nicht das Wort; die App liest sie selbst zurück
    if (r.aufgabe === 'zeichen') return { ...basis, feen: G.feenCode(r.klartext), bilder: r.bilder };
    throw new Error('aufgabe „' + r.aufgabe + '“ gibt es in der App nicht (nur lesen, schreiben, knacken, zeichen)');
  },
};
