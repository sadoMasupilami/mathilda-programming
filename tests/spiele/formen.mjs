// Test-Plugin für die Rätselart „formen“ (Einheit 14, Paket e14) – eingebunden von tests/web.spec.mjs.
// Die Lösungen rechnet der Test selbst mit dem Kern aus (web/kern/formen.js: Backtracking, bewerte);
// die App kennt keine Lösungen. Jede neue Ansicht wird mit h.ansicht fotografiert und geprüft.
import '../../web/kern/formen.js';

const FQ = globalThis.WerkstattFormen;
const zelle = (x, y) => '.feld .formen-zelle[data-x="' + x + '"][data-y="' + y + '"]';
const formTaste = (f) => '.tasten [data-aktion="form"][data-form="' + f + '"]';
const istKobold = (lv) => lv.aufgabe === 'kobold';

// Lösung (loesen) bzw. Reparatur (kobold) mit dem Kern: Liste der Felder, die das Kind ändern muss
function zuSetzen(lv) {
  const q = FQ.lies(lv);
  if (istKobold(lv)) {
    const rep = [];
    for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) {
      for (const f of q.formen) {
        if (q.zellen[y][x].f === f) continue;
        const z = FQ.kopie(q.zellen);
        z[y][x] = { f, c: null };
        if (FQ.bewerte(lv, z).geschafft) rep.push({ x, y, f });
      }
    }
    if (rep.length !== 1) throw new Error(lv.id + ': ' + rep.length + ' Ein-Feld-Reparaturen statt einer');
    return rep;
  }
  const l = FQ.loese(q, { max: 2 });
  if (l.anzahl !== 1) throw new Error(lv.id + ': ' + l.anzahl + ' Lösungen statt einer');
  const aus = [];
  for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) if (!q.zellen[y][x]) aus.push({ x, y, f: l.loesungen[0][y][x].f });
  return aus;
}
async function setze(page, h, liste) {
  for (const s of liste) {
    await h.tippe(page, zelle(s.x, s.y));
    await h.tippe(page, formTaste(s.f));
  }
}
async function formenImBrett(page) {
  return page.$$eval('.feld .formen-zelle', (els) => els.map((e) => e.dataset.x + ',' + e.dataset.y + '=' + (e.dataset.form || '')));
}

// Ein Level per Antippen lösen, bis das Geschafft-Fenster kommt
export async function spiele(page, lv, h, info, fotos) {
  const liste = zuSetzen(lv);
  if (fotos) {
    await h.tippe(page, zelle(liste[0].x, liste[0].y));
    await h.ansicht(page, 'formen-feld-gewaehlt', info);
  }
  await setze(page, h, liste);
  if (fotos) await h.ansicht(page, 'formen-ausgefuellt', info);
  await h.tippe(page, '.tasten [data-aktion="los"]');
}

