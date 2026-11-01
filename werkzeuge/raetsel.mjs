// Rätsel-Datenquelle prüfen und lösen: raetsel/*.json
//
//   node werkzeuge/raetsel.mjs           alle Rätsel prüfen, Bericht ausgeben (Abbruch bei Fehlern)
//   node werkzeuge/raetsel.mjs --json    zusätzlich das Ergebnis (mit Lösungen) als JSON ausgeben
//
// Dieselben Daten gehen an die Blätter (build.mjs) und an die Web-App (werkzeuge/web-bauen.mjs).
// Was „eindeutig“ heißt, steht in AUFTRAG.md Abschnitt 10 und in plan/lehrplan.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as LOESER from './loeser.mjs';
import { K, kuerzeste, mitZauber, koboldPruefen, ablaufZaehlen } from './loeser.mjs';
import '../web/kern/bilder.js';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORDNER = path.join(WURZEL, 'raetsel');
const ARTEN_ORDNER = path.join(WURZEL, 'werkzeuge', 'arten');
const MAX_BEFEHLE = 12;          // eine Programm-Reihe am Papier
const WELT_FELDER = ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine'];

export function weltVon(r) {
  const w = {};
  for (const f of WELT_FELDER) if (r[f] !== undefined) w[f] = r[f];
  return w;
}
// Mehrere Welten ("welten": [{…}, {…}]: ein Programm muss in allen ankommen). Fehlende Felder einer Welt
// kommen aus dem Rätsel selbst (z. B. b, h, start gemeinsam, nur die Steine verschieden). Ohne welten: das eine Gitter.
export function weltenVon(r) {
  if (r.welten === undefined) return [weltVon(r)];
  return r.welten.map((w) => ({ ...weltVon(r), ...weltVon(w || {}) }));
}
const WORT = { zauber: 'Zauber-Kasten', wenn: 'Wenn-dann-Kasten', bis: 'Zauber-Kasten „bis zum Schatz“', spruch: 'Zauberspruch' };
const wortListe = (l) => l.map((x) => WORT[x] || x).join(' und ');
const loesText = (p) => p.programm + (p.sprueche && Object.keys(p.sprueche).length ? ' mit ' + Object.entries(p.sprueche).map(([n, t]) => '@' + n + ' = ' + t).join(', ') : '');
const warum = (e) => (e.stoss ? ' (Stoß bei Befehl ' + (e.stoss.nr + 1) + ')' : e.zuLang ? ' (läuft im Kreis: mehr als ' + K.MAX_SCHRITTE + ' Befehle)' : !e.amZiel ? ' (nicht am Ziel)' : ' (Edelsteine fehlen)');

