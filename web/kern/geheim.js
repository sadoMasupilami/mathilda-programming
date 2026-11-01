/* =====================================================================
   Werkstatt-Kern: Geheimschrift der Feen (Einheit 7, Rätselart "geheim")
   Dieselbe Datei läuft im Rätsel-Löser (Node: import), beim Bauen der PDFs
   (Chrome, Bausteine in src/bausteine/e7-geheim.js) und in der Web-App
   (web/spiele/geheim.js). Keine Abhängigkeiten.
   Ergebnis: globalThis.WerkstattGeheim

   Geheimschrift (Kinderwort für Verschlüsselung):
   - nur Großbuchstaben A bis Z und einzelne Leerzeichen (keine Umlaute, kein ß)
   - Schlüssel-Zahl k (1 bis 25): "in Geheimschrift schreiben" schiebt jeden
     Buchstaben k Plätze weiter (nach Z kommt wieder A), "Geheimschrift lesen"
     schiebt k Plätze zurück. 0 und 26 lassen alles, wie es ist.
   - Geheimschrift-Rad: außen die normalen Buchstaben, innen (drehbar) die
     Geheim-Buchstaben mit kleinen Zahlen 0 bis 25. Steht die Zahl k beim
     Stern (beim äußeren A), ist das Rad auf Schlüssel-Zahl k gestellt.
     Schreiben: außen suchen, innen ablesen. Lesen: innen suchen, außen ablesen.
   Feen-Zeichen (zweite Geheimschrift, ein Zeichen pro Buchstabe):
   - A bis E Kreis, F bis J Dreieck, K bis O Quadrat, P bis T Herz,
     U bis Y Tropfen, jeweils mit 1 bis 5 Punkten wie auf einem Würfel;
     Z ist ein Stern ohne Punkte.
   Bewerten in der App: bewerte(level, antwort) (nach dem Ergebnis, ohne gespeicherte Lösung).
   Bilder (für "Mal das passende Bild an" am Blatt und in der App):
   eigene SVG, Koordinaten 0 bis 100, jedes Bild hat ein Wort (BILD_WORT).
   ===================================================================== */
