// Test-Plugin für die Rätselart „geheim“ (Einheit 7, web/spiele/geheim.js)
// Die Lösungen rechnet der Test selbst mit web/kern/geheim.js aus (wie der Löser); die App kennt keine.
import { expect } from '@playwright/test';
import '../../web/kern/geheim.js';

const G = globalThis.WerkstattGeheim;

function bildFuer(lv, wort) {
  const b = (lv.bilder || []).filter((x) => G.wortVonBild(x) === wort);
  if (b.length !== 1) throw new Error(lv.id + ': ' + b.length + ' Bilder für ' + wort);
  return b[0];
}
// Lösung eines Levels, nur aus den App-Daten gerechnet
function loesung(lv) {
  if (lv.aufgabe === 'lesen') {
    const w = G.lesen(lv.geheimtext, lv.schluessel);
    return { k: lv.schluessel, text: w, bild: bildFuer(lv, w) };
  }
  if (lv.aufgabe === 'zeichen') return { text: lv.feen, bild: bildFuer(lv, lv.feen) };
  if (lv.aufgabe === 'schreiben') return { k: G.N > lv.schluessel ? lv.schluessel : 0, text: G.schreiben(lv.klartext, lv.schluessel) };
  // knacken: genau eine Schlüssel-Zahl 1 bis 25 ergibt nur echte Wörter
  const t = G.knacken(lv.geheimtext);
  if (t.length !== 1) throw new Error(lv.id + ': ' + t.length + ' Schlüssel-Zahlen');
  return { k: t[0].schluessel, text: t[0].text, bild: bildFuer(lv, t[0].text) };
}

const DREHEN = (d) => '.feld [data-aktion="geheim-drehen"][data-d="' + d + '"]';
const BILD = (n) => '.tasten [data-aktion="geheim-bild"][data-bild="' + n + '"]';
const ABC = (b) => '.tasten [data-aktion="geheim-abc"][data-b="' + b + '"]';
const KARTE = (i) => '.programm [data-aktion="geheim-karte"][data-i="' + i + '"]';
const PLATZ = (i) => '.programm [data-aktion="geheim-platz"][data-i="' + i + '"]';
const PROBE = '.tasten [data-aktion="geheim-probe"]';
const WEG = '.tasten [data-aktion="geheim-weg"]';
const ZAHL = '.feld .geheim-mitte text';

// Rad auf die Zahl k stellen, auf dem kürzeren Weg
async function stelle(page, h, k) {
  const jetzt = Number(await page.locator(ZAHL).textContent());
  const vor = (((k - jetzt) % 26) + 26) % 26;
  const d = vor <= 13 ? 1 : -1;
  const n = d === 1 ? vor : 26 - vor;
  for (let j = 0; j < n; j++) await h.tippe(page, DREHEN(d));
  await expect(page.locator(ZAHL)).toHaveText(String(k));
}

export async function spiele(page, lv, h, info) {
  const kurz = lv.id.replace(/^e\d+-/, '');
  const l = loesung(lv);
  if (lv.aufgabe === 'lesen') {
    await stelle(page, h, l.k);
    await expect(page.locator('.meldung')).toContainText('beim Stern');
    await h.tippe(page, KARTE(0));
    await expect(page.locator('.feld .geheim-i.geheim-mark')).toHaveAttribute('data-b', lv.geheimtext[0]);
    await h.ansicht(page, 'geheim-' + kurz + '-rad', info);
    await h.tippe(page, BILD(l.bild));
  } else if (lv.aufgabe === 'schreiben') {
    await stelle(page, h, l.k);
    const b = Array.from(l.text);
    for (let j = 0; j < b.length - 1; j++) {
      if (b[j] === ' ') continue;
      await expect(page.locator('.programm .geheim-platz.geheim-dran')).toHaveAttribute('data-i', String(j));
      await expect(page.locator('.feld .geheim-a.geheim-mark')).toHaveAttribute('data-b', lv.klartext[j]);
      await h.tippe(page, ABC(b[j]));
    }
    await h.ansicht(page, 'geheim-' + kurz + '-schreiben', info);
    await h.tippe(page, ABC(b[b.length - 1]));
  } else if (lv.aufgabe === 'knacken') {
    await stelle(page, h, l.k);
    await h.tippe(page, PROBE);
    await expect(page.locator('.programm .geheim-probe-feld.geheim-voll')).toHaveCount(l.text.replace(/ /g, '').length);
    expect((await page.locator('.programm .geheim-probe-feld').allTextContents()).join('')).toBe(l.text.replace(/ /g, ''));
    await h.ansicht(page, 'geheim-' + kurz + '-probe', info);
    await h.tippe(page, BILD(l.bild));
  } else {
    await h.tippe(page, KARTE(0));
    await expect(page.locator('.feld .geheim-zeile.geheim-an')).toHaveCount(1);
    await h.ansicht(page, 'geheim-' + kurz + '-tabelle', info);
    await h.tippe(page, BILD(l.bild));
  }
  await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
}