// ---------------------------------------------------------------------
// pfad mit erweiterten Befehlen (plan/lehrplan.md 7.8) und/oder mehreren Welten
//   erlaubt:      ["zauber", "wenn", "bis", "spruch"] – was das Kind benutzen darf (die App bietet genau das an)
//   bedingungen:  Wenn-Karten (Standard ["stein", "frei"])
//   maxKarten:    Kartengrenze (Standard 12); muss erzwingen, dass es ohne die neuen Kästen nicht geht
//   erzwingt:     welche Kästen die Grenze erzwingen muss (Standard: alle neuen aus erlaubt)
//   beispiel:     ein Programm, das ankommt (Kartenzahl ≤ maxKarten); mit spruchFrei dazu beispielSprueche
//   sprueche:     vorgegebene Zaubersprüche { "stern": "vor vor links" } (zählen nicht als Karten)
//   spruchFrei:   ["stern"] – diesen Spruch schreibt das Kind selbst (zählt: 1 Karte + Inhalt)
//   welten:       mehrere Gitter, ein Programm für alle
// ---------------------------------------------------------------------
function pruefePfadErweitert(r, F) {
  const erlaubt = r.erlaubt === undefined ? [] : r.erlaubt;
  if (!Array.isArray(erlaubt)) return F('"erlaubt" muss eine Liste sein, z. B. ["zauber", "wenn", "bis"]');
  for (const e of erlaubt) if (!LOESER.ERLAUBT_NAMEN.includes(e)) return F('Unbekannt in "erlaubt": „' + e + '“ (' + LOESER.ERLAUBT_NAMEN.join(', ') + ')');
  if (r.zauber) return F('Mit "erlaubt" bitte kein "zauber": true, sondern "zauber" in erlaubt');
  if (r.maxBefehle !== undefined) return F('Mit "erlaubt"/"welten" gilt maxKarten statt maxBefehle');
  if (r.welten !== undefined && (!Array.isArray(r.welten) || r.welten.length < 1 || r.welten.length > 4)) return F('"welten" muss eine Liste mit 1 bis 4 Gittern sein');
  const welten = weltenVon(r);
  const welt = (i) => (welten.length > 1 ? 'Welt ' + (i + 1) + ': ' : '');
  for (const [i, w] of welten.entries()) {
    try { K.welt(w); } catch (e) { return F(welt(i) + e.message); }
    if (!w.ziel) return F(welt(i) + 'Ziel fehlt');
  }
  const aufgabe = r.aufgabe || 'ankommen';
  if (!['kuerzestes', 'ankommen'].includes(aufgabe)) return F('aufgabe muss „kuerzestes“ oder „ankommen“ sein');
  let bed = [];
  if (erlaubt.includes('wenn')) {
    bed = r.bedingungen ?? LOESER.STANDARD_BEDINGUNGEN;
    if (!Array.isArray(bed) || !bed.length) return F('"bedingungen" muss eine Liste sein, z. B. ["stein", "frei"]');
    for (const c of bed) if (!K.BEDINGUNGEN.includes(c)) return F('Unbekannte Bedingung „' + c + '“ (' + K.BEDINGUNGEN.join(', ') + ')');
  } else if (r.bedingungen !== undefined) return F('"bedingungen" nur mit "wenn" in erlaubt');
  let fest;
  try { fest = K.liesSprueche(r.sprueche); } catch (e) { return F('sprueche: ' + e.message); }
  const frei = r.spruchFrei ?? [];
  if (!Array.isArray(frei)) return F('"spruchFrei" muss eine Liste sein, z. B. ["stern"]');
  for (const n of frei) {
    if (!K.SPRUCH_NAMEN.includes(n)) return F('spruchFrei: unbekannter Spruch „' + n + '“ (' + K.SPRUCH_NAMEN.join(', ') + ')');
    if (fest[n]) return F('„' + n + '“ steht in sprueche und in spruchFrei');
  }
  const mitSpruch = erlaubt.includes('spruch');
  if (mitSpruch && !Object.keys(fest).length && !frei.length) return F('"spruch" ist erlaubt, aber es gibt keinen Spruch: "sprueche" (vorgegeben) oder "spruchFrei" (das Kind schreibt ihn)');
  if (!mitSpruch && (Object.keys(fest).length || frei.length)) return F('"sprueche"/"spruchFrei" nur mit "spruch" in erlaubt');
  const maxK = r.maxKarten ?? MAX_BEFEHLE;
  if (!Number.isInteger(maxK) || maxK < 1 || maxK > MAX_BEFEHLE) return F('maxKarten: 1 bis ' + MAX_BEFEHLE);
  const erzwingt = r.erzwingt ?? erlaubt.filter((x) => LOESER.NEUE_KAESTEN.includes(x));
  if (!Array.isArray(erzwingt)) return F('"erzwingt" muss eine Liste sein');
  for (const e of erzwingt) if (!erlaubt.includes(e)) return F('erzwingt: „' + e + '“ steht nicht in erlaubt');
  const opt = { bedingungen: bed, sprueche: r.sprueche || {}, spruchFrei: frei };
  const ew = { erlaubt, bedingungen: bed, maxKarten: maxK, erzwingt, spruchFrei: frei, sprueche: K.spruecheText(fest) };
  const l = { welten: welten.length, erweitert: ew };
  // Kürzestes Programm nur aus Befehlen (eine Welt, wie bisher)
  if (welten.length === 1) {
    const k = kuerzeste(welten[0]);
    if (k.erreichbar) Object.assign(l, { laenge: k.laenge, anzahl: k.anzahl, programme: k.programme, eindeutig: k.anzahl === 1 });
  }
  // Beispiel: kommt an, nur erlaubte Bausteine, Kartenzahl ≤ maxKarten
  if (r.beispiel !== undefined) {
    let p, bsp;
    try { p = K.lies(r.beispiel); bsp = K.liesSprueche(r.beispielSprueche); } catch (e) { return F('beispiel: ' + e.message); }
    for (const n of Object.keys(bsp)) if (!frei.includes(n)) F('beispielSprueche: „' + n + '“ steht nicht in spruchFrei');
    if (r.beispielSprueche !== undefined && !frei.length) F('"beispielSprueche" nur mit "spruchFrei"');
    const v = K.verwendet(p, bsp);
    for (const x of ['zauber', 'wenn', 'bis', 'spruch']) if (v[x] && !erlaubt.includes(x)) F('beispiel benutzt ' + WORT[x] + ', das ist hier nicht erlaubt');
    for (const c of v.bedingungen) if (!bed.includes(c)) F('beispiel benutzt die Wenn-Karte „' + c + '“ (nicht in bedingungen)');
    for (const n of v.aufrufe) if (!fest[n] && !bsp[n]) F('beispiel ruft @' + n + ' auf, den Spruch gibt es nicht' + (frei.includes(n) ? ' (beispielSprueche fehlt)' : ''));
    const karten = K.karten(p, bsp);
    if (karten > maxK) F('beispiel braucht ' + karten + ' Karten, erlaubt sind ' + maxK);
    const sp = { ...(r.sprueche || {}), ...(r.beispielSprueche || {}) };
    for (const [i, w] of welten.entries()) {
      let e;
      try { e = K.ausfuehren(w, p, { sprueche: sp }); } catch (x) { F('beispiel: ' + x.message); continue; }
      if (!e.geschafft) F('Das Beispielprogramm kommt ' + (welten.length > 1 ? 'in Welt ' + (i + 1) + ' ' : '') + 'nicht an' + warum(e) + ': ' + K.alsText(p));
    }
    l.beispiel = K.alsText(p);
    Object.assign(ew, { beispiel: l.beispiel, beispielSprueche: K.spruecheText(bsp), beispielKarten: karten });
  }
  // Ohne die neuen Kästen darf es mit maxKarten nicht gehen
  if (erzwingt.length) {
    const basis = erlaubt.filter((x) => !erzwingt.includes(x));
    const o = LOESER.mitRegeln(welten, maxK, basis, { ...opt, spruchFrei: basis.includes('spruch') ? frei : [] });
    ew.ohne = { erlaubt: basis, vollstaendig: o.vollstaendig, minKarten: o.erreichbar ? o.minKarten : null };
    if (!o.vollstaendig) F('Kann nicht beweisen, dass es ohne ' + wortListe(erzwingt) + ' mit ' + maxK + ' Karten nicht geht (' + o.grund + '). maxKarten kleiner machen oder "erzwingt" anpassen');
    else if (o.erreichbar) F('Ohne ' + wortListe(erzwingt) + ' geht es auch: mit ' + o.minKarten + ' Karten, z. B. ' + o.kuerzeste.slice(0, 2).map(loesText).join(' | ') + '. maxKarten kleiner machen');
  }
  // Kleinste Kartenzahl mit allem, was erlaubt ist
  const m = LOESER.mitRegeln(welten, maxK, erlaubt, opt);
  Object.assign(ew, { vollstaendig: m.vollstaendig, grund: m.grund || null, minKarten: m.erreichbar ? m.minKarten : null, anzahlMin: m.erreichbar ? m.anzahlMin : null, kuerzeste: m.erreichbar ? m.kuerzeste : [] });
  if (m.vollstaendig && !m.erreichbar) F('Mit höchstens ' + maxK + ' Karten nicht lösbar');
  if (r.beispiel === undefined) {
    if (m.erreichbar) {
      l.beispiel = m.kuerzeste[0].programm;
      Object.assign(ew, { beispiel: l.beispiel, beispielSprueche: m.kuerzeste[0].sprueche, beispielKarten: m.minKarten });
    } else if (!m.vollstaendig) F('"beispiel" fehlt, und der Löser findet keine Lösung (' + m.grund + ')');
  }
  if (aufgabe === 'kuerzestes') {
    if (!m.vollstaendig) F('„Finde das kürzeste“: Der Löser kann nicht alle Programme durchsuchen (' + m.grund + '). "aufgabe": "ankommen" nehmen oder das Rätsel kleiner machen');
    else if (m.erreichbar) {
      if (m.anzahlMin > 1 && !r.mehrereLoesungen) F('„Finde das kürzeste“: es gibt ' + m.anzahlMin + ' Programme mit ' + m.minKarten + ' Karten' + (bed.length > 1 ? ' (gespiegelte Wenn-Karten zählen mit: wenn[stein: A sonst B] = wenn[frei: B sonst A])' : '') + ', z. B. ' + m.kuerzeste.slice(0, 3).map(loesText).join(' | ') + '. Rätsel ändern oder "mehrereLoesungen": true');
      if (m.anzahlMin === 1 && r.mehrereLoesungen) F('„mehrereLoesungen“ ist gesetzt, aber es gibt genau ein kürzestes Programm');
      if (ew.beispielKarten > m.minKarten) F('Das Beispiel braucht ' + ew.beispielKarten + ' Karten, das kürzeste nur ' + m.minKarten + ' (z. B. ' + loesText(m.kuerzeste[0]) + ')');
    }
  }
  // Sprüche zum Ausführen des gezeigten Beispiels (Blätter: roter Weg)
  l.sprueche = { ...ew.sprueche, ...(ew.beispielSprueche || {}) };
  return l;
}

