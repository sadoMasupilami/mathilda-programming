// Tests der Web-App (Playwright): jedes Level jedes Pakets wird einmal durchgespielt – per Antippen.
// Die Lösungen rechnet der Test selbst mit dem Löser aus (werkzeuge/loeser.mjs); die App kennt keine Lösungen.
// Jede Ansicht: Bildschirmfoto nach test-results/bilder/<projekt>/<ansicht>.png und Prüfung,
// dass nichts scrollt, alles im Bild ist, Tasten groß genug sind und das Gitter nicht gedreht ist.
// Jede Anfrage an einen fremden Host und jeder Fehler in der Konsole lässt den Test scheitern.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { K, kuerzeste, mitZauber, alleReparaturen, wendeReparaturAn, ablaufZaehlen } from '../werkzeuge/loeser.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEN = JSON.parse(fs.readFileSync(path.join(WURZEL, '_site', 'daten.js'), 'utf8')
  .replace(/^[\s\S]*?window\.WERKSTATT_DATEN\s*=\s*/, '').replace(/;\s*$/, ''));
const SCHNELL = 40; // ms pro Befehl beim Durchspielen
const PORT = String(Number(process.env.WERKSTATT_TEST_PORT) || 4173);

// Blöcke wie in web/app.js: liegen die Pakete in mehreren Blöcken, zeigt die Startseite Block-Kacheln
const BLOCK = (n) => (n <= 5 ? 'a' : n <= 10 ? 'b' : n <= 14 ? 'c' : 'd');
const MEHRERE_BLOECKE = new Set(DATEN.pakete.map((p) => BLOCK(p.einheit))).size > 1;
// Seite mit der Kachel eines Pakets: Block-Ansicht oder Startseite
const kachelSeite = (p) => (MEHRERE_BLOECKE ? './#block-' + BLOCK(p.einheit) : './');

// ---------------------------------------------------------------------
// Test-Plugins für weitere Rätselarten: tests/spiele/<art>.mjs (gleicher Name wie web/spiele/<art>.js)
//   export async function spiele(page, lv, h, info, fotos)
//       spielt das Level per Antippen, bis das Geschafft-Fenster offen ist (Lösung selbst ausrechnen,
//       mit derselben Kern-Datei web/kern/… wie Löser und App; die App kennt keine Lösungen)
//   export function tests({ test, expect, DATEN, h })   weitere Tests (optional): falsche Antwort,
//       freundliche Meldung, Nochmal, Doppeltipp … Jede Ansicht mit h.ansicht fotografieren und prüfen.
//   h: { tippe, tippeGrau, ansicht, oeffnePaket, oeffneLevel, doppeltipp, schnell, suche, K, WURZEL }
// ---------------------------------------------------------------------
const SPIEL_TESTS = {};
const SPIEL_ORDNER = path.join(WURZEL, 'tests', 'spiele');
if (fs.existsSync(SPIEL_ORDNER)) {
  for (const d of fs.readdirSync(SPIEL_ORDNER).filter((x) => x.endsWith('.mjs')).sort()) {
    SPIEL_TESTS[d.slice(0, -4)] = await import(new URL('./spiele/' + d, import.meta.url).href);
  }
}

// ---------------------------------------------------------------------
// Wachen: fremde Hosts, Konsole
// ---------------------------------------------------------------------
let fremd = [];
let konsole = [];
test.beforeEach(async ({ page, context }) => {
  fremd = [];
  konsole = [];
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.protocol === 'data:' || u.protocol === 'blob:' || ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.port === PORT)) return route.continue();
    fremd.push(u.href);
    return route.abort();
  });
  page.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });
  page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
});
test.afterEach(async () => {
  expect(fremd, 'Anfragen an fremde Hosts').toEqual([]);
  expect(konsole, 'Fehler in der Konsole').toEqual([]);
});

async function schnell(page) {
  await page.addInitScript((t) => { window.WERKSTATT_TEMPO = t; }, SCHNELL);
}

