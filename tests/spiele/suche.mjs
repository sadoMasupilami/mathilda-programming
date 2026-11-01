// Test-Plugin für die Rätselart „suche“ (Einheit 10, web/spiele/suche.js)
// Die Lösungen rechnet der Test selbst mit web/kern/suche.js aus (wie der Löser); die App kennt keine.
// Halbier-Suche: Die geheime Zahl kennt der Test nicht (die App würfelt sie). Er halbiert einfach mit
// dem Kern (WerkstattSuche.mitten) und liest nur ab, welche Zahlen noch gehen. Für feste Zahlen ersetzt
// ein Test Math.random vor dem Laden der Seite.
import { expect } from '@playwright/test';
import '../../web/kern/suche.js';

const S = globalThis.WerkstattSuche;

const KARTE = (i) => '.feld [data-aktion="suche-karte"][data-i="' + i + '"]';
const ZAHL = (x) => '.feld [data-aktion="suche-zahl"][data-i="' + x + '"]';
const ZIFFER = (d) => '.tasten [data-aktion="suche-ziffer"][data-i="' + d + '"]';
const LOESCHEN = '.tasten [data-aktion="suche-loeschen"]';
const FRAGEN = '.tasten [data-aktion="los"]';
const TAUSCHEN = '.tasten [data-aktion="suche-tauschen"]';
const BLEIBEN = '.tasten [data-aktion="suche-bleiben"]';
const NOCHMAL = '.tasten [data-aktion="nochmal"]';
const FELD_RATEN = '.feld .suche-feld-raten';
const VERGLEICH = '.programm .suche-vergleich';
const anzahl = (n, eins, mehr) => n + ' ' + (n === 1 ? eins : mehr);
const vergleichText = (x, y) => 'Am kleinen Punkt die ' + x + ', am großen Punkt die ' + y;
const tasta = (lv) => lv.bis > 32;
const kartenName = (lv, v) => (lv.aussehen === 'turm' ? 'Turm mit ' + anzahl(v, 'Stein', 'Steinen') : 'Karte ' + v);

// Zwei Tipps auf dieselbe Karte kurz hintereinander sind für die App ein Doppeltipp (der zweite zählt nicht).
// Ein Kind tippt nicht so schnell zweimal absichtlich: Der Test wartet dann kurz.
function tipper(page, h) {
  let zuletzt = null;
  return async (sel) => {
    if (zuletzt === sel) await page.waitForTimeout(380);
    zuletzt = sel;
    await h.tippe(page, sel);
  };
}

// Nach dem Drehen passt die App die Größen an, sobald der Browser die neue Größe meldet (ResizeObserver,
// in WebKit manchmal erst nach über 100 ms): warten, bis alles im Feld liegt
async function passtInsFeld(page) {
  await page.waitForFunction(() => {
    const f = document.querySelector('.feld'), inhalt = document.querySelector('.feld .suche-feld > *');
    if (!f || !inhalt) return false;
    const a = f.getBoundingClientRect(), b = inhalt.getBoundingClientRect();
    return b.left >= a.left - 0.5 && b.right <= a.right + 0.5 && b.top >= a.top - 0.5 && b.bottom <= a.bottom + 0.5;
  });
}