function pruefePfad(r, F) {
  if (r.erlaubt !== undefined || r.welten !== undefined) return pruefePfadErweitert(r, F);
  const w = weltVon(r);
  K.welt(w);
  const aufgabe = r.aufgabe || 'ankommen';
  if (!['kuerzestes', 'ankommen'].includes(aufgabe)) return F('aufgabe muss „kuerzestes“ oder „ankommen“ sein');
  const k = kuerzeste(w);
  if (!k.erreichbar) return F('Ziel ist nicht erreichbar');
  const max = r.maxBefehle ?? MAX_BEFEHLE;
  if (max > MAX_BEFEHLE) F('maxBefehle höchstens ' + MAX_BEFEHLE + ' (eine Programm-Reihe)');
  if (!r.zauber && k.laenge > max) F('Kürzestes Programm hat ' + k.laenge + ' Befehle, erlaubt sind ' + max);
  const l = { laenge: k.laenge, anzahl: k.anzahl, programme: k.programme, eindeutig: k.anzahl === 1 };
  if (aufgabe === 'kuerzestes') {
    if (k.anzahl > 1 && !r.mehrereLoesungen) F('„Finde das kürzeste“: es gibt ' + k.anzahl + ' kürzeste Programme (' + k.laenge + ' Befehle), z. B. ' + k.programme.slice(0, 3).map((p) => p.join(' ')).join(' | ') + '. Rätsel ändern oder "mehrereLoesungen": true');
    if (k.anzahl === 1 && r.mehrereLoesungen) F('„mehrereLoesungen“ ist gesetzt, aber es gibt genau ein kürzestes Programm');
  }
  if (r.zauber) {
    const maxK = r.maxKarten ?? Math.min(8, k.laenge);
    const z = mitZauber(w, maxK, { maxInnen: K.MAX_INNEN });
    if (!z.erreichbar) F('Mit höchstens ' + maxK + ' Karten nicht lösbar');
    else {
      l.zauber = { maxKarten: maxK, minKarten: z.minKarten, anzahlMin: z.anzahlMin, kuerzeste: z.kuerzeste.map(K.alsText), minKartenMitKasten: z.minKartenMitKasten, anzahlBisMax: z.anzahlBis(maxK) };
      if (z.anzahlMin > 1 && !r.mehrereLoesungen && r.aufgabe === 'kuerzestes') F('Mit Wiederhol-Zauber gibt es ' + z.anzahlMin + ' Programme mit ' + z.minKarten + ' Karten (' + z.kuerzeste.slice(0, 3).map(K.alsText).join(' | ') + '). Rätsel ändern oder "mehrereLoesungen": true');
      if (r.maxKarten && z.minKartenMitKasten === null) F('Mit ' + maxK + ' Karten geht es nur ohne Zauber-Kasten – Grenze zu groß');
      if (r.maxKarten && k.laenge <= r.maxKarten) F('Ohne Zauber-Kasten geht es auch mit ' + k.laenge + ' Karten – die Grenze maxKarten zwingt keinen Wiederhol-Zauber');
    }
  }
  if (r.beispiel) {
    const e = K.ausfuehren(w, r.beispiel);
    if (!e.geschafft) F('Das angegebene Beispielprogramm kommt nicht an: ' + K.alsText(r.beispiel));
    l.beispiel = K.alsText(r.beispiel);
  }
  return l;
}

