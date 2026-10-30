/* =====================================================================
   Bausteine für Einheit 5 (Der Wiederhol-Zauber)
     <m-e5-muster art="malen" zeilen="4[rot leer leer]; 4[gruen gruen gruen]">
         Muster-Bild auf echten 1-cm-Kästchen: links die Muster-Programme
         (Zauber-Kasten mit Farbkästchen), rechts die leeren Kästchen.
         Die Lösung (das fertige Bild) rechnet der Baustein selbst aus.
     <m-e5-muster art="finden" programm="3[blau gelb gelb]">
         Fertig gemaltes Muster; darunter ein leerer Zauber-Kasten.
         Lösung: Zahl und Farben im Kasten.
     <m-e5-karten raetsel="e5-k1" teil="lang|kurz">  oder  programm="3[vor] rechts"  oder  muster="4[rot leer]"
         Antwortkästchen mit der Kartenzahl (Zauber-Kasten = 1 Karte + die Befehle darin)
   Muster-Programme: Farben rot, blau, gelb, gruen, leer; "4[rot leer]" = Zauber-Kasten „4-mal“
   (2 bis 5, höchstens 3 Farben im Kasten, nicht verschachtelt). Kein Mal-Punkt.
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const K = () => window.WerkstattKern;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');

  const FARBEN = { rot: '#e0453a', blau: '#3a7be0', gelb: '#f5c518', gruen: '#3aa856', leer: '#ffffff' };
  const TINTE = '#1f2340';

  // "4[rot leer] blau" → [{ wdh: 4, teile: ['rot', 'leer'] }, 'blau']
  function liesMuster(text) {
    const s = String(text || '').trim();
    if (!s) throw new Error('Leeres Muster-Programm');
    const re = /\s*(?:(\d+)\s*\[([^\]\[]*)\]|([a-z]+))\s*/y;
    const aus = [];
    let pos = 0;
    while (pos < s.length) {
      re.lastIndex = pos;
      const m = re.exec(s);
      if (!m) throw new Error('Muster-Programm nicht lesbar ab „' + s.slice(pos) + '“ (verschachtelt geht nicht)');
      if (m[1]) {
        const wdh = parseInt(m[1], 10);
        const teile = m[2].trim().split(/\s+/).filter(Boolean);
        if (wdh < 2 || wdh > 5) throw new Error(wdh + '-mal geht nicht (2 bis 5)');
        if (!teile.length || teile.length > 3) throw new Error('Im Zauber-Kasten 1 bis 3 Farben');
        teile.forEach(pruefeFarbe);
        aus.push({ wdh, teile });
      } else {
        pruefeFarbe(m[3]);
        aus.push(m[3]);
      }
      pos = re.lastIndex;
    }
    return aus;
  }
  function pruefeFarbe(f) {
    if (!FARBEN[f]) throw new Error('Unbekannte Farbe „' + f + '“ (rot, blau, gelb, gruen, leer)');
  }
  function ausrollen(p) {
    const aus = [];
    for (const t of p) {
      if (typeof t === 'string') aus.push(t);
      else for (let i = 0; i < t.wdh; i++) aus.push(...t.teile);
    }
    return aus;
  }
  function kartenMuster(p) { return p.reduce((s, t) => s + (typeof t === 'string' ? 1 : 1 + t.teile.length), 0); }

  // Farbkästchen in der Programm-Reihe (gleiche Klassen wie <m-programm>)
  function farbSVG(f) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="8" fill="' +
      FARBEN[f] + '"' + (f === 'leer' ? '' : ' stroke="' + TINTE + '" stroke-width="3"') + '/></svg>';
  }
  function boxHTML(f, alsLoesung) {
    if (alsLoesung) return '<span class="platz"><span class="box leer lsg-box"><span class="lsg-symbol">' + farbSVG(f) + '</span></span></span>';
    return '<span class="platz"><span class="box' + (f === 'leer' ? ' leer' : '') + '">' + farbSVG(f) + '</span></span>';
  }
  function programmHTML(p, gr, form) {
    const h = H();
    const teile = p.map((t) => {
      if (typeof t === 'string') return boxHTML(t, form);
      const mal = form ? h.feldHTML(String(t.wdh), 'k') + '-mal' : t.wdh + '-mal';
      return '<span class="platz"><span class="kasten-z"><span class="mal">' + mal + '</span><span class="innen">' +
        t.teile.map((f) => boxHTML(f, form)).join('') + '</span></span></span>';
    });
    return '<span class="prog e05-muster-prog" style="--gr:' + gr + 'mm">' + teile.join('') + '</span>';
  }

  // Kästchen-Block: zeilen = [[farbe, …], …]; zeigen: Farben malen (sonst leer). Maße in mm.
  function kaestchenSVG(zeilen, zeigen, nummern) {
    const n = zeilen[0].length, h = zeilen.length;
    const rand = nummern ? 7 : 0.4;
    const w = rand + n * 10 + 0.4, hh = h * 10 + 0.8;
    let s = '';
    zeilen.forEach((z, j) => {
      if (nummern) s += '<text x="' + (rand - 3) + '" y="' + (j * 10 + 5.4) + '" font-size="5.6" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#6b6f86" font-family="Andika, sans-serif">' + (j + 1) + '</text>';
      if (zeigen) z.forEach((f, i) => { if (f !== 'leer') s += '<rect x="' + (rand + i * 10) + '" y="' + (0.4 + j * 10) + '" width="10" height="10" fill="' + FARBEN[f] + '"/>'; });
    });
    for (let i = 0; i <= n; i++) s += '<line x1="' + (rand + i * 10) + '" y1="0.4" x2="' + (rand + i * 10) + '" y2="' + (0.4 + h * 10) + '" stroke="' + TINTE + '" stroke-width="' + (i === 0 || i === n ? 0.5 : 0.25) + '"/>';
    for (let j = 0; j <= h; j++) s += '<line x1="' + rand + '" y1="' + (0.4 + j * 10) + '" x2="' + (rand + n * 10) + '" y2="' + (0.4 + j * 10) + '" stroke="' + TINTE + '" stroke-width="' + (j === 0 || j === h ? 0.5 : 0.25) + '"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + 'mm" height="' + hh + 'mm" viewBox="0 0 ' + w + ' ' + hh + '" role="img" aria-label="Kästchen">' + s + '</svg>';
  }

  B['m-e5-muster'] = function (el) {
    const h = H();
    const art = el.getAttribute('art') || 'malen';
    const gr = parseFloat(el.getAttribute('gr') || '10');
    const L = istLoesung(el);
    try {
      if (art === 'malen') {
        const progs = (el.getAttribute('zeilen') || '').split(';').map((x) => x.trim()).filter(Boolean).map(liesMuster);
        if (!progs.length) return h.fehler(el, 'm-e5-muster braucht zeilen="…; …"');
        const zeilen = progs.map(ausrollen);
        const soll = el.hasAttribute('breite') ? +el.getAttribute('breite') : zeilen[0].length;
        zeilen.forEach((z, i) => { if (z.length !== soll) throw new Error('Zeile ' + (i + 1) + ' malt ' + z.length + ' Kästchen, erwartet ' + soll); });
        if (soll > 16) throw new Error('Höchstens 16 Kästchen in einer Zeile (16 cm)');
        const nr = progs.length > 1;
        const links = progs.map((p, i) => '<div class="e05-mzeile">' + (nr ? '<span class="e05-mnr">' + (i + 1) + '</span>' : '') + programmHTML(p, gr, false) + '</div>').join('');
        el.innerHTML = '<div class="e05-muster"><div class="e05-mprogs">' + links + '</div><div class="e05-mbild">' + kaestchenSVG(zeilen, L, nr) + '</div></div>';
        el.dataset.loesung = zeilen.map((z) => z.join(' ')).join(' | ');
      } else if (art === 'finden') {
        const p = liesMuster(el.getAttribute('programm'));
        if (p.length !== 1 || typeof p[0] === 'string') throw new Error('art="finden": genau ein Zauber-Kasten');
        const reihe = ausrollen(p);
        // Eindeutig? Kein anderer einzelner Zauber-Kasten (2–5-mal, 1–3 Farben) malt dieselbe Reihe
        const andere = [];
        for (let k = 1; k <= 3; k++) for (let w = 2; w <= 5; w++) {
          if (w * k !== reihe.length) continue;
          const block = reihe.slice(0, k);
          const gleich = reihe.every((f, i) => f === block[i % k]);
          if (gleich && !(w === p[0].wdh && k === p[0].teile.length)) andere.push(w + '[' + block.join(' ') + ']');
        }
        if (andere.length) throw new Error('Nicht eindeutig: auch ' + andere.join(', ') + ' malt dieses Muster');
        el.innerHTML = '<div class="e05-finden"><div class="e05-mbild">' + kaestchenSVG([reihe], true, false) + '</div>' + programmHTML(p, gr, true) + '</div>';
        el.dataset.loesung = p[0].wdh + '[' + p[0].teile.join(' ') + ']';
      } else throw new Error('art="malen" oder art="finden"');
    } catch (e) { return h.fehler(el, e.message); }
    el.classList.add('komp', 'geprueft');
  };

  B['m-e5-karten'] = function (el) {
    const h = H();
    let n;
    try {
      if (el.hasAttribute('raetsel')) {
        const r = h.DATEN.raetsel[el.getAttribute('raetsel')];
        if (!r || r.art !== 'kuerzer' || !r.loesung) return h.fehler(el, 'm-e5-karten: raetsel muss ein kuerzer-Rätsel sein');
        const teil = el.getAttribute('teil');
        if (teil === 'lang') n = r.loesung.kartenLang;
        else if (teil === 'kurz') n = r.loesung.kartenKurz;
        else return h.fehler(el, 'teil="lang" oder teil="kurz"');
      } else if (el.hasAttribute('programm')) n = K().karten(el.getAttribute('programm'));
      else if (el.hasAttribute('muster')) n = kartenMuster(liesMuster(el.getAttribute('muster')));
      else return h.fehler(el, 'm-e5-karten braucht raetsel, programm oder muster');
    } catch (e) { return h.fehler(el, e.message); }
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'Kartenzahl ist ' + n + ', nicht ' + el.getAttribute('l'));
    el.innerHTML = h.feldHTML(String(n), n >= 10 ? '' : 'k');
    el.classList.add('komp', 'geprueft');
  };
})();
