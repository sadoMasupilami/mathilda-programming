/* =====================================================================
   Spiel-Plugin „geheim“ (Einheit 7 „Geheimschrift der Feen“)
   Das digitale Geheimschrift-Rad: außen die normalen Buchstaben (Stern beim A),
   innen die Geheim-Buchstaben mit den Zahlen 0 bis 25. Zwei Dreh-Tasten in den
   unteren Ecken drehen die innere Scheibe um einen Platz (kein Ziehen). In der
   Mitte steht groß die Schlüssel-Zahl, die gerade beim Stern steht. Alle
   Buchstaben stehen aufrecht (das Gerät dreht man nicht wie das Papier-Rad).
   Vier Aufgaben, alles nur Antippen:
   - lesen:     Geheimwort mit gegebener Schlüssel-Zahl lesen, passendes Bild antippen.
   - schreiben: ein Wort in Geheimschrift schreiben, mit wenigen Buchstaben-Tasten.
                Der Platz, der dran ist, ist golden; sein Buchstabe ist außen am Rad markiert.
   - knacken:   Schlüssel-Zahl unbekannt. Rad drehen, „Probe“ liest das Geheimwort mit
                dieser Zahl (wie ein Versuch am Papier). Ist es ein echtes Wort, Bild antippen.
                Den Stern gibt es, wenn das Bild stimmt und das Rad auf der Schlüssel-Zahl steht.
   - zeichen:   ein Wort in Feen-Zeichen lesen (Tabelle im Feld), passendes Bild antippen.
   Antippen eines Buchstabens (oder Feen-Zeichens) oben markiert ihn am Rad bzw. die Reihe
   seiner Form in der Tabelle: eine Such-Hilfe, ablesen muss das Kind selbst.
   Bewertet wird nur nach dem Ergebnis, mit web/kern/geheim.js (WerkstattGeheim.bewerte)
   wie im Löser. Die App kennt keine Lösungen; Hinweise rechnet sie aus dem Geheimtext.
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken, nichts geht verloren. Freundliche Hinweise.
   Layout: Rad (bzw. Tabelle) im Feld, Größe nach dem Platz (ResizeObserver);
   Wort und Plätze im Programm-Bereich, Bilder bzw. Buchstaben unten (hoch) / rechts (quer).
   ===================================================================== */
