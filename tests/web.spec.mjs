// Tests der Web-App (Playwright): jedes Level jedes Pakets wird einmal durchgespielt – per Antippen.
// Die Lösungen rechnet der Test selbst mit dem Löser aus (werkzeuge/loeser.mjs); die App kennt keine Lösungen.
// Jede Ansicht: Bildschirmfoto nach test-results/bilder/<projekt>/<ansicht>.png und Prüfung,
// dass nichts scrollt, alles im Bild ist, Tasten groß genug sind und das Gitter nicht gedreht ist.
// Jede Anfrage an einen fremden Host und jeder Fehler in der Konsole lässt den Test scheitern.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { K, kuerzeste, mitZauber, mitRegeln, alleReparaturen, wendeReparaturAn, ablaufZaehlen } from '../werkzeuge/loeser.mjs';

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
// Mehrere Gitter ("welten"): fehlende Felder kommen aus dem Level (wie werkzeuge/raetsel.mjs und web/app.js)
function weltenVon(l) {
  if (!Array.isArray(l.welten) || !l.welten.length) return [weltVon(l)];
  return l.welten.map((w) => ({ ...weltVon(l), ...weltVon(w || {}) }));
}
// Pfad-Level mit erweiterten Befehlen (Wenn-dann, „bis zum Schatz“, Zaubersprüche) oder mehreren Gittern
const erweitert = (l) => l.art === 'pfad' && (l.erlaubt !== undefined || l.welten !== undefined);
const einfach = (l) => l.art === 'pfad' && !erweitert(l);
// Lösung eines Pfad-Levels: { programm: [...], sprueche: { name: [...] } } (sprueche = die, die das Kind selbst schreibt).
// Erweiterte Levels: der Löser sucht die kleinste Kartenzahl mit allem, was das Level erlaubt (die App kennt keine Lösung).
const LOESUNGEN = new Map();
function loesePfad(lv) {
  if (erweitert(lv)) {
    if (!LOESUNGEN.has(lv.id)) {
      const m = mitRegeln(weltenVon(lv), lv.maxKarten || 12, lv.erlaubt || [], { bedingungen: lv.bedingungen, sprueche: lv.sprueche || {}, spruchFrei: lv.spruchFrei || [] });
      if (!m.erreichbar) throw new Error('Löser findet keine Lösung für ' + lv.id + (m.grund ? ' (' + m.grund + ')' : ''));
      const k = m.kuerzeste[0];
      const sp = {};
      for (const [n, t] of Object.entries(k.sprueche || {})) sp[n] = K.liesSpruch(t, n);
      LOESUNGEN.set(lv.id, { programm: K.lies(k.programm), sprueche: sp });
    }
    return LOESUNGEN.get(lv.id);
  }
  const w = weltVon(lv);
  if (lv.zauber) {
    const max = lv.maxKarten || 8;
    const z = mitZauber(w, max);
    if (z.erreichbar) return { programm: K.lies(z.kuerzeste[0]), sprueche: {} };
  }
  return { programm: kuerzeste(w).programme[0], sprueche: {} };
}
// Programmteile antippen: Befehle, Zauber-Kasten (Zahl oder „bis zum Schatz“), Wenn-dann-Kasten
// (Wenn-Karte, dann, sonst, fertig) und Zauberspruch-Aufrufe – nur Antippen, wie ein Kind
async function gibTeile(page, teile) {
  for (const t of teile) {
    if (typeof t === 'string') await tippe(page, '.tasten [data-aktion="befehl"][data-befehl="' + t + '"]');
    else if (t.spruch) await tippe(page, '.tasten [data-aktion="ruf"][data-spruch="' + t.spruch + '"]');
    else if (t.wenn) {
      await tippe(page, '.tasten [data-aktion="wenn"]');
      // Gibt es nur eine Wenn-Karte im Level, kommt keine Wahl
      if (await page.locator('.tasten [data-aktion="bedingung"]').count()) await tippe(page, '.tasten [data-aktion="bedingung"][data-bedingung="' + t.wenn + '"]');
      await gibTeile(page, t.dann);
      if (t.sonst.length) { await tippe(page, '.tasten [data-aktion="sonst"]'); await gibTeile(page, t.sonst); }
      await tippe(page, '.tasten [data-aktion="fertig"]');
    } else {
      await tippe(page, '.tasten [data-aktion="zauber"]');
      // „Wie oft?“ kommt nur, wenn es auch Zahlen gibt; nur „bis zum Schatz“ legt den Kasten gleich hin
      if (t.bis) { if (await page.locator('.tasten [data-aktion="bis"]').count()) await tippe(page, '.tasten [data-aktion="bis"]'); }
      else await tippe(page, '.tasten [data-aktion="zahl"][data-zahl="' + t.wdh + '"]');
      await gibTeile(page, t.befehle);
      await tippe(page, '.tasten [data-aktion="fertig"]');
    }
  }
}
// Ganzes Programm eingeben. sprueche: Zaubersprüche, die das Kind selbst schreibt (zuerst, in ihrer Spruch-Reihe)
async function gibProgrammEin(page, prog, sprueche) {
  for (const [n, teile] of Object.entries(sprueche || {})) {
    if (!(await page.locator('.programm .spruch-reihe.schreiben[data-spruch="' + n + '"]').count())) await tippe(page, '.programm .spruch-reihe[data-spruch="' + n + '"]');
    await gibTeile(page, teile);
    await tippe(page, '.tasten [data-aktion="fertig"][data-was="spruch"]');
  }
  // Ein Level mit eigenem Spruch beginnt in der Spruch-Reihe: braucht die Lösung ihn nicht, gleich „fertig“
  if (await page.locator('.programm .spruch-reihe.schreiben').count()) await tippe(page, '.tasten [data-aktion="fertig"][data-was="spruch"]');
  await gibTeile(page, prog);
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
const H = { tippe, tippeGrau, ansicht, oeffnePaket, oeffneLevel, doppeltipp, schnell, suche, K, WURZEL, kachelSeite, gibProgrammEin, loesePfad, weltenVon };

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
    const l = loesePfad(lv);
    await gibProgrammEin(page, l.programm, l.sprueche);
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

const pfadPaket = DATEN.pakete.find((p) => p.levels.some((l) => einfach(l) && !l.zauber)) || DATEN.pakete.find((p) => p.levels.some(einfach));
test('Drache läuft Schritt für Schritt, Kobold-Stoß', async ({ page }, info) => {
  test.skip(!pfadPaket, 'kein Pfad-Paket');
  const i = pfadPaket.levels.findIndex(einfach);
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
      if (f || !einfach(l) || l.zauber || l.aufgabe !== 'kuerzestes') return;
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
  const g = suche('pfad', (l) => einfach(l) && l.edelsteine && l.edelsteine.length);
  if (g) {
    // ein kürzestes Programm zum Schatz, das nicht alle Edelsteine einsammelt (passt in die Kartengrenze)
    const ohne = { ...g.lv, edelsteine: [] };
    const grenzeG = g.lv.maxKarten || g.lv.maxBefehle || 12;
    const nichtAlle = (p) => !K.ausfuehren(weltVon(g.lv), p).geschafft;
    const kurz = kuerzeste(weltVon(ohne));
    const prog = (kurz.programme || []).find((p) => p.length <= grenzeG && nichtAlle(p)) ||
      finde(ohne, (e, p) => e.geschafft && nichtAlle(p), Math.min(grenzeG, 7));
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
  const n = suche('pfad', (l) => einfach(l) && !K.ausfuehren(weltVon(l), ['links']).stoss && !K.ausfuehren(weltVon(l), ['links']).geschafft);
  await oeffneLevel(page, n, info);
  await gibProgrammEin(page, ['links']);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.meldung')).toContainText('noch nicht beim', { timeout: 15_000 });
  await ansicht(page, 'noch-nicht-da', info);
});

test('Grenze der Programm-Reihe: freundliche Meldung statt stummer Tasten', async ({ page }, info) => {
  const f = suche('pfad', (l) => einfach(l) && !l.zauber && l.maxBefehle);
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
  const z = suche('pfad', (l) => einfach(l) && l.zauber);
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
  const f = suche('pfad', (l) => einfach(l) && !l.zauber && kuerzeste(weltVon(l)).laenge >= 4);
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
// Erweiterte Befehle ab Block C (plan/lehrplan.md 7.8): Wenn-dann-Kasten, „bis zum Schatz“, Zaubersprüche,
// mehrere Gitter. Mit den echten Rätseln gibt es solche Levels erst ab Einheit 11 (sonst werden die Tests
// übersprungen). Zum Testen vorher die Test-Daten bauen:
//   node werkzeuge/web-bauen.mjs --raetsel tests/fixtures/web-raetsel
// ---------------------------------------------------------------------
const darf = (l, x) => erweitert(l) && (l.erlaubt || []).includes(x);
const bedingungenVon = (l) => l.bedingungen || ['stein', 'frei'];
async function langsam(page, ms) { await page.addInitScript((t) => { window.WERKSTATT_TEMPO = t; }, ms); }
// Auf einen kurzen Zustand während des Laufs warten (jedes Bild prüfen, nichts verpassen)
const sobald = (page, fn, arg) => page.waitForFunction(fn, arg, { polling: 'raf', timeout: 30_000 });
// Wie die App: erst im ersten Gitter, dann im nächsten; das erste, in dem es nicht klappt, zählt
function lauf(lv, prog, sprueche) {
  const sp = { ...(lv.sprueche || {}), ...(sprueche || {}) };
  const welten = weltenVon(lv);
  for (let wi = 0; wi < welten.length; wi++) {
    const e = K.ausfuehren(welten[wi], prog, { sprueche: sp });
    if (!e.geschafft || wi === welten.length - 1) return { ...e, welt: wi };
  }
  return null;
}

test('Wenn-dann-Kasten: Wenn-Karte wählen, dann, sonst, fertig; beim Laufen leuchten Zweig und angeschautes Feld', async ({ page }, info) => {
  const f = suche('pfad', (l) => darf(l, 'wenn') && bedingungenVon(l).length >= 2 && (l.maxKarten || 12) >= 4);
  test.skip(!f, 'kein Level mit Wenn-dann-Kasten (Test-Daten: --raetsel tests/fixtures/web-raetsel)');
  await langsam(page, 700);
  await oeffneLevel(page, f, info);
  const n = weltenVon(f.lv).length;
  await expect(page.locator('.feld .gitter-box')).toHaveCount(n);
  if (n > 1) await expect(page.locator('.meldung')).toContainText('Ein Programm für ' + (n === 2 ? 'beide' : 'alle ' + n) + ' Gitter');
  // Antippen → Wenn-Karte wählen (nur die Bedingungen des Levels)
  await tippe(page, '.tasten [data-aktion="wenn"]');
  await expect(page.locator('.tasten [data-aktion="bedingung"]')).toHaveCount(bedingungenVon(f.lv).length);
  await expect(page.locator('.tasten-frage')).toContainText('Wenn-Karte');
  await ansicht(page, 'wenn-wahl', info);
  const c = bedingungenVon(f.lv)[0];
  await tippe(page, '.tasten [data-aktion="bedingung"][data-bedingung="' + c + '"]');
  await expect(page.locator('.programm .kasten-w.offen')).toHaveCount(1);
  await expect(page.locator('.programm .kasten-w .karte.bed')).toHaveCount(1);
  await expect(page.locator('.meldung')).toContainText('Was macht der Drache dann?');
  // „sonst“ erst nach einem Befehl nach „dann“
  await expect(page.locator('.tasten [data-aktion="sonst"]')).toHaveAttribute('aria-disabled', 'true');
  await tippe(page, '.tasten [data-befehl="rechts"]');
  await expect(page.locator('.tasten [data-aktion="sonst"]')).not.toHaveAttribute('aria-disabled', 'true');
  await tippe(page, '.tasten [data-aktion="sonst"]');
  await tippe(page, '.tasten [data-befehl="vor"]');
  await expect(page.locator('.programm .kasten-w [data-ort="p0-dann"] .karte:not(.platzhalter)')).toHaveCount(1);
  await expect(page.locator('.programm .kasten-w [data-ort="p0-sonst"] .karte:not(.platzhalter)')).toHaveCount(1);
  await ansicht(page, 'wenn-sonst', info);
  // Löschen geht Schritt für Schritt zurück: sonst-Befehl, „sonst“, dann-Befehl, der ganze Kasten
  for (let j = 0; j < 3; j++) await tippe(page, '.tasten [data-aktion="loeschen"]');
  await expect(page.locator('.programm .kasten-w.offen')).toHaveCount(1);
  await expect(page.locator('.programm .kasten-w .karte:not(.platzhalter):not(.bed)')).toHaveCount(0);
  await tippe(page, '.tasten [data-aktion="loeschen"]');
  await expect(page.locator('.programm .kasten-w')).toHaveCount(0);
  // Die Lösung des Lösers eingeben und laufen lassen
  const l = loesePfad(f.lv);
  await gibProgrammEin(page, l.programm, l.sprueche);
  await expect(page.locator('.programm .kasten-w.offen')).toHaveCount(0);
  await ansicht(page, 'wenn-programm', info);
  const e = lauf(f.lv, l.programm, l.sprueche);
  expect(e.geschafft, 'Lösung kommt an').toBe(true);
  await tippe(page, '.tasten [data-aktion="los"]');
  // Der Drache schaut: Wenn-Karte leuchtet, das angeschaute Feld ist umrandet (oder die Kante am Rand)
  await sobald(page, () => document.querySelector('.programm .kasten-w.aktiv .karte.bed.aktiv') && document.querySelector('.drache-ebene .blick-feld > *'));
  await ansicht(page, 'wenn-schaut', info);
  // Ein Befehl im Zweig: der Zweig „dann“ oder „sonst“ leuchtet mit
  const welten = weltenVon(f.lv);
  const sp = { ...(f.lv.sprueche || {}), ...l.sprueche };
  if (welten.some((w) => K.ausfuehren(w, l.programm, { sprueche: sp }).schritte.some((s) => s.zweig))) {
    await sobald(page, () => document.querySelector('.programm .kasten-w.aktiv .zweig.aktiv .karte.aktiv'));
    await ansicht(page, 'wenn-zweig', info);
  }
  if (n > 1) await sobald(page, () => document.querySelectorAll('.feld .gitter-box.ruht').length > 0);
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 60_000 });
  await expect(page.locator('.feld .gitter-box.ruht')).toHaveCount(0);
});

test('Wenn-dann-Kasten: Kobold im Zweig, mehrere Gitter: das Gitter, in dem es nicht klappt', async ({ page }, info) => {
  const f = suche('pfad', (l) => darf(l, 'wenn') && bedingungenVon(l).includes('stein') && bedingungenVon(l).includes('frei') && (l.maxKarten || 12) >= 6);
  test.skip(!f, 'kein passendes Level mit Wenn-dann-Kasten');
  await schnell(page);
  await oeffneLevel(page, f, info);
  // Ein Programm, das in einem Zweig anstößt (der Kobold sitzt im Wenn-dann-Kasten)
  const kandidaten = ['wenn[frei: vor vor vor] wenn[stein: vor]', 'vor wenn[stein: vor]', 'wenn[frei: vor vor] wenn[stein: vor]', 'wenn[stein: vor sonst vor vor]',
    'wenn[frei: vor] wenn[frei: vor] wenn[stein: vor]', 'rechts wenn[frei: vor vor vor]', 'links wenn[frei: vor vor vor]', 'links wenn[stein: vor]', 'rechts wenn[stein: vor]'];
  const max = f.lv.maxKarten || 12;
  const k = kandidaten.map((t) => K.lies(t)).find((p) => {
    if (K.karten(p) > max) return false;
    const e = lauf(f.lv, p);
    return e.stoss && e.stoss.zweig;
  });
  if (k) {
    const e = lauf(f.lv, k);
    await gibProgrammEin(page, k);
    await tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.meldung.stoss')).toContainText('Hier hat der Kobold zugeschlagen!', { timeout: 20_000 });
    await expect(page.locator('.programm .kasten-w .zweig .karte.stoss')).toHaveCount(1);
    await expect(page.locator('.programm .kasten-w .zweig[data-ort$="-' + e.stoss.zweig + '"] .karte.stoss')).toHaveCount(1);
    if (weltenVon(f.lv).length > 1) {
      await expect(page.locator('.feld .gitter-box.ruht')).toHaveCount(weltenVon(f.lv).length - 1);
      await expect(page.locator('.feld .gitter-box[data-welt="' + e.welt + '"]')).not.toHaveClass(/ruht/);
    }
    await ansicht(page, 'wenn-kobold', info);
    await tippe(page, '.tasten [data-aktion="nochmal"]');
    await expect(page.locator('.programm .karte.stoss')).toHaveCount(0);
    await expect(page.locator('.feld .gitter-box.ruht')).toHaveCount(0);
    while (await page.locator('.tasten [data-aktion="loeschen"]:not([disabled])').count()) await tippe(page, '.tasten [data-aktion="loeschen"]');
    await expect(page.locator('.programm .prog-zeile .karte:not(.platzhalter)')).toHaveCount(0);
  }
  // Nur gedreht: in welchem Gitter der Drache noch nicht beim Schatz ist
  if (weltenVon(f.lv).length > 1 && !lauf(f.lv, ['links']).stoss) {
    const e = lauf(f.lv, ['links']);
    await gibProgrammEin(page, ['links']);
    await tippe(page, '.tasten [data-aktion="los"]');
    await expect(page.locator('.meldung')).toContainText('Im Gitter ' + (e.welt + 1) + ' ist der Drache noch nicht beim', { timeout: 20_000 });
    await ansicht(page, 'welten-nicht-da', info);
  }
});

test('Wiederhol-Zauber „bis zum Schatz“: Kasten, Runden, und „läuft im Kreis“ nach 60 Befehlen', async ({ page }, info) => {
  const f = suche('pfad', (l) => darf(l, 'bis') && !darf(l, 'zauber') && (l.maxKarten || 12) >= 2);
  test.skip(!f, 'kein Level mit „bis zum Schatz“');
  await schnell(page);
  await oeffneLevel(page, f, info);
  // Nur „bis zum Schatz“ erlaubt: die Taste legt den Kasten gleich hin (kein „Wie oft?“)
  await tippe(page, '.tasten [data-aktion="zauber"]');
  await expect(page.locator('.tasten [data-aktion="zahl"]')).toHaveCount(0);
  await expect(page.locator('.programm .kasten-z.kasten-bis.offen .mal')).toContainText('bis zum');
  await tippe(page, '.tasten [data-befehl="rechts"]');
  await ansicht(page, 'bis-offen', info);
  await tippe(page, '.tasten [data-aktion="fertig"]');
  // Immer nur drehen: findet den Schatz nie. Nach 60 Befehlen hört der Drache auf.
  const e = lauf(f.lv, [{ bis: 'schatz', befehle: ['rechts'] }]);
  expect(e.zuLang).toBe(true);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.meldung')).toContainText('Der Drache läuft im Kreis. Er findet', { timeout: 30_000 });
  await expect(page.locator('.meldung')).toContainText('so nicht.');
  await expect(page.locator('.dialog')).toHaveCount(0);
  await ansicht(page, 'im-kreis', info);
  // Die Lösung: in der Runde leuchtet „Runde n“
  await tippe(page, '.tasten [data-aktion="loeschen"]');
  await expect(page.locator('.programm .kasten-z')).toHaveCount(0);
  const l = loesePfad(f.lv);
  await gibProgrammEin(page, l.programm, l.sprueche);
  await tippe(page, '.tasten [data-aktion="los"]');
  if (JSON.stringify(l.programm).includes('"bis"')) await sobald(page, () => /Runde \d/.test((document.querySelector('.programm .kasten-bis.aktiv .runde') || {}).textContent || ''));
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 30_000 });
  // Mit Zauber-Kasten und „bis zum Schatz“: „Wie oft?“ hat 2 bis 5 und „bis zum Schatz“
  const g = suche('pfad', (l2) => darf(l2, 'bis') && darf(l2, 'zauber'));
  if (g) {
    await oeffneLevel(page, g, info);
    await tippe(page, '.tasten [data-aktion="zauber"]');
    await expect(page.locator('.tasten [data-aktion="zahl"]')).toHaveCount(4);
    await expect(page.locator('.tasten [data-aktion="bis"]')).toHaveCount(1);
    await ansicht(page, 'bis-wahl', info);
    await tippe(page, '.tasten [data-aktion="bis"]');
    await expect(page.locator('.programm .kasten-z.kasten-bis.offen')).toHaveCount(1);
  }
});