export function tests({ test, expect, h }) {
  const drei = h.suche('formen', (l) => !istKobold(l) && l.n === 3 && !l.diagonale && FQ.lies(l).zellen.flat().filter((c) => !c).length >= 3);
  const kobold = h.suche('formen', (l) => istKobold(l));
  const schraegen = h.suche('formen', (l) => !istKobold(l) && l.diagonale);
  const meldung = (page) => page.locator('.meldung');

  test('Formen-Quadrat: freundliche Hinweise statt „falsch“, Nochmal, Doppeltipp', async ({ page }, info) => {
    test.skip(!drei, 'kein 3 · 3-Level');
    const lv = drei.lv;
    const q = FQ.lies(lv);
    await h.oeffneLevel(page, drei, info);
    await expect(page.locator('.feld .formen-zelle')).toHaveCount(9);
    // In der App gibt es keine Lösung (auch nicht beim Kobold, welches Feld falsch ist)
    const daten = await page.evaluate(() => JSON.stringify(window.WERKSTATT_DATEN.pakete.map((p) => p.levels.filter((l) => l.art === 'formen'))));
    expect(daten).toContain('"vorgabe":');
    expect(daten).not.toMatch(/"(loesung|quadrat|loesungen|schritte|beispiele|kobold|richtig|feld|falsch|logik|stufe)":/);

    const leer = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (!q.zellen[y][x]) leer.push([x, y]);
    const fest = (() => { for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (q.zellen[y][x]) return [x, y]; return null; })();

    // „Los“ ohne eine Form: freundlich, leere Felder gestrichelt, kein Geschafft
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(meldung(page)).toContainText('Tippe ein leeres Feld an');
    await expect(page.locator('.formen-zelle.formen-leer')).toHaveCount(leer.length);
    await expect(page.locator('.dialog')).toHaveCount(0);

    // Form ohne ausgewähltes Feld (grau): Hinweis
    await h.tippeGrau(page, formTaste(q.formen[0]));
    await expect(meldung(page)).toContainText('Tippe zuerst ein leeres Feld an.');
    // Vorgegebene Form: bleibt, wie sie ist
    await h.tippe(page, zelle(fest[0], fest[1]));
    await expect(meldung(page)).toContainText('schon da');
    await expect(page.locator('.formen-zelle.formen-gewaehlt')).toHaveCount(0);

    // Doppeltipp auf ein leeres Feld: es bleibt ausgewählt; Doppeltipp auf eine Form: sie steht im Feld
    const [x0, y0] = leer[0];
    await h.doppeltipp(page, zelle(x0, y0));
    await expect(page.locator(zelle(x0, y0))).toHaveClass(/formen-gewaehlt/);
    await expect(page.locator('.formen-zelle.formen-gewaehlt')).toHaveCount(1);
    // eine Form, die in Reihe oder Spalte schon vorkommt: ergibt einen freundlichen Hinweis
    let doppelt = null;
    for (const f of q.formen) {
      const z = FQ.kopie(q.zellen);
      z[y0][x0] = { f, c: null };
      const e = FQ.bewerte(lv, z);
      if (e.grund === 'doppelt') { doppelt = { f, d: e.doppelt[0] }; break; }
    }
    expect(doppelt, 'eine Form, die doppelt wäre').toBeTruthy();
    await h.doppeltipp(page, formTaste(doppelt.f));
    await expect(page.locator(zelle(x0, y0))).toHaveAttribute('data-form', doppelt.f);
    await expect(page.locator(zelle(x0, y0))).toHaveClass(/formen-gewaehlt/);
    await expect(page.locator(formTaste(doppelt.f))).toHaveClass(/formen-an/);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(meldung(page)).toContainText(FQ.fehlerText(doppelt.d));
    await expect(meldung(page)).not.toContainText(/falsch|richtig/i);
    await expect(page.locator('.formen-band')).toHaveCount(1);
    await expect(page.locator('.formen-zelle.formen-doppelt')).toHaveCount(2);
    await expect(page.locator('.dialog')).toHaveCount(0);
    await h.ansicht(page, 'formen-doppelt', info);

    // Feld leer machen: Rahmen weg, wieder die Grund-Meldung
    await h.tippe(page, '.tasten [data-aktion="leeren"]');
    await expect(page.locator(zelle(x0, y0))).toHaveAttribute('data-form', '');
    await expect(page.locator('.formen-band')).toHaveCount(0);
    await expect(meldung(page)).not.toHaveClass(/hinweis/);

    // Ein Teil richtig: keine Form doppelt, noch Felder leer
    const liste = zuSetzen(lv);
    await setze(page, h, liste.slice(0, 1));
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('Keine Form ist doppelt. Noch ' + (liste.length - 1) + ' Felder sind leer.');
    await expect(page.locator('.formen-zelle.formen-leer')).toHaveCount(liste.length - 1);
    await h.ansicht(page, 'formen-noch-leer', info);

    // Nochmal: alles wie am Anfang
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    for (const [x, y] of leer) await expect(page.locator(zelle(x, y))).toHaveAttribute('data-form', '');
    await expect(page.locator('.formen-zelle.formen-gewaehlt')).toHaveCount(0);

    // Richtig lösen, Doppeltipp auf „Los“: Das Geschafft-Fenster bleibt offen (der zweite Tipp trifft keine Taste darin)
    await setze(page, h, liste);
    await h.doppeltipp(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await page.waitForTimeout(500);
    await expect(page.locator('.dialog')).toHaveCount(1);
    await expect(page.locator('.spiel')).toHaveAttribute('data-level', lv.id);
    await expect(page.locator('.formen-brett.formen-geschafft')).toHaveCount(1);
    // „Nochmal“ im Fenster: dasselbe Level von vorne, der Stern bleibt
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await expect(page.locator('.dialog')).toHaveCount(0);
    for (const [x, y] of leer) await expect(page.locator(zelle(x, y))).toHaveAttribute('data-form', '');
    await expect(page.locator('.punkte .punkt.voll')).toHaveCount(1);
  });

  test('Formen-Quadrat: Kobold-Level, nur ein Feld darf anders sein', async ({ page }, info) => {
    test.skip(!kobold, 'kein Kobold-Level');
    const lv = kobold.lv;
    const q = FQ.lies(lv);
    const [rep] = zuSetzen(lv);
    await h.oeffneLevel(page, kobold, info);
    await expect(meldung(page)).toContainText('Kobold');
    await expect(page.locator('.feld .formen-zelle.formen-frei')).toHaveCount(q.n * q.n);
    await expect(page.locator('.tasten [data-aktion="leeren"]')).toHaveCount(0);
    // gleich „Los“: der Kobold ist noch da
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText('Der Kobold ist noch da');
    await expect(page.locator('.dialog')).toHaveCount(0);
    // zwei andere Felder ändern: das erste ist dann wieder wie vorher
    const andere = [];
    for (let y = 0; y < q.n && andere.length < 2; y++) for (let x = 0; x < q.n && andere.length < 2; x++) {
      if (x === rep.x && y === rep.y) continue;
      andere.push({ x, y, f: q.formen.find((f) => f !== q.zellen[y][x].f), alt: q.zellen[y][x].f });
    }
    await setze(page, h, [andere[0]]);
    await expect(page.locator('.formen-zelle.formen-anders')).toHaveCount(1);
    await setze(page, h, [andere[1]]);
    await expect(page.locator('.formen-zelle.formen-anders')).toHaveCount(1);
    await expect(page.locator(zelle(andere[0].x, andere[0].y))).toHaveAttribute('data-form', andere[0].alt);
    await expect(page.locator(zelle(andere[1].x, andere[1].y))).toHaveAttribute('data-form', andere[1].f);
    await expect(meldung(page)).toContainText('Nur ein Feld darf anders sein');
    await h.ansicht(page, 'formen-kobold-ein-feld', info);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toHaveClass(/hinweis/);
    await expect(page.locator('.dialog')).toHaveCount(0);
    // Nochmal: Kobold-Quadrat wie am Anfang
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(page.locator('.formen-zelle.formen-anders')).toHaveCount(0);
    expect(await formenImBrett(page)).toEqual(q.zellen.flatMap((r, y) => r.map((c, x) => x + ',' + y + '=' + c.f)));
    // richtig reparieren: Geschafft, der Kobold sitzt im getauschten Feld
    await setze(page, h, [rep]);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await expect(page.locator('.dialog p')).toContainText('Kobold gefunden');
    await expect(page.locator(zelle(rep.x, rep.y) + ' .formen-koboldbild')).toHaveCount(1);
    await h.ansicht(page, 'formen-kobold-gefunden', info);
  });

  test('Formen-Quadrat: Schrägen in Blau und Gelb', async ({ page }, info) => {
    test.skip(!schraegen, 'kein Level mit Schrägen');
    const lv = schraegen.lv;
    const q = FQ.lies(lv);
    await h.oeffneLevel(page, schraegen, info);
    await expect(page.locator('.formen-zelle.formen-schraege0')).toHaveCount(q.n);
    await expect(page.locator('.formen-zelle.formen-schraege1')).toHaveCount(q.n);
    await expect(meldung(page)).toContainText('blauen Felder');
    await h.ansicht(page, 'formen-schraegen', info);
    // eine Form, die nur auf einer Schräge doppelt ist
    let fall = null;
    for (let y = 0; y < q.n && !fall; y++) for (let x = 0; x < q.n && !fall; x++) {
      if (q.zellen[y][x] || (x !== y && x !== q.n - 1 - y)) continue;
      for (const f of q.formen) {
        const z = FQ.kopie(q.zellen);
        z[y][x] = { f, c: null };
        const e = FQ.bewerte(lv, z);
        if (e.grund === 'doppelt' && e.doppelt.every((d) => d.art === 'schraege')) { fall = { x, y, f, d: e.doppelt[0] }; break; }
      }
    }
    expect(fall, 'eine Form, die nur auf einer Schräge doppelt ist').toBeTruthy();
    await setze(page, h, [fall]);
    await h.tippe(page, '.tasten [data-aktion="los"]');
    await expect(meldung(page)).toContainText(FQ.fehlerText(fall.d));
    await expect(meldung(page)).toContainText(fall.d.nr === 0 ? 'blauen' : 'gelben');
    await expect(page.locator('.formen-zelle.formen-doppelt')).toHaveCount(2);
    await expect(page.locator('.formen-band')).toHaveCount(0);
    await h.ansicht(page, 'formen-schraege-doppelt', info);
  });

  // Ein Level direkt neu laden geht erst, wenn index.html die Spiel-Plugins vor app.js lädt
  // (sonst zeichnet app.js das Level ohne Plugin und bricht ab): Wunsch an den Kern.
  test('Formen-Quadrat: Paket direkt geöffnet (QR-Code am Blatt)', async ({ page }, info) => {
    test.skip(!drei, 'kein Formen-Level');
    await page.goto('./#' + drei.p.paket);
    await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await expect(page.locator('.paket-bild .formen-icon')).toBeVisible();
    await h.ansicht(page, drei.p.paket + '-paket', info);
    await h.tippe(page, '.paket [data-aktion="level"].haupt');
    await expect(page.locator('.spiel.plugin')).toHaveAttribute('data-level', drei.p.levels[0].id);
  });
}
