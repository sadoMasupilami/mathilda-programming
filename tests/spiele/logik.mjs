// Test-Plugin für die Rätselart „logik“ (Einheit 12, Paket e12) – eingebunden von tests/web.spec.mjs.
// Die Lösungen rechnet der Test selbst mit dem Kern aus (web/kern/logik.js: Backtracking bzw. Sätze am Bild);
// die App kennt keine Lösungen. Jede neue Ansicht wird mit h.ansicht fotografiert und geprüft.
import '../../web/kern/logik.js';

const LG = globalThis.WerkstattLogik;
const FOLGE = ['', 'nein', 'ja'];       // ein Tipp: leer -> Kreuz -> Kreis -> leer
const zelle = (a, x) => '.feld .logik-zelle[data-z="' + a + '"][data-s="' + x + '"]';
const satzTaste = (i) => '.programm .logik-wf[data-i="' + i + '"]';
const istWF = (lv) => lv.aufgabe === 'wahrfalsch';

function loesung(lv) {
  const e = LG.loese(lv);
  if (e.anzahl !== 1) throw new Error(lv.id + ': ' + e.anzahl + ' Lösungen statt einer');
  return e.loesungen[0];
}
// Ziel-Zustand: Kreise der Zuordnung zu, sonst Kreuze (oder leer)
function zielVon(lv, zu, mitKreuzen = true) {
  const z = {};
  for (const a of lv.zeilen) for (const x of lv.spalten) z[a + '|' + x] = zu[a] === x ? 'ja' : mitKreuzen ? 'nein' : '';
  return z;
}
function wahrheit(lv) {
  const hatFn = LG.szeneHat(lv.szene);
  return lv.aussagen.map((a) => LG.wert(LG.liesRegel(a.regel), hatFn));
}
// Alle Zuordnungen (Permutationen der Spalten)
function zuordnungen(lv) {
  const aus = [];
  (function weiter(i, zu, frei) {
    if (i === lv.zeilen.length) { aus.push(Object.assign({}, zu)); return; }
    for (const x of frei) { zu[lv.zeilen[i]] = x; weiter(i + 1, zu, frei.filter((y) => y !== x)); }
  })(0, {}, lv.spalten);
  return aus;
}

// Tipps in Runden: [[Selektor, Anzahl]]. Dieselbe Taste kommt nie zweimal direkt hintereinander,
// sonst hält der Doppeltipp-Schutz der App (data-umschalter, 350 ms) den zweiten Tipp an. Notfalls warten.
async function tippeRunden(page, h, tipps) {
  let letzte = null;
  const max = Math.max(0, ...tipps.map((t) => t[1]));
  for (let r = 1; r <= max; r++) {
    for (const [sel, n] of tipps) {
      if (n < r) continue;
      if (sel === letzte) await page.waitForTimeout(420);
      await h.tippe(page, sel);
      letzte = sel;
    }
  }
}
// Gitter vom Zustand im Bild in den Ziel-Zustand bringen (zählt die nötigen Tipps pro Feld)
async function setzeGitter(page, h, ziel) {
  const jetzt = await page.$$eval('.feld .logik-zelle', (els) => els.map((e) => [e.dataset.z, e.dataset.s, e.dataset.wert || '']));
  const tipps = [];
  for (const [a, x, w] of jetzt) {
    const n = (FOLGE.indexOf(ziel[a + '|' + x] || '') - FOLGE.indexOf(w) + 3) % 3;
    if (n) tipps.push([zelle(a, x), n]);
  }
  await tippeRunden(page, h, tipps);
}
// Wahr oder falsch: Antworten setzen (ein Tipp: wahr, zwei Tipps: falsch, vom leeren Zustand aus)
async function setzeSaetze(page, h, antworten) {
  await tippeRunden(page, h, antworten.map((w, i) => [satzTaste(i), w ? 1 : 2]));
}
async function gitterWerte(page) {
  return page.$$eval('.feld .logik-zelle', (els) => els.map((e) => e.dataset.wert || ''));
}

// Ein Level per Antippen lösen, bis das Geschafft-Fenster kommt
export async function spiele(page, lv, h, info, fotos) {
  if (istWF(lv)) {
    await setzeSaetze(page, h, wahrheit(lv));
    if (fotos) await h.ansicht(page, 'logik-wf-gesetzt', info);
  } else {
    await setzeGitter(page, h, zielVon(lv, loesung(lv)));
    if (fotos) await h.ansicht(page, 'logik-ausgefuellt', info);
  }
  await h.tippe(page, '.tasten [data-aktion="los"]');
}

