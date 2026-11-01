// Tests für Ausführer und Löser:  node --test tests/kern.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { K, kuerzeste, mitZauber, koboldPruefen, ablaufZaehlen } from '../werkzeuge/loeser.mjs';
import { pruefeAlle } from '../werkzeuge/raetsel.mjs';

const W3 = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 } };

test('Programme lesen und schreiben', () => {
  assert.deepEqual(K.lies('vor 3[vor rechts] links'), ['vor', { wdh: 3, befehle: ['vor', 'rechts'] }, 'links']);
  assert.equal(K.alsText(['vor', { wdh: 2, befehle: ['links'] }]), 'vor 2[links]');
  assert.equal(K.karten('vor 3[vor rechts]'), 4);
  assert.equal(K.ausrollen('2[vor links]').length, 4);
  assert.throws(() => K.lies('vor hüpf'));
  assert.throws(() => K.lies('6[vor]'));
  assert.throws(() => K.lies('1[vor]'));
});

test('Drehen bleibt im Feld, vor geht in Blickrichtung', () => {
  const W = K.welt(W3);
  assert.deepEqual(K.schritt(W, W.start, 'links'), { x: 0, y: 2, r: 3 });
  assert.deepEqual(K.schritt(W, W.start, 'rechts'), { x: 0, y: 2, r: 1 });
  assert.deepEqual(K.schritt(W, W.start, 'vor'), { x: 0, y: 1, r: 0 });
  // nach unten schauen: sein links ist von uns aus gesehen rechts
  const unten = { x: 1, y: 0, r: 2 };
  const l = K.schritt(W, unten, 'links');
  assert.equal(K.RICHTUNGEN[l.r], 'rechts');
});

test('Ausführen: ankommen, Rand, Hindernis', () => {
  assert.equal(K.ausfuehren(W3, 'vor vor rechts vor vor').geschafft, true);
  assert.equal(K.ausfuehren(W3, 'vor vor rechts vor').geschafft, false);
  const rand = K.ausfuehren(W3, 'vor vor vor');
  assert.equal(rand.stoss.art, 'rand');
  assert.equal(rand.stoss.nr, 2);
  const h = K.ausfuehren({ ...W3, hindernisse: [[0, 1]] }, 'vor');
  assert.equal(h.stoss.art, 'hindernis');
  assert.deepEqual(h.ende, { x: 0, y: 2, blick: 'oben' });
  // Wiederhol-Zauber: Stoß im Kasten wird mit Runde gemeldet
  const z = K.ausfuehren(W3, '3[vor]');
  assert.equal(z.stoss.teil, 0);
  assert.equal(z.stoss.runde, 2);
  assert.deepEqual(K.standNach(W3, 'vor vor rechts', 2), { x: 0, y: 0, blick: 'oben' });
});

test('Löser: kürzeste Programme zählen', () => {
  const k = kuerzeste(W3);
  assert.equal(k.laenge, 5);
  // Erst hinauf, dann nach rechts braucht 5 Befehle; erst nach rechts braucht 6 (rechts … links …).
  assert.equal(k.anzahl, 1);
  assert.deepEqual(k.programme[0], ['vor', 'vor', 'rechts', 'vor', 'vor']);
  // Hindernis zwingt einen Umweg
  const k2 = kuerzeste({ ...W3, hindernisse: [[0, 0]] });
  assert.ok(k2.laenge > 5);
  for (const p of k2.programme) assert.ok(K.ausfuehren({ ...W3, hindernisse: [[0, 0]] }, p).geschafft);
  // Edelsteine müssen alle eingesammelt werden
  const k3 = kuerzeste({ ...W3, edelsteine: [[2, 2]] });
  assert.equal(k3.laenge, 6);
  assert.equal(k3.anzahl, 1);
  assert.deepEqual(k3.programme[0], ['rechts', 'vor', 'vor', 'links', 'vor', 'vor']);
  assert.ok(K.ausfuehren({ ...W3, edelsteine: [[2, 2]] }, k3.programme[0]).geschafft);
  // unerreichbar
  assert.equal(kuerzeste({ ...W3, hindernisse: [[1, 0], [2, 1]] }).erreichbar, false);
});

test('Löser mit Wiederhol-Zauber', () => {
  const lang = { b: 5, h: 1, start: { x: 0, y: 0, blick: 'rechts' }, ziel: { x: 4, y: 0 } };
  const z = mitZauber(lang, 4);
  assert.equal(z.minKarten, 2); // 4[vor]
  assert.ok(z.kuerzeste.some((p) => K.alsText(p) === '4[vor]'));
});

test('Kobold: gemeinte und andere Reparaturen', () => {
  const k = koboldPruefen(W3, 'vor vor links vor vor', { art: 'tauschen', stelle: 3, befehl: 'rechts' });
  assert.equal(k.kaputt.stoss.art, 'rand');
  assert.deepEqual(k.gemeint, ['vor', 'vor', 'rechts', 'vor', 'vor']);
  assert.throws(() => koboldPruefen(W3, 'vor vor rechts vor vor', { art: 'loeschen', stelle: 1 }));
});

test('Ablauf-Karten zählen', () => {
  const a = ablaufZaehlen(['hose', 'socken', 'schuhe'], [['socken', 'schuhe'], ['hose', 'schuhe']]);
  assert.equal(a.anzahl, 2);
  assert.equal(K.pruefeReihenfolge([['socken', 'schuhe']], ['schuhe', 'socken']).ok, false);
});

test('Alle Rätsel in raetsel/ sind gültig', () => {
  const erg = pruefeAlle();
  assert.deepEqual(erg.fehler, []);
});

// =====================================================================
// Erweiterte Befehle (plan/lehrplan.md 7.8): Wenn-dann-Kasten, „bis zum Schatz“, Zaubersprüche
// =====================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mitRegeln, koboldErweitert, wendeReparaturAnBaum, stelleFinden, gleichesVerhalten } from '../werkzeuge/loeser.mjs';
import { webDaten } from '../werkzeuge/raetsel.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const befehle = (e) => e.schritte.map((s) => s.befehl).join(' ');