// Mitte des Rads, Radius der Scheibe und die Dreh-Tasten (für Lage-Prüfungen)
async function radLage(page) {
  return page.evaluate(() => {
    const r = document.querySelector('.geheim-rad').getBoundingClientRect();
    const tasten = Array.from(document.querySelectorAll('.geheim-drehen'), (t) => { const b = t.getBoundingClientRect(); return { l: b.left, r: b.right, o: b.top, u: b.bottom }; });

    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, rs: (r.width / 2) * 99 / 108, tasten, innen: Array.from(document.querySelectorAll('.geheim-i text'), (t) => { const b = t.getBoundingClientRect(); return { b: t.textContent, x: b.left + b.width / 2, y: b.top + b.height / 2, breite: b.width, hoehe: b.height }; }) };
  });
}
// Keine Dreh-Taste liegt auf der Scheibe: kleinster Abstand der Tasten zur Mitte minus Radius (mindestens 0)
function tastenAbstand(lage) {
  let min = Infinity;
  for (const t of lage.tasten) {
    const px = Math.max(t.l, Math.min(lage.cx, t.r)), py = Math.max(t.o, Math.min(lage.cy, t.u));
    min = Math.min(min, Math.hypot(px - lage.cx, py - lage.cy) - lage.rs);
  }
  return Math.round(min);
}
// Nach dem Drehen des Geräts passt das Spiel das Rad an (ResizeObserver; WebKit meldet es etwas später)
async function pruefeTasten(page) {
  await expect.poll(async () => tastenAbstand(await radLage(page)), { message: 'Dreh-Tasten neben der Scheibe', timeout: 5000 }).toBeGreaterThanOrEqual(0);
}

