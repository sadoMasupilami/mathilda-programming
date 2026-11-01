// Test-Plugin für die Rätselart „kaestchen“ (Einheit 8, web/spiele/kaestchen.js)
// Die Lösungen rechnet der Test selbst mit web/kern/kaestchen.js aus (wie der Löser); die App kennt keine.
import { expect } from '@playwright/test';
import '../../web/kern/kaestchen.js';

const KK = globalThis.WerkstattKaestchen;

const FERTIG = '.tasten [data-aktion="los"]';
const feld = (r, c) => '.feld .kaestchen-k[data-i="' + r + '-' + c + '"]';
const teil = (n, f) => '.tasten [data-aktion="kaestchen-teil"][data-n="' + n + '"][data-f="' + f + '"]';
const codeZeile = (e) => '.programm .kaestchen-cz[data-e="' + e + '"]';
const zahl = (k) => '.programm .kaestchen-offen [data-aktion="kaestchen-zahl"][data-k="' + k + '"]';
const PLUS = '.tasten [data-aktion="kaestchen-plus"]';
const MINUS = '.tasten [data-aktion="kaestchen-minus"]';
// Ein Kästchen schaltet beim Antippen um. Ein zweiter Tipp darauf innerhalb von 350 ms zählt nicht
// (Doppeltipp-Schutz). Ein Mensch tippt nicht so schnell zweimal bewusst: vor einem neuen Tipp warten.
const nochEinmal = (page) => page.waitForTimeout(400);

// Malen: das Bild, das der Code malt (dieselbe Rechnung wie Löser und App)
const sollMalen = (lv) => KK.malBild(lv.code, { format: lv.format, richtung: lv.richtung });

// Kobold: die Zahlen eines Eintrags in der Reihenfolge der Tasten (wie zahlenVon in der App)
function zahlenVon(e, b) {
  const aus = [];
  const zeile = (zl, vor) => zl.teile.forEach((t, j) => {
    if (t.wdh) {
      aus.push({ weg: vor.concat(['teile', j, 'wdh']), min: KK.WDH_MIN, max: KK.WDH_MAX });
      t.teile.forEach((u, k) => aus.push({ weg: vor.concat(['teile', j, 'teile', k, 'n']), min: 1, max: b }));
    } else aus.push({ weg: vor.concat(['teile', j, 'n']), min: 1, max: b });
  });
  if (KK.istKasten(e)) e.zeilen.forEach((zl, i) => zeile(zl, ['zeilen', i]));
  else zeile(e, []);
  return aus;
}
const holen = (o, weg) => weg.reduce((x, k) => x[k], o);
const setzen = (o, weg, v) => { holen(o, weg.slice(0, -1))[weg[weg.length - 1]] = v; };
// Kobold: die Zeile, die vom Bild abweicht, und die kleinste Änderung ihrer Zahlen, die das Bild heil macht
function koboldReparatur(lv) {
  const soll = KK.liesBild(lv.bild);
  const code = JSON.parse(JSON.stringify(KK.liesCode(lv.code)));
  const anders = KK.unterschiede(soll, KK.ausrollen(code));
  if (anders.length !== 1) throw new Error(lv.id + ': ' + anders.length + ' Zeilen weichen ab');
  const eintrag = KK.zeilenListe(code)[anders[0]].eintrag;
  const e = code[eintrag];
  const zz = zahlenVon(e, soll[0].length);
  const alt = zz.map((x) => holen(e, x.weg));
  let best = null;
  (function suche(i, werte) {
    if (i === zz.length) {
      zz.forEach((x, k) => setzen(e, x.weg, werte[k]));
      if (KK.bewerteCode(soll, code).geschafft) {
        const schritte = werte.reduce((s, w, k) => s + Math.abs(w - alt[k]), 0);
        if (!best || schritte < best.schritte) best = { schritte, werte: werte.slice() };
      }
      return;
    }
    for (let w = zz[i].min; w <= zz[i].max; w++) suche(i + 1, werte.concat([w]));
  })(0, []);
  zz.forEach((x, k) => setzen(e, x.weg, alt[k]));
  if (!best) throw new Error(lv.id + ': keine Reparatur mit den Zahlen gefunden');
  return { zeile: anders[0], eintrag, aenderungen: best.werte.map((w, k) => ({ k, von: alt[k], nach: w })).filter((a) => a.von !== a.nach) };
}

