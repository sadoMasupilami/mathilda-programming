// Test-Plugin für die Rätselart „muster“ (Einheit 6, web/spiele/muster.js)
// Die Lösungen rechnet der Test selbst mit web/kern/muster.js aus (wie der Löser); die App kennt keine.
import { expect } from '@playwright/test';
import '../../web/kern/muster.js';

const M = globalThis.WerkstattMuster;

// Fortsetzen: was in jeden leeren Platz gehört (Lücken und Plätze am Ende), nach Platz geordnet
function loesungFortsetzen(lv) {
  const f = M.fortsetzung(lv.folge, lv.weiter || 0);
  return f.luecken.map((u) => ({ i: u.i, el: u.el }))
    .concat(f.weiter.map((el, j) => ({ i: lv.folge.length + j, el })))
    .sort((a, b) => a.i - b.i);
}
// Kobold: alle Ein-Perlen-Tausche aus der Auswahl durchprobieren, genau einer macht ein sauberes Muster
function tauscheKobold(lv) {
  const aus = [];
  lv.folge.forEach((x, i) => {
    for (const a of lv.palette) {
      if (a === x) continue;
      const g = lv.folge.slice();
      g[i] = a;
      if (M.istSauber(g)) aus.push({ i, el: a });
    }
  });
  return aus;
}
function loesungKobold(lv) {
  const t = tauscheKobold(lv);
  if (t.length !== 1) throw new Error(lv.id + ': ' + t.length + ' Reparaturen');
  return t[0];
}
// Zauber-Kasten: der einzige Kasten, der die ganze Folge malt
function loesungZauber(lv) {
  const p = M.einKasten(lv.folge);
  if (p.length !== 1) throw new Error(lv.id + ': ' + p.length + ' Zauber-Kästen');
  return p[0][0];
}

const el = (x) => '.tasten [data-aktion="muster-el"][data-el="' + x + '"]';
const LOS = '.tasten [data-aktion="los"]';

export async function spiele(page, lv, h, info) {
  const kurz = lv.id.replace(/^e\d+-/, '');
  if (lv.aufgabe === 'fortsetzen') {
    // Nur die Auswahl antippen: Der Platz, der dran ist, rückt von selbst weiter (auch über eine Lücke)
    for (const p of loesungFortsetzen(lv)) {
      await expect(page.locator('.feld .muster-platz.muster-dran')).toHaveAttribute('data-i', String(p.i));
      await h.tippe(page, el(p.el));
    }
    await expect(page.locator('.feld .muster-platz.muster-leer')).toHaveCount(0);
    await h.ansicht(page, 'muster-' + kurz + '-voll', info);
  } else if (lv.aufgabe === 'kobold') {
    const r = loesungKobold(lv);
    await h.tippe(page, '.feld [data-aktion="muster-perle"][data-i="' + r.i + '"]');
    await expect(page.locator('.feld .muster-wahl')).toHaveCount(1);
    await h.ansicht(page, 'muster-' + kurz + '-wahl', info);
    await h.tippe(page, el(r.el));
    await expect(page.locator('.feld .muster-getauscht')).toHaveCount(1);
  } else {
    const k = loesungZauber(lv);
    await h.tippe(page, '.tasten [data-aktion="muster-zahl"][data-zahl="' + k.wdh + '"]');
    for (const x of k.teile) await h.tippe(page, el(x));
    await expect(page.locator('.programm .muster-k-voll')).toHaveCount(k.teile.length);
    await h.ansicht(page, 'muster-' + kurz + '-kasten', info);
  }
  await h.tippe(page, LOS);
  // Geschafft: Jeder Muster-Kern hat sein eigenes Band
  await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.feld .muster-band-start').first()).toBeVisible();
  await h.ansicht(page, 'muster-' + kurz + '-geschafft', info);
}

