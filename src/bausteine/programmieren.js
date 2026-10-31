/* =====================================================================
   Bausteine fürs Programmieren (Blätter und Anleitung)
     <m-symbol>       Symbol aus web/kern/symbole.js (vor, links, rechts, drache, schatz …)
     <m-gitter>       Pfeil-Gitter mit Drache, Blickrichtung, Schatz, Hindernissen
     <m-programm>     nummerierte Programm-Reihe (mit Zauber-Kasten)
     <m-qr>           QR-Code zum Level-Paket der Web-App (beim Bauen erzeugt)
     <m-linksrechts>  die immer gleichen Hilfen für links und rechts
   Alle Rätsel kommen aus raetsel/*.json und sind beim Bauen schon gelöst
   (werkzeuge/raetsel.mjs). Beschreibung: vorlagen/AUTOREN-LEITFADEN.md
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSymbole;
  const K = () => window.WerkstattKern;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  function raetselVon(el) {
    const id = el.getAttribute('raetsel');
    if (!id) return null;
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return undefined; }
    return r;
  }
  function weltVon(r) {
    const w = {};
    for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine', 'zielSymbol']) if (r[f] !== undefined) w[f] = r[f];
    return w;
  }
  const paar = (s) => s.split(',').map((x) => x.trim());

  // ---------------------------------------------------------------------
  // <m-symbol name="vor" gr="12">   (gr in mm, Standard 10)
  // ---------------------------------------------------------------------
  B['m-symbol'] = function (el) {
    const name = el.getAttribute('name');
    const gr = parseFloat(el.getAttribute('gr') || '10');
    if (!S().SYMBOLE[name]) return H().fehler(el, 'Unbekanntes Symbol „' + name + '“. Es gibt: ' + Object.keys(S().SYMBOLE).join(', '));
    let svg = S().symbol(name, gr + 'mm');
    const blick = el.getAttribute('blick');
    if (blick) {
      const r = { oben: 0, rechts: 90, unten: 180, links: 270 }[blick];
      if (r === undefined) return H().fehler(el, 'blick: oben, rechts, unten, links');
      svg = svg.replace('aria-hidden="true">', 'aria-hidden="true"><g transform="rotate(' + r + ' 50 50)">').replace(/<\/svg>$/, '</g></svg>');
    }
    el.innerHTML = svg;
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-gitter raetsel="e2-1" feld="22" [loesung="weg|keine|nach:3|ende"] [ohne-ziel]>
  // <m-gitter deko b="3" h="3" start="0,2,oben" ziel="2,0" hindernisse="1,1;2,2" feld="20">
  // ---------------------------------------------------------------------
  B['m-gitter'] = function (el) {
    const feld = parseFloat(el.getAttribute('feld') || '22');
    if (feld < 20) return H().fehler(el, 'Felder mindestens 20 mm (feld="20")');
    let r = raetselVon(el);
    if (r === undefined) return;
    let w;
    if (r) w = weltVon(r);
    else {
      if (!el.hasAttribute('deko')) return H().fehler(el, 'm-gitter braucht raetsel="…" (oder deko für Bilder ohne Aufgabe)');
      w = { b: +el.getAttribute('b'), h: +el.getAttribute('h') };
      if (el.getAttribute('start')) { const [x, y, blick] = paar(el.getAttribute('start')); w.start = { x: +x, y: +y, blick: blick || 'oben' }; }
      if (el.getAttribute('ziel')) { const [x, y] = paar(el.getAttribute('ziel')); w.ziel = { x: +x, y: +y }; }
      w.hindernisse = (el.getAttribute('hindernisse') || '').split(';').filter(Boolean).map((p) => paar(p).map(Number));
      w.edelsteine = (el.getAttribute('edelsteine') || '').split(';').filter(Boolean).map((p) => paar(p).map(Number));
      if (el.getAttribute('ziel-symbol')) w.zielSymbol = el.getAttribute('ziel-symbol');
      try { if (w.start) K().welt(w); } catch (e) { return H().fehler(el, e.message); }
    }
    // Ein Feld ist genau feld mm groß (die viewBox hat 6 Einheiten Rand pro Seite)
    const opt = { breite: (feld * (w.b * 100 + 12) / 100).toFixed(2) + 'mm', hoehe: (feld * (w.h * 100 + 12) / 100).toFixed(2) + 'mm', label: r ? 'Gitter ' + r.id : 'Gitter' };
    if (el.hasAttribute('ohne-ziel')) { w = Object.assign({}, w); delete w.ziel; }
    if (el.hasAttribute('ohne-drache')) opt.ohneDrache = true;
    if (!w.start) opt.ohneDrache = true;
    const modus = el.getAttribute('loesung') || 'weg';
    if (istLoesung(el) && r && r.loesung && modus !== 'keine') {
      const L = r.loesung;
      let prog = null;
      if (r.art === 'pfad') prog = L.beispiel || (L.programme && L.programme[0]);
      if (r.art === 'lesen') prog = L.programm;
      if (r.art === 'kobold') prog = L.gemeint;
      if (r.art === 'kuerzer') prog = L.lang;
      if (prog) {
        let e = K().ausfuehren(weltVon(r), prog);
        let weg = e.schritte.map((s) => s.nachher);
        if (/^nach:\d+$/.test(modus)) weg = weg.slice(0, +modus.split(':')[1]);
        opt.weg = weg;
        opt.geist = true;
        if (modus === 'ende' && weg.length) { opt.weg = []; opt.ohneDrache = true; opt.geist = false; opt.endeGeist = weg[weg.length - 1]; }
      }
    }
    let svg = S().gitter(w, opt);
    if (opt.endeGeist) {
      const e = opt.endeGeist;
      svg = svg.replace(/<\/svg>$/, '<circle cx="' + (e.x * 100 + 50) + '" cy="' + (e.y * 100 + 50) + '" r="46" fill="none" stroke="' + S().FARBE.rot + '" stroke-width="6"/>' +
        S().figur('drache', e.x, e.y, e.blick, ' opacity="0.8"') + '</svg>');
    }
    el.innerHTML = svg;
    el.classList.add('komp');
    if (r) el.classList.add('geprueft');
  };

  // ---------------------------------------------------------------------
  // <m-programm …>  nummerierte Reihe
  //   befehle="vor vor rechts 3[vor]"          fertiges Programm zeigen
  //   raetsel="e2-1" [teil="leer|programm|kurz|lang|zauber"] [plaetze="8"]
  //       leer:     leere Kästchen; Lösung = kürzestes Programm (oder Beispiel)
  //       programm: das Programm aus dem Rätsel (lesen, kobold); bei kobold zeigt die Lösung die Reparatur
  //       lang/kurz: bei „kuerzer“-Rätseln; kurz zeigt leere Kästchen in der Form des kurzen Programms
  //       zauber:   leere Form des kürzesten Programms mit Zauber-Kasten (pfad mit "zauber": true)
  //   leer="6"                                  6 leere Kästchen ohne Lösung (zum Selbererfinden)
  //   gr="14"  Kästchengröße in mm;  nummern="nein"
  // ---------------------------------------------------------------------
  function box(inhalt, nr, gr, extraCls, zusatz) {
    // nr === false: ganz ohne Nummernzeile (nummern="nein"); '' = leere Zeile, damit die Reihe bündig bleibt
    const nrHtml = nr === false ? '' : nr ? '<span class="nr">' + nr + '</span>' : '<span class="nr">&nbsp;</span>';
    return '<span class="platz' + (extraCls ? ' ' + extraCls : '') + '">' + nrHtml +
      '<span class="box' + (inhalt ? (inhalt.indexOf('lsg-symbol') >= 0 ? ' leer lsg-box' : '') : ' leer') + '">' + (inhalt || '') + (zusatz || '') + '</span></span>';
  }
  function sym(b) { return S().symbol(b); }
  function lsgSym(b) { return '<span class="lsg-symbol">' + S().symbol(b) + '</span>'; }

  B['m-programm'] = function (el) {
    const h = H();
    let gr = parseFloat(el.getAttribute('gr') || '14');
    const mitNr = el.getAttribute('nummern') !== 'nein';
    let r = raetselVon(el);
    if (r === undefined) return;
    let teile = null;       // anzuzeigendes Programm
    let loesung = null;     // Programm, das in leere Kästchen gehört
    let leer = 0;
    let form = null;        // leere Form (mit Zauber-Kasten)
    let kobold = null;
    try {
      if (el.hasAttribute('befehle')) teile = K().lies(el.getAttribute('befehle'));
      else if (r) {
        const L = r.loesung || {};
        const teil = el.getAttribute('teil') || (r.art === 'pfad' ? 'leer' : r.art === 'kuerzer' ? 'lang' : 'programm');
        if (teil === 'leer') {
          if (r.art !== 'pfad') return h.fehler(el, 'teil="leer" nur bei pfad-Rätseln');
          loesung = K().lies(L.beispiel || L.programme[0]);
          leer = el.hasAttribute('plaetze') ? +el.getAttribute('plaetze') : Math.max(8, loesung.length);
          if (loesung.length > leer) return h.fehler(el, 'Lösung hat ' + loesung.length + ' Befehle, aber nur ' + leer + ' Kästchen');
        } else if (teil === 'programm') {
          if (r.art === 'lesen') teile = K().lies(L.programm);
          else if (r.art === 'kobold') { teile = K().lies(r.programm); kobold = L; }
          else return h.fehler(el, 'teil="programm" nur bei lesen oder kobold');
        } else if (teil === 'lang' || teil === 'kurz') {
          if (r.art !== 'kuerzer') return h.fehler(el, 'teil="' + teil + '" nur bei kuerzer-Rätseln');
          if (teil === 'lang') teile = K().lies(L.lang);
          else if (el.hasAttribute('zeige')) teile = K().lies(L.kurz);
          else form = K().lies(L.kurz);
        } else if (teil === 'zauber') {
          if (r.art !== 'pfad' || !L.zauber) return h.fehler(el, 'teil="zauber" nur bei pfad-Rätseln mit "zauber": true');
          form = K().lies(L.zauber.kuerzeste[0]);
        } else return h.fehler(el, 'Unbekannter teil „' + teil + '“');
      } else if (el.hasAttribute('leer')) leer = +el.getAttribute('leer');
      else return h.fehler(el, 'm-programm braucht befehle="…", raetsel="…" oder leer="…"');
    } catch (e) { return h.fehler(el, e.message); }

    const L = istLoesung(el);
    let html = '';
    let nr = 0;
    let anzahlBoxen = 0;
    const reihe = [];
    if (teile) {
      teile.forEach((t, i) => {
        if (typeof t === 'string') {
          nr++; anzahlBoxen++;
          let cls = '', zusatz = '';
          if (kobold && L) {
            const rp = kobold.reparatur;
            if (rp.art === 'tauschen' && rp.stelle === i + 1) cls = 'markiert';
            if (rp.art === 'loeschen' && (kobold.gleicheStellen || [rp.stelle]).includes(i + 1)) cls = 'markiert';
          }
          let teilHtml = box(sym(t), mitNr ? nr : false, gr, cls, zusatz);
          if (kobold && L) {
            const rp = kobold.reparatur;
            if (rp.art === 'einfuegen' && rp.stelle === i + 1) teilHtml = einfuegeMarke(rp.befehl) + teilHtml;
          }
          reihe.push(teilHtml);
        } else {
          nr++;
          let innen = '';
          t.befehle.forEach((b) => { anzahlBoxen++; innen += box(sym(b), mitNr ? '' : false, gr); });
          reihe.push('<span class="platz">' + (mitNr ? '<span class="nr">' + nr + '</span>' : '') + '<span class="kasten-z"><span class="mal">' + t.wdh + '-mal</span><span class="innen">' + innen + '</span></span></span>');
        }
      });
      if (kobold && L && kobold.reparatur.art === 'einfuegen' && kobold.reparatur.stelle === teile.length + 1) reihe.push(einfuegeMarke(kobold.reparatur.befehl));
    } else if (form) {
      form.forEach((t) => {
        nr++;
        if (typeof t === 'string') { anzahlBoxen++; reihe.push(box(lsgSym(t), mitNr ? nr : false, gr)); }
        else {
          let innen = '';
          t.befehle.forEach((b) => { anzahlBoxen++; innen += box(lsgSym(b), mitNr ? '' : false, gr); });
          reihe.push('<span class="platz">' + (mitNr ? '<span class="nr">' + nr + '</span>' : '') + '<span class="kasten-z"><span class="mal">' + h.feldHTML(String(t.wdh), 'k') + '-mal</span><span class="innen">' + innen + '</span></span></span>');
        }
      });
    } else {
      for (let i = 0; i < leer; i++) {
        anzahlBoxen++;
        const b = loesung && loesung[i];
        reihe.push(box(b ? lsgSym(b) : '', mitNr ? i + 1 : false, gr));
      }
    }
    if (anzahlBoxen > 12) h.fehler(el, anzahlBoxen + ' Kästchen in einer Programm-Reihe (höchstens 12)');
    // 12 Kästchen à 14 mm sind mit Abständen breiter als ein Blatt: dann automatisch 13 mm
    if (anzahlBoxen > 11 && !el.hasAttribute('gr')) gr = 13;
    html = '<span class="prog" style="--gr:' + gr + 'mm">' + reihe.join('') + '</span>';
    if (kobold && L) {
      const rp = kobold.reparatur;
      const n = { vor: 'vor', links: 'links drehen', rechts: 'rechts drehen' };
      const gleich = (kobold.gleicheStellen || [rp.stelle]);
      const oder = (l) => l.length === 1 ? String(l[0]) : l.slice(0, -1).join(', ') + ' oder ' + l[l.length - 1];
      let t;
      if (rp.art === 'tauschen') t = 'Befehl ' + rp.stelle + ': ' + n[rp.befehl] + ' statt ' + n[teile[rp.stelle - 1]];
      else if (rp.art === 'loeschen') t = 'Befehl ' + oder(gleich) + ' streichen';
      else if (rp.stelle === 1) t = 'am Anfang fehlt ' + n[rp.befehl];
      else if (rp.stelle === teile.length + 1) t = 'am Ende fehlt ' + n[rp.befehl];
      else t = 'zwischen Befehl ' + (rp.stelle - 1) + ' und ' + rp.stelle + ' fehlt ' + n[rp.befehl];
      if (rp.art === 'einfuegen' && gleich.length > 1) t += ' (oder an einer anderen Stelle in derselben Reihe: gleiches Programm)';
      html += '<span class="prog-reparatur">' + h.esc(t) + '</span>';
    }
    el.innerHTML = html;
    el.classList.add('komp');
    if (r) el.classList.add('geprueft');
  };
  function einfuegeMarke(befehl) {
    return '<span class="platz einfuegen-marke" style="width:auto"><span class="nr" style="color:var(--rot)">+</span>' +
      '<span class="box" style="border-color:var(--rot);border-style:dashed">' + S().symbol(befehl) + '</span></span>';
  }

  // ---------------------------------------------------------------------
  // <m-qr paket="e2">  QR-Code zur Web-App (nur für Mama oder Papa), mindestens 2,5 cm
  // ---------------------------------------------------------------------
  B['m-qr'] = function (el) {
    const p = el.getAttribute('paket');
    const q = H().DATEN.qr[p];
    if (!q) return H().fehler(el, 'Kein QR-Code für Paket „' + p + '“ (gibt es raetsel/' + p + '.json mit "web"?)');
    const gr = parseFloat(el.getAttribute('gr') || '32');
    if (gr < 31) return H().fehler(el, 'QR-Code zu klein (mindestens 31 mm inkl. Ruhezone, damit der Code selbst 2,5 cm breit ist)');
    const svg = q.svg.replace(/width="[^"]*"/, 'width="' + gr + 'mm"').replace(/height="[^"]*"/, 'height="' + gr + 'mm"');
    const pak = H().DATEN.pakete[p];
    el.dataset.url = q.url;
    el.innerHTML = '<span class="qr-box"><span class="qr">' + svg + '</span><span class="klein" style="font-size:8.5pt;font-family:var(--text);color:var(--grau)">Bildschirm-Bonus<br>für Mama oder Papa:<br>Paket ' + pak.einheit + '</span></span>';
    el.classList.add('komp');
  };

  // ---------------------------------------------------------------------
  // <m-linksrechts>  In jeder Gitter-Einheit dieselben Hilfen (AUFTRAG.md Abschnitt 4)
  // ---------------------------------------------------------------------
  B['m-linksrechts'] = function (el) {
    const k = H().KIND;
    el.innerHTML = '<div class="kasten tipp"><div class="kasten-titel">' + H().bildSVG('lupe', 6) + '<span>Hilfen für links und rechts (in jeder Gitter-Einheit gleich)</span></div><ul>' +
      '<li><b>Hinter den Roboter stellen:</b> ' + k + ' stellt sich hinter den Roboter (oder hinter den Drachen am Boden) und schaut in dieselbe Richtung. Dann ist sein Links auch ihr Links.</li>' +
      '<li><b>Rechte Hand markieren:</b> ein Gummiringerl oder Sticker auf ' + k + 's rechter Hand. Die Drachen-Figur hat eine orange rechte Pfote, und der Befehl „rechts drehen“ ist auch orange.</li>' +
      '<li><b>Blatt drehen erlaubt:</b> Am Papier darf ' + k + ' das Blatt drehen, bis die Nase des Drachen nach oben zeigt. Oder sie dreht die ausgeschnittene Drachen-Figur bei jedem Drehbefehl mit.</li>' +
      '<li><b>In Stufen:</b> zuerst Drehungen, wenn der Drache nach oben schaut, dann nach links oder rechts. Erst im Schwerer-Teil, wenn er nach unten schaut. Dann ist sein Links von ' + k + ' aus gesehen rechts.</li>' +
      '</ul></div>';
    el.classList.add('komp');
  };
})();