// Die Kästchen liegen dicht (keine Tasten), müssen aber mindestens 36 px groß und ganz im Bild sein
async function pruefeKaestchen(page) {
  const m = await page.evaluate(() => {
    const k = Array.from(document.querySelectorAll('.feld .kaestchen-k'));
    const r = k.map((x) => x.getBoundingClientRect());
    const g = document.querySelector('.feld .kaestchen-gitter').getBoundingClientRect();
    return {
      min: Math.min(...r.map((x) => Math.min(x.width, x.height))),
      drin: g.left >= -0.5 && g.top >= -0.5 && g.right <= innerWidth + 0.5 && g.bottom <= innerHeight + 0.5,
    };
  });
  expect(m.min, 'Kästchen mindestens 36 px').toBeGreaterThanOrEqual(35.5);
  expect(m.drin, 'Gitter ganz im Bild').toBe(true);
}

// Bildschirmfoto mit den Prüfungen der App (h.ansicht) und der Kästchen-Größe
async function foto(h, page, name, info) {
  await h.ansicht(page, name, info);
  await pruefeKaestchen(page);
}

export async function spiele(page, lv, h, info) {
  const kurz = lv.id.replace(/^e\d+-/, '');
  await pruefeKaestchen(page);
  if (lv.aufgabe === 'malen') {
    const soll = sollMalen(lv);
    const farben = [...new Set(soll.flat())].filter((f) => f !== 'w');
    const stifte = await page.locator('.tasten [data-aktion="kaestchen-stift"]').count();
    expect(stifte, 'Farb-Tasten nur bei mehreren Farben').toBe(farben.length > 1 ? farben.length : 0);
    for (const f of farben) {
      if (stifte) {
        await h.tippe(page, '.tasten [data-aktion="kaestchen-stift"][data-f="' + f + '"]');
        await expect(page.locator('.tasten [data-aktion="kaestchen-stift"][data-f="' + f + '"]')).toHaveAttribute('aria-pressed', 'true');
      }
      for (let r = 0; r < soll.length; r++) for (let c = 0; c < soll[r].length; c++) if (soll[r][c] === f) await h.tippe(page, feld(r, c));
    }
    await expect(page.locator('.feld .kaestchen-voll')).toHaveCount(soll.flat().filter((f) => f !== 'w').length);
    await foto(h, page, 'kaestchen-' + kurz + '-gemalt', info);
    await h.tippe(page, FERTIG);
    await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
    // Erst jetzt verrät die App, was es ist
    if (lv.name) await expect(page.locator('.dialog p')).toContainText(lv.name);
  } else if (lv.aufgabe === 'schreiben') {
    const code = KK.codeAusBild(lv.bild);
    for (let i = 0; i < code.length; i++) {
      await expect(page.locator('.programm .kaestchen-cz.kaestchen-jetzt')).toHaveAttribute('data-e', String(i));
      for (const t of KK.liesZeile(code[i]).teile) await h.tippe(page, teil(t.n, t.f));
    }
    await expect(page.locator(FERTIG)).not.toHaveAttribute('aria-disabled', 'true');
    await foto(h, page, 'kaestchen-' + kurz + '-code', info);
    await h.tippe(page, FERTIG);
    await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.dialog p')).toContainText('Dein Code hat ' + KK.zahlen(code) + ' Zahlen.');
    await expect(page.locator('.dialog p')).not.toContainText('Profi-Frage');
  } else {
    const r = koboldReparatur(lv);
    // Die Zeile im Bild antippen: die Code-Zeile öffnet sich
    await h.tippe(page, feld(r.zeile, 0));
    await expect(page.locator('.programm .kaestchen-offen')).toHaveAttribute('data-e', String(r.eintrag));
    await foto(h, page, 'kaestchen-' + kurz + '-offen', info);
    for (const a of r.aenderungen) {
      await h.tippe(page, zahl(a.k));
      await expect(page.locator(zahl(a.k))).toHaveAttribute('aria-pressed', 'true');
      for (let i = 0; i < Math.abs(a.nach - a.von); i++) await h.tippe(page, a.nach > a.von ? PLUS : MINUS);
    }
    await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.dialog p')).toContainText('Kobold erwischt! Zeile ' + (r.zeile + 1));
  }
  await expect(page.locator('.feld .kaestchen-brett.kaestchen-geschafft')).toHaveCount(1);
}