(function (g) {
  'use strict';

  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const N = 26;
  const T = '#1f2340';

  // ---------------------------------------------------------------------
  // Texte prüfen und verschieben
  // ---------------------------------------------------------------------
  // Erlaubt: A bis Z, einzelne Leerzeichen zwischen Wörtern
  function pruefeText(text) {
    const s = String(text === undefined || text === null ? '' : text);
    if (!s.length) return 'Leerer Text';
    if (!/^[A-Z]+( [A-Z]+)*$/.test(s)) {
      const fremd = s.replace(/[A-Z ]/g, '');
      if (fremd) return 'Nur A bis Z und Leerzeichen erlaubt, nicht: ' + Array.from(new Set(fremd)).join(' ');
      return 'Leerzeichen nur einzeln zwischen Wörtern';
    }
    return null;
  }
  function istText(text) { return pruefeText(text) === null; }
  function nr(b) { return ABC.indexOf(b); }
  function buchstabe(i) { return ABC[((i % N) + N) % N]; }
  function schiebe(b, k) {
    const i = nr(b);
    return i < 0 ? b : buchstabe(i + k);
  }
  // In Geheimschrift schreiben (k Plätze weiter)
  function schreiben(text, k) {
    return Array.from(String(text)).map((b) => (b === ' ' ? ' ' : schiebe(b, k))).join('');
  }
  // Geheimschrift lesen (k Plätze zurück)
  function lesen(text, k) { return schreiben(text, -k); }
  // Um wie viel ist b2 gegenüber b1 weitergeschoben? (0 bis 25)
  function abstand(b1, b2) { return (((nr(b2) - nr(b1)) % N) + N) % N; }
  // Stellen (0-basiert), an denen sich zwei gleich lange Texte unterscheiden
  function unterschiede(a, b) {
    const aus = [];
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) aus.push(i);
    return aus;
  }
  // Häufigkeit der Buchstaben: [[buchstabe, anzahl], ...] absteigend
  function haeufigkeit(text) {
    const z = {};
    for (const b of String(text)) if (b !== ' ') z[b] = (z[b] || 0) + 1;
    return Object.entries(z).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
  }

  // ---------------------------------------------------------------------
  // Wortliste (zum Knacken: Welche Schlüssel-Zahl ergibt echte Wörter?)
  // Nur Wörter ohne Umlaute und ohne ß, in Großbuchstaben.
  // ---------------------------------------------------------------------
  const WORTE = new Set((
    'AB ABER ABEND ACH ACHT ALLE ALLES ALS ALT ALTE AM AN ANDERE APFEL ARM AST AUCH AUF AUGE AUGEN AUS AUTO ' +
    'BABY BACH BAD BALD BALL BALLE BAND BANK BART BAU BAUCH BAUM BAUMHAUS BEERE BEI BEIDE BEIN BERG BESEN BETT BIENE BIN BIS BIST BITTE ' +
    'BLATT BLAU BLUME BLUMEN BOOT BRAV BRIEF BRIEFE BROT BRUDER BUCH BUNT BURG BUS BUSSI BUTTER ' +
    'DA DACH DAMIT DANKE DANN DAS DASS DEIN DEINE DEM DEN DENN DER DES DICH DIE DIR DIRNDL DOCH DORF DORT DRACHE DRACHEN DREI DU DURCH DUNKEL ' +
    'EI EIER EIMER EIN EINE EINEM EINEN EINER EINHORN EINS EIS ELF ENDE ENTE ER ERDE ES ESEL ESSEN ETWAS EUCH EULE ' +
    'FAHNE FARBE FEE FEEN FEDER FEIN FELD FENSTER FERTIG FEST FEUER FINDE FINDEN FINDET FISCH FLASCHE FLIEG FLIEGT FLUSS FRAU FREI FREUND FROH FROSCH ' +
    'GABEL GANG GANS GANZ GARTEN GAST GEH GEHE GEHEIM GEHEN GEHT GELB GELD GERN GESCHENK GIB GIBT GLAS GLOCKE GOLD GRAS GUT GUTE ' +
    'HAAR HABE HABEN HALLO HALS HAND HASE HAST HAT HAUS HEFT HELL HEMD HERZ HEU HEUTE HEXE HIER HILFE HIMMEL HIRSCH HOF HOL HOLE HOLEN HOLT HOSE HUHN HUND HUT ' +
    'ICH IGEL IHM IHN IHR IM IN INSEL IST ' +
    'JA JACKE JAUSE JETZT JUNG ' +
    'KALT KAMM KANN KANNST KASTEN KATZE KEKS KEKSE KERZE KIND KINDER KINO KISTE KLEE KLEIN KLUG KNOPF KOBOLD KOCH KOMM KOMMEN KOMMT KOPF KORB KRONE KUCHEN KUH KUSS ' +
    'LACH LACHT LADE LAMPE LAND LANG LAUT LEISE LIEB LIEBE LIES LIEST LILA LOCH LOS LUFT ' +
    'MACH MACHT MAG MAGST MAL MALT MAMA MANN MANTEL MAUS MEER MEHR MEIN MEINE MESSER MICH MILCH MIR MIT MOND MORGEN MUND MUT ' +
    'NACH NACHT NAME NASE NEBEN NEIN NEST NETT NEU NEUN NICHT NOCH NUN NUR ' +
    'OBEN OBST ODER OFEN OFT OHNE OHR OMA ONKEL OPA ' +
    'PAPA PFERD PILZ PIRAT POLSTER POST PUPPE ' +
    'RAD RATE REGEN REH REIS RIESE RING ROSA ROT RUF RUFT RUHE ' +
    'SACK SACKERL SAFT SAG SAGT SALZ SAND SATT SCHAF SCHAL SCHATZ SCHAU SCHAUT SCHIFF SCHLOSS SCHNEE SCHNELL SCHON SCHREIB SCHREIBT SCHUH SCHUHE SCHULE ' +
    'SECHS SEE SEHR SEI SEID SEIN SEINE SEMMEL SERVUS SESSEL SIE SIEBEN SIND SING SINGT SO SOCKE SOCKEN SOFA SONNE SPIEL SPIELE SPIELEN SPIELT SPRING STAB STADT ' +
    'STEIN STEINE STERN STERNE STIEGE STOCK SUCH SUCHE SUCHEN SUCHT SUPER SUPPE ' +
    'TAG TANNE TANTE TANZ TANZT TASCHE TASSE TEE TEIL TELLER TIER TIGER TISCH TOLL TOPF TOR TORTE TRAUM TURM ' +
    'UHR UM UND UNS UNTER ' +
    'VATER VIEL VIER VOGEL VOM VON VOR VORHANG ' +
    'WAGEN WALD WAND WANN WARM WAS WASSER WEG WEIL WEIN WELT WEM WEN WENN WER WIE WIESE WILL WILLST WIND WIR WO WOLKE WORT WURM WURST ' +
    'ZAHL ZAHN ZEHN ZEIT ZELT ZIEGE ZIMMER ZOO ZU ZUCKER ZUCKERL ZUG ZUM ZUR ZWEI ZWERG'
  ).split(/\s+/).filter(Boolean));
  function istWort(w) { return WORTE.has(w); }
  // Alle Wörter eines Texts stehen in der Wortliste
  function nurWorte(text) { return String(text).split(' ').every(istWort); }
  // Knacken: alle Schlüssel-Zahlen 1 bis 25, bei denen das Lesen nur echte Wörter ergibt
  function knacken(geheimtext) {
    const aus = [];
    for (let k = 1; k < N; k++) {
      const t = lesen(geheimtext, k);
      if (nurWorte(t)) aus.push({ schluessel: k, text: t });
    }
    return aus;
  }

  // Um welche Schlüssel-Zahl (0 bis 25) ist wort gegenüber text verschoben? null: gar nicht
  function verschiebung(text, wort) {
    if (!wort || String(wort).length !== String(text).length) return null;
    for (let k = 0; k < N; k++) if (schreiben(text, k) === wort) return k;
    return null;
  }

  // ---------------------------------------------------------------------
  // Bewerten nach dem Ergebnis (Web-App und Test-Plugin, gleiche Regeln wie im Löser)
  //   level: was werkzeuge/arten/geheim.mjs (fuerApp) an die App gibt
  //   antwort: Bild-Name (lesen, zeichen, knacken) oder Buchstaben (schreiben)
  //   Ergebnis: { ok, schluessel? } – bei knacken die gefundene Schlüssel-Zahl
  // ---------------------------------------------------------------------
  function bewerte(level, antwort) {
    const a = level.aufgabe;
    if (a === 'lesen') return { ok: schreiben(wortVonBild(antwort) || '', level.schluessel) === level.geheimtext };
    if (a === 'zeichen') return { ok: wortVonBild(antwort) === level.feen };
    if (a === 'schreiben') return { ok: String(antwort) === schreiben(level.klartext, level.schluessel) };
    if (a === 'knacken') {
      // lesen mit k ergibt das Wort: das Wort ist der Geheimtext k Plätze zurück
      const k = verschiebung(wortVonBild(antwort) || '', level.geheimtext);
      return { ok: k !== null && k >= 1 && nurWorte(wortVonBild(antwort)), schluessel: k };
    }
    return { ok: false };
  }

  // ---------------------------------------------------------------------
  // Feen-Zeichen: Form + Würfel-Punkte
  // ---------------------------------------------------------------------
  const FORMEN = ['kreis', 'dreieck', 'quadrat', 'herz', 'tropfen', 'stern'];
  const FORM_WORT = { kreis: 'Kreis', dreieck: 'Dreieck', quadrat: 'Quadrat', herz: 'Herz', tropfen: 'Tropfen', stern: 'Stern' };
  const FORM_FARBE = { kreis: '#e7dcff', dreieck: '#d6f3ee', quadrat: '#ffe3c9', herz: '#ffd9e4', tropfen: '#d8ecff', stern: '#fff0b3' };
  function feenTeile(b) {
    const i = nr(b);
    if (i < 0) throw new Error('Kein Buchstabe A bis Z: ' + b);
    if (i === 25) return { form: 'stern', punkte: 0 };
    return { form: FORMEN[Math.floor(i / 5)], punkte: (i % 5) + 1 };
  }
  // Würfel-Bild: Punkte um die Mitte (cx, cy), Abstand d
  function wuerfelPunkte(n, cx, cy, d) {
    const L = [[-1, -1], [1, 1]];
    const muster = { 1: [[0, 0]], 2: L, 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] }[n] || [];
    return muster.map(([x, y]) => [cx + x * d, cy + y * d]);
  }
  function sternPfad(cx, cy, R, r, n) {
    n = n || 5;
    let d = '';
    for (let i = 0; i < 2 * n; i++) {
      const rad = i % 2 === 0 ? R : r;
      const w = Math.PI / n * i - Math.PI / 2;
      d += (i ? 'L' : 'M') + (cx + rad * Math.cos(w)).toFixed(2) + ' ' + (cy + rad * Math.sin(w)).toFixed(2);
    }
    return d + 'Z';
  }
  // Inhalt (viewBox 0 0 100 100); farbig: mit hellen Flächen, sonst nur Linien
  function feenInhalt(b, farbig) {
    const { form, punkte } = feenTeile(b);
    const fl = farbig === false ? 'white' : FORM_FARBE[form];
    const st = ' fill="' + fl + '" stroke="' + T + '" stroke-width="6" stroke-linejoin="round"';
    let s = '';
    let cx = 50, cy = 52, d = 15;
    if (form === 'kreis') s = '<circle cx="50" cy="50" r="42"' + st + '/>';
    else if (form === 'dreieck') { s = '<path d="M50 7 L94 90 L6 90 Z"' + st + '/>'; cy = 63; d = 11.5; }
    else if (form === 'quadrat') s = '<rect x="9" y="9" width="82" height="82" rx="6"' + st + '/>';
    else if (form === 'herz') { s = '<path d="M50 92 C20 72 5 55 7 34 C9 15 32 8 50 27 C68 8 91 15 93 34 C95 55 80 72 50 92 Z"' + st + '/>'; cy = 48; d = 13.5; }
    else if (form === 'tropfen') { s = '<path d="M50 5 C66 30 86 46 86 64 C86 83 70 95 50 95 C30 95 14 83 14 64 C14 46 34 30 50 5 Z"' + st + '/>'; cy = 66; d = 13; }
    else s = '<path d="' + sternPfad(50, 54, 47, 20) + '"' + st + '/>';
    for (const [x, y] of wuerfelPunkte(punkte, cx, cy, d)) s += '<circle cx="' + x + '" cy="' + y + '" r="6.8" fill="' + T + '"/>';
    return s;
  }
  function feenZeichen(b, groesse, farbig) {
    const gr = groesse === undefined ? '100%' : String(groesse);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '" aria-hidden="true">' + feenInhalt(b, farbig) + '</svg>';
  }

  // ---------------------------------------------------------------------
  // Bilder (eigene Zeichnungen, 0 bis 100) mit ihrem Wort
  // ---------------------------------------------------------------------
  const s = (w) => ' stroke="' + T + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"';
  const f = (farbe, w) => ' fill="' + farbe + '"' + s(w);
  const li = (w) => ' fill="none"' + s(w);
  const BILDER = {
    mond: '<path d="M62 8 C36 12 20 34 22 56 C24 78 44 94 68 92 C52 84 42 68 42 50 C42 32 50 16 62 8 Z"' + f('#ffe27a') + '/>' +
      '<circle cx="35" cy="52" r="3" fill="' + T + '"/><path d="M33 64 C36 68 41 68 44 66"' + li(3) + '/>',
    stern: '<path d="' + sternPfad(50, 54, 44, 19) + '"' + f('#f2b705') + '/>' +
      '<circle cx="43" cy="52" r="3" fill="' + T + '"/><circle cx="57" cy="52" r="3" fill="' + T + '"/><path d="M44 62 C47 66 53 66 56 62"' + li(3) + '/>',
    sonne: '<path d="M50 6 V18 M50 82 V94 M6 50 H18 M82 50 H94 M19 19 L27 27 M73 73 L81 81 M81 19 L73 27 M27 73 L19 81"' + li(5) + '/>' +
      '<circle cx="50" cy="50" r="26"' + f('#ffd23f') + '/>' +
      '<circle cx="42" cy="46" r="3" fill="' + T + '"/><circle cx="58" cy="46" r="3" fill="' + T + '"/><path d="M41 57 C46 63 54 63 59 57"' + li(3) + '/>',
    herz: '<path d="M50 88 C22 70 8 54 10 34 C12 16 34 10 50 28 C66 10 88 16 90 34 C92 54 78 70 50 88 Z"' + f('#e94f64') + '/>' +
      '<path d="M26 32 C27 26 31 23 36 22"' + li(3.5).replace(T, '#ffffff') + '/>',
    haus: '<path d="M14 48 L50 14 L86 48 Z"' + f('#d1335b') + '/><rect x="22" y="46" width="56" height="44"' + f('#fff4cc') + '/>' +
      '<rect x="44" y="64" width="13" height="26"' + f('#b86b2c', 3.5) + '/><rect x="29" y="56" width="11" height="11"' + f('#8fd3ff', 3) + '/><rect x="62" y="56" width="11" height="11"' + f('#8fd3ff', 3) + '/>',
    krone: '<path d="M12 78 L12 32 L31 52 L50 20 L69 52 L88 32 L88 78 Z"' + f('#f2b705') + '/><path d="M12 68 H88"' + li(3.5) + '/>' +
      '<circle cx="12" cy="28" r="5"' + f('#e94f64', 3) + '/><circle cx="50" cy="16" r="5"' + f('#8fd3ff', 3) + '/><circle cx="88" cy="28" r="5"' + f('#e94f64', 3) + '/>',
    fisch: '<path d="M18 50 C30 28 62 24 78 50 C62 76 30 72 18 50 Z"' + f('#ff9f43') + '/><path d="M78 50 L94 34 L94 66 Z"' + f('#ff9f43') + '/>' +
      '<circle cx="34" cy="45" r="4" fill="' + T + '"/><path d="M50 36 C55 44 55 56 50 64"' + li(3) + '/>' +
      '<circle cx="12" cy="30" r="4"' + f('#8fd3ff', 2.5) + '/><circle cx="8" cy="18" r="3"' + f('#8fd3ff', 2.5) + '/>',
    baum: '<rect x="42" y="58" width="16" height="34" rx="2"' + f('#b86b2c') + '/>' +
      '<path d="M50 8 C68 8 80 22 78 36 C90 42 88 62 72 64 C64 72 36 72 28 64 C12 62 10 42 22 36 C20 22 32 8 50 8 Z"' + f('#7cc96b') + '/>' +
      '<circle cx="36" cy="40" r="4"' + f('#e94f64', 2.5) + '/><circle cx="62" cy="34" r="4"' + f('#e94f64', 2.5) + '/><circle cx="58" cy="54" r="4"' + f('#e94f64', 2.5) + '/>',
    ball: '<circle cx="50" cy="50" r="40"' + f('#ffffff') + '/><path d="M10 50 C30 38 70 38 90 50 M10 50 C30 62 70 62 90 50" fill="none"' + s(3.5) + '/>' +
      '<path d="M14 36 C34 26 66 26 86 36 C66 30 34 30 14 36 Z" fill="#3a7be0"/><path d="M14 64 C34 74 66 74 86 64 C66 70 34 70 14 64 Z" fill="#e0453a"/>' +
      '<circle cx="50" cy="50" r="40" fill="none"' + s(4) + '/>',
    eis: '<path d="M30 46 L50 94 L70 46 Z"' + f('#e0a060') + '/><path d="M36 56 L62 52 M40 66 L58 63 M44 76 L55 74"' + li(2.5) + '/>' +
      '<circle cx="38" cy="38" r="15"' + f('#f9b3c8') + '/><circle cx="62" cy="38" r="15"' + f('#fff4cc') + '/><circle cx="50" cy="22" r="14"' + f('#a7e3a1') + '/>',
    blume: '<path d="M50 56 V94 M50 80 C60 70 70 72 76 74 C70 82 60 84 50 80"' + li(4) + '/>' +
      '<circle cx="50" cy="20" r="13"' + f('#f9b3c8') + '/><circle cx="70" cy="34" r="13"' + f('#f9b3c8') + '/><circle cx="62" cy="56" r="13"' + f('#f9b3c8') + '/>' +
      '<circle cx="38" cy="56" r="13"' + f('#f9b3c8') + '/><circle cx="30" cy="34" r="13"' + f('#f9b3c8') + '/><circle cx="50" cy="40" r="12"' + f('#ffd23f') + '/>',
    apfel: '<path d="M50 30 C34 18 12 26 14 50 C16 74 34 92 50 84 C66 92 84 74 86 50 C88 26 66 18 50 30 Z"' + f('#e0453a') + '/>' +
      '<path d="M50 30 C50 22 52 14 56 8"' + li(4) + '/><path d="M56 18 C64 8 76 10 80 14 C74 22 62 24 56 18 Z"' + f('#7cc96b', 3) + '/>' +
      '<path d="M28 44 C29 38 33 34 38 33"' + li(3.5).replace(T, '#ffffff') + '/>',
  };
  const BILD_WORT = { mond: 'MOND', stern: 'STERN', sonne: 'SONNE', herz: 'HERZ', haus: 'HAUS', krone: 'KRONE', fisch: 'FISCH', baum: 'BAUM', ball: 'BALL', eis: 'EIS', blume: 'BLUME', apfel: 'APFEL' };
  function hatBild(name) { return Object.prototype.hasOwnProperty.call(BILDER, name); }
  function bild(name, groesse) {
    if (!hatBild(name)) throw new Error('Unbekanntes Bild „' + name + '“');
    const gr = groesse === undefined ? '100%' : String(groesse);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '" aria-hidden="true">' + BILDER[name] + '</svg>';
  }
  function wortVonBild(name) { return BILD_WORT[name] || null; }

  // ---------------------------------------------------------------------
  // Geheimschrift-Rad (Maße in mm, Mitte im Punkt 0 0)
  //   teil: 'aussen' (Scheibe mit den normalen Buchstaben und dem Stern beim A),
  //         'innen'  (kleinere Scheibe mit Geheim-Buchstaben und Zahlen 0 bis 25),
  //         'beide'  (innen auf aussen, auf schluessel gedreht)
  //   26 gleiche Teile, A oben, im Uhrzeigersinn
  // ---------------------------------------------------------------------
  const RAD = {
    aussenR: 66, innenR: 48,           // Radien der beiden Scheiben
    aussenText: 55, aussenGr: 9.2,     // äußere Buchstaben: Radius der Mitte, Schrifthöhe
    innenText: 41, innenGr: 7.6,       // innere Buchstaben
    zahlText: 32.5, zahlGr: 4.4,       // kleine Zahlen innen
    sternR: 62.2,                      // Stern beim A (außen, zwischen Buchstabe und Rand)
  };
  const WINKEL = 360 / N;
  const r2 = (x) => Math.round(x * 100) / 100;
  function polar(r, grad) {
    const w = (grad - 90) * Math.PI / 180;
    return [r2(r * Math.cos(w)), r2(r * Math.sin(w))];
  }
  function kreisTeilLinien(r1, r2_, farbe, breite) {
    let p = '';
    for (let i = 0; i < N; i++) {
      const a = polar(r1, (i + 0.5) * WINKEL), b = polar(r2_, (i + 0.5) * WINKEL);
      p += 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1] + ' ';
    }
    return '<path d="' + p + '" stroke="' + farbe + '" stroke-width="' + breite + '" fill="none"/>';
  }
  function textAuf(r, grad, t, gr, farbe, gewicht) {
    const [x, y] = polar(r, grad);
    return '<text x="' + x + '" y="' + y + '" transform="rotate(' + r2(grad) + ' ' + x + ' ' + y + ')" font-family="Andika, sans-serif" font-size="' + gr +
      '" font-weight="' + (gewicht || 700) + '" fill="' + farbe + '" text-anchor="middle" dominant-baseline="central">' + t + '</text>';
  }
  // anmalen: Stern nur als Umriss (zum Anmalen auf der Bastelvorlage)
  function aussenInhalt(anmalen) {
    const R = RAD;
    let s = '<circle cx="0" cy="0" r="' + R.aussenR + '" fill="#ffffff" stroke="' + T + '" stroke-width="0.6"/>';
    // A-Feld golden hinterlegt
    const a1 = polar(R.aussenR, -WINKEL / 2), a2 = polar(R.aussenR, WINKEL / 2), b1 = polar(R.innenR, WINKEL / 2), b2 = polar(R.innenR, -WINKEL / 2);
    s += '<path d="M' + a1[0] + ' ' + a1[1] + ' A' + R.aussenR + ' ' + R.aussenR + ' 0 0 1 ' + a2[0] + ' ' + a2[1] + ' L' + b1[0] + ' ' + b1[1] +
      ' A' + R.innenR + ' ' + R.innenR + ' 0 0 0 ' + b2[0] + ' ' + b2[1] + ' Z" fill="#fff4cc"/>';
    s += kreisTeilLinien(R.innenR - 6, R.aussenR, '#b9bdd3', 0.3);
    s += '<circle cx="0" cy="0" r="' + R.innenR + '" fill="none" stroke="#b9bdd3" stroke-width="0.3" stroke-dasharray="1.2 1"/>';
    for (let i = 0; i < N; i++) s += textAuf(R.aussenText, i * WINKEL, ABC[i], R.aussenGr, T);
    const [sx, sy] = polar(R.sternR, 0);
    s += '<path d="' + sternPfad(sx, sy, 3.2, 1.4) + '" fill="' + (anmalen ? '#ffffff' : '#f2b705') + '" stroke="' + T + '" stroke-width="' + (anmalen ? 0.4 : 0.3) + '" stroke-linejoin="round"/>';
    s += '<circle cx="0" cy="0" r="' + R.aussenR + '" fill="none" stroke="' + T + '" stroke-width="0.6"/>';
    // Mitte: Kreuz für das Loch
    s += '<path d="M-2.5 0 H2.5 M0 -2.5 V2.5" stroke="' + T + '" stroke-width="0.4"/>';
    return s;
  }
  function innenInhalt() {
    const R = RAD;
    let s = '<circle cx="0" cy="0" r="' + R.innenR + '" fill="#e3f6f4" stroke="' + T + '" stroke-width="0.6"/>';
    s += '<circle cx="0" cy="0" r="' + (R.zahlText - 4) + '" fill="#ffffff" stroke="#0f8f87" stroke-width="0.35"/>';
    s += kreisTeilLinien(R.zahlText - 4, R.innenR, '#7fcdbf', 0.3);
    for (let i = 0; i < N; i++) {
      s += textAuf(R.innenText, i * WINKEL, ABC[i], R.innenGr, '#0b6b65');
      s += textAuf(R.zahlText, i * WINKEL, String(i), R.zahlGr, '#6b6f86', 700);
      // 6 und 9 unterstrichen, damit man sie auch kopfüber unterscheidet
      if (i === 6 || i === 9) {
        const [x, y] = polar(R.zahlText, i * WINKEL);
        s += '<path d="M' + r2(x - 1.3) + ' ' + r2(y + 2.6) + ' H' + r2(x + 1.3) + '" stroke="#6b6f86" stroke-width="0.45" stroke-linecap="round" transform="rotate(' + r2(i * WINKEL) + ' ' + x + ' ' + y + ')"/>';
      }
    }
    // Feen-Stern in der Mitte (Deko) und Kreuz für das Loch
    s += '<path d="' + sternPfad(0, 0.5, 13, 5.6) + '" fill="#fff4cc" stroke="#f2b705" stroke-width="0.6" stroke-linejoin="round"/>';
    s += '<path d="M-2.5 0 H2.5 M0 -2.5 V2.5" stroke="' + T + '" stroke-width="0.4"/>';
    return s;
  }
  // SVG des Rads. opt: { teil, schluessel, groesse (z. B. '132mm' oder '100%'), anmalen (Stern als Umriss) }
  function radSVG(opt) {
    const o = opt || {};
    const teil = o.teil || 'beide';
    const R = RAD;
    const halb = teil === 'innen' ? R.innenR + 0.5 : R.aussenR + 0.5;
    const vb = r2(-halb) + ' ' + r2(-halb) + ' ' + r2(2 * halb) + ' ' + r2(2 * halb);
    const gr = o.groesse || (r2(2 * halb) + 'mm');
    let inhalt = '';
    if (teil === 'aussen') inhalt = aussenInhalt(o.anmalen);
    else if (teil === 'innen') inhalt = innenInhalt();
    else {
      const k = ((Math.round(o.schluessel || 0) % N) + N) % N;
      inhalt = aussenInhalt() + '<g transform="rotate(' + r2(-k * WINKEL) + ')">' + innenInhalt() + '</g>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + gr + '" height="' + gr + '" role="img" aria-label="Geheimschrift-Rad">' + inhalt + '</svg>';
  }
  // Welcher innere (Geheim-)Buchstabe steht beim äußeren Buchstaben b, wenn das Rad auf k steht?
  function radInnen(b, k) { return schiebe(b, k); }

  g.WerkstattGeheim = {
    ABC, N, WORTE, FORMEN, FORM_WORT, BILDER, BILD_WORT, RAD, WINKEL,
    pruefeText, istText, nr, buchstabe, schiebe, schreiben, lesen, abstand, unterschiede, haeufigkeit,
    istWort, nurWorte, knacken, verschiebung, bewerte,
    feenTeile, feenInhalt, feenZeichen,
    hatBild, bild, wortVonBild,
    radSVG, radInnen, aussenInhalt, innenInhalt,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
