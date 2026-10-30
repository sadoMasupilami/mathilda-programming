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