test('Zauberspruch vorgegeben: Spruch-Reihe zum Anschauen, Aufruf-Taste, beim Laufen leuchten Aufruf und Spruch', async ({ page }, info) => {
  const f = suche('pfad', (l) => darf(l, 'spruch') && l.sprueche && Object.keys(l.sprueche).length && !(l.spruchFrei || []).length);
  test.skip(!f, 'kein Level mit vorgegebenem Zauberspruch');
  await langsam(page, 500);
  await oeffneLevel(page, f, info);
  const namen = Object.keys(f.lv.sprueche);
  await expect(page.locator('.programm .spruch-reihe:not(.frei)')).toHaveCount(namen.length);
  await expect(page.locator('.programm button.spruch-reihe')).toHaveCount(0);   // vorgegeben: nicht zum Schreiben
  for (const [j, n] of namen.entries()) {
    await expect(page.locator('.programm .spruch-reihe[data-ort="' + n + '"] .spruch-inhalt > .teil')).toHaveCount(K.liesSpruch(f.lv.sprueche[n], n).length);
    await expect(page.locator('.tasten [data-aktion="ruf"]').nth(j)).toHaveAttribute('data-spruch', n);
  }
  await ansicht(page, 'spruch-vorgegeben', info);
  const l = loesePfad(f.lv);
  await gibProgrammEin(page, l.programm, l.sprueche);
  await expect(page.locator('.programm .prog-zeile .karte.ruf')).toHaveCount((JSON.stringify(l.programm).match(/"spruch"/g) || []).length);
  await tippe(page, '.tasten [data-aktion="los"]');
  await sobald(page, () => document.querySelector('.programm .prog-zeile .karte.ruf.aktiv') && document.querySelector('.programm .spruch-reihe.aktiv .karte.aktiv'));
  await ansicht(page, 'spruch-laeuft', info);
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 30_000 });
});