function pruefeLesen(r, F) {
  const w = weltVon(r);
  K.welt(w);
  if (!r.programm) return F('lesen braucht ein programm');
  const p = K.lies(r.programm);
  let sp;
  try { sp = K.liesSprueche(r.sprueche); } catch (e) { return F('sprueche: ' + e.message); }
  const flach = p.every((t) => typeof t === 'string');
  if (flach && p.length > MAX_BEFEHLE) F('Programm länger als ' + MAX_BEFEHLE + ' Befehle');
  if (!flach && K.karten(p) > MAX_BEFEHLE) F('Programm hat ' + K.karten(p) + ' Karten (höchstens ' + MAX_BEFEHLE + ' in einer Reihe)');
  const e = K.ausfuehren(w, p, { sprueche: sp });
  if (e.stoss && !r.erwartetStoss) F('Der Drache stößt bei Befehl ' + (e.stoss.nr + 1) + ' an (' + e.stoss.art + ')');
  if (!e.stoss && r.erwartetStoss) F('„erwartetStoss“ gesetzt, aber der Drache stößt nirgends an');
  if (e.zuLang && !r.erwartetZuLang) F('Der Drache läuft im Kreis (mehr als ' + K.MAX_SCHRITTE + ' Befehle); gewollt? Dann "erwartetZuLang": true');
  if (!e.zuLang && r.erwartetZuLang) F('„erwartetZuLang“ gesetzt, aber das Programm hört von selbst auf');
  const nach = {};
  for (const n of r.fragen || []) {
    const s = K.standNach(w, p, n, { sprueche: sp });
    if (!s) F('Nach ' + n + ' Befehlen gibt es keinen Stand (Stoß vorher?)');
    nach[n] = s;
  }
  if (r.ziel && r.mussAnkommen !== false && !e.geschafft && !r.erwartetStoss && !r.erwartetZuLang) F('Programm kommt nicht am Ziel an (sonst "mussAnkommen": false)');
  return { programm: K.alsText(p), sprueche: K.spruecheText(sp), ende: e.ende, stoss: e.stoss, zuLang: e.zuLang, geschafft: e.geschafft, nach, weg: e.schritte.map((s) => s.nachher), befehle: e.schritte.length };
}