test('Lesen und Schreiben: hin und zurück', () => {
  const texte = [
    'vor', 'vor vor rechts 3[vor links]', 'wenn[stein: rechts]', 'wenn[stein: rechts sonst vor]',
    'wenn[frei-links: links vor sonst rechts rechts vor]', 'bis[vor]', 'bis[wenn[stein: rechts sonst vor]]',
    '@stern', 'vor @mond 2[@krone vor] bis[@stern wenn[stein-rechts: @mond sonst vor]]',
    '5[wenn[frei: vor] wenn[stein: links] rechts]', 'bis[vor wenn[frei-rechts: rechts vor]]',
  ];
  for (const t of texte) {
    assert.equal(K.alsText(t), t);
    assert.deepEqual(K.lies(K.alsText(K.lies(t))), K.lies(t));
  }
  // Leerzeichen sind egal, Daten-Form geht auch
  assert.equal(K.alsText('wenn [ stein :rechts  sonst vor ]  bis[ vor ]'), 'wenn[stein: rechts sonst vor] bis[vor]');
  assert.deepEqual(K.lies('wenn[stein: rechts sonst vor]'), [{ wenn: 'stein', dann: ['rechts'], sonst: ['vor'] }]);
  assert.deepEqual(K.lies('bis[vor]'), [{ bis: 'schatz', befehle: ['vor'] }]);
  assert.deepEqual(K.lies('@stern'), [{ spruch: 'stern' }]);
  assert.deepEqual(K.lies(['@stern', { wenn: 'frei', dann: ['vor'] }, { bis: true, befehle: ['vor'] }]),
    [{ spruch: 'stern' }, { wenn: 'frei', dann: ['vor'], sonst: [] }, { bis: 'schatz', befehle: ['vor'] }]);
  assert.equal(K.alsText([{ wdh: 2, befehle: ['vor', { wenn: 'stein', dann: ['links'], sonst: [] }] }]), '2[vor wenn[stein: links]]');
  assert.deepEqual(K.spruecheText({ stern: ['vor', 'vor'], mond: '2[links]' }), { stern: 'vor vor', mond: '2[links]' });
});

test('Lesen: Fehler bei falscher Verschachtelung und falschen Größen', () => {
  const falsch = {
    '3[2[vor]]': /Zauber-Kasten im Zauber-Kasten/,
    'bis[3[vor]]': /Zauber-Kasten im Zauber-Kasten/,
    '3[bis[vor]]': /Zauber-Kasten im Zauber-Kasten/,
    'wenn[stein: 2[vor]]': /nur Befehle/,
    'wenn[stein: wenn[frei: vor]]': /Wenn-dann-Kasten in einem Wenn-dann-Kasten/,
    'wenn[stein: ]': /fehlt ein Befehl/,
    'wenn[stein: vor vor vor vor]': /höchstens 3/,
    'wenn[stein: vor sonst vor vor vor vor]': /höchstens 3/,
    'wenn[nase: vor]': /Unbekannte Bedingung/,
    'wenn[stein rechts]': /„:“ fehlt/,
    'bis[]': /Leerer Zauber-Kasten/,
    'bis[vor vor vor vor]': /Höchstens 3/,
    '2[wenn[stein: rechts] vor vor vor]': /Höchstens 3 Teile/,
    '@hund': /Unbekannter Zauberspruch/,
    '@': /Unbekannter Zauberspruch/,
    'sonst vor': /sonst/,
    'vor ]': /„\]“ ohne/,
    '3[vor': /„\]“ fehlt/,
    'bis vor': /„\[“ fehlt/,
  };
  for (const [t, re] of Object.entries(falsch)) assert.throws(() => K.lies(t), re, t);
  // Zaubersprüche: 1 bis 4 Teile, kein Spruch im Spruch, nur stern, mond, krone
  assert.throws(() => K.liesSprueche({ stern: '@mond' }), /Kein Zauberspruch in einem Zauberspruch/);
  assert.throws(() => K.liesSprueche({ stern: '2[@mond]' }), /Kein Zauberspruch/);
  assert.throws(() => K.liesSprueche({ stern: 'wenn[stein: @mond]' }), /Kein Zauberspruch/);
  assert.throws(() => K.liesSprueche({ stern: 'vor vor vor vor vor' }), /höchstens 4 Teile/);
  assert.throws(() => K.liesSprueche({ stern: '' }), /leer/);
  assert.throws(() => K.liesSprueche({ sonne: 'vor' }), /Unbekannter Zauberspruch/);
  assert.deepEqual(K.liesSprueche({ stern: 'vor 3[vor] bis[vor] wenn[stein: rechts]' }).stern.length, 4);
});

test('Karten zählen: jede Form', () => {
  assert.equal(K.karten('vor links rechts'), 3);
  assert.equal(K.karten('@stern'), 1);
  assert.equal(K.karten('3[vor]'), 2);
  assert.equal(K.karten('bis[vor]'), 2);
  assert.equal(K.karten('wenn[stein: rechts]'), 2);
  assert.equal(K.karten('wenn[stein: rechts sonst vor]'), 3);
  assert.equal(K.karten('wenn[stein: rechts vor sonst links vor vor]'), 6);
  assert.equal(K.karten('bis[wenn[stein: rechts sonst vor]]'), 4);
  assert.equal(K.karten('3[wenn[stein: rechts sonst vor] vor]'), 5);
  assert.equal(K.karten('2[@stern vor]'), 3);
  // Ein Zauberspruch zählt einmal: 1 Karte (Name) plus sein Inhalt, jeder Aufruf 1 Karte
  assert.equal(K.karten('@stern @stern @stern', { stern: 'vor vor rechts' }), 3 + 1 + 3);
  assert.equal(K.karten('@stern @mond', { stern: '2[vor]', mond: 'wenn[stein: links sonst vor]' }), 2 + 3 + 4);
  assert.equal(K.teilKarten({ wenn: 'frei', dann: ['vor'], sonst: [] }), 2);
});

test('Bedingungen: Rand zählt wie Stein, links und rechts vom Drachen aus', () => {
  const W = K.welt({ b: 3, h: 3, start: { x: 0, y: 0 }, hindernisse: [[1, 1]] });
  const z = (x, y, blick) => ({ x, y, r: K.RICHTUNGEN.indexOf(blick) });
  // links oben, Blick nach oben: vor der Nase und links ist Rand, rechts frei
  assert.equal(K.bedingung(W, z(0, 0, 'oben'), 'stein'), true);
  assert.equal(K.bedingung(W, z(0, 0, 'oben'), 'frei'), false);
  assert.equal(K.bedingung(W, z(0, 0, 'oben'), 'stein-links'), true);
  assert.equal(K.bedingung(W, z(0, 0, 'oben'), 'frei-rechts'), true);
  assert.equal(K.bedingung(W, z(0, 0, 'oben'), 'stein-rechts'), false);
  // Blick nach rechts: vorne frei, links (= oben) Rand, rechts (= unten) frei
  assert.equal(K.bedingung(W, z(0, 0, 'rechts'), 'frei'), true);
  assert.equal(K.bedingung(W, z(0, 0, 'rechts'), 'stein-links'), true);
  assert.equal(K.bedingung(W, z(0, 0, 'rechts'), 'frei-rechts'), true);
  // Blick nach unten: sein Links ist von uns aus rechts
  assert.equal(K.bedingung(W, z(0, 1, 'unten'), 'stein-links'), true);    // (1,1) ist ein Stein
  assert.equal(K.bedingung(W, z(0, 1, 'unten'), 'stein-rechts'), true);   // Rand links
  assert.equal(K.bedingung(W, z(0, 1, 'rechts'), 'stein'), true);         // Stein vor der Nase
  assert.equal(K.bedingung(W, { x: 2, y: 2, blick: 'links' }, 'frei'), true);
  assert.deepEqual(K.bedingungFeld(W, z(1, 0, 'unten'), 'frei-rechts'), { x: 0, y: 0 });
  // Ein Wenn-dann-Kasten schaut nur, er stößt nie an
  const e = K.ausfuehren({ b: 1, h: 1, start: { x: 0, y: 0 }, ziel: { x: 0, y: 0 } }, 'wenn[stein: links sonst vor]');
  assert.equal(e.stoss, null);
  assert.equal(befehle(e), 'links');
  assert.equal(e.geschafft, true);
});