test('Zauberspruch selbst schreiben: zuerst die Spruch-Reihe, dann aufrufen; seine Karten zählen mit', async ({ page }, info) => {
  const f = suche('pfad', (l) => darf(l, 'spruch') && (l.spruchFrei || []).length === 1 && l.maxKarten && Object.keys(loesePfad(l).sprueche).length);
  test.skip(!f, 'kein Level mit selbst geschriebenem Zauberspruch');
  await schnell(page);
  await oeffneLevel(page, f, info);
  const n = f.lv.spruchFrei[0];
  const reihe = '.programm .spruch-reihe.frei[data-spruch="' + n + '"]';
  await expect(page.locator(reihe + '.schreiben')).toHaveCount(1);
  await expect(page.locator('.meldung')).toContainText('Schreib zuerst deinen ' + K.SPRUCH_WORT[n]);
  await expect(page.locator('.tasten [data-aktion="ruf"]')).toHaveCount(0);   // kein Spruch im Spruch
  await ansicht(page, 'spruch-frei-start', info);
  // Leerer Spruch, trotzdem aufgerufen: freundliche Meldung statt Laufen
  await tippe(page, '.tasten [data-aktion="fertig"][data-was="spruch"]');
  await tippe(page, '.tasten [data-aktion="ruf"][data-spruch="' + n + '"]');
  await expect(page.locator('.meldung')).toContainText('ist noch leer');
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.meldung')).toContainText('Dein ' + K.SPRUCH_WORT[n] + ' ist noch leer');
  await expect(page.locator('.programm .karte.aktiv')).toHaveCount(0);
  await tippe(page, '.tasten [data-aktion="loeschen"]');
  await expect(page.locator('.programm .prog-zeile .karte.ruf')).toHaveCount(0);
  // Spruch antippen, schreiben, fertig, aufrufen
  const l = loesePfad(f.lv);
  await gibProgrammEin(page, l.programm, l.sprueche);
  await expect(page.locator(reihe + ' .spruch-inhalt > .teil')).toHaveCount(l.sprueche[n].length);
  await expect(page.locator('.programm .zaehler')).toContainText(K.karten(l.programm, l.sprueche) + ' von ' + f.lv.maxKarten + ' Karten');
  await ansicht(page, 'spruch-frei-programm', info);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.dialog h2')).toHaveText('Geschafft!', { timeout: 30_000 });
  // Nochmal: den Spruch wieder antippen, dann kommen die Karten dort hinein
  await tippe(page, '.dialog [data-aktion="nochmal"]');
  await tippe(page, reihe);
  await expect(page.locator(reihe + '.schreiben')).toHaveCount(1);
  await expect(page.locator('.meldung')).toContainText('Du schreibst den ' + K.SPRUCH_WORT[n]);
});

