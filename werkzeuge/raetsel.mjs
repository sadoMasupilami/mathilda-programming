// Rätsel-Datenquelle prüfen und lösen: raetsel/*.json
//
//   node werkzeuge/raetsel.mjs           alle Rätsel prüfen, Bericht ausgeben (Abbruch bei Fehlern)
//   node werkzeuge/raetsel.mjs --json    zusätzlich das Ergebnis (mit Lösungen) als JSON ausgeben
//
// Dieselben Daten gehen an die Blätter (build.mjs) und an die Web-App (werkzeuge/web-bauen.mjs).
// Was „eindeutig“ heißt, steht in AUFTRAG.md Abschnitt 10 und in plan/lehrplan.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { K, kuerzeste, mitZauber, koboldPruefen, ablaufZaehlen } from './loeser.mjs';
import '../web/kern/bilder.js';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORDNER = path.join(WURZEL, 'raetsel');
const MAX_BEFEHLE = 12;          // eine Programm-Reihe am Papier
const WELT_FELDER = ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine'];

export function weltVon(r) {
  const w = {};
  for (const f of WELT_FELDER) if (r[f] !== undefined) w[f] = r[f];
  return w;
}

function pruefePfad(r, F) {
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
  if (K.ausrollen(p).length > MAX_BEFEHLE && !p.some((t) => typeof t !== 'string')) F('Programm länger als ' + MAX_BEFEHLE + ' Befehle');
  const e = K.ausfuehren(w, p);
  if (e.stoss && !r.erwartetStoss) F('Der Drache stößt bei Befehl ' + (e.stoss.nr + 1) + ' an (' + e.stoss.art + ')');
  if (!e.stoss && r.erwartetStoss) F('„erwartetStoss“ gesetzt, aber der Drache stößt nirgends an');
  const nach = {};
  for (const n of r.fragen || []) {
    const s = K.standNach(w, p, n);
    if (!s) F('Nach ' + n + ' Befehlen gibt es keinen Stand (Stoß vorher?)');
    nach[n] = s;
  }
  if (r.ziel && r.mussAnkommen !== false && !e.geschafft && !r.erwartetStoss) F('Programm kommt nicht am Ziel an (sonst "mussAnkommen": false)');
  return { programm: K.alsText(p), ende: e.ende, stoss: e.stoss, geschafft: e.geschafft, nach, weg: e.schritte.map((s) => s.nachher) };
}