test('Wenn-dann: sonst leer, Stoß im dann-Zweig, Pfad zur Anzeige', () => {
  const W = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 } };
  // frei vor der Nase, ohne sonst: nichts passiert
  let e = K.ausfuehren(W, 'wenn[stein: rechts]');
  assert.equal(e.schritte.length, 0);
  assert.deepEqual(e.ereignisse.map((x) => x.art), ['wenn']);
  assert.equal(e.ereignisse[0].wahr, false);
  assert.deepEqual(e.ereignisse[0].feld, { x: 0, y: 1 });
  // Stoß im dann-Zweig: der zweite Befehl nach „dann“ stößt an den Rand
  e = K.ausfuehren(W, 'vor wenn[frei: vor vor]');
  assert.equal(e.stoss.art, 'rand');
  assert.equal(e.stoss.nr, 2);
  assert.equal(e.stoss.teil, 1);
  assert.equal(e.stoss.zweig, 'dann');
  assert.equal(e.stoss.zweigI, 1);
  assert.deepEqual(e.stoss.pfad, [{ in: 'programm', i: 1 }, { in: 'dann', i: 1 }]);
  assert.equal(e.geschafft, false);
  // im Zauber-Kasten: innen, runde wie früher, dazu zweig
  e = K.ausfuehren(W, '3[wenn[stein: rechts sonst vor]] vor vor');
  assert.equal(befehle(e), 'vor vor rechts vor vor');
  assert.equal(e.geschafft, true);
  assert.deepEqual([e.schritte[2].teil, e.schritte[2].innen, e.schritte[2].runde, e.schritte[2].zweig], [0, 0, 2, 'dann']);
  assert.deepEqual([e.schritte[1].teil, e.schritte[1].innen, e.schritte[1].runde, e.schritte[1].zweig], [0, 0, 1, 'sonst']);
  assert.deepEqual(e.schritte[2].pfad, [{ in: 'programm', i: 0 }, { in: 'kasten', i: 0, runde: 2 }, { in: 'dann', i: 0 }]);
});

test('bis zum Schatz: hört sofort auf, am Start schon da, läuft im Kreis', () => {
  // Ziel nach dem ersten Befehl der Runde erreicht: der Rest der Runde (der anstoßen würde) fällt weg
  const gang = { b: 1, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 0, y: 1 } };
  let e = K.ausfuehren(gang, 'bis[vor vor]');
  assert.equal(e.geschafft, true);
  assert.equal(e.schritte.length, 1);
  assert.equal(e.stoss, null);
  // geprüft nach jedem Befehl, auch in einem Wenn-dann-Kasten und in einem Spruch
  e = K.ausfuehren(gang, 'bis[@stern]', { sprueche: { stern: 'vor vor vor' } });
  assert.equal(e.schritte.length, 1);
  assert.equal(e.geschafft, true);
  // Danach geht das Programm weiter
  e = K.ausfuehren(gang, 'bis[vor] links');
  assert.equal(befehle(e), 'vor links');
  assert.equal(e.geschafft, true);
  // schon auf dem Schatz: der Kasten macht nichts
  e = K.ausfuehren({ b: 2, h: 1, start: { x: 0, y: 0, blick: 'rechts' }, ziel: { x: 1, y: 0 } }, 'vor bis[links]');
  assert.equal(befehle(e), 'vor');
  assert.equal(e.zuLang, false);
  // nie beim Schatz: höchstens 60 Befehle
  e = K.ausfuehren(gang, 'bis[links]');
  assert.equal(e.zuLang, true);
  assert.equal(e.schritte.length, K.MAX_SCHRITTE);
  assert.equal(e.geschafft, false);
  assert.equal(e.ereignisse[e.ereignisse.length - 1].art, 'zuLang');
  // eine Runde ohne Befehl hört nie auf: gleich „zu lang“
  e = K.ausfuehren(gang, 'bis[wenn[stein: links]]');
  assert.equal(e.zuLang, true);
  assert.equal(e.schritte.length, 0);
  // Stoß im Kasten wird mit Runde gemeldet
  e = K.ausfuehren({ b: 3, h: 1, start: { x: 0, y: 0, blick: 'rechts' }, ziel: { x: 2, y: 0 }, hindernisse: [[1, 0]] }, 'bis[vor]');
  assert.equal(e.stoss.art, 'hindernis');
  assert.equal(e.stoss.runde, 0);
  // Labyrinth: Hand an der rechten Wand
  const lab = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 3 }, hindernisse: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2]] };
  e = K.ausfuehren(lab, 'bis[wenn[frei-rechts: rechts] wenn[stein: links sonst vor]]', {});
  assert.equal(e.geschafft, true);
});

test('Höchstens 60 ausgeführte Befehle (auch mit Sprüchen im Kasten)', () => {
  const W = { b: 3, h: 3, start: { x: 1, y: 1 }, ziel: { x: 0, y: 0 } };
  const sp = { stern: '5[links rechts links]' };
  const e = K.ausfuehren(W, '5[@stern @stern @stern]', { sprueche: sp });
  assert.equal(e.zuLang, true);
  assert.equal(e.schritte.length, 60);
  assert.equal(K.ausfuehren(W, '4[@stern]', { sprueche: sp }).schritte.length, 60);
  assert.equal(K.ausfuehren(W, '4[@stern]', { sprueche: sp }).zuLang, false);
  assert.equal(K.ausfuehren(W, '4[@stern] links', { sprueche: sp }).zuLang, true);
});

