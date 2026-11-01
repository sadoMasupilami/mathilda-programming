/* =====================================================================
   Spiel-Plugin „suche“ (Einheit 10 „Sortieren und Suchen“)
   Drei Aufgaben, alles nur Antippen (kein Ziehen):
   - tauschen: Türme oder Zahlenkarten stehen durcheinander auf einer Linie, vorne der kleine Punkt,
       hinten der große Punkt (wie eine lange Vergleichs-Stelle). Eine Karte antippen (sie leuchtet
       golden und hebt sich), dann einen Nachbarn: Die beiden tauschen den Platz. Dieselbe Karte
       nochmal antippen heißt: doch nicht. Sortiert (Kleinstes beim kleinen Punkt): Stern. Mit den
       wenigsten Tauschen (so viele, wie Paare verkehrt stehen: WerkstattSuche.fehlstellen) heißt es
       „Weniger geht nicht!“, sonst kommt eine Profi-Frage.
   - netz: Das Sortier-Netz wie am Blatt. Die Vergleichs-Stelle, an der sich gerade zwei Zahlen
       treffen, ist golden hinterlegt, ihre zwei Zahlen sind golden umrandet und stehen darunter noch
       einmal groß über dem kleinen und dem großen Punkt. „tauschen“ oder „bleiben“: Steht danach die
       kleinere Zahl am kleinen Punkt, laufen beide in die Kästchen darunter weiter. Sonst bleibt alles
       stehen und ein freundlicher Hinweis sagt, worauf man schauen soll. Am Ziel sortiert: Stern.
   - raten: Der Drache denkt sich eine Zahl von 1 bis N (Zufall, bei jedem Nochmal neu). Eine Zahl
       antippen heißt „Ist deine Zahl größer als …?“: Die Zahlen bis dahin werden blau (der Nein-Teil),
       die darüber golden (der Ja-Teil). „Fragen“: Der Drache sagt Ja oder Nein, was nicht mehr geht,
       wird durchgestrichen. Bis 100 sind es zu viele Zahlen für 48-px-Tasten: Dann zeigt das Feld eine
       Hunderter-Tafel, die Zahl wird mit Ziffern-Tasten eingetippt. Eine Frage, deren Antwort man schon
       weiß (durchgestrichen oder die größte, die noch geht), zählt nicht, die App sagt freundlich warum.
       Bleibt nur eine Zahl übrig, ist sie gefunden (das ist keine Frage mehr). Stern mit höchstens
       hoechstens(N) Fragen, so viele wie mit Halbieren, sonst „Fast geschafft!“.
   Bewertet wird nur nach dem Ergebnis, mit web/kern/suche.js wie im Löser (istSortiert, tausche,
   fehlstellen, antwort, nachFrage, bewerte, hoechstens). In den Level-Daten stehen keine Lösungen,
   die geheime Zahl würfelt die App erst beim Spielen.
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken, keine verlorenen Leben.
   Layout: hoch Feld oben, Anzeige und Tasten unten. Quer Feld links über die ganze Höhe, rechts
   Anzeige, Meldung und Tasten. Die Größe der Karten und Zahlen rechnet das Plugin aus dem Platz im
   Feld aus (ResizeObserver), so passt alles ohne Scrollen auf 375 · 667 und 667 · 375.
   ===================================================================== */