async function bereich(page) {
  const f = page.locator(FELD_RATEN);
  return { von: Number(await f.getAttribute('data-von')), bis: Number(await f.getAttribute('data-bis')) };
}
async function tippeZahl(page, h, lv, x) {
  if (tasta(lv)) {
    for (const d of String(x)) await h.tippe(page, ZIFFER(d));
    await expect(page.locator('.programm .suche-du .suche-x')).toHaveText(String(x));
  } else await h.tippe(page, ZAHL(x));
}
async function frage(page, h, lv, x, n) {
  await tippeZahl(page, h, lv, x);
  await h.tippe(page, FRAGEN);
  if (n !== undefined) await expect(page.locator('.programm .suche-steine-text')).toHaveText(anzahl(n, 'Frage', 'Fragen'));
}
// Halbieren bis zur gefundenen Zahl, gibt die Zahl der Fragen zurück
async function halbiere(page, h, lv, info, schon, foto) {
  let n = schon || 0;
  for (;;) {
    const { von, bis } = await bereich(page);
    if (von === bis) return n;
    const x = S.mitten(von, bis)[0];
    expect(S.bewerte(von, bis, x).art, 'Halbier-Frage ' + x + ' bei ' + von + ' bis ' + bis).toBe('gut');
    await tippeZahl(page, h, lv, x);
    if (foto && n === (schon || 0)) {
      // Vorschau der Frage: blau der Nein-Teil, golden der Ja-Teil
      await expect(page.locator('.feld .suche-zahl.suche-nein')).toHaveCount(x - von + 1);
      await expect(page.locator('.feld .suche-zahl.suche-ja')).toHaveCount(bis - x);
      await h.ansicht(page, foto, info);
    }
    await h.tippe(page, FRAGEN);
    n++;
    await expect(page.locator('.programm .suche-steine-text')).toHaveText(anzahl(n, 'Frage', 'Fragen'));
  }
}

export async function spiele(page, lv, h, info) {
  const kurz = lv.id.replace(/^e\d+-/, '');
  if (lv.aufgabe === 'tauschen') {
    // Der kürzeste Weg aus dem Kern: immer zwei Nachbarn, die verkehrt stehen (so viele wie Fehlstellen)
    const weg = S.tauschWeg(lv.zahlen);
    expect(weg.length).toBe(S.fehlstellen(lv.zahlen));
    const tippe = tipper(page, h);
    for (let k = 0; k < weg.length; k++) {
      await tippe(KARTE(weg[k]));
      await expect(page.locator('.feld .suche-karte.suche-gewaehlt')).toHaveCount(1);
      if (k === 0) await h.ansicht(page, 'suche-' + kurz + '-gewaehlt', info);
      await tippe(KARTE(weg[k] + 1));
      if (k < weg.length - 1) await expect(page.locator('.programm .suche-zaehler b')).toHaveText(String(k + 1));
    }
    await expect(page.locator('.dialog p')).toContainText('Sortiert mit ' + anzahl(weg.length, 'Tausch', 'Tauschen') + '. Weniger geht nicht!', { timeout: 20_000 });
  } else if (lv.aufgabe === 'netz') {
    const lauf = S.laufen(lv.bahnen, lv.vergleiche, lv.start);
    expect(lauf.sortiert).toBe(true);
    for (const [k, s] of lauf.schritte.entries()) {
      await expect(page.locator(VERGLEICH)).toHaveAttribute('aria-label', vergleichText(s.rein[0], s.rein[1]));
      if (k === 2) await h.ansicht(page, 'suche-' + kurz + '-mitte', info);
      await h.tippe(page, s.getauscht ? TAUSCHEN : BLEIBEN);
    }
    await expect(page.locator('.meldung')).toContainText('Am Ziel: ' + lauf.ende.join(', ') + '. Sortiert!');
    await expect(page.locator('.dialog p')).toContainText('Am Ziel: ' + lauf.ende.join(', ') + '. Sortiert!', { timeout: 20_000 });
  } else {
    await expect(page.locator(FELD_RATEN)).toHaveAttribute('data-von', '1');
    await expect(page.locator(FELD_RATEN)).toHaveAttribute('data-bis', String(lv.bis));
    const n = await halbiere(page, h, lv, info, 0, 'suche-' + kurz + '-frage');
    expect(n, 'Halbieren braucht höchstens ' + S.hoechstens(lv.bis) + ' Fragen').toBeLessThanOrEqual(S.hoechstens(lv.bis));
    await expect(page.locator('.dialog p')).toContainText('Gefunden mit ' + anzahl(n, 'Frage', 'Fragen'), { timeout: 20_000 });
    await expect(page.locator('.dialog p')).toContainText('höchstens ' + S.hoechstens(lv.bis));
  }
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
  await h.ansicht(page, 'suche-' + kurz + '-geschafft', info);
}