(function () {
  'use strict';
  const G = window.WerkstattGeheim;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  if (!G) return;

  const T = '#1f2340';
  const N = G.N;
  const W = 360 / N;
  const mod = (x) => ((x % N) + N) % N;
  const r2 = (x) => Math.round(x * 100) / 100;
  // Punkt auf dem Rad: Winkel in Grad im Uhrzeigersinn von oben, Mitte 0 0
  function polar(r, grad) {
    const w = grad * Math.PI / 180;
    return [r2(r * Math.sin(w)), r2(-r * Math.cos(w))];
  }
  function sternPfad(cx, cy, ra, ri) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? ri : ra;
      const w = Math.PI / 5 * i - Math.PI / 2;
      d += (i ? 'L' : 'M') + r2(cx + rad * Math.cos(w)) + ' ' + r2(cy + rad * Math.sin(w));
    }
    return d + 'Z';
  }
  // Ringstück zwischen den Radien ri und ra, von Winkel von bis Winkel bis
  function sektor(ri, ra, von, bis) {
    const a1 = polar(ra, von), a2 = polar(ra, bis), b1 = polar(ri, bis), b2 = polar(ri, von);
    return 'M' + a1[0] + ' ' + a1[1] + ' A' + ra + ' ' + ra + ' 0 0 1 ' + a2[0] + ' ' + a2[1] +
      ' L' + b1[0] + ' ' + b1[1] + ' A' + ri + ' ' + ri + ' 0 0 0 ' + b2[0] + ' ' + b2[1] + ' Z';
  }
  function striche(ri, ra, farbe, breite) {
    let p = '';
    for (let i = 0; i < N; i++) {
      const a = polar(ri, (i + 0.5) * W), b = polar(ra, (i + 0.5) * W);
      p += 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1];
    }
    return '<path d="' + p + '" stroke="' + farbe + '" stroke-width="' + breite + '" fill="none"/>';
  }
  const text = (t, gr, farbe) => '<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="' + gr + '" font-weight="700" fill="' + farbe + '">' + t + '</text>';

  // ---------------------------------------------------------------------
  // Bilder: Paket-Bild (kleines Rad), Dreh-Pfeile, Lupe
  // ---------------------------------------------------------------------
  function radIcon(klasse) {
    return '<svg class="' + klasse + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(50 55)">' +
      '<circle r="42" fill="#fff" stroke="' + T + '" stroke-width="4"/>' +
      '<path d="' + sektor(26, 42, -W / 2 - 3, W / 2 + 3) + '" fill="#fff4cc"/>' +
      striche(27, 42, '#c9ccd9', 1.3) +
      '<circle r="26" fill="#e3f6f4" stroke="' + T + '" stroke-width="3.5"/>' +
      striche(12, 26, '#9fd8cd', 1.2) +
      '<g transform="translate(0 -33.5)">' + text('A', 13, T) + '</g>' +
      '<g transform="translate(0 -18.5)">' + text('D', 11, '#0b6b65') + '</g>' +
      '<path d="' + sternPfad(0, 2, 11, 5.5) + '" fill="#ffd23f" stroke="#c79500" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="' + sternPfad(0, -46.5, 7.5, 3.4) + '" fill="#f2b705" stroke="' + T + '" stroke-width="2" stroke-linejoin="round"/>' +
      '</g></svg>';
  }
  // Pfeil gegen den Uhrzeiger (spiegel: im Uhrzeigersinn)
  function pfeil(spiegel) {
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><g' + (spiegel ? ' transform="translate(48 0) scale(-1 1)"' : '') + '>' +
      '<path d="M37 25 A13 13 0 1 0 24 38" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M32.5 38 L22.5 31.5 L22.5 44.5 Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></g></svg>';
  }
  const LUPE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M29.5 29.5 L41 41" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/>' +
    '<circle cx="20" cy="20" r="12.5" fill="#e9f4ff" stroke="currentColor" stroke-width="4.5"/></svg>';
  const FEE_ICON = () => G.feenZeichen('Q');
  const RAD_ICON = () => radIcon('geheim-mini');

  // ---------------------------------------------------------------------
  // Das Rad (viewBox -108 … 108, Mitte 0 0). Größere Buchstaben als am Papier.
  // ---------------------------------------------------------------------
  const R = { rand: 99, aussen: 84.5, aussenGr: 17, innenRand: 70, innen: 58, innenGr: 15, zahl: 44, zahlGr: 7.6, mitte: 33.5 };
  function radSVG() {
    let s = '<svg class="geheim-rad-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-108 -108 216 216" role="img" aria-label="Geheimschrift-Rad, Schlüssel-Zahl 0">';
    // Außen: normale Buchstaben, A-Feld golden, Stern beim A
    s += '<circle r="' + R.rand + '" fill="#fff" stroke="' + T + '" stroke-width="2.5"/>';
    s += '<path d="' + sektor(R.innenRand, R.rand, -W / 2, W / 2) + '" fill="#fff4cc"/>';
    s += striche(R.innenRand, R.rand, '#c9ccd9', 1);
    for (let i = 0; i < N; i++) {
      const [x, y] = polar(R.aussen, i * W);
      s += '<g class="geheim-a" data-b="' + G.ABC[i] + '" transform="translate(' + x + ' ' + y + ')"><circle class="geheim-lupe" r="11.5"/>' + text(G.ABC[i], R.aussenGr, T) + '</g>';
    }
    s += '<path d="' + sternPfad(0, -100, 8.6, 3.8) + '" fill="#f2b705" stroke="' + T + '" stroke-width="1.6" stroke-linejoin="round"/>';
    // Innen: Scheibe, darüber ein festes goldenes Fenster unter dem Stern, darüber die drehbaren Buchstaben und Zahlen
    s += '<circle r="' + R.innenRand + '" fill="#e3f6f4" stroke="' + T + '" stroke-width="2"/>';
    s += '<path d="' + sektor(R.mitte, R.innenRand, -W / 2, W / 2) + '" fill="#fff4cc" stroke="#e8c45a" stroke-width="0.8"/>';
    s += '<g class="geheim-dreh">' + striche(R.mitte, R.innenRand, '#9fd8cd', 1) +
      '<circle r="' + R.mitte + '" fill="none" stroke="#9fd8cd" stroke-width="1"/>';
    for (let i = 0; i < N; i++) {
      const [x, y] = polar(R.innen, i * W);
      s += '<g class="geheim-i" data-b="' + G.ABC[i] + '" transform="translate(' + x + ' ' + y + ')"><g class="geheim-auf"><circle class="geheim-lupe" r="9.5"/>' + text(G.ABC[i], R.innenGr, '#0b6b65') + '</g></g>';
    }
    for (let i = 0; i < N; i++) {
      const [x, y] = polar(R.zahl, i * W);
      s += '<g class="geheim-n" data-i="' + i + '" transform="translate(' + x + ' ' + y + ')"><g class="geheim-auf"><circle class="geheim-n-hg" r="6.8"/>' + text(String(i), R.zahlGr, '#5d6280') + '</g></g>';
    }
    s += '</g>';
    // Mitte: die Schlüssel-Zahl groß in einem Stern
    s += '<path d="' + sternPfad(0, 2, 31, 17.5) + '" fill="#ffe27a" stroke="#c79500" stroke-width="2" stroke-linejoin="round"/>';
    s += '<g class="geheim-mitte" transform="translate(0 4)">' + text('0', 21, T) + '</g>';
    s += '</svg>';
    return s;
  }

  // Feen-Zeichen-Tabelle wie am Blatt: A bis Y in Reihen zu 5 (eine Reihe pro Form), dann das Z (Stern)
  function tabelleSVG() {
    let s = '<svg class="geheim-tabelle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="Feen-Zeichen-Tabelle">';
    for (let r = 0; r < 5; r++) s += '<rect class="geheim-zeile" data-r="' + r + '" x="3" y="' + (r * 120 + 3) + '" width="494" height="114" rx="14"/>';
    s += '<rect class="geheim-zeile" data-r="5" x="503" y="483" width="94" height="114" rx="14"/>';
    for (let i = 0; i < N; i++) {
      const r = i === 25 ? 4 : Math.floor(i / 5), c = i === 25 ? 5 : i % 5;
      const x = c * 100, y = r * 120;
      s += '<svg x="' + (x + 15) + '" y="' + (y + 6) + '" width="70" height="70" viewBox="0 0 100 100">' + G.feenInhalt(G.ABC[i]) + '</svg>';
      s += '<g transform="translate(' + (x + 50) + ' ' + (y + 97) + ')">' + text(G.ABC[i], 36, T) + '</g>';
    }
    return s + '</svg>';
  }
  // Reihe der Tabelle für ein Feen-Zeichen (Z: eigenes Feld)
  const reiheVon = (b) => (b === 'Z' ? 5 : Math.floor(G.nr(b) / 5));
  const FORM_VIELE = { kreis: 'Kreise', dreieck: 'Dreiecke', quadrat: 'Quadrate', herz: 'Herzen', tropfen: 'Tropfen' };

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  const schluessel = (api) => api.lv.schluessel;
  const k = (z) => mod(z.dreh);
  function neu(api) {
    const lv = api.lv;
    const z = api.zustand;
    for (const x of Object.keys(z)) if (x !== 'beob' && x !== 'masse') delete z[x];
    z.aufgabe = lv.aufgabe;
    z.dreh = 0;           // Schritte der inneren Scheibe (ohne Grenze, so dreht sie nie den langen Weg zurück)
    z.mark = null;        // markierter Buchstabe am Rad: { ring: 'innen' | 'aussen', b }
    z.karte = null;       // angetippte Karte oben (Index)
    z.weg = [];           // Bilder, die nicht passen (grau)
    z.gewaehlt = null;    // Bild, das passt
    z.fertig = false;
    if (z.aufgabe === 'schreiben') {
      z.wort = lv.klartext;
      z.platz = Array.from(z.wort).map((b) => (b === ' ' ? ' ' : null));
      z.falsch = null;
      setzeDran(z, naechsterLeerer(z, -1));
    } else if (z.aufgabe === 'zeichen') {
      z.wort = lv.feen;
    } else {
      z.wort = lv.geheimtext;
      if (z.aufgabe === 'knacken') { z.probe = null; z.probiert = []; }
    }
  }
  function naechsterLeerer(z, ab) {
    const n = z.platz.length;
    for (let j = 1; j <= n; j++) {
      const i = (ab + j + n) % n;
      if (z.platz[i] === null) return i;
    }
    return null;
  }
  function setzeDran(z, i) {
    z.dran = i;
    z.karte = i;
    z.mark = i === null ? null : { ring: 'aussen', b: z.wort[i] };
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Feld (Rad oder Tabelle) nur einmal bauen, danach nur ändern (sonst dreht nichts sanft)
  // ---------------------------------------------------------------------
  function baueFeld(api) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld) return;
    if (z.aufgabe === 'zeichen') {
      feld.innerHTML = '<div class="geheim-feld geheim-feld-tabelle">' + tabelleSVG() + '</div>';
    } else {
      feld.innerHTML = '<div class="geheim-feld">' +
        '<div class="geheim-rad">' + radSVG() + '</div>' +
        api.taste('geheim-drehen', pfeil(false), { cls: 'befehl geheim-drehen geheim-links', daten: 'data-d="1"', label: 'Rad drehen: Zahl beim Stern eins größer' }) +
        api.taste('geheim-drehen', pfeil(true), { cls: 'befehl geheim-drehen geheim-rechts', daten: 'data-d="-1"', label: 'Rad zurück drehen: Zahl beim Stern eins kleiner' }) +
        '</div>';
    }
    z.masse = null;
    passeAn(api);
    aktualisiereFeld(api, true);
  }

  // Größe des Rads: so groß wie möglich, ohne dass die Dreh-Tasten in den unteren Ecken die Scheibe verdecken
  function passeAn(api) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld || !feld.isConnected) return;
    const box = feld.querySelector('.geheim-rad');
    const wb = feld.clientWidth, hb = feld.clientHeight;
    z.masse = { wb, hb };
    if (!box || wb < 10 || hb < 10) return;
    const t = feld.querySelector('.geheim-drehen');
    const b = t ? t.offsetWidth : 54;
    const scheibe = 99 / 108;   // Anteil der Scheibe am Bild (oben ragt der Stern hinaus)
    let wahl = null;
    for (let d = Math.floor(Math.min(wb, hb, 640)); d >= 40 && !wahl; d--) {
      for (const cy of [hb / 2, d / 2]) {
        const dx = wb / 2 - b, dy = Math.max(0, hb - b - cy);
        if (dx > 0 && Math.hypot(dx, dy) >= (d / 2) * scheibe + 4) { wahl = { d, cy }; break; }
      }
    }
    if (!wahl) wahl = { d: Math.max(40, Math.min(wb, hb) - b), cy: hb / 2 };
    box.style.width = box.style.height = wahl.d + 'px';
    box.style.left = Math.round((wb - wahl.d) / 2) + 'px';
    box.style.top = Math.round(wahl.cy - wahl.d / 2) + 'px';
  }

  // Drehung, Zahl in der Mitte, Zahl beim Stern, markierter Buchstabe, markierte Reihe
  function aktualisiereFeld(api, sofort) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld) return;
    const tab = feld.querySelector('.geheim-tabelle');
    if (tab) {
      const r = z.karte !== null ? reiheVon(z.wort[z.karte]) : null;
      tab.querySelectorAll('.geheim-zeile').forEach((e) => e.classList.toggle('geheim-an', Number(e.dataset.r) === r));
      return;
    }
    const svg = feld.querySelector('.geheim-rad-svg');
    if (!svg) return;
    const w = r2(z.dreh * W);
    const dreh = svg.querySelector('.geheim-dreh');
    if (sofort) svg.classList.add('geheim-sofort');
    dreh.style.transform = 'rotate(' + (-w) + 'deg)';
    dreh.querySelectorAll('.geheim-auf').forEach((e) => { e.style.transform = 'rotate(' + w + 'deg)'; });
    if (sofort) { void svg.getBoundingClientRect(); svg.classList.remove('geheim-sofort'); }
    const kk = k(z);
    svg.querySelector('.geheim-mitte text').textContent = String(kk);
    svg.setAttribute('aria-label', 'Geheimschrift-Rad, Schlüssel-Zahl ' + kk);
    dreh.querySelectorAll('.geheim-n').forEach((e) => e.classList.toggle('geheim-oben', Number(e.dataset.i) === kk));
    svg.querySelectorAll('.geheim-mark').forEach((e) => e.classList.remove('geheim-mark'));
    if (z.mark) {
      const e = svg.querySelector((z.mark.ring === 'innen' ? '.geheim-i' : '.geheim-a') + '[data-b="' + z.mark.b + '"]');
      if (e) e.classList.add('geheim-mark');
    }
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Wort (Programm-Bereich) und Tasten
  // ---------------------------------------------------------------------
  function karte(z, i, inhalt, cls, label) {
    return '<button class="geheim-karte ' + cls + (z.karte === i ? ' geheim-an' : '') + '" data-aktion="geheim-karte" data-i="' + i + '" data-umschalter aria-label="' + label + '">' + inhalt + '</button>';
  }
  const luecke = '<span class="geheim-luecke" aria-hidden="true"></span>';
  function zeichneWort(api) {
    const z = api.zustand;
    const box = api.programm;
    if (!box) return;
    const zeichen = Array.from(z.wort);
    let html = '';
    if (z.aufgabe === 'zeichen') {
      html = '<div class="geheim-reihe">' + zeichen.map((b, i) => (b === ' ' ? luecke
        : karte(z, i, G.feenZeichen(b), 'geheim-feen', 'Feen-Zeichen ' + (i + 1)))).join('') + '</div>';
    } else if (z.aufgabe === 'lesen') {
      html = '<div class="geheim-reihe">' + zeichen.map((b, i) => (b === ' ' ? luecke
        : karte(z, i, '<span>' + b + '</span>', 'geheim-gk', 'Geheim-Buchstabe ' + b))).join('') + '</div>';
    } else if (z.aufgabe === 'schreiben') {
      const spalten = zeichen.map((b, i) => {
        if (b === ' ') return luecke;
        const x = z.platz[i];
        const cls = (x ? ' geheim-voll' : ' geheim-leer') + (z.dran === i && !z.fertig ? ' geheim-dran' : '') + (z.falsch === i ? ' geheim-falsch' : '');
        return '<div class="geheim-spalte">' + karte(z, i, '<span>' + b + '</span>', 'geheim-kk', 'Buchstabe ' + b) +
          '<button class="geheim-platz' + cls + '" data-aktion="geheim-platz" data-i="' + i + '" data-umschalter aria-label="Platz ' + (i + 1) + (x ? ': ' + x : ', leer') + '"' + (z.fertig ? ' disabled' : '') + '>' +
          '<span>' + (x || '') + '</span></button></div>';
      }).join('');
      html = '<div class="geheim-reihe">' + (api.lv.bild ? '<span class="geheim-wortbild">' + G.bild(api.lv.bild) + '</span>' : '') + spalten + '</div>';
    } else {
      // knacken: Geheimwort, darunter die Probe mit der Zahl beim Stern
      const p = z.probe;
      const spalten = zeichen.map((b, i) => (b === ' ' ? luecke
        : '<div class="geheim-spalte">' + karte(z, i, '<span>' + b + '</span>', 'geheim-gk', 'Geheim-Buchstabe ' + b) +
          '<span class="geheim-probe-feld' + (p ? ' geheim-voll' : '') + '">' + (p ? p.text[i] : '') + '</span></div>')).join('');
      const probiert = z.probiert.length ? 'Probiert: ' + z.probiert.slice().sort((a, b) => a - b).join(', ') : 'Probiert: noch nichts';
      html = '<div class="geheim-reihe">' + spalten + '</div><p class="geheim-probiert">' + probiert + '</p>';
    }
    box.innerHTML = '<div class="geheim-wort geheim-wort-' + z.aufgabe + '">' + html + '</div>';
  }

  const wortKlein = (name) => { const w = G.wortVonBild(name) || name; return w[0] + w.slice(1).toLowerCase(); };
  function zeichneTasten(api) {
    const z = api.zustand;
    const lv = api.lv;
    const box = api.tasten;
    if (!box) return;
    if (z.aufgabe === 'schreiben') {
      const gefuellt = z.platz.some((x, i) => x !== null && z.wort[i] !== ' ');
      box.innerHTML = '<div class="geheim-abc" data-n="' + (lv.tasten.length + 1) + '">' +
        lv.tasten.map((b) => api.taste('geheim-abc', '<span>' + b + '</span>', { cls: 'befehl geheim-buchstabe', daten: 'data-b="' + b + '"', label: 'Geheim-Buchstabe ' + b, aus: z.fertig })).join('') +
        api.taste('geheim-weg', api.ICON.weg, { cls: 'befehl', label: 'Letzten Buchstaben löschen', aus: z.fertig || !gefuellt }) +
        '</div>';
      return;
    }
    const bilder = (lv.bilder || []).map((name) => api.taste('geheim-bild', G.bild(name), {
      cls: 'geheim-bildtaste' + (z.weg.includes(name) ? ' geheim-passt-nicht' : '') + (z.gewaehlt === name ? ' geheim-gewaehlt' : ''),
      daten: 'data-bild="' + name + '"', label: 'Bild: ' + wortKlein(name),
    })).join('');
    box.innerHTML = '<div class="geheim-bilder' + (z.aufgabe === 'knacken' ? ' geheim-mit-probe' : '') + '">' +
      (z.aufgabe === 'knacken' ? api.taste('geheim-probe', LUPE + '<span>Probe</span>', { cls: 'geheim-probe', label: 'Probe: mit der Zahl beim Stern lesen' }) : '') +
      bilder + '</div>';
  }

  function zeichne(api) {
    zeichneWort(api);
    zeichneTasten(api);
    aktualisiereFeld(api, false);
  }

  // ---------------------------------------------------------------------
  // Meldungen (kurz: am kleinen Handy quer passen etwa drei Zeilen)
  // ---------------------------------------------------------------------
  const icon = (z) => (z.aufgabe === 'zeichen' ? FEE_ICON() : RAD_ICON());
  function sag(api, t, art) { api.meldung(t, art || '', icon(api.zustand)); }
  function grundMeldung(api) {
    const z = api.zustand;
    const lv = api.lv;
    const ks = mod(schluessel(api));
    if (z.aufgabe === 'lesen') return sag(api, 'Stell das Rad auf ' + ks + '. Lies das Geheimwort und tippe das Bild an!');
    if (z.aufgabe === 'schreiben') return sag(api, 'Schreib ' + lv.klartext + ' in Geheimschrift. Stell das Rad auf ' + ks + '!');
    if (z.aufgabe === 'knacken') {
      if (lv.bereich) return sag(api, 'Die Schlüssel-Zahl ist ' + lv.bereich[0] + ' bis ' + lv.bereich[1] + '. Dreh das Rad und tippe auf „Probe“!');
      return sag(api, 'Knack das Geheimwort! Dreh das Rad und tippe auf „Probe“.');
    }
    return sag(api, 'Lies das Feen-Wort mit der Tabelle. Tippe dann das Bild an!');
  }
  function sternMeldung(api) {
    const z = api.zustand;
    const ks = mod(schluessel(api));
    if (k(z) !== ks) return sag(api, 'Dreh das Rad, bis die ' + ks + ' beim Stern steht.');
    if (z.aufgabe === 'lesen') return sag(api, 'Die ' + ks + ' steht beim Stern. Lesen: innen suchen, außen ablesen.', 'hinweis');
    return sag(api, 'Die ' + ks + ' steht beim Stern. Schreiben: außen suchen, innen ablesen.', 'hinweis');
  }

  // ---------------------------------------------------------------------
  // Aktionen
  // ---------------------------------------------------------------------
  function drehen(api, d) {
    const z = api.zustand;
    if (z.fertig) return;
    z.dreh += d;
    if (z.aufgabe === 'knacken') {
      z.probe = null;
      zeichneWort(api);
      aktualisiereFeld(api, false);
      return k(z) === 0 ? sag(api, 'Bei 0 bleibt alles, wie es ist. Dreh weiter!') : sag(api, 'Jetzt steht die ' + k(z) + ' beim Stern. Tippe auf „Probe“!');
    }
    aktualisiereFeld(api, false);
    sternMeldung(api);
  }

  function karteTippen(api, i) {
    const z = api.zustand;
    if (z.fertig || i < 0 || i >= z.wort.length || z.wort[i] === ' ') return;
    const b = z.wort[i];
    if (z.aufgabe === 'schreiben') {
      setzeDran(z, i);
      zeichne(api);
      return sag(api, 'Such das ' + b + ' außen. Welcher Buchstabe steht innen daneben?', 'hinweis');
    }
    const an = z.karte !== i;
    z.karte = an ? i : null;
    if (z.aufgabe === 'zeichen') {
      zeichne(api);
      if (!an) return grundMeldung(api);
      const f = G.feenTeile(b);
      if (f.form === 'stern') return sag(api, 'Der Stern ist das Z, der letzte Buchstabe.', 'hinweis');
      return sag(api, 'Hier sind alle ' + FORM_VIELE[f.form] + '. Zähl die Punkte!', 'hinweis');
    }
    z.mark = an ? { ring: 'innen', b } : null;
    zeichne(api);
    if (!an) return;
    sag(api, 'Das ' + b + ' ist innen markiert. Was steht außen daneben?', 'hinweis');
  }

  // Schreiben: Buchstabe in den Platz, der dran ist
  function buchstabe(api, b) {
    const z = api.zustand;
    if (z.fertig || z.dran === null) return;
    const i = z.dran;
    z.platz[i] = b;
    if (z.falsch === i) z.falsch = null;
    const n = naechsterLeerer(z, i);
    if (n === null) return pruefeSchreiben(api);
    setzeDran(z, n);
    zeichne(api);
    if (k(z) !== mod(schluessel(api))) return sag(api, 'Steht die ' + mod(schluessel(api)) + ' beim Stern? Dreh zuerst das Rad!', 'hinweis');
    sag(api, 'Weiter mit dem ' + z.wort[n] + ': außen suchen, innen ablesen.');
  }
  function loeschen(api) {
    const z = api.zustand;
    if (z.fertig) return;
    let i = -1;
    z.platz.forEach((x, j) => { if (x !== null && z.wort[j] !== ' ') i = j; });
    if (i < 0) return;
    z.platz[i] = null;
    if (z.falsch === i) z.falsch = null;
    setzeDran(z, i);
    zeichne(api);
    sag(api, 'Weiter mit dem ' + z.wort[i] + ': außen suchen, innen ablesen.');
  }
  function pruefeSchreiben(api) {
    const z = api.zustand;
    const lv = api.lv;
    const antwort = z.platz.join('');
    if (G.bewerte(lv, antwort).ok) return erfolg(api, lv.klartext + ' heißt in Geheimschrift ' + antwort + '.');
    // Hinweis: der erste Platz, der nicht passt (aus Klartext und Schlüssel-Zahl gerechnet, nicht gespeichert)
    const soll = G.schreiben(lv.klartext, lv.schluessel);
    let i = 0;
    while (i < soll.length && z.platz[i] === soll[i]) i++;
    z.falsch = i;
    setzeDran(z, i);
    zeichne(api);
    api.sperren();   // ein Doppeltipp auf den letzten Buchstaben füllt nicht gleich den markierten Platz
    const ks = mod(schluessel(api));
    if (k(z) !== ks) return sag(api, 'Fast! Steht die ' + ks + ' beim Stern? Dreh das Rad, dann schau beim roten Platz.', 'hinweis');
    sag(api, 'Fast! Schau beim roten Platz: Such das ' + z.wort[i] + ' außen. Was steht innen?', 'hinweis');
  }

  // Knacken: mit der Zahl beim Stern lesen
  function probe(api) {
    const z = api.zustand;
    if (z.fertig) return;
    const kk = k(z);
    if (kk === 0) {
      z.probe = null;
      zeichneWort(api);
      return sag(api, 'Bei 0 bleibt alles, wie es ist. Dreh zuerst das Rad!', 'hinweis');
    }
    z.probe = { k: kk, text: G.lesen(api.lv.geheimtext, kk) };
    if (!z.probiert.includes(kk)) z.probiert.push(kk);
    zeichneWort(api);
    sag(api, 'So heißt es mit ' + kk + '. Ein echtes Wort? Dann tippe das Bild an!');
  }

  // Bild antippen (lesen, knacken, zeichen)
  function bildTippen(api, name) {
    const z = api.zustand;
    const lv = api.lv;
    if (z.fertig || !G.hatBild(name)) return;
    const wort = G.wortVonBild(name);
    const r = G.bewerte(lv, name);
    if (r.ok) {
      if (z.aufgabe === 'lesen') return erfolg(api, lv.geheimtext + ' heißt ' + wort + '.', name);
      if (z.aufgabe === 'zeichen') return erfolg(api, 'Das Feen-Wort heißt ' + wort + '.', name);
      if (r.schluessel === k(z)) return erfolg(api, 'Geknackt! Mit der Schlüssel-Zahl ' + r.schluessel + ' heißt ' + lv.geheimtext + ' ' + wort + '.', name);
      z.gewaehlt = name;
      zeichneTasten(api);
      return sag(api, 'Das Bild passt! Stell noch die Schlüssel-Zahl ein, dann tippe es nochmal an.', 'hinweis');
    }
    if (!z.weg.includes(name)) z.weg.push(name);
    if (z.gewaehlt === name) z.gewaehlt = null;
    const lang = Array.from(z.wort).length;
    if (wort.length !== lang) {
      zeichneTasten(api);
      return sag(api, wort + ' hat ' + wort.length + ' Buchstaben, das ' + (z.aufgabe === 'zeichen' ? 'Feen-Wort' : 'Geheimwort') + ' hat ' + lang + '.', 'hinweis');
    }
    if (z.aufgabe === 'knacken') {
      zeichneTasten(api);
      return sag(api, 'Das passt nicht. Dreh weiter und tippe auf „Probe“!', 'hinweis');
    }
    if (z.aufgabe === 'zeichen') {
      let i = 0;
      while (i < lang && wort[i] === z.wort[i]) i++;
      z.karte = i;
      zeichne(api);
      return sag(api, 'Fast! Schau das goldene Zeichen nochmal an: Form und Punkte?', 'hinweis');
    }
    // lesen: zuerst das Rad, dann der erste Buchstabe, der nicht passt (Geheimtext und Bild-Wort mit derselben Zahl)
    const ks = mod(schluessel(api));
    if (k(z) !== ks) {
      zeichneTasten(api);
      return sag(api, 'Stell zuerst das Rad auf ' + ks + '. Dann lies Buchstabe für Buchstabe.', 'hinweis');
    }
    const als = G.schreiben(wort, lv.schluessel);
    let i = 0;
    while (i < lang && als[i] === z.wort[i]) i++;
    z.karte = i;
    z.mark = { ring: 'innen', b: z.wort[i] };
    zeichne(api);
    sag(api, 'Fast! Lies das markierte ' + z.wort[i] + ' nochmal: innen suchen, außen ablesen.', 'hinweis');
  }

  // Geschafft: kurz das Ergebnis zeigen, dann das Fenster (ein Doppeltipp trifft so nicht „Weiter“)
  function erfolg(api, zusatz, bild) {
    const z = api.zustand;
    z.fertig = true;
    z.gewaehlt = bild || null;
    if (z.aufgabe === 'schreiben') { z.dran = null; z.falsch = null; }
    zeichne(api);
    api.meldung('Richtig!', 'gut', api.sym('stern'));
    api.spaeter(() => api.geschafft({ zusatz }), 500);
  }

  // ---------------------------------------------------------------------
  // Plugin
  // ---------------------------------------------------------------------
  function start(api) {
    neu(api);
    const sp = api.feld && api.feld.closest('.spiel');
    if (sp) sp.classList.add('geheim-' + api.lv.aufgabe);
    zeichneWort(api);
    zeichneTasten(api);
    baueFeld(api);
    // Neu einpassen, wenn sich der Platz ändert (Drehen des Geräts, längere Meldung)
    const z = api.zustand;
    if (window.ResizeObserver && api.feld && !z.beob) {
      let geplant = false;
      z.beob = new ResizeObserver(() => {
        if (geplant) return;
        geplant = true;
        requestAnimationFrame(() => {
          geplant = false;
          const m = z.masse;
          if (!api.feld.isConnected) return;
          if (!m || Math.abs(api.feld.clientWidth - m.wb) > 1 || Math.abs(api.feld.clientHeight - m.hb) > 1) passeAn(api);
        });
      });
      z.beob.observe(api.feld);
    }
  }
  function stopp(api) {
    const z = api.zustand;
    if (z && z.beob) { z.beob.disconnect(); z.beob = null; }
  }

  SPIELE.geheim = {
    icon: () => radIcon('geheim-icon'),
    start,
    grundMeldung,
    klick(aktion, el, api) {
      const i = parseInt(el.dataset.i, 10);
      if (aktion === 'geheim-drehen') return drehen(api, parseInt(el.dataset.d, 10) || 0);
      if (aktion === 'geheim-karte' || aktion === 'geheim-platz') return karteTippen(api, i);
      if (aktion === 'geheim-abc') return buchstabe(api, el.dataset.b);
      if (aktion === 'geheim-weg') return loeschen(api);
      if (aktion === 'geheim-probe') return probe(api);
      if (aktion === 'geheim-bild') return bildTippen(api, el.dataset.bild);
    },
    nochmal(api) {
      neu(api);
      api.laeuft(false);
      zeichneWort(api);
      zeichneTasten(api);
      baueFeld(api);
      grundMeldung(api);
    },
    stopp,
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man das Paket direkt (QR-Code am Blatt) oder lädt neu, fehlte sonst das
  // Paket-Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const DATEN = window.WERKSTATT_DATEN;
    if (!app || !ans || !DATEN || !['start', 'block', 'paket', 'level'].includes(ans)) return;
    if (!DATEN.pakete.some((p) => p.art === 'geheim' || p.levels.some((l) => l.art === 'geheim'))) return;
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