// ---------------------------------------------------------------------
// Ansicht prüfen und fotografieren
// ---------------------------------------------------------------------
async function ansicht(page, name, info) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);
  const ordner = path.join(WURZEL, 'test-results', 'bilder', info.project.name);
  fs.mkdirSync(ordner, { recursive: true });
  await page.screenshot({ path: path.join(ordner, name + '.png') });
  const bericht = await page.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const se = document.scrollingElement;
    const probleme = [];
    if (se.scrollHeight > vh + 1) probleme.push('senkrecht zu hoch: ' + se.scrollHeight + ' > ' + vh);
    if (se.scrollWidth > vw + 1) probleme.push('waagrecht zu breit: ' + se.scrollWidth + ' > ' + vw);
    const name = (b) => (b.getAttribute('aria-label') || b.textContent || b.className).trim().slice(0, 30);
    const sichtbar = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const aktiv = [];
    for (const b of document.querySelectorAll('button')) {
      if (!sichtbar(b)) continue;
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > vw || cy > vh) { probleme.push('Taste außerhalb des Bildschirms: ' + name(b)); continue; }
      const oben = document.elementFromPoint(cx, cy);
      if (!oben || !(oben === b || b.contains(oben))) continue; // verdeckt, z. B. hinter dem Geschafft-Fenster
      aktiv.push([b, r]);
      if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) probleme.push('Taste ragt hinaus: ' + name(b));
      if (r.width < 47.5 || r.height < 47.5) probleme.push('Taste zu klein (' + Math.round(r.width) + '×' + Math.round(r.height) + '): ' + name(b));
    }
    for (let i = 0; i < aktiv.length; i++) {
      for (let j = i + 1; j < aktiv.length; j++) {
        const a = aktiv[i][1], c = aktiv[j][1];
        const dx = Math.max(0, Math.max(a.left, c.left) - Math.min(a.right, c.right));
        const dy = Math.max(0, Math.max(a.top, c.top) - Math.min(a.bottom, c.bottom));
        if (Math.hypot(dx, dy) < 7.5) probleme.push('Tasten zu eng (' + Math.round(Math.hypot(dx, dy)) + ' px): ' + name(aktiv[i][0]) + ' / ' + name(aktiv[j][0]));
      }
    }
    for (const inp of document.querySelectorAll('input')) {
      if (parseFloat(getComputedStyle(inp).fontSize) < 16) probleme.push('Eingabefeld-Schrift unter 16 px');
      if (inp.getAttribute('autocapitalize') !== 'off' || inp.getAttribute('autocorrect') !== 'off') probleme.push('Eingabefeld ohne autocapitalize/autocorrect="off"');
    }
    // Text, der aus seinem Kasten ragt (z. B. lange Wörter auf schmalen Ablauf-Karten)
    for (const el of document.querySelectorAll('.ablauf-karte .text, .taste > span, .kachel-titel, .meldung-text, .dialog h2, .dialog p')) {
      if (!sichtbar(el)) continue;
      const box = el.closest('.ablauf-karte, .taste, .kachel, .meldung, .dialog') || el.parentElement;
      const rb = box.getBoundingClientRect(), sb = getComputedStyle(box);
      const innen = { l: rb.left + parseFloat(sb.borderLeftWidth), r: rb.right - parseFloat(sb.borderRightWidth) };
      const rg = document.createRange();
      rg.selectNodeContents(el);
      for (const z of rg.getClientRects()) {
        if (z.width && (z.left < innen.l - 0.5 || z.right > innen.r + 0.5)) {
          probleme.push('Text ragt aus dem Kasten: „' + el.textContent.trim().slice(0, 30) + '“ (' + Math.round(z.width) + ' px)');
          break;
        }
      }
      if (el.scrollWidth > el.clientWidth + 1) probleme.push('Text zu breit: „' + el.textContent.trim().slice(0, 30) + '“');
    }
    const feld = document.querySelector('.feld');
    let gitter = null;
    if (feld) {
      const r = feld.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) probleme.push('Spielfeld zu klein');
      if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) probleme.push('Spielfeld nicht ganz im Bild');
      const svg = feld.querySelector('.gitter-basis svg');
      if (svg) {
        for (let el = svg; el && el !== document.documentElement; el = el.parentElement) {
          const t = getComputedStyle(el).transform;
          if (t && t !== 'none') probleme.push('Gitter oder Eltern gedreht/verschoben: ' + t);
        }
        if (svg.getAttribute('transform')) probleme.push('Gitter hat transform');
        const vb = svg.viewBox.baseVal;
        const rs = svg.getBoundingClientRect();
        const massstab = Math.min(rs.width / vb.width, rs.height / vb.height);
        gitter = { feldPx: Math.round(massstab * 100), breite: Math.round(vb.width * massstab), hoehe: Math.round(vb.height * massstab) };
        if (gitter.feldPx < 36) probleme.push('Gitter-Felder zu klein: ' + gitter.feldPx + ' px');
      }
    }
    return { probleme, gitter, ansicht: document.body.dataset.ansicht };
  });
  expect(bericht.probleme, 'Ansicht „' + name + '“').toEqual([]);
  return bericht;
}

// ---------------------------------------------------------------------
// Bedienen
// ---------------------------------------------------------------------
// Nach einem Wechsel der Tastenbelegung sperrt die App kurz alle Tipps (Doppeltipp-Schutz, #app[data-sperre]).
// Ein Mensch tippt nicht schneller als 350 ms auf eine neue Taste, der Test wartet deshalb das Ende der Sperre ab.
async function tippe(page, sel, opt) {
  await page.locator('#app:not([data-sperre])').waitFor({ state: 'attached' });
  await page.locator(sel).first().tap(opt);
}
// Eine nur grau dargestellte Taste (aria-disabled): Playwright hält sie für gesperrt, ein Kind tippt trotzdem darauf
const tippeGrau = (page, sel) => tippe(page, sel, { force: true });
async function oeffnePaket(page, p) {
  await page.goto('./#' + p.paket);
  await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
}

function weltVon(l) {
  const w = {};
  for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine']) if (l[f] !== undefined) w[f] = l[f];
  return w;
}
function loesePfad(lv) {
  const w = weltVon(lv);
  if (lv.zauber) {
    const max = lv.maxKarten || 8;
    const z = mitZauber(w, max);
    if (z.erreichbar) return K.lies(z.kuerzeste[0]);
  }
  return kuerzeste(w).programme[0];
}
async function gibProgrammEin(page, prog) {
  for (const t of prog) {
    if (typeof t === 'string') await tippe(page, '.tasten [data-aktion="befehl"][data-befehl="' + t + '"]');
    else {
      await tippe(page, '.tasten [data-aktion="zauber"]');
      await tippe(page, '.tasten [data-aktion="zahl"][data-zahl="' + t.wdh + '"]');
      for (const b of t.befehle) await tippe(page, '.tasten [data-aktion="befehl"][data-befehl="' + b + '"]');
      await tippe(page, '.tasten [data-aktion="fertig"]');
    }
  }
}
// In der App kann man einen Befehl nur austauschen
function koboldReparatur(lv) {
  const w = weltVon(lv);
  const p = K.lies(lv.programm);
  for (const r of alleReparaturen(p)) {
    if (r.art === 'tauschen' && K.ausfuehren(w, wendeReparaturAn(p, r)).geschafft) return r;
  }
  throw new Error('Keine Reparatur für ' + lv.id);
}

