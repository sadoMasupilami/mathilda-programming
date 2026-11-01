/* =====================================================================
   Bausteine für Einheit 7 „Geheimschrift der Feen“ (Rätselart geheim)
   Alle Lösungen kommen aus dem Löser (werkzeuge/arten/geheim.mjs → r.loesung)
   oder werden mit derselben Kern-Datei (web/kern/geheim.js) ausgerechnet.
   In der Lösungsansicht stehen sie rot.

     <m-e7-lesen raetsel="e7-l1" [umbruch="2"] [gr="12"] [bilder="nein"]>
         Geheimtext, darunter Kästchen zum Eintragen; optional Bilder zum Anmalen
         (Lösung: rote Buchstaben, das passende Bild rot eingekreist).
         umbruch: neue Zeile nach dem 2. Wort (mehrere: "2,4")
     <m-e7-knacken raetsel="e7-p1">     wie lesen, dazu „Schlüssel-Zahl“ zum Eintragen
     <m-e7-kobold raetsel="e7-k1">      wie lesen; Lösung: Kobold-Buchstabe eingekreist,
                                        darunter das richtige Wort und der richtige Geheim-Buchstabe
     <m-e7-schreiben raetsel="e7-n1">   normale Buchstaben, darunter Kästchen für die Geheimschrift
     <m-e7-schreiben name schluessel="3">   dasselbe mit dem Namen des Kindes (aus kind.json)
     <m-e7-zeichen raetsel="e7-z1">     Feen-Zeichen, darunter Kästchen; optional Bilder
     <m-e7-zeichen raetsel="e7-z2" schreiben>   Buchstaben, darunter große Kästchen zum Malen
     <m-e7-alphabet [gr="10"] [spalten="13"]>    die Feen-Zeichen-Tabelle A bis Z
     <m-e7-rad teil="aussen|innen|beide" [schluessel="3"] [gr="132"] [anmalen]>   Geheimschrift-Rad
         (gr = Durchmesser in mm, ohne gr: Originalgröße zum Ausschneiden; anmalen: Stern als Umriss)
     <m-e7-text schreibe="MOND" k="3" [soll="PRQG"]>   im Fließtext: Geheimschrift, ausgerechnet
     <m-e7-text lies="PRQG" k="3" [soll="MOND"]>       im Fließtext: gelesen, ausgerechnet
     <m-e7-feld schreibe="A" k="3">  Antwortkästchen mit ausgerechneter Lösung (auch lies="…")
     <m-e7-feen text="FEE" [gr="6"]>    Feen-Zeichen im Fließtext
     <m-e7-bild name="mond" [gr="12"]>  ein Bild aus web/kern/geheim.js
     <m-e7-post raetsel="e7-post" [spick]>   Tabelle Versteck / Geheimschrift (Feen-Post), spick: kompakt
     <m-e7-versuche raetsel="e7-p1" [bis="5"]>   Knacken: was jede Schlüssel-Zahl ergibt
     <m-e7-kette raetsel="e7-x1">       zwei Schlüssel hintereinander, Schritt für Schritt
   Beschreibung der Rätsel-Felder: werkzeuge/arten/geheim.mjs
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const G = () => window.WerkstattGeheim;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const CSS = `
m-e7-lesen, m-e7-knacken, m-e7-kobold, m-e7-schreiben, m-e7-zeichen, m-e7-alphabet, m-e7-post { display: block; }
m-e7-rad, m-e7-bild, m-e7-feen, m-e7-feld { display: inline-block; vertical-align: middle; line-height: 0; }
m-e7-rad svg, m-e7-bild svg { display: block; }
m-e7-text { display: inline; }
.e07-gt { font-family: var(--kind); font-weight: 700; letter-spacing: 0.06em; white-space: nowrap; }
.e07-feen { display: inline-flex; gap: 0.6mm; vertical-align: middle; }
.e07-feen svg { display: block; }
.e07-aufg { display: flex; flex-wrap: wrap; align-items: center; gap: 4mm 9mm; }
.e07-zeilen { display: flex; flex-direction: column; gap: 3mm; }
.e07-reihe { display: flex; align-items: flex-end; gap: 1.4mm; }
.e07-zelle { display: flex; flex-direction: column; align-items: center; gap: 0.6mm; width: var(--gr, 12mm); }
.e07-oben { font-family: var(--kind); font-weight: 700; font-size: 20pt; line-height: 1; height: 7.6mm; display: flex; align-items: center; justify-content: center;
  width: calc(var(--gr, 12mm) - 1mm); color: var(--tinte); border-radius: 50%; }
.e07-oben.klar { color: #0b6b65; }
.e07-oben svg { display: block; }
.e07-zeichen .e07-oben { height: var(--zgr, 11mm); width: var(--zgr, 11mm); }
.e07-box { width: var(--gr, 12mm); height: var(--gr, 12mm); border: 0.55mm solid var(--tinte); border-radius: 1.8mm; background: white;
  display: flex; align-items: center; justify-content: center; font-family: var(--kind); font-size: 20pt; line-height: 1; }
.e07-box.gross { width: var(--sgr, 15mm); height: var(--sgr, 15mm); }
.e07-zelle.gross { width: var(--sgr, 15mm); }
.e07-box svg { display: block; width: 84%; height: 84%; }
.e07-box .lsg-zeichen { visibility: hidden; display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; }
.loesungsmodus .e07-box .lsg-zeichen { visibility: visible; }
.loesungsmodus .e07-box.mit-lsg { border-color: var(--rot); }
.e07-luecke { width: 4.5mm; flex: none; }
.loesungsmodus .e07-zelle.kobold .e07-oben { outline: 0.8mm solid var(--rot); outline-offset: -0.2mm; }
.e07-bilder { display: flex; gap: 4mm; align-items: center; }
.e07-bild { padding: 1.2mm; border-radius: 50%; line-height: 0; }
.loesungsmodus .e07-bild.richtig { outline: 0.9mm solid var(--rot); }
.e07-antwort { display: flex; flex-wrap: wrap; align-items: center; gap: 2mm 8mm; margin-top: 3mm; font-family: var(--kind); font-size: 16pt; }
.e07-antwort.e07-neben { margin-top: 0; align-self: flex-end; }
.e07-antwort > span { display: inline-flex; align-items: center; gap: 2mm; white-space: nowrap; }
.e07-alphabet { display: grid; grid-template-columns: repeat(var(--sp, 13), var(--zb, 13mm)); border: 0.45mm solid var(--tinte); border-radius: 2mm; overflow: hidden; width: max-content; background: white; }
.e07-az { display: flex; flex-direction: column; align-items: center; gap: 0.6mm; padding: 1.4mm 0 1mm 0; border-right: 0.3mm solid var(--linie); border-bottom: 0.3mm solid var(--linie); }
.e07-az svg { display: block; }
.e07-az b { font-family: var(--kind); font-size: 15pt; line-height: 1; }
.e07-az.r { border-right: none; }
.e07-az.u { border-bottom: none; }
table.e07-post td:nth-child(2n) { font-family: var(--kind); font-weight: 700; letter-spacing: 0.06em; }
.e07-versuche { font-family: var(--kind); }
.e07-versuche b { color: var(--rot); }
`;
  function stil() {
    if (document.getElementById('e07-stil')) return;
    const st = document.createElement('style');
    st.id = 'e07-stil';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------
  function raetselVon(el, aufgaben) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'geheim') { H().fehler(el, 'Rätsel „' + id + '“ ist nicht art "geheim"'); return null; }
    if (aufgaben && !aufgaben.includes(r.aufgabe)) { H().fehler(el, 'Rätsel „' + id + '“ hat aufgabe „' + r.aufgabe + '“, hier geht nur: ' + aufgaben.join(', ')); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  const esc = (s) => H().esc(s);
  // Wort-Grenzen für Zeilenumbrüche: umbruch="2,4" → neue Zeile nach dem 2. und 4. Wort
  function zeilenVon(el, text) {
    const woerter = text.split(' ');
    const nach = (el.getAttribute('umbruch') || '').split(',').map((x) => parseInt(x, 10)).filter((x) => x > 0 && x < woerter.length);
    const zeilen = [];
    let akt = [];
    woerter.forEach((w, i) => { akt.push({ w, i }); if (nach.includes(i + 1)) { zeilen.push(akt); akt = []; } });
    if (akt.length) zeilen.push(akt);
    return zeilen;
  }
  // Zeilen aus Zellen bauen. zelle(buchstabe, stelle) liefert HTML; Stelle zählt über den ganzen Text (mit Leerzeichen)
  function zellenHTML(el, text, zelle) {
    const zeilen = zeilenVon(el, text);
    const starts = [];
    let p = 0;
    for (const w of text.split(' ')) { starts.push(p); p += w.length + 1; }
    return '<div class="e07-zeilen">' + zeilen.map((z) => '<div class="e07-reihe">' +
      z.map(({ w, i }, j) => (j ? '<span class="e07-luecke"></span>' : '') + Array.from(w).map((b, k) => zelle(b, starts[i] + k)).join('')).join('') +
      '</div>').join('') + '</div>';
  }
  // Rote Lösung im Kästchen (ohne den Rahmen eines m-feld)
  function lsgBox(inhalt, L) { return '<span class="e07-box' + (L ? ' mit-lsg' : '') + '"><span class="lsg">' + esc(inhalt) + '</span></span>'; }
  function grVon(el, text, std) {
    const gr = parseFloat(el.getAttribute('gr') || String(std));
    // Breite pro Zeile prüfen: höchstens 176 mm (Satzspiegel des Blatts)
    for (const z of zeilenVon(el, text)) {
      const zellen = z.reduce((a, x) => a + x.w.length, 0), luecken = z.length - 1;
      const breite = zellen * (gr + 1.4) + luecken * 5.9;
      if (breite > 176) H().fehler(el, 'Zeile zu breit (' + Math.round(breite) + ' mm): umbruch="…" setzen oder gr kleiner');
    }
    return gr;
  }
  function bilderHTML(r, L, gr) {
    if (!r.bilder) return '';
    const richtig = r.loesung.bild;
    return '<div class="e07-bilder">' + r.bilder.map((b) => '<span class="e07-bild' + (b === richtig ? ' richtig' : '') + '">' + G().bild(b, gr + 'mm') + '</span>').join('') + '</div>';
  }
  function feldHTML(l, art) { return H().feldHTML(String(l), art); }

  // ---------------------------------------------------------------------
  // Geheimtext lesen (lesen, knacken, kobold)
  // ---------------------------------------------------------------------
  // extra: HTML unter der Aufgabe; neben: HTML in derselben Zeile (rechts neben den Kästchen)
  function lesenBaustein(el, aufgaben, extra, neben) {
    stil();
    const r = raetselVon(el, aufgaben);
    if (!r) return;
    const L = istLoesung(el);
    const l = r.loesung;
    const geheim = r.geheimtext;
    const gelesen = r.aufgabe === 'kobold' ? l.gelesen : l.klartext;
    const gr = grVon(el, geheim, 12);
    const koboldStelle = r.aufgabe === 'kobold' ? l.stelle - 1 : -1;
    const zellen = zellenHTML(el, geheim, (b, i) => '<span class="e07-zelle' + (i === koboldStelle ? ' kobold' : '') + '"><span class="e07-oben">' + b + '</span>' + lsgBox(gelesen[i], L) + '</span>');
    let html = '<div class="e07-aufg" style="--gr:' + gr + 'mm">' + zellen;
    if (el.getAttribute('bilder') !== 'nein') html += bilderHTML(r, L, parseFloat(el.getAttribute('bildgr') || '17'));
    if (neben) html += neben(r, l, L);
    html += '</div>';
    if (extra) html += extra(r, l, L);
    el.innerHTML = html;
    el.dataset.loesung = gelesen;
    el.classList.add('komp', 'geprueft');
  }
  B['m-e7-lesen'] = (el) => lesenBaustein(el, ['lesen']);
  B['m-e7-knacken'] = (el) => lesenBaustein(el, ['knacken'], null, (r, l) =>
    '<div class="e07-antwort e07-neben"><span>Schlüssel-Zahl: ' + feldHTML(l.schluessel, 'k') + '</span></div>');
  B['m-e7-kobold'] = (el) => lesenBaustein(el, ['kobold'], (r, l) =>
    '<div class="e07-antwort"><span>Richtig heißt das Wort: ' + feldHTML(l.richtigesWort, 'text') + '</span>' +
    (el.hasAttribute('geheimfeld') ? '<span>Richtiger Geheim-Buchstabe: ' + feldHTML(l.richtig, 'k') + '</span>' : '') + '</div>' +
    '<p class="lsg-nur" style="font-size:13pt;margin:2mm 0 0 0">Der Kobold hat ' + l.falsch + ' statt ' + l.richtig + ' geschrieben (gelesen: ' + l.falschesWort + ').' +
    // andere Buchstaben an derselben Stelle, die auch echte Wörter ergeben (der Löser lässt keine andere Stelle zu)
    (l.auch && l.auch.length ? ' Auch ein echtes Wort: ' + l.auch.map((a) => esc(a.text)).join(', ') + '.' : '') + '</p>');

  // ---------------------------------------------------------------------
  // In Geheimschrift schreiben (Rätsel oder der Name des Kindes)
  // ---------------------------------------------------------------------
  // Name in Großbuchstaben A bis Z: Umlaute als AE, OE, UE, ß als SS, Akzente weg, Bindestrich als Lücke
  function nameAlsText(name) {
    let t = String(name).toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ|ß/g, 'SS');
    t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-\s]+/g, ' ').trim();
    return t;
  }
  B['m-e7-schreiben'] = function (el) {
    stil();
    const L = istLoesung(el);
    let klar, geheim;
    if (el.hasAttribute('name')) {
      const k = parseInt(el.getAttribute('schluessel') || '', 10);
      if (!(k >= 1 && k <= 25)) return H().fehler(el, 'schluessel="1…25" fehlt');
      klar = nameAlsText(H().KIND);
      const f = G().pruefeText(klar);
      if (f) return H().fehler(el, 'Der Name lässt sich nicht in A bis Z schreiben: ' + f);
      geheim = G().schreiben(klar, k);
    } else {
      const r = raetselVon(el, ['schreiben']);
      if (!r) return;
      klar = r.loesung.klartext;
      geheim = r.loesung.geheimtext;
    }
    // lange Namen: Kästchen kleiner
    let std = 12;
    const laengste = Math.max(...zeilenVon(el, klar).map((z) => z.reduce((a, x) => a + x.w.length, 0) * 13.4 + (z.length - 1) * 5.9));
    if (laengste > 176) std = Math.max(9, Math.floor((176 / (laengste / 13.4)) - 1.4));
    const gr = grVon(el, klar, std);
    el.innerHTML = '<div class="e07-aufg" style="--gr:' + gr + 'mm">' +
      zellenHTML(el, klar, (b, i) => '<span class="e07-zelle"><span class="e07-oben klar">' + b + '</span>' + lsgBox(geheim[i], L) + '</span>') + '</div>';
    el.dataset.loesung = geheim;
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // Feen-Zeichen lesen oder schreiben, Feen-Zeichen-Tabelle
  // ---------------------------------------------------------------------
  B['m-e7-zeichen'] = function (el) {
    stil();
    const r = raetselVon(el, ['zeichen']);
    if (!r) return;
    const L = istLoesung(el);
    const klar = r.loesung.klartext;
    if (el.hasAttribute('schreiben')) {
      const sgr = parseFloat(el.getAttribute('gr') || '15');
      el.innerHTML = '<div class="e07-aufg" style="--gr:' + sgr + 'mm;--sgr:' + sgr + 'mm">' +
        zellenHTML(el, klar, (b) => '<span class="e07-zelle gross"><span class="e07-oben klar">' + b + '</span><span class="e07-box gross' + (L ? ' mit-lsg' : '') + '"><span class="lsg-zeichen">' + G().feenZeichen(b) + '</span></span></span>') + '</div>';
    } else {
      const gr = grVon(el, klar, 12);
      const zgr = Math.min(gr, 11);
      el.innerHTML = '<div class="e07-aufg e07-zeichen" style="--gr:' + gr + 'mm;--zgr:' + zgr + 'mm">' +
        zellenHTML(el, klar, (b) => '<span class="e07-zelle"><span class="e07-oben">' + G().feenZeichen(b, zgr + 'mm') + '</span>' + lsgBox(b, L) + '</span>') +
        (el.getAttribute('bilder') !== 'nein' ? bilderHTML(r, L, parseFloat(el.getAttribute('bildgr') || '17')) : '') + '</div>';
    }
    el.dataset.loesung = klar;
    el.classList.add('komp', 'geprueft');
  };

  B['m-e7-alphabet'] = function (el) {
    stil();
    const gr = parseFloat(el.getAttribute('gr') || '9.5');
    const sp = parseInt(el.getAttribute('spalten') || '13', 10);
    const zb = parseFloat(el.getAttribute('breite') || '13');
    const n = G().ABC.length;
    const zeilen = Math.ceil(n / sp);
    let html = '<div class="e07-alphabet" style="--sp:' + sp + ';--zb:' + zb + 'mm">';
    Array.from(G().ABC).forEach((b, i) => {
      const r = i % sp === sp - 1 ? ' r' : '', u = Math.floor(i / sp) === zeilen - 1 ? ' u' : '';
      html += '<span class="e07-az' + r + u + '">' + G().feenZeichen(b, gr + 'mm') + '<b>' + b + '</b></span>';
    });
    el.innerHTML = html + '</div>';
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // Geheimschrift-Rad
  // ---------------------------------------------------------------------
  B['m-e7-rad'] = function (el) {
    stil();
    const teil = el.getAttribute('teil') || 'beide';
    if (!['aussen', 'innen', 'beide'].includes(teil)) return H().fehler(el, 'teil="aussen|innen|beide"');
    const k = parseInt(el.getAttribute('schluessel') || '0', 10);
    const R = G().RAD;
    // gr = Durchmesser in mm; ohne Angabe: Originalgröße (zum Ausschneiden)
    const echt = 2 * (teil === 'innen' ? R.innenR : R.aussenR) + 1;
    const gr = parseFloat(el.getAttribute('gr') || String(echt));
    el.innerHTML = G().radSVG({ teil, schluessel: k, groesse: gr + 'mm', anmalen: el.hasAttribute('anmalen') });
    el.classList.add('komp');
    // Verkleinertes Rad = Bild zum Wiedererkennen (gelesen wird am ausgeschnittenen Rad): Prüfung der Schriftgröße entfällt
    if (gr < echt - 1) el.setAttribute('data-nebenschrift', '');
  };

  // ---------------------------------------------------------------------
  // Im Fließtext der Anleitung
  // ---------------------------------------------------------------------
  B['m-e7-text'] = function (el) {
    stil();
    const k = parseInt(el.getAttribute('k') || '', 10);
    if (!(k >= 0 && k <= 26)) return H().fehler(el, 'k="0…26" fehlt');
    const quelle = el.getAttribute('schreibe') !== null ? el.getAttribute('schreibe') : el.getAttribute('lies');
    if (quelle === null) return H().fehler(el, 'schreibe="…" oder lies="…" fehlt');
    const f = G().pruefeText(quelle);
    if (f) return H().fehler(el, f);
    const aus = el.hasAttribute('schreibe') ? G().schreiben(quelle, k) : G().lesen(quelle, k);
    if (el.hasAttribute('soll') && el.getAttribute('soll') !== aus) return H().fehler(el, 'Ergibt „' + aus + '“, nicht „' + el.getAttribute('soll') + '“');
    el.innerHTML = '<span class="e07-gt">' + esc(aus) + '</span>';
    el.classList.add('komp', 'geprueft');
  };
  B['m-e7-feld'] = function (el) {
    const k = parseInt(el.getAttribute('k') || '', 10);
    if (!(k >= 0 && k <= 26)) return H().fehler(el, 'k="0…26" fehlt');
    const q = el.hasAttribute('schreibe') ? el.getAttribute('schreibe') : el.getAttribute('lies');
    const f = G().pruefeText(q);
    if (f) return H().fehler(el, f);
    const aus = el.hasAttribute('schreibe') ? G().schreiben(q, k) : G().lesen(q, k);
    el.innerHTML = feldHTML(aus, aus.length === 1 ? 'k' : 'text');
    el.dataset.loesung = aus;
    el.classList.add('komp', 'geprueft');
  };
  B['m-e7-feen'] = function (el) {
    stil();
    const t = el.getAttribute('text') || '';
    const f = G().pruefeText(t);
    if (f) return H().fehler(el, f);
    const gr = parseFloat(el.getAttribute('gr') || '5.5');
    el.innerHTML = '<span class="e07-feen">' + Array.from(t).map((b) => (b === ' ' ? '<span style="width:' + gr / 2 + 'mm"></span>' : G().feenZeichen(b, gr + 'mm'))).join('') + '</span>';
    el.classList.add('komp');
  };
  B['m-e7-bild'] = function (el) {
    stil();
    const n = el.getAttribute('name');
    if (!G().hatBild(n)) return H().fehler(el, 'Unbekanntes Bild „' + n + '“ (' + Object.keys(G().BILDER).join(', ') + ')');
    el.innerHTML = G().bild(n, parseFloat(el.getAttribute('gr') || '12') + 'mm');
    el.classList.add('komp');
  };
  B['m-e7-post'] = function (el) {
    stil();
    const r = raetselVon(el, ['liste']);
    if (!r) return;
    const p = r.loesung.paare;
    // spick: kompakt, 3 Paare pro Zeile; sonst 2 Paare pro Zeile
    const proZeile = el.hasAttribute('spick') ? 3 : 2;
    const zeilen = Math.ceil(p.length / proZeile);
    let html = '<table class="' + (el.hasAttribute('spick') ? 'spick-tab' : 'tab') + ' e07-post"><tr>';
    for (let j = 0; j < proZeile; j++) html += '<th>Versteck</th><th>' + (j === 0 && !el.hasAttribute('spick') ? 'in Geheimschrift (Schlüssel-Zahl ' + r.loesung.schluessel + ')' : 'Geheimschrift') + '</th>';
    html += '</tr>';
    for (let i = 0; i < zeilen; i++) {
      html += '<tr>';
      for (let j = 0; j < proZeile; j++) {
        const x = p[i + j * zeilen];
        html += '<td>' + (x ? esc(x[0]) : '') + '</td><td>' + (x ? esc(x[1]) : '') + '</td>';
      }
      html += '</tr>';
    }
    el.innerHTML = html + '</table>';
    el.classList.add('komp', 'geprueft');
  };
  B['m-e7-versuche'] = function (el) {
    stil();
    const r = raetselVon(el, ['knacken']);
    if (!r) return;
    const bis = parseInt(el.getAttribute('bis') || String(r.loesung.schluessel), 10);
    el.innerHTML = '<span class="e07-versuche">' + r.loesung.versuche.filter((v) => v.schluessel <= bis)
      .map((v) => (v.schluessel === r.loesung.schluessel ? '<b>' + v.schluessel + ': ' + esc(v.text) + '</b>' : v.schluessel + ': ' + esc(v.text))).join(', ') + '</span>';
    el.classList.add('komp', 'geprueft');
  };
  B['m-e7-kette'] = function (el) {
    stil();
    const r = raetselVon(el, ['kette']);
    if (!r) return;
    const l = r.loesung;
    el.innerHTML = '<span class="e07-gt">' + esc(l.klartext) + '</span>' + l.schritte.map((s) => ', mit ' + s.schluessel + ' geschrieben: <span class="e07-gt">' + esc(s.text) + '</span>').join('');
    el.classList.add('komp', 'geprueft');
  };
})();