test('Doppeltipp bei den neuen Tastenwechseln löst nie die Taste aus, die danach dort liegt', async ({ page }, info) => {
  let geprueft = 0;
  const w = suche('pfad', (l) => darf(l, 'wenn') && bedingungenVon(l).length >= 2 && (l.maxKarten || 12) >= 4);
  if (w) {
    await oeffneLevel(page, w, info);
    await doppeltipp(page, '.tasten [data-aktion="wenn"]');
    await expect(page.locator('.tasten [data-aktion="bedingung"]')).toHaveCount(bedingungenVon(w.lv).length);
    await expect(page.locator('.programm .kasten-w')).toHaveCount(0);
    // Wenn-Karte: danach liegt dort „vor“ – der zweite Tipp legt keinen Befehl nach „dann“
    await doppeltipp(page, '.tasten [data-aktion="bedingung"] >> nth=0');
    await expect(page.locator('.programm .kasten-w.offen')).toHaveCount(1);
    await expect(page.locator('.programm .kasten-w .zweig .karte:not(.platzhalter)')).toHaveCount(0);
    await tippe(page, '.tasten [data-befehl="vor"]');
    // „fertig“: danach liegt dort eine andere Taste (z. B. Löschen) – der Kasten bleibt
    await doppeltipp(page, '.tasten [data-aktion="fertig"]');
    await expect(page.locator('.programm .kasten-w')).toHaveCount(1);
    await expect(page.locator('.programm .kasten-w.offen')).toHaveCount(0);
    await ansicht(page, 'doppeltipp-wenn', info);
    geprueft++;
  }
  const s = suche('pfad', (l) => darf(l, 'spruch') && (l.spruchFrei || []).length);
  if (s) {
    await oeffneLevel(page, s, info);
    // Spruch „fertig“: danach liegt dort die Aufruf-Taste – kein Aufruf im Programm
    await doppeltipp(page, '.tasten [data-aktion="fertig"][data-was="spruch"]');
    await expect(page.locator('.programm .spruch-reihe.schreiben')).toHaveCount(0);
    await expect(page.locator('.programm .prog-zeile .karte.ruf')).toHaveCount(0);
    geprueft++;
  }
  const b = suche('pfad', (l) => darf(l, 'bis') && darf(l, 'zauber'));
  if (b) {
    await oeffneLevel(page, b, info);
    await tippe(page, '.tasten [data-aktion="zauber"]');
    // „bis zum Schatz“: danach liegt dort eine Kasten-Taste – keine neue Wahl, nichts im Kasten
    await doppeltipp(page, '.tasten [data-aktion="bis"]');
    await expect(page.locator('.programm .kasten-z.kasten-bis.offen')).toHaveCount(1);
    await expect(page.locator('.tasten [data-aktion="bedingung"], .tasten [data-aktion="zahl"]')).toHaveCount(0);
    await expect(page.locator('.programm .kasten-bis .karte:not(.platzhalter)')).toHaveCount(0);
    geprueft++;
  }
  test.skip(!geprueft, 'keine Levels mit erweiterten Befehlen');
});