async function oeffneLevel(page, f, info) {
  await oeffnePaket(page, f.p);
  await page.goto('./#' + f.p.paket + '/' + (f.i + 1));
  await expect(page.locator('.spiel')).toHaveAttribute('data-level', f.lv.id);
}
// Suche ein Level einer Art (auch Plugin-Arten): { p, i, lv } oder null
function suche(art, bedingung) {
  for (const p of DATEN.pakete) {
    const i = p.levels.findIndex((l) => l.art === art && bedingung(l));
    if (i >= 0) return { p, i, lv: p.levels[i] };
  }
  return null;
}
// Doppeltipp: zwei echte Touch-Tipps 60 ms hintereinander auf dieselbe Stelle
async function doppeltipp(page, sel) {
  await page.locator('#app:not([data-sperre])').waitFor({ state: 'attached' });
  const r = await page.locator(sel).first().boundingBox();
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(60);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(450);
}
const H = { tippe, tippeGrau, ansicht, oeffnePaket, oeffneLevel, doppeltipp, schnell, suche, K, WURZEL, kachelSeite };

async function spieleLevel(page, p, i, info, fotos) {
  const lv = p.levels[i];
  await expect(page.locator('.spiel')).toHaveAttribute('data-level', lv.id);
  await ansicht(page, p.paket + '-level' + (i + 1), info);
  if (!['pfad', 'kobold', 'ablauf'].includes(lv.art)) {
    const pl = SPIEL_TESTS[lv.art];
    expect(pl && pl.spiele, 'Test-Plugin tests/spiele/' + lv.art + '.mjs mit spiele()').toBeTruthy();
    await pl.spiele(page, lv, H, info, fotos);
    await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
    if (fotos) await ansicht(page, p.paket + '-geschafft', info);
    await tippe(page, '.dialog [data-aktion="weiter"]');
    return;
  }
  if (lv.art === 'ablauf') {
    const reihe = ablaufZaehlen(lv.karten.map((k) => k.id), lv.regeln || []).loesungen[0];
    for (const id of reihe) await tippe(page, '.ablauf-karte[data-id="' + id + '"]');
  } else if (lv.art === 'kobold') {
    const r = koboldReparatur(lv);
    await expect(page.locator('.programm .stelle')).toHaveCount(0);
    await tippe(page, '.kobold-karte[data-i="' + (r.stelle - 1) + '"]');
    if (fotos) await ansicht(page, 'kobold-auswahl', info);
    await expect(page.locator('.tasten [data-aktion="weg"]')).toHaveCount(0);
    await tippe(page, '.tasten [data-befehl="' + r.befehl + '"]');
  } else {
    await gibProgrammEin(page, loesePfad(lv));
    if (fotos) await ansicht(page, p.paket + '-programm', info);
  }
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.dialog')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
  if (fotos) await ansicht(page, p.paket + '-geschafft', info);
  await tippe(page, '.dialog [data-aktion="weiter"]');
}

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------
test('Startseite und Paket-Auswahl', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'start');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  const bloecke = [...new Set(DATEN.pakete.map((p) => BLOCK(p.einheit)))];
  if (MEHRERE_BLOECKE) await expect(page.locator('.kachel[data-aktion="block"]')).toHaveCount(bloecke.length);
  else await expect(page.locator('.kachel')).toHaveCount(DATEN.pakete.length);
  await ansicht(page, 'start', info);
  // Jeder Block zeigt seine Pakete, alle passen ohne Scrollen auf den Bildschirm
  if (MEHRERE_BLOECKE) {
    for (const b of bloecke) {
      await tippe(page, '.kachel[data-block="' + b + '"][data-aktion="block"]');
      await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'block');
      await expect(page.locator('.kachel[data-paket]')).toHaveCount(DATEN.pakete.filter((p) => BLOCK(p.einheit) === b).length);
      await ansicht(page, 'block-' + b, info);
      await tippe(page, '[data-aktion="heim"]');
    }
  }
  // Alle Pakete sind gleich offen: Antippen öffnet die Level-Auswahl, ohne Schlüsselwort
  const p = DATEN.pakete[0];
  await page.goto(kachelSeite(p));
  await tippe(page, '.kachel[data-paket="' + p.paket + '"]');
  await expect(page).toHaveURL(new RegExp('#' + p.paket + '$'));
  await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'paket');
  await ansicht(page, 'paket', info);
  await page.goto(kachelSeite(p));
  await expect(page.locator('.kachel[data-paket="' + p.paket + '"] .kachel-stand')).toContainText('0 von ' + p.levels.length);
});