export function tests({ test, expect, h }) {
  const gitter3 = h.suche('logik', (l) => !istWF(l) && l.zeilen.length === 3 && !l.vorgabe && l.hinweise.length >= 2);
  const kobold = h.suche('logik', (l) => !istWF(l) && l.vorgabe);
  const profi = h.suche('logik', (l) => !istWF(l) && l.zeilen.length === 4);
  const wf = h.suche('logik', (l) => istWF(l));
  const meldung = (page) => page.locator('.meldung');

  test('Logikgitter: freundliche Hinweise statt „falsch“, Nochmal, Doppeltipp', async ({ page }, info) => {
    test.skip(!gitter3, 'kein 3 · 3-Gitter');
    const lv = gitter3.lv;
    const [a0, a1] = lv.zeilen, [x0, x1] = lv.spalten;
    await h.oeffneLevel(page, gitter3, info);
    await expect(page.locator('.feld .logik-zelle')).toHaveCount(9);
    await expect(page.locator('.programm .logik-hinweise li')).toHaveCount(lv.hinweise.length);
    // In der App gibt es keine Lösung
    const daten = await page.evaluate(() => JSON.stringify(window.WERKSTATT_DATEN.pakete.map((p) => p.levels.filter((l) => l.art === 'logik'))));
    expect(daten).toContain('"hinweise":');
    expect(daten).not.toMatch(/"(loesung|zuordnung|marken|kobold|ueberfluessig|noetig|falscherHinweis|soll|werte)":/);

    // „Los“ ohne Kreis
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(meldung(page)).toContainText('Noch kein Kreis');

    // Doppeltipp schaltet nur einen Schritt weiter (leer -> Kreuz), nicht gleich zum Kreis
    await h.doppeltipp(page, zelle(a0, x0));
    await expect(page.locator(zelle(a0, x0))).toHaveAttribute('data-wert', 'nein');
    await expect(page.locator(zelle(a0, x0))).toHaveAttribute('aria-label', /Kreuz$/);

    // Zwei Kreise in einer Reihe: Reihe gelb, freundlicher Satz
    await setzeGitter(page, h, { [a0 + '|' + x0]: 'ja', [a0 + '|' + x1]: 'ja' });
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('nur ein Kreis');
    await expect(page.locator('.logik-kopf.logik-markiert[data-z="' + a0 + '"]')).toBeVisible();
    await expect(page.locator('.dialog')).toHaveCount(0);
    await h.ansicht(page, 'logik-zwei-kreise', info);
    // Ein Tipp ins Gitter nimmt die gelbe Markierung weg
    await h.tippe(page, zelle(a1, x0));
    await expect(page.locator('.feld .logik-markiert')).toHaveCount(0);

    // Nochmal: alles leer
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    expect((await gitterWerte(page)).every((w) => w === '')).toBe(true);

    // Eine Reihe ohne Kreis
    const zu = loesung(lv);
    const ohne = lv.zeilen[2];
    const teil = {};
    for (const a of lv.zeilen) if (a !== ohne) teil[a + '|' + zu[a]] = 'ja';
    await setzeGitter(page, h, teil);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('fehlt noch ein Kreis');
    await expect(page.locator('.logik-kopf.logik-markiert[data-z="' + ohne + '"]')).toBeVisible();
    await h.ansicht(page, 'logik-reihe-leer', info);

    // Eine Zuordnung, bei der ein Hinweis nicht stimmt: Hinweis-Nummer, Hinweis gelb, kein Geschafft
    const andere = zuordnungen(lv).find((z) => lv.zeilen.some((a) => z[a] !== zu[a]));
    const e = LG.pruefeGitter(lv, lv.zeilen.map((a) => [a, andere[a]]));
    expect(e.verletzt.length).toBeGreaterThan(0);
    await setzeGitter(page, h, zielVon(lv, andere));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(meldung(page)).toContainText('Hinweis ' + (e.verletzt[0] + 1));
    await expect(meldung(page)).not.toContainText(/falsch|richtig/i);
    await expect(page.locator('.logik-hinweise li.logik-markiert')).toHaveCount(e.verletzt.length);
    await expect(page.locator('.dialog')).toHaveCount(0);
    await h.ansicht(page, 'logik-hinweis', info);

    // Danach richtig lösen: Geschafft, leere Felder bekommen blasse Kreuze
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await setzeGitter(page, h, zielVon(lv, zu, false));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await expect(page.locator('.feld .logik-zelle.logik-auto')).toHaveCount(6);
    // Nochmal im Geschafft-Fenster: wieder ein leeres Gitter
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await expect(page.locator('.dialog')).toHaveCount(0);
    expect((await gitterWerte(page)).every((w) => w === '')).toBe(true);
    await expect(page.locator('.feld .logik-auto')).toHaveCount(0);
  });

  test('Kobold-Gitter: lila Zeichen, Nochmal holt sie zurück, Kobold gefunden', async ({ page }, info) => {
    test.skip(!kobold, 'kein Gitter mit Vorgabe');
    const lv = kobold.lv;
    const v = lv.vorgabe;
    const n = (v.ja || []).length + (v.nein || []).length;
    const zu = loesung(lv);
    const falsch = (v.ja || []).filter(([a, x]) => zu[a] !== x).concat((v.nein || []).filter(([a, x]) => zu[a] === x));
    expect(falsch.length, 'genau ein lila Zeichen stimmt nicht').toBe(1);
    await h.oeffneLevel(page, kobold, info);
    await expect(page.locator('.feld .logik-zelle.logik-lila')).toHaveCount(n);
    await expect(meldung(page)).toContainText('Kobold');
    // Ein lila Zeichen umschalten: nicht mehr lila. Nochmal: wieder alle lila Zeichen wie am Anfang
    const [ka, kx] = falsch[0];
    const vorher = await gitterWerte(page);
    await h.tippe(page, zelle(ka, kx));
    await expect(page.locator('.feld .logik-zelle.logik-lila')).toHaveCount(n - 1);
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(page.locator('.feld .logik-zelle.logik-lila')).toHaveCount(n);
    expect(await gitterWerte(page)).toEqual(vorher);
    // Lösen: das falsche lila Zeichen bekommt den Kobold
    await setzeGitter(page, h, zielVon(lv, zu));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await expect(page.locator('.dialog p')).toContainText('Kobold');
    await expect(page.locator('.feld .logik-zelle.logik-kobold')).toHaveCount(1);
    await expect(page.locator(zelle(ka, kx))).toHaveClass(/logik-kobold/);
    await h.ansicht(page, 'logik-kobold-geschafft', info);
  });

  test('Profi-Gitter 4 · 4: lösen, Profi-Frage nach dem überflüssigen Hinweis', async ({ page }, info) => {
    test.skip(!profi, 'kein 4 · 4-Gitter');
    const lv = profi.lv;
    await h.oeffneLevel(page, profi, info);
    await expect(page.locator('.feld .logik-zelle')).toHaveCount(16);
    if (lv.hinweise.some((x, i) => LG.loese(lv, { ohne: [i], max: 2 }).anzahl === 1)) await expect(meldung(page)).toContainText('überflüssig');
    // ein Hinweis passt nicht: gelb markiert (mit vier Hinweisen und 4 · 4 die engste Ansicht)
    const zu = loesung(lv);
    const andere = zuordnungen(lv).find((z) => lv.zeilen.some((a) => z[a] !== zu[a]));
    await setzeGitter(page, h, zielVon(lv, andere));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('Hinweis');
    await h.ansicht(page, 'logik-profi-hinweis', info);
    await setzeGitter(page, h, zielVon(lv, zu));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    const ueber = lv.hinweise.some((x, i) => LG.loese(lv, { ohne: [i], max: 2 }).anzahl === 1);
    if (ueber) await expect(page.locator('.dialog p')).toContainText('nie gebraucht');
    await h.ansicht(page, 'logik-profi-geschafft', info);
  });

  test('Wahr oder falsch: offene Sätze, ein Satz passt nicht, Doppeltipp, Nochmal', async ({ page }, info) => {
    test.skip(!wf, 'kein Wahr-oder-falsch-Level');
    const lv = wf.lv;
    const w = wahrheit(lv);
    await h.oeffneLevel(page, wf, info);
    await expect(page.locator('.feld .logik-figur')).toHaveCount(lv.szene.length);
    await expect(page.locator('.programm .logik-wf')).toHaveCount(lv.aussagen.length);
    // „Los“ mit offenen Sätzen
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('Satz 1');
    await expect(page.locator('.logik-saetze li.logik-markiert[data-h="0"]')).toBeVisible();
    // Doppeltipp: nur ein Schritt (wahr)
    await h.doppeltipp(page, satzTaste(0));
    await expect(page.locator(satzTaste(0))).toHaveAttribute('data-wert', 'wahr');
    // Alle Sätze bis auf den letzten passend, der letzte umgekehrt
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(page.locator('.programm .logik-wf[data-wert=""]')).toHaveCount(lv.aussagen.length);
    const fast = w.map((x, i) => (i === w.length - 1 ? !x : x));
    await setzeSaetze(page, h, fast);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('Ein Satz passt noch nicht');
    await expect(page.locator('.dialog')).toHaveCount(0);
    await h.ansicht(page, 'logik-wf-hinweis', info);
    // den letzten Satz umschalten: Geschafft
    await h.tippe(page, satzTaste(w.length - 1));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await h.ansicht(page, 'logik-wf-geschafft', info);
  });

  // Die Spiel-Skripte lädt index.html nach app.js: Die erste Ansicht nach dem Laden zeichnet app.js noch ohne
  // dieses Plugin. Das Plugin zeichnet sie dann neu (hier an der Paket-Seite und der Block-Seite geprüft: Bild des Pakets).
  test('Logikrätsel: Paket-Seite und Kachel direkt geöffnet zeigen das Gitter-Bild', async ({ page }, info) => {
    const f = h.suche('logik', (l) => !istWF(l));
    test.skip(!f, 'kein Logikgitter');
    await page.goto('./#' + f.p.paket);
    await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await expect(page.locator('.paket-bild .logik-icon')).toBeVisible();
    await h.ansicht(page, 'logik-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await expect(page.locator('.kachel[data-paket="' + f.p.paket + '"] .logik-icon')).toBeVisible();
    await h.ansicht(page, 'logik-kachel', info);
  });
}