function pruefeKobold(r, F) {
  const w = weltVon(r);
  K.welt(w);
  if (!r.programm || !r.reparatur) return F('kobold braucht programm und reparatur');
  const p = K.lies(r.programm);
  const rp = r.reparatur;
  const einfach = r.sprueche === undefined && r.welten === undefined && p.every((t) => typeof t === 'string') && typeof rp.stelle === 'number' &&
    ['tauschen', 'loeschen', 'einfuegen'].includes(rp.art) && (rp.befehl === undefined || K.BEFEHLE.includes(rp.befehl));
  if (!einfach) return pruefeKoboldErweitert(r, p, F);
  if (p.length > MAX_BEFEHLE) F('Programm länger als ' + MAX_BEFEHLE + ' Befehle');
  const k = koboldPruefen(w, p, r.reparatur);
  if (k.gemeint.length > MAX_BEFEHLE) F('Repariertes Programm länger als ' + MAX_BEFEHLE + ' Befehle');
  return {
    programm: p,
    reparatur: r.reparatur,
    gemeint: k.gemeint,
    gleicheStellen: k.gleicheStellen,
    kaputt: { stoss: k.kaputt.stoss, ende: k.kaputt.ende, amZiel: k.kaputt.amZiel },
    auch: k.auch.map((a) => ({ reparatur: a.reparatur, programm: a.programm })),
  };
}

// Kobold mit Kästen, Sprüchen oder mehreren Welten: Stellen wie "3.dann.1" (werkzeuge/loeser.mjs, koboldErweitert)
function pruefeKoboldErweitert(r, p, F) {
  const welten = weltenVon(r);
  for (const [i, w] of welten.entries()) { try { K.welt(w); } catch (e) { return F('Welt ' + (i + 1) + ': ' + e.message); } if (!w.ziel) return F('Ziel fehlt'); }
  let sp;
  try { sp = K.liesSprueche(r.sprueche); } catch (e) { return F('sprueche: ' + e.message); }
  if (K.karten(p) > MAX_BEFEHLE) F('Programm hat mehr als ' + MAX_BEFEHLE + ' Karten');
  const bed = r.bedingungen ?? [...new Set(LOESER.STANDARD_BEDINGUNGEN.concat(K.verwendet(p, sp).bedingungen))];
  const k = LOESER.koboldErweitert(welten, p, sp, r.reparatur, { bedingungen: bed });
  if (K.karten(k.gemeint.programm) > MAX_BEFEHLE) F('Repariertes Programm hat mehr als ' + MAX_BEFEHLE + ' Karten');
  return {
    erweitert: true,
    programm: K.alsText(p),
    sprueche: K.spruecheText(sp),
    reparatur: r.reparatur,
    gemeint: k.gemeint.programm,
    gemeintSprueche: k.gemeint.sprueche,
    gleicheStellen: k.gleicheStellen,
    kaputt: { stoss: k.kaputt.stoss, zuLang: k.kaputt.zuLang, ende: k.kaputt.ende, amZiel: k.kaputt.amZiel },
    kaputtWelten: k.kaputtWelten,
    auch: k.auch,
  };
}