for (const p of DATEN.pakete) {
  test('Paket ' + p.paket + ' (' + p.titel + '): jedes Level durchspielen', async ({ page }, info) => {
    await schnell(page);
    await oeffnePaket(page, p);
    await tippe(page, '.paket [data-aktion="level"].haupt');
    for (let i = 0; i < p.levels.length; i++) await spieleLevel(page, p, i, info, i === 0);
    await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'ende');
    await expect(page.locator('.ende h1')).toHaveText('Super! Jetzt zurück zum Papier.');
    await expect(page.locator('.ende-stern')).toHaveCount(p.levels.length);
    await ansicht(page, p.paket + '-ende', info);
    // kein automatisches nächstes Paket: nur zurück zur Startseite
    await tippe(page, '.ende [data-aktion="heim"]');
    await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'start');
    await page.goto(kachelSeite(p));
    await expect(page.locator('.kachel[data-paket="' + p.paket + '"] .kachel-stand')).toContainText(p.levels.length + ' von ' + p.levels.length);
  });
}

const pfadPaket = DATEN.pakete.find((p) => p.levels.some((l) => l.art === 'pfad' && !l.zauber)) || DATEN.pakete.find((p) => p.levels.some((l) => l.art === 'pfad'));
test('Drache läuft Schritt für Schritt, Kobold-Stoß', async ({ page }, info) => {
  test.skip(!pfadPaket, 'kein Pfad-Paket');
  const i = pfadPaket.levels.findIndex((l) => l.art === 'pfad');
  const lv = pfadPaket.levels[i];
  await oeffnePaket(page, pfadPaket);
  await page.goto('./#' + pfadPaket.paket + '/' + (i + 1));
  // ein Programm, das irgendwo anstößt: so oft vor, bis der Drache an den Rand oder einen Stein kommt
  const w = weltVon(lv);
  let n = 1;
  while (n < 12 && !K.ausfuehren(w, Array(n).fill('vor')).stoss) n++;
  const prog = Array(n).fill('vor');
  const e = K.ausfuehren(w, prog);
  expect(e.stoss, 'Testprogramm stößt an').toBeTruthy();
  await gibProgrammEin(page, prog);
  await tippe(page, '.tasten [data-aktion="los"]');
  if (e.schritte.length >= 1) {
    await expect(page.locator('.programm .karte.aktiv')).toHaveCount(1, { timeout: 2000 });
    await expect(page.locator('.meldung')).toContainText('läuft');
    await ansicht(page, 'drache-laeuft', info);
  }
  await expect(page.locator('.meldung.stoss')).toContainText('Hier hat der Kobold zugeschlagen!', { timeout: 15_000 });
  await expect(page.locator('.programm .karte.stoss')).toHaveCount(1);
  await expect(page.locator('.programm .karte[data-teil="' + e.stoss.teil + '"]')).toHaveClass(/stoss/);
  await ansicht(page, 'kobold-stoss', info);
  // Nochmal: Drache zurück, Programm bleibt
  await tippe(page, '.tasten [data-aktion="nochmal"]');
  await expect(page.locator('.programm .karte.stoss')).toHaveCount(0);
  await expect(page.locator('.programm .karte:not(.platzhalter)')).toHaveCount(n);
  // Letzten Befehl löschen
  await tippe(page, '.tasten [data-aktion="loeschen"]');
  await expect(page.locator('.programm .karte:not(.platzhalter)')).toHaveCount(n - 1);
});

// ---------------------------------------------------------------------
// Meldungen und Grenzfälle
// ---------------------------------------------------------------------
// Alle Programme mit genau n Befehlen (ohne Zauber-Kasten)
function* programme(n) {
  if (n === 0) { yield []; return; }
  for (const p of programme(n - 1)) for (const b of K.BEFEHLE) yield p.concat([b]);
}
function finde(lv, pruefe, maxLaenge) {
  const w = weltVon(lv);
  for (let n = 1; n <= maxLaenge; n++) for (const p of programme(n)) if (pruefe(K.ausfuehren(w, p), p)) return p;
  return null;
}


test('Fast geschafft: angekommen, aber nicht das kürzeste Programm', async ({ page }, info) => {
  let f = null, prog = null;
  for (const p of DATEN.pakete) {
    p.levels.forEach((l, i) => {
      if (f || l.art !== 'pfad' || l.zauber || l.aufgabe !== 'kuerzestes') return;
      const k = kuerzeste(weltVon(l)).laenge;
      const g = finde(l, (e, x) => e.geschafft && x.length > k, Math.min(l.maxBefehle || 12, k + 3));
      if (g) { f = { p, i, lv: l }; prog = g; }
    });
  }
  test.skip(!f, 'kein „kürzestes“-Level mit längerem Programm');
  await schnell(page);
  await oeffneLevel(page, f, info);
  await expect(page.locator('.meldung')).toContainText('kürzeste');
  await gibProgrammEin(page, prog);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.dialog h2')).toHaveText('Fast geschafft!', { timeout: 15_000 });
  await expect(page.locator('.dialog p')).toContainText('mit ' + kuerzeste(weltVon(f.lv)).laenge + ' Befehlen');
  await ansicht(page, 'fast-geschafft', info);
  // „Nochmal“: Drache zurück, das Programm bleibt zum Verbessern
  await tippe(page, '.dialog [data-aktion="nochmal"]');
  await expect(page.locator('.dialog')).toHaveCount(0);
  await expect(page.locator('.programm .karte:not(.platzhalter)')).toHaveCount(prog.length);
  await expect(page.locator('.punkte .punkt.voll')).toHaveCount(0);
});