export function tests({ test, expect: erwarte, DATEN, h }) {
  const meldung = (page) => page.locator('.meldung');
  const levels = DATEN.pakete.flatMap((p) => p.levels).filter((l) => l.art === 'kaestchen');

  test('Kästchen: keine Lösungen in den App-Daten', async () => {
    for (const l of levels) {
      erwarte(l.loesung, l.id).toBeUndefined();
      if (l.aufgabe === 'malen') erwarte(l.bild, l.id + ': malen kennt nur den Code').toBeUndefined();
      if (l.aufgabe === 'schreiben') erwarte(l.code, l.id + ': schreiben kennt nur das Bild').toBeUndefined();
      if (l.aufgabe === 'kobold') {
        erwarte(l.zeile, l.id + ': die Kobold-Zeile steht nicht in den Daten').toBeUndefined();
        erwarte(l.reparatur, l.id).toBeUndefined();
      }
    }
  });

  test('Kästchen: Paket-Bild beim direkten Aufruf (QR-Code)', async ({ page }, info) => {
    const f = h.suche('kaestchen', () => true);
    test.skip(!f, 'kein Kästchen-Level');
    await page.goto('./#' + f.p.paket);
    await erwarte(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await erwarte(page.locator('.paket-bild svg.kaestchen-icon')).toHaveCount(1);
    await h.ansicht(page, 'kaestchen-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await erwarte(page.locator('.kachel[data-paket="' + f.p.paket + '"] svg.kaestchen-icon')).toHaveCount(1);
  });

  test('Kästchen malen: freundlicher Hinweis, Doppeltipp, Nochmal', async ({ page }, info) => {
    const f = h.suche('kaestchen', (l) => l.aufgabe === 'malen' && (l.farben || []).filter((x) => x !== 'w').length === 1);
    test.skip(!f, 'kein Mal-Level mit einer Farbe');
    await h.oeffneLevel(page, f, info);
    const soll = sollMalen(f.lv);
    await erwarte(meldung(page)).toContainText('Mal');
    // Noch nichts gemalt: freundlicher Hinweis
    await h.tippe(page, FERTIG);
    await erwarte(meldung(page)).toContainText('Noch ist alles weiß');
    // Alles richtig bis auf ein Kästchen zu viel in einer Zeile
    let fehler = null;
    for (let r = 0; r < soll.length && !fehler; r++) {
      const c = soll[r].indexOf('w');
      if (c >= 0) fehler = { r, c };
    }
    for (let r = 0; r < soll.length; r++) for (let c = 0; c < soll[r].length; c++) if (soll[r][c] !== 'w') await h.tippe(page, feld(r, c));
    await h.tippe(page, feld(fehler.r, fehler.c));
    await h.tippe(page, FERTIG);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Fast!');
    await erwarte(meldung(page)).toContainText('Zeile ' + (fehler.r + 1));
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(page.locator('.feld .kaestchen-nr.kaestchen-markiert')).toHaveText(String(fehler.r + 1));
    await erwarte(page.locator('.feld .kaestchen-schau')).toHaveCount(1);
    await erwarte(page.locator('.programm .kaestchen-cz.kaestchen-markiert')).toHaveCount(1);
    await foto(h, page, 'kaestchen-malen-hinweis', info);
    // Noch einmal antippen macht das Kästchen wieder weiß, der Hinweis an der Zeile verschwindet
    await nochEinmal(page);
    await h.tippe(page, feld(fehler.r, fehler.c));
    await erwarte(page.locator(feld(fehler.r, fehler.c))).not.toHaveClass(/kaestchen-voll/);
    await erwarte(page.locator('.feld .kaestchen-schau')).toHaveCount(0);
    // Doppeltipp auf ein weißes Kästchen: es bleibt angemalt (schaltet nicht gleich zurück)
    await nochEinmal(page);
    await h.doppeltipp(page, feld(fehler.r, fehler.c));
    await erwarte(page.locator(feld(fehler.r, fehler.c))).toHaveClass(/kaestchen-voll/);
    // Nochmal: alles wieder weiß
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await erwarte(page.locator('.feld .kaestchen-voll')).toHaveCount(0);
    await erwarte(page.locator('.feld .kaestchen-schau')).toHaveCount(0);
    await erwarte(meldung(page)).not.toContainText('Fast');
  });

  test('Kästchen malen mit zwei Farben: Farbe wählen, umfärben, wieder weiß', async ({ page }, info) => {
    const f = h.suche('kaestchen', (l) => l.aufgabe === 'malen' && (l.farben || []).filter((x) => x !== 'w').length >= 2);
    test.skip(!f, 'kein Mal-Level mit zwei Farben');
    await h.oeffneLevel(page, f, info);
    const [a, b] = f.lv.farben.filter((x) => x !== 'w');
    const stift = (x) => '.tasten [data-aktion="kaestchen-stift"][data-f="' + x + '"]';
    await erwarte(page.locator(stift(a))).toHaveAttribute('aria-pressed', 'true');
    await erwarte(meldung(page)).toContainText('Farbe');
    await h.tippe(page, feld(0, 0));
    await erwarte(page.locator(feld(0, 0))).toHaveCSS('background-color', farbeCss(a));
    await h.tippe(page, stift(b));
    await erwarte(page.locator(stift(b))).toHaveAttribute('aria-pressed', 'true');
    await erwarte(page.locator(stift(a))).toHaveAttribute('aria-pressed', 'false');
    await foto(h, page, 'kaestchen-farbe', info);
    // Ein Kästchen in der anderen Farbe antippen: es bekommt die neue Farbe
    await nochEinmal(page);
    await h.tippe(page, feld(0, 0));
    await erwarte(page.locator(feld(0, 0))).toHaveCSS('background-color', farbeCss(b));
    // Noch einmal: wieder weiß
    await nochEinmal(page);
    await h.tippe(page, feld(0, 0));
    await erwarte(page.locator(feld(0, 0))).not.toHaveClass(/kaestchen-voll/);
  });

  test('Code bauen: zu viel für die Zeile, Zeile voll, löschen, Hinweis, Profi-Frage', async ({ page }, info) => {
    const f = h.suche('kaestchen', (l) => l.aufgabe === 'schreiben' && l.bild.length >= 3);
    test.skip(!f, 'kein Code-bauen-Level');
    await h.oeffneLevel(page, f, info);
    const code = KK.codeAusBild(f.lv.bild).map((z) => KK.liesZeile(z).teile);
    const b = f.lv.bild[0].length;
    // „Fertig“ ist grau, solange Zeilen leer sind: ein Tipp sagt, welche
    await erwarte(page.locator(FERTIG)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, FERTIG);
    await erwarte(meldung(page)).toContainText('Zeile 1 ist noch nicht voll');
    // Zeile 1: der erste Teil in zwei Stücken (1 und Rest), das geht auch, ist aber länger
    const [t0, ...rest0] = code[0];
    const geteilt = t0.n > 1 ? [{ n: 1, f: t0.f }, { n: t0.n - 1, f: t0.f }] : [t0];
    for (const t of geteilt) await h.tippe(page, teil(t.n, t.f));
    // Zu viel für den Rest der Zeile: grau, ein Tipp erklärt es freundlich
    await erwarte(page.locator(teil(b, 's'))).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, teil(b, 's'));
    await erwarte(meldung(page)).toContainText('So viele passen nicht');
    await foto(h, page, 'kaestchen-schreiben-zuviel', info);
    for (const t of rest0) await h.tippe(page, teil(t.n, t.f));
    // Zeile voll: weiter mit Zeile 2
    await erwarte(page.locator('.programm .kaestchen-cz.kaestchen-jetzt')).toHaveAttribute('data-e', '1');
    await erwarte(meldung(page)).toContainText('Weiter mit Zeile 2');
    // Zeile 2 absichtlich anders (eine Farbe über die ganze Breite), dann den Rest richtig
    const andersFarbe = code[1].length === 1 && code[1][0].f === 's' ? 'w' : 's';
    await h.tippe(page, teil(b, andersFarbe));
    for (let i = 2; i < code.length; i++) for (const t of code[i]) await h.tippe(page, teil(t.n, t.f));
    await h.tippe(page, FERTIG);
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Fast! Zeile 2');
    await erwarte(meldung(page)).toContainText('Lösch');
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(page.locator('.programm .kaestchen-cz.kaestchen-markiert')).toHaveAttribute('data-e', '1');
    await foto(h, page, 'kaestchen-schreiben-hinweis', info);
    // Zeile 2 ist jetzt dran: löschen und richtig schreiben
    await erwarte(page.locator('.programm .kaestchen-cz.kaestchen-jetzt')).toHaveAttribute('data-e', '1');
    await h.tippe(page, '.tasten [data-aktion="kaestchen-weg"]');
    await erwarte(page.locator(codeZeile(1) + ' .kaestchen-t:not(.kaestchen-platz)')).toHaveCount(0);
    for (const t of code[1]) await h.tippe(page, teil(t.n, t.f));
    await h.tippe(page, FERTIG);
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    if (geteilt.length > 1) await erwarte(page.locator('.dialog p')).toContainText('Profi-Frage: Geht es auch mit ' + KK.zahlenOhneKasten(f.lv.bild) + ' Zahlen?');
    await foto(h, page, 'kaestchen-schreiben-geschafft', info);
    // Nochmal: alle Zeilen leer, Zeile 1 ist dran
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.programm .kaestchen-t:not(.kaestchen-platz)')).toHaveCount(0);
    await erwarte(page.locator('.programm .kaestchen-cz.kaestchen-jetzt')).toHaveAttribute('data-e', '0');
  });

  test('Kobold-Zeile: wählen, zu lang, Grenzen, Doppeltipp, Nochmal', async ({ page }, info) => {
    const f = h.suche('kaestchen', (l) => l.aufgabe === 'kobold' && !l.code.some((z) => /[[{]/.test(z)));
    test.skip(!f, 'kein Kobold-Level ohne Zauber-Kasten');
    await h.oeffneLevel(page, f, info);
    await erwarte(meldung(page)).toContainText('Kobold');
    // Ohne Zeile: − und + sind grau, ein Tipp sagt, was zu tun ist
    await erwarte(page.locator(PLUS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, PLUS);
    await erwarte(meldung(page)).toContainText('Tippe zuerst die Zeile an');
    // Eine Zeile mit mehreren Zahlen per Doppeltipp öffnen: Sie bleibt offen, keine Zahl ist gewählt
    // (nicht die Kobold-Zeile: Das Bild soll hier nicht zufällig heil werden; die erste Zahl möglichst groß)
    const code = KK.liesCode(f.lv.code);
    const kobold = koboldReparatur(f.lv).eintrag;
    let e = -1;
    code.forEach((x, i) => {
      if (i === kobold || KK.istKasten(x) || x.teile.length < 2 || x.teile[0].wdh) return;
      if (e < 0 || x.teile[0].n > code[e].teile[0].n) e = i;
    });
    erwarte(e, 'Zeile mit mehreren Zahlen').toBeGreaterThanOrEqual(0);
    await h.doppeltipp(page, codeZeile(e));
    await erwarte(page.locator('.programm .kaestchen-offen')).toHaveAttribute('data-e', String(e));
    await erwarte(page.locator('.programm .kaestchen-offen [aria-pressed="true"]')).toHaveCount(0);
    await h.tippeGrau(page, PLUS);
    await erwarte(meldung(page)).toContainText('Tippe zuerst die Zahl an');
    // Die erste Zahl: Mit + wird die Zeile zu lang (Kobold-Probe), mit − bis zur Grenze
    const alt = code[e].teile[0].n;
    await h.tippe(page, zahl(0));
    await h.tippe(page, PLUS);
    await erwarte(page.locator(zahl(0) + ' .kaestchen-tz')).toHaveText(String(alt + 1));
    await erwarte(page.locator('.feld .kaestchen-ueber')).toHaveText('+1');
    await erwarte(meldung(page)).toContainText('Zu lang');
    await foto(h, page, 'kaestchen-kobold-zulang', info);
    for (let i = alt + 1; i > 1; i--) await h.tippe(page, MINUS);
    await erwarte(page.locator(MINUS)).toHaveAttribute('aria-disabled', 'true');
    await h.tippeGrau(page, MINUS);
    await erwarte(meldung(page)).toContainText('Kleiner als 1 geht nicht');
    if (alt > 1) {
      await erwarte(page.locator('.feld .kaestchen-leer')).toHaveCount(alt - 1);
      await foto(h, page, 'kaestchen-kobold-zukurz', info);
    }
    // Nochmal: der Code ist wieder wie am Anfang
    await h.tippe(page, '.tasten [data-aktion="nochmal"]');
    await erwarte(page.locator('.programm .kaestchen-offen')).toHaveCount(0);
    await erwarte(page.locator('.feld .kaestchen-ueber')).toHaveCount(0);
    await erwarte(page.locator(codeZeile(e) + ' .kaestchen-t b').first()).toHaveText(String(alt));
    await erwarte(page.locator('.feld .kaestchen-voll')).toHaveCount(KK.ausrollen(code).flat().filter((x) => x !== 'w').length);
  });

  test('Kobold im Zauber-Kasten: zu kurze Zeile ist schraffiert, „-mal“ ändern', async ({ page }, info) => {
    const f = h.suche('kaestchen', (l) => l.aufgabe === 'kobold' && l.code.some((z) => /\[/.test(z)));
    test.skip(!f, 'kein Kobold-Level mit Zauber-Kasten');
    await h.oeffneLevel(page, f, info);
    const soll = KK.liesBild(f.lv.bild);
    const ist = KK.ausrollen(f.lv.code);
    const kurz = ist.reduce((s, r) => s + Math.max(0, soll[0].length - r.length), 0);
    await erwarte(page.locator('.feld .kaestchen-leer')).toHaveCount(kurz);
    // Zeile mit Zauber-Kasten öffnen: die „-mal“-Taste ist lila und lässt sich nicht unter 2 drücken
    const code = KK.liesCode(f.lv.code);
    const e = code.findIndex((x) => !KK.istKasten(x) && x.teile.some((t) => t.wdh));
    await h.tippe(page, codeZeile(e));
    const k = 0;
    await erwarte(page.locator(zahl(k))).toHaveClass(/kaestchen-mt/);
    await h.tippe(page, zahl(k));
    const w = code[e].teile[0].wdh;
    for (let i = w; i > KK.WDH_MIN; i--) await h.tippe(page, MINUS);
    await h.tippeGrau(page, MINUS);
    await erwarte(meldung(page)).toContainText('Weniger als 2-mal geht nicht');
    await foto(h, page, 'kaestchen-kobold-kasten', info);
  });
}

// CSS-Farbe einer Kästchen-Farbe (für toHaveCSS)
function farbeCss(f) {
  const h = KK.FARBEN[f].hex.replace('#', '');
  return 'rgb(' + [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';
}