test('Grenzen: Kartenzahl, höchstens 3 Befehle nach „dann“, höchstens 4 Teile im Zauberspruch', async ({ page }, info) => {
  let geprueft = 0;
  // nach „dann“ höchstens 3 Befehle
  const d = suche('pfad', (l) => darf(l, 'wenn') && (l.maxKarten || 12) >= 6);
  if (d) {
    await oeffneLevel(page, d, info);
    await tippe(page, '.tasten [data-aktion="wenn"]');
    if (await page.locator('.tasten [data-aktion="bedingung"]').count()) await tippe(page, '.tasten [data-aktion="bedingung"] >> nth=0');
    for (let j = 0; j < K.MAX_DANN; j++) await tippe(page, '.tasten [data-befehl="vor"]');
    await expect(page.locator('.tasten [data-befehl="vor"]')).toHaveAttribute('aria-disabled', 'true');
    await tippeGrau(page, '.tasten [data-befehl="vor"]');
    await expect(page.locator('.programm .kasten-w .karte:not(.platzhalter):not(.bed)')).toHaveCount(K.MAX_DANN);
    await expect(page.locator('.meldung')).toContainText('Nach „dann“ passen höchstens ' + K.MAX_DANN + ' Befehle');
    await ansicht(page, 'wenn-voll', info);
    geprueft++;
  }
  // Kartengrenze: volle Reihe, dann sind Befehle und Kästen grau und sagen freundlich, warum
  const k = suche('pfad', (l) => darf(l, 'wenn') && l.maxKarten && !(l.spruchFrei || []).length);
  if (k) {
    await oeffneLevel(page, k, info);
    for (let j = 0; j < k.lv.maxKarten; j++) await tippe(page, '.tasten [data-befehl="' + (j % 2 ? 'links' : 'rechts') + '"]');
    await expect(page.locator('.programm .zaehler')).toContainText(k.lv.maxKarten + ' von ' + k.lv.maxKarten + ' Karten');
    await expect(page.locator('.programm .karte.platzhalter')).toHaveCount(0);
    await tippeGrau(page, '.tasten [data-befehl="vor"]');
    await expect(page.locator('.meldung')).toContainText('Mehr Karten gehen nicht');
    await tippeGrau(page, '.tasten [data-aktion="wenn"]');
    await expect(page.locator('.meldung')).toContainText('kein Platz mehr');
    await expect(page.locator('.programm .zaehler')).toContainText(k.lv.maxKarten + ' von ' + k.lv.maxKarten + ' Karten');
    await ansicht(page, 'karten-voll', info);
    geprueft++;
  }
  // Zauberspruch: höchstens 4 Teile
  const s = suche('pfad', (l) => darf(l, 'spruch') && (l.spruchFrei || []).length && (l.maxKarten || 12) >= K.MAX_SPRUCH + 2);
  if (s) {
    await oeffneLevel(page, s, info);
    for (let j = 0; j < K.MAX_SPRUCH; j++) await tippe(page, '.tasten [data-befehl="' + (j % 2 ? 'links' : 'rechts') + '"]');
    await tippeGrau(page, '.tasten [data-befehl="vor"]');
    await expect(page.locator('.programm .spruch-reihe.schreiben .spruch-inhalt > .teil > .karte:not(.platzhalter)')).toHaveCount(K.MAX_SPRUCH);
    await expect(page.locator('.meldung')).toContainText('ist voll. Tippe auf „fertig“.');
    await ansicht(page, 'spruch-voll', info);
    geprueft++;
  }
  test.skip(!geprueft, 'keine Levels mit erweiterten Befehlen');
});

