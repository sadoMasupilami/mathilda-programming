// Test-Plugin für die Rätselart „janein“ (Einheit 9, web/spiele/janein.js)
// Die Lösungen rechnet der Test selbst mit web/kern/janein.js aus (wie der Löser); die App kennt keine.
import { expect } from '@playwright/test';
import '../../web/kern/janein.js';

const J = globalThis.WerkstattJaNein;

// legen: alle Schreibweisen durchprobieren, genau eine passt
function loesungLegen(lv) {
  const n = J.anzahl(lv.anzahl);
  const alle = J.alleSchreibweisen(lv.zahl, n);
  if (alle.length !== 1) throw new Error(lv.id + ': ' + alle.length + ' Schreibweisen');
  return alle[0];
}
// lesen: die Summe der gezeigten Ja-Karten, genau eine der Zahlen zur Wahl
function loesungLesen(lv) {
  const n = J.anzahl(lv.anzahl);
  const soll = J.wert(J.jaAusWerten(lv.ja, n), n);
  if ((lv.wahl || []).filter((x) => x === soll).length !== 1) throw new Error(lv.id + ': ' + soll + ' nicht genau einmal zur Wahl');
  return soll;
}
// kobold: jede Karte einzeln umdrehen, genau eine macht die gemeinte Zahl
function loesungKobold(lv) {
  const n = J.anzahl(lv.anzahl);
  const k = J.kobold(lv.zahl, J.jaAusWerten(lv.ja, n), n);
  if (k.umdrehen.length !== 1) throw new Error(lv.id + ': ' + k.umdrehen.length + ' Karten zum Umdrehen');
  return k.umdrehen[0];
}
const ja = (lv) => J.jaAusWerten(lv.ja, J.anzahl(lv.anzahl));

const DREH = (i) => '.feld [data-aktion="janein-dreh"][data-i="' + i + '"]';
const ZAHL = (x) => '.tasten [data-aktion="janein-zahl"][data-zahl="' + x + '"]';
const LOS = '.tasten [data-aktion="los"]';
const JA = '.feld [data-aktion="janein-dreh"].janein-ja';
// Rechnung wie „16 + 4 + 1 = 21“ (in der App ohne Leerzeichen im Text, der Abstand kommt aus dem CSS)
const rechnungRe = (t) => new RegExp(t.split(' ').map((x) => x.replace(/[+]/g, '\\+')).join('\\s*'));

