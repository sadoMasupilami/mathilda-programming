/* =====================================================================
   Denk-Werkstatt – Web-App (Bildschirm-Bonus zu den Blättern)
   Einfaches JavaScript ohne Framework. Daten: window.WERKSTATT_DATEN
   (daten.js, von werkzeuge/web-bauen.mjs aus raetsel/*.json erzeugt).
   Bewertet wird nur nach dem Ergebnis: Das Programm wird mit demselben
   Ausführer (web/kern/ausfuehrer.js) wie im Rätsel-Löser ausgeführt,
   Ablauf-Karten mit WerkstattKern.pruefeReihenfolge. Es gibt keine
   gespeicherten Lösungen in der App.
   Ruhig: kein Ton, keine Zeitlimits, kein Blinken, nach dem letzten
   Level ein klares Ende.
   ===================================================================== */
(function () {
  'use strict';

  const K = window.WerkstattKern;
  const S = window.WerkstattSymbole;
  const BILDER = window.WerkstattBilder || null;
  const DATEN = window.WERKSTATT_DATEN || { pakete: [] };
  // Tempo des Drachen (ms pro Befehl). Tests dürfen es über window.WERKSTATT_TEMPO verkürzen.
  const TEMPO = Number(window.WERKSTATT_TEMPO) > 0 ? Number(window.WERKSTATT_TEMPO) : 600;
  const MAX_KARTEN = 12;   // eine Programm-Reihe am Papier
  const MAX_INNEN = WerkstattKern.MAX_INNEN;     // Befehle in einem Zauber-Kasten (Plan 7.5 Regel 9: eine Gruppe von 2–3 Befehlen)
  const SPERRE = 350;      // ms: nach einem Wechsel der Tastenbelegung keine Tipps (Doppeltipp trifft sonst die neue Taste)
  const DREH = { oben: 0, rechts: 90, unten: 180, links: 270 };
  const NAMEN = { vor: 'vor', links: 'links drehen', rechts: 'rechts drehen' };
  const ZIELWORT = { schatz: 'Schatz', ziel: 'Ziel', stern: 'Stern' };
  const app = document.getElementById('app');
  const versionMeta = document.querySelector('meta[name="werkstatt-version"]');
  const VERSION = versionMeta ? versionMeta.getAttribute('content') : '';

  // ---------------------------------------------------------------------
  // Speicher: nur im Browser (localStorage), Fehler werden geschluckt
  // ---------------------------------------------------------------------
  const SCHLUESSEL = 'denk-werkstatt-v1';
  let speicher = lade();
  function lade() {
    const leer = { sterne: {}, name: '' };
    try {
      const t = window.localStorage.getItem(SCHLUESSEL);
      const d = t ? JSON.parse(t) : null;
      if (d && typeof d === 'object') {
        return {
          sterne: d.sterne && typeof d.sterne === 'object' ? d.sterne : {},
          name: typeof d.name === 'string' ? d.name.slice(0, 30) : '',
        };
      }
    } catch (e) { /* privater Modus oder gesperrt: dann eben ohne Speichern */ }
    return leer;
  }
  function sichere() {
    try { window.localStorage.setItem(SCHLUESSEL, JSON.stringify(speicher)); } catch (e) { /* nicht schlimm */ }
  }

  // ---------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sym = (name) => S.symbol(name);
  const paketVon = (id) => DATEN.pakete.find((p) => p.paket === id) || null;
  const sterneVon = (p) => p.levels.filter((l) => speicher.sterne[l.id]).length;
  function bildVon(name) {
    if (!BILDER || !name) return '';
    try {
      if (BILDER.hat && !BILDER.hat(name)) return '';
      const s = BILDER.bild(name, '100%');
      return typeof s === 'string' && s.indexOf('<svg') === 0 ? s : '';
    } catch (e) { return ''; }
  }
  function hatZauber(p) { return p.levels.some((l) => l.zauber); }

  // Eigene kleine Bedien-Symbole (keine Befehls-Symbole: die kommen aus symbole.js)
  const T = '#1f2340';
  const ICON = {
    heim: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 23 L24 8 L41 23 L41 41 L29 41 L29 30 L19 30 L19 41 L7 41 Z" fill="#fff4cc" stroke="' + T + '" stroke-width="3.5" stroke-linejoin="round"/></svg>',
    weg: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="5" fill="#fff" stroke="' + T + '" stroke-width="3.5"/><path d="M17 17 L31 31 M31 17 L17 31" stroke="#d1335b" stroke-width="5" stroke-linecap="round"/></svg>',
    kreuz: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14 L34 34 M34 14 L14 34" stroke="' + T + '" stroke-width="5" stroke-linecap="round"/></svg>',
    los: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 9 L39 24 L15 39 Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    karten: '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="20" width="36" height="46" rx="6" fill="#fff4cc" stroke="' + T + '" stroke-width="4" transform="rotate(-8 26 43)"/><rect x="56" y="34" width="36" height="46" rx="6" fill="#e9eefc" stroke="' + T + '" stroke-width="4" transform="rotate(8 74 57)"/><path d="M22 36 L28 33 L28 54 M66 50 C66 44 78 44 78 50 C78 56 66 60 66 66 L80 66" fill="none" stroke="' + T + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 70 C48 78 56 78 60 72" fill="none" stroke="#7a4fd1" stroke-width="4" stroke-linecap="round"/><path d="M60 64 L62 73 L53 74" fill="none" stroke="#7a4fd1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tauschen: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 18 H36 M30 11 L37 18 L30 25 M38 31 H12 M18 24 L11 31 L18 38" fill="none" stroke="#d1335b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const zauberIcon = '<span class="zk-icon" aria-hidden="true"><b>?-mal</b><i></i></span>';

  // ---------------------------------------------------------------------
  // Zustand der aktuellen Ansicht
  // ---------------------------------------------------------------------
  let L = null;          // Level-Zustand
  let neueVersion = false; // ein neuer Service Worker hat übernommen: bei nächster Gelegenheit neu laden
  function neuLadenWennRuhig() {
    if (neueVersion && ['start', 'paket', 'ende'].includes(document.body.dataset.ansicht)) {
      neueVersion = false;
      location.reload();
    }
  }
  let elternFrage = null;
  let elternOffen = false;

  function stoppe() {
    if (L && L.timer) { clearTimeout(L.timer); L.timer = null; }
    if (L) L.laeuft = false;
  }

  function ansicht(name, html) {
    stoppe();
    document.body.dataset.ansicht = name;
    app.innerHTML = html;
    window.scrollTo(0, 0);
    neuLadenWennRuhig();
  }

  // ---------------------------------------------------------------------
  // Routen: #e2 öffnet das Paket (QR-Code am Blatt), #e2/3 Level 3, #e2/ende, #eltern
  // ---------------------------------------------------------------------
  let gezeigt = null;   // Hash der gerade gezeigten Ansicht
  function route() {
    gezeigt = location.hash;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (h !== 'eltern' && h !== 'eltern/bereich') elternOffen = false;
    if (h === 'eltern') return zeigeElternFrage();
    if (h === 'eltern/bereich') return elternOffen ? zeigeEltern() : zeigeElternFrage();
    const m = /^(e\d+)(?:\/(\d+|ende))?$/i.exec(h);
    if (m) {
      const p = paketVon(m[1].toLowerCase());
      if (p) {
        if (!m[2]) return zeigePaket(p);
        if (m[2] === 'ende') return zeigeEnde(p);
        const i = parseInt(m[2], 10) - 1;
        if (p.levels[i]) return zeigeLevel(p, i);
        return zeigePaket(p);
      }
    }
    zeigeStart();
  }
  // Gleich im Tipp zeichnen, nicht erst beim hashchange: nur so darf ein Eingabefeld am iPad
  // sofort den Fokus (und die Tastatur) bekommen. Der hashchange danach zeichnet nicht noch einmal.
  function geh(h) {
    if (!(location.hash === h || (h === '#' && !location.hash))) location.hash = h;
    route();
  }
  function fokus(sel) {
    const f = app.querySelector(sel);
    if (f) f.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------
  // Startseite: Pakete der Einheiten, alle offen
  // ---------------------------------------------------------------------
  function paketIcon(p) {
    if (p.art === 'kobold') return sym('kobold');
    if (p.art === 'ablauf') return ICON.karten;
    if (hatZauber(p)) return '<span class="zk-gross"><b>3-mal</b>' + sym('drache') + '</span>';
    return sym('drache');
  }
  function zeigeStart() {
    const name = speicher.name ? ', ' + esc(speicher.name) : '';
    let kacheln = '';
    for (const p of DATEN.pakete) {
      const n = sterneVon(p);
      kacheln += '<button class="kachel" data-aktion="paket" data-paket="' + p.paket + '">' +
        '<span class="kachel-nr">' + p.einheit + '</span>' +
        '<span class="kachel-bild">' + paketIcon(p) + '</span>' +
        '<span class="kachel-titel">' + esc(p.titel) + '</span>' +
        '<span class="kachel-stand"><span class="mini-stern">' + sym(n === p.levels.length ? 'stern' : 'sternLeer') + '</span>' + n + ' von ' + p.levels.length + '</span>' +
        '</button>';
    }
    if (!kacheln) kacheln = '<p class="leer-hinweis">Hier gibt es noch keine Pakete.</p>';
    ansicht('start',
      '<section class="ansicht start">' +
      '<header class="start-kopf"><span class="start-drache">' + sym('drache') + '</span>' +
      '<div><h1>Denk-Werkstatt</h1><p class="gruss">Hallo' + name + '! Welches Paket?</p></div></header>' +
      '<div class="kacheln" data-n="' + DATEN.pakete.length + '">' + kacheln + '</div>' +
      '<footer class="start-fuss"><button class="taste klein-taste" data-aktion="eltern">Für Erwachsene</button></footer>' +
      '</section>');
  }

  // ---------------------------------------------------------------------
  // Paket: Levels zum Auswählen
  // ---------------------------------------------------------------------
  function zeigePaket(p) {
    let knoepfe = '';
    p.levels.forEach((l, i) => {
      const s = !!speicher.sterne[l.id];
      knoepfe += '<button class="level-knopf' + (s ? ' geschafft' : '') + '" data-aktion="level" data-paket="' + p.paket + '" data-i="' + i + '" aria-label="Level ' + (i + 1) + '">' +
        '<span class="level-zahl">' + (i + 1) + '</span><span class="level-stern">' + sym(s ? 'stern' : 'sternLeer') + '</span></button>';
    });
    const naechstes = Math.max(0, p.levels.findIndex((l) => !speicher.sterne[l.id]));
    ansicht('paket',
      '<section class="ansicht paket">' +
      '<header class="kopf">' + heimKnopf() + '<span class="kopf-titel">' + esc(p.titel) + '</span></header>' +
      '<div class="paket-inhalt">' +
      '<div class="paket-bild">' + paketIcon(p) + '</div>' +
      '<div class="paket-rechts">' +
      '<div class="level-knoepfe" data-n="' + p.levels.length + '">' + knoepfe + '</div>' +
      '<button class="taste haupt gross" data-aktion="level" data-paket="' + p.paket + '" data-i="' + naechstes + '">' + ICON.los + '<span>Los geht’s</span></button>' +
      '</div></div></section>');
  }

  // ---------------------------------------------------------------------
  // Paket-Ende: klares Ende, kein nächstes Paket
  // ---------------------------------------------------------------------
  function zeigeEnde(p) {
    const n = sterneVon(p);
    let sterne = '';
    p.levels.forEach((l) => { sterne += '<span class="ende-stern">' + sym(speicher.sterne[l.id] ? 'stern' : 'sternLeer') + '</span>'; });
    ansicht('ende',
      '<section class="ansicht ende">' +
      '<div class="ende-bild"><span>' + sym('drache') + '</span><span>' + sym('schatz') + '</span></div>' +
      '<div class="ende-text">' +
      '<h1>Super! Jetzt zurück zum Papier.</h1>' +
      '<div class="ende-sterne" aria-label="' + n + ' von ' + p.levels.length + ' Sternen">' + sterne + '</div>' +
      '<p>Das Paket ist fertig. Leg das Gerät jetzt weg.</p>' +
      '<button class="taste" data-aktion="heim">' + ICON.heim + '<span>Startseite</span></button>' +
      '</div></section>');
  }

  // ---------------------------------------------------------------------
  // Für Erwachsene: einfache Eltern-Frage, dann Name und Fortschritt löschen
  // ---------------------------------------------------------------------
  function zeigeElternFrage(hinweis) {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    elternFrage = a * b;
    ansicht('eltern-frage',
      '<section class="ansicht formular">' +
      '<header class="kopf">' + heimKnopf() + '<span class="kopf-titel">Für Erwachsene</span></header>' +
      '<div class="formular-inhalt">' +
      '<form class="formular-feld" data-form="eltern" autocomplete="off">' +
      '<label for="antwort">Bitte rechnen: <b class="rechnung">' + a + ' · ' + b + '</b> = ?</label>' +
      '<div class="eingabe-reihe"><input id="antwort" name="antwort" type="text" inputmode="numeric" pattern="[0-9]*" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="go" maxlength="4">' +
      '<button class="taste haupt" type="submit">Weiter</button></div>' +
      '<p class="hinweis' + (hinweis ? ' falsch' : '') + '" role="status">' + esc(hinweis || 'Hier kann man den Fortschritt löschen und einen Namen eingeben.') + '</p>' +
      '</form></div></section>');
    fokus('#antwort');
  }
  function pruefeEltern(form) {
    const v = parseInt((form.elements.antwort.value || '').trim(), 10);
    if (v === elternFrage) {
      elternOffen = true;
      if (document.activeElement) document.activeElement.blur();
      geh('#eltern/bereich');
    } else zeigeElternFrage('Leider falsch. Neue Rechnung:');
  }
  function zeigeEltern(hinweis) {
    ansicht('eltern',
      '<section class="ansicht formular eltern">' +
      '<header class="kopf">' + heimKnopf() + '<span class="kopf-titel">Für Erwachsene</span></header>' +
      '<div class="formular-inhalt">' +
      '<form class="formular-feld" data-form="name" autocomplete="off">' +
      '<label for="name">Name am Gerät (freiwillig)</label>' +
      '<div class="eingabe-reihe"><input id="name" name="name" type="text" value="' + esc(speicher.name) + '" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" maxlength="30">' +
      '<button class="taste" type="submit">Speichern</button></div>' +
      '<p class="klein">Der Name bleibt nur in diesem Browser.</p>' +
      '</form>' +
      '<div class="formular-feld loeschen-feld">' +
      '<button class="taste warnung" data-aktion="loeschen-frage">' + ICON.weg + '<span>Fortschritt löschen</span></button>' +
      '<p class="hinweis" role="status">' + esc(hinweis || 'Alle Sterne. Der Sammelpass am Papier zählt.') + '</p>' +
      '<p class="klein">Version ' + esc(VERSION) + '</p>' +
      '</div></div></section>');
  }
  function loeschenFrage() {
    const f = app.querySelector('.loeschen-feld');
    f.innerHTML = '<p class="frage">Wirklich alle Sterne löschen?</p>' +
      '<div class="eingabe-reihe"><button class="taste warnung" data-aktion="loeschen-ja">Ja, löschen</button>' +
      '<button class="taste" data-aktion="loeschen-nein">Nein</button></div>';
  }

  function heimKnopf() {
    return '<button class="taste rund" data-aktion="heim" aria-label="Startseite">' + ICON.heim + '</button>';
  }

  // ---------------------------------------------------------------------
  // Level
  // ---------------------------------------------------------------------
  function weltVon(l) {
    const w = {};
    for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine', 'zielSymbol']) if (l[f] !== undefined) w[f] = l[f];
    return w;
  }

  function zeigeLevel(p, i) {
    const lv = p.levels[i];
    const art = lv.art === 'kobold' ? 'kobold' : lv.art === 'ablauf' ? 'ablauf' : 'pfad';
    let punkte = '';
    p.levels.forEach((l, j) => {
      punkte += '<span class="punkt' + (speicher.sterne[l.id] ? ' voll' : '') + (j === i ? ' jetzt' : '') + '"></span>';
    });
    ansicht('level',
      '<section class="ansicht spiel art-' + art + '" data-level="' + esc(lv.id) + '" style="--tempo:' + Math.round(Math.min(450, TEMPO * 0.75)) + 'ms">' +
      '<div class="spalte-links">' +
      '<header class="kopf">' + heimKnopf() +
      '<div class="kopf-mitte"><span class="kopf-titel">' + esc(p.titel) + '</span><span class="punkte" aria-hidden="true">' + punkte + '</span></div>' +
      '<span class="kopf-nr">' + (i + 1) + '/' + p.levels.length + '</span></header>' +
      '<div class="feld"></div>' +
      '<div class="meldung" role="status"></div>' +
      '</div>' +
      '<div class="spalte-rechts">' +
      '<div class="programm"></div>' +
      '<div class="tasten"></div>' +
      '</div>' +
      '</section>');
    L = { p, i, lv, art, laeuft: false, timer: null, ergebnis: null, auswahl: null, wahl: null };
    if (art === 'ablauf') starteAblauf();
    else {
      L.welt = weltVon(lv);
      L.W = K.welt(L.welt);
      if (art === 'kobold') { L.orig = K.lies(lv.programm); L.prog = L.orig.slice(); }
      else L.prog = [];
      zeichneFeld();
      dracheZurueck();
    }
    zeichneProgramm();
    zeichneTasten();
    grundMeldung();
  }

  // ----- Meldung -----
  function meldung(text, art, icon) {
    const m = app.querySelector('.meldung');
    if (!m) return;
    m.className = 'meldung' + (art ? ' ' + art : '');
    m.innerHTML = (icon ? '<span class="meldung-bild">' + icon + '</span>' : '') + '<span class="meldung-text">' + esc(text) + '</span>';
  }
  function zielWort() { return ZIELWORT[L.lv.zielSymbol] || 'Schatz'; }
  function grundMeldung() {
    const lv = L.lv;
    if (L.art === 'ablauf') return meldung((lv.titel ? lv.titel + ': ' : '') + 'Tippe die Karten der Reihe nach an.', '', ICON.karten);
    if (L.art === 'kobold') return meldung('Ein Befehl ist falsch! Tippe ihn an und tausche ihn aus.', '', sym('kobold'));
    const zs = lv.zielSymbol || 'schatz';
    const karten = lv.zauber && lv.maxKarten ? ' Höchstens ' + lv.maxKarten + ' Karten.' : '';
    if (lv.edelsteine && lv.edelsteine.length) return meldung('Sammle alle Edelsteine, dann zum ' + zielWort() + '!' + karten, '', sym('edelstein'));
    if (karten) return meldung('Zum ' + zielWort() + ' mit höchstens ' + lv.maxKarten + ' Karten!', '', sym(zs));
    if (lv.aufgabe === 'kuerzestes') return meldung('Finde das kürzeste Programm zum ' + zielWort() + '!', '', sym(zs));
    return meldung('Bring den Drachen zum ' + zielWort() + '!', '', sym(zs));
  }

  // ----- Spielfeld (Gitter wie am Papier) und Drache -----
  function zeichneFeld() {
    const feld = app.querySelector('.feld');
    const basis = S.gitter(L.welt, { ohneDrache: true, gesammelt: L.gesammelt || [], stoss: L.stossFeld || null, label: 'Spielfeld', klasse: 'gitter' });
    const vb = /viewBox="([^"]+)"/.exec(basis)[1];
    if (!feld.querySelector('.gitter-box')) {
      feld.innerHTML = '<div class="gitter-box"><div class="gitter-basis"></div>' +
        '<svg class="drache-ebene" xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" aria-hidden="true">' +
        '<g class="d-pos"><g class="d-dreh"><g transform="translate(-42 -42) scale(0.84)">' + S.inhalt('drache') + '</g></g></g></svg></div>';
    }
    feld.querySelector('.gitter-basis').innerHTML = basis;
  }
  function dracheSetzen(z, sofort) {
    const ebene = app.querySelector('.drache-ebene');
    if (!ebene) return;
    const pos = ebene.querySelector('.d-pos'), dreh = ebene.querySelector('.d-dreh');
    if (sofort) ebene.classList.add('sofort');
    const x = z.x * 100 + 50, y = z.y * 100 + 50;
    pos.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    dreh.setAttribute('transform', 'rotate(' + L.winkel + ')');
    pos.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    dreh.style.transform = 'rotate(' + L.winkel + 'deg)';
    if (sofort) { void ebene.getBoundingClientRect(); ebene.classList.remove('sofort'); }
    L.drache = { x: z.x, y: z.y, blick: z.blick };
  }
  function dracheZurueck() {
    const s = L.welt.start;
    L.winkel = DREH[s.blick || 'oben'] || 0;
    L.gesammelt = [];
    L.stossFeld = null;
    L.ergebnis = null;
    zeichneFeld();
    dracheSetzen({ x: s.x, y: s.y, blick: s.blick || 'oben' }, true);
    markiere(null);
  }

  // ----- Programm (Pfad: Karten mit Zauber-Kasten; Kobold: antippen zum Reparieren) -----
  // Kartengrenze (Einheit 5) oder Länge der Programm-Reihe am Blatt (maxBefehle), sonst eine volle Reihe
  function grenze() { return L.lv.maxKarten || L.lv.maxBefehle || MAX_KARTEN; }
  function kartenZahl() { return L.prog.reduce((s, t) => s + (typeof t === 'string' ? 1 : 1 + t.befehle.length), 0); }
  function offenerKasten() {
    const t = L.prog[L.prog.length - 1];
    return t && typeof t === 'object' && t.offen ? t : null;
  }
  function programmDaten() {
    return L.prog.filter((t) => typeof t === 'string' || t.befehle.length)
      .map((t) => (typeof t === 'string' ? t : { wdh: t.wdh, befehle: t.befehle.slice() }));
  }
  function karte(b, attr, cls) {
    return '<span class="karte befehl-' + b + (cls ? ' ' + cls : '') + '"' + (attr || '') + ' aria-label="' + NAMEN[b] + '">' + sym(b) + '</span>';
  }

  function zeichneProgramm() {
    const box = app.querySelector('.programm');
    if (!box) return;
    if (L.art === 'ablauf') return zeichneAblaufReihe();
    if (L.art === 'kobold') return zeichneKoboldProgramm();
    let html = '';
    const platz = !L.laeuft && !L.wahl && kartenZahl() < grenze();
    // Nummerierte Reihe wie am Blatt: eine Nummer pro Befehl, ein Zauber-Kasten bekommt eine Nummer
    const mitNr = (i, inhalt) => '<span class="teil"><span class="teil-nr" aria-hidden="true">' + (i + 1) + '</span>' + inhalt + '</span>';
    L.prog.forEach((t, i) => {
      if (typeof t === 'string') html += mitNr(i, karte(t, ' data-teil="' + i + '"'));
      else {
        let innen = '';
        t.befehle.forEach((b, j) => { innen += karte(b, ' data-teil="' + i + '" data-innen="' + j + '"'); });
        if (t.offen && platz && t.befehle.length < MAX_INNEN) innen += '<span class="karte platzhalter"></span>';
        html += mitNr(i, '<span class="kasten-z' + (t.offen ? ' offen' : '') + '" data-teil="' + i + '"><span class="mal">' + t.wdh + '-mal<span class="runde"></span></span><span class="innen">' + innen + '</span></span>');
      }
    });
    if (!offenerKasten() && platz) html += mitNr(L.prog.length, '<span class="karte platzhalter"></span>');
    let zaehler = '';
    if (L.lv.maxKarten) {
      const n = kartenZahl();
      let k = '';
      for (let j = 0; j < L.lv.maxKarten; j++) k += '<i class="' + (j < n ? 'voll' : '') + '"></i>';
      zaehler = '<div class="zaehler"><span class="zaehler-karten" aria-hidden="true">' + k + '</span><span>' + n + ' von ' + L.lv.maxKarten + ' Karten</span></div>';
    }
    box.innerHTML = '<div class="prog-zeile" aria-label="Programm">' + html + '</div>' + zaehler;
  }

  function zeichneKoboldProgramm() {
    const box = app.querySelector('.programm');
    const a = L.auswahl;
    let html = '';
    L.prog.forEach((b, i) => {
      const zu = koboldZu(i);
      html += '<button class="karte kobold-karte befehl-' + b + (a && a.i === i ? ' gewaehlt' : '') + (zu ? ' zu' : '') + '" data-aktion="karte" data-i="' + i + '" data-teil="' + i + '" aria-label="Befehl ' + (i + 1) + ': ' + NAMEN[b] + '"' + (L.laeuft ? ' disabled' : zu ? ' aria-disabled="true"' : '') + '>' +
        '<span class="nr">' + (i + 1) + '</span>' + sym(b) + '</button>';
    });
    box.innerHTML = '<div class="prog-zeile kobold-zeile" aria-label="Programm">' + html + '</div>';
  }

  function markiere(teil, innen, runde, art) {
    app.querySelectorAll('.programm .aktiv, .programm .stoss').forEach((e) => e.classList.remove('aktiv', 'stoss'));
    app.querySelectorAll('.programm .runde').forEach((e) => { e.textContent = ''; });
    if (teil === null || teil === undefined) return;
    const cls = art || 'aktiv';
    let el;
    if (innen !== null && innen !== undefined) {
      el = app.querySelector('.programm [data-teil="' + teil + '"][data-innen="' + innen + '"]');
      const kasten = app.querySelector('.programm .kasten-z[data-teil="' + teil + '"]');
      if (kasten) {
        kasten.classList.add(cls);
        const r = kasten.querySelector('.runde');
        if (r && runde !== null && runde !== undefined) r.textContent = 'Runde ' + (runde + 1);
      }
    } else el = app.querySelector('.programm [data-teil="' + teil + '"]');
    if (el) el.classList.add(cls);
  }

  // ----- Tasten -----
  // opt.aus: gesperrt (kein Tipp). opt.grau: nur grau dargestellt, ein Tipp zeigt eine freundliche Meldung, warum es nicht geht.
  function taste(aktion, inhalt, opt) {
    opt = opt || {};
    return '<button class="taste' + (opt.cls ? ' ' + opt.cls : '') + '" data-aktion="' + aktion + '"' +
      (opt.daten ? ' ' + opt.daten : '') + (opt.label ? ' aria-label="' + esc(opt.label) + '"' : '') +
      (opt.aus ? ' disabled' : opt.grau ? ' aria-disabled="true"' : '') + '>' + inhalt + '</button>';
  }
  function befehlsTaste(b, aus, grau) { return taste('befehl', sym(b), { cls: 'befehl befehl-' + b, daten: 'data-befehl="' + b + '"', label: NAMEN[b], aus, grau }); }
  function losTasten(aus, ausLos) {
    return '<div class="reihe">' +
      taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: Drache zurück an den Start' }) +
      taste('los', ICON.los + '<span>Los</span>', { cls: 'breit los', aus: aus || ausLos }) +
      '</div>';
  }

  function zeichneTasten() {
    const box = app.querySelector('.tasten');
    if (!box) return;
    const lauf = L.laeuft;
    if (L.art === 'ablauf') {
      box.innerHTML = '<div class="reihe">' +
        taste('karte-zurueck', ICON.weg, { cls: 'befehl', label: 'Letzte Karte zurück', aus: lauf || !L.reihe.length }) +
        taste('nochmal', '<span>Nochmal</span>', { cls: 'breit' }) +
        taste('los', ICON.los + '<span>Los</span>', { cls: 'breit los', aus: lauf || L.reihe.length !== L.karten.length }) +
        '</div>';
      return;
    }
    if (L.art === 'kobold') {
      const a = L.auswahl;
      if (a && !lauf) {
        let r = '';
        for (const b of K.BEFEHLE) r += befehlsTaste(b, L.prog[a.i] === b);
        r += taste('abbrechen', '<span>zurück</span>', { cls: 'zurueck', label: 'zurück, nichts ändern' });
        box.innerHTML = '<p class="tasten-frage">Befehl ' + (a.i + 1) + ' austauschen gegen:</p><div class="reihe">' + r + '</div>';
      } else {
        box.innerHTML = '<div class="reihe">' +
          taste('neu', sym('kobold') + '<span>Neu</span>', { cls: 'breit', label: 'Kobold-Programm wie am Anfang', aus: lauf }) +
          taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: Drache zurück an den Start' }) +
          taste('los', ICON.los + '<span>Los</span>', { cls: 'breit los', aus: lauf || !L.prog.length }) +
          '</div>';
      }
      return belegungMerken(box);
    }
    // Pfad
    if (L.wahl === 'zahl') {
      let r = '';
      for (let w = K.WDH_MIN; w <= K.WDH_MAX; w++) r += taste('zahl', '<span>' + w + '</span>', { cls: 'befehl zahl', daten: 'data-zahl="' + w + '"', label: w + '-mal' });
      r += taste('abbrechen', ICON.kreuz, { cls: 'befehl', label: 'Doch nicht' });
      box.innerHTML = '<p class="tasten-frage">Wie oft?</p><div class="reihe">' + r + '</div>' + losTasten(true);
      return belegungMerken(box);
    }
    const k = offenerKasten();
    const voll = kartenZahl() >= grenze() || (k && k.befehle.length >= MAX_INNEN);
    let r = '';
    for (const b of K.BEFEHLE) r += befehlsTaste(b, lauf, voll);
    if (k) r += taste('fertig', '<span>fertig</span>', { cls: 'befehl zauber-fertig', label: 'Zauber-Kasten fertig', aus: lauf });
    else if (L.lv.zauber) r += taste('zauber', zauberIcon, { cls: 'befehl zauber', label: 'Zauber-Kasten', aus: lauf, grau: kartenZahl() + 2 > grenze() });
    r += taste('loeschen', ICON.weg, { cls: 'befehl', label: 'Letzten Befehl löschen', aus: lauf || !L.prog.length });
    box.innerHTML = '<div class="reihe">' + r + '</div>' + losTasten(false, lauf || !programmDaten().length);
    belegungMerken(box);
  }

  // Doppeltipp-Schutz: Wechselt die Belegung der Tasten (Wie oft?, Zauber-Kasten auf/zu, Kobold-Auswahl),
  // liegt an der getippten Stelle oft eine andere Taste. Der zweite Tipp eines Doppeltipps würde sie sofort
  // auslösen. Darum nach jedem Wechsel kurz keine Tipps auf Programm und Tasten (data-sperre am #app).
  let sperreBis = 0;
  let sperreTimer = null;
  function sperren() {
    sperreBis = Date.now() + SPERRE;
    app.dataset.sperre = '1';
    clearTimeout(sperreTimer);
    sperreTimer = setTimeout(() => { delete app.dataset.sperre; }, SPERRE);
  }
  function belegungMerken(box) {
    const b = Array.from(box.querySelectorAll('[data-aktion]'), (t) => t.dataset.aktion + (t.dataset.befehl || '') + (t.dataset.zahl || '')).join(',');
    if (L.belegung !== undefined && L.belegung !== b) sperren();
    L.belegung = b;
  }

  // ----- Ändern (Pfad) -----
  function vorAenderung() {
    if (L.laeuft) return false;
    if (L.ergebnis) { dracheZurueck(); grundMeldung(); }
    return true;
  }
  function befehlDazu(b) {
    if (!vorAenderung()) return;
    if (L.art === 'kobold') return koboldSetzen(b);
    const k = offenerKasten();
    if (kartenZahl() + 1 > grenze()) {
      if (k) meldung('Mehr Karten gehen nicht. Tippe auf „fertig“.', 'zauber-meldung');
      else if (L.lv.maxKarten) meldung('Mehr Karten gehen nicht. Probier den Zauber-Kasten!', 'hinweis');
      else meldung('Mehr als ' + grenze() + ' Befehle passen nicht.', 'hinweis');
      return;
    }
    if (k && k.befehle.length >= MAX_INNEN) {
      meldung('Der Zauber-Kasten ist voll. Tippe auf „fertig“.', 'zauber-meldung');
      return;
    }
    if (k) k.befehle.push(b);
    else L.prog.push(b);
    zeichneProgramm(); zeichneTasten();
    if (k) {
      const voll = k.befehle.length >= MAX_INNEN || kartenZahl() >= grenze();
      meldung(voll ? 'Tippe auf „fertig“.' : 'Noch ein Befehl in den Zauber-Kasten? Sonst tippe auf „fertig“.', 'zauber-meldung');
    }
  }
  function loeschen() {
    if (!vorAenderung()) return;
    const k = offenerKasten();
    if (k) {
      if (k.befehle.length) k.befehle.pop();
      else { L.prog.pop(); grundMeldung(); }
    } else L.prog.pop();
    zeichneProgramm(); zeichneTasten();
  }
  function zauberStart() {
    if (!vorAenderung()) return;
    if (offenerKasten()) return;
    if (kartenZahl() + 2 > grenze()) {
      meldung('Für einen Zauber-Kasten ist kein Platz mehr. Lösche zuerst einen Befehl.', 'hinweis');
      return;
    }
    L.wahl = 'zahl';
    zeichneProgramm(); zeichneTasten();
    meldung('Wie oft soll der Zauber-Kasten wiederholen?', 'zauber-meldung');
  }
  function zauberZahl(w) {
    L.wahl = null;
    L.prog.push({ wdh: w, befehle: [], offen: true });
    zeichneProgramm(); zeichneTasten();
    meldung('Tippe die Befehle für den Zauber-Kasten an. Dann „fertig“.', 'zauber-meldung');
  }
  function zauberFertig() {
    const k = offenerKasten();
    if (k) {
      if (k.befehle.length) k.offen = false;
      else L.prog.pop();
    }
    zeichneProgramm(); zeichneTasten(); grundMeldung();
  }

  // ----- Ändern (Kobold): antippen, kein Ziehen -----
  // Der Kobold versteckt genau einen Fehler: nur so viele Befehle tauschen, wie es braucht.
  // Ist schon getauscht, bleibt nur dieser Befehl änderbar; „Neu“ gibt alle wieder frei.
  const MAX_TAUSCH = 1;
  function getauscht() { return L.prog.filter((b, i) => b !== L.orig[i]).length; }
  function koboldZu(i) { return getauscht() >= MAX_TAUSCH && L.prog[i] === L.orig[i]; }
  function koboldWaehle(i) {
    if (!vorAenderung()) return;
    if (koboldZu(i)) return meldung('Du hast schon einen Befehl getauscht. Der Kobold versteckt nur einen Fehler. Für einen anderen tippe auf „Neu“.', 'hinweis', sym('kobold'));
    const a = L.auswahl;
    L.auswahl = a && a.i === i ? null : { i };
    zeichneProgramm(); zeichneTasten();
    if (!L.auswahl) grundMeldung();
    else meldung('Tippe unten den richtigen Befehl an.', 'hinweis');
  }
  function koboldSetzen(b) {
    const a = L.auswahl;
    if (!a) return;
    L.prog[a.i] = b;
    L.auswahl = null;
    zeichneProgramm(); zeichneTasten(); grundMeldung();
  }

  // ----- Los: Programm ausführen, Schritt für Schritt -----
  function los() {
    if (L.laeuft) return;
    if (L.art === 'ablauf') return pruefeAblauf();
    // offenen Zauber-Kasten schließen, leere weglassen
    const k = offenerKasten();
    if (k) { if (k.befehle.length) k.offen = false; else L.prog.pop(); }
    L.wahl = null;
    L.auswahl = null;
    const prog = programmDaten();
    if (!prog.length) { meldung('Tippe zuerst Befehle an.', 'hinweis'); return; }
    dracheZurueck();
    const e = K.ausfuehren(L.welt, prog);
    L.laeuft = true;
    zeichneProgramm(); zeichneTasten();
    meldung('Der Drache läuft …', 'laeuft', sym('drache'));
    let n = 0;
    const weiter = () => {
      if (!L || !L.laeuft) return;
      if (n < e.schritte.length) {
        const s = e.schritte[n];
        markiere(s.teil, s.innen, s.runde);
        if (s.befehl === 'links') L.winkel -= 90;
        if (s.befehl === 'rechts') L.winkel += 90;
        dracheSetzen(s.nachher, false);
        const key = s.nachher.x + ',' + s.nachher.y;
        if ((L.welt.edelsteine || []).some((g) => g[0] + ',' + g[1] === key) && !L.gesammelt.some((g) => g[0] + ',' + g[1] === key)) {
          L.gesammelt.push([s.nachher.x, s.nachher.y]);
          zeichneFeld();
        }
        n++;
        L.timer = setTimeout(weiter, TEMPO);
      } else fertig(e, prog);
    };
    L.timer = setTimeout(weiter, Math.min(250, TEMPO));
  }

  function fertig(e, prog) {
    L.laeuft = false;
    L.timer = null;
    if (e.stoss) {
      L.ergebnis = 'stoss';
      L.stossFeld = { x: L.drache.x, y: L.drache.y };
      zeichneFeld();
      zeichneProgramm(); zeichneTasten();
      markiere(e.stoss.teil, e.stoss.innen, e.stoss.runde, 'stoss');
      meldung('Hier hat der Kobold zugeschlagen!', 'stoss', sym('kobold'));
      return;
    }
    zeichneProgramm(); zeichneTasten();
    if (e.geschafft) { L.ergebnis = 'geschafft'; return geschafft(prog); }
    L.ergebnis = 'nicht';
    const fehlen = (L.welt.edelsteine || []).length - e.gesammelt;
    if (e.amZiel && fehlen > 0) meldung('Fast! Es fehlen noch Edelsteine.', 'hinweis', sym('edelstein'));
    else meldung('Der Drache ist noch nicht beim ' + zielWort() + '. Probier es nochmal!', 'hinweis', sym(L.lv.zielSymbol || 'schatz'));
  }

  // ----- Geschafft -----
  function geschafft(prog) {
    const lv = L.lv;
    let stern = true;
    let zusatz = '';
    if (L.art === 'pfad') {
      const karten = K.karten(prog);
      if (lv.aufgabe === 'kuerzestes' && !lv.zauber && lv.kuerzeste && karten > lv.kuerzeste) {
        stern = false;
        zusatz = 'Der Drache ist da! Aber es geht kürzer: mit ' + lv.kuerzeste + ' Befehlen.';
      } else if (lv.zauber && lv.minKarten && karten > lv.minKarten) {
        zusatz = 'Profi-Frage: Geht es auch mit ' + lv.minKarten + ' Karten?';
      }
    }
    if (stern) { speicher.sterne[lv.id] = 1; sichere(); }
    const letztes = L.i === L.p.levels.length - 1;
    const punkte = app.querySelectorAll('.punkte .punkt');
    if (stern && punkte[L.i]) punkte[L.i].classList.add('voll');
    meldung(stern ? 'Geschafft!' : 'Fast!', stern ? 'gut' : 'hinweis', sym(stern ? 'stern' : 'sternLeer'));
    const d = document.createElement('div');
    d.className = 'dialog-hintergrund';
    // Unten (hoch) bzw. rechts (quer) angedockt, damit man den Drachen am Ziel im Gitter sieht.
    // „Nochmal“ wirkt wie die Taste im Level: Drache zurück an den Start, das Programm bleibt.
    d.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-titel">' +
      '<div class="dialog-kopf"><div class="dialog-stern">' + sym(stern ? 'stern' : 'sternLeer') + '</div>' +
      '<h2 id="dialog-titel">' + (stern ? 'Geschafft!' : 'Fast geschafft!') + '</h2></div>' +
      (zusatz ? '<p>' + esc(zusatz) + '</p>' : '') +
      '<div class="reihe">' +
      taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: L.art === 'ablauf' ? 'Nochmal: alle Karten zurück' : 'Nochmal: Drache zurück an den Start' }) +
      taste('weiter', '<span>' + (letztes ? 'Fertig' : 'Weiter') + '</span>' + ICON.los, { cls: 'breit los' }) +
      '</div></div>';
    app.querySelector('.spiel').appendChild(d);
    const w = d.querySelector('[data-aktion="weiter"]');
    if (w) w.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------
  // Ablauf-Karten: gemischt anzeigen, in Reihenfolge antippen
  // ---------------------------------------------------------------------
  function mische(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function starteAblauf() {
    const regeln = L.lv.regeln || [];
    let karten = mische(L.lv.karten);
    // nicht zufällig schon richtig gemischt
    for (let v = 0; v < 40 && karten.length > 1 && K.pruefeReihenfolge(regeln, karten.map((k) => k.id)).ok; v++) karten = mische(L.lv.karten);
    L.karten = karten;
    L.reihe = [];
    L.vertauscht = null;
    L.tauschen = false;   // nach dem Prüfen: zwei Karten antippen, sie tauschen den Platz
    L.tauschWahl = null;
    L.ergebnis = null;
    zeichneAblaufKarten();
  }
  function zeichneAblaufKarten() {
    const feld = app.querySelector('.feld');
    let html = '';
    for (const k of L.karten) {
      const nr = L.reihe.indexOf(k.id);
      const bild = bildVon(k.bild);
      const vt = L.vertauscht && L.vertauscht.indexOf(k.id) >= 0;
      const gew = L.tauschWahl === k.id;
      html += '<button class="ablauf-karte' + (nr >= 0 ? ' gesetzt' : '') + (vt ? ' vertauscht' : '') + (gew ? ' gewaehlt' : '') + (bild ? '' : ' ohne-bild') + '" data-aktion="ablauf" data-id="' + esc(k.id) + '"' + (L.laeuft ? ' disabled' : '') + '>' +
        '<span class="nummer">' + (nr >= 0 ? nr + 1 : '') + '</span>' +
        (bild ? '<span class="bild">' + bild + '</span>' : '') +
        '<span class="text">' + esc(k.text) + '</span>' +
        (vt || gew ? '<span class="tausch">' + ICON.tauschen + '</span>' : '') +
        '</button>';
    }
    feld.innerHTML = '<div class="karten-feld' + (L.tauschen ? ' tauschen' : '') + '" data-n="' + L.karten.length + '">' + html + '</div>';
  }
  function zeichneAblaufReihe() {
    const box = app.querySelector('.programm');
    let html = '';
    L.karten.forEach((x, i) => {
      const id = L.reihe[i];
      const k = id ? L.lv.karten.find((c) => c.id === id) : null;
      const bild = k ? bildVon(k.bild) : '';
      html += '<span class="ablauf-platz' + (k ? ' voll' : '') + '"><span class="platz-nr">' + (i + 1) + '</span>' + (bild ? '<span class="platz-bild">' + bild + '</span>' : '') + '</span>';
    });
    box.innerHTML = '<div class="ablauf-reihe" aria-hidden="true">' + html + '</div>';
  }
  function ablaufZeichnen() { zeichneAblaufKarten(); zeichneAblaufReihe(); zeichneTasten(); }
  function ablaufTippen(id) {
    if (L.laeuft || L.ergebnis === 'geschafft') return;
    if (L.tauschen) return ablaufTauschen(id);
    if (L.vertauscht) { L.vertauscht = null; grundMeldung(); }
    const i = L.reihe.indexOf(id);
    if (i >= 0) L.reihe.splice(i, 1);
    else L.reihe.push(id);
    ablaufZeichnen();
    if (L.reihe.length === L.karten.length) meldung('Alle Karten liegen. Tippe auf „Los“!', 'hinweis', ICON.karten);
  }
  // Nach dem Prüfen liegen alle Karten in der getippten Reihenfolge: erst eine Karte antippen, dann eine zweite,
  // die beiden wechseln den Platz. Dieselbe Karte nochmal antippen = doch nicht.
  function ablaufTauschen(id) {
    if (!L.tauschWahl) {
      L.tauschWahl = id;
      ablaufZeichnen();
      return meldung('Jetzt die Karte antippen, mit der sie den Platz tauscht.', 'hinweis', ICON.tauschen);
    }
    if (L.tauschWahl === id) {
      L.tauschWahl = null;
      ablaufZeichnen();
      return meldung('Tippe zwei Karten an, dann tauschen sie den Platz.', 'hinweis', ICON.tauschen);
    }
    const a = L.reihe.indexOf(L.tauschWahl), b = L.reihe.indexOf(id);
    [L.reihe[a], L.reihe[b]] = [L.reihe[b], L.reihe[a]];
    L.karten = L.reihe.map((k) => L.lv.karten.find((c) => c.id === k));
    L.tauschWahl = null;
    L.vertauscht = null;
    L.ergebnis = null;
    ablaufZeichnen();
    meldung('Getauscht! Tippe auf „Los“ oder tausche noch einmal.', 'hinweis', ICON.karten);
  }
  function ablaufZurueck(alle) {
    if (L.laeuft) return;
    if (alle) {           // alle Karten zurück, neu gemischt
      starteAblauf();
      ablaufZeichnen(); grundMeldung();
      return;
    }
    L.vertauscht = null;
    L.ergebnis = null;
    L.tauschen = false;
    L.tauschWahl = null;
    L.reihe.pop();
    ablaufZeichnen(); grundMeldung();
  }
  // Wie viele Regeln (auch über Zwischenschritte: a vor b und b vor c heißt a vor c) sind verletzt?
  function ablaufFehler(reihe) {
    const vor = new Map();
    for (const [a, b] of L.lv.regeln || []) { if (!vor.has(a)) vor.set(a, new Set()); vor.get(a).add(b); }
    const pos = {};
    reihe.forEach((id, i) => { pos[id] = i; });
    let n = 0;
    for (const a of reihe) {
      const gesehen = new Set(), stapel = [...(vor.get(a) || [])];
      while (stapel.length) {
        const b = stapel.pop();
        if (gesehen.has(b)) continue;
        gesehen.add(b);
        if (pos[b] !== undefined && pos[b] < pos[a]) n++;
        stapel.push(...(vor.get(b) || []));
      }
    }
    return n;
  }
  function pruefeAblauf() {
    if (L.reihe.length !== L.karten.length) return;
    const t = K.pruefeReihenfolge(L.lv.regeln || [], L.reihe);
    // Karten in der getippten Reihenfolge hinlegen, damit man das Programm lesen kann
    L.karten = L.reihe.map((id) => L.lv.karten.find((c) => c.id === id));
    L.tauschWahl = null;
    if (t.ok) {
      L.ergebnis = 'geschafft';
      L.tauschen = false;
      ablaufZeichnen();
      return geschafft(L.reihe.slice());
    }
    L.ergebnis = 'nicht';
    L.tauschen = true;
    // Rot markiert wird das Paar, dessen Tausch am meisten hilft (es gibt immer eines: zwei Karten, die falsch herum liegen)
    const jetzt = ablaufFehler(L.reihe);
    let best = null, bestN = jetzt;
    for (let i = 0; i < L.reihe.length; i++) {
      for (let j = i + 1; j < L.reihe.length; j++) {
        const r = L.reihe.slice();
        [r[i], r[j]] = [r[j], r[i]];
        const n = ablaufFehler(r);
        if (n < bestN) { bestN = n; best = [L.reihe[i], L.reihe[j]]; }
      }
    }
    L.vertauscht = best || t.verletzt[0].slice();
    ablaufZeichnen();
    meldung(bestN === 0
      ? 'Fast! Tausche die zwei roten Karten: Tippe beide an.'
      : 'Fast! Tausche zuerst die zwei roten Karten: Tippe beide an.', 'hinweis', ICON.tauschen);
  }

  // ---------------------------------------------------------------------
  // Eingaben: alles über Antippen (click), kein Ziehen, kein Hover
  // ---------------------------------------------------------------------
  const UMSCHALTER = ['ablauf', 'karte', 'stelle'];
  let letzterUmschalter = null;
  app.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-aktion]');
    if (!b || b.disabled || !app.contains(b)) return;
    const a = b.dataset.aktion;
    // Doppeltipp-Schutz (siehe sperren): kurz nach einem Wechsel der Tasten zählt kein Tipp auf Programm und Tasten,
    // und eine Karte, die beim Antippen umschaltet, schaltet bei einem Doppeltipp nicht gleich wieder zurück
    if (L && b.closest('.programm, .tasten, .feld')) {
      const jetzt = Date.now();
      if (jetzt < sperreBis) return;
      if (UMSCHALTER.includes(a)) {
        const wer = a + ':' + (b.dataset.id || b.dataset.i || '');
        if (letzterUmschalter && letzterUmschalter.wer === wer && jetzt - letzterUmschalter.zeit < SPERRE) return;
        letzterUmschalter = { wer, zeit: jetzt };
      }
    }
    switch (a) {
      case 'heim': return geh('#');
      case 'eltern': return geh('#eltern');
      case 'paket': return geh('#' + b.dataset.paket);
      case 'level': return geh('#' + b.dataset.paket + '/' + (parseInt(b.dataset.i, 10) + 1));
      case 'loeschen-frage': return loeschenFrage();
      case 'loeschen-ja':
        speicher = { sterne: {}, name: speicher.name };
        sichere();
        return zeigeEltern('Gelöscht. Alle Sterne sind weg.');
      case 'loeschen-nein': return zeigeEltern();
    }
    if (!L) return;
    switch (a) {
      case 'befehl': return befehlDazu(b.dataset.befehl);
      case 'loeschen': return loeschen();
      case 'zauber': return zauberStart();
      case 'zahl': return zauberZahl(parseInt(b.dataset.zahl, 10));
      case 'fertig': return zauberFertig();
      case 'abbrechen':
        L.wahl = null; L.auswahl = null;
        zeichneProgramm(); zeichneTasten(); grundMeldung();
        return;
      case 'karte': return koboldWaehle(parseInt(b.dataset.i, 10));
      case 'neu':
        if (L.laeuft) return;
        L.prog = L.orig.slice(); L.auswahl = null;
        dracheZurueck(); zeichneProgramm(); zeichneTasten(); grundMeldung();
        return;
      case 'los': return los();
      case 'nochmal': {
        // im Level und im Geschafft-Fenster gleich: Drache zurück an den Start, das Programm bleibt
        // (Ablauf-Karten: alle Karten zurück)
        stoppe();
        const d = app.querySelector('.dialog-hintergrund');
        if (d) { d.remove(); sperren(); }   // unter dem Fenster liegen Tasten: kein Doppeltipp auf sie
        if (L.art === 'ablauf') return ablaufZurueck(true);
        L.wahl = null; L.auswahl = null;
        dracheZurueck(); zeichneProgramm(); zeichneTasten(); grundMeldung();
        return;
      }
      case 'ablauf': return ablaufTippen(b.dataset.id);
      case 'karte-zurueck': return ablaufZurueck(false);
      case 'weiter': {
        const p = L.p, i = L.i;
        return geh('#' + p.paket + '/' + (i + 1 < p.levels.length ? i + 2 : 'ende'));
      }
    }
  });

  app.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    if (f.dataset.form === 'eltern') pruefeEltern(f);
    else if (f.dataset.form === 'name') {
      speicher.name = (f.elements.name.value || '').trim().slice(0, 30);
      sichere();
      if (document.activeElement) document.activeElement.blur();
      zeigeEltern(speicher.name ? 'Gespeichert.' : 'Name gelöscht.');
    }
  });

  window.addEventListener('hashchange', () => { if (location.hash !== gezeigt) route(); });
  route();

  // Offline: Service Worker (relativer Pfad, Seite liegt unter /<repo>/).
  // Nach einem Update übernimmt der neue Service Worker (controllerchange). Die Seite lief dann noch mit den
  // alten Dateien: einmal neu laden, sobald gerade kein Level und kein Formular offen ist (Startseite,
  // Paket, Paket-Ende). So kommen nach einem Update sicher die neuen Levels.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const hatteSteuerung = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hatteSteuerung) return;   // erste Installation: die Seite ist schon aktuell
      neueVersion = true;
      neuLadenWennRuhig();
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        // Bleibt die App im Speicher (iPad), beim Zurückkommen nach einer neuen Version fragen
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => { /* offline */ });
        });
      }).catch(() => { /* ohne Offline geht es auch */ });
    });
  }
})();