(function () {
  'use strict';
  const K = window.WerkstattSuche;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  if (!K) return;

  const FB = K.FARBE;
  const T = FB.tinte;
  const TUERKIS = FB.tuerkis;
  const GOLD = FB.gold;
  const SCHRIFT = 'Andika, sans-serif';
  const MAX_TASTEN = 32;     // bis so viele Zahlen sind die Zahlen selbst Tasten, darüber Ziffern-Tasten
  const r1 = (x) => Math.round(x * 10) / 10;
  // Ein SVG aus dem Kern füllt seinen Kasten (Breite und Höhe 100 %), für Vorleser stumm
  const voll = (svg) => svg.replace(/^<svg\b[^>]*>/, (kopf) => kopf.replace(/\s(width|height|role|aria-label|aria-hidden)="[^"]*"/g, '').replace('<svg', '<svg width="100%" height="100%" aria-hidden="true"'));
  const gross = () => Math.min(window.innerWidth, window.innerHeight) >= 700;
  const ruhig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anzahl = (n, eins, mehr) => n + ' ' + (n === 1 ? eins : mehr);

  // ---------------------------------------------------------------------
  // Bilder
  // ---------------------------------------------------------------------
  // Tauschen: zwei Bahnen kreuzen sich, die Zahlen wechseln die Bahn
  const TAUSCH_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 7 L35 38 M35 7 L13 38" fill="none" stroke="' + TUERKIS + '" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M27.5 37 L35.5 39.5 L36 31 M20.5 37 L12.5 39.5 L12 31" fill="none" stroke="' + TUERKIS + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // Bleiben: beide laufen gerade weiter
  const BLEIB_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 7 V39 M34 7 V39" fill="none" stroke="' + T + '" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M8 32 L14 39.5 L20 32 M28 32 L34 39.5 L40 32" fill="none" stroke="' + T + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // Kleiner und großer Punkt auf einer Linie (Meldung beim Sortier-Netz)
  const PUNKTE_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><line x1="10" y1="24" x2="36" y2="24" stroke="' + TUERKIS + '" stroke-width="3.5" stroke-linecap="round"/>' +
    '<circle cx="10" cy="24" r="4.5" fill="' + TUERKIS + '"/><circle cx="36" cy="24" r="9" fill="' + TUERKIS + '"/></svg>';
  // Halbieren: links der Nein-Teil (blau), rechts der Ja-Teil (golden)
  const HALB_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    [0, 1, 2, 3].map((i) => '<rect x="' + (2 + i * 11) + '" y="13" width="11" height="22" rx="2" fill="' + (i < 2 ? '#e9eefc' : FB.goldHell) + '" stroke="' + (i < 2 ? '#3d5ccc' : '#c79500') + '" stroke-width="2.2"/>').join('') +
    '<path d="M24 6 V42" stroke="' + T + '" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 3"/></svg>';

  // Paket-Bild: drei Türme der Größe nach auf der Linie vom kleinen zum großen Punkt
  function paketBild() {
    const farben = ['#f39c12', '#f5c518', '#3aa856'];
    let s = '';
    [2, 3, 4].forEach((h, i) => {
      const x = 12 + i * 27;
      for (let k = 0; k < h; k++) s += '<rect x="' + x + '" y="' + (70 - (k + 1) * 14) + '" width="22" height="12.5" rx="2" fill="' + farben[i] + '" stroke="' + T + '" stroke-width="2"/>';
    });
    return '<svg class="suche-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' + s +
      '<line x1="12" y1="80" x2="86" y2="80" stroke="' + TUERKIS + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="12" cy="80" r="5" fill="' + TUERKIS + '"/><circle cx="86" cy="80" r="10" fill="' + TUERKIS + '"/></svg>';
  }

  // Zwei Zahlen über einer Vergleichs-Stelle (groß, unter dem Netz): links der kleine Punkt, rechts der große
  function vergleichSVG(x, y) {
    const kachel = (cx, v) => '<rect x="' + (cx - 21) + '" y="2" width="42" height="40" rx="7" fill="#fff" stroke="' + GOLD + '" stroke-width="3"/>' +
      '<text x="' + cx + '" y="23" font-size="25" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + T + '" font-family="' + SCHRIFT + '">' + v + '</text>' +
      '<line x1="' + cx + '" y1="43" x2="' + cx + '" y2="56" stroke="' + FB.grau + '" stroke-width="2"/>';
    return '<svg class="suche-vergleich-bild" style="--vr:' + r1(132 / 70) + '" viewBox="0 0 132 70" aria-hidden="true">' + kachel(28, x) + kachel(104, y) +
      '<line x1="28" y1="60" x2="104" y2="60" stroke="' + TUERKIS + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="28" cy="60" r="5" fill="' + TUERKIS + '"/><circle cx="104" cy="60" r="9.5" fill="' + TUERKIS + '"/></svg>';
  }
  // Die Zahlen am Ziel (nach dem letzten Vergleich)
  function zielSVG(werte) {
    const n = werte.length, w = 46 * n;
    let s = '';
    werte.forEach((v, i) => {
      const cx = 23 + i * 46;
      s += '<rect x="' + (cx - 20) + '" y="2" width="40" height="40" rx="7" fill="' + FB.goldHell + '" stroke="' + GOLD + '" stroke-width="3"/>' +
        '<text x="' + cx + '" y="23" font-size="24" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="' + T + '" font-family="' + SCHRIFT + '">' + v + '</text>';
    });
    return '<svg class="suche-vergleich-bild suche-ziel-bild" style="--vr:' + r1(w / 44) + '" viewBox="0 0 ' + w + ' 44" aria-hidden="true">' + s + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  function neu(api) {
    const lv = api.lv;
    const z = api.zustand;
    for (const k of Object.keys(z)) if (!['beob', 'groesse', 'masse'].includes(k)) delete z[k];
    z.aufgabe = lv.aufgabe;
    z.fertig = false;
    if (z.aufgabe === 'tauschen') {
      z.aussehen = lv.aussehen === 'turm' ? 'turm' : 'zahl';
      z.reihe = lv.zahlen.slice();
      z.gewaehlt = null;      // Platz der goldenen Karte
      z.tausche = 0;
      z.flip = null;          // die zwei Plätze des letzten Tauschs (für die kleine Bewegung)
    } else if (z.aufgabe === 'netz') {
      z.s = lv.start.slice(); // die Zahlen auf den Bahnen, gerade jetzt
      z.werte = {};
      lv.start.forEach((v, i) => { z.werte['s' + (i + 1)] = v; });
      z.box = {};             // zu jeder Bahn das Kästchen, in dem ihre Zahl gerade steht
      for (let i = 1; i <= lv.bahnen; i++) z.box[i] = 's' + i;
      z.nr = 0;               // nächste Vergleichs-Stelle (0-basiert)
      z.getauscht = 0;
    } else {
      z.bis = lv.bis;
      z.geheim = 1 + Math.floor(Math.random() * lv.bis);
      if (z.geheim > lv.bis) z.geheim = lv.bis;
      z.von = 1;
      z.hi = lv.bis;
      z.fragen = [];          // { x, ja, art } – nur gezählte Fragen
      z.gewaehlt = null;      // angetippte Zahl (Frage noch nicht gestellt)
      z.eingabe = '';         // Ziffern-Tasten (bis 100)
      z.letzte = null;        // zuletzt gestellte Frage mit Antwort
      z.tasta = lv.bis > MAX_TASTEN;
      z.weg = new Set();      // durchgestrichen
    }
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Feld
  // ---------------------------------------------------------------------
  function zeichneFeld(api) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld) return;
    const W = feld.clientWidth, H = feld.clientHeight;
    if (W < 10 || H < 10) return;
    z.masse = { W, H };
    if (z.aufgabe === 'tauschen') return zeichneReihe(api, W, H);
    if (z.aufgabe === 'netz') return zeichneNetz(api);
    return zeichneZahlen(api, W, H);
  }

  // ----- Nachbarn tauschen -----
  function zeichneReihe(api, W, H) {
    const z = api.zustand;
    const n = z.reihe.length;
    const g = gross() ? 18 : 10;
    const punkt = gross() ? 34 : 22;              // Platz für den kleinen und den großen Punkt an den Enden
    const max = Math.max.apply(null, z.reihe);
    const verh = z.aussehen === 'turm' ? (max * 10 + 4) / 40 : 52 / 40;
    const boden = gross() ? 34 : 26;
    const w = Math.floor(Math.max(48, Math.min((W - 2 * punkt - (n + 1) * g) / n, (H - boden - 22) / verh, gross() ? 150 : 100)));
    // Türme dürfen höher sein als im Kern gezeichnet (die Steine werden dann dicker): bis 2,6-mal
    const hoch = z.aussehen === 'turm' ? Math.floor(Math.max(w * verh, Math.min(w * verh * 2.6, H - boden - 40))) : Math.round(w * verh);
    // vorher: wo standen die Karten (für die kleine Tausch-Bewegung)
    const alt = {};
    if (z.flip && !ruhig()) {
      for (const i of z.flip) {
        const el = api.feld.querySelector('.suche-karte[data-i="' + i + '"]');
        if (el) alt[i] = el.getBoundingClientRect().left;
      }
    }
    let r = '';
    z.reihe.forEach((v, i) => {
      const gew = z.gewaehlt === i;
      const bild = z.aussehen === 'turm' ? K.turmSVG(v, { max, markiert: gew }) : K.karteSVG(v, { markiert: gew });
      const name = z.aussehen === 'turm' ? 'Turm mit ' + anzahl(v, 'Stein', 'Steinen') : 'Karte ' + v;
      const svg = z.aussehen === 'turm' ? voll(bild).replace('<svg ', '<svg preserveAspectRatio="none" ') : voll(bild);
      r += '<button class="suche-karte suche-karte-' + z.aussehen + (gew ? ' suche-gewaehlt' : '') + '" data-aktion="suche-karte" data-i="' + i + '" data-umschalter' +
        ' aria-label="' + api.esc(name + (gew ? ', ausgewählt' : '')) + '"' + (z.fertig ? ' disabled' : '') + '>' + svg + '</button>';
    });
    api.feld.innerHTML = '<div class="suche-feld suche-feld-tauschen" style="--w:' + w + 'px;--h:' + hoch + 'px;--g:' + g + 'px;--p:' + punkt + 'px;--boden:' + boden + 'px">' +
      '<div class="suche-reihe-block"><div class="suche-reihe">' + r + '</div>' +
      '<div class="suche-boden" aria-hidden="true"><i class="suche-p-klein"></i><i class="suche-linie"></i><i class="suche-p-gross"></i></div></div></div>';
    // Tausch-Bewegung: die zwei Karten gleiten von ihrem alten Platz an den neuen (FLIP, ohne Blinken)
    if (z.flip && !ruhig()) {
      const [a, b] = z.flip;
      for (const [neuI, altI] of [[a, b], [b, a]]) {
        const el = api.feld.querySelector('.suche-karte[data-i="' + neuI + '"]');
        if (!el || alt[altI] === undefined || !el.animate) continue;
        const dx = alt[altI] - el.getBoundingClientRect().left;
        if (Math.abs(dx) > 1) el.animate([{ transform: 'translateX(' + r1(dx) + 'px)' }, { transform: 'none' }], { duration: Math.min(360, Math.round(api.TEMPO * 0.6)), easing: 'ease-in-out' });
      }
    }
    z.flip = null;
  }

  // ----- Sortier-Netz -----
  const NETZ_OPT = { feld: 13, abstand: 28, zeile: 22.5 };
  function zeichneNetz(api) {
    const z = api.zustand, lv = api.lv;
    const aktiv = z.fertig ? null : z.nr + 1;
    let svg = K.netzSVG(lv.bahnen, lv.vergleiche, Object.assign({ werte: z.werte, aktiv, breite: '100%' }, NETZ_OPT));
    // Die zwei Kästchen, deren Zahlen sich gerade treffen, golden umranden
    if (aktiv) {
      const L = K.netzLage(lv.bahnen, lv.vergleiche, NETZ_OPT);
      const [a, b] = lv.vergleiche[z.nr];
      let rand = '';
      for (const key of [z.box[a], z.box[b]]) {
        const k = L.kaestchen.find((x) => x.key === key);
        if (k) rand += '<rect x="' + r1(k.x - L.feld / 2 - 0.9) + '" y="' + r1(k.y - 0.9) + '" width="' + r1(L.feld + 1.8) + '" height="' + r1(L.feld + 1.8) + '" rx="2.6" fill="none" stroke="' + GOLD + '" stroke-width="1.5"/>';
      }
      svg = svg.replace(/<\/svg>$/, rand + '</svg>');
    }
    const text = 'Sortier-Netz mit ' + lv.bahnen + ' Bahnen. ' + (aktiv ? 'Vergleichs-Stelle ' + aktiv + ' von ' + lv.vergleiche.length + '.' : 'Am Ziel: ' + z.s.join(', ') + '.');
    api.feld.innerHTML = '<div class="suche-feld suche-feld-netz"><div class="suche-netz-bild" role="img" aria-label="' + api.esc(text) + '">' + voll(svg) + '</div></div>';
  }

  // ----- Halbier-Suche: Zahlen von 1 bis N -----
  // Wie viele Spalten? So, dass die Kästchen möglichst groß werden (lieber volle Zeilen)
  function raster(W, H, n, g, cap) {
    let best = null;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const zelle = Math.floor(Math.min((W - (c - 1) * g) / c, (H - (r - 1) * g) / r));
      const wert = Math.min(zelle, cap) - (c * r > n ? 2 : 0);
      if (!best || wert >= best.wert) best = { c, r, zelle: Math.min(zelle, cap), wert };   // gleich gut: lieber mehr Spalten (wie ein Maßband)
    }
    return best;
  }
  function zahlArt(z, x) {
    if (z.fertig && x === z.von) return 'gefunden';
    if (z.weg.has(x)) return 'weg';
    const g = z.tasta ? parseInt(z.eingabe, 10) : z.gewaehlt;
    if (Number.isInteger(g) && g >= z.von && g < z.hi) return x <= g ? 'nein' : 'ja';
    return '';
  }
  function zeichneZahlen(api, W, H) {
    const z = api.zustand;
    const n = z.bis;
    let html = '';
    const g = z.tasta ? 2 : gross() ? 12 : 8;
    let stil;
    if (z.tasta) {
      // Hunderter-Tafel: 10 Spalten, die Kästchen dürfen breiter als hoch sein
      const c = 10, r = Math.ceil(n / c);
      const ch = Math.floor((H - (r - 1) * g) / r);
      const cw = Math.floor(Math.min((W - (c - 1) * g) / c, ch * 1.7, gross() ? 64 : 48));
      stil = '--c:' + c + ';--zw:' + cw + 'px;--zh:' + Math.min(ch, cw) + 'px;--g:' + g + 'px';
    } else {
      const m = raster(W, H, n, g, gross() ? 110 : 76);
      stil = '--c:' + m.c + ';--zw:' + m.zelle + 'px;--zh:' + m.zelle + 'px;--g:' + g + 'px';
    }
    for (let x = 1; x <= n; x++) {
      const art = zahlArt(z, x);
      const gew = (z.tasta ? parseInt(z.eingabe, 10) : z.gewaehlt) === x && art !== 'weg';
      const cls = 'suche-zahl' + (art ? ' suche-' + art : '') + (gew ? ' suche-gewaehlt' : '');
      if (z.tasta) html += '<span class="' + cls + '">' + x + '</span>';
      else {
        const name = art === 'weg' ? x + ', durchgestrichen' : art === 'gefunden' ? x + ', gefunden' : 'Größer als ' + x + '?';
        html += '<button class="' + cls + '" data-aktion="suche-zahl" data-i="' + x + '" data-umschalter aria-label="' + api.esc(name) + '"' +
          (z.fertig ? ' disabled' : art === 'weg' ? ' aria-disabled="true"' : '') + '>' + x + '</button>';
      }
    }
    const zu = z.tasta ? ' role="img" aria-label="' + api.esc('Zahlen von 1 bis ' + n + ', noch möglich: ' + z.von + ' bis ' + z.hi) + '"' : '';
    api.feld.innerHTML = '<div class="suche-feld suche-feld-raten" data-von="' + z.von + '" data-bis="' + z.hi + '">' +
      '<div class="suche-zahlen' + (z.tasta ? ' suche-tafel' : '') + '" style="' + stil + '"' + zu + '>' + html + '</div></div>';
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Anzeige (Programm-Bereich) und Tasten
  // ---------------------------------------------------------------------
  function zeichneAnzeige(api) {
    const z = api.zustand, lv = api.lv;
    const box = api.programm;
    if (!box) return;
    if (z.aufgabe === 'tauschen') {
      box.innerHTML = '<div class="suche-zaehler" aria-live="polite"><span class="suche-zaehler-bild">' + api.ICON.tauschen + '</span>' +
        '<span>Getauscht: <b>' + z.tausche + '</b></span></div>';
      return;
    }
    if (z.aufgabe === 'netz') {
      if (z.fertig) {
        box.innerHTML = '<div class="suche-vergleich"><span class="suche-vergleich-text">Am Ziel</span>' + zielSVG(z.s) + '</div>';
        return;
      }
      const [a, b] = lv.vergleiche[z.nr];
      box.innerHTML = '<div class="suche-vergleich" aria-label="' + api.esc('Am kleinen Punkt die ' + z.s[a - 1] + ', am großen Punkt die ' + z.s[b - 1]) + '">' +
        '<span class="suche-vergleich-text">Stelle ' + (z.nr + 1) + '<small> von ' + lv.vergleiche.length + '</small></span>' + vergleichSVG(z.s[a - 1], z.s[b - 1]) + '</div>';
      return;
    }
    // raten: die Frage, die Antwort des Drachen, die Fragen als Muggelsteine
    const h = K.hoechstens(z.bis);
    const g = z.tasta ? z.eingabe : z.gewaehlt === null ? '' : String(z.gewaehlt);
    let frage, antwort = '';
    if (g !== '') frage = 'Größer als <b class="suche-x">' + api.esc(g) + '</b>?';
    else if (z.letzte) {
      frage = 'Größer als <b class="suche-x">' + z.letzte.x + '</b>?';
      antwort = z.letzte.ja ? 'Ja!' : 'Nein!';
    } else frage = 'Größer als <b class="suche-x suche-leer">?</b>';
    if (z.fertig) frage = 'Die Zahl ist <b class="suche-x">' + z.von + '</b>!';
    let steine = '';
    const n = z.fragen.length;
    // höchstens 8 Steine mehr als mit Halbieren nötig (die Zahl daneben zählt weiter)
    for (let i = 0; i < Math.max(h, Math.min(n, h + 8)); i++) steine += '<i class="' + (i < n ? (i < h ? 'voll' : 'mehr') : '') + (i === h ? ' grenze' : '') + '"></i>';
    box.innerHTML = '<div class="suche-frage">' +
      '<span class="suche-blase suche-du">' + frage + '</span>' +
      '<span class="suche-drache">' + api.sym('drache') + '</span>' +
      '<span class="suche-blase suche-antwort' + (z.fertig ? ' suche-aus' : antwort ? (z.letzte.ja ? ' suche-ja' : ' suche-nein') : ' suche-still') + '" aria-live="polite">' + (antwort || '…') + '</span></div>' +
      '<div class="suche-steine" aria-label="' + api.esc(anzahl(n, 'Frage', 'Fragen') + ', mit Halbieren höchstens ' + h) + '"><span class="suche-steine-reihe" aria-hidden="true">' + steine + '</span>' +
      '<span class="suche-steine-text">' + anzahl(n, 'Frage', 'Fragen') + '</span></div>';
  }

  function zeichneTasten(api) {
    const z = api.zustand;
    const box = api.tasten;
    if (!box) return;
    const nochmal = (label) => api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label });
    if (z.aufgabe === 'tauschen') {
      box.innerHTML = '<div class="reihe">' + nochmal('Nochmal: alles wie am Anfang') + '</div>';
      return;
    }
    if (z.aufgabe === 'netz') {
      box.innerHTML = '<div class="reihe suche-wahl-reihe">' +
        api.taste('suche-tauschen', TAUSCH_ICON + '<span>tauschen</span>', { cls: 'suche-wahl', label: 'tauschen', aus: z.fertig }) +
        api.taste('suche-bleiben', BLEIB_ICON + '<span>bleiben</span>', { cls: 'suche-wahl', label: 'bleiben', aus: z.fertig }) +
        nochmal('Nochmal: alle Zahlen zurück an den Start') + '</div>';
      return;
    }
    const fragen = api.taste('los', api.ICON.los + '<span>Fragen</span>', {
      cls: 'breit los suche-fragen', label: 'Fragen', aus: z.fertig,
      grau: z.tasta ? z.eingabe === '' : z.gewaehlt === null,
    });
    if (!z.tasta) {
      box.innerHTML = '<div class="reihe">' + nochmal('Nochmal: eine neue Zahl') + fragen + '</div>';
      return;
    }
    let r1z = '', r2z = '';
    for (let d = 1; d <= 9; d++) (d <= 5 ? (r1z += ziffer(api, d)) : (r2z += ziffer(api, d)));
    r2z += ziffer(api, 0);
    box.innerHTML = '<div class="reihe suche-ziffern">' + r1z + '</div><div class="reihe suche-ziffern">' + r2z + '</div>' +
      '<div class="reihe">' + api.taste('suche-loeschen', api.ICON.weg, { cls: 'befehl', label: 'Letzte Ziffer löschen', aus: z.fertig || z.eingabe === '' }) +
      nochmal('Nochmal: eine neue Zahl') + fragen + '</div>';
  }
  function ziffer(api, d) {
    const z = api.zustand;
    return api.taste('suche-ziffer', '<span>' + d + '</span>', { cls: 'befehl suche-ziffer', daten: 'data-i="' + d + '"', label: 'Ziffer ' + d, aus: z.fertig });
  }

  function zeichne(api) {
    zeichneAnzeige(api);
    zeichneTasten(api);
    zeichneFeld(api);
  }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  function bild(api) {
    const z = api.zustand;
    if (z.aufgabe === 'tauschen') return api.ICON.tauschen;
    if (z.aufgabe === 'netz') return PUNKTE_ICON;
    return api.sym('drache');
  }
  function grundMeldung(api) {
    const z = api.zustand;
    if (z.aufgabe === 'tauschen') {
      return api.meldung('Tippe zwei Nachbarn an, dann tauschen sie. ' + (z.aussehen === 'turm' ? 'Der kleinste Turm' : 'Die kleinste Zahl') + ' kommt zum kleinen Punkt.', '', bild(api));
    }
    if (z.aufgabe === 'netz') return api.meldung('Die kleinere Zahl geht zum kleinen Punkt. Tauschen oder bleiben?', '', bild(api));
    return api.meldung('Der Drache denkt sich eine Zahl von 1 bis ' + z.bis + '. ' + (z.tasta ? 'Tipp eine Zahl ein und frag!' : 'Tippe eine Zahl an und frag!'), '', bild(api));
  }

  // ---------------------------------------------------------------------
  // Nachbarn tauschen
  // ---------------------------------------------------------------------
  function karteTippen(api, i) {
    const z = api.zustand;
    if (z.fertig || !Number.isInteger(i) || i < 0 || i >= z.reihe.length) return;
    const turm = z.aussehen === 'turm';
    if (z.gewaehlt === null) {
      z.gewaehlt = i;
      zeichneFeld(api);
      return api.meldung('Und jetzt ' + (turm ? 'einen Turm' : 'eine Karte') + ' direkt daneben!', 'hinweis', api.ICON.tauschen);
    }
    if (z.gewaehlt === i) {
      z.gewaehlt = null;
      zeichneFeld(api);
      return grundMeldung(api);
    }
    if (Math.abs(z.gewaehlt - i) !== 1) {
      return api.meldung('Nur Nachbarn können tauschen. Tippe ' + (turm ? 'einen Turm direkt neben dem goldenen' : 'eine Karte direkt neben der goldenen') + ' an.', 'hinweis', api.ICON.tauschen);
    }
    const a = Math.min(z.gewaehlt, i);
    const verkehrt = z.reihe[a] > z.reihe[a + 1];
    z.reihe = K.tausche(z.reihe, a);
    z.tausche++;
    z.gewaehlt = null;
    z.flip = [a, a + 1];
    // Bewertet nach dem Ergebnis, mit dem Kern: Ist die Reihe sortiert?
    if (K.istSortiert(z.reihe)) {
      z.fertig = true;
      zeichne(api);
      api.meldung('Sortiert!', 'gut', api.sym('stern'));
      const wenigste = K.fehlstellen(api.lv.zahlen);
      const zusatz = z.tausche <= wenigste
        ? 'Sortiert mit ' + anzahl(z.tausche, 'Tausch', 'Tauschen') + '. Weniger geht nicht!'
        : 'Sortiert mit ' + anzahl(z.tausche, 'Tausch', 'Tauschen') + '. Profi-Frage: Geht es auch mit ' + wenigste + '?';
      api.spaeter(() => api.geschafft({ zusatz }), 650);
      return;
    }
    zeichneAnzeige(api);
    zeichneFeld(api);
    api.meldung(verkehrt ? 'Getauscht!' : 'Getauscht. Aber die zwei standen schon richtig!', 'hinweis', api.ICON.tauschen);
  }

  // ---------------------------------------------------------------------
  // Sortier-Netz: tauschen oder bleiben
  // ---------------------------------------------------------------------
  function entscheide(api, tauschen) {
    const z = api.zustand, lv = api.lv;
    if (z.fertig || z.nr >= lv.vergleiche.length) return;
    const [a, b] = lv.vergleiche[z.nr];
    const x = z.s[a - 1], y = z.s[b - 1];
    const raus = tauschen ? [y, x] : [x, y];
    // Eine Vergleichs-Stelle bringt die kleinere Zahl immer zum kleinen Punkt
    if (raus[0] > raus[1]) {
      const klein = Math.min(x, y), gr = Math.max(x, y);
      return api.meldung(tauschen
        ? 'Schau genau: Die ' + klein + ' ist kleiner als die ' + gr + ' und steht schon beim kleinen Punkt.'
        : 'Schau genau: Die ' + klein + ' ist kleiner als die ' + gr + '. Wo ist der kleine Punkt?', 'hinweis', PUNKTE_ICON);
    }
    const nr = z.nr + 1;
    z.s[a - 1] = raus[0];
    z.s[b - 1] = raus[1];
    z.werte['k' + nr + 'a'] = raus[0];
    z.werte['k' + nr + 'b'] = raus[1];
    z.box[a] = 'k' + nr + 'a';
    z.box[b] = 'k' + nr + 'b';
    if (tauschen) z.getauscht++;
    z.nr = nr;
    api.sperren();   // dieselben Tasten, aber eine neue Vergleichs-Stelle: ein Doppeltipp entscheidet nicht gleich mit
    if (z.nr < lv.vergleiche.length) {
      zeichne(api);
      return api.meldung('Gut! Jetzt Vergleichs-Stelle ' + (z.nr + 1) + ' von ' + lv.vergleiche.length + '.', 'hinweis', PUNKTE_ICON);
    }
    for (let i = 1; i <= lv.bahnen; i++) z.werte['z' + i] = z.s[i - 1];
    z.fertig = true;
    zeichne(api);
    // Bewertet nach dem Ergebnis, mit dem Kern: sortiert am Ziel?
    if (!K.istSortiert(z.s)) return api.meldung('Am Ziel: ' + z.s.join(', ') + '. Das ist nicht sortiert.', 'hinweis', PUNKTE_ICON);
    const text = 'Am Ziel: ' + z.s.join(', ') + '. Sortiert!';
    api.meldung(text, 'gut', api.sym('stern'));
    api.spaeter(() => api.geschafft({ zusatz: text + ' Getauscht an ' + z.getauscht + ' von ' + anzahl(lv.vergleiche.length, 'Vergleichs-Stelle', 'Vergleichs-Stellen') + '.' }), 700);
  }

  // ---------------------------------------------------------------------
  // Halbier-Suche
  // ---------------------------------------------------------------------
  // Darf x gefragt werden? Sonst eine freundliche Meldung (die Frage zählt nicht)
  function nutzlos(api, x) {
    const z = api.zustand;
    if (!Number.isInteger(x) || x < 1 || x > z.bis) return 'Nur Zahlen von 1 bis ' + z.bis + '.';
    const b = K.bewerte(z.von, z.hi, x);
    if (b.art !== 'unnuetz') return '';
    if (x < z.von || x > z.hi) return 'Die ' + x + ' ist schon durchgestrichen. Frag nach einer Zahl, die noch geht.';
    return 'Größer als ' + x + '? Das weißt du schon: Nein! Frag nach einer kleineren Zahl.';
  }
  function zahlTippen(api, x) {
    const z = api.zustand;
    if (z.fertig || z.tasta) return;
    if (z.gewaehlt === x) {
      z.gewaehlt = null;
      zeichneAnzeige(api); zeichneTasten(api); zeichneFeld(api);
      return grundMeldung(api);
    }
    const warum = nutzlos(api, x);
    if (warum) return api.meldung(warum, 'hinweis', bild(api));
    z.gewaehlt = x;
    zeichneAnzeige(api); zeichneTasten(api); zeichneFeld(api);
    api.meldung('Blau heißt Nein, gold heißt Ja. Tippe auf „Fragen“!', 'hinweis', HALB_ICON);
  }
  function zifferTippen(api, d) {
    const z = api.zustand;
    if (z.fertig || !z.tasta) return;
    if (z.eingabe.length >= String(z.bis).length) return api.meldung('Die Zahl hat schon genug Ziffern. Löschen geht mit der roten Taste.', 'hinweis', bild(api));
    if (z.eingabe === '' && d === 0) return api.meldung('Eine Zahl fängt nicht mit 0 an.', 'hinweis', bild(api));
    z.eingabe += String(d);
    zeichneAnzeige(api); zeichneTasten(api); zeichneFeld(api);
    const x = parseInt(z.eingabe, 10);
    if (x > z.bis) api.meldung('Nur Zahlen von 1 bis ' + z.bis + '.', 'hinweis', bild(api));
    else if (K.bewerte(z.von, z.hi, x).art !== 'unnuetz') api.meldung('Blau heißt Nein, gold heißt Ja. Tippe auf „Fragen“!', 'hinweis', HALB_ICON);
    else api.meldung('Fertig getippt? Dann tippe auf „Fragen“.', 'hinweis', bild(api));
  }
  function zifferLoeschen(api) {
    const z = api.zustand;
    if (z.fertig || !z.tasta || z.eingabe === '') return;
    z.eingabe = z.eingabe.slice(0, -1);
    zeichneAnzeige(api); zeichneTasten(api); zeichneFeld(api);
    if (z.eingabe === '') grundMeldung(api);
  }

  function fragen(api) {
    const z = api.zustand;
    if (z.fertig || z.aufgabe !== 'raten') return;
    const x = z.tasta ? parseInt(z.eingabe, 10) : z.gewaehlt;
    if (!Number.isInteger(x)) return api.meldung(z.tasta ? 'Tipp zuerst eine Zahl ein.' : 'Tippe zuerst eine Zahl an.', 'hinweis', bild(api));
    const warum = nutzlos(api, x);
    if (warum) {
      if (z.tasta) z.eingabe = '';
      z.gewaehlt = null;
      zeichneAnzeige(api); zeichneTasten(api); zeichneFeld(api);
      return api.meldung(warum, 'hinweis', bild(api));
    }
    // Der Drache antwortet ehrlich (web/kern/suche.js: antwort, nachFrage, bewerte)
    const ja = K.antwort(z.geheim, x);
    const art = K.bewerte(z.von, z.hi, x).art;
    const [von, hi] = K.nachFrage(z.von, z.hi, x, ja);
    for (let v = z.von; v <= z.hi; v++) if (v < von || v > hi) z.weg.add(v);
    z.von = von;
    z.hi = hi;
    z.fragen.push({ x, ja, art });
    z.letzte = { x, ja };
    z.gewaehlt = null;
    z.eingabe = '';
    api.sperren();   // die Tasten bleiben, aber ein Doppeltipp auf „Fragen“ fragt nicht gleich noch einmal
    if (von < hi) {
      zeichne(api);
      return api.meldung((ja ? 'Ja!' : 'Nein!') + ' Noch ' + (hi - von + 1) + ' Zahlen.', ja ? 'suche-meldung-ja' : 'suche-meldung-nein', api.sym('drache'));
    }
    z.fertig = true;
    zeichne(api);
    api.meldung((ja ? 'Ja!' : 'Nein!') + ' Nur noch die ' + von + '. Gefunden!', 'gut', api.sym('stern'));
    // Bewertet nach dem Ergebnis: höchstens so viele Fragen wie mit Halbieren nötig (hoechstens)
    const h = K.hoechstens(z.bis);
    const n = z.fragen.length;
    const stern = n <= h;
    const glueck = stern && z.fragen.some((f) => f.art !== 'gut');
    const mit = 'Gefunden mit ' + anzahl(n, 'Frage', 'Fragen');
    let zusatz = 'Die Zahl ist ' + von + '. ';
    if (!stern) zusatz += mit + '. Mit Halbieren reichen immer höchstens ' + h + '.';
    else if (glueck) zusatz += mit + ': Glück gehabt! Mit Halbieren klappt es immer mit höchstens ' + h + '.';
    else zusatz += mit + '. Mit Halbieren sind es höchstens ' + h + '.';
    api.spaeter(() => api.geschafft({ stern, zusatz }), 700);
  }

  // ---------------------------------------------------------------------
  // Plugin
  // ---------------------------------------------------------------------
  function start(api) {
    neu(api);
    const sp = api.feld && api.feld.closest('.spiel');
    if (sp) {
      sp.classList.add('suche-' + api.lv.aufgabe);
      if (api.zustand.tasta) sp.classList.add('suche-tasta');
    }
    zeichne(api);
    // Neu zeichnen, wenn sich der Platz im Feld ändert (Drehen, eine längere Meldung)
    const z = api.zustand;
    stopp(api);
    if (!api.feld) return;
    const feld = api.feld;
    z.groesse = () => {
      if (!feld.isConnected) return;
      const m = z.masse;
      if (!m || Math.abs(feld.clientWidth - m.W) > 1 || Math.abs(feld.clientHeight - m.H) > 1) zeichneFeld(api);
    };
    if (window.ResizeObserver) {
      z.beob = new ResizeObserver(z.groesse);
      z.beob.observe(feld);
    }
    window.addEventListener('resize', z.groesse);
    // Beim ersten Zeichnen kann das Feld noch ohne Größe sein (Schrift lädt): gleich danach nochmal
    if (!z.masse) api.spaeter(z.groesse, 0);
  }
  function stopp(api) {
    const z = api.zustand;
    if (!z) return;
    if (z.beob) { z.beob.disconnect(); z.beob = null; }
    if (z.groesse) { window.removeEventListener('resize', z.groesse); z.groesse = null; }
  }

  SPIELE.suche = {
    icon: () => paketBild(),
    start,
    grundMeldung,
    klick(aktion, el, api) {
      const i = parseInt(el.dataset.i, 10);
      if (aktion === 'suche-karte') return karteTippen(api, i);
      if (aktion === 'suche-tauschen') return entscheide(api, true);
      if (aktion === 'suche-bleiben') return entscheide(api, false);
      if (aktion === 'suche-zahl') return zahlTippen(api, i);
      if (aktion === 'suche-ziffer') return zifferTippen(api, i);
      if (aktion === 'suche-loeschen') return zifferLoeschen(api);
    },
    los: fragen,
    nochmal(api) {
      neu(api);
      api.laeuft(false);
      zeichne(api);
      grundMeldung(api);
    },
    stopp,
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man ein Paket oder Level direkt (QR-Code am Blatt, Neuladen), fehlte sonst das
  // Paket-Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const DATEN = window.WERKSTATT_DATEN;
    if (!app || !ans || !DATEN || !['start', 'block', 'paket', 'level'].includes(ans)) return;
    if (!DATEN.pakete.some((p) => p.art === 'suche' || p.levels.some((l) => l.art === 'suche'))) return;
    // Schon richtig gezeichnet (ein anderes Plugin hat neu zeichnen lassen)?
    if (ans === 'level' && app.querySelector('.suche-feld')) return;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const b = document.createElement('button');
    b.hidden = true;
    let m;
    if (!h) b.dataset.aktion = 'heim';
    else if ((m = /^block-([a-d])$/i.exec(h))) { b.dataset.aktion = 'block'; b.dataset.block = m[1].toLowerCase(); }
    else if ((m = /^(e\d+)$/i.exec(h))) { b.dataset.aktion = 'paket'; b.dataset.paket = m[1].toLowerCase(); }
    else if ((m = /^(e\d+)\/(\d+)$/i.exec(h))) { b.dataset.aktion = 'level'; b.dataset.paket = m[1].toLowerCase(); b.dataset.i = String(parseInt(m[2], 10) - 1); }
    else return;
    app.appendChild(b);
    b.click();
    if (b.isConnected) b.remove();
  })();
})();
