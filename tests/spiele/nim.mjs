// Test-Plugin für die Rätselart „nim“ (Einheit 15, Paket e15 „Gewinnen mit Plan“) – eingebunden von tests/web.spec.mjs.
// Die Gewinnzüge rechnet der Test selbst mit dem Kern aus (web/kern/nim.js: Spielbaum, gewinnZuege);
// die App kennt keine Lösung. Gelesen wird nur die Stellung, die gerade am Tisch liegt (data-haufen).
// Jede neue Ansicht wird mit h.ansicht fotografiert und geprüft.
import '../../web/kern/nim.js';

const N = globalThis.WerkstattNim;
const FELD = '.feld [data-phase]';
const AN = /(^|\s)nim-gewaehlt(\s|$)/;   // gewählt (nicht verwechseln mit nim-anzahl)
const stein = (hi) => '.feld .nim-stein[data-h="' + hi + '"]:not(.nim-gewaehlt)';

// Warten, bis das Kind dran ist (oder das Spiel aus ist): 'du' | 'gewonnen' | 'verloren'
async function warteAufDich(page) {
  const l = page.locator('.feld [data-phase="du"], .feld [data-phase="gewonnen"], .feld [data-phase="verloren"]');
  await l.first().waitFor({ state: 'attached', timeout: 30_000 });
  return l.first().getAttribute('data-phase');
}
async function stellung(page) {
  return (await page.locator(FELD).first().getAttribute('data-haufen')).split(',').map(Number);
}
async function zugGemacht(page, zug) {
  await page.locator('.feld [data-zug="' + zug + '"]').waitFor({ state: 'detached', timeout: 10_000 });
}
const sortiert = (zz) => zz.slice().sort((a, b) => a.nimm - b.nimm || a.haufen - b.haufen);
function gewinnZug(v, x) {
  const gz = N.gewinnZuege(v, x);
  if (!gz.length) throw new Error('Kein Gewinnzug bei ' + x.join('|') + ' (' + v.text + ')');
  return sortiert(gz)[0];
}
// Ein Zug, nach dem der Roboter gewinnen kann (für die Tests „Roboter gewinnt“)
function schlechterZug(v, x) {
  return sortiert(N.zuege(v, x)).find((z) => N.gewinnt(v, N.nach(x, z))) || sortiert(N.zuege(v, x))[0];
}
// Einen Zug antippen: Zahl unten (ein Haufen, Wer sagt …?) oder Steine im Haufen (zwei Haufen), dann die grüne Taste
async function mache(page, h, v, x, zug, vorLos) {
  if (v.form === 'zaehlen') await h.tippe(page, '.tasten [data-aktion="sag"][data-n="' + zug.nimm + '"]');
  else if (x.length === 1) {
    // Die Taste schaltet um: nur antippen, wenn nicht schon genau so viele gewählt sind
    const t = '.tasten [data-aktion="anzahl"][data-n="' + zug.nimm + '"]';
    if (!AN.test(await page.locator(t).getAttribute('class'))) await h.tippe(page, t);
  }
  else for (let i = 0; i < zug.nimm; i++) await h.tippe(page, stein(zug.haufen));
  if (vorLos) await vorLos();
  await h.tippe(page, '.tasten [data-aktion="los"]');
}
// So lange spielen, bis das Spiel aus ist. wahl(v, x) gibt den Zug des Kindes.
async function spieleBisZumEnde(page, h, lv, wahl, vorLos) {
  const v = N.lies(lv.spiel);
  for (let n = 0; n < 40; n++) {
    const phase = await warteAufDich(page);
    if (phase !== 'du') return phase;
    const x = await stellung(page);
    const zug = await page.locator(FELD).first().getAttribute('data-zug');
    await mache(page, h, v, x, wahl(v, x), n === 0 ? vorLos : null);
    // Der Zug ist gemacht, sobald der Zug-Zähler weiterzählt (der Roboter kann schon wieder fertig sein)
    await zugGemacht(page, zug);
  }
  throw new Error('Spiel endet nicht');
}

