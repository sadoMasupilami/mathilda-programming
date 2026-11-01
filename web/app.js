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
   Ab Block C (plan/lehrplan.md 7.8, Leitfaden 4b): Pfad-Levels mit "erlaubt"
   und/oder "welten" bekommen Wenn-dann-Kasten, Zauber-Kasten „bis zum Schatz“,
   Zaubersprüche (vorgegeben oder selbst geschrieben) und mehrere Gitter
   (Klasse .erw; alles nur Antippen, gleiche Farben wie am Papier).

   Spiel-Plugins für weitere Rätselarten (web/spiele/<art>.js, eine Datei pro Art,
   optional web/spiele/<art>.css; web-bauen.mjs bindet sie VOR app.js ein, damit schon die erste
   Ansicht – QR-Code, Lesezeichen, Neuladen eines Levels – das Spiel kennt):
     window.WerkstattSpiele = window.WerkstattSpiele || {};
     window.WerkstattSpiele['<art>'] = {
       icon(paket, api)       Bild für Kachel und Paket-Seite (SVG-Text), optional
       start(api)             Level aufbauen: api.feld, api.programm, api.tasten füllen
       grundMeldung(api)      Meldung am Anfang, optional
       klick(aktion, el, api) eigene Tasten (data-aktion="…"), alles außer heim/weiter/level/paket
       los(api)               Taste data-aktion="los", optional
       nochmal(api)           Taste data-aktion="nochmal" (auch im Geschafft-Fenster); ohne: start(api) neu
       stopp(api)             Level wird verlassen, optional (api.spaeter-Timer stoppt der Kern selbst)
     };
   api: lv (Level-Daten), paket, nr (0-basiert), feld, programm, tasten (DOM), zustand ({} für das Plugin),
        meldung(text, art, icon), geschafft({ stern = true, zusatz }), taste(aktion, inhalt, opt),
        befehlsTaste(b, aus, grau), sym(name), esc(s), bild(name), K, S, spaeter(fn, ms), belegung(box),
        sperren(), TEMPO, ICON, laeuft(true|false)
   Antippen wie überall: data-aktion an <button>. Elemente, die beim Antippen umschalten (an/aus),
   bekommen data-umschalter: ein Doppeltipp schaltet sie dann nicht gleich wieder zurück.
   Bewertet wird nur nach dem Ergebnis, mit derselben Kern-Datei wie der Löser (web/kern/<art>.js).
   ===================================================================== */