test('Zaubersprüche: im Kasten, im Wenn-dann, Pfad und Nummern', () => {
  const W = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 0 } };
  const sp = { stern: 'vor rechts vor links' };
  const e = K.ausfuehren(W, '3[@stern]', { sprueche: sp });
  assert.equal(e.geschafft, true);
  assert.equal(e.schritte.length, 12);
  const s = e.schritte[5];   // Runde 2, zweiter Befehl im Spruch
  assert.deepEqual([s.befehl, s.teil, s.innen, s.runde, s.spruch, s.spruchI], ['rechts', 0, 0, 1, 'stern', 1]);
  assert.deepEqual(s.pfad, [{ in: 'programm', i: 0 }, { in: 'kasten', i: 0, runde: 1 }, { in: 'spruch', name: 'stern', i: 1 }]);
  assert.equal(e.ereignisse.filter((x) => x.art === 'spruch').length, 3);
  // Nummern beim Nachfragen zählen ausgeführte Befehle
  // vor (0,2), rechts, vor (1,2), links, vor (1,1), rechts …
  assert.deepEqual(K.standNach(W, '3[@stern]', 4, { sprueche: sp }), { x: 1, y: 2, blick: 'oben' });
  assert.deepEqual(K.standNach(W, '3[@stern]', 5, { sprueche: sp }), { x: 1, y: 1, blick: 'oben' });
  assert.deepEqual(K.standNach(W, '3[@stern]', 6, { sprueche: sp }), { x: 1, y: 1, blick: 'rechts' });
  assert.equal(K.standNach(W, '3[@stern]', 13, { sprueche: sp }), null);
  // Aufruf im Wenn-dann-Kasten
  const e2 = K.ausfuehren(W, '3[vor] wenn[stein: @mond]', { sprueche: { mond: 'rechts 3[vor]' } });
  assert.equal(e2.geschafft, true);
  assert.equal(e2.schritte[4].zweig, 'dann');
  assert.equal(e2.schritte[4].spruch, 'mond');
  // fehlender Spruch: klarer Fehler
  assert.throws(() => K.ausfuehren(W, '@krone', { sprueche: sp }), /Kronen-Spruch/);
  // ausrollen geht mit Sprüchen, aber nicht mit Wenn-dann oder bis
  assert.equal(K.ausrollen('2[@stern]', { sprueche: sp }).length, 8);
  assert.throws(() => K.ausrollen('bis[vor]'), /ausfuehren/);
  assert.throws(() => K.ausrollen('wenn[stein: vor]'), /ausfuehren/);
  assert.throws(() => K.ausrollen('@stern'), /Stern-Spruch/);
  // verwendet / einfach
  const v = K.verwendet('2[vor] @stern', { stern: 'wenn[frei-links: vor]' });
  assert.deepEqual([v.zauber, v.wenn, v.bis, v.spruch, v.bedingungen, v.aufrufe], [true, true, false, true, ['frei-links'], ['stern']]);
  assert.equal(K.einfach('vor 3[vor rechts]'), true);
  assert.equal(K.einfach('@stern'), false);
});

// Der Ausführer vor Block C (nur Befehle und Zauber-Kasten mit Zahl), als unabhängige Gegenprobe
function alterAusfuehrer(weltDaten, prog) {
  const W = K.welt(weltDaten);
  const liste = [];
  for (const [i, t] of K.lies(prog).entries()) {
    if (typeof t === 'string') liste.push({ befehl: t, teil: i, innen: null, runde: null });
    else for (let r = 0; r < t.wdh; r++) t.befehle.forEach((b, j) => liste.push({ befehl: b, teil: i, innen: j, runde: r }));
  }
  let z = { x: W.start.x, y: W.start.y, r: W.start.r };
  const offen = new Set(W.edelsteine);
  const schritte = [];
  let stoss = null;
  for (let i = 0; i < liste.length; i++) {
    const s = liste[i];
    const n = K.schritt(W, z, s.befehl);
    if (n.stoss) { stoss = { nr: i, teil: s.teil, innen: s.innen, runde: s.runde, art: n.stoss, befehl: s.befehl }; break; }
    schritte.push({ nr: i, befehl: s.befehl, teil: s.teil, innen: s.innen, runde: s.runde, nachher: { x: n.x, y: n.y, blick: K.RICHTUNGEN[n.r] } });
    z = n;
    offen.delete(z.x + ',' + z.y);
  }
  const amZiel = !!W.ziel && z.x === W.ziel.x && z.y === W.ziel.y;
  return { schritte, stoss, ende: { x: z.x, y: z.y, blick: K.RICHTUNGEN[z.r] }, geschafft: !stoss && amZiel && offen.size === 0, amZiel, gesammelt: W.edelsteine.length - offen.size };
}

test('Rückwärts verträglich: alle Programme und Lösungen aus e2–e5 laufen wie früher', () => {
  const erg = pruefeAlle();
  let n = 0;
  for (const r of Object.values(erg.raetsel)) {
    if (!/^e[2-5]$/.test(r.paket) || !r.b) continue;
    const w = { b: r.b, h: r.h, start: r.start, ziel: r.ziel, hindernisse: r.hindernisse, edelsteine: r.edelsteine };
    const L = r.loesung || {};
    const progs = [r.programm, r.lang, r.kurz, L.gemeint, L.beispiel].concat(L.programme || [], (L.zauber && L.zauber.kuerzeste) || [], (L.auch || []).map((a) => a.programm)).filter(Boolean);
    // dazu alle Programme bis 3 Befehle
    for (const a of K.BEFEHLE) for (const b of K.BEFEHLE) for (const c of K.BEFEHLE) progs.push([a, b, c]);
    for (const p of progs) {
      const alt = alterAusfuehrer(w, p), neu = K.ausfuehren(w, p);
      assert.deepEqual(neu.schritte.map((s) => ({ nr: s.nr, befehl: s.befehl, teil: s.teil, innen: s.innen, runde: s.runde, nachher: s.nachher })), alt.schritte, r.id + ' ' + K.alsText(p));
      assert.deepEqual(neu.stoss && { nr: neu.stoss.nr, teil: neu.stoss.teil, innen: neu.stoss.innen, runde: neu.stoss.runde, art: neu.stoss.art, befehl: neu.stoss.befehl }, alt.stoss);
      assert.deepEqual([neu.ende, neu.geschafft, neu.amZiel, neu.gesammelt, neu.zuLang], [alt.ende, alt.geschafft, alt.amZiel, alt.gesammelt, false]);
      // ausrollen wie früher
      if (K.lies(p).every((t) => typeof t === 'string' || t.wdh)) {
        assert.deepEqual(K.ausrollen(p).map((s) => [s.befehl, s.teil, s.innen, s.runde]),
          alterAusfuehrer({ b: 1, h: 1, start: { x: 0, y: 0 } }, 'links').schritte.length >= 0 ? K.lies(p).flatMap((t, i) => (typeof t === 'string' ? [[t, i, null, null]] : Array.from({ length: t.wdh }, (_, rr) => t.befehle.map((b, j) => [b, i, j, rr])).flat())) : null);
      }
      n++;
    }
  }
  assert.ok(n > 300, 'nur ' + n + ' Programme verglichen');
});

