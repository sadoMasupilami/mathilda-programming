// Test-Plugin für die Rätselart „baum“ (Einheit 13, web/spiele/baum.js)
// Die Lösungen rechnet der Test selbst mit web/kern/baum.js aus (wie der Löser); die App kennt keine:
// Bei folgen und einsortieren sind die Plätze im Baum leer, bei frage fehlt die Frage.
import { expect } from '@playwright/test';
import '../../web/kern/baum.js';

const B = globalThis.WerkstattBaum;

const LOS = '.tasten [data-aktion="los"]';
const NOCHMAL = '.tasten [data-aktion="nochmal"]';
const antwort = (s) => '.tasten [data-aktion="baum-antwort"][data-id="' + s + '"]';
const ding = (id) => '.tasten [data-aktion="baum-ding"][data-id="' + id + '"]';
const platz = (pfad) => '.feld [data-aktion="baum-platz"][data-pfad="' + pfad + '"]';
const option = (f) => '.tasten [data-aktion="baum-option"][data-id="' + f + '"]';
const anderer = (s) => (s === 'ja' ? 'nein' : 'ja');
const KREIS = '.feld .baum-flaeche > svg > g.baum-frage > ellipse';
// Text im Frage-Kästchen (umgebrochen in mehrere Zeilen)
const kaestchenText = (page, pfad) => page.evaluate((p) => Array.from(document.querySelectorAll('.feld .baum-frage[data-knoten="' + p + '"] > text'), (t) => t.textContent).join(' '), pfad);

// folgen: der Weg des gesuchten Wesens (aus der Merkmals-Tabelle)
const wegVon = (lv) => B.folge(lv.baum, lv.dinge.find((d) => d.id === lv.wer)).weg;
// einsortieren: wohin jedes Ding gehört
const zielVon = (lv, d) => B.folge(lv.baum, d).pfad;
// frage: die eine Option, mit der alle richtig landen
function lueckeVon(lv) { return B.fragenImBaum(lv.baum).find((k) => k.f === '?').pfad; }
function passendeOptionen(lv) {
  const l = lueckeVon(lv);
  return lv.optionen.filter((f) => B.pruefe(B.mitFrage(lv.baum, l, f), lv.dinge).ok);
}
function passendeOption(lv) {
  const p = passendeOptionen(lv);
  if (p.length !== 1) throw new Error(lv.id + ': ' + p.length + ' passende Fragen');
  return p[0];
}

// Doppeltipp: zwei Tipps auf dieselbe Stelle gleich hintereinander; der zweite trifft, was nach dem ersten
// dort liegt. Im Browser selbst ausgelöst: Auf einer ausgelasteten Maschine dehnen sich sonst die 60 ms
// zwischen zwei Tipps von außen auf über 350 ms, und dann zählt der zweite Tipp zu Recht.
async function doppeltipp(page, sel) {
  await page.locator('#app:not([data-sperre])').waitFor({ state: 'attached' });
  const r = await page.locator(sel).first().boundingBox();
  await page.evaluate(([x, y]) => {
    for (let i = 0; i < 2; i++) {
      const el = document.elementFromPoint(x, y);
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    }
  }, [r.x + r.width / 2, r.y + r.height / 2]);
  await page.waitForTimeout(450);
}

async function setze(page, h, id, pfad) {
  const t = page.locator(ding(id));
  if (!/baum-gewaehlt/.test((await t.getAttribute('class')) || '')) await h.tippe(page, ding(id));
  await expect(page.locator(ding(id))).toHaveClass(/baum-gewaehlt/);
  await h.tippe(page, platz(pfad));
  await expect(page.locator(platz(pfad))).toHaveClass(/baum-voll/);
}