function pruefeAblauf(r, F) {
  if (!Array.isArray(r.karten) || r.karten.length < 2) return F('ablauf braucht mindestens 2 karten');
  const ids = r.karten.map((k) => k.id);
  if (new Set(ids).size !== ids.length) F('Karten-ids doppelt');
  if (ids.length > 8) F('Höchstens 8 Ablauf-Karten');
  for (const k of r.karten) if (k.bild && !globalThis.WerkstattBilder.hat(k.bild)) F('Unbekanntes Bild „' + k.bild + '“ (web/kern/bilder.js)');
  const a = ablaufZaehlen(ids, r.regeln || []);
  if (!a.anzahl) return F('Keine Reihenfolge erfüllt alle Regeln');
  if (a.anzahl > 1 && !r.mehrereLoesungen) F('Es gibt ' + a.anzahl + ' gültige Reihenfolgen, z. B. ' + a.loesungen.slice(0, 3).map((l) => l.join('→')).join(' | ') + '. Regel ergänzen oder "mehrereLoesungen": true');
  if (a.anzahl === 1 && r.mehrereLoesungen) F('„mehrereLoesungen“ gesetzt, aber es gibt genau eine Reihenfolge');
  if (r.loesung) {
    const t = K.pruefeReihenfolge(r.regeln || [], r.loesung);
    if (!t.ok || r.loesung.length !== ids.length) F('Angegebene Lösung verletzt eine Regel');
  }
  // Paare, deren Reihenfolge egal ist (in manchen gültigen Reihenfolgen so, in anderen anders)
  const egal = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const vorne = a.loesungen.filter((l) => l.indexOf(ids[i]) < l.indexOf(ids[j])).length;
    if (vorne > 0 && vorne < a.loesungen.length) egal.push([ids[i], ids[j]]);
  }
  if (a.anzahl > a.loesungen.length) F('Zu viele Reihenfolgen zum Auflisten (' + a.anzahl + ')');
  return { anzahl: a.anzahl, loesungen: a.loesungen, eindeutig: a.anzahl === 1, egal, beispiel: r.loesung || a.loesungen[0] };
}

// kurz darf Zauber-Kästen, Zaubersprüche ("sprueche", zählen mit: 1 Karte + Inhalt) und, mit einem Gitter,
// auch Wenn-dann-Kästen und „bis zum Schatz“ haben (dann zählt, was der Drache in diesem Gitter macht).
function pruefeKuerzer(r, F) {
  if (!r.lang || !r.kurz) return F('kuerzer braucht lang und kurz');
  const lang = K.lies(r.lang), kurz = K.lies(r.kurz);
  let sp;
  try { sp = K.liesSprueche(r.sprueche); } catch (e) { return F('sprueche: ' + e.message); }
  const vk = K.verwendet(kurz, sp);
  if (!vk.wenn && !vk.bis) {
    const a = K.ausrollen(lang).map((s) => s.befehl).join(' ');
    const b = K.ausrollen(kurz, { sprueche: sp }).map((s) => s.befehl).join(' ');
    if (a !== b) F('kurz macht nicht dasselbe wie lang: ' + a + ' ≠ ' + b);
  } else if (!r.b && !r.welten) return F('kurz mit Wenn-dann-Kasten oder „bis zum Schatz“ braucht ein Gitter (b, h, start …): was der Drache macht, hängt davon ab');
  else {
    const g = LOESER.gleichesVerhalten(weltenVon(r), lang, kurz, { spruecheB: sp });
    if (!g.gleich) F('kurz macht im Gitter nicht dasselbe wie lang: ' + g.a + ' ≠ ' + g.b);
  }
  if (lang.some((t) => typeof t !== 'string')) F('lang soll ohne Zauber-Kasten sein');
  if (K.karten(kurz, sp) >= K.karten(lang)) F('kurz ist nicht kürzer');
  if (lang.length > MAX_BEFEHLE) F('lang hat mehr als ' + MAX_BEFEHLE + ' Befehle');
  if (r.b) {
    const e = K.ausfuehren(weltVon(r), lang);
    if (e.stoss) F('Der Drache stößt an (Befehl ' + (e.stoss.nr + 1) + ')');
    if (r.ziel && !e.geschafft) F('Programm kommt nicht am Ziel an');
  }
  return { lang: K.alsText(lang), kurz: K.alsText(kurz), kartenLang: K.karten(lang), kartenKurz: K.karten(kurz, sp), sprueche: K.spruecheText(sp) };
}

const ARTEN = { pfad: pruefePfad, lesen: pruefeLesen, kobold: pruefeKobold, ablauf: pruefeAblauf, kuerzer: pruefeKuerzer };