test('mitRegeln = mitZauber bei Einheit 5 (gleiche kleinste Kartenzahl und Anzahl)', () => {
  const e5 = JSON.parse(fs.readFileSync(path.join(WURZEL, 'raetsel', 'e5.json'), 'utf8'));
  for (const r of e5.raetsel.filter((x) => x.art === 'pfad')) {
    const w = { b: r.b, h: r.h, start: r.start, ziel: r.ziel, hindernisse: r.hindernisse, edelsteine: r.edelsteine };
    const a = mitZauber(w, r.maxKarten), b = mitRegeln(w, r.maxKarten, ['zauber']);
    assert.deepEqual([b.minKarten, b.anzahlMin], [a.minKarten, a.anzahlMin], r.id);
    // nur Befehle: wie die Breitensuche
    const k = kuerzeste(w), c = mitRegeln(w, 14, []);
    assert.deepEqual([c.minKarten, c.anzahlMin], [k.laenge, k.anzahl], r.id);
  }
});

// Alle Programme mit genau k Karten, ganz ohne Beschneiden (zum Gegenprüfen der Suche)
function* alleProgramme(k, erlaubt, bed, rufe, imSpruch = false) {
  const darf = new Set(erlaubt);
  const blaetter = K.BEFEHLE.concat(imSpruch ? [] : rufe.map((n) => '@' + n));
  function* folgen(l, n) { if (n === 0) { yield []; return; } for (const a of l) for (const r of folgen(l, n - 1)) yield [a].concat(r); }
  function* wenns(k) {
    if (!darf.has('wenn')) return;
    for (let d = 1; d <= 3; d++) {
      const s = k - 1 - d;
      if (s < 0 || s > 3) continue;
      for (const c of bed) for (const dann of folgen(blaetter, d)) for (const sonst of folgen(blaetter, s)) yield { wenn: c, dann, sonst };
    }
  }
  function* atome(k) { if (k === 1) yield* blaetter; else yield* wenns(k); }
  function* inhalte(k, n) {
    if (k === 0) { if (n > 0) yield []; return; }
    if (n >= 3) return;
    for (let c = 1; c <= k; c++) for (const a of atome(c)) for (const r of inhalte(k - c, n + 1)) yield [a].concat(r);
  }
  function* teile(k) {
    if (k === 1) yield* blaetter;
    yield* wenns(k);
    if (k >= 2 && darf.has('zauber')) for (const inh of inhalte(k - 1, 0)) for (let n = 2; n <= 5; n++) yield { wdh: n, befehle: inh };
    if (k >= 2 && darf.has('bis')) for (const inh of inhalte(k - 1, 0)) yield { bis: 'schatz', befehle: inh };
  }
  function* progs(k, n) {
    if (k === 0) { yield []; return; }
    if (imSpruch && n >= 4) return;
    for (let c = 1; c <= k; c++) for (const t of teile(c)) for (const r of progs(k - c, n + 1)) yield [t].concat(r);
  }
  yield* progs(k, 0);
}
function rohSuche(welten, maxK, erlaubt, bed, sprueche, frei) {
  const ok = (p, sp) => welten.every((w) => K.ausfuehren(w, p, { sprueche: sp }).geschafft);
  for (let k = 1; k <= maxK; k++) {
    let n = 0;
    for (const p of alleProgramme(k, erlaubt, bed, Object.keys(sprueche || {}))) if (ok(p, sprueche)) n++;
    // mit einem freien Spruch: Inhalt mit c Karten, Programm mit k - 1 - c Karten, das ihn aufruft
    if (frei) {
      for (let c = 1; c <= k - 2; c++) {
        for (const koerper of alleProgramme(c, erlaubt, bed, [], true)) {
          const sp = { ...(sprueche || {}), [frei]: koerper };
          for (const p of alleProgramme(k - 1 - c, erlaubt, bed, Object.keys(sp))) {
            if (K.alsText(p).includes('@' + frei) && ok(p, sp)) n++;
          }
        }
      }
    }
    if (n) return { min: k, anzahl: n };
  }
  return null;
}

test('mitRegeln: kleinste Kartenzahl und Anzahl stimmen mit dem Durchprobieren aller Programme', () => {
  const A = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 0 } };
  const L = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 2 }, hindernisse: [[1, 1], [1, 2]] };
  const E = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'rechts' }, ziel: { x: 2, y: 0 }, edelsteine: [[2, 2]] };
  const W1 = { b: 3, h: 3, start: { x: 1, y: 2, blick: 'oben' }, ziel: { x: 1, y: 0 } };
  const W2 = { b: 3, h: 3, start: { x: 1, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 }, hindernisse: [[1, 0]] };
  const G = { b: 6, h: 1, start: { x: 0, y: 0, blick: 'rechts' }, ziel: { x: 5, y: 0 } };
  const faelle = [
    [[A], 5, ['wenn', 'bis'], ['stein', 'frei']],
    [[A], 4, ['wenn', 'bis', 'zauber'], K.BEDINGUNGEN],
    [[L], 5, ['wenn', 'bis', 'zauber'], ['stein', 'frei']],
    [[E], 5, ['wenn', 'bis', 'zauber'], ['stein', 'frei', 'stein-links']],
    [[W1, W2], 5, ['wenn', 'bis', 'zauber'], ['stein', 'frei']],
    [[W1, W2], 6, ['wenn'], ['stein', 'frei', 'frei-rechts']],
    [[A], 5, ['spruch', 'wenn', 'bis'], ['stein', 'frei'], { stern: 'vor wenn[stein: rechts]' }],
    [[L], 5, ['spruch', 'zauber'], [], { mond: 'vor vor', krone: 'rechts vor' }],
    [[G], 5, ['spruch'], [], {}, 'stern'],
    [[G], 5, ['spruch', 'zauber'], [], {}, 'stern'],
    [[L], 6, ['spruch'], [], { mond: 'vor vor' }, 'krone'],
  ];
  for (const [ws, mk, erl, bed, sp, frei] of faelle) {
    const roh = rohSuche(ws, mk, erl, bed, sp, frei);
    const m = mitRegeln(ws, mk, erl, { bedingungen: bed, sprueche: sp, spruchFrei: frei ? [frei] : [] });
    assert.equal(m.vollstaendig, true);
    assert.deepEqual(m.erreichbar ? [m.minKarten, m.anzahlMin] : null, roh ? [roh.min, roh.anzahl] : null, erl.join('+') + ' ' + ws.length + ' Welt(en)' + (frei ? ' frei ' + frei : ''));
  }
});