test('Meldungen: Edelsteine fehlen, noch nicht beim Schatz', async ({ page }, info) => {
  await schnell(page);
  // Edelsteine: zum Schatz, ohne alle einzusammeln
  const g = suche('pfad', (l) => l.edelsteine && l.edelsteine.length);
  if (g) {
    const ohne = { ...g.lv, edelsteine: [] };
    const prog = finde(ohne, (e) => e.geschafft, Math.min(g.lv.maxKarten || 12, 7));
    expect(prog, 'Programm zum Schatz ohne Edelsteine').toBeTruthy();
    await oeffneLevel(page, g, info);
    await expect(page.locator('.meldung')).toContainText('Sammle alle Edelsteine');
    if (g.lv.maxKarten) await expect(page.locator('.meldung')).toContainText('Höchstens ' + g.lv.maxKarten + ' Karten');
    await ansicht(page, 'edelsteine-aufgabe', info);
    await gibProgrammEin(page, prog);
    await tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.meldung')).toContainText('Fast! Es fehlen noch Edelsteine.', { timeout: 15_000 });
    await ansicht(page, 'edelsteine-fehlen', info);
  }
  // Nur gedreht: der Drache bleibt am Start
  const n = suche('pfad', (l) => !K.ausfuehren(weltVon(l), ['links']).stoss && !K.ausfuehren(weltVon(l), ['links']).geschafft);
  await oeffneLevel(page, n, info);
  await gibProgrammEin(page, ['links']);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.meldung')).toContainText('noch nicht beim', { timeout: 15_000 });
  await ansicht(page, 'noch-nicht-da', info);
});

test('Grenze der Programm-Reihe: freundliche Meldung statt stummer Tasten', async ({ page }, info) => {
  const f = suche('pfad', (l) => !l.zauber && l.maxBefehle);
  test.skip(!f, 'kein Pfad-Level mit maxBefehle');
  await oeffneLevel(page, f, info);
  // Drehen stößt nie an: so viele Drehungen, wie am Blatt Platz haben, und eine mehr
  for (let j = 0; j < f.lv.maxBefehle; j++) await tippe(page, '.tasten [data-befehl="' + (j % 2 ? 'links' : 'rechts') + '"]');
  await expect(page.locator('.programm .karte:not(.platzhalter)')).toHaveCount(f.lv.maxBefehle);
  await expect(page.locator('.programm .karte.platzhalter')).toHaveCount(0);
  await expect(page.locator('.programm .teil-nr').last()).toHaveText(String(f.lv.maxBefehle));
  await expect(page.locator('.tasten [data-befehl="vor"]')).toHaveAttribute('aria-disabled', 'true');
  await tippeGrau(page, '.tasten [data-befehl="vor"]');
  await expect(page.locator('.programm .karte:not(.platzhalter)')).toHaveCount(f.lv.maxBefehle);
  await expect(page.locator('.meldung')).toContainText('Mehr als ' + f.lv.maxBefehle + ' Befehle passen nicht.');
  await ansicht(page, 'programm-voll', info);
});

test('Kobold: Neu stellt das Kobold-Programm wie am Anfang her', async ({ page }, info) => {
  const f = suche('kobold', () => true);
  test.skip(!f, 'kein Kobold-Level');
  await oeffneLevel(page, f, info);
  const vorher = await page.locator('.kobold-karte').evaluateAll((k) => k.map((x) => x.className));
  const b0 = K.lies(f.lv.programm)[0];
  const anders = K.BEFEHLE.find((b) => b !== b0);
  await tippe(page, '.kobold-karte[data-i="0"]');
  await expect(page.locator('.tasten [data-aktion="abbrechen"]')).toContainText('zurück');
  await expect(page.locator('.tasten-frage')).toContainText('austauschen gegen');
  await tippe(page, '.tasten [data-befehl="' + anders + '"]');
  await expect(page.locator('.kobold-karte[data-i="0"]')).toHaveClass(new RegExp('befehl-' + anders));
  // nur ein Tausch: die anderen Befehle sind zu, der getauschte bleibt änderbar
  await expect(page.locator('.kobold-karte.zu')).toHaveCount(vorher.length - 1);
  await tippeGrau(page, '.kobold-karte[data-i="1"]');
  await expect(page.locator('.kobold-karte.gewaehlt')).toHaveCount(0);
  await expect(page.locator('.meldung')).toContainText('schon einen Befehl getauscht');
  await ansicht(page, 'kobold-ein-tausch', info);
  await tippe(page, '.kobold-karte[data-i="0"]');
  await expect(page.locator('.kobold-karte.gewaehlt')).toHaveCount(1);
  await tippe(page, '.tasten [data-aktion="abbrechen"]');
  await tippe(page, '.tasten [data-aktion="neu"]');
  await expect(page.locator('.kobold-karte.zu')).toHaveCount(0);
  await expect(page.locator('.kobold-karte[data-i="0"]')).toHaveClass(new RegExp('befehl-' + b0));
  expect(await page.locator('.kobold-karte').evaluateAll((k) => k.map((x) => x.className))).toEqual(vorher);
  await ansicht(page, 'kobold-neu', info);
});