// Ein Level gewinnen (immer der kleinste Gewinnzug), bis das Geschafft-Fenster kommt
export async function spiele(page, lv, h, info, fotos) {
  const vorLos = fotos ? () => h.ansicht(page, 'nim-auswahl', info) : null;
  const ende = await spieleBisZumEnde(page, h, lv, gewinnZug, vorLos);
  if (ende !== 'gewonnen') throw new Error(lv.id + ': der Roboter hat gewonnen');
}

export function tests({ test, expect, DATEN, h }) {
  const steine = h.suche('nim', (l) => l.spiel.form === 'steine' && l.haufen.length === 1 && l.haufen[0] <= 5 && l.spiel.letzter === 'gewinnt' && l.dran === 'du');
  const zehn = h.suche('nim', (l) => l.spiel.form === 'steine' && l.haufen.length === 1 && l.haufen[0] >= 8 && l.spiel.letzter === 'gewinnt');
  const zaehlen = h.suche('nim', (l) => l.spiel.form === 'zaehlen' && l.dran === 'du');
  const roboterZuerst = h.suche('nim', (l) => l.dran === 'andere');
  const zwei = h.suche('nim', (l) => l.spiel.form === 'steine' && l.haufen.length === 2);
  const kobold = h.suche('nim', (l) => l.spiel.letzter === 'verliert');
  const dreier = h.suche('nim', (l) => Array.isArray(l.spiel.nehmen) && l.spiel.nehmen.length === 3);
  const meldung = (page) => page.locator('.meldung');
  const phase = (page) => page.locator(FELD).first();

  test('Gewinnen mit Plan: Steine wählen, freundliche Hinweise, Tipp wenn der Roboter gewinnt, Nochmal, Doppeltipp', async ({ page }, info) => {
    test.skip(!steine, 'kein Steine-Level');
    const lv = steine.lv, v = N.lies(lv.spiel);
    await h.schnell(page);
    await h.oeffneLevel(page, steine, info);
    // In der App gibt es keine Lösung: keine Gewinnzüge, keine Gewinnzahlen, keine Beispiel-Partie
    const daten = await page.evaluate(() => JSON.stringify(window.WERKSTATT_DATEN.pakete.map((p) => p.levels.filter((l) => l.art === 'nim'))));
    expect(daten).toContain('"haufen":');
    expect(daten).not.toMatch(/"(loesung|gewinnZuege|gewinnZuegeText|gewinnzahlen|partie|tippGz|zug|gewinner|zugText)":/);
    await expect(page.locator('.feld .nim-stein')).toHaveCount(lv.haufen[0]);
    await expect(page.locator('.feld .nim-zahl')).toHaveText(String(lv.haufen[0]));
    await expect(page.locator('.nim-wer-du.nim-dran')).toHaveCount(1);
    await expect(meldung(page)).toContainText('Wer den letzten nimmt, gewinnt!');

    // „Nehmen“ ohne Steine: freundlicher Hinweis
    await h.tippeGrau(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(meldung(page)).toContainText('Tippe zuerst die Steine an');
    // Doppeltipp auf einen Stein: er bleibt gewählt
    await h.doppeltipp(page, '.feld .nim-stein[data-p="0"]');
    await expect(page.locator('.feld .nim-stein.nim-gewaehlt')).toHaveCount(1);
    await expect(meldung(page)).toContainText('Du nimmst 1 Stein. Tippe auf Nehmen.');
    await expect(page.locator('.tasten [data-aktion="anzahl"][data-n="1"]')).toHaveClass(AN);
    // mehr Steine als erlaubt: freundlich, der dritte wird nicht gewählt
    await h.tippe(page, '.feld .nim-stein[data-p="1"]');
    await h.tippe(page, '.feld .nim-stein[data-p="2"]');
    await expect(page.locator('.feld .nim-stein.nim-gewaehlt')).toHaveCount(2);
    await expect(meldung(page)).toContainText('Du darfst nur ' + N.nehmenText(v) + ' Steine nehmen.');
    await expect(meldung(page)).not.toContainText(/falsch/i);
    await h.ansicht(page, 'nim-zu-viele', info);
    // Doppeltipp auf „1“: genau 1 Stein gewählt (die Taste schaltet nicht gleich wieder aus)
    await h.doppeltipp(page, '.tasten [data-aktion="anzahl"][data-n="1"]');
    await expect(page.locator('.feld .nim-stein.nim-gewaehlt')).toHaveCount(1);
    await expect(page.locator('.tasten [data-aktion="anzahl"][data-n="1"]')).toHaveClass(AN);

    // Ein Zug ohne Plan: Der Roboter gewinnt. Kein Fenster, kein Stern, aber „Nochmal?“ und der Tipp des Levels
    const ende = await spieleBisZumEnde(page, h, lv, schlechterZug);
    expect(ende).toBe('verloren');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(meldung(page)).toContainText('Der Roboter gewinnt. Nochmal?');
    await expect(meldung(page)).not.toContainText(/falsch/i);
    await expect(page.locator('.programm .nim-tipp')).toContainText('Tipp: ' + lv.tipp);
    await expect(page.locator('.dialog')).toHaveCount(0);
    await expect(page.locator('.punkte .punkt.voll')).toHaveCount(0);
    await expect(page.locator('.tasten [data-aktion="anzahl"]')).toHaveCount(0);
    await h.ansicht(page, 'nim-verloren', info);
    // Nochmal: alle Steine wieder da, du bist dran
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(phase(page)).toHaveAttribute('data-phase', 'du');
    await expect(phase(page)).toHaveAttribute('data-haufen', lv.haufen.join(','));
    await expect(page.locator('.feld .nim-stein')).toHaveCount(lv.haufen[0]);
    await expect(page.locator('.feld .nim-loch')).toHaveCount(0);
    await expect(page.locator('.programm .nim-tipp')).toHaveCount(0);

    // Mit Plan gewinnen; Doppeltipp auf „Nehmen“ beim letzten Zug: das Geschafft-Fenster bleibt offen
    for (let n = 0; n < 20; n++) {
      expect(await warteAufDich(page)).toBe('du');
      const x = await stellung(page);
      const zug = gewinnZug(v, x);
      const nr = await phase(page).getAttribute('data-zug');
      await h.tippe(page, '.tasten [data-aktion="anzahl"][data-n="' + zug.nimm + '"]');
      if (zug.nimm === x[0]) { await h.doppeltipp(page, '.tasten [data-aktion="los"]'); break; }
      await h.tippe(page, '.tasten [data-aktion="los"]');
      await zugGemacht(page, nr);
    }
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await expect(page.locator('.dialog p')).toContainText('letzten Stein');
    await page.waitForTimeout(500);
    await expect(page.locator('.dialog')).toHaveCount(1);
    await expect(page.locator('.nim-tisch.nim-geschafft')).toHaveCount(1);
    await expect(page.locator('.spiel')).toHaveAttribute('data-level', lv.id);
    // „Nochmal“ im Fenster: dasselbe Level von vorne, der Stern bleibt
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await expect(page.locator('.dialog')).toHaveCount(0);
    await expect(phase(page)).toHaveAttribute('data-haufen', lv.haufen.join(','));
    await expect(page.locator('.punkte .punkt.voll')).toHaveCount(1);
  });

  test('Gewinnen mit Plan: der Roboter überlegt und zeigt seine Steine (blauer Ring)', async ({ page }, info) => {
    test.skip(!zehn, 'kein Level mit vielen Steinen');
    const lv = zehn.lv, v = N.lies(lv.spiel);
    // normales Tempo: so sieht man, wie der Roboter überlegt und seine Steine zeigt
    await h.oeffneLevel(page, zehn, info);
    const zug = gewinnZug(v, lv.haufen);
    await h.tippe(page, '.tasten [data-aktion="anzahl"][data-n="' + zug.nimm + '"]');
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(phase(page)).toHaveAttribute('data-phase', 'roboter');
    await expect(meldung(page)).toContainText('Der Roboter überlegt');
    await expect(page.locator('.nim-wer-rob.nim-dran')).toHaveCount(1);
    await expect(page.locator('.feld .nim-loch-du')).toHaveCount(zug.nimm);
    await expect(page.locator('.feld .nim-stein:not([disabled])')).toHaveCount(0);
    await expect(page.locator('.tasten [data-aktion="los"]')).toBeDisabled();
    await h.ansicht(page, 'nim-roboter-ueberlegt', info);
    const nach = N.nach(lv.haufen, zug);
    const r = N.roboterZug(v, nach);
    await expect(page.locator('.feld .nim-stein.nim-robo')).toHaveCount(r.nimm, { timeout: 5000 });
    await expect(meldung(page)).toContainText('Der Roboter nimmt ' + r.nimm);
    await h.ansicht(page, 'nim-roboter-nimmt', info);
    await expect(phase(page)).toHaveAttribute('data-phase', 'du', { timeout: 5000 });
    await expect(phase(page)).toHaveAttribute('data-haufen', String(N.nach(nach, r)[0]));
    await expect(meldung(page)).toContainText('Der Roboter hat ' + r.nimm + ' genommen. Jetzt du!');
    await expect(page.locator('.feld .nim-loch-roboter')).toHaveCount(r.nimm);
    await h.ansicht(page, 'nim-jetzt-du', info);
  });

  test('Wer sagt 20?: Zahlen wählen, der Drache hüpft, Tipp nach einem verlorenen Spiel', async ({ page }, info) => {
    test.skip(!zaehlen, 'kein Wer-sagt-Level');
    const lv = zaehlen.lv, v = N.lies(lv.spiel);
    await h.schnell(page);
    await h.oeffneLevel(page, zaehlen, info);
    await expect(page.locator('.feld .nim-weg svg')).toHaveCount(1);
    await expect(phase(page)).toHaveAttribute('data-stand', String(lv.stand || 0));
    await expect(meldung(page)).toContainText('Wer ' + v.bis + ' sagt, gewinnt!');
    // Die Tasten zeigen die nächsten Zahlen
    await expect(page.locator('.tasten [data-aktion="sag"][data-n="1"]')).toHaveText('1');
    await expect(page.locator('.tasten [data-aktion="sag"][data-n="2"]')).toHaveText('1, 2');
    // „Los“ ohne Wahl: Hinweis; Doppeltipp auf „1, 2“: bleibt gewählt
    await h.tippeGrau(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('Tippe zuerst unten an, was du sagst.');
    await h.doppeltipp(page, '.tasten [data-aktion="sag"][data-n="2"]');
    await expect(page.locator('.tasten [data-aktion="sag"][data-n="2"]')).toHaveClass(AN);
    await expect(meldung(page)).toContainText('Du sagst 1, 2. Tippe auf Los.');
    await h.ansicht(page, 'nim-weg-auswahl', info);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(phase(page)).toHaveAttribute('data-phase', 'du', { timeout: 10_000 });
    const s = Number(await phase(page).getAttribute('data-stand'));
    expect(s).toBeGreaterThanOrEqual(3);
    await expect(meldung(page)).toContainText('Jetzt du!');
    await h.ansicht(page, 'nim-weg-jetzt-du', info);
    // Nochmal, dann ohne Plan spielen (immer nur eine Zahl): Der Roboter sagt die Zielzahl
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(phase(page)).toHaveAttribute('data-stand', String(lv.stand || 0));
    const ende = await spieleBisZumEnde(page, h, lv, schlechterZug);
    expect(ende).toBe('verloren');
    await expect(meldung(page)).toContainText('Der Roboter gewinnt. Nochmal?');
    await expect(page.locator('.programm .nim-tipp')).toContainText(lv.tipp);
    await expect(phase(page)).toHaveAttribute('data-stand', String(v.bis));
    await h.ansicht(page, 'nim-weg-verloren', info);
  });

  test('Wer sagt 30?: Der Roboter fängt an', async ({ page }, info) => {
    test.skip(!roboterZuerst, 'kein Level, in dem der Roboter anfängt');
    const lv = roboterZuerst.lv;
    await h.oeffneLevel(page, roboterZuerst, info);
    await expect(meldung(page)).toContainText('Der Roboter fängt an.');
    await expect(page.locator('.nim-wer-rob.nim-dran')).toHaveCount(1);
    await h.ansicht(page, 'nim-roboter-faengt-an', info);
    await expect(phase(page)).toHaveAttribute('data-phase', 'du', { timeout: 10_000 });
    await expect(meldung(page)).toContainText('Jetzt du!');
    if (lv.spiel.form === 'zaehlen') expect(Number(await phase(page).getAttribute('data-stand'))).toBeGreaterThan(lv.stand || 0);
  });

  test('Zwei Haufen: Steine nur aus einem Haufen', async ({ page }, info) => {
    test.skip(!zwei, 'kein Level mit zwei Haufen');
    const lv = zwei.lv;
    await h.schnell(page);
    await h.oeffneLevel(page, zwei, info);
    await expect(page.locator('.feld .nim-teller')).toHaveCount(2);
    await expect(page.locator('.tasten [data-aktion="anzahl"]')).toHaveCount(0);
    await expect(meldung(page)).toContainText('aus einem Haufen');
    await h.tippe(page, stein(1));
    await h.tippe(page, stein(1));
    await expect(page.locator('.feld .nim-teller[data-h="1"] .nim-stein.nim-gewaehlt')).toHaveCount(2);
    await expect(meldung(page)).toContainText('Du nimmst 2 Steine.');
    await h.ansicht(page, 'nim-zwei-auswahl', info);
    // ein Stein aus dem anderen Haufen: die Wahl wechselt, freundlich erklärt
    await h.tippe(page, stein(0));
    await expect(page.locator('.feld .nim-stein.nim-gewaehlt')).toHaveCount(1);
    await expect(page.locator('.feld .nim-teller[data-h="0"] .nim-stein.nim-gewaehlt')).toHaveCount(1);
    await expect(meldung(page)).toContainText('Nimm nur aus einem Haufen.');
    await h.ansicht(page, 'nim-zwei-anderer-haufen', info);
    // Nochmal: nichts gewählt, alle Steine da
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(page.locator('.feld .nim-stein.nim-gewaehlt')).toHaveCount(0);
    await expect(phase(page)).toHaveAttribute('data-haufen', lv.haufen.join(','));
  });

  test('Kobold-Stein und neue Regeln: „Neu:“, wer den letzten nimmt, verliert', async ({ page }, info) => {
    test.skip(!kobold, 'kein Kobold-Stein-Level');
    await h.schnell(page);
    if (dreier) {
      await h.oeffneLevel(page, dreier, info);
      await expect(meldung(page)).toContainText('Nimm ' + N.nehmenText(N.lies(dreier.lv.spiel)) + ' Steine.');
      await expect(page.locator('.tasten [data-aktion="anzahl"]')).toHaveCount(3);
      await h.ansicht(page, 'nim-drei', info);
    }
    await h.oeffneLevel(page, kobold, info);
    await expect(meldung(page)).toContainText('Wer den letzten nimmt, verliert!');
    await h.ansicht(page, 'nim-kobold-stein', info);
    const ende = await spieleBisZumEnde(page, h, kobold.lv, gewinnZug);
    expect(ende).toBe('gewonnen');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await expect(page.locator('.dialog p')).toContainText('Der Roboter musste den letzten Stein nehmen!');
    await expect(page.locator('.feld .nim-loch-roboter').last()).toBeVisible();
    await h.ansicht(page, 'nim-kobold-geschafft', info);
  });

  test('Gewinnen mit Plan: Paket direkt geöffnet (QR-Code am Blatt)', async ({ page }, info) => {
    const f = steine || zaehlen;
    test.skip(!f, 'kein nim-Level');
    await page.goto('./#' + f.p.paket);
    await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await expect(page.locator('.paket-bild .nim-icon')).toBeVisible();
    await h.ansicht(page, f.p.paket + '-paket', info);
    await h.tippe(page, '.paket [data-aktion="level"].haupt');
    await expect(page.locator('.spiel.plugin')).toHaveAttribute('data-level', f.p.levels[0].id);
  });
}