test('mitRegeln: unerreichbar, Rechen-Grenze, mehrere freie Sprüche', () => {
  const A = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 0 } };
  const z = mitRegeln(A, 4, ['zauber']);
  assert.deepEqual([z.vollstaendig, z.erreichbar], [true, false]);
  const g = mitRegeln(A, 12, ['zauber', 'wenn', 'bis'], { bedingungen: K.BEDINGUNGEN, maxArbeit: 200000 });
  assert.equal(g.vollstaendig, true);   // schnell gefunden (4 Karten)
  const zuGross = mitRegeln({ b: 6, h: 6, start: { x: 0, y: 5 }, ziel: { x: 5, y: 0 }, hindernisse: [[2, 2], [3, 3]] }, 12, ['zauber', 'wenn', 'bis'], { bedingungen: K.BEDINGUNGEN, maxArbeit: 2000 });
  assert.equal(zuGross.vollstaendig, false);
  assert.match(zuGross.grund, /zu groß/);
  assert.equal(mitRegeln(A, 8, ['spruch'], { spruchFrei: ['stern', 'mond'] }).vollstaendig, false);
  assert.throws(() => mitRegeln(A, 4, ['hüpfen']), /Unbekannt in erlaubt/);
  // die gefundenen Programme kommen wirklich an (Gegenprobe ist eingebaut) und haben die kleinste Kartenzahl
  const m = mitRegeln(A, 6, ['wenn', 'bis']);
  for (const p of m.kuerzeste) assert.equal(K.karten(p.programm), m.minKarten);
});

test('Kobold mit Kästen: Stellen, Reparaturen, auch richtig', () => {
  const W = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 }, hindernisse: [[1, 2]] };
  const baum = { programm: K.lies('vor 2[vor wenn[stein: links sonst vor]]'), sprueche: K.liesSprueche({ stern: 'vor rechts' }) };
  assert.equal(stelleFinden(baum, '2.2.dann.1').liste[0], 'links');
  assert.equal(stelleFinden(baum, '2.2.sonst.1').ort, 'sonst');
  assert.equal(stelleFinden(baum, '@stern.2').liste[1], 'rechts');
  assert.equal(stelleFinden(baum, 2).i, 1);
  assert.throws(() => stelleFinden(baum, '1.2'), /kein Kasten/);
  assert.throws(() => stelleFinden(baum, '2.1.dann.1'), /an 2\.1 steht kein Kasten/);
  assert.throws(() => stelleFinden(baum, '2.dann.1'), /kein Wenn-dann-Kasten/);
  assert.throws(() => stelleFinden(baum, '2.2.dann'), /nach „dann“ fehlt die Nummer/);
  assert.throws(() => stelleFinden(baum, '@mond.1'), /den Spruch gibt es nicht/);
  assert.equal(K.alsText(wendeReparaturAnBaum(baum, { art: 'tauschen', stelle: '2.2.dann.1', befehl: 'rechts' }).programm), 'vor 2[vor wenn[stein: rechts sonst vor]]');
  assert.equal(K.alsText(wendeReparaturAnBaum(baum, { art: 'bedingung', stelle: '2.2', bedingung: 'frei' }).programm), 'vor 2[vor wenn[frei: links sonst vor]]');
  assert.equal(K.alsText(wendeReparaturAnBaum(baum, { art: 'zahl', stelle: '2', wdh: 4 }).programm), 'vor 4[vor wenn[stein: links sonst vor]]');
  assert.equal(K.alsText(wendeReparaturAnBaum(baum, { art: 'einfuegen', stelle: '2.2.sonst.2', befehl: '@stern' }).programm), 'vor 2[vor wenn[stein: links sonst vor @stern]]');
  assert.equal(K.alsText(wendeReparaturAnBaum(baum, { art: 'loeschen', stelle: '2.1' }).programm), 'vor 2[wenn[stein: links sonst vor]]');
  assert.throws(() => wendeReparaturAnBaum(baum, { art: 'loeschen', stelle: '2.2.dann.1' }), /fehlt ein Befehl/);
  assert.throws(() => wendeReparaturAnBaum(baum, { art: 'einfuegen', stelle: '@stern.1', befehl: '@stern' }), /Zauberspruch in einem Zauberspruch/);
  // Kobold: links statt rechts im Wenn-dann-Kasten
  const k = koboldErweitert(W, 'bis[wenn[stein: links sonst vor]]', {}, { art: 'tauschen', stelle: '1.1.dann.1', befehl: 'rechts' });
  assert.equal(k.kaputt.zuLang, true);
  assert.equal(k.gemeint.programm, 'bis[wenn[stein: rechts sonst vor]]');
  for (const a of k.auch) assert.ok(K.ausfuehren(W, a.programm, { sprueche: a.sprueche }).geschafft);
  // Fehler im Spruch
  const W2 = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 } };
  const k2 = koboldErweitert(W2, '@stern @stern', { stern: 'vor rechts links links' }, { art: 'tauschen', stelle: '@stern.3', befehl: 'vor' });
  assert.deepEqual(k2.gemeint, { programm: '@stern @stern', sprueche: { stern: 'vor rechts vor links' } });
  assert.equal(k2.kaputt.stoss.spruch, 'stern');
  for (const a of k2.auch) assert.ok(K.ausfuehren(W2, a.programm, { sprueche: a.sprueche }).geschafft);
  assert.throws(() => koboldErweitert(W2, '@stern @stern', { stern: 'vor rechts links links' }, { art: 'tauschen', stelle: '@stern.1', befehl: 'links' }), /kommt nicht an/);
  assert.throws(() => koboldErweitert(W2, '@stern @stern', { stern: 'vor rechts vor links' }, { art: 'tauschen', stelle: '@stern.1', befehl: 'links' }), /ohne Reparatur an/);
  // Streichen in „vor vor“: beide Stellen ergeben dasselbe Programm
  const k3 = koboldErweitert({ b: 1, h: 3, start: { x: 0, y: 2 }, ziel: { x: 0, y: 0 } }, '2[vor vor]', {}, { art: 'loeschen', stelle: '1.1' });
  assert.deepEqual(k3.gleicheStellen, ['1.1', '1.2']);
});

test('gleichesVerhalten: kuerzer mit Wenn-dann im Gitter', () => {
  const W = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 } };
  assert.equal(gleichesVerhalten(W, 'vor vor rechts vor vor', 'bis[wenn[stein: rechts sonst vor]]').gleich, true);
  assert.equal(gleichesVerhalten(W, 'vor vor rechts vor', 'bis[wenn[stein: rechts sonst vor]]').gleich, false);
  assert.equal(gleichesVerhalten(W, 'vor rechts vor rechts', '2[@stern]', { spruecheB: { stern: 'vor rechts' } }).gleich, true);
});