// ---------------------------------------------------------------------
// Weitere Rätselarten als Plugins: werkzeuge/arten/<name>.mjs (eine Datei pro Art oder Einheit)
//   export default { art: 'geheim', pruefe(r, F, ctx), bericht(r)?, fuerApp(r)? }   (oder ein Array davon)
//   pruefe:  prüft und löst das Rätsel r, meldet Fehler mit F('…'), gibt die Lösung zurück (r.loesung)
//   bericht: kurze Zeile für --bericht
//   fuerApp: was die Web-App von einem Level bekommt (ohne Lösungen!). Standard: alles außer
//            loesung, paket und den Feldern in geheim: ['…'] des Plugins
//   ctx:     { K, LOESER, weltVon, MAX_BEFEHLE, bildDa }
// Die Logik, die auch die Web-App braucht (z. B. Geheimschrift verschieben), gehört nach web/kern/<name>.js
// und wird hier wie der Ausführer importiert: import '../../web/kern/<name>.js'
// ---------------------------------------------------------------------
const PLUGINS = {};
const PLUGIN_FEHLER = [];
if (fs.existsSync(ARTEN_ORDNER)) {
  for (const d of fs.readdirSync(ARTEN_ORDNER).filter((x) => x.endsWith('.mjs')).sort()) {
    try {
      const m = await import(pathToFileURL(path.join(ARTEN_ORDNER, d)).href);
      const liste = Array.isArray(m.default) ? m.default : [m.default];
      for (const p of liste) {
        if (!p || !p.art || typeof p.pruefe !== 'function') { PLUGIN_FEHLER.push('werkzeuge/arten/' + d + ': export default { art, pruefe } fehlt'); continue; }
        if (ARTEN[p.art] || PLUGINS[p.art]) { PLUGIN_FEHLER.push('werkzeuge/arten/' + d + ': Art „' + p.art + '“ gibt es schon'); continue; }
        PLUGINS[p.art] = { ...p, datei: d };
      }
    } catch (e) {
      PLUGIN_FEHLER.push('werkzeuge/arten/' + d + ': lässt sich nicht laden: ' + e.message);
    }
  }
}
const CTX = { K, LOESER, weltVon, MAX_BEFEHLE, bildDa: (n) => globalThis.WerkstattBilder.hat(n) };
export const alleArten = () => Object.keys(ARTEN).concat(Object.keys(PLUGINS));
export const plugin = (art) => PLUGINS[art] || null;

export function pruefeAlle(ordner = ORDNER) {
  const fehler = PLUGIN_FEHLER.slice();
  const raetsel = {};
  const pakete = {};
  const dateien = fs.existsSync(ordner) ? fs.readdirSync(ordner).filter((d) => d.endsWith('.json')).sort() : [];
  for (const d of dateien) {
    let daten;
    try { daten = JSON.parse(fs.readFileSync(path.join(ordner, d), 'utf8')); } catch (e) { fehler.push(d + ': JSON kaputt: ' + e.message); continue; }
    const paket = daten.paket;
    if (!/^e\d+$/.test(paket || '')) fehler.push(d + ': "paket" fehlt (z. B. "e2")');
    for (const r of daten.raetsel || []) {
      const F = (m) => { fehler.push(d + ' › ' + (r.id || '?') + ': ' + m); };
      if (!r.id) { F('Rätsel ohne id'); continue; }
      if (raetsel[r.id]) { F('id doppelt'); continue; }
      const pl = PLUGINS[r.art];
      const fn = ARTEN[r.art] || (pl && ((x, f) => pl.pruefe(x, f, CTX)));
      if (!fn) { F('Unbekannte art „' + r.art + '“ (' + alleArten().join(', ') + ')'); continue; }
      let loesung;
      try { loesung = fn(r, F); } catch (e) { F(e.message + (pl ? ' (werkzeuge/arten/' + pl.datei + ')' : '')); }
      raetsel[r.id] = { ...r, paket, loesung: loesung || null };
    }
    if (daten.web) {
      for (const id of daten.web.levels || []) {
        if (!raetsel[id]) fehler.push(d + ': Web-Level „' + id + '“ gibt es nicht');
        // In der App kann man einen Befehl nur austauschen (kein Einfügen, kein Streichen)
        else if (raetsel[id].art === 'kobold' && raetsel[id].reparatur && raetsel[id].reparatur.art !== 'tauschen') fehler.push(d + ': Web-Level „' + id + '“: in der App geht nur „tauschen“');
        else if (raetsel[id].art === 'kobold' && raetsel[id].loesung && raetsel[id].loesung.erweitert) fehler.push(d + ': Web-Level „' + id + '“: in der App gehen (noch) nur Kobold-Programme aus Befehlen');
      }
    }
    pakete[paket] = { paket, einheit: daten.einheit, titel: daten.titel, web: daten.web || null };
  }
  return { fehler, raetsel, pakete };
}