test('Finde das kürzeste mit Kästen: der Stern erst mit der kleinsten Kartenzahl', async ({ page }, info) => {
  const f = suche('pfad', (l) => erweitert(l) && l.aufgabe === 'kuerzestes' && l.minKarten && (l.maxKarten || 12) >= l.minKarten + 2);
  test.skip(!f, 'kein „kürzestes“-Level mit Kästen');
  await schnell(page);
  await oeffneLevel(page, f, info);
  await expect(page.locator('.meldung')).toContainText(weltenVon(f.lv).length > 1 ? 'Ein Programm für' : 'kürzeste');
  // die kleinste Lösung und am Ende eine Drehung hin und zurück: kommt an, braucht 2 Karten mehr
  const l = loesePfad(f.lv);
  const prog = l.programm.concat(['links', 'rechts']);
  expect(lauf(f.lv, prog, l.sprueche).geschafft).toBe(true);
  await gibProgrammEin(page, prog, l.sprueche);
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.dialog h2')).toHaveText('Fast geschafft!', { timeout: 30_000 });
  await expect(page.locator('.dialog p')).toContainText('mit ' + f.lv.minKarten + ' Karten');
  await ansicht(page, 'kuerzeste-karten', info);
  await tippe(page, '.dialog [data-aktion="nochmal"]');
  await expect(page.locator('.punkte .punkt.voll')).toHaveCount(0);
});