// Rätsel in einem eigenen Ordner prüfen (nicht im Repo)
function pruefeDatei(raetsel, web) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'werkstatt-test-'));
  fs.writeFileSync(path.join(ordner, 'e99.json'), JSON.stringify({ paket: 'e99', einheit: 99, titel: 'Test', raetsel, web }));
  try { return pruefeAlle(ordner); } finally { fs.rmSync(ordner, { recursive: true, force: true }); }
}

test('raetsel.mjs: pfad mit erweiterten Befehlen', () => {
  const A = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 0 } };
  const gut = { id: 't-bis', art: 'pfad', ...A, erlaubt: ['wenn', 'bis'], maxKarten: 4, beispiel: 'bis[wenn[stein: rechts sonst vor]]' };
  let e = pruefeDatei([gut]);
  assert.deepEqual(e.fehler, []);
  const l = e.raetsel['t-bis'].loesung;
  assert.equal(l.erweitert.minKarten, 4);
  assert.equal(l.erweitert.anzahlMin, 6);
  assert.equal(l.erweitert.beispielKarten, 4);
  assert.equal(l.erweitert.ohne.minKarten, null);
  // Grenze zu groß: ohne die neuen Kästen geht es auch
  e = pruefeDatei([{ ...gut, maxKarten: 7 }]);
  assert.match(e.fehler.join('\n'), /Ohne Wenn-dann-Kasten und Zauber-Kasten „bis zum Schatz“ geht es auch: mit 7 Karten/);
  // mit Zauber-Kasten: 3[vor] rechts 3[vor] = 5 Karten, die Grenze 4 erzwingt bis/wenn
  e = pruefeDatei([{ ...gut, erlaubt: ['zauber', 'wenn', 'bis'] }]);
  assert.deepEqual(e.fehler, []);
  e = pruefeDatei([{ ...gut, erlaubt: ['zauber', 'wenn', 'bis'], maxKarten: 5 }]);
  assert.match(e.fehler.join('\n'), /geht es auch: mit 5 Karten, z\. B\. 3\[vor\] rechts 3\[vor\]/);
  // Beispiel falsch, zu lang, mit verbotenem Kasten
  e = pruefeDatei([{ ...gut, beispiel: 'bis[wenn[stein: links sonst vor]] vor' }]);
  assert.match(e.fehler.join('\n'), /5 Karten, erlaubt sind 4/);
  e = pruefeDatei([{ ...gut, maxKarten: 6, beispiel: 'bis[wenn[frei: vor sonst links]] vor', erzwingt: [] }]);
  assert.match(e.fehler.join('\n'), /kommt nicht an \(Stoß bei Befehl/);
  e = pruefeDatei([{ ...gut, beispiel: '3[vor] rechts' }]);
  assert.match(e.fehler.join('\n'), /benutzt Zauber-Kasten/);
  e = pruefeDatei([{ ...gut, beispiel: 'bis[wenn[stein-rechts: vor sonst rechts]]' }]);
  assert.match(e.fehler.join('\n'), /Wenn-Karte „stein-rechts“/);
  // „Finde das kürzeste“: 6 kürzeste (mit gespiegelten Wenn-Karten) → nur mit mehrereLoesungen
  e = pruefeDatei([{ ...gut, aufgabe: 'kuerzestes' }]);
  assert.match(e.fehler.join('\n'), /es gibt 6 Programme mit 4 Karten/);
  e = pruefeDatei([{ ...gut, aufgabe: 'kuerzestes', mehrereLoesungen: true }]);
  assert.deepEqual(e.fehler, []);
  // ohne Beispiel: das erste kürzeste
  e = pruefeDatei([{ ...gut, beispiel: undefined }]);
  assert.equal(e.raetsel['t-bis'].loesung.beispiel, 'bis[vor wenn[stein: rechts]]');
  // Tippfehler in den Feldern
  e = pruefeDatei([{ ...gut, erlaubt: ['wenn', 'huepfen'] }]);
  assert.match(e.fehler.join('\n'), /Unbekannt in "erlaubt"/);
  e = pruefeDatei([{ ...gut, bedingungen: ['nase'] }]);
  assert.match(e.fehler.join('\n'), /Unbekannte Bedingung/);
  e = pruefeDatei([{ ...gut, zauber: true }]);
  assert.match(e.fehler.join('\n'), /"zauber" in erlaubt/);
});

test('raetsel.mjs: Zaubersprüche (vorgegeben, frei), mehrere Welten', () => {
  const T = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 0 }, hindernisse: [[0, 1], [0, 0], [1, 0], [1, 3], [2, 3], [3, 3], [2, 2], [3, 2], [3, 1]] };
  const frei = { id: 't-frei', art: 'pfad', ...T, erlaubt: ['spruch'], spruchFrei: ['mond'], maxKarten: 8, beispiel: '@mond @mond @mond', beispielSprueche: { mond: 'vor rechts vor links' } };
  let e = pruefeDatei([frei]);
  assert.deepEqual(e.fehler, []);
  assert.equal(e.raetsel['t-frei'].loesung.erweitert.minKarten, 8);
  assert.equal(e.raetsel['t-frei'].loesung.erweitert.anzahlMin, 1);
  assert.deepEqual(e.raetsel['t-frei'].loesung.sprueche, { mond: 'vor rechts vor links' });
  e = pruefeDatei([{ ...frei, beispielSprueche: undefined }]);
  assert.match(e.fehler.join('\n'), /beispielSprueche fehlt/);
  e = pruefeDatei([{ ...frei, beispielSprueche: { stern: 'vor' } }]);
  assert.match(e.fehler.join('\n'), /„stern“ steht nicht in spruchFrei/);
  const fest = { id: 't-fest', art: 'pfad', ...T, erlaubt: ['spruch'], sprueche: { stern: 'vor rechts vor links' }, maxKarten: 3, beispiel: '@stern @stern @stern' };
  e = pruefeDatei([fest]);
  assert.deepEqual(e.fehler, []);
  e = pruefeDatei([{ ...fest, erlaubt: [] }]);
  assert.match(e.fehler.join('\n'), /nur mit "spruch" in erlaubt/);
  e = pruefeDatei([{ ...fest, sprueche: undefined }]);
  assert.match(e.fehler.join('\n'), /kein Spruch|keinen Spruch|es gibt keinen Spruch/);
  // Ein Programm für zwei Welten
  const zwei = {
    id: 't-zwei', art: 'pfad', aufgabe: 'kuerzestes', b: 3, h: 3, start: { x: 1, y: 2, blick: 'oben' },
    welten: [{ ziel: { x: 1, y: 0 } }, { ziel: { x: 2, y: 0 }, hindernisse: [[1, 0]] }],
    erlaubt: ['wenn'], maxKarten: 6, beispiel: 'vor wenn[stein: rechts vor links] vor',
  };
  e = pruefeDatei([zwei]);
  assert.deepEqual(e.fehler, []);
  assert.equal(e.raetsel['t-zwei'].loesung.welten, 2);
  assert.equal(e.raetsel['t-zwei'].loesung.erweitert.anzahlMin, 1);
  e = pruefeDatei([{ ...zwei, beispiel: 'vor vor' }]);
  assert.match(e.fehler.join('\n'), /in Welt 2 nicht an/);
});