test('Doppeltipp löst nie die Taste aus, die danach an derselben Stelle liegt', async ({ page }, info) => {
  const z = suche('pfad', (l) => l.zauber);
  if (z) {
    await oeffneLevel(page, z, info);
    await doppeltipp(page, '.tasten [data-aktion="zauber"]');
    await expect(page.locator('.tasten [data-aktion="zahl"]')).toHaveCount(4);   // „Wie oft?“ ist offen …
    await expect(page.locator('.programm .kasten-z')).toHaveCount(0);           // … und noch kein Kasten angelegt
    await doppeltipp(page, '.tasten [data-aktion="zahl"][data-zahl="3"]');
    await expect(page.locator('.programm .kasten-z.offen .mal')).toContainText('3-mal');
    await expect(page.locator('.programm .kasten-z .karte:not(.platzhalter)')).toHaveCount(0);
    await tippe(page, '.tasten [data-befehl="vor"]');
    await doppeltipp(page, '.tasten [data-aktion="fertig"]');
    await expect(page.locator('.programm .kasten-z:not(.offen)')).toHaveCount(1);
    await expect(page.locator('.tasten [data-aktion="zahl"]')).toHaveCount(0);   // nicht gleich wieder „Wie oft?“
  }
  const k = suche('kobold', (l) => K.lies(l.programm).length >= 3);
  if (k) {
    await oeffneLevel(page, k, info);
    const vorher = K.lies(k.lv.programm);
    const anders = K.BEFEHLE.find((b) => b !== vorher[2]);
    await tippe(page, '.kobold-karte[data-i="2"]');
    await doppeltipp(page, '.tasten [data-befehl="' + anders + '"]');
    // repariert, und der zweite Tipp hat nicht „Neu“ (Kobold-Programm wie am Anfang) erwischt
    await expect(page.locator('.kobold-karte[data-i="2"]')).toHaveClass(new RegExp('befehl-' + anders));
    await expect(page.locator('.kobold-karte.gewaehlt')).toHaveCount(0);
    // Doppeltipp auf eine Karte: sie bleibt ausgewählt (die getauschte, nur sie ist noch änderbar)
    await doppeltipp(page, '.kobold-karte[data-i="2"]');
    await expect(page.locator('.kobold-karte.gewaehlt')).toHaveCount(1);
    await ansicht(page, 'doppeltipp-kobold', info);
  }
  const a = suche('ablauf', () => true);
  if (a) {
    await oeffneLevel(page, a, info);
    await doppeltipp(page, '.ablauf-karte >> nth=0');
    await expect(page.locator('.ablauf-karte.gesetzt')).toHaveCount(1);
  }
});

test('Gerät drehen und Zurück, während der Drache läuft', async ({ page }, info) => {
  await page.addInitScript(() => { window.WERKSTATT_TEMPO = 250; });
  const f = suche('pfad', (l) => !l.zauber && kuerzeste(weltVon(l)).laenge >= 4);
  test.skip(!f, 'kein passendes Pfad-Level');
  await oeffneLevel(page, f, info);
  const prog = kuerzeste(weltVon(f.lv)).programme[0];
  await gibProgrammEin(page, prog);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.programm .karte.aktiv')).toHaveCount(1, { timeout: 2000 });
  const g = page.viewportSize();
  await page.setViewportSize({ width: g.height, height: g.width });
  await ansicht(page, 'gedreht-beim-laufen', info);
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 15_000 });
  await ansicht(page, 'gedreht-geschafft', info);
  await page.setViewportSize(g);
  // Mitten im Lauf zurück zum Paket (Hash-Wechsel): der Drache hört auf, nichts läuft im Hintergrund weiter
  await tippe(page, '.dialog [data-aktion="nochmal"]');
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.programm .karte.aktiv')).toHaveCount(1, { timeout: 2000 });
  await page.goBack();
  await expect(page.locator('body')).not.toHaveAttribute('data-ansicht', 'level');
  await page.waitForTimeout(250 * (prog.length + 2));
  await expect(page.locator('.dialog')).toHaveCount(0);
  await page.goForward();
  await expect(page.locator('.spiel')).toHaveAttribute('data-level', f.lv.id);
  await expect(page.locator('.programm .karte:not(.platzhalter)')).toHaveCount(0);
});

test('Ohne Speicher (localStorage gesperrt) geht alles, nur ohne Merken', async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('gesperrt', 'SecurityError'); } });
  });
  await schnell(page);
  const p = DATEN.pakete[0];
  await page.goto('./');
  await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'start');
  await oeffnePaket(page, p);
  await tippe(page, '.paket [data-aktion="level"].haupt');
  await spieleLevel(page, p, 0, info, false);
  await expect(page.locator('.spiel')).toHaveAttribute('data-level', p.levels[1].id);
  await ansicht(page, 'ohne-speicher', info);
});