export function tests({ test, expect: erwarte, DATEN, h }) {
  const meldung = (page) => page.locator('.meldung');
  const finde = (bed) => h.suche('geheim', bed);

  test('Geheimschrift: keine Lösungen in den App-Daten', async () => {
    const levels = DATEN.pakete.flatMap((p) => p.levels).filter((l) => l.art === 'geheim');
    erwarte(levels.length).toBeGreaterThan(0);
    for (const lv of levels) {
      const s = JSON.stringify(lv);
      erwarte(lv.loesung, lv.id).toBeUndefined();
      if (lv.aufgabe === 'lesen' || lv.aufgabe === 'knacken') {
        erwarte(lv.klartext, lv.id).toBeUndefined();
        erwarte(s, lv.id).not.toContain('"' + loesung(lv).text + '"');
        erwarte(lv.schluessel === undefined || lv.aufgabe === 'lesen', lv.id + ': Schlüssel-Zahl beim Knacken').toBe(true);
      }
      if (lv.aufgabe === 'schreiben') erwarte(s, lv.id).not.toContain(loesung(lv).text);
      if (lv.aufgabe === 'zeichen') erwarte(lv.klartext, lv.id).toBeUndefined();
    }
  });

  test('Paket-Bild der Geheimschrift auch beim direkten Aufruf (QR-Code)', async ({ page }, info) => {
    const f = finde(() => true);
    test.skip(!f, 'kein Geheimschrift-Level');
    await page.goto('./#' + f.p.paket);
    await erwarte(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
    await erwarte(page.locator('.paket-bild svg.geheim-icon')).toHaveCount(1);
    await h.ansicht(page, 'geheim-paket', info);
    await page.goto(h.kachelSeite(f.p));
    await erwarte(page.locator('.kachel[data-paket="' + f.p.paket + '"] svg.geheim-icon')).toHaveCount(1);
  });

  test('Geheimschrift-Rad: drehen, Zahl beim Stern, aufrechte Buchstaben, Gerät drehen', async ({ page }, info) => {
    await h.schnell(page);
    const f = finde((l) => l.aufgabe === 'lesen' && l.schluessel >= 3);
    test.skip(!f, 'kein Lese-Level');
    await h.oeffneLevel(page, f, info);
    await erwarte(page.locator(ZAHL)).toHaveText('0');
    await erwarte(page.locator('.feld .geheim-n.geheim-oben')).toHaveAttribute('data-i', '0');
    // zurück von 0 ist 25 (das Rad ist rund), ein Doppeltipp dreht zwei Plätze (jeder Tipp zählt)
    await h.tippe(page, DREHEN(-1));
    await erwarte(page.locator(ZAHL)).toHaveText('25');
    await h.doppeltipp(page, DREHEN(1));
    await erwarte(page.locator(ZAHL)).toHaveText('1');
    await stelle(page, h, 3);
    await erwarte(page.locator('.feld .geheim-n.geheim-oben')).toHaveAttribute('data-i', '3');
    await erwarte(meldung(page)).toContainText('Die 3 steht beim Stern');
    // Nach dem Drehen steht das innere D oben unter dem Stern, alle Buchstaben aufrecht (höher als breit)
    await page.waitForTimeout(200);
    let lage = await radLage(page);
    const oben = lage.innen.reduce((a, b) => (b.y < a.y ? b : a));
    erwarte(oben.b).toBe('D');
    erwarte(Math.abs(oben.x - lage.cx)).toBeLessThan(2);
    for (const b of lage.innen.filter((x) => x.b !== 'I' && x.b !== 'W' && x.b !== 'M')) erwarte(b.hoehe, 'aufrecht: ' + b.b).toBeGreaterThanOrEqual(b.breite - 0.5);
    await pruefeTasten(page);
    await h.ansicht(page, 'geheim-rad-3', info);
    // Gerät drehen: das Rad passt sich an, die Tasten bleiben neben der Scheibe
    const g = page.viewportSize();
    await page.setViewportSize({ width: g.height, height: g.width });
    await pruefeTasten(page);
    lage = await radLage(page);
    erwarte(lage.rs * 2).toBeGreaterThan(150);
    await h.ansicht(page, 'geheim-rad-gedreht', info);
    await page.setViewportSize(g);
    await pruefeTasten(page);
  });

  test('Geheimschrift lesen: freundliche Hinweise, Such-Hilfe, Doppeltipp, Nochmal', async ({ page }, info) => {
    await h.schnell(page);
    // ein Level mit einem falschen Bild, das genauso lang ist wie das Geheimwort
    const f = finde((l) => l.aufgabe === 'lesen' && l.bilder.some((b) => G.wortVonBild(b).length === l.geheimtext.length && G.wortVonBild(b) !== G.lesen(l.geheimtext, l.schluessel)));
    test.skip(!f, 'kein passendes Lese-Level');
    await h.oeffneLevel(page, f, info);
    const l = loesung(f.lv);
    const gleich = f.lv.bilder.find((b) => b !== l.bild && G.wortVonBild(b).length === f.lv.geheimtext.length);
    const anders = f.lv.bilder.find((b) => G.wortVonBild(b).length !== f.lv.geheimtext.length);
    // Rad noch auf 0: zuerst das Rad stellen
    await h.tippe(page, BILD(gleich));
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Stell zuerst das Rad auf ' + l.k);
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(page.locator(BILD(gleich))).toHaveClass(/geheim-passt-nicht/);
    if (anders) {
      await h.tippe(page, BILD(anders));
      await erwarte(meldung(page)).toContainText(G.wortVonBild(anders).length + ' Buchstaben');
    }
    // Rad richtig: Hinweis auf den ersten Buchstaben, der nicht passt (markiert, auch innen am Rad)
    await stelle(page, h, l.k);
    await h.tippe(page, BILD(gleich));
    const als = G.schreiben(G.wortVonBild(gleich), l.k);
    let i = 0;
    while (als[i] === f.lv.geheimtext[i]) i++;
    await erwarte(meldung(page)).toContainText('Fast! Lies das markierte ' + f.lv.geheimtext[i]);
    await erwarte(page.locator('.programm .geheim-karte.geheim-an')).toHaveAttribute('data-i', String(i));
    await erwarte(page.locator('.feld .geheim-i.geheim-mark')).toHaveAttribute('data-b', f.lv.geheimtext[i]);
    await h.ansicht(page, 'geheim-lesen-hinweis', info);
    // Such-Hilfe: nochmal antippen nimmt die Markierung weg, ein Doppeltipp schaltet nur einmal
    await page.waitForTimeout(400);
    await h.tippe(page, KARTE(i));
    await erwarte(page.locator('.programm .geheim-karte.geheim-an')).toHaveCount(0);
    await erwarte(page.locator('.feld .geheim-mark')).toHaveCount(0);
    const j = i === 0 ? 1 : 0;
    await page.waitForTimeout(400);
    await h.doppeltipp(page, KARTE(j));
    await erwarte(page.locator('.programm .geheim-karte.geheim-an')).toHaveAttribute('data-i', String(j));
    await erwarte(page.locator('.feld .geheim-i.geheim-mark')).toHaveAttribute('data-b', f.lv.geheimtext[j]);
    // das richtige Bild
    await h.tippe(page, BILD(l.bild));
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await erwarte(page.locator('.dialog p')).toContainText(f.lv.geheimtext + ' heißt ' + l.text);
    await h.ansicht(page, 'geheim-lesen-geschafft', info);
    // Nochmal: Rad auf 0, alles wie am Anfang
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator(ZAHL)).toHaveText('0');
    await erwarte(page.locator('.tasten .geheim-passt-nicht')).toHaveCount(0);
    await erwarte(page.locator('.programm .geheim-an')).toHaveCount(0);
    await erwarte(page.locator('.punkte .punkt.voll')).toHaveCount(1);
  });

  test('Geheimschrift schreiben: roter Platz, Doppeltipp, Löschen, Nochmal', async ({ page }, info) => {
    await h.schnell(page);
    const f = finde((l) => l.aufgabe === 'schreiben' && l.klartext.length >= 3 && !l.klartext.includes(' '));
    test.skip(!f, 'kein Schreib-Level');
    await h.oeffneLevel(page, f, info);
    const l = loesung(f.lv);
    const n = l.text.length;
    await erwarte(page.locator('.programm .geheim-platz.geheim-dran')).toHaveAttribute('data-i', '0');
    await erwarte(page.locator(WEG)).toBeDisabled();
    await stelle(page, h, l.k);
    // Platz 2 (Index 1) mit einem anderen Buchstaben, der letzte mit Doppeltipp
    const falsch = f.lv.tasten.find((b) => b !== l.text[1]);
    for (let j = 0; j < n - 1; j++) await h.tippe(page, ABC(j === 1 ? falsch : l.text[j]));
    await h.doppeltipp(page, ABC(l.text[n - 1]));
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator(PLATZ(1))).toHaveClass(/geheim-falsch/);
    await erwarte(page.locator(PLATZ(1))).toHaveClass(/geheim-dran/);
    // der zweite Tipp des Doppeltipps hat den roten Platz nicht gleich überschrieben
    await erwarte(page.locator(PLATZ(1))).toHaveText(falsch);
    await erwarte(page.locator(PLATZ(n - 1))).toHaveText(l.text[n - 1]);
    await erwarte(meldung(page)).toContainText('Fast! Schau beim roten Platz');
    await erwarte(meldung(page)).toContainText('Such das ' + f.lv.klartext[1] + ' außen');
    await erwarte(page.locator('.feld .geheim-a.geheim-mark')).toHaveAttribute('data-b', f.lv.klartext[1]);
    await h.ansicht(page, 'geheim-schreiben-hinweis', info);
    // Löschen nimmt den letzten Buchstaben weg, der Platz ist dann dran
    await h.tippe(page, WEG);
    await erwarte(page.locator(PLATZ(n - 1))).toHaveText('');
    await erwarte(page.locator('.programm .geheim-platz.geheim-dran')).toHaveAttribute('data-i', String(n - 1));
    await h.tippe(page, ABC(l.text[n - 1]));
    await erwarte(page.locator(PLATZ(1))).toHaveClass(/geheim-falsch/);
    // Den roten Platz antippen (Doppeltipp: bleibt gewählt) und richtig füllen
    await page.waitForTimeout(400);
    await h.doppeltipp(page, PLATZ(0));
    await erwarte(page.locator('.programm .geheim-platz.geheim-dran')).toHaveAttribute('data-i', '0');
    await erwarte(page.locator('.feld .geheim-a.geheim-mark')).toHaveAttribute('data-b', f.lv.klartext[0]);
    await page.waitForTimeout(400);
    await h.tippe(page, PLATZ(1));
    await h.tippe(page, ABC(l.text[1]));
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await erwarte(page.locator('.dialog p')).toContainText('heißt in Geheimschrift ' + l.text);
    await h.ansicht(page, 'geheim-schreiben-geschafft', info);
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.programm .geheim-platz.geheim-voll')).toHaveCount(0);
    await erwarte(page.locator('.programm .geheim-platz.geheim-dran')).toHaveAttribute('data-i', '0');
    await erwarte(page.locator(ZAHL)).toHaveText('0');
  });

  test('Geheimschrift knacken: Probe, Probiert, Bild ohne Schlüssel-Zahl, Nochmal', async ({ page }, info) => {
    await h.schnell(page);
    const f = finde((l) => l.aufgabe === 'knacken');
    test.skip(!f, 'kein Knack-Level');
    await h.oeffneLevel(page, f, info);
    const l = loesung(f.lv);
    if (f.lv.bereich) await erwarte(meldung(page)).toContainText(f.lv.bereich[0] + ' bis ' + f.lv.bereich[1]);
    await erwarte(page.locator('.programm .geheim-probiert')).toContainText('noch nichts');
    // Probe bei 0
    await h.tippe(page, PROBE);
    await erwarte(meldung(page)).toContainText('Bei 0');
    // ein falscher Versuch
    const versuch = l.k === 1 ? 2 : 1;
    await stelle(page, h, versuch);
    await h.tippe(page, PROBE);
    erwarte((await page.locator('.programm .geheim-probe-feld').allTextContents()).join('')).toBe(G.lesen(f.lv.geheimtext, versuch).replace(/ /g, ''));
    await erwarte(page.locator('.programm .geheim-probiert')).toContainText('Probiert: ' + versuch);
    await erwarte(meldung(page)).toContainText('Ein echtes Wort?');
    await h.ansicht(page, 'geheim-knacken-versuch', info);
    // Drehen räumt die Probe weg, die probierten Zahlen bleiben
    await h.tippe(page, DREHEN(1));
    await erwarte(page.locator('.programm .geheim-probe-feld.geheim-voll')).toHaveCount(0);
    await erwarte(page.locator('.programm .geheim-probiert')).toContainText('Probiert: ' + versuch);
    // das richtige Bild, aber das Rad steht nicht auf der Schlüssel-Zahl
    if (versuch + 1 === l.k) await h.tippe(page, DREHEN(1));
    await h.tippe(page, BILD(l.bild));
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(meldung(page)).toContainText('Das Bild passt!');
    await erwarte(page.locator(BILD(l.bild))).toHaveClass(/geheim-gewaehlt/);
    // ein Bild, das nicht passt
    const anders = f.lv.bilder.find((b) => b !== l.bild);
    await h.tippe(page, BILD(anders));
    await erwarte(meldung(page)).not.toContainText('falsch');
    await erwarte(page.locator(BILD(anders))).toHaveClass(/geheim-passt-nicht/);
    await h.ansicht(page, 'geheim-knacken-hinweis', info);
    // Rad auf die Schlüssel-Zahl, Bild nochmal
    await stelle(page, h, l.k);
    await h.tippe(page, BILD(l.bild));
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await erwarte(page.locator('.dialog p')).toContainText('Geknackt! Mit der Schlüssel-Zahl ' + l.k);
    await h.ansicht(page, 'geheim-knacken-geschafft', info);
    await h.tippe(page, '.dialog [data-aktion="nochmal"]');
    await erwarte(page.locator('.dialog')).toHaveCount(0);
    await erwarte(page.locator('.programm .geheim-probiert')).toContainText('noch nichts');
    await erwarte(page.locator(ZAHL)).toHaveText('0');
  });

  test('Feen-Zeichen: Reihe der Form, freundlicher Hinweis, Doppeltipp', async ({ page }, info) => {
    await h.schnell(page);
    const f = finde((l) => l.aufgabe === 'zeichen');
    test.skip(!f, 'kein Feen-Zeichen-Level');
    await h.oeffneLevel(page, f, info);
    const l = loesung(f.lv);
    const reihe = (b) => (b === 'Z' ? 5 : Math.floor(G.nr(b) / 5));
    await h.tippe(page, KARTE(0));
    await erwarte(page.locator('.feld .geheim-zeile.geheim-an')).toHaveAttribute('data-r', String(reihe(f.lv.feen[0])));
    await erwarte(meldung(page)).toContainText('Zähl die Punkte');
    await page.waitForTimeout(400);
    await h.tippe(page, KARTE(0));
    await erwarte(page.locator('.feld .geheim-zeile.geheim-an')).toHaveCount(0);
    await page.waitForTimeout(400);
    await h.doppeltipp(page, KARTE(1));
    await erwarte(page.locator('.feld .geheim-zeile.geheim-an')).toHaveAttribute('data-r', String(reihe(f.lv.feen[1])));
    // ein Bild mit gleich langem Wort: Hinweis auf das erste Zeichen, das nicht passt
    const gleich = f.lv.bilder.find((b) => b !== l.bild && G.wortVonBild(b).length === f.lv.feen.length);
    if (gleich) {
      const w = G.wortVonBild(gleich);
      let i = 0;
      while (w[i] === f.lv.feen[i]) i++;
      await h.tippe(page, BILD(gleich));
      await erwarte(meldung(page)).toContainText('Fast! Schau das goldene Zeichen');
      await erwarte(page.locator('.programm .geheim-karte.geheim-an')).toHaveAttribute('data-i', String(i));
      await erwarte(page.locator('.feld .geheim-zeile.geheim-an')).toHaveAttribute('data-r', String(reihe(f.lv.feen[i])));
      await h.ansicht(page, 'geheim-zeichen-hinweis', info);
    }
    await h.tippe(page, BILD(l.bild));
    await erwarte(page.locator('.dialog h2')).toHaveText('Geschafft!');
    await erwarte(page.locator('.dialog p')).toContainText('Das Feen-Wort heißt ' + l.text);
    await h.ansicht(page, 'geheim-zeichen-geschafft', info);
  });
}