test('raetsel.mjs: lesen, kobold, kuerzer mit neuen Teilen', () => {
  const W = { b: 3, h: 2, start: { x: 0, y: 1, blick: 'oben' } };
  let e = pruefeDatei([{ id: 't-l', art: 'lesen', ...W, programm: '3[wenn[stein: rechts sonst vor]] vor', fragen: [3] }]);
  assert.deepEqual(e.fehler, []);
  // vor (0,0), Rand: rechts drehen, vor (1,0), dann vor (2,0)
  assert.deepEqual(e.raetsel['t-l'].loesung.nach[3], { x: 1, y: 0, blick: 'rechts' });
  assert.deepEqual(e.raetsel['t-l'].loesung.ende, { x: 2, y: 0, blick: 'rechts' });
  e = pruefeDatei([{ id: 't-l2', art: 'lesen', ...W, programm: 'bis[links]', ziel: { x: 2, y: 0 } }]);
  assert.match(e.fehler.join('\n'), /läuft im Kreis/);
  e = pruefeDatei([{ id: 't-l3', art: 'lesen', ...W, programm: 'bis[links]', ziel: { x: 2, y: 0 }, erwartetZuLang: true }]);
  assert.deepEqual(e.fehler, []);
  e = pruefeDatei([{ id: 't-l4', art: 'lesen', ...W, programm: '@stern vor', sprueche: { stern: 'vor rechts' } }]);
  assert.deepEqual(e.fehler, []);
  assert.deepEqual(e.raetsel['t-l4'].loesung.ende, { x: 1, y: 0, blick: 'rechts' });
  // Kobold mit Stelle im Wenn-dann-Kasten
  const K3 = { b: 3, h: 3, start: { x: 0, y: 2, blick: 'oben' }, ziel: { x: 2, y: 0 }, hindernisse: [[1, 2]] };
  e = pruefeDatei([{ id: 't-k', art: 'kobold', ...K3, programm: 'bis[wenn[stein: links sonst vor]]', reparatur: { art: 'tauschen', stelle: '1.1.dann.1', befehl: 'rechts' } }]);
  assert.deepEqual(e.fehler, []);
  assert.equal(e.raetsel['t-k'].loesung.erweitert, true);
  assert.equal(e.raetsel['t-k'].loesung.gemeint, 'bis[wenn[stein: rechts sonst vor]]');
  e = pruefeDatei([{ id: 't-k2', art: 'kobold', ...K3, programm: 'bis[wenn[stein: links sonst vor]]', reparatur: { art: 'bedingung', stelle: '1.1', bedingung: 'frei' } }]);
  assert.match(e.fehler.join('\n'), /kommt nicht an/);
  // ein erweiterter Kobold geht (noch) nicht in der App
  e = pruefeDatei([{ id: 't-k', art: 'kobold', ...K3, programm: 'bis[wenn[stein: links sonst vor]]', reparatur: { art: 'tauschen', stelle: '1.1.dann.1', befehl: 'rechts' } }], { titel: 'T', art: 'kobold', levels: ['t-k'] });
  assert.match(e.fehler.join('\n'), /nur Kobold-Programme aus Befehlen/);
  // kuerzer mit Spruch (zählt mit) und mit Wenn-dann (braucht ein Gitter)
  e = pruefeDatei([{ id: 't-ku', art: 'kuerzer', lang: 'vor vor rechts vor vor rechts vor vor rechts', kurz: '@stern @stern @stern', sprueche: { stern: 'vor vor rechts' } }]);
  assert.deepEqual(e.fehler, []);
  assert.equal(e.raetsel['t-ku'].loesung.kartenKurz, 7);
  e = pruefeDatei([{ id: 't-ku2', art: 'kuerzer', lang: 'vor vor rechts vor vor', kurz: 'bis[wenn[stein: rechts sonst vor]]' }]);
  assert.match(e.fehler.join('\n'), /braucht ein Gitter/);
  e = pruefeDatei([{ id: 't-ku3', art: 'kuerzer', b: 3, h: 3, start: { x: 0, y: 2 }, ziel: { x: 2, y: 0 }, lang: 'vor vor rechts vor vor', kurz: 'bis[wenn[stein: rechts sonst vor]]' }]);
  assert.deepEqual(e.fehler, []);
});

test('webDaten: keine Lösungen, aber was die App braucht', () => {
  const T = { b: 4, h: 4, start: { x: 0, y: 3, blick: 'oben' }, ziel: { x: 3, y: 0 }, hindernisse: [[0, 1], [0, 0], [1, 0], [1, 3], [2, 3], [3, 3], [2, 2], [3, 2], [3, 1]] };
  const erg = pruefeDatei([
    { id: 't-frei', art: 'pfad', ...T, erlaubt: ['spruch'], spruchFrei: ['mond'], maxKarten: 8, beispiel: '@mond @mond @mond', beispielSprueche: { mond: 'vor rechts vor links' } },
    { id: 't-bis', art: 'pfad', b: 4, h: 4, start: { x: 0, y: 3 }, ziel: { x: 3, y: 0 }, erlaubt: ['wenn', 'bis'], bedingungen: ['stein', 'frei', 'frei-rechts'], maxKarten: 4, beispiel: 'bis[wenn[stein: rechts sonst vor]]' },
  ], { titel: 'T', art: 'pfad', levels: ['t-frei', 't-bis'] });
  assert.deepEqual(erg.fehler, []);
  const [a, b] = webDaten(erg).pakete[0].levels;
  for (const l of [a, b]) {
    assert.equal(l.loesung, undefined);
    assert.equal(l.beispiel, undefined);
    assert.equal(l.beispielSprueche, undefined);
    assert.ok(!JSON.stringify(l).includes('vor rechts vor links'));
  }
  assert.deepEqual([a.erlaubt, a.spruchFrei, a.maxKarten, a.minKarten], [['spruch'], ['mond'], 8, 8]);
  assert.deepEqual([b.erlaubt, b.bedingungen, b.maxKarten, b.minKarten], [['wenn', 'bis'], ['stein', 'frei', 'frei-rechts'], 4, 4]);
});