const zauberPaket = DATEN.pakete.find((p) => p.levels.some((l) => l.zauber));
test('Zauber-Kasten: Zahl wählen, Befehle hinein, fertig, höchstens 3 Befehle', async ({ page }, info) => {
  test.skip(!zauberPaket, 'kein Paket mit Zauber-Kasten');
  // ein Level, in dem ein voller Kasten (1 + 3 Karten) unter die Kartengrenze passt
  let i = zauberPaket.levels.findIndex((l) => l.zauber && (l.maxKarten || 12) >= 5);
  if (i < 0) i = zauberPaket.levels.findIndex((l) => l.zauber);
  const lv = zauberPaket.levels[i];
  await oeffnePaket(page, zauberPaket);
  await page.goto('./#' + zauberPaket.paket + '/' + (i + 1));
  await tippe(page, '.tasten [data-aktion="zauber"]');
  await expect(page.locator('.tasten [data-aktion="zahl"]')).toHaveCount(4);
  await ansicht(page, 'zauber-zahl', info);
  await tippe(page, '.tasten [data-aktion="zahl"][data-zahl="3"]');
  await tippe(page, '.tasten [data-befehl="vor"]');
  await expect(page.locator('.programm .kasten-z.offen .mal')).toContainText('3-mal');
  await ansicht(page, 'zauber-offen', info);
  if ((lv.maxKarten || 12) >= 5) {
    // Plan 7.5 Regel 9: im Kasten höchstens eine Gruppe von 3 Befehlen
    await tippe(page, '.tasten [data-befehl="vor"]');
    await tippe(page, '.tasten [data-befehl="vor"]');
    await expect(page.locator('.meldung')).toContainText('Tippe auf „fertig“.');
    await expect(page.locator('.tasten [data-befehl="vor"]')).toHaveAttribute('aria-disabled', 'true');
    await tippeGrau(page, '.tasten [data-befehl="vor"]');
    await expect(page.locator('.programm .kasten-z.offen .karte:not(.platzhalter)')).toHaveCount(3);
    await expect(page.locator('.meldung')).toContainText('Der Zauber-Kasten ist voll');
    await ansicht(page, 'zauber-voll', info);
    await tippe(page, '.tasten [data-aktion="fertig"]');
    await expect(page.locator('.programm .kasten-z:not(.offen) .karte')).toHaveCount(3);
    await expect(page.locator('.programm .teil-nr').first()).toHaveText('1');
  } else {
    await tippe(page, '.tasten [data-aktion="fertig"]');
    await expect(page.locator('.programm .kasten-z:not(.offen) .karte')).toHaveCount(1);
  }
});

const ablaufPaket = DATEN.pakete.find((p) => p.levels.some((l) => l.art === 'ablauf'));
const ablaufEindeutig = (l) => l.art === 'ablauf' && ablaufZaehlen(l.karten.map((k) => k.id), l.regeln || []).anzahl < 2 && l.karten.length >= 3;
test('Ablauf-Karten: vertauschte Karten werden freundlich gezeigt und lassen sich tauschen', async ({ page }, info) => {
  test.skip(!ablaufPaket, 'kein Ablauf-Paket');
  const i = ablaufPaket.levels.findIndex(ablaufEindeutig);
  test.skip(i < 0, 'kein eindeutiges Ablauf-Level');
  const lv = ablaufPaket.levels[i];
  await oeffnePaket(page, ablaufPaket);
  await page.goto('./#' + ablaufPaket.paket + '/' + (i + 1));
  const richtig = ablaufZaehlen(lv.karten.map((k) => k.id), lv.regeln || []).loesungen[0];
  const falsch = richtig.slice();
  [falsch[0], falsch[1]] = [falsch[1], falsch[0]];
  for (const id of falsch) await tippe(page, '.ablauf-karte[data-id="' + id + '"]');
  await tippe(page, '.tasten [data-aktion="los"]');
  // genau die zwei Karten, deren Tausch hilft
  await expect(page.locator('.ablauf-karte.vertauscht')).toHaveCount(2);
  for (const id of falsch.slice(0, 2)) await expect(page.locator('.ablauf-karte[data-id="' + id + '"]')).toHaveClass(/vertauscht/);
  await expect(page.locator('.meldung')).toContainText('Tausche die zwei roten Karten');
  await ansicht(page, 'ablauf-vertauscht', info);
  // Tauschen: erst eine Karte, dann die andere
  await tippe(page, '.ablauf-karte[data-id="' + falsch[0] + '"]');
  await expect(page.locator('.ablauf-karte.gewaehlt')).toHaveCount(1);
  await ansicht(page, 'ablauf-tauschen', info);
  await tippe(page, '.ablauf-karte[data-id="' + falsch[1] + '"]');
  await expect(page.locator('.ablauf-karte.vertauscht')).toHaveCount(0);
  await expect(page.locator('.ablauf-karte[data-id="' + richtig[0] + '"] .nummer')).toHaveText('1');
  await expect(page.locator('.meldung')).toContainText('Getauscht!');
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
  // „Nochmal“ im Geschafft-Fenster wirkt wie im Level: alle Karten zurück
  await tippe(page, '.dialog [data-aktion="nochmal"]');
  await expect(page.locator('.dialog')).toHaveCount(0);
  await expect(page.locator('.ablauf-karte.gesetzt')).toHaveCount(0);
  // Schwerer Fall: eine Karte ganz nach hinten verschoben (B C A …). Ein Tausch allein reicht nicht,
  // aber jeder markierte Tausch bringt näher hin – nach wenigen Runden ist es richtig.
  const verschoben = richtig.slice(1, 3).concat([richtig[0]], richtig.slice(3));
  for (const id of verschoben) await tippe(page, '.ablauf-karte[data-id="' + id + '"]');
  for (let runde = 0; runde < richtig.length; runde++) {
    await tippe(page, '.tasten [data-aktion="los"]');
    if (await page.locator('.dialog').count()) break;
    await expect(page.locator('.ablauf-karte.vertauscht')).toHaveCount(2);
    if (runde === 0) await expect(page.locator('.meldung')).toContainText('Tausche zuerst');
    const rot = await page.locator('.ablauf-karte.vertauscht').evaluateAll((k) => k.map((x) => x.dataset.id));
    for (const id of rot) await tippe(page, '.ablauf-karte[data-id="' + id + '"]');
  }
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!');
});