export function tests({ test, expect: erwarte, h }) {
  const meldung = (page) => page.locator('.meldung');

  test('Paket-Bild der Muster auch beim direkten Aufruf (QR-Code)', async ({ page }, info) => {
    const f = h.suche('muster', () => true);
    test.skip(!f, 'kein Muster-Level');
    await page.goto('./#' + f.p.paket);
    await erwarte(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await erwarte(page.locator('.paket-bild svg.muster-icon')).toHaveCount(1);
    await h.ansicht(page, 'muster-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await erwarte(page.locator('.kachel[data-paket="' + f.p.paket + '"] svg.muster-icon')).toHaveCount(1);
  });

  test('Muster fortsetzen: freundlicher Hinweis, Platz ändern, Doppeltipp, Nochmal', async ({ page }, info) => {
    const f = h.suche('muster', (l) => l.aufgabe === 'fortsetzen' && !l.folge.includes(null) && (l.weiter || 0) >= 2);
    test.skip(!f, 'kein Fortsetzen-Level');
    await h.oeffneLevel(page, f, info);
    const loes = loesungFortsetzen(f.lv);
    // Los ist grau, solange Plätze leer sind: ein Tipp zeigt, warum
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, LOS);
    await erwarte(meldung(page)).toContainText('noch Plätze leer');
    // Der erste Platz richtig, der zweite nicht
    const anders = f.lv.palette.find((x) => x !== loes[1].el);
    await h.tippe(page, el(loes[0].el));
    await h.tippe(page, el(anders));
    for (const p of loes.slice(2)) await h.tippe(page, el(p.el));
    await erwarte(meldung(page)).toContainText('Los');
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.feld .muster-falsch')).toHaveCount(1);
    await erwarte(page.locator('.feld .muster-falsch')).toHaveAttribute('data-i', String(loes[1].i));
    await erwarte(meldung(page)).toContainText('Fast!');
    await erwarte(meldung(page)).not.toContainText('falsch');
    await h.ansicht(page, 'muster-fortsetzen-hinweis', info);
    // Ein anderer Platz lässt sich antippen und ändern; ein Doppeltipp lässt ihn ausgewählt
    await h.doppeltipp(page, '.feld .muster-platz[data-i="' + loes[0].i + '"]');
    await erwarte(page.locator('.feld .muster-platz.muster-dran')).toHaveAttribute('data-i', String(loes[0].i));
    await erwarte(meldung(page)).toContainText('Was kommt hierher?');
    await h.ansicht(page, 'muster-fortsetzen-platz', info);
    await h.tippe(page, el(loes[0].el));
    // Nochmal: alle Plätze wieder leer
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await erwarte(page.locator('.feld .muster-platz.muster-voll')).toHaveCount(0);
    await erwarte(page.locator('.feld .muster-platz.muster-leer')).toHaveCount(loes.length);
    await erwarte(page.locator('.feld .muster-falsch')).toHaveCount(0);
    await erwarte(page.locator('.feld .muster-platz.muster-dran')).toHaveAttribute('data-i', String(loes[0].i));
  });

  test('Muster mit Lücke in der Mitte: die Lücke ist zuerst dran', async ({ page }, info) => {
    const f = h.suche('muster', (l) => l.aufgabe === 'fortsetzen' && l.folge.includes(null));
    test.skip(!f, 'kein Level mit Lücke');
    await h.oeffneLevel(page, f, info);
    const luecke = f.lv.folge.indexOf(null);
    await erwarte(page.locator('.feld .muster-platz.muster-dran')).toHaveAttribute('data-i', String(luecke));
    await erwarte(meldung(page)).toContainText('Lücke');
    await h.ansicht(page, 'muster-luecke', info);
  });

  test('Kobold im Muster: falscher Tausch, nur eine Perle, Doppeltipp, Nochmal', async ({ page }, info) => {
    const f = h.suche('muster', (l) => l.aufgabe === 'kobold');
    test.skip(!f, 'kein Kobold-Level');
    await h.oeffneLevel(page, f, info);
    const r = loesungKobold(f.lv);
    const perle = (i) => '.feld [data-aktion="muster-perle"][data-i="' + i + '"]';
    // Auswahl ohne angetippte Perle: grau, ein Tipp sagt, was zu tun ist
    await erwarte(page.locator(el(f.lv.palette[0]))).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, el(f.lv.palette[0]));
    await erwarte(meldung(page)).toContainText('Tippe zuerst');
    // Eine richtige Perle tauschen: kein sauberes Muster, freundlicher Hinweis
    const i = r.i === 0 ? 1 : 0;
    const a = f.lv.palette.find((x) => x !== f.lv.folge[i]);
    await h.tippe(page, perle(i));
    await erwarte(page.locator(el(f.lv.folge[i]))).toBeDisabled();
    await h.tippe(page, el(a));
    await erwarte(page.locator('.feld .muster-getauscht')).toHaveCount(1);
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Noch kein sauberes Muster');
    await h.ansicht(page, 'muster-kobold-hinweis', info);
    // Eine andere Perle antippen: Die erste ist wieder wie vorher (nur eine ist falsch)
    await h.tippe(page, perle(r.i));
    await erwarte(page.locator('.feld .muster-getauscht')).toHaveCount(0);
    await erwarte(page.locator(perle(i))).toHaveAttribute('aria-label', new RegExp(M.wort(f.lv.folge[i]) + '$'));
    await erwarte(meldung(page)).toContainText('wieder wie vorher');
    // Nochmal antippen (ein Mensch tippt nicht schneller als der Doppeltipp-Schutz): nicht mehr ausgewählt.
    // Ein Doppeltipp wählt sie (nur einmal umgeschaltet)
    await page.waitForTimeout(400);
    await h.tippe(page, perle(r.i));
    await erwarte(page.locator('.feld .muster-wahl')).toHaveCount(0);
    await page.waitForTimeout(400);
    await h.doppeltipp(page, perle(r.i));
    await erwarte(page.locator('.feld .muster-wahl')).toHaveCount(1);
    await h.tippe(page, el(r.el));
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await erwarte(page.locator('.dialog p')).toContainText('Muster-Kern');
    // Nochmal im Geschafft-Fenster: das Kobold-Muster wie am Anfang
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.feld .muster-getauscht')).toHaveCount(0);
    await erwarte(page.locator('.feld .muster-band')).toHaveCount(0);
    await erwarte(page.locator(perle(r.i))).toHaveAttribute('aria-label', new RegExp(M.wort(f.lv.folge[r.i]) + '$'));
  });

  test('Zauber-Kasten: zu wenig, zu viel, passt nicht, voll, Doppeltipp, Nochmal', async ({ page }, info) => {
    const f = h.suche('muster', (l) => l.aufgabe === 'zauber');
    test.skip(!f, 'kein Zauber-Level');
    await h.oeffneLevel(page, f, info);
    const k = loesungZauber(f.lv);
    const zahl = (w) => '.tasten [data-aktion="muster-zahl"][data-zahl="' + w + '"]';
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, LOS);
    await erwarte(meldung(page)).toContainText('Wie oft?');
    // Zu wenig: eine Runde zu wenig
    const weniger = k.wdh - 1 >= M.WDH_MIN ? k.wdh - 1 : null;
    for (const x of k.teile) await h.tippe(page, el(x));
    if (weniger) {
      await h.tippe(page, zahl(weniger));
      await h.tippe(page, LOS);
      // Der Kasten malt Perle für Perle (die gerade gemalte ist golden)
      await erwarte(page.locator('.feld .muster-erg.muster-jetzt')).toHaveCount(1, { timeout: 5000 });
      await erwarte(meldung(page)).toContainText('Zauber-Kasten');
      await h.ansicht(page, 'muster-zauber-malt', info);
      await erwarte(meldung(page)).toContainText('Zu wenig', { timeout: 15_000 });
      await erwarte(page.locator('.programm .muster-warn')).toHaveCount(1);
      await h.ansicht(page, 'muster-zauber-zu-wenig', info);
    }
    // Zu viel: eine Runde mehr (ändern löscht das gemalte Armband)
    if (k.wdh + 1 <= M.WDH_MAX) {
      await h.tippe(page, zahl(k.wdh + 1));
      await erwarte(page.locator('.feld .muster-gemalt')).toHaveCount(0);
      await erwarte(page.locator('.programm .muster-warn')).toHaveCount(0);
      await h.tippe(page, LOS);
      await erwarte(meldung(page)).toContainText('Zu viel', { timeout: 15_000 });
    }
    // Passt nicht: Kasten mit einer anderen ersten Perle
    await h.tippe(page, zahl(k.wdh));
    for (let j = 0; j < k.teile.length; j++) await h.tippe(page, '.programm [data-aktion="muster-weg"]');
    await erwarte(page.locator('.programm .muster-k-voll')).toHaveCount(0);
    await erwarte(page.locator('.programm [data-aktion="muster-weg"]')).toBeDisabled();
    const anders = f.lv.palette.find((x) => x !== k.teile[0]);
    await h.tippe(page, el(anders));
    await h.tippe(page, LOS);
    await erwarte(meldung(page)).toContainText('Hier passt es nicht', { timeout: 15_000 });
    await erwarte(page.locator('.feld .muster-erg.muster-falsch')).toHaveAttribute('data-j', '0');
    await erwarte(page.locator('.feld .muster-fest.muster-falsch')).toHaveAttribute('data-j', '0');
    await h.ansicht(page, 'muster-zauber-passt-nicht', info);
    // Voll: höchstens 3 Perlen im Kasten
    await h.tippe(page, el(anders));
    await h.tippe(page, el(anders));
    await erwarte(page.locator('.programm .muster-k-voll')).toHaveCount(M.MAX_INNEN);
    await erwarte(page.locator(el(anders))).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, el(anders));
    await erwarte(page.locator('.programm .muster-k-voll')).toHaveCount(M.MAX_INNEN);
    await erwarte(meldung(page)).toContainText('Höchstens 3');
    await h.ansicht(page, 'muster-zauber-voll', info);
    // Richtig bauen: alles weg, Zahl mit Doppeltipp (bleibt gewählt), Perlen hinein
    for (let j = 0; j < M.MAX_INNEN; j++) await h.tippe(page, '.programm [data-aktion="muster-weg"]');
    await h.doppeltipp(page, zahl(k.wdh));
    await erwarte(page.locator('.tasten .muster-gewaehlt')).toHaveAttribute('data-zahl', String(k.wdh));
    for (const x of k.teile) await h.tippe(page, el(x));
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 20_000 });
    await erwarte(page.locator('.dialog p')).toContainText((1 + k.teile.length) + ' Karten statt ' + f.lv.folge.length);
    await erwarte(page.locator('.feld .muster-gemalt')).toHaveCount(f.lv.folge.length);
    // Nochmal: leerer Kasten, nichts gemalt
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.programm .muster-k-voll')).toHaveCount(0);
    await erwarte(page.locator('.programm .muster-zahl-leer')).toHaveCount(1);
    await erwarte(page.locator('.feld .muster-gemalt')).toHaveCount(0);
    await erwarte(page.locator('.tasten .muster-gewaehlt')).toHaveCount(0);
  });

  test('Muster: Nochmal mitten im Malen, Gerät drehen', async ({ page }, info) => {
    const f = h.suche('muster', (l) => l.aufgabe === 'zauber');
    test.skip(!f, 'kein Zauber-Level');
    await h.oeffneLevel(page, f, info);
    const k = loesungZauber(f.lv);
    await h.tippe(page, '.tasten [data-aktion="muster-zahl"][data-zahl="' + k.wdh + '"]');
    for (const x of k.teile) await h.tippe(page, el(x));
    await h.tippe(page, LOS);
    await erwarte(page.locator('.feld .muster-erg.muster-jetzt')).toHaveCount(1, { timeout: 5000 });
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await h.ansicht(page, 'muster-gedreht-beim-malen', info);
    await page.setViewportSize(g);
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await erwarte(page.locator('.feld .muster-gemalt')).toHaveCount(0);
    await page.waitForTimeout(800);
    await erwarte(page.locator('.feld .muster-gemalt')).toHaveCount(0);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
  });
}