// Kurzfassung für die Web-App: nur was die App braucht (keine Lösungen außer der kürzesten Länge)
export function webDaten(erg) {
  const aus = { pakete: [] };
  for (const p of Object.values(erg.pakete).sort((a, b) => a.einheit - b.einheit)) {
    if (!p.web || !p.einheit) continue; // Einheit 0 = Muster, nicht in der App
    aus.pakete.push({
      paket: p.paket, einheit: p.einheit, titel: p.web.titel || p.titel, art: p.web.art,
      levels: p.web.levels.map((id) => {
        const r = erg.raetsel[id];
        const pl = PLUGINS[r.art];
        if (pl) {
          // Plugin-Arten: fuerApp entscheidet, sonst alles außer Lösung, Paket und den geheimen Feldern
          if (pl.fuerApp) return pl.fuerApp(r, CTX);
          const aus = { ...r };
          for (const f of ['loesung', 'paket'].concat(pl.geheim || [])) delete aus[f];
          return aus;
        }
        // keine Lösungen in die App: sie bewertet nur nach dem Ergebnis
        const { loesung, paket, reparatur, beispiel, beispielSprueche, ...rest } = r;
        void paket; void reparatur; void beispiel; void beispielSprueche;
        if (r.art === 'ablauf') delete rest.loesung;
        const l = {};
        if (r.art === 'pfad') {
          // kuerzeste = Befehle ohne Kästen; bei erweiterten Rätseln zählt nur minKarten (Karten mit Kästen)
          if (loesung.laenge !== undefined && !loesung.erweitert) l.kuerzeste = loesung.laenge;
          if (loesung.zauber) l.minKarten = loesung.zauber.minKarten;
          // erweitert: kleinste Kartenzahl nur, wenn der Löser sie bewiesen hat (für „Geht es auch mit … Karten?“)
          if (loesung.erweitert && loesung.erweitert.vollstaendig && loesung.erweitert.minKarten) l.minKarten = loesung.erweitert.minKarten;
        }
        return { ...rest, ...l };
      }),
    });
  }
  return aus;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const erg = pruefeAlle();
  const n = Object.keys(erg.raetsel).length;
  const proArt = {};
  for (const r of Object.values(erg.raetsel)) proArt[r.art] = (proArt[r.art] || 0) + 1;
  console.log('🧩 ' + n + ' Rätsel geprüft: ' + Object.entries(proArt).map(([a, k]) => k + ' ' + a).join(', '));
  if (process.argv.includes('--json')) console.log(JSON.stringify(erg, null, 1));
  if (process.argv.includes('--bericht')) {
    for (const r of Object.values(erg.raetsel)) {
      const l = r.loesung || {};
      let t = '';
      if (r.art === 'pfad' && !l.erweitert) t = 'kürzestes ' + l.laenge + ' Befehle, ' + l.anzahl + '× (' + (l.programme || []).slice(0, 2).map((p) => p.join(' ')).join(' | ') + ')' + (l.zauber ? ', mit Zauber ' + l.zauber.minKarten + ' Karten (' + l.zauber.anzahlMin + '×): ' + l.zauber.kuerzeste.slice(0, 2).join(' | ') : '');
      if (r.art === 'pfad' && l.erweitert) {
        const ew = l.erweitert;
        t = (l.welten > 1 ? l.welten + ' Welten, ' : '') + '[' + ew.erlaubt.join('+') + '] ≤ ' + ew.maxKarten + ' Karten: ' +
          (ew.vollstaendig ? (ew.minKarten ? 'kleinste ' + ew.minKarten + ' (' + ew.anzahlMin + '×): ' + ew.kuerzeste.slice(0, 2).map(loesText).join(' | ') : 'keine') : 'Suche zu groß, nur Beispiel geprüft') +
          (ew.ohne ? '; ohne ' + ew.erzwingt.join('+') + ': ' + (ew.ohne.minKarten ? ew.ohne.minKarten + ' Karten' : 'nicht mit ' + ew.maxKarten) : '') +
          (r.beispiel ? '; Beispiel ' + ew.beispielKarten + ' Karten' : '');
      }
      if (r.art === 'kobold') t = 'gemeint: ' + (Array.isArray(l.gemeint) ? l.gemeint.join(' ') : l.gemeint || '') + '; auch: ' + (l.auch || []).length;
      if (r.art === 'ablauf') t = l.anzahl + ' Reihenfolge(n)';
      if (r.art === 'lesen') t = 'Ende ' + JSON.stringify(l.ende);
      if (r.art === 'kuerzer') t = l.kartenLang + ' → ' + l.kartenKurz + ' Karten';
      if (PLUGINS[r.art]) { try { t = PLUGINS[r.art].bericht ? String(PLUGINS[r.art].bericht(r, CTX)) : JSON.stringify(l).slice(0, 90); } catch (e) { t = '(bericht: ' + e.message + ')'; } }
      console.log('  ' + r.id.padEnd(20) + r.art.padEnd(10) + t);
    }
  }
  if (erg.fehler.length) {
    console.log('\n❌ ' + erg.fehler.length + ' Fehler:');
    for (const f of erg.fehler) console.log('  • ' + f);
    process.exit(1);
  }
  console.log('✅ Alle Rätsel eindeutig oder gekennzeichnet.');
}