export async function spiele(page, lv, h, info) {
  const kurz = lv.id.replace(/^e\d+-/, '');
  const feld = page.locator('.feld .baum-feld');
  if (lv.aufgabe === 'folgen') {
    const weg = wegVon(lv);
    for (let i = 0; i < weg.length; i++) {
      await expect(feld).toHaveAttribute('data-aktiv', B.pfadText(weg.slice(0, i)));
      // zweimal dieselbe Taste: Ein Mensch liest erst die nächste Frage (Doppeltipp-Schutz 350 ms)
      if (i > 0 && weg[i] === weg[i - 1]) await page.waitForTimeout(400);
      await h.tippe(page, antwort(weg[i]));
      if (i === 0) await h.ansicht(page, 'baum-' + kurz + '-unterwegs', info);
    }
    await expect(feld).toHaveAttribute('data-weg', B.pfadText(weg));
    await expect(page.locator('.feld .baum-platz.baum-ok')).toHaveAttribute('data-pfad', B.pfadText(weg));
  } else if (lv.aufgabe === 'einsortieren') {
    // Am Anfang ist das erste Wesen schon gewählt
    await expect(page.locator(ding(lv.dinge[0].id))).toHaveClass(/baum-gewaehlt/);
    for (const [i, d] of lv.dinge.entries()) {
      await setze(page, h, d.id, zielVon(lv, d));
      if (i === 0) await h.ansicht(page, 'baum-' + kurz + '-erstes', info);
    }
    await expect(page.locator('.feld .baum-platz.baum-voll')).toHaveCount(lv.dinge.length);
    await expect(page.locator('.tasten [data-aktion="baum-ding"]')).toHaveCount(0);
    await h.ansicht(page, 'baum-' + kurz + '-alle', info);
    await h.tippe(page, LOS);
  } else {
    const f = passendeOption(lv);
    await h.tippe(page, option(f));
    await expect(page.locator(option(f))).toHaveClass(/baum-gewaehlt/);
    await h.ansicht(page, 'baum-' + kurz + '-gewaehlt', info);
    await h.tippe(page, LOS);
  }
  await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
  if (lv.aufgabe !== 'folgen') await expect(page.locator('.feld .baum-platz.baum-ok')).toHaveCount(B.blaetter(lv.baum).length);
  await h.ansicht(page, 'baum-' + kurz + '-geschafft', info);
}