test('Langes Programm mit Spruch-Reihe bleibt ganz sichtbar (auch auf dem kleinsten Handy quer)', async ({ page }, info) => {
  const f = suche('pfad', (l) => darf(l, 'spruch') && (l.spruchFrei || []).length && ['zauber', 'wenn', 'bis'].every((x) => darf(l, x)) &&
    ['stein', 'frei'].every((c) => bedingungenVon(l).includes(c)) && (l.maxKarten || 12) >= 12);
  test.skip(!f, 'kein Level mit Zauberspruch und allen Kästen');
  await oeffneLevel(page, f, info);
  const n = f.lv.spruchFrei[0];
  // Spruch: Wenn-dann-Kasten und Zauber-Kasten (7 Karten), Programm: Aufruf und „bis zum Schatz“ mit Wenn-dann und Aufruf (5 Karten)
  const spruch = K.lies('wenn[stein: rechts sonst vor] 2[vor links]');
  const prog = [{ spruch: n }, { bis: 'schatz', befehle: [{ wenn: 'frei', dann: ['vor'], sonst: [] }, { spruch: n }] }];
  await gibProgrammEin(page, prog, { [n]: spruch });
  await expect(page.locator('.programm .zaehler')).toContainText('12 von ' + (f.lv.maxKarten || 12) + ' Karten');
  const r = await page.evaluate(() => {
    const box = document.querySelector('.programm').getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const raus = [];
    for (const el of document.querySelectorAll('.programm .karte, .programm .kasten-w, .programm .kasten-z, .programm .spruch-reihe, .programm .zaehler, .programm .teil-nr')) {
      const q = el.getBoundingClientRect();
      if (q.top < box.top - 0.5 || q.bottom > box.bottom + 0.5 || q.left < box.left - 0.5 || q.right > box.right + 0.5 || q.top < 0 || q.bottom > vh || q.left < 0 || q.right > vw) raus.push(el.className + ' ' + (el.dataset.ort || ''));
    }
    return { raus, rollen: document.querySelector('.programm').classList.contains('rollen'), k: getComputedStyle(document.querySelector('.programm')).getPropertyValue('--k') };
  });
  expect(r.raus, 'Teile des Programms außerhalb des Bildes').toEqual([]);
  expect(r.rollen, 'Programm-Bereich muss nicht blättern').toBe(false);
  await ansicht(page, 'langes-programm', info);
  // Auch beim Laufen bleibt alles an seinem Platz
  await tippe(page, '.tasten [data-aktion="los"]');
  await expect(page.locator('.programm .karte.aktiv').first()).toBeVisible({ timeout: 10_000 });
  await ansicht(page, 'langes-programm-laeuft', info);
});

// ---------------------------------------------------------------------
// Weitere Tests der Spiel-Plugins (tests/spiele/<art>.mjs)
// ---------------------------------------------------------------------
for (const [art, pl] of Object.entries(SPIEL_TESTS)) {
  if (!DATEN.pakete.some((p) => p.levels.some((l) => l.art === art))) continue;
  if (pl.tests) test.describe('Spiel ' + art, () => pl.tests({ test, expect, DATEN, h: H }));
}