function pruefeKobold(r, F) {
  const w = weltVon(r);
  K.welt(w);
  if (!r.programm || !r.reparatur) return F('kobold braucht programm und reparatur');
  const p = K.lies(r.programm);
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

function pruefeKuerzer(r, F) {
  if (!r.lang || !r.kurz) return F('kuerzer braucht lang und kurz');
  const lang = K.lies(r.lang), kurz = K.lies(r.kurz);
  const a = K.ausrollen(lang).map((s) => s.befehl).join(' ');
  const b = K.ausrollen(kurz).map((s) => s.befehl).join(' ');
  if (a !== b) F('kurz macht nicht dasselbe wie lang: ' + a + ' ≠ ' + b);
  if (lang.some((t) => typeof t !== 'string')) F('lang soll ohne Zauber-Kasten sein');
  if (K.karten(kurz) >= K.karten(lang)) F('kurz ist nicht kürzer');
  if (lang.length > MAX_BEFEHLE) F('lang hat mehr als ' + MAX_BEFEHLE + ' Befehle');
  if (r.b) {
    const e = K.ausfuehren(weltVon(r), lang);
    if (e.stoss) F('Der Drache stößt an (Befehl ' + (e.stoss.nr + 1) + ')');
    if (r.ziel && !e.geschafft) F('Programm kommt nicht am Ziel an');
  }
  return { lang: K.alsText(lang), kurz: K.alsText(kurz), kartenLang: K.karten(lang), kartenKurz: K.karten(kurz) };
}

const ARTEN = { pfad: pruefePfad, lesen: pruefeLesen, kobold: pruefeKobold, ablauf: pruefeAblauf, kuerzer: pruefeKuerzer };

export function pruefeAlle(ordner = ORDNER) {
  const fehler = [];
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
      const fn = ARTEN[r.art];
      if (!fn) { F('Unbekannte art „' + r.art + '“ (' + Object.keys(ARTEN).join(', ') + ')'); continue; }
      let loesung;
      try { loesung = fn(r, F); } catch (e) { F(e.message); }
      raetsel[r.id] = { ...r, paket, loesung: loesung || null };
    }
    if (daten.web) {
      for (const id of daten.web.levels || []) {
        if (!raetsel[id]) fehler.push(d + ': Web-Level „' + id + '“ gibt es nicht');
        // In der App kann man einen Befehl nur austauschen (kein Einfügen, kein Streichen)
        else if (raetsel[id].art === 'kobold' && raetsel[id].reparatur && raetsel[id].reparatur.art !== 'tauschen') fehler.push(d + ': Web-Level „' + id + '“: in der App geht nur „tauschen“');
      }
      if (!daten.schluesselwort || !/^[A-Za-z]+$/.test(daten.schluesselwort)) fehler.push(d + ': Schlüsselwort fehlt oder hat andere Zeichen als A–Z');
    }
    pakete[paket] = { paket, einheit: daten.einheit, titel: daten.titel, schluesselwort: daten.schluesselwort, web: daten.web || null };
  }
  const worte = Object.values(pakete).map((p) => (p.schluesselwort || '').toLowerCase()).filter(Boolean);
  if (new Set(worte).size !== worte.length) fehler.push('Zwei Pakete haben dasselbe Schlüsselwort');
  return { fehler, raetsel, pakete };
}

// Kurzfassung für die Web-App: nur was die App braucht (keine Lösungen außer der kürzesten Länge)
export function webDaten(erg) {
  const aus = { pakete: [] };
  for (const p of Object.values(erg.pakete).sort((a, b) => a.einheit - b.einheit)) {
    if (!p.web || !p.einheit) continue; // Einheit 0 = Muster, nicht in der App
    aus.pakete.push({
      paket: p.paket, einheit: p.einheit, titel: p.web.titel || p.titel, art: p.web.art,
      schluesselwort: p.schluesselwort,
      levels: p.web.levels.map((id) => {
        const r = erg.raetsel[id];
        // keine Lösungen in die App: sie bewertet nur nach dem Ergebnis
        const { loesung, paket, reparatur, beispiel, ...rest } = r;
        void paket; void reparatur; void beispiel;
        if (r.art === 'ablauf') delete rest.loesung;
        const l = {};
        if (r.art === 'pfad') { l.kuerzeste = loesung.laenge; if (loesung.zauber) l.minKarten = loesung.zauber.minKarten; }
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
      if (r.art === 'pfad') t = 'kürzestes ' + l.laenge + ' Befehle, ' + l.anzahl + '× (' + (l.programme || []).slice(0, 2).map((p) => p.join(' ')).join(' | ') + ')' + (l.zauber ? ', mit Zauber ' + l.zauber.minKarten + ' Karten (' + l.zauber.anzahlMin + '×): ' + l.zauber.kuerzeste.slice(0, 2).join(' | ') : '');
      if (r.art === 'kobold') t = 'gemeint: ' + (l.gemeint || []).join(' ') + '; auch: ' + (l.auch || []).length;
      if (r.art === 'ablauf') t = l.anzahl + ' Reihenfolge(n)';
      if (r.art === 'lesen') t = 'Ende ' + JSON.stringify(l.ende);
      if (r.art === 'kuerzer') t = l.kartenLang + ' → ' + l.kartenKurz + ' Karten';
      console.log('  ' + r.id.padEnd(20) + r.art.padEnd(9) + t);
    }
  }
  if (erg.fehler.length) {
    console.log('\n❌ ' + erg.fehler.length + ' Fehler:');
    for (const f of erg.fehler) console.log('  • ' + f);
    process.exit(1);
  }
  console.log('✅ Alle Rätsel eindeutig oder gekennzeichnet.');
}