export function tests({ test, expect: erwarte, DATEN, h }) {
  const meldung = (page) => page.locator('.meldung');
  const feld = (page) => page.locator('.feld .baum-feld');

  test('Baum: keine Lösungen in den Daten der App', async () => {
    const levels = DATEN.pakete.flatMap((p) => p.levels).filter((l) => l.art === 'baum');
    erwarte(levels.length).toBeGreaterThan(0);
    for (const l of levels) {
      erwarte(l.loesung, l.id).toBeUndefined();
      erwarte(l.reparatur, l.id).toBeUndefined();
      if (l.aufgabe === 'frage') {
        erwarte(B.fragenImBaum(l.baum).filter((k) => k.f === '?').length, l.id).toBe(1);
      } else {
        erwarte(B.blaetter(l.baum).every((b) => b.inhalt === null), l.id + ': Plätze leer').toBeTruthy();
      }
    }
  });

  test('Baum: Paket-Bild auch beim direkten Aufruf (QR-Code)', async ({ page }, info) => {
    const f = h.suche('baum', () => true);
    test.skip(!f, 'kein Baum-Level');
    await page.goto('./#' + f.p.paket);
    await erwarte(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await erwarte(page.locator('.paket-bild svg.baum-icon')).toHaveCount(1);
    await h.ansicht(page, 'baum-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await erwarte(page.locator('.kachel[data-paket="' + f.p.paket + '"] svg.baum-icon')).toHaveCount(1);
  });

  test('Baum folgen: falscher Ast, freundlicher Hinweis, Doppeltipp, Nochmal', async ({ page }, info) => {
    await h.schnell(page);
    const f = h.suche('baum', (l) => l.aufgabe === 'folgen' && wegVon(l).length >= 2);
    test.skip(!f, 'kein Folgen-Level');
    await h.oeffneLevel(page, f, info);
    const weg = wegVon(f.lv);
    await erwarte(meldung(page)).toContainText('Fang oben an');
    // Die erste Frage falsch beantworten, dann immer weiter mit Ja bis unten
    await h.tippe(page, antwort(anderer(weg[0])));
    await erwarte(feld(page)).toHaveAttribute('data-weg', anderer(weg[0]));
    let falsch = [anderer(weg[0])];
    while (!B.istBlatt(B.bei(f.lv.baum, B.pfadText(falsch)))) {
      await erwarte(meldung(page)).toContainText('?');
      if (falsch[falsch.length - 1] === 'ja') await page.waitForTimeout(400);
      await h.tippe(page, antwort('ja'));
      falsch.push('ja');
    }
    // Unten: Hier wohnt jemand anderes. Die erste Frage ist eingekreist, dort geht es weiter.
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Hier wohnt');
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(page.locator('.feld .baum-platz.baum-hier')).toHaveAttribute('data-pfad', B.pfadText(falsch));
    await erwarte(page.locator('.feld .baum-platz.baum-hier .baum-bild')).toHaveCount(1);
    await erwarte(feld(page)).toHaveAttribute('data-kreis', '');
    await erwarte(feld(page)).toHaveAttribute('data-aktiv', '');
    await erwarte(page.locator(KREIS)).toHaveCount(1);
    await h.ansicht(page, 'baum-folgen-daneben', info);
    // Doppeltipp auf die richtige Antwort: nur ein Schritt
    await doppeltipp(page, antwort(weg[0]));
    await erwarte(feld(page)).toHaveAttribute('data-weg', weg[0]);
    await erwarte(feld(page)).toHaveAttribute('data-aktiv', weg[0]);
    await erwarte(page.locator(KREIS)).toHaveCount(0);
    await erwarte(page.locator('.feld .baum-platz.baum-hier')).toHaveCount(0);
    // Die Frage in der Meldung nennt das Wesen
    const d = f.lv.dinge.find((x) => x.id === f.lv.wer);
    await erwarte(meldung(page)).toContainText(d.name);
    // Nochmal: wieder oben, kein Weg
    await h.tippe(page, NOCHMAL);
    await erwarte(feld(page)).toHaveAttribute('data-weg', '');
    await erwarte(feld(page)).toHaveAttribute('data-aktiv', '');
    await erwarte(meldung(page)).toContainText('Fang oben an');
    // Richtig bis unten: geschafft, mit Fragen-Zahl
    for (let i = 0; i < weg.length; i++) {
      if (i > 0 && weg[i] === weg[i - 1]) await page.waitForTimeout(400);
      await h.tippe(page, antwort(weg[i]));
    }
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await erwarte(page.locator('.dialog p')).toContainText(weg.length + ' Fragen');
    // Nochmal im Geschafft-Fenster: wieder oben
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(feld(page)).toHaveAttribute('data-weg', '');
    await erwarte(page.locator('.feld .baum-platz.baum-voll')).toHaveCount(0);
  });

  test('Baum einsortieren: leere Plätze, falscher Platz, umsetzen, Doppeltipp, Nochmal', async ({ page }, info) => {
    await h.schnell(page);
    const f = h.suche('baum', (l) => l.aufgabe === 'einsortieren' && l.dinge.length >= 4);
    test.skip(!f, 'kein Einsortieren-Level');
    await h.oeffneLevel(page, f, info);
    const lv = f.lv;
    const [a, b, c] = lv.dinge;
    // Los ist grau, solange Plätze leer sind
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, LOS);
    await erwarte(meldung(page)).toContainText('noch Plätze leer');
    // Doppeltipp auf einen Platz: das Wesen sitzt (nicht gleich wieder heraus)
    await erwarte(page.locator(ding(a.id))).toHaveClass(/baum-gewaehlt/);
    await doppeltipp(page, platz(zielVon(lv, a)));
    await erwarte(page.locator(platz(zielVon(lv, a)))).toHaveClass(/baum-voll/);
    await erwarte(page.locator(ding(a.id))).toHaveCount(0);
    // Danach ist das nächste Wesen gewählt. Doppeltipp auf ein anderes: Das ist gewählt (nur einmal umgeschaltet)
    await erwarte(page.locator(ding(b.id))).toHaveClass(/baum-gewaehlt/);
    await doppeltipp(page, ding(c.id));
    await erwarte(page.locator(ding(c.id))).toHaveClass(/baum-gewaehlt/);
    await erwarte(page.locator('.tasten .baum-gewaehlt')).toHaveCount(1);
    await erwarte(page.locator('.feld .baum-platz.baum-einladend')).toHaveCount(B.blaetter(lv.baum).length - 1);
    await h.ansicht(page, 'baum-einsortieren-gewaehlt', info);
    // b an den Platz von a: a kommt zurück nach unten und ist gewählt
    await h.tippe(page, ding(b.id));
    await h.tippe(page, platz(zielVon(lv, a)));
    await erwarte(page.locator(ding(a.id))).toHaveClass(/baum-gewaehlt/);
    await erwarte(page.locator(platz(zielVon(lv, a)))).toHaveAttribute('aria-label', new RegExp(b.name + '$'));
    // a an den Platz von b (vertauscht), die anderen richtig
    await h.tippe(page, platz(zielVon(lv, b)));
    for (const d of lv.dinge.slice(2)) await setze(page, h, d.id, zielVon(lv, d));
    await erwarte(page.locator(LOS)).not.toHaveAttribute('aria-disabled', 'true');
    await h.tippe(page, LOS);
    // Die App schickt alle der Reihe nach durch den Baum und bleibt beim ersten falschen stehen
    await erwarte(meldung(page)).toContainText('landet bei Platz', { timeout: 15_000 });
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(page.locator('.feld .baum-platz.baum-hier')).toHaveCount(1);
    await erwarte(page.locator('.feld .baum-platz.baum-falsch')).toHaveCount(1);
    await h.ansicht(page, 'baum-einsortieren-daneben', info);
    // Wer falsch sitzt, ist gewählt: einmal antippen setzt ihn um (der andere kommt nach unten)
    const hier = await page.locator('.feld .baum-platz.baum-hier').getAttribute('data-pfad');
    await h.tippe(page, platz(hier));
    await erwarte(page.locator('.feld .baum-platz.baum-hier')).toHaveCount(0);
    await erwarte(page.locator('.tasten [data-aktion="baum-ding"]')).toHaveCount(1);
    const rest = await page.locator('.tasten [data-aktion="baum-ding"]').getAttribute('data-id');
    await erwarte(page.locator(ding(rest))).toHaveClass(/baum-gewaehlt/);
    await h.tippe(page, platz(zielVon(lv, lv.dinge.find((d) => d.id === rest))));
    await erwarte(meldung(page)).toContainText('Los');
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 20_000 });
    await erwarte(page.locator('.dialog p')).toContainText('Alle ' + lv.dinge.length);
    // Nochmal: alle Plätze leer, alle Wesen unten
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.feld .baum-platz.baum-voll')).toHaveCount(0);
    await erwarte(page.locator('.tasten [data-aktion="baum-ding"]')).toHaveCount(lv.dinge.length);
    await erwarte(page.locator('.feld .baum-platz.baum-ok')).toHaveCount(0);
  });

  test('Baum: ohne Auswahl einen Platz antippen, Wesen aufnehmen', async ({ page }, info) => {
    const f = h.suche('baum', (l) => l.aufgabe === 'einsortieren');
    test.skip(!f, 'kein Einsortieren-Level');
    await h.oeffneLevel(page, f, info);
    const a = f.lv.dinge[0];
    // Auswahl wegtippen, dann einen leeren Platz: freundlicher Hinweis
    await h.tippe(page, ding(a.id));
    await erwarte(page.locator('.tasten .baum-gewaehlt')).toHaveCount(0);
    const leer = B.blaetter(f.lv.baum)[0].pfad;
    await h.tippe(page, platz(leer));
    await erwarte(meldung(page)).toContainText('Tippe zuerst');
    await erwarte(page.locator('.feld .baum-platz.baum-voll')).toHaveCount(0);
    // Wesen setzen, dann ohne Auswahl antippen: aufgenommen (gewählt), nochmal: wieder unten
    await h.tippe(page, ding(a.id));
    await h.tippe(page, platz(leer));
    const zweiter = f.lv.dinge[1];
    await erwarte(page.locator(ding(zweiter.id))).toHaveClass(/baum-gewaehlt/);
    await h.tippe(page, ding(zweiter.id));
    await erwarte(page.locator('.tasten .baum-gewaehlt')).toHaveCount(0);
    await page.waitForTimeout(400);
    await h.tippe(page, platz(leer));
    await erwarte(page.locator(platz(leer))).toHaveClass(/baum-gewaehlt/);
    await erwarte(meldung(page)).toContainText('Wo wohnt');
    await h.ansicht(page, 'baum-einsortieren-aufgenommen', info);
    await page.waitForTimeout(400);
    await h.tippe(page, platz(leer));
    await erwarte(page.locator(platz(leer))).toHaveClass(/baum-frei/);
    await erwarte(page.locator(ding(a.id))).toHaveCount(1);
  });

  test('Baum Frage fehlt: ohne Frage, falsche Frage, Doppeltipp, Nochmal', async ({ page }, info) => {
    await h.schnell(page);
    const f = h.suche('baum', (l) => l.aufgabe === 'frage');
    test.skip(!f, 'kein Frage-Level');
    await h.oeffneLevel(page, f, info);
    const lv = f.lv;
    const richtig = passendeOption(lv);
    const falsch = lv.optionen.find((x) => x !== richtig);
    await erwarte(meldung(page)).toContainText('Welche Frage');
    await erwarte(page.locator(LOS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, LOS);
    await erwarte(meldung(page)).toContainText('Tippe zuerst eine Frage an');
    // Falsche Frage: Die App sagt, wer wo landet
    await erwarte.poll(() => kaestchenText(page, lueckeVon(lv))).toBe('?');
    await h.tippe(page, option(falsch));
    const kurz = (await page.locator('.feld .baum-feld').getAttribute('data-kurz')) !== null;
    await erwarte.poll(() => kaestchenText(page, lueckeVon(lv))).toBe(B.frageText(lv.fragen, falsch, kurz));
    await h.tippe(page, LOS);
    await erwarte(meldung(page)).toContainText('Fast! Mit dieser Frage landet', { timeout: 15_000 });
    await erwarte(meldung(page)).not.toContainText('falsch ist');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.feld .baum-platz.baum-hier')).toHaveCount(1);
    await h.ansicht(page, 'baum-frage-daneben', info);
    // Eine andere Frage antippen: Markierungen weg; Doppeltipp lässt sie gewählt
    await doppeltipp(page, option(richtig));
    await erwarte(page.locator(option(richtig))).toHaveClass(/baum-gewaehlt/);
    await erwarte(page.locator('.tasten .baum-gewaehlt')).toHaveCount(1);
    await erwarte(page.locator('.feld .baum-platz.baum-hier')).toHaveCount(0);
    // Nochmal antippen: abgewählt, das Kästchen ist wieder leer
    await page.waitForTimeout(400);
    await h.tippe(page, option(richtig));
    await erwarte(page.locator('.tasten .baum-gewaehlt')).toHaveCount(0);
    await page.waitForTimeout(400);
    await h.tippe(page, option(richtig));
    await h.tippe(page, LOS);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 20_000 });
    await erwarte(page.locator('.dialog p')).toContainText(B.frageText(lv.fragen, richtig));
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.tasten .baum-gewaehlt')).toHaveCount(0);
    await erwarte(page.locator('.feld .baum-platz.baum-ok')).toHaveCount(0);
  });

  test('Baum: Gerät drehen und Nochmal, während alle durch den Baum laufen', async ({ page }, info) => {
    // das Frage-Level mit den meisten Plätzen: Das Durchlaufen dauert lange genug
    const f = h.suche('baum', (l) => l.aufgabe === 'frage' && B.blaetter(l.baum).length >= 8) || h.suche('baum', (l) => l.aufgabe === 'frage');
    test.skip(!f, 'kein Frage-Level');
    // langsam: Auch auf einer ausgelasteten Maschine laufen sie noch, wenn „Nochmal“ kommt
    await page.addInitScript(() => { window.WERKSTATT_TEMPO = 4000; });
    await h.oeffneLevel(page, f, info);
    await h.tippe(page, option(passendeOption(f.lv)));
    await h.tippe(page, LOS);
    await erwarte(meldung(page)).toContainText('geht durch den Baum');
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await h.ansicht(page, 'baum-gedreht-beim-laufen', info);
    await page.setViewportSize(g);
    await h.tippe(page, NOCHMAL);
    await erwarte(page.locator('.feld .baum-platz.baum-ok')).toHaveCount(0);
    await page.waitForTimeout(1500);
    await erwarte(page.locator('.feld .baum-platz.baum-ok')).toHaveCount(0);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Welche Frage');
  });
}