test('Für Erwachsene: Eltern-Frage, Name, Fortschritt löschen', async ({ page }, info) => {
  const p = DATEN.pakete[0];
  test.skip(!p, 'keine Pakete');
  // ein Stern aus einem früheren Spiel
  await page.goto('./');
  await page.evaluate((id) => localStorage.setItem('denk-werkstatt-v1', JSON.stringify({ sterne: { [id]: true }, name: '' })), p.levels[0].id);
  await page.goto(kachelSeite(p));
  await page.reload();
  await expect(page.locator('.kachel[data-paket="' + p.paket + '"] .kachel-stand')).toContainText('1 von ' + p.levels.length);
  await page.goto('./#eltern');
  await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'eltern-frage');
  await ansicht(page, 'eltern-frage', info);
  await page.locator('#antwort').tap();
  await page.keyboard.type('1');
  await tippe(page, 'form button[type=submit]');
  await expect(page.locator('.hinweis.falsch')).toBeVisible();
  const [a, b] = (await page.locator('.rechnung').textContent()).split('·').map((x) => parseInt(x, 10));
  await page.locator('#antwort').tap();
  await page.keyboard.type(String(a * b));
  await tippe(page, 'form button[type=submit]');
  await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'eltern');
  await ansicht(page, 'eltern', info);
  await page.locator('#name').tap();
  await page.keyboard.type('Testkind');
  await tippe(page, 'form[data-form=name] button[type=submit]');
  await tippe(page, '[data-aktion="loeschen-frage"]');
  await ansicht(page, 'eltern-loeschen', info);
  await tippe(page, '[data-aktion="loeschen-ja"]');
  await expect(page.locator('.hinweis')).toContainText('Gelöscht');
  await tippe(page, '[data-aktion="heim"]');
  await expect(page.locator('.gruss')).toContainText('Testkind');
  await page.goto(kachelSeite(p));
  await expect(page.locator('.kachel[data-paket="' + p.paket + '"] .kachel-stand')).toContainText('0 von ' + p.levels.length);
});

test.describe('Offline', () => {
  // Nur hier Service Worker erlauben (sonst sieht context.route nicht alle Anfragen, siehe playwright.config.mjs)
  test.use({ serviceWorkers: 'allow' });
  test('Service Worker, alte Caches weg, neu laden ohne Netz', async ({ page, context, browserName }, info) => {
    // Ein Cache einer „alten Version“ – angelegt vor der Registrierung, auf einer leeren Seite desselben Ursprungs
    await page.route('**/leer', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>leer</title>' }));
    await page.goto('/leer');
    await page.evaluate(async () => { const c = await caches.open('denk-werkstatt-alt'); await c.put('alt.txt', new Response('alt')); });
    await page.goto('./');
    const sw = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'fehlt';
      const r = await navigator.serviceWorker.ready;
      return r.active ? r.active.scriptURL : 'nicht aktiv';
    });
    expect(sw).toMatch(/\/denk-werkstatt\/sw\.js$/);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 10_000 }).toBe(true);
    // Beim Aktivieren werden alte Caches gelöscht: nur der Cache dieser Version bleibt
    const caches = await page.evaluate(async () => (await window.caches.keys()));
    expect(caches).not.toContain('denk-werkstatt-alt');
    expect(caches.length).toBe(1);
    expect(caches[0]).toMatch(/^denk-werkstatt-[0-9a-f]{12}$/);
    // Die erste Übernahme durch den Service Worker lädt die Seite nicht neu (sie ist ja aktuell)
    await page.evaluate(() => { window.__nichtNeuGeladen = true; });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__nichtNeuGeladen)).toBe(true);
    await context.setOffline(true);
    try {
      await page.reload();
    } catch (e) {
      // Ehrlich im Bericht: Kann der Browser hier nicht offline neu laden, steht es als Hinweis im Ergebnis.
      test.info().annotations.push({ type: 'Hinweis', description: browserName + ': neu laden ohne Netz in Playwright nicht prüfbar (' + e.message.split('\n')[0] + ')' });
      console.log('Hinweis ' + info.project.name + ': neu laden ohne Netz nicht prüfbar');
      await context.setOffline(false);
      return;
    }
    await expect(page.locator('body')).toHaveAttribute('data-ansicht', 'start');
    await expect(page.locator('.kachel')).toHaveCount(MEHRERE_BLOECKE ? new Set(DATEN.pakete.map((p) => BLOCK(p.einheit))).size : DATEN.pakete.length);
    const schrift = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('700 20px Andika'); });
    expect(schrift).toBe(true);
    await ansicht(page, 'offline', info);
    await context.setOffline(false);
  });
});

// ---------------------------------------------------------------------
// Weitere Tests der Spiel-Plugins (tests/spiele/<art>.mjs)
// ---------------------------------------------------------------------
for (const [art, pl] of Object.entries(SPIEL_TESTS)) {
  if (!DATEN.pakete.some((p) => p.levels.some((l) => l.art === art))) continue;
  if (pl.tests) test.describe('Spiel ' + art, () => pl.tests({ test, expect, DATEN, h: H }));
}