export function tests({ test, expect: erwarte, DATEN, h }) {
  const meldung = (page) => page.locator('.meldung');
  const levels = DATEN.pakete.flatMap((p) => p.levels).filter((l) => l.art === 'suche');
  // Math.random fest (vor dem Laden der Seite): 0.999 → die geheime Zahl ist die größte, 0 → die 1
  const zufall = (page, wert) => page.addInitScript((w) => { Math.random = () => w; }, wert);

  test('Suche: Die App kennt keine Lösungen', async () => {
    erwarte(levels.length).toBeGreaterThan(0);
    const erlaubt = { tauschen: ['zahlen', 'aussehen'], netz: ['bahnen', 'vergleiche', 'start'], raten: ['bis'] };
    for (const l of levels) {
      erwarte(Object.keys(erlaubt), l.id).toContain(l.aufgabe);
      const ok = ['id', 'art', 'aufgabe', 'titel'].concat(erlaubt[l.aufgabe]);
      erwarte(Object.keys(l).filter((k) => !ok.includes(k)), l.id).toEqual([]);
    }
  });

  test('Suche: Paket-Bild auch beim direkten Aufruf (QR-Code)', async ({ page }, info) => {
    const f = h.suche('suche', () => true);
    test.skip(!f, 'kein Suche-Level');
    await page.goto('./#' + f.p.paket);
    await erwarte(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await erwarte(page.locator('.paket-bild svg.suche-icon')).toHaveCount(1);
    await h.ansicht(page, 'suche-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await erwarte(page.locator('.kachel[data-paket="' + f.p.paket + '"] svg.suche-icon')).toHaveCount(1);
  });

  test('Suche tauschen: nur Nachbarn, Doppeltipp, schon richtig, Nochmal, Profi-Frage', async ({ page }, info) => {
    const passt = (l) => l.aufgabe === 'tauschen' && l.zahlen.length >= 4 && l.zahlen.some((x, i) => i > 0 && l.zahlen[i - 1] < x);
    const f = h.suche('suche', (l) => passt(l) && l.aussehen !== 'turm') || h.suche('suche', passt);
    test.skip(!f, 'kein passendes Tausch-Level');
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    const z = f.lv.zahlen;
    const tippe = tipper(page, h);
    const gewaehlt = page.locator('.feld .suche-karte.suche-gewaehlt');
    await erwarte(meldung(page)).toContainText('Tippe zwei Nachbarn an');
    // Doppeltipp: die Karte ist gewählt (nicht gleich wieder abgewählt)
    await h.doppeltipp(page, KARTE(0));
    await erwarte(gewaehlt).toHaveCount(1);
    await erwarte(page.locator(KARTE(0))).toHaveClass(/suche-gewaehlt/);
    // Keine Nachbarn: freundlicher Hinweis, nichts getauscht
    await tippe(KARTE(2));
    await erwarte(meldung(page)).toContainText('Nur Nachbarn können tauschen');
    await erwarte(page.locator(KARTE(0))).toHaveClass(/suche-gewaehlt/);
    await erwarte(page.locator('.programm .suche-zaehler b')).toHaveText('0');
    await h.ansicht(page, 'suche-tauschen-nachbarn', info);
    // Nochmal antippen: doch nicht
    await tippe(KARTE(0));
    await erwarte(gewaehlt).toHaveCount(0);
    // Zwei, die schon richtig stehen: getauscht, aber mit Hinweis
    const i = z.findIndex((x, j) => j < z.length - 1 && x < z[j + 1]);
    await tippe(KARTE(i));
    await tippe(KARTE(i + 1));
    await erwarte(meldung(page)).toContainText('standen schon richtig');
    await erwarte(page.locator('.programm .suche-zaehler b')).toHaveText('1');
    await erwarte(page.locator(KARTE(i))).toHaveAttribute('aria-label', kartenName(f.lv, z[i + 1]));
    await h.ansicht(page, 'suche-tauschen-schon-richtig', info);
    // Nochmal: alles wie am Anfang
    await tippe(NOCHMAL);
    await erwarte(page.locator('.programm .suche-zaehler b')).toHaveText('0');
    for (let j = 0; j < z.length; j++) await erwarte(page.locator(KARTE(j))).toHaveAttribute('aria-label', kartenName(f.lv, z[j]));
    // Mit einem Tausch zu viel: Stern, aber eine Profi-Frage
    await tippe(KARTE(i));
    await tippe(KARTE(i + 1));
    const jetzt = S.tausche(z, i);
    for (const j of S.tauschWeg(jetzt)) { await tippe(KARTE(j)); await tippe(KARTE(j + 1)); }
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 15_000 });
    await erwarte(page.locator('.dialog p')).toContainText('Profi-Frage: Geht es auch mit ' + S.fehlstellen(z) + '?');
    await h.ansicht(page, 'suche-tauschen-profi', info);
  });

  test('Suche Netz: falsche Wahl, Doppeltipp, Nochmal, Gerät drehen', async ({ page }, info) => {
    const f = h.suche('suche', (l) => {
      if (l.aufgabe !== 'netz') return false;
      const s = S.laufen(l.bahnen, l.vergleiche, l.start).schritte;
      return s.length >= 3 && s[0].getauscht && s.some((x) => !x.getauscht);
    });
    test.skip(!f, 'kein passendes Netz-Level');
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    const lauf = S.laufen(f.lv.bahnen, f.lv.vergleiche, f.lv.start);
    const [s1, s2] = lauf.schritte;
    await erwarte(meldung(page)).toContainText('kleinen Punkt');
    // Stelle 1 muss tauschen: „bleiben“ geht nicht, die App sagt freundlich, worauf man schaut
    await h.tippe(page, BLEIBEN);
    await erwarte(meldung(page)).toContainText('Schau genau: Die ' + Math.min(...s1.rein) + ' ist kleiner als die ' + Math.max(...s1.rein));
    await erwarte(page.locator(VERGLEICH)).toHaveAttribute('aria-label', vergleichText(s1.rein[0], s1.rein[1]));
    await h.ansicht(page, 'suche-netz-hinweis', info);
    // Doppeltipp auf „tauschen“: nur eine Vergleichs-Stelle weiter
    await h.doppeltipp(page, TAUSCHEN);
    await erwarte(page.locator(VERGLEICH)).toHaveAttribute('aria-label', vergleichText(s2.rein[0], s2.rein[1]));
    await erwarte(page.locator('.programm .suche-vergleich-text')).toContainText('Stelle 2');
    // Die erste Stelle, die bleibt: „tauschen“ gibt einen Hinweis
    const k = lauf.schritte.findIndex((x) => !x.getauscht);
    for (let j = 1; j < k; j++) await h.tippe(page, lauf.schritte[j].getauscht ? TAUSCHEN : BLEIBEN);
    await h.tippe(page, TAUSCHEN);
    await erwarte(meldung(page)).toContainText('steht schon beim kleinen Punkt');
    await erwarte(page.locator('.programm .suche-vergleich-text')).toContainText('Stelle ' + (k + 1));
    // Gerät drehen: das Netz zeichnet sich neu, alles bleibt, wie es war
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await passtInsFeld(page);
    await erwarte(page.locator('.programm .suche-vergleich-text')).toContainText('Stelle ' + (k + 1));
    await h.ansicht(page, 'suche-netz-gedreht', info);
    await page.setViewportSize(g);
    // Nochmal: alle Zahlen zurück an den Start
    await h.tippe(page, NOCHMAL);
    await erwarte(page.locator(VERGLEICH)).toHaveAttribute('aria-label', vergleichText(s1.rein[0], s1.rein[1]));
    await erwarte(page.locator('.programm .suche-vergleich-text')).toContainText('Stelle 1');
  });

  test('Suche raten: durchgestrichen, weißt du schon, Doppeltipp, immer 1 mehr, Fast geschafft, Nochmal', async ({ page }, info) => {
    const f = h.suche('suche', (l) => l.aufgabe === 'raten' && !tasta(l));
    test.skip(!f, 'kein Rate-Level mit Zahlen-Tasten');
    await zufall(page, 0.999);       // die geheime Zahl ist die größte
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    const bis = f.lv.bis, hmax = S.hoechstens(bis);
    const steine = page.locator('.programm .suche-steine-text');
    await erwarte(meldung(page)).toContainText('Der Drache denkt sich eine Zahl von 1 bis ' + bis);
    // Fragen ohne Zahl: grau, ein Tipp sagt, was zu tun ist
    await erwarte(page.locator(FRAGEN)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, FRAGEN);
    await erwarte(meldung(page)).toContainText('Tippe zuerst eine Zahl an');
    // Die größte Zahl: Die Antwort weiß man schon, das zählt nicht
    await h.tippe(page, ZAHL(bis));
    await erwarte(meldung(page)).toContainText('Das weißt du schon');
    await erwarte(page.locator('.feld .suche-gewaehlt')).toHaveCount(0);
    await erwarte(steine).toHaveText('0 Fragen');
    // Doppeltipp auf eine Zahl: Sie bleibt gewählt, die Vorschau zeigt beide Teile
    const m = S.mitten(1, bis)[0];
    await h.doppeltipp(page, ZAHL(m));
    await erwarte(page.locator(ZAHL(m))).toHaveClass(/suche-gewaehlt/);
    await erwarte(page.locator('.feld .suche-zahl.suche-nein')).toHaveCount(m);
    await erwarte(page.locator('.feld .suche-zahl.suche-ja')).toHaveCount(bis - m);
    await erwarte(page.locator('.programm .suche-du .suche-x')).toHaveText(String(m));
    await h.ansicht(page, 'suche-raten-vorschau', info);
    // Nochmal antippen: doch nicht
    await h.tippe(page, ZAHL(m));
    await erwarte(page.locator('.feld .suche-gewaehlt')).toHaveCount(0);
    // Immer 1 mehr: größer als 1? größer als 2? … (die geheime Zahl ist die größte, das dauert)
    await frage(page, h, f.lv, 1, 1);
    await erwarte(page.locator('.programm .suche-antwort')).toHaveText('Ja!');
    await erwarte(page.locator(ZAHL(1))).toHaveClass(/suche-weg/);
    await erwarte(meldung(page)).toContainText('Ja! Noch ' + (bis - 1) + ' Zahlen.');
    // Eine durchgestrichene Zahl: Hinweis, zählt nicht
    await h.tippeGrau(page, ZAHL(1));
    await erwarte(meldung(page)).toContainText('schon durchgestrichen');
    await erwarte(steine).toHaveText('1 Frage');
    await h.ansicht(page, 'suche-raten-durchgestrichen', info);
    for (let x = 2; x < bis; x++) await frage(page, h, f.lv, x, x);
    await erwarte(page.locator('.dialog h2')).toHaveText('Fast geschafft!', { timeout: 15_000 });
    await erwarte(page.locator('.dialog p')).toContainText('Die Zahl ist ' + bis + '. Gefunden mit ' + (bis - 1) + ' Fragen. Mit Halbieren reichen immer höchstens ' + hmax + '.');
    await erwarte(page.locator('.punkte .punkt.voll')).toHaveCount(0);
    await h.ansicht(page, 'suche-raten-fast', info);
    // Nochmal (im Fenster): eine neue Zahl, alles offen, keine Frage gezählt
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator(FELD_RATEN)).toHaveAttribute('data-von', '1');
    await erwarte(page.locator(FELD_RATEN)).toHaveAttribute('data-bis', String(bis));
    await erwarte(page.locator('.feld .suche-weg')).toHaveCount(0);
    await erwarte(steine).toHaveText('0 Fragen');
    // Mit Glück: größer als (bis − 1)? Ja! Gefunden mit 1 Frage, Stern mit dem Hinweis auf das Glück
    await frage(page, h, f.lv, bis - 1, 1);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 15_000 });
    await erwarte(page.locator('.dialog p')).toContainText('Glück gehabt!');
  });

  test('Suche raten bis 100: Ziffern-Tasten, löschen, zu große Zahl, schon durchgestrichen', async ({ page }, info) => {
    const f = h.suche('suche', (l) => l.aufgabe === 'raten' && tasta(l));
    test.skip(!f, 'kein Rate-Level mit Ziffern-Tasten');
    await zufall(page, 0);           // die geheime Zahl ist die 1
    await h.schnell(page);
    await h.oeffneLevel(page, f, info);
    const bis = f.lv.bis;
    const x = page.locator('.programm .suche-du .suche-x');
    const steine = page.locator('.programm .suche-steine-text');
    await erwarte(page.locator('.feld .suche-tafel .suche-zahl')).toHaveCount(bis);
    await erwarte(page.locator('.tasten [data-aktion="suche-ziffer"]')).toHaveCount(10);
    await erwarte(page.locator(LOESCHEN)).toBeDisabled();
    await h.tippe(page, ZIFFER(0));
    await erwarte(meldung(page)).toContainText('fängt nicht mit 0 an');
    // zu groß: Hinweis, Fragen zählt nicht
    for (const d of String(bis + 50)) await h.tippe(page, ZIFFER(d));
    await erwarte(meldung(page)).toContainText('Nur Zahlen von 1 bis ' + bis);
    await h.tippe(page, FRAGEN);
    await erwarte(meldung(page)).toContainText('Nur Zahlen von 1 bis ' + bis);
    await erwarte(steine).toHaveText('0 Fragen');
    await erwarte(x).toHaveText('?');
    // tippen, löschen, weiter tippen
    await h.tippe(page, ZIFFER(5));
    await h.tippe(page, ZIFFER(1));
    await erwarte(x).toHaveText('51');
    await h.tippe(page, LOESCHEN);
    await erwarte(x).toHaveText('5');
    await h.tippe(page, ZIFFER(0));
    await erwarte(x).toHaveText('50');
    await erwarte(page.locator('.feld .suche-zahl.suche-nein')).toHaveCount(50);
    await h.ansicht(page, 'suche-tasta-eingabe', info);
    await h.tippe(page, FRAGEN);
    await erwarte(page.locator('.programm .suche-antwort')).toHaveText('Nein!');
    await erwarte(page.locator(FELD_RATEN)).toHaveAttribute('data-bis', '50');
    await erwarte(page.locator('.feld .suche-zahl.suche-weg')).toHaveCount(bis - 50);
    await erwarte(steine).toHaveText('1 Frage');
    // schon durchgestrichen: zählt nicht
    await frage(page, h, f.lv, 60);
    await erwarte(meldung(page)).toContainText('schon durchgestrichen');
    await erwarte(steine).toHaveText('1 Frage');
    await h.ansicht(page, 'suche-tasta-weg', info);
    // weiter mit Halbieren: höchstens 7 Fragen
    const n = await halbiere(page, h, f.lv, info, 1);
    erwarte(n).toBeLessThanOrEqual(S.hoechstens(bis));
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 15_000 });
    await erwarte(page.locator('.dialog p')).toContainText('Die Zahl ist 1.');
  });

  test('Suche raten: Gerät drehen mit vielen Zahlen-Tasten', async ({ page }, info) => {
    // die Rate-Level mit den meisten Zahlen-Tasten (bis 32): beide Lagen ohne Scrollen, Tasten groß genug
    const f = h.suche('suche', (l) => l.aufgabe === 'raten' && !tasta(l) && !levels.some((m) => m.aufgabe === 'raten' && !tasta(m) && m.bis > l.bis));
    test.skip(!f, 'kein Rate-Level');
    await h.oeffneLevel(page, f, info);
    await h.tippe(page, ZAHL(S.mitten(1, f.lv.bis)[0]));
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await passtInsFeld(page);
    await erwarte(page.locator('.feld .suche-zahl')).toHaveCount(f.lv.bis);
    await erwarte(page.locator('.feld .suche-gewaehlt')).toHaveCount(1);
    await h.ansicht(page, 'suche-raten-gedreht', info);
    await page.setViewportSize(g);
    await passtInsFeld(page);
    await h.ansicht(page, 'suche-raten-zurueck', info);
  });
}