export async function spiele(page, lv, h, info) {
  const kurz = lv.id.replace(/^e\d+-/, '');
  const n = J.anzahl(lv.anzahl);
  if (lv.aufgabe === 'legen') {
    const soll = loesungLegen(lv);
    // Am Anfang ist alles umgedreht (0)
    await expect(page.locator(JA)).toHaveCount(0);
    await expect(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    for (let i = 0; i < n; i++) if (soll[i]) await h.tippe(page, DREH(i));
    await expect(page.locator(JA)).toHaveCount(soll.filter(Boolean).length);
    await h.ansicht(page, 'janein-' + kurz + '-gelegt', info);
    await h.tippe(page, LOS);
    await expect(page.locator('.dialog p')).toContainText(rechnungRe(J.rechnung(soll, n)), { timeout: 20_000 });
  } else if (lv.aufgabe === 'lesen') {
    const soll = loesungLesen(lv);
    await expect(page.locator('.tasten [data-aktion="janein-zahl"]')).toHaveCount(lv.wahl.length);
    await h.tippe(page, ZAHL(soll));
    await expect(page.locator('.dialog p')).toContainText(rechnungRe(J.rechnung(ja(lv), n)), { timeout: 20_000 });
  } else {
    const stelle = loesungKobold(lv);
    await h.tippe(page, DREH(stelle));
    await expect(page.locator('.feld .janein-gedreht')).toHaveCount(1);
    await h.ansicht(page, 'janein-' + kurz + '-umgedreht', info);
    await h.tippe(page, LOS);
    await expect(page.locator('.dialog p')).toContainText('Kobold erwischt', { timeout: 20_000 });
  }
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
  await h.ansicht(page, 'janein-' + kurz + '-geschafft', info);
}

export function tests({ test, expect: erwarte, DATEN, h }) {
  const meldung = (page) => page.locator('.meldung');
  const rechnung = (page) => page.locator('.feld .janein-rechnung');

  test('Ja/Nein: Die App kennt keine Lösungen', async () => {
    const levels = DATEN.pakete.flatMap((p) => p.levels).filter((l) => l.art === 'janein');
    erwarte(levels.length).toBeGreaterThan(0);
    const erlaubt = ['id', 'art', 'aufgabe', 'anzahl', 'aussehen', 'zahl', 'ja', 'wahl'];
    for (const l of levels) {
      erwarte(Object.keys(l).filter((k) => !erlaubt.includes(k)), l.id).toEqual([]);
      if (l.aufgabe === 'legen') erwarte(l.ja, l.id + ': legen ohne Karten').toBeUndefined();
      if (l.aufgabe === 'lesen') erwarte(l.zahl, l.id + ': lesen ohne Zahl').toBeUndefined();
    }
  });

  test('Ja/Nein: Paket-Bild auch beim direkten Aufruf (QR-Code)', async ({ page }, info) => {
    const f = h.suche('janein', () => true);
    test.skip(!f, 'kein Ja/Nein-Level');
    await page.goto('./#' + f.p.paket);
    await erwarte(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await erwarte(page.locator('.paket-bild svg.janein-icon')).toHaveCount(1);
    await h.ansicht(page, 'janein-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await erwarte(page.locator('.kachel[data-paket="' + f.p.paket + '"] svg.janein-icon')).toHaveCount(1);
  });

  test('Ja/Nein legen: Zählen Schritt für Schritt, zu viel, zu wenig, Doppeltipp, Nochmal', async ({ page }, info) => {
    // eine Zahl mit mindestens drei Ja-Karten (zum Beispiel 21 = 16 + 4 + 1)
    const f = h.suche('janein', (l) => l.aufgabe === 'legen' && (l.aussehen || 'karten') === 'karten' && J.anzahl(l.anzahl) === 5 && loesungLegen(l).filter(Boolean).length >= 3);
    test.skip(!f, 'kein passendes Legen-Level');
    await h.oeffneLevel(page, f, info);
    const n = 5;
    const soll = loesungLegen(f.lv);
    const jaI = soll.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
    const neinI = soll.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0);
    await erwarte(meldung(page)).toContainText('Lege die ' + f.lv.zahl);
    // Los ist grau, solange alle Karten umgedreht sind: ein Tipp sagt, was zu tun ist
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, LOS);
    await erwarte(meldung(page)).toContainText('Tippe zuerst');
    // Doppeltipp dreht eine Karte nur einmal um
    await h.doppeltipp(page, DREH(jaI[0]));
    await erwarte(page.locator(JA)).toHaveCount(1);
    await erwarte(page.locator(DREH(jaI[0]))).toHaveClass(/janein-ja/);
    await erwarte(meldung(page)).toContainText('Los');
    // Zu viel: die richtigen und eine Karte mehr
    for (const i of jaI.slice(1)) await h.tippe(page, DREH(i));
    await h.tippe(page, DREH(neinI[0]));
    const zuViel = soll.slice(); zuViel[neinI[0]] = true;
    await h.tippe(page, LOS);
    // langsam zusammenzählen: eine Karte nach der anderen leuchtet, die Rechnung wächst
    await erwarte(page.locator('.feld .janein-ding.janein-zaehlt')).toHaveCount(1);
    await erwarte(meldung(page)).toContainText('Zusammenzählen');
    await erwarte(page.locator(LOS)).toBeDisabled();
    await h.ansicht(page, 'janein-zaehlen', info);
    await erwarte(meldung(page)).toContainText('Zu viel', { timeout: 15_000 });
    await erwarte(meldung(page)).toContainText('Das ist ' + J.wert(zuViel, n));
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(rechnung(page)).toContainText(rechnungRe(J.rechnung(zuViel, n)));
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await h.ansicht(page, 'janein-zu-viel', info);
    // Ändern löscht die Rechnung. Zu wenig: nur die größte Ja-Karte
    await h.tippe(page, DREH(neinI[0]));
    await erwarte(rechnung(page)).toHaveText('');
    for (const i of jaI.slice(1)) await h.tippe(page, DREH(i));
    await h.tippe(page, LOS);
    await erwarte(meldung(page)).toContainText('Zu wenig', { timeout: 15_000 });
    await erwarte(meldung(page)).toContainText('Das ist ' + J.werte(n)[jaI[0]]);
    // Richtig: Stern, die Rechnung steht im Geschafft-Fenster
    for (const i of jaI.slice(1)) await h.tippe(page, DREH(i));
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 20_000 });
    await erwarte(page.locator('.dialog p')).toContainText(rechnungRe(J.rechnung(soll, n)));
    await erwarte(page.locator('.feld .janein-ding.janein-gezaehlt')).toHaveCount(jaI.length);
    // Nochmal: alle Karten wieder umgedreht, keine Rechnung
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator(JA)).toHaveCount(0);
    await erwarte(rechnung(page)).toHaveText('');
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await erwarte(meldung(page)).toContainText('Lege die ' + f.lv.zahl);
  });

  test('Ja/Nein: Nochmal mitten im Zählen, Gerät drehen', async ({ page }, info) => {
    const f = h.suche('janein', (l) => l.aufgabe === 'legen' && (l.aussehen || 'karten') === 'karten' && loesungLegen(l).filter(Boolean).length >= 2);
    test.skip(!f, 'kein passendes Legen-Level');
    // langsam zählen (2 s pro Karte), damit das Drehen und das Foto sicher mitten ins Zählen fallen
    await page.addInitScript(() => { window.WERKSTATT_TEMPO = 2000; });
    await h.oeffneLevel(page, f, info);
    const soll = loesungLegen(f.lv);
    for (let i = 0; i < soll.length; i++) if (soll[i]) await h.tippe(page, DREH(i));
    await h.tippe(page, LOS);
    await erwarte(page.locator('.feld .janein-ding.janein-zaehlt')).toHaveCount(1);
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await h.ansicht(page, 'janein-gedreht-beim-zaehlen', info);
    await page.setViewportSize(g);
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await erwarte(page.locator(JA)).toHaveCount(0);
    await page.waitForTimeout(4500);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(rechnung(page)).toHaveText('');
    await erwarte(page.locator(JA)).toHaveCount(0);
  });

  test('Ja/Nein lesen: freundlicher Hinweis, dann richtig', async ({ page }, info) => {
    const f = h.suche('janein', (l) => l.aufgabe === 'lesen' && (l.wahl || []).length >= 2);
    test.skip(!f, 'kein Lesen-Level');
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    const soll = loesungLesen(f.lv);
    await erwarte(page.locator('.programm .janein-kasten')).toHaveText('?');
    // Die Karten sind hier nur zum Anschauen
    await erwarte(page.locator('.feld [data-aktion="janein-dreh"]')).toHaveCount(0);
    for (const x of f.lv.wahl.filter((y) => y !== soll)) {
      await h.tippe(page, ZAHL(x));
      await erwarte(page.locator('.programm .janein-kasten')).toHaveText(String(x));
      await erwarte(meldung(page)).toContainText(x + ' ist ' + (x > soll ? 'zu viel' : 'zu wenig'));
      await erwarte(meldung(page)).not.toContainText(String(soll));
      await erwarte(page.locator('.dialog')).toHaveCount(0);
    }
    await h.ansicht(page, 'janein-lesen-hinweis', info);
    await h.tippe(page, ZAHL(soll));
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 20_000 });
    await erwarte(rechnung(page)).toContainText(String(soll));
    // Nochmal: wieder ein leeres Feld
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.programm .janein-kasten')).toHaveText('?');
    await erwarte(rechnung(page)).toHaveText('');
  });

  test('Ja/Nein Kobold: nur eine Karte umgedreht, falsch, Doppeltipp, richtig, Nochmal', async ({ page }, info) => {
    const f = h.suche('janein', (l) => l.aufgabe === 'kobold');
    test.skip(!f, 'kein Kobold-Level');
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    const n = J.anzahl(f.lv.anzahl);
    const anfang = ja(f.lv);
    const stelle = loesungKobold(f.lv);
    const andere = [0, 1, 2, 3, 4].filter((i) => i < n && i !== stelle);
    const istJa = (i, w) => erwarte(page.locator(DREH(i))).toHaveClass(w ? /janein-ja/ : /janein-nein/);
    await erwarte(page.locator('.programm .janein-sprech')).toContainText(String(f.lv.zahl));
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, LOS);
    await erwarte(meldung(page)).toContainText('Tippe zuerst');
    // Eine falsche Karte umdrehen, dann eine andere: die erste liegt wieder wie vorher
    await h.tippe(page, DREH(andere[0]));
    await istJa(andere[0], !anfang[andere[0]]);
    await h.tippe(page, DREH(andere[1]));
    await erwarte(page.locator('.feld .janein-gedreht')).toHaveCount(1);
    await istJa(andere[0], anfang[andere[0]]);
    await istJa(andere[1], !anfang[andere[1]]);
    await erwarte(meldung(page)).toContainText('wieder wie vorher');
    await h.tippe(page, LOS);
    await erwarte(meldung(page)).toContainText('Such den Kobold nochmal', { timeout: 15_000 });
    await erwarte(meldung(page)).toContainText('nicht ' + f.lv.zahl);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await h.ansicht(page, 'janein-kobold-hinweis', info);
    // Doppeltipp auf die richtige Karte: nur einmal umgedreht
    await h.doppeltipp(page, DREH(stelle));
    await erwarte(page.locator('.feld .janein-gedreht')).toHaveAttribute('data-i', String(stelle));
    await istJa(stelle, !anfang[stelle]);
    await istJa(andere[1], anfang[andere[1]]);
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 20_000 });
    await erwarte(page.locator('.dialog p')).toContainText('Kobold erwischt');
    // Nochmal: so, wie der Kobold sie gelegt hat
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.feld .janein-gedreht')).toHaveCount(0);
    for (let i = 0; i < n; i++) await istJa(i, anfang[i]);
  });

  test('Ja/Nein Finger: jeder Finger einzeln, Gerät drehen', async ({ page }, info) => {
    const f = h.suche('janein', (l) => l.aussehen === 'finger' && l.aufgabe !== 'lesen');
    test.skip(!f, 'kein Finger-Level');
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    // Alle fünf Finger hoch (31), dann wieder runter
    for (let i = 0; i < 5; i++) await h.tippe(page, DREH(i));
    await erwarte(page.locator(JA)).toHaveCount(5);
    await h.ansicht(page, 'janein-finger-alle', info);
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await h.ansicht(page, 'janein-finger-gedreht', info);
    await page.setViewportSize(g);
    await h.ansicht(page, 'janein-finger-zurueck', info);
    for (let i = 0; i < 5; i++) await h.tippe(page, DREH(i));
    await erwarte(page.locator(JA)).toHaveCount(0);
  });
}