(function () {
  'use strict';

  const K = window.WerkstattKern;
  const S = window.WerkstattSymbole;
  const BILDER = window.WerkstattBilder || null;
  const DATEN = window.WERKSTATT_DATEN || { pakete: [] };
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  // Blöcke wie im Heft (src/components.js, blockVon): 1–5 A, 6–10 B, 11–14 C, ab 15 D
  const BLOECKE = [
    { b: 'a', titel: 'Befehle, Programme, Fehler', von: 1, bis: 5 },
    { b: 'b', titel: 'Muster und Geheimcodes', von: 6, bis: 10 },
    { b: 'c', titel: 'Wenn-dann und Logik', von: 11, bis: 14 },
    { b: 'd', titel: 'Strategie und Projekte', von: 15, bis: 99 },
  ];
  const blockVon = (n) => BLOECKE.find((x) => n >= x.von && n <= x.bis) || BLOECKE[0];
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
    if (neueVersion && ['start', 'block', 'paket', 'ende'].includes(document.body.dataset.ansicht)) {
      neueVersion = false;
      location.reload();
    }
  }
  let elternFrage = null;
  let elternOffen = false;

  function stoppe() {
    if (L && L.timer) { clearTimeout(L.timer); L.timer = null; }
    if (L && L.timers) { L.timers.forEach(clearTimeout); L.timers = []; }
    if (L && L.spiel && L.spiel.stopp && !L.gestoppt) { L.gestoppt = true; try { L.spiel.stopp(L.api); } catch (e) { /* nichts */ } }
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
    const mb = /^block-([a-d])$/i.exec(h);
    if (mb) {
      const bl = BLOECKE.find((x) => x.b === mb[1].toLowerCase());
      if (paketeIm(bl).length) return zeigeBlock(bl);
    }
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
    const sp = SPIELE[p.art];
    if (sp && sp.icon) { try { const i = sp.icon(p, apiBasis()); if (i) return i; } catch (e) { /* Standard-Bild */ } }
    if (p.art === 'gemischt') return '<span class="fest-icon">' + sym('stern') + '</span>';
    if (p.art === 'kobold') return sym('kobold');
    if (p.art === 'ablauf') return ICON.karten;
    // ab Block C: das Bild des neuen Kastens (Zauberspruch, „bis zum Schatz“, Wenn-dann)
    const erl = (x) => p.levels.some((l) => Array.isArray(l.erlaubt) && l.erlaubt.includes(x));
    if (erl('spruch')) return sym('spruch-stern');
    if (erl('bis')) return sym('bis');
    if (erl('wenn') || p.levels.some((l) => Array.isArray(l.welten))) return sym('wenn');
    if (hatZauber(p)) return '<span class="zk-gross"><b>3-mal</b>' + sym('drache') + '</span>';
    return sym('drache');
  }
  function paketKachel(p) {
    const n = sterneVon(p);
    return '<button class="kachel" data-aktion="paket" data-paket="' + p.paket + '" data-block="' + blockVon(p.einheit).b + '">' +
      '<span class="kachel-nr">' + p.einheit + '</span>' +
      '<span class="kachel-bild">' + paketIcon(p) + '</span>' +
      '<span class="kachel-titel">' + esc(p.titel) + '</span>' +
      '<span class="kachel-stand"><span class="mini-stern">' + sym(n === p.levels.length ? 'stern' : 'sternLeer') + '</span>' + n + ' von ' + p.levels.length + '</span>' +
      '</button>';
  }
  function paketeIm(bl) { return DATEN.pakete.filter((p) => blockVon(p.einheit) === bl); }
  // Startseite: liegen die Pakete in mehreren Blöcken, zuerst die Blöcke (so passt alles ohne Scrollen
  // auf ein kleines Handy), sonst gleich die Pakete. Der QR-Code am Blatt führt immer direkt zum Paket.
  function zeigeStart() {
    const name = speicher.name ? ', ' + esc(speicher.name) : '';
    const bloecke = BLOECKE.filter((bl) => paketeIm(bl).length);
    let kacheln = '';
    let n = 0;
    if (bloecke.length > 1) {
      for (const bl of bloecke) {
        const ps = paketeIm(bl);
        const st = ps.reduce((a, p) => a + sterneVon(p), 0), alle = ps.reduce((a, p) => a + p.levels.length, 0);
        const von = Math.min(...ps.map((p) => p.einheit)), bis = Math.max(...ps.map((p) => p.einheit));
        kacheln += '<button class="kachel block-kachel" data-aktion="block" data-block="' + bl.b + '">' +
          '<span class="kachel-nr block-nr">' + bl.b.toUpperCase() + '</span>' +
          '<span class="block-bilder">' + ps.slice(0, 3).map((p) => '<span class="kachel-bild">' + paketIcon(p) + '</span>').join('') + '</span>' +
          '<span class="kachel-titel">' + esc(bl.titel) + '</span>' +
          '<span class="kachel-stand"><span class="block-einheiten">' + (von === bis ? 'Einheit ' + von : 'Einheit ' + von + '–' + bis) + '</span>' +
          '<span class="mini-stern">' + sym(st === alle ? 'stern' : 'sternLeer') + '</span>' + st + ' von ' + alle + '</span>' +
          '</button>';
        n++;
      }
    } else {
      for (const p of DATEN.pakete) { kacheln += paketKachel(p); n++; }
    }
    if (!kacheln) kacheln = '<p class="leer-hinweis">Hier gibt es noch keine Pakete.</p>';
    ansicht('start',
      '<section class="ansicht start">' +
      '<header class="start-kopf"><span class="start-drache">' + sym('drache') + '</span>' +
      '<div><h1>Denk-Werkstatt</h1><p class="gruss">Hallo' + name + '! ' + (bloecke.length > 1 ? 'Was spielst du?' : 'Welches Paket?') + '</p></div></header>' +
      '<div class="kacheln" data-n="' + n + '">' + kacheln + '</div>' +
      '<footer class="start-fuss"><button class="taste klein-taste" data-aktion="eltern">Für Erwachsene</button></footer>' +
      '</section>');
  }
  function zeigeBlock(bl) {
    const ps = paketeIm(bl);
    ansicht('block',
      '<section class="ansicht start block-ansicht" data-block="' + bl.b + '">' +
      '<header class="kopf">' + heimKnopf() + '<span class="kopf-titel">' + esc(bl.titel) + '</span></header>' +
      '<div class="kacheln" data-n="' + ps.length + '">' + ps.map(paketKachel).join('') + '</div>' +
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
      '<section class="ansicht paket" data-block="' + blockVon(p.einheit).b + '">' +
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
  // Mehrere Gitter ("welten": ein Programm für alle). Fehlende Felder einer Welt kommen aus dem Level
  // (gleich wie weltenVon in werkzeuge/raetsel.mjs).
  function weltenVon(l) {
    if (!Array.isArray(l.welten) || !l.welten.length) return [weltVon(l)];
    return l.welten.map((w) => Object.assign(weltVon(l), weltVon(w || {})));
  }
  // Pfad-Level mit erweiterten Befehlen (plan/lehrplan.md 7.8): "erlaubt" (zauber, wenn, bis, spruch) und/oder "welten".
  // Sie bekommen die Tasten für Wenn-dann-Kasten, „bis zum Schatz“ und Zaubersprüche (Klasse .erw).
  const istErweitert = (l) => l.art === 'pfad' && (l.erlaubt !== undefined || l.welten !== undefined);
  const darf = (x) => !!L && Array.isArray(L.erlaubt) && L.erlaubt.includes(x);

  // Schnittstelle für Spiel-Plugins (siehe Kopf der Datei)
  function apiBasis() {
    return { sym, esc, bild: bildVon, K, S, TEMPO, ICON, taste, befehlsTaste };
  }
  function pluginApi() {
    const a = apiBasis();
    Object.assign(a, {
      lv: L.lv, paket: L.p, nr: L.i, zustand: L.zustand,
      feld: app.querySelector('.feld'), programm: app.querySelector('.programm'), tasten: app.querySelector('.tasten'),
      meldung,
      geschafft: (o) => geschafftDialog(!o || o.stern !== false, (o && o.zusatz) || ''),
      spaeter: (fn, ms) => { const t = setTimeout(() => { L.timers = (L.timers || []).filter((x) => x !== t); fn(); }, ms); (L.timers = L.timers || []).push(t); return t; },
      belegung: (box) => belegungMerken(box || app.querySelector('.tasten')),
      sperren,
      laeuft: (j) => { if (j !== undefined) L.laeuft = !!j; return L.laeuft; },
    });
    return a;
  }

  function zeigeLevel(p, i) {
    const lv = p.levels[i];
    const sp = SPIELE[lv.art] || null;
    const art = sp ? lv.art : lv.art === 'kobold' ? 'kobold' : lv.art === 'ablauf' ? 'ablauf' : 'pfad';
    const erw = !sp && istErweitert(lv);
    let punkte = '';
    p.levels.forEach((l, j) => {
      punkte += '<span class="punkt' + (speicher.sterne[l.id] ? ' voll' : '') + (j === i ? ' jetzt' : '') + '"></span>';
    });
    const tempo = Math.round(Math.min(450, TEMPO * 0.75));
    ansicht('level',
      '<section class="ansicht spiel art-' + art + (sp ? ' plugin' : '') + (erw ? ' erw' : '') + '" data-level="' + esc(lv.id) + '" data-block="' + blockVon(p.einheit).b + '" style="--tempo:' + tempo + 'ms">' +
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
    L = { p, i, lv, art, erw, tempo, laeuft: false, timer: null, timers: [], ergebnis: null, auswahl: null, wahl: null };
    if (sp) {
      L.spiel = sp;
      L.zustand = {};
      L.api = pluginApi();
      sp.start(L.api);
      if (sp.grundMeldung) sp.grundMeldung(L.api);
      return;
    }
    if (art === 'ablauf') starteAblauf();
    else {
      L.welten = weltenVon(lv);
      L.welten.forEach((w) => K.welt(w));   // ein kaputtes Gitter fällt sofort auf
      // Was das Kind benutzen darf. Einheit 5: "zauber": true; ab Block C: "erlaubt"
      L.erlaubt = erw ? (lv.erlaubt || []).slice() : lv.zauber ? ['zauber'] : [];
      L.bedingungen = darf('wenn') ? (lv.bedingungen || ['stein', 'frei']).filter((c) => K.BEDINGUNGEN.includes(c)) : [];
      L.sprFest = darf('spruch') ? K.liesSprueche(lv.sprueche || {}) : {};
      L.spruchFrei = darf('spruch') ? (lv.spruchFrei || []).filter((n) => K.SPRUCH_NAMEN.includes(n) && !L.sprFest[n]) : [];
      L.spr = {};
      L.spruchFrei.forEach((n) => { L.spr[n] = []; });
      // Einen eigenen Zauberspruch schreibt das Kind zuerst (dann ruft es ihn im Programm auf)
      L.ziel = L.spruchFrei.length ? L.spruchFrei[0] : null;
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
  function zielMitArtikel() { return ({ ziel: 'das Ziel', stern: 'den Stern' })[L.lv.zielSymbol] || 'den Schatz'; }
  function grundMeldung() {
    const lv = L.lv;
    if (L.art === 'ablauf') return meldung((lv.titel ? lv.titel + ': ' : '') + 'Tippe die Karten der Reihe nach an.', '', ICON.karten);
    if (L.art === 'kobold') return meldung('Ein Befehl ist falsch! Tippe ihn an und tausche ihn aus.', '', sym('kobold'));
    const zs = lv.zielSymbol || 'schatz';
    if (L.erw) {
      if (L.ziel) return spruchMeldung();
      const karten = lv.maxKarten ? ' Höchstens ' + lv.maxKarten + ' Karten.' : '';
      const n = L.welten.length;
      if (n > 1) return meldung('Ein Programm für ' + (n === 2 ? 'beide' : 'alle ' + n) + ' Gitter!' + karten, '', sym(zs));
      if (lv.edelsteine && lv.edelsteine.length) return meldung('Sammle alle Edelsteine, dann zum ' + zielWort() + '!' + karten, '', sym('edelstein'));
      if (lv.aufgabe === 'kuerzestes') return meldung('Finde das kürzeste Programm zum ' + zielWort() + '!', '', sym(zs));
      if (karten) return meldung('Zum ' + zielWort() + ' mit höchstens ' + lv.maxKarten + ' Karten!', '', sym(zs));
      return meldung('Bring den Drachen zum ' + zielWort() + '!', '', sym(zs));
    }
    const karten = lv.zauber && lv.maxKarten ? ' Höchstens ' + lv.maxKarten + ' Karten.' : '';
    if (lv.edelsteine && lv.edelsteine.length) return meldung('Sammle alle Edelsteine, dann zum ' + zielWort() + '!' + karten, '', sym('edelstein'));
    if (karten) return meldung('Zum ' + zielWort() + ' mit höchstens ' + lv.maxKarten + ' Karten!', '', sym(zs));
    if (lv.aufgabe === 'kuerzestes') return meldung('Finde das kürzeste Programm zum ' + zielWort() + '!', '', sym(zs));
    return meldung('Bring den Drachen zum ' + zielWort() + '!', '', sym(zs));
  }
  function spruchMeldung() {
    const n = L.ziel;
    meldung((L.spr[n].length ? 'Du schreibst den ' : 'Schreib zuerst deinen ') + K.SPRUCH_WORT[n] + '. Dann tippe auf „fertig“.', 'spruch-meldung', sym('spruch-' + n));
  }
  // Erweiterte Levels: Was gerade dran ist (im Wenn-dann-Kasten, im Zauber-Kasten, im Zauberspruch oder im Programm)
  function zustandsMeldung() {
    if (!L.erw) return grundMeldung();
    const o = ort();
    const c = o.last;
    const voll = !platzFuer(1);
    if (c && c.wenn) {
      const bild = sym('wenn-' + c.wenn);
      if (c.zweig === 'sonst') return meldung(!o.list.length ? 'Was macht der Drache sonst? Tippe Befehle an.' : voll ? 'Tippe auf „fertig“.' : 'Noch ein Befehl? Oder tippe auf „fertig“.', 'wenn-meldung', bild);
      return meldung(!o.list.length ? 'Was macht der Drache dann? Tippe Befehle an.' : voll ? 'Tippe auf „sonst“ oder „fertig“.' : 'Noch ein Befehl? Oder „sonst“ oder „fertig“.', 'wenn-meldung', bild);
    }
    if (c) return meldung(!o.list.length ? 'Tippe die Befehle für den Zauber-Kasten an. Dann „fertig“.' : voll ? 'Tippe auf „fertig“.' : 'Noch etwas in den Zauber-Kasten? Oder tippe auf „fertig“.', 'zauber-meldung');
    if (L.ziel) return spruchMeldung();
    return grundMeldung();
  }

  // ----- Spielfeld (Gitter wie am Papier) und Drache; bei mehreren Gittern eines pro Welt -----
  function zeichneFeld() {
    const feld = app.querySelector('.feld');
    const mehr = L.welten.length > 1;
    const basis = L.welten.map((w, wi) => {
      const z = (L.wz && L.wz[wi]) || {};
      return S.gitter(w, { ohneDrache: true, gesammelt: z.gesammelt || [], stoss: z.stossFeld || null, label: mehr ? 'Spielfeld ' + (wi + 1) : 'Spielfeld', klasse: 'gitter' });
    });
    if (!feld.querySelector('.gitter-box')) {
      let html = '';
      basis.forEach((b, wi) => {
        const vb = /viewBox="([^"]+)"/.exec(b)[1];
        html += '<div class="gitter-box" data-welt="' + wi + '"><div class="gitter-basis"></div>' +
          '<svg class="drache-ebene" xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" aria-hidden="true">' + (L.erw ? '<g class="blick-feld"></g>' : '') +
          '<g class="d-pos"><g class="d-dreh"><g transform="translate(-42 -42) scale(0.84)">' + S.inhalt('drache') + '</g></g></g></svg>' +
          (mehr ? '<span class="welt-nr" aria-hidden="true">' + (wi + 1) + '</span>' : '') + '</div>';
      });
      feld.innerHTML = mehr ? '<div class="welten" data-n="' + basis.length + '">' + html + '</div>' : html;
    }
    feld.querySelectorAll('.gitter-basis').forEach((g, wi) => { g.innerHTML = basis[wi]; });
    if (mehr) ordneWelten();
  }
  // Mehrere Gitter nebeneinander oder untereinander, so dass die Felder am größten werden (hoch und quer)
  function ordneWelten() {
    const feld = app.querySelector('.feld');
    const box = feld && feld.querySelector('.welten');
    if (!box || !L || !L.welten) return;
    const r = feld.getBoundingClientRect();
    const abstand = 10;
    const n = L.welten.length;
    const bw = Math.max(...L.welten.map((w) => w.b * 100 + 12)), bh = Math.max(...L.welten.map((w) => w.h * 100 + 12));
    let best = null;
    for (let c = 1; c <= n; c++) {
      const reihen = Math.ceil(n / c);
      const s = Math.min((r.width - (c - 1) * abstand) / (c * bw), (r.height - (reihen - 1) * abstand) / (reihen * bh));
      if (!best || s > best.s + 1e-9) best = { c, s };
    }
    const s = Math.max(0, best.s);
    box.style.gridTemplateColumns = 'repeat(' + best.c + ', auto)';
    box.querySelectorAll('.gitter-box').forEach((g, wi) => {
      const w = L.welten[wi];
      g.style.width = Math.floor((w.b * 100 + 12) * s) + 'px';
      g.style.height = Math.floor((w.h * 100 + 12) * s) + 'px';
    });
  }
  function dracheSetzen(wi, z, sofort) {
    const ebene = app.querySelectorAll('.drache-ebene')[wi];
    if (!ebene) return;
    const st = L.wz[wi];
    const pos = ebene.querySelector('.d-pos'), dreh = ebene.querySelector('.d-dreh');
    if (sofort) ebene.classList.add('sofort');
    const x = z.x * 100 + 50, y = z.y * 100 + 50;
    pos.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    dreh.setAttribute('transform', 'rotate(' + st.winkel + ')');
    pos.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    dreh.style.transform = 'rotate(' + st.winkel + 'deg)';
    if (sofort) { void ebene.getBoundingClientRect(); ebene.classList.remove('sofort'); }
    st.drache = { x: z.x, y: z.y, blick: z.blick };
  }
  function dracheZurueck() {
    L.wz = L.welten.map((w) => ({ winkel: DREH[(w.start && w.start.blick) || 'oben'] || 0, gesammelt: [], stossFeld: null, drache: null }));
    L.ergebnis = null;
    const spiel = app.querySelector('.spiel');
    if (spiel) spiel.style.setProperty('--tempo', L.tempo + 'ms');
    zeichneFeld();
    L.welten.forEach((w, wi) => dracheSetzen(wi, { x: w.start.x, y: w.start.y, blick: w.start.blick || 'oben' }, true));
    weltAktiv(null);
    blickFeld(null);
    markiere(null);
  }
  // Während des Laufs: Das Gitter, in dem der Drache gerade läuft, ist hell, die anderen ruhen (blass)
  function weltAktiv(wi) {
    app.querySelectorAll('.feld .gitter-box').forEach((b, j) => b.classList.toggle('ruht', wi !== null && wi !== undefined && j !== wi));
  }
  // Wenn-dann-Kasten: Das Feld, auf das der Drache schaut (vor der Nase oder neben ihm), ist türkis umrandet.
  // Liegt es außerhalb (Rand), leuchtet die Kante des Gitters (der Rand zählt wie ein Stein).
  function blickFeld(wi, f, z) {
    app.querySelectorAll('.drache-ebene .blick-feld').forEach((g) => { g.innerHTML = ''; });
    if (wi === null || wi === undefined || !f) return;
    const ebene = app.querySelectorAll('.drache-ebene')[wi];
    const g = ebene && ebene.querySelector('.blick-feld');
    const w = L.welten[wi];
    if (!g) return;
    const T = '#0b8a8f';
    if (f.x >= 0 && f.y >= 0 && f.x < w.b && f.y < w.h) {
      g.innerHTML = '<rect x="' + (f.x * 100 + 7) + '" y="' + (f.y * 100 + 7) + '" width="86" height="86" rx="12" fill="' + T + '" fill-opacity="0.12" stroke="' + T + '" stroke-width="8" stroke-dasharray="18 10"/>';
      return;
    }
    const dx = f.x - z.x, dy = f.y - z.y;
    const x0 = z.x * 100, y0 = z.y * 100;
    const l = dx > 0 ? [x0 + 100, y0 + 10, x0 + 100, y0 + 90] : dx < 0 ? [x0, y0 + 10, x0, y0 + 90] : dy > 0 ? [x0 + 10, y0 + 100, x0 + 90, y0 + 100] : [x0 + 10, y0, x0 + 90, y0];
    g.innerHTML = '<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '" stroke="' + T + '" stroke-width="16" stroke-linecap="round"/>';
  }

  // ----- Programm (Pfad: Karten mit Zauber-Kasten, Wenn-dann-Kasten, Zaubersprüchen; Kobold: antippen zum Reparieren) -----
  // Kartengrenze (Einheit 5) oder Länge der Programm-Reihe am Blatt (maxBefehle), sonst eine volle Reihe
  function grenze() { return L.lv.maxKarten || L.lv.maxBefehle || MAX_KARTEN; }
  // Karten zählen (Plan 7.5 Regel 10 und 7.8): Befehl und Aufruf 1, Zauber-Kasten 1 + Inhalt,
  // Wenn-dann-Kasten 1 (Wenn-Karte) + Befehle nach „dann“ und „sonst“. Ein selbst geschriebener Zauberspruch
  // zählt einmal: 1 Karte für den Namen + sein Inhalt (sobald etwas drinsteht). Vorgegebene zählen nicht.
  function teilKarten(t) {
    if (typeof t === 'string' || t.spruch) return 1;
    if (t.wenn) return 1 + t.dann.length + t.sonst.length;
    return 1 + t.befehle.reduce((s, x) => s + teilKarten(x), 0);
  }
  function kartenZahl() {
    let n = L.prog.reduce((s, t) => s + teilKarten(t), 0);
    for (const name of L.spruchFrei || []) if (L.spr[name].length) n += 1 + L.spr[name].reduce((s, t) => s + teilKarten(t), 0);
    return n;
  }
  // Wohin die nächste Karte kommt: in das Programm oder in den Zauberspruch, den das Kind gerade schreibt (L.ziel),
  // dort in den innersten offenen Kasten (Zauber-Kasten, im Wenn-dann-Kasten nach „dann“ oder „sonst“).
  //   root: Programm oder Spruch, list: Ziel-Liste, last: innerster offener Kasten (oder null), parentList: wo er steht,
  //   cap: wie viele Teile in die Ziel-Liste passen
  function ort() {
    const inSpruch = !!L.ziel;
    const root = inSpruch ? L.spr[L.ziel] : L.prog;
    let list = root, parentList = null, last = null;
    for (;;) {
      const t = list[list.length - 1];
      if (!t || typeof t !== 'object' || !t.offen) break;
      parentList = list;
      last = t;
      list = t.wenn ? t[t.zweig] : t.befehle;
    }
    const cap = !last ? (inSpruch ? K.MAX_SPRUCH : Infinity) : last.wenn ? (last.zweig === 'sonst' ? K.MAX_SONST : K.MAX_DANN) : MAX_INNEN;
    return { inSpruch, root, list, parentList, last, cap };
  }
  function offenerKasten() { return ort().last; }
  // Passt noch etwas mit so vielen Karten hinein? (Der erste Befehl im eigenen Zauberspruch braucht dazu die Namens-Karte.)
  function platzFuer(kosten) {
    const o = ort();
    const extra = o.inSpruch && !o.root.length ? 1 : 0;
    return kartenZahl() + kosten + extra <= grenze() && o.list.length < o.cap;
  }
  // Fertige Programmteile für den Ausführer: offene Kästen zählen mit, leere fallen weg
  function sauber(l) {
    const aus = [];
    for (const t of l) {
      if (typeof t === 'string') aus.push(t);
      else if (t.spruch) aus.push({ spruch: t.spruch });
      else if (t.wenn) {
        const dann = sauber(t.dann);
        if (dann.length) aus.push({ wenn: t.wenn, dann, sonst: sauber(t.sonst) });
      } else {
        const b = sauber(t.befehle);
        if (b.length) aus.push(t.bis ? { bis: 'schatz', befehle: b } : { wdh: t.wdh, befehle: b });
      }
    }
    return aus;
  }
  // Alle offenen Kästen schließen, leere weglassen
  function schliesse(l) {
    for (let i = l.length - 1; i >= 0; i--) {
      const t = l[i];
      if (typeof t !== 'object' || t.spruch) continue;
      if (t.wenn) { schliesse(t.dann); schliesse(t.sonst); t.offen = false; if (!t.dann.length) l.splice(i, 1); }
      else { schliesse(t.befehle); t.offen = false; if (!t.befehle.length) l.splice(i, 1); }
    }
  }
  function programmDaten() { return sauber(L.prog); }
  // Selbst geschriebene Zaubersprüche, in denen etwas steht (zählen als Karten)
  function freieSprueche() {
    const aus = {};
    for (const n of L.spruchFrei || []) if (L.spr[n].length) aus[n] = sauber(L.spr[n]);
    return aus;
  }
  // Welche Zaubersprüche ein Programm aufruft
  function rufe(l, aus) {
    aus = aus || [];
    for (const t of l) {
      if (typeof t !== 'object') continue;
      if (t.spruch) { if (!aus.includes(t.spruch)) aus.push(t.spruch); }
      else if (t.wenn) { rufe(t.dann, aus); rufe(t.sonst, aus); }
      else rufe(t.befehle, aus);
    }
    return aus;
  }
  function spruchNamen() { return Object.keys(L.sprFest || {}).concat(L.spruchFrei || []); }
  function karte(b, attr, cls) {
    return '<span class="karte befehl-' + b + (cls ? ' ' + cls : '') + '"' + (attr || '') + ' aria-label="' + NAMEN[b] + '">' + sym(b) + '</span>';
  }
  const PLATZHALTER = '<span class="karte platzhalter"></span>';

  // Ein Programmteil wie am Papier. Jedes Teil hat eine Adresse (data-ort) zum Aufleuchten:
  //   p3 (Teil 3 im Programm), p3.k1 (im Zauber-Kasten), p3.d0 / p3.s0 (nach „dann“ / „sonst“),
  //   p3-dann, p3-sonst (die Zweige), p3-bed (die Wenn-Karte), stern (Spruch-Reihe), stern2 (Teil 2 im Stern-Spruch) …
  // ctx.ziel: innerster offener Kasten (bekommt den Platzhalter), ctx.platz: passt noch eine Karte?
  // teilI: Teil im Programm (für data-teil / data-innen wie früher)
  function teilHTML(t, adr, ctx, teilI, innenI) {
    const attr = ' data-ort="' + adr + '"' + (teilI !== null ? ' data-teil="' + teilI + '"' + (innenI !== null ? ' data-innen="' + innenI + '"' : '') : '');
    if (typeof t === 'string') return karte(t, attr);
    if (t.spruch) return '<span class="karte ruf"' + attr + ' aria-label="' + K.SPRUCH_WORT[t.spruch] + '">' + sym('spruch-' + t.spruch) + '</span>';
    if (t.wenn) {
      const hier = t === ctx.ziel ? t.zweig : null;
      const zweig = (name, l, b) => {
        let h = '<span class="zweig" data-ort="' + adr + '-' + name + '"><span class="w-wort">' + name + '</span>';
        l.forEach((x, j) => { h += teilHTML(x, adr + '.' + b + j, ctx, null, null); });
        if (hier === name && ctx.platz) h += PLATZHALTER;
        return h + '</span>';
      };
      return '<span class="kasten-w' + (t.offen ? ' offen' : '') + '"' + attr + '>' +
        '<span class="w-wort">wenn</span>' +
        '<span class="karte bed" data-ort="' + adr + '-bed" aria-label="' + esc(S.NAMEN['wenn-' + t.wenn] || 'Wenn-Karte') + '">' + sym('wenn-' + t.wenn) + '</span>' +
        zweig('dann', t.dann, 'd') +
        (t.sonst.length || hier === 'sonst' ? zweig('sonst', t.sonst, 's') : '') + '</span>';
    }
    let innen = '';
    t.befehle.forEach((x, j) => { innen += teilHTML(x, adr + '.k' + j, ctx, teilI, teilI !== null ? j : null); });
    if (t === ctx.ziel && ctx.platz) innen += PLATZHALTER;
    const kopf = t.bis ? '<span class="bis-bild">' + sym(L.lv.zielSymbol || 'schatz') + '</span>bis zum ' + zielWort() : t.wdh + '-mal';
    return '<span class="kasten-z' + (t.bis ? ' kasten-bis' : '') + (t.offen ? ' offen' : '') + '"' + attr + '><span class="mal">' + kopf + '<span class="runde"></span></span><span class="innen">' + innen + '</span></span>';
  }
  // Nummerierte Reihe wie am Blatt: eine Nummer pro Teil (ein Kasten bekommt eine Nummer)
  function reiheHTML(l, wurzel, ctx, imProgramm, mitPlatz) {
    const mitNr = (i, inhalt) => '<span class="teil"><span class="teil-nr" aria-hidden="true">' + (i + 1) + '</span>' + inhalt + '</span>';
    let html = '';
    l.forEach((t, i) => { html += mitNr(i, teilHTML(t, wurzel + i, ctx, imProgramm ? i : null, null)); });
    if (mitPlatz && !ctx.ziel && ctx.platz) html += mitNr(l.length, PLATZHALTER);
    return html;
  }
  // Zauberspruch als braune Spruch-Reihe: links Siegel und Name, rechts seine Teile. Einen selbst geschriebenen
  // tippt das Kind an, um (weiter) daran zu schreiben.
  function spruchReiheHTML(n, l, frei, ctx) {
    const schreiben = frei && L.ziel === n;
    const inhalt = l.length || schreiben ? reiheHTML(l, n, ctx, false, schreiben) : '<span class="teil"><span class="teil-nr" aria-hidden="true">1</span>' + PLATZHALTER + '</span>';
    const kopf = '<span class="spruch-kopf"><span class="spruch-siegel">' + sym('spruch-' + n) + '</span><span class="spruch-wort">' + K.SPRUCH_WORT[n] + '</span></span>';
    const cls = 'spruch-reihe' + (frei ? ' frei' : '') + (schreiben ? ' schreiben' : '');
    if (!frei) return '<div class="' + cls + '" data-ort="' + n + '" role="group" aria-label="' + K.SPRUCH_WORT[n] + '">' + kopf + '<span class="spruch-inhalt">' + inhalt + '</span></div>';
    return '<button class="' + cls + '" data-aktion="spruch-schreiben" data-spruch="' + n + '" data-ort="' + n + '" aria-label="' + K.SPRUCH_WORT[n] + ' schreiben"' + (L.laeuft ? ' disabled' : '') + '>' +
      kopf + '<span class="spruch-inhalt">' + inhalt + '</span></button>';
  }

  function zeichneProgramm() {
    const box = app.querySelector('.programm');
    if (!box) return;
    if (L.art === 'ablauf') return zeichneAblaufReihe();
    if (L.art === 'kobold') return zeichneKoboldProgramm();
    const o = ort();
    const ctx = { ziel: o.last, platz: !L.laeuft && !L.wahl && platzFuer(1) };
    const ohne = { ziel: null, platz: false };
    let sprueche = '';
    for (const [n, l] of Object.entries(L.sprFest || {})) sprueche += spruchReiheHTML(n, l, false, ohne);
    for (const n of L.spruchFrei || []) sprueche += spruchReiheHTML(n, L.spr[n], true, L.ziel === n ? ctx : ohne);
    const html = reiheHTML(L.prog, 'p', L.ziel ? ohne : ctx, true, !L.ziel);
    let zaehler = '';
    if (L.lv.maxKarten) {
      const n = kartenZahl();
      let k = '';
      for (let j = 0; j < L.lv.maxKarten; j++) k += '<i class="' + (j < n ? 'voll' : '') + '"></i>';
      zaehler = '<div class="zaehler"><span class="zaehler-karten" aria-hidden="true">' + k + '</span><span>' + n + ' von ' + L.lv.maxKarten + ' Karten</span></div>';
    }
    const zeile = '<div class="prog-zeile" aria-label="Programm">' + html + '</div>';
    if (!L.erw) { box.innerHTML = zeile + zaehler; return; }
    box.innerHTML = '<div class="prog-inhalt">' + sprueche + zeile + zaehler + '</div>';
    passeAn();
  }
  // Erweiterte Levels: Das Programm darf in mehrere Zeilen umbrechen, muss aber ganz sichtbar bleiben.
  // Passt es nicht in seinen Platz: zuerst eng (ohne den Namen neben dem Spruch-Siegel, kleinere Abstände), dann
  // kleinere Karten (bis 24 px, sie sind nur Anzeige). Erst wenn das nicht reicht, blättert der Programm-Bereich
  // (die Seite selbst nie).
  function passeProgramm() {
    const box = app.querySelector('.spiel.erw .programm');
    const inhalt = box && box.querySelector('.prog-inhalt');
    if (!inhalt) return;
    box.classList.remove('eng', 'rollen');
    box.style.removeProperty('--k');
    const cs = getComputedStyle(box);
    let k = parseFloat(cs.getPropertyValue('--k')) || 38;
    const zuGross = () => {
      const h = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      return inhalt.getBoundingClientRect().height > h + 0.5 || inhalt.scrollWidth > inhalt.clientWidth + 0.5;
    };
    if (!zuGross()) return;
    box.classList.add('eng');
    while (k > 24 && zuGross()) { k -= 2; box.style.setProperty('--k', k + 'px'); }
    if (zuGross()) box.classList.add('rollen');
  }
  function passeAn() {
    if (!L || !L.erw) return;
    passeProgramm();
    ordneWelten();
  }

  function zeichneKoboldProgramm() {
    const box = app.querySelector('.programm');
    const a = L.auswahl;
    let html = '';
    L.prog.forEach((b, i) => {
      const zu = koboldZu(i);
      html += '<button class="karte kobold-karte befehl-' + b + (a && a.i === i ? ' gewaehlt' : '') + (zu ? ' zu' : '') + '" data-aktion="karte" data-i="' + i + '" data-teil="' + i + '" data-ort="p' + i + '" aria-label="Befehl ' + (i + 1) + ': ' + NAMEN[b] + '"' + (L.laeuft ? ' disabled' : zu ? ' aria-disabled="true"' : '') + '>' +
        '<span class="nr">' + (i + 1) + '</span>' + sym(b) + '</button>';
    });
    box.innerHTML = '<div class="prog-zeile kobold-zeile" aria-label="Programm">' + html + '</div>';
  }

  // Aufleuchten: pfad aus dem Ausführer ([{ in: 'programm', i }, { in: 'kasten', i, runde }, { in: 'dann', i },
  // { in: 'spruch', name, i } …]). Alle Kästen auf dem Weg leuchten mit (Zauber-Kasten mit „Runde n“, der Zweig
  // „dann“ oder „sonst“, die Aufruf-Karte und die Spruch-Reihe), der innerste Teil bekommt art (aktiv oder stoss).
  // zweig: Der Wenn-dann-Kasten schaut gerade (dann leuchten die Wenn-Karte und der Zweig, der drankommt).
  function markiere(pfad, art, zweig) {
    app.querySelectorAll('.programm .aktiv, .programm .stoss').forEach((e) => e.classList.remove('aktiv', 'stoss'));
    app.querySelectorAll('.programm .runde').forEach((e) => { e.textContent = ''; });
    if (!pfad || !pfad.length) return;
    const ziele = [];
    let adr = '';
    for (const p of pfad) {
      if (p.in === 'programm') adr = 'p' + p.i;
      else if (p.in === 'spruch') { ziele.push({ a: p.name }); adr = p.name + p.i; }
      else if (p.in === 'kasten') { ziele[ziele.length - 1].runde = p.runde; adr += '.k' + p.i; }
      else { ziele.push({ a: adr + '-' + p.in }); adr += (p.in === 'dann' ? '.d' : '.s') + p.i; }
      ziele.push({ a: adr });
    }
    if (zweig) { ziele.push({ a: adr + '-bed' }); ziele.push({ a: adr + '-' + zweig }); }
    ziele.forEach((z, j) => {
      const el = app.querySelector('.programm [data-ort="' + z.a + '"]');
      if (!el) return;
      el.classList.add(j === ziele.length - 1 && art ? art : 'aktiv');
      if (z.runde !== undefined && z.runde !== null) {
        const r = el.querySelector('.runde');
        if (r) r.textContent = 'Runde ' + (z.runde + 1);
      }
    });
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
    if (L.erw) return zeichneTastenErw(box);
    // Pfad (Einheiten 2 und 5)
    if (L.wahl === 'zahl') {
      let r = '';
      for (let w = K.WDH_MIN; w <= K.WDH_MAX; w++) r += taste('zahl', '<span>' + w + '</span>', { cls: 'befehl zahl', daten: 'data-zahl="' + w + '"', label: w + '-mal' });
      r += taste('abbrechen', ICON.kreuz, { cls: 'befehl', label: 'Doch nicht' });
      box.innerHTML = '<p class="tasten-frage">Wie oft?</p><div class="reihe">' + r + '</div>' + losTasten(true);
      return belegungMerken(box);
    }
    const k = offenerKasten();
    const voll = !platzFuer(1);
    let r = '';
    for (const b of K.BEFEHLE) r += befehlsTaste(b, lauf, voll);
    if (k) r += taste('fertig', '<span>fertig</span>', { cls: 'befehl zauber-fertig', label: 'Zauber-Kasten fertig', aus: lauf });
    else if (L.lv.zauber) r += taste('zauber', zauberIcon, { cls: 'befehl zauber', label: 'Zauber-Kasten', aus: lauf, grau: kartenZahl() + 2 > grenze() });
    r += taste('loeschen', ICON.weg, { cls: 'befehl', label: 'Letzten Befehl löschen', aus: lauf || !L.prog.length });
    box.innerHTML = '<div class="reihe">' + r + '</div>' + losTasten(false, lauf || !programmDaten().length);
    belegungMerken(box);
  }

  // Tasten der erweiterten Levels (ab Block C), nur Antippen:
  //   links oben:  vor, links drehen, rechts drehen, Zauberspruch-Aufrufe (im eigenen Spruch: „fertig“ für den Spruch)
  //   links unten: Zauber-Kasten und Wenn-dann-Kasten – im offenen Kasten „sonst“ und „fertig“ – und Löschen
  //   rechts:      Nochmal und Los (immer an derselben Stelle)
  // Wahl: „Wie oft?“ (2 bis 5, „bis zum Schatz“) bzw. die Wenn-Karten (nur die Bedingungen des Levels).
  function zeichneTastenErw(box) {
    const lauf = L.laeuft;
    const steuer = '<div class="steuer">' +
      taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: Drache zurück an den Start' }) +
      taste('los', ICON.los + '<span>Los</span>', { cls: 'breit los', aus: lauf || !!L.wahl || !programmDaten().length }) + '</div>';
    let frage = '', r1 = '', r2 = '';
    if (L.wahl === 'zahl') {
      frage = '<p class="tasten-frage">Wie oft?</p>';
      for (let w = K.WDH_MIN; w <= K.WDH_MAX; w++) r1 += taste('zahl', '<span>' + w + '</span>', { cls: 'befehl zahl', daten: 'data-zahl="' + w + '"', label: w + '-mal' });
      if (darf('bis')) r2 += taste('bis', sym('bis') + '<span>bis zum ' + zielWort() + '</span>', { cls: 'bis-taste', label: 'bis zum ' + zielWort() });
      r2 += taste('abbrechen', ICON.kreuz, { cls: 'befehl', label: 'Doch nicht' });
    } else if (L.wahl === 'bedingung') {
      frage = '<p class="tasten-frage wenn-frage">Welche Wenn-Karte?</p>';
      const b = L.bedingungen.map((c) => taste('bedingung', sym('wenn-' + c), { cls: 'befehl bed', daten: 'data-bedingung="' + c + '"', label: S.NAMEN['wenn-' + c] || c }));
      const ab = taste('abbrechen', ICON.kreuz, { cls: 'befehl', label: 'Doch nicht' });
      if (b.length <= 3) r1 = b.join('') + ab;
      else { r1 = b.slice(0, 4).join(''); r2 = b.slice(4).join('') + ab; }
    } else {
      const o = ort();
      const c = o.last;
      const voll = !platzFuer(1);
      for (const b of K.BEFEHLE) r1 += befehlsTaste(b, lauf, voll);
      if (o.inSpruch && !c) r1 += taste('fertig', '<span>fertig</span>', { cls: 'befehl fertig spruch-fertig', daten: 'data-was="spruch"', label: K.SPRUCH_WORT[L.ziel] + ' fertig', aus: lauf });
      if (!o.inSpruch && darf('spruch')) for (const n of spruchNamen()) r1 += taste('ruf', sym('spruch-' + n), { cls: 'befehl ruf', daten: 'data-spruch="' + n + '"', label: K.SPRUCH_WORT[n] + ' aufrufen', aus: lauf, grau: voll });
      if (!c) {
        if (darf('zauber') || darf('bis')) r2 += taste('zauber', darf('zauber') ? zauberIcon : sym('bis'), { cls: 'befehl zauber', label: darf('zauber') ? 'Zauber-Kasten' : 'Zauber-Kasten bis zum ' + zielWort(), aus: lauf, grau: !platzFuer(2) });
        if (darf('wenn')) r2 += taste('wenn', sym('wenn'), { cls: 'befehl wenn', label: 'Wenn-dann-Kasten', aus: lauf, grau: !platzFuer(2) });
      } else if (c.wenn) {
        r2 += taste('sonst', '<span>sonst</span>', { cls: 'befehl wort wenn-wort', label: 'sonst', aus: lauf, grau: c.zweig === 'sonst' || !c.dann.length });
        r2 += taste('fertig', '<span>fertig</span>', { cls: 'befehl fertig wenn-fertig', daten: 'data-was="wenn"', label: 'Wenn-dann-Kasten fertig', aus: lauf });
      } else {
        if (darf('wenn')) r2 += taste('wenn', sym('wenn'), { cls: 'befehl wenn', label: 'Wenn-dann-Kasten', aus: lauf, grau: !platzFuer(2) });
        r2 += taste('fertig', '<span>fertig</span>', { cls: 'befehl zauber-fertig', daten: 'data-was="kasten"', label: 'Zauber-Kasten fertig', aus: lauf });
      }
      r2 += taste('loeschen', ICON.weg, { cls: 'befehl', label: 'Letzten Befehl löschen', aus: lauf || !o.root.length });
    }
    box.innerHTML = '<div class="tasten-erw"><div class="tasten-links">' + frage + '<div class="reihe">' + r1 + '</div>' +
      (r2 ? '<div class="reihe">' + r2 + '</div>' : '') + '</div>' + steuer + '</div>';
    belegungMerken(box);
    passeAn();
  }

  // Doppeltipp-Schutz: Wechselt die Belegung der Tasten (Wie oft?, Wenn-Karten, Kasten auf/zu, Spruch fertig,
  // Kobold-Auswahl), liegt an der getippten Stelle oft eine andere Taste. Der zweite Tipp eines Doppeltipps würde sie
  // sofort auslösen. Darum nach jedem Wechsel kurz keine Tipps auf Programm und Tasten (data-sperre am #app).
  let sperreBis = 0;
  let sperreTimer = null;
  function sperren() {
    sperreBis = Date.now() + SPERRE;
    app.dataset.sperre = '1';
    clearTimeout(sperreTimer);
    sperreTimer = setTimeout(() => { delete app.dataset.sperre; }, SPERRE);
  }
  function belegungMerken(box) {
    const b = Array.from(box.querySelectorAll('[data-aktion]'), (t) => t.dataset.aktion + (t.dataset.befehl || '') + (t.dataset.zahl || '') +
      (t.dataset.bedingung || '') + (t.dataset.spruch || '') + (t.dataset.was || '')).join(',');
    if (L.belegung !== undefined && L.belegung !== b) sperren();
    L.belegung = b;
  }

  // ----- Ändern (Pfad) -----
  function vorAenderung() {
    if (L.laeuft) return false;
    if (L.ergebnis) { dracheZurueck(); grundMeldung(); }
    return true;
  }
  // Freundliche Meldung, wenn nichts mehr hineinpasst
  function vollMeldung(o, warum) {
    if (!L.erw) {   // Einheiten 2 und 5: wie bisher
      if (warum === 'karten') {
        if (o.last) meldung('Mehr Karten gehen nicht. Tippe auf „fertig“.', 'zauber-meldung');
        else if (L.lv.maxKarten) meldung('Mehr Karten gehen nicht. Probier den Zauber-Kasten!', 'hinweis');
        else meldung('Mehr als ' + grenze() + ' Befehle passen nicht.', 'hinweis');
      } else meldung('Der Zauber-Kasten ist voll. Tippe auf „fertig“.', 'zauber-meldung');
      return;
    }
    const c = o.last;
    const art = c ? (c.wenn ? 'wenn-meldung' : 'zauber-meldung') : o.inSpruch ? 'spruch-meldung' : 'hinweis';
    if (warum === 'karten') return meldung(c || o.inSpruch ? 'Mehr Karten gehen nicht. Tippe auf „fertig“.' : 'Mehr Karten gehen nicht. Höchstens ' + grenze() + ' Karten!', art);
    if (c && c.wenn) return meldung(c.zweig === 'sonst' ? 'Nach „sonst“ passen höchstens ' + K.MAX_SONST + ' Befehle. Tippe auf „fertig“.' : 'Nach „dann“ passen höchstens ' + K.MAX_DANN + ' Befehle. Tippe auf „sonst“ oder „fertig“.', art);
    if (c) return meldung('Der Zauber-Kasten ist voll. Tippe auf „fertig“.', art);
    return meldung('Der ' + K.SPRUCH_WORT[L.ziel] + ' ist voll. Tippe auf „fertig“.', art);
  }
  // Ein Teil an die richtige Stelle legen (siehe ort). Neue Kästen brauchen Platz für sich und eine Karte darin.
  function hinzu(t) {
    const o = ort();
    const kosten = typeof t === 'object' && !t.spruch ? 2 : 1;
    const extra = o.inSpruch && !o.root.length ? 1 : 0;
    if (kartenZahl() + kosten + extra > grenze()) { vollMeldung(o, 'karten'); return false; }
    if (o.list.length >= o.cap) { vollMeldung(o, 'kasten'); return false; }
    o.list.push(t);
    return true;
  }
  function befehlDazu(b) {
    if (!vorAenderung()) return;
    if (L.art === 'kobold') return koboldSetzen(b);
    if (!hinzu(b)) return;
    zeichneProgramm(); zeichneTasten();
    if (L.erw) return zustandsMeldung();
    const k = offenerKasten();
    if (k) {
      const voll = k.befehle.length >= MAX_INNEN || kartenZahl() >= grenze();
      meldung(voll ? 'Tippe auf „fertig“.' : 'Noch ein Befehl in den Zauber-Kasten? Sonst tippe auf „fertig“.', 'zauber-meldung');
    }
  }
  function rufDazu(n) {
    if (!vorAenderung()) return;
    if (!spruchNamen().includes(n) || ort().inSpruch) return;
    if (!hinzu({ spruch: n })) return;
    zeichneProgramm(); zeichneTasten();
    if (L.spr[n] && !L.spr[n].length) return meldung('Dein ' + K.SPRUCH_WORT[n] + ' ist noch leer. Tippe ihn oben an und schreib ihn!', 'spruch-meldung', sym('spruch-' + n));
    zustandsMeldung();
  }
  function loeschen() {
    if (!vorAenderung()) return;
    const o = ort();
    const c = o.last;
    if (c && c.wenn) {
      if (c.zweig === 'sonst') { if (c.sonst.length) c.sonst.pop(); else c.zweig = 'dann'; }
      else if (c.dann.length) c.dann.pop();
      else o.parentList.pop();
    } else if (c) {
      if (c.befehle.length) c.befehle.pop();
      else { o.parentList.pop(); if (!L.erw) grundMeldung(); }
    } else o.root.pop();
    zeichneProgramm(); zeichneTasten();
    if (L.erw) zustandsMeldung();
  }
  function zauberStart() {
    if (!vorAenderung()) return;
    const o = ort();
    if (o.last) return;
    const extra = o.inSpruch && !o.root.length ? 1 : 0;
    if (kartenZahl() + 2 + extra > grenze() || o.list.length >= o.cap) {
      meldung('Für einen Zauber-Kasten ist kein Platz mehr. Lösche zuerst ' + (L.erw ? 'eine Karte.' : 'einen Befehl.'), 'hinweis');
      return;
    }
    if (!darf('zauber')) return zauberZahl('bis');   // nur „bis zum Schatz“: gleich den Kasten
    L.wahl = 'zahl';
    zeichneProgramm(); zeichneTasten();
    meldung('Wie oft soll der Zauber-Kasten wiederholen?', 'zauber-meldung');
  }
  function zauberZahl(w) {
    L.wahl = null;
    if (!hinzu(w === 'bis' ? { bis: 'schatz', befehle: [], offen: true } : { wdh: w, befehle: [], offen: true })) { zeichneProgramm(); zeichneTasten(); return; }
    zeichneProgramm(); zeichneTasten();
    meldung('Tippe die Befehle für den Zauber-Kasten an. Dann „fertig“.', 'zauber-meldung');
  }
  // Wenn-dann-Kasten: antippen → Wenn-Karte wählen → Befehle für „dann“ → („sonst“ → Befehle) → „fertig“
  function wennStart() {
    if (!vorAenderung()) return;
    const o = ort();
    if (!darf('wenn') || (o.last && o.last.wenn)) return;
    const extra = o.inSpruch && !o.root.length ? 1 : 0;
    if (kartenZahl() + 2 + extra > grenze() || o.list.length >= o.cap) {
      return meldung('Für einen Wenn-dann-Kasten ist kein Platz mehr. ' + (o.last ? 'Tippe auf „fertig“.' : 'Lösche zuerst eine Karte.'), 'hinweis');
    }
    if (L.bedingungen.length === 1) return wennBedingung(L.bedingungen[0]);
    L.wahl = 'bedingung';
    zeichneProgramm(); zeichneTasten();
    meldung('Was schaut der Drache an? Wähle eine Wenn-Karte.', 'wenn-meldung', sym('wenn'));
  }
  function wennBedingung(c) {
    if (!L.bedingungen.includes(c)) return;
    L.wahl = null;
    hinzu({ wenn: c, dann: [], sonst: [], offen: true, zweig: 'dann' });
    zeichneProgramm(); zeichneTasten();
    zustandsMeldung();
  }
  function wennSonst() {
    if (!vorAenderung()) return;
    const c = ort().last;
    if (!c || !c.wenn) return;
    if (c.zweig === 'sonst') return meldung('Du bist schon bei „sonst“. Tippe Befehle an oder „fertig“.', 'wenn-meldung', sym('wenn-' + c.wenn));
    if (!c.dann.length) return meldung('Zuerst einen Befehl nach „dann“.', 'wenn-meldung', sym('wenn-' + c.wenn));
    c.zweig = 'sonst';
    zeichneProgramm(); zeichneTasten();
    zustandsMeldung();
  }
  // „fertig“: den innersten offenen Kasten schließen (ein leerer fällt weg); im eigenen Zauberspruch: zurück zum Programm
  function fertigTippen() {
    if (!vorAenderung()) return;
    const o = ort();
    const c = o.last;
    if (c) {
      if (c.wenn ? c.dann.length : c.befehle.length) c.offen = false;
      else o.parentList.pop();
    } else if (L.ziel) L.ziel = null;
    zeichneProgramm(); zeichneTasten();
    if (L.erw) zustandsMeldung(); else grundMeldung();
  }
  // Selbst geschriebenen Zauberspruch antippen: jetzt kommen die Karten dort hinein
  function spruchSchreiben(n) {
    if (!vorAenderung()) return;
    if (!(L.spruchFrei || []).includes(n) || L.ziel === n) return;
    L.ziel = n;
    L.wahl = null;
    zeichneProgramm(); zeichneTasten();
    spruchMeldung();
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
  // Mehrere Gitter: erst im ersten, dann im nächsten (die anderen ruhen). Wenn-dann-Kasten: Der Drache schaut
  // zuerst (Wenn-Karte, Zweig und das angeschaute Feld leuchten), dann macht er die Befehle.
  function los() {
    if (L.laeuft) return;
    if (L.art === 'ablauf') return pruefeAblauf();
    // offene Kästen schließen, leere weglassen (auch im selbst geschriebenen Zauberspruch)
    schliesse(L.prog);
    for (const n of L.spruchFrei || []) schliesse(L.spr[n]);
    L.wahl = null;
    L.auswahl = null;
    L.ziel = null;
    const prog = programmDaten();
    if (!prog.length) { zeichneProgramm(); zeichneTasten(); meldung('Tippe zuerst Befehle an.', 'hinweis'); return; }
    const sp = Object.assign({}, L.lv.sprueche || {}, freieSprueche());
    const leer = rufe(prog).find((n) => !sp[n]);
    if (leer) {
      zeichneProgramm(); zeichneTasten();
      meldung('Dein ' + K.SPRUCH_WORT[leer] + ' ist noch leer. Tippe ihn oben an und schreib ihn!', 'spruch-meldung', sym('spruch-' + leer));
      return;
    }
    const laeufe = L.welten.map((w) => K.ausfuehren(w, prog, { sprueche: sp }));
    dracheZurueck();
    L.laeuft = true;
    zeichneProgramm(); zeichneTasten();
    meldung('Der Drache läuft …', 'laeuft', sym('drache'));
    const mehr = laeufe.length > 1;
    let wi = 0, n = 0, befehle = 0;
    if (mehr) weltAktiv(0);
    const weiter = () => {
      if (!L || !L.laeuft) return;
      const e = laeufe[wi];
      const ev = e.ereignisse;
      while (n < ev.length && ev[n].art !== 'befehl' && ev[n].art !== 'wenn') n++;
      if (n < ev.length) {
        const x = ev[n++];
        let pause = TEMPO;
        if (x.art === 'befehl') {
          const s = e.schritte[x.schritt];
          const st = L.wz[wi];
          blickFeld(null);
          markiere(s.pfad);
          if (s.befehl === 'links') st.winkel -= 90;
          if (s.befehl === 'rechts') st.winkel += 90;
          dracheSetzen(wi, s.nachher, false);
          const key = s.nachher.x + ',' + s.nachher.y;
          if ((L.welten[wi].edelsteine || []).some((g) => g[0] + ',' + g[1] === key) && !st.gesammelt.some((g) => g[0] + ',' + g[1] === key)) {
            st.gesammelt.push([s.nachher.x, s.nachher.y]);
            zeichneFeld();
          }
          befehle++;
        } else {
          markiere(x.pfad, 'aktiv', x.wahr ? 'dann' : 'sonst');
          blickFeld(wi, x.feld, x.zustand);
          pause = Math.round(TEMPO * 0.6);
        }
        // Läuft er im Kreis, geht es nach den ersten Befehlen schneller (bis Befehl 60 dauert es sonst zu lang)
        if (e.zuLang && befehle > 12) {
          pause = Math.max(1, Math.round(pause / 4));
          const spiel = app.querySelector('.spiel');
          if (spiel) spiel.style.setProperty('--tempo', Math.max(1, Math.round(L.tempo / 4)) + 'ms');
        }
        L.timer = setTimeout(weiter, pause);
        return;
      }
      blickFeld(null);
      if (!e.geschafft || wi + 1 >= laeufe.length) return fertig(e, prog, wi);
      // geschafft in diesem Gitter: weiter im nächsten
      wi++; n = 0; befehle = 0;
      markiere(null);
      weltAktiv(wi);
      L.timer = setTimeout(weiter, TEMPO);
    };
    L.timer = setTimeout(weiter, Math.min(250, TEMPO));
  }

  function fertig(e, prog, wi) {
    wi = wi || 0;
    L.laeuft = false;
    L.timer = null;
    const st = L.wz[wi];
    const mehr = L.welten.length > 1;
    const im = mehr ? 'Im Gitter ' + (wi + 1) + ' ' : '';
    if (mehr) weltAktiv(e.geschafft ? null : wi);
    if (e.stoss) {
      L.ergebnis = 'stoss';
      st.stossFeld = { x: st.drache.x, y: st.drache.y };
      zeichneFeld();
      zeichneProgramm(); zeichneTasten();
      markiere(e.stoss.pfad, 'stoss');
      meldung('Hier hat der Kobold zugeschlagen!', 'stoss', sym('kobold'));
      return;
    }
    zeichneProgramm(); zeichneTasten();
    if (e.geschafft) { L.ergebnis = 'geschafft'; return geschafft(prog); }
    L.ergebnis = 'nicht';
    if (e.zuLang) return meldung('Der Drache läuft im Kreis. Er findet ' + zielMitArtikel() + ' so nicht.', 'hinweis', sym('drache'));
    const fehlen = (L.welten[wi].edelsteine || []).length - e.gesammelt;
    if (e.amZiel && fehlen > 0) meldung(mehr ? im + 'fehlen noch Edelsteine.' : 'Fast! Es fehlen noch Edelsteine.', 'hinweis', sym('edelstein'));
    else meldung(mehr ? im + 'ist der Drache noch nicht beim ' + zielWort() + '.' : 'Der Drache ist noch nicht beim ' + zielWort() + '. Probier es nochmal!', 'hinweis', sym(L.lv.zielSymbol || 'schatz'));
  }

  // ----- Geschafft -----
  function geschafft(prog) {
    const lv = L.lv;
    let stern = true;
    let zusatz = '';
    if (L.art === 'pfad' && L.erw) {
      // Karten wie am Papier (mit dem selbst geschriebenen Zauberspruch). „Finde das kürzeste“: Stern erst mit der
      // kleinsten Kartenzahl (minKarten hat der Löser bewiesen); sonst nur eine Profi-Frage.
      const karten = K.karten(prog, freieSprueche());
      if (lv.minKarten && karten > lv.minKarten) {
        if (lv.aufgabe === 'kuerzestes') { stern = false; zusatz = 'Der Drache ist da! Aber es geht kürzer: mit ' + lv.minKarten + ' Karten.'; }
        else zusatz = 'Profi-Frage: Geht es auch mit ' + lv.minKarten + ' Karten?';
      }
    } else if (L.art === 'pfad') {
      const karten = K.karten(prog);
      if (lv.aufgabe === 'kuerzestes' && !lv.zauber && lv.kuerzeste && karten > lv.kuerzeste) {
        stern = false;
        zusatz = 'Der Drache ist da! Aber es geht kürzer: mit ' + lv.kuerzeste + ' Befehlen.';
      } else if (lv.zauber && lv.minKarten && karten > lv.minKarten) {
        zusatz = 'Profi-Frage: Geht es auch mit ' + lv.minKarten + ' Karten?';
      }
    }
    geschafftDialog(stern, zusatz);
  }
  // Geschafft-Fenster (auch für Spiel-Plugins): Stern speichern, „Nochmal“ und „Weiter“
  function geschafftDialog(stern, zusatz) {
    const lv = L.lv;
    if (app.querySelector('.dialog-hintergrund')) return;
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
      taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: L.spiel ? 'Nochmal' : L.art === 'ablauf' ? 'Nochmal: alle Karten zurück' : 'Nochmal: Drache zurück an den Start' }) +
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
  const KERN_AKTIONEN = ['heim', 'eltern', 'paket', 'block', 'level', 'loeschen-frage', 'loeschen-ja', 'loeschen-nein'];
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
      if (UMSCHALTER.includes(a) || b.hasAttribute('data-umschalter')) {
        const wer = a + ':' + (b.dataset.id || b.dataset.i || '');
        if (letzterUmschalter && letzterUmschalter.wer === wer && jetzt - letzterUmschalter.zeit < SPERRE) return;
        letzterUmschalter = { wer, zeit: jetzt };
      }
    }
    switch (a) {
      case 'heim': return geh('#');
      case 'eltern': return geh('#eltern');
      case 'paket': return geh('#' + b.dataset.paket);
      case 'block': return geh('#block-' + b.dataset.block);
      case 'level': return geh('#' + b.dataset.paket + '/' + (parseInt(b.dataset.i, 10) + 1));
      case 'loeschen-frage': return loeschenFrage();
      case 'loeschen-ja':
        speicher = { sterne: {}, name: speicher.name };
        sichere();
        return zeigeEltern('Gelöscht. Alle Sterne sind weg.');
      case 'loeschen-nein': return zeigeEltern();
    }
    if (!L) return;
    if (L.spiel && !KERN_AKTIONEN.includes(a)) {
      const sp = L.spiel;
      if (a === 'weiter') return geh('#' + L.p.paket + '/' + (L.i + 1 < L.p.levels.length ? L.i + 2 : 'ende'));
      if (a === 'nochmal') {
        const d = app.querySelector('.dialog-hintergrund');
        if (d) { d.remove(); sperren(); }
        if (L.timers) { L.timers.forEach(clearTimeout); L.timers = []; }
        L.laeuft = false;
        if (sp.nochmal) return sp.nochmal(L.api);
        L.zustand = {}; L.api = pluginApi();
        sp.start(L.api);
        if (sp.grundMeldung) sp.grundMeldung(L.api);
        return;
      }
      if (a === 'los' && sp.los) return sp.los(L.api);
      if (sp.klick) return sp.klick(a, b, L.api);
      return;
    }
    switch (a) {
      case 'befehl': return befehlDazu(b.dataset.befehl);
      case 'loeschen': return loeschen();
      case 'zauber': return zauberStart();
      case 'zahl': return zauberZahl(parseInt(b.dataset.zahl, 10));
      case 'bis': return L.wahl === 'zahl' && darf('bis') ? zauberZahl('bis') : undefined;
      case 'fertig': return fertigTippen();
      case 'wenn': return wennStart();
      case 'bedingung': return L.wahl === 'bedingung' ? wennBedingung(b.dataset.bedingung) : undefined;
      case 'sonst': return wennSonst();
      case 'ruf': return rufDazu(b.dataset.spruch);
      case 'spruch-schreiben': return spruchSchreiben(b.dataset.spruch);
      case 'abbrechen':
        L.wahl = null; L.auswahl = null;
        zeichneProgramm(); zeichneTasten();
        if (L.erw) zustandsMeldung(); else grundMeldung();
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
        dracheZurueck(); zeichneProgramm(); zeichneTasten();
        if (L.erw) zustandsMeldung(); else grundMeldung();
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
  // Gerät gedreht oder Fenster anders groß: Programm und mehrere Gitter neu einpassen (das Gitter selbst dreht nie mit)
  window.addEventListener('resize', () => { if (L && L.erw && document.body.dataset.ansicht === 'level') passeAn(); });
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
