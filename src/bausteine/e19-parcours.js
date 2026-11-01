/* =====================================================================
   Bausteine für Einheit 19 (Großer Roboter-Parcours)
     <m-e19-zwei raetsel="e19-z1" feld="20" [weg="e19-z2"] [loesung="stoss|keine"]>
         Zwei Drachen im selben Gitter (Rätselart „zweidrachen“, werkzeuge/arten/zweidrachen.mjs):
         grüner Drache mit Schatz, blauer Drache mit Stern, beide Startfelder hinterlegt.
         Lösung: rotes Kreuz im Feld des ersten Zusammenstoßs; mit weg="…" (Aufgabe „planen“)
         dazu der Weg des blauen Drachen mit seinem kürzesten Programm (rot gestrichelt).
     <m-e19-prog raetsel="e19-z1" drache="1|2|beide" [gr="12"] [bild="8"] [ohne-bild]>
         Programm-Reihe eines Drachen mit dem Drachen-Bild davor (das Programm zeichnet <m-programm>).
     <m-e19-prog raetsel="e19-z2" drache="2" leer [plaetze="8"]>
         Leere Kästchen für das Programm des blauen Drachen, Lösung (das kürzeste) rot.
     <m-e19-zahl raetsel="…" was="takt|befehle|karten|kartenmitspruch|min|laenge|ohne|stoss|feld" [text] [l="…"]>
         Eine Zahl aus der Lösung: als Antwortfeld (Blatt) oder mit text als Zahl im Fließtext.
         l="…" prüft die Zahl (der Text in der Anleitung kann so nicht unbemerkt falsch werden).
         was="feld": das Feld des Zusammenstoßes in Worten („in der obersten Reihe, 3. Feld von links“).
     <m-e19-janein raetsel="e19-z3">   „ja / nein“: Stoßen die Drachen zusammen? Lösung rot eingekreist.
     <m-e19-takte raetsel="e19-z1">    Tabelle Takt für Takt: was jeder Drache macht, Zusammenstoß rot.
     <m-e19-rekord karten="6" spruch="ja|nein" [l="50"]>
         Das längste Programm mit so vielen Karten (Befehle zählen wie Bewegungen beim Tanz):
         alle Programme durchprobiert (Zauber-Kasten 2- bis 5-mal mit 1 bis 3 Teilen, kein Kasten im
         Kasten, ein selbst geschriebener Zauberspruch mit 1 bis 4 Teilen zählt 1 Karte plus Inhalt).
         Das Beispiel wird mit dem Ausführer nachgezählt (web/kern/ausfuehrer.js).
     <m-e19-alle raetsel="e19-p3" [anzahl="5"]>   alle Programme mit der kleinsten Kartenzahl (Lösungen)
     <m-e19-drache farbe="gruen|blau" gr="6">   kleines Drachen-Bild für den Text
   Regeln für zwei Drachen: Kopf von werkzeuge/arten/zweidrachen.mjs (Takt für Takt, nach dem Programm
   bleibt ein Drache stehen, Zusammenstoß = selbes Feld oder Felder tauschen).
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const K = () => window.WerkstattKern;
  const S = () => window.WerkstattSymbole;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');
  const ROT = '#d1335b';
  const BLAU = { koerper: '#86b4f0', fluegel: '#2f62b8', bauch: '#e4eefc', feld: '#e3edfb' };
  const GRUEN_FELD = '#eaf6e6';
  const WORT = { vor: 'vor', links: 'links drehen', rechts: 'rechts drehen' };

  function raetsel(el, arten) {
    const id = el.getAttribute('raetsel');
    const r = id && H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht'); return null; }
    if (arten && !arten.includes(r.art)) { H().fehler(el, 'Rätsel „' + id + '“ hat die Art ' + r.art + ' (erwartet: ' + arten.join(', ') + ')'); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Fehler im Löser?)'); return null; }
    return r;
  }

  // Drachen-Bild: grün wie überall, blau umgefärbt (rechte Pfote bleibt orange)
  function dracheInhalt(farbe) {
    const F = S().FARBE;
    let s = S().inhalt('drache');
    if (farbe === 'blau') s = s.split(F.drache).join(BLAU.koerper).split(F.dracheDunkel).join(BLAU.fluegel).split(F.bauch).join(BLAU.bauch);
    return s;
  }
  function dracheSVG(farbe, gr, blick) {
    const dreh = { oben: 0, rechts: 90, unten: 180, links: 270 }[blick || 'oben'] || 0;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + gr + '" height="' + gr + '" aria-hidden="true"><g transform="rotate(' + dreh + ' 50 50)">' + dracheInhalt(farbe) + '</g></svg>';
  }
  const DREH = { oben: 0, rechts: 90, unten: 180, links: 270 };
  function figur(farbe, x, y, blick, extra) {
    return '<g transform="translate(' + (x * 100 + 8) + ' ' + (y * 100 + 8) + ') rotate(' + (DREH[blick || 'oben'] || 0) + ' 42 42) scale(0.84)"' + (extra || '') + '>' + dracheInhalt(farbe) + '</g>';
  }
  function gegenstand(name, x, y, gr) {
    const s = gr || 0.72, o = (1 - s) * 50;
    return '<g transform="translate(' + (x * 100 + o) + ' ' + (y * 100 + o) + ') scale(' + s + ')">' + S().inhalt(name) + '</g>';
  }

  // Das Gitter mit beiden Drachen. opt: breite, hoehe, kreuz {x, y}, weg [{x, y}] ab start2
  function zweiGitter(r, opt) {
    const F = S().FARBE;
    const Bb = r.b * 100, Hh = r.h * 100, rand = 6;
    const [d1, d2] = r.drachen;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-rand) + ' ' + (-rand) + ' ' + (Bb + 2 * rand) + ' ' + (Hh + 2 * rand) + '" width="' + opt.breite + '" height="' + opt.hoehe + '" role="img" aria-label="Zwei Drachen im Gitter ' + r.id + '">';
    s += '<rect x="0" y="0" width="' + Bb + '" height="' + Hh + '" fill="' + F.feld + '"/>';
    s += '<rect x="' + (d1.start.x * 100 + 4) + '" y="' + (d1.start.y * 100 + 4) + '" width="92" height="92" rx="10" fill="' + GRUEN_FELD + '"/>';
    s += '<rect x="' + (d2.start.x * 100 + 4) + '" y="' + (d2.start.y * 100 + 4) + '" width="92" height="92" rx="10" fill="' + BLAU.feld + '"/>';
    for (let i = 1; i < r.b; i++) s += '<line x1="' + i * 100 + '" y1="0" x2="' + i * 100 + '" y2="' + Hh + '" stroke="' + F.feldLinie + '" stroke-width="2.5"/>';
    for (let j = 1; j < r.h; j++) s += '<line x1="0" y1="' + j * 100 + '" x2="' + Bb + '" y2="' + j * 100 + '" stroke="' + F.feldLinie + '" stroke-width="2.5"/>';
    s += '<rect x="0" y="0" width="' + Bb + '" height="' + Hh + '" fill="none" stroke="' + F.feldLinie + '" stroke-width="6" rx="4"/>';
    for (const [x, y] of r.hindernisse || []) s += gegenstand('hindernis', x, y, 0.8);
    if (d1.ziel) s += gegenstand(d1.zielSymbol || 'schatz', d1.ziel.x, d1.ziel.y, 0.74);
    if (d2.ziel) s += gegenstand(d2.zielSymbol || 'stern', d2.ziel.x, d2.ziel.y, 0.7);
    if (opt.weg && opt.weg.length) {
      const pkt = [[d2.start.x, d2.start.y]].concat(opt.weg.map((z) => [z.x, z.y]));
      const d = pkt.filter((p, i) => i === 0 || p[0] !== pkt[i - 1][0] || p[1] !== pkt[i - 1][1])
        .map((p, i) => (i ? 'L' : 'M') + (p[0] * 100 + 50) + ' ' + (p[1] * 100 + 50)).join(' ');
      s += '<path d="' + d + '" fill="none" stroke="' + ROT + '" stroke-width="9" stroke-dasharray="20 12" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>';
    }
    s += figur('gruen', d1.start.x, d1.start.y, d1.start.blick);
    s += figur('blau', d2.start.x, d2.start.y, d2.start.blick);
    if (opt.kreuz) {
      const cx = opt.kreuz.x * 100 + 50, cy = opt.kreuz.y * 100 + 50;
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="44" fill="none" stroke="' + ROT + '" stroke-width="7"/>' +
        '<path d="M' + (cx - 26) + ' ' + (cy - 26) + ' L' + (cx + 26) + ' ' + (cy + 26) + ' M' + (cx + 26) + ' ' + (cy - 26) + ' L' + (cx - 26) + ' ' + (cy + 26) + '" stroke="' + ROT + '" stroke-width="11" stroke-linecap="round"/>';
    }
    return s + '</svg>';
  }

  B['m-e19-zwei'] = function (el) {
    const r = raetsel(el, ['zweidrachen']);
    if (!r) return;
    const feld = parseFloat(el.getAttribute('feld') || '20');
    if (feld < 20 && el.closest('.blatt')) return H().fehler(el, 'Felder auf Blättern mindestens 20 mm (feld="20")');
    const opt = { breite: (feld * (r.b * 100 + 12) / 100).toFixed(2) + 'mm', hoehe: (feld * (r.h * 100 + 12) / 100).toFixed(2) + 'mm' };
    const L = r.loesung;
    if (istLoesung(el) && el.getAttribute('loesung') !== 'keine') {
      if (L.stoss) opt.kreuz = L.stoss;
      const wid = el.getAttribute('weg');
      if (wid) {
        const w = H().DATEN.raetsel[wid];
        if (!w || w.art !== 'zweidrachen' || !w.loesung || !w.loesung.planen) return H().fehler(el, 'weg="' + wid + '": ein zweidrachen-Rätsel mit aufgabe „planen“');
        const d2 = w.loesung.drachen[1];
        if (!d2) return H().fehler(el, 'weg="' + wid + '": keine Lösung für den blauen Drachen');
        const s0 = r.drachen[1].start, w0 = w.drachen[1].start;
        if (s0.x !== w0.x || s0.y !== w0.y || r.b !== w.b || r.h !== w.h || JSON.stringify(r.hindernisse || []) !== JSON.stringify(w.hindernisse || [])) return H().fehler(el, 'weg="' + wid + '" gehört zu einem anderen Gitter');
        opt.weg = d2.staende.slice(1);
      }
    }
    el.innerHTML = zweiGitter(r, opt);
    el.classList.add('komp', 'geprueft');
    if (L.stoss) el.dataset.loesung = 'Takt ' + L.stoss.takt + ' in ' + L.stoss.x + ',' + L.stoss.y;
  };

  // Programm-Reihe eines Drachen (oder beider, wenn sie dasselbe Programm haben)
  B['m-e19-prog'] = function (el) {
    const r = raetsel(el, ['zweidrachen']);
    if (!r) return;
    const h = H();
    const wer = el.getAttribute('drache') || '1';
    const gr = parseFloat(el.getAttribute('gr') || '12');
    const bildGr = el.hasAttribute('bild') ? parseFloat(el.getAttribute('bild')) : gr * 0.95;
    const bild = (f) => '<span class="e19-wer">' + dracheSVG(f, bildGr.toFixed(1) + 'mm') + '</span>';
    if (el.hasAttribute('leer')) {
      if (wer !== '2' || !r.loesung.planen) return h.fehler(el, 'leer nur bei drache="2" und aufgabe „planen“');
      const lsg = K().lies(r.loesung.planen.programme[0]);
      const n = el.hasAttribute('plaetze') ? +el.getAttribute('plaetze') : Math.max(8, lsg.length);
      if (lsg.length > n) return h.fehler(el, 'Lösung hat ' + lsg.length + ' Befehle, aber nur ' + n + ' Kästchen');
      if (n > 12) return h.fehler(el, 'Höchstens 12 Kästchen in einer Reihe');
      let html = '';
      for (let i = 0; i < n; i++) {
        const b = lsg[i];
        html += '<span class="platz"><span class="nr">' + (i + 1) + '</span><span class="box leer' + (b ? ' lsg-box' : '') + '">' + (b ? '<span class="lsg-symbol">' + S().symbol(b) + '</span>' : '') + '</span></span>';
      }
      el.innerHTML = '<span class="e19-zeile">' + bild('blau') + '<span class="prog" style="--gr:' + gr + 'mm">' + html + '</span></span>';
      el.dataset.loesung = r.loesung.planen.programme[0];
      el.classList.add('komp', 'geprueft');
      return;
    }
    let text, bilder;
    if (wer === 'beide') {
      if (r.drachen[0].programm !== r.drachen[1].programm) return h.fehler(el, 'drache="beide": Die Drachen haben verschiedene Programme');
      text = r.drachen[0].programm; bilder = el.hasAttribute('ohne-bild') ? '' : bild('gruen') + bild('blau');
    } else {
      const i = wer === '2' ? 1 : 0;
      text = r.drachen[i].programm;
      if (!text) return h.fehler(el, 'Drache ' + (i + 1) + ' hat kein Programm');
      bilder = bild(i ? 'blau' : 'gruen');
    }
    el.innerHTML = '<span class="e19-zeile">' + bilder + '<m-programm befehle="' + h.esc(text) + '" gr="' + gr + '"></m-programm></span>';
    el.classList.add('komp');
  };

  // Ein Feld in Worten (für die Lösung): „in der Ecke rechts oben“, „in der obersten Reihe, 3. Feld von links“
  function feldWort(x, y, b, hh) {
    const reihe = y === 0 ? 'oben' : y === hh - 1 ? 'unten' : null;
    const spalte = x === 0 ? 'links' : x === b - 1 ? 'rechts' : null;
    if (reihe && spalte) return 'in der Ecke ' + spalte + ' ' + reihe;
    const r = y === 0 ? 'in der obersten Reihe' : y === hh - 1 ? 'in der untersten Reihe' : 'in der ' + (y + 1) + '. Reihe von oben';
    if (hh === 1) return x === 0 ? 'ganz links' : x === b - 1 ? 'ganz rechts' : 'im ' + (x + 1) + '. Feld von links';
    const s = x === 0 ? 'ganz links' : x === b - 1 ? 'ganz rechts' : (x + 1) + '. Feld von links';
    return r + ', ' + s;
  }

  function zahlVon(r, was) {
    const L = r.loesung;
    const weltVon = (q) => { const w = {}; for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine']) if (q[f] !== undefined) w[f] = q[f]; return w; };
    if (r.art === 'zweidrachen') {
      if (was === 'takt') { if (!L.stoss) throw new Error('kein Zusammenstoß'); return L.stoss.takt; }
      if (was === 'feld') { if (!L.stoss) throw new Error('kein Zusammenstoß'); return feldWort(L.stoss.x, L.stoss.y, r.b, r.h); }
      if (was === 'takte1') return L.drachen[0].takte;
      if (was === 'takte2') { if (!L.drachen[1]) throw new Error('kein Programm für Drache 2'); return L.drachen[1].takte; }
      if (was === 'laenge') { if (!L.planen) throw new Error('nur bei aufgabe „planen“'); return L.planen.laenge; }
      if (was === 'ohne') { if (!L.planen) throw new Error('nur bei aufgabe „planen“'); return L.planen.ohneAnderen.laenge; }
      if (was === 'karten1') return L.drachen[0].karten;
      throw new Error('was="takt|feld|takte1|takte2|laenge|ohne|karten1"');
    }
    if (r.art === 'pfad') {
      const ew = L.erweitert;
      if (was === 'befehle') {
        if (!L.beispiel) throw new Error('kein Beispiel');
        const e = K().ausfuehren(weltVon(r), L.beispiel, { sprueche: L.sprueche || {} });
        if (!e.geschafft) throw new Error('Beispiel kommt nicht an');
        return e.schritte.length;
      }
      if (was === 'karten') { if (!ew) throw new Error('nur bei erweiterten Rätseln'); return ew.beispielKarten; }
      if (was === 'min') { if (!ew || !ew.vollstaendig || !ew.minKarten) throw new Error('kleinste Kartenzahl nicht bewiesen'); return ew.minKarten; }
      if (was === 'laenge') { if (L.laenge === undefined) throw new Error('keine kürzeste Länge'); return L.laenge; }
      throw new Error('was="befehle|karten|min|laenge"');
    }
    if (r.art === 'lesen') {
      if (was === 'befehle') return L.befehle;
      if (was === 'karten') return K().karten(L.programm);
      if (was === 'kartenmitspruch') return K().karten(L.programm, L.sprueche);
      throw new Error('was="befehle|karten|kartenmitspruch"');
    }
    if (r.art === 'kobold') {
      const prog = L.erweitert ? L.gemeint : L.gemeint.join(' ');
      if (was === 'befehle') {
        const e = K().ausfuehren(weltVon(r), prog, { sprueche: L.gemeintSprueche || {} });
        return e.schritte.length;
      }
      if (was === 'karten') return K().karten(prog);
      if (was === 'stoss') { if (!L.kaputt.stoss) throw new Error('das Kobold-Programm stößt nicht an'); return L.kaputt.stoss.nr + 1; }
      throw new Error('was="befehle|karten|stoss"');
    }
    throw new Error('Rätselart ' + r.art + ' geht hier nicht');
  }

  B['m-e19-zahl'] = function (el) {
    const r = raetsel(el);
    if (!r) return;
    const h = H();
    let n;
    try { n = zahlVon(r, el.getAttribute('was') || 'takt'); } catch (e) { return h.fehler(el, e.message); }
    if (el.hasAttribute('l') && String(n) !== el.getAttribute('l')) return h.fehler(el, 'Im Text steht ' + el.getAttribute('l') + ', die Lösung ist ' + n);
    if (el.hasAttribute('text')) el.innerHTML = '<span class="e19-zahl-text">' + h.esc(String(n)) + '</span>';
    else el.innerHTML = h.feldHTML(String(n), String(n).length > 2 ? 'b3' : String(n).length === 2 ? '' : 'k');
    el.dataset.loesung = String(n);
    el.classList.add('komp', 'geprueft');
  };

  B['m-e19-janein'] = function (el) {
    const r = raetsel(el, ['zweidrachen']);
    if (!r) return;
    const ja = !!r.loesung.stoss;
    const kreis = (an) => '<span class="e19-jn' + (an ? ' e19-jn-lsg' : '') + '">';
    el.innerHTML = '<span class="e19-janein">' + kreis(ja) + 'ja</span>' + kreis(!ja) + 'nein</span></span>';
    el.dataset.loesung = ja ? 'ja' : 'nein';
    el.classList.add('komp', 'geprueft');
  };

  // Takt für Takt: was jeder Drache macht (für die Anleitung)
  B['m-e19-takte'] = function (el) {
    const r = raetsel(el, ['zweidrachen']);
    if (!r) return;
    const h = H();
    const L = r.loesung;
    const prog = [r.drachen[0].programm, r.drachen[1].programm || (L.drachen[1] && L.drachen[1].programm)];
    if (!prog[1]) return h.fehler(el, 'Drache 2 hat kein Programm');
    const befehle = prog.map((p, i) => {
      const d = r.drachen[i];
      const w = { b: r.b, h: r.h, start: d.start, hindernisse: r.hindernisse || [] };
      return K().ausfuehren(w, p, { sprueche: d.sprueche || {} }).schritte.map((s) => s.befehl);
    });
    const bis = el.hasAttribute('bis') ? +el.getAttribute('bis') : (L.stoss ? L.stoss.takt : Math.max(befehle[0].length, befehle[1].length));
    const zelle = (b) => (b ? '<m-symbol name="' + b + '" gr="5"></m-symbol> ' + WORT[b] : '<i>steht</i>');
    let t = '<table class="tab e19-takte"><tr><th>Takt</th><th>' + dracheSVG('gruen', '6mm') + ' grüner Drache</th><th>' + dracheSVG('blau', '6mm') + ' blauer Drache</th></tr>';
    for (let i = 0; i < bis; i++) {
      const stoss = L.stoss && L.stoss.takt === i + 1;
      t += '<tr' + (stoss ? ' class="e19-stoss"' : '') + '><td>' + (i + 1) + '</td><td>' + zelle(befehle[0][i]) + '</td><td>' + zelle(befehle[1][i]) + (stoss ? ' <b>Zusammenstoß!</b>' : '') + '</td></tr>';
    }
    el.innerHTML = t + '</table>';
    el.classList.add('komp', 'geprueft');
  };

  // Rekord: das längste Programm mit höchstens n Karten (Bewegungen gezählt wie ausgeführte Befehle)
  function rekord(n, mitSpruch) {
    const kasten = [];   // Zauber-Kasten aus Befehlen: { text, kosten, laenge }
    for (let w = 2; w <= 5; w++) for (let k = 1; k <= 3; k++) kasten.push({ text: w + '[' + Array(k).fill('vor').join(' ') + ']', kosten: 1 + k, laenge: w * k });
    // Sprüche: 1 bis 4 Teile aus Befehlen und Zauber-Kästen; je Kartenzahl der längste
    const sprueche = [null];
    if (mitSpruch) {
      const teile = [{ text: 'vor', kosten: 1, laenge: 1 }].concat(kasten);
      const beste = {};
      const geh = (liste) => {
        if (liste.length) {
          const kosten = 1 + liste.reduce((s, t) => s + t.kosten, 0), laenge = liste.reduce((s, t) => s + t.laenge, 0);
          if (kosten < n && (!beste[kosten] || beste[kosten].laenge < laenge)) beste[kosten] = { text: liste.map((t) => t.text).join(' '), kosten, laenge };
        }
        if (liste.length < 4) for (const t of teile) geh(liste.concat([t]));
      };
      geh([]);
      sprueche.push(...Object.values(beste));
    }
    let best = null;
    for (const s of sprueche) {
      const rest = n - (s ? s.kosten : 0);
      const atome = [{ text: 'vor', laenge: 1 }].concat(s ? [{ text: '@stern', laenge: s.laenge }] : []);
      const teile = atome.map((a) => ({ text: a.text, kosten: 1, laenge: a.laenge }));
      for (let w = 2; w <= 5; w++) {
        const inhalt = (liste, k) => {
          if (liste.length === k) { teile.push({ text: w + '[' + liste.map((a) => a.text).join(' ') + ']', kosten: 1 + k, laenge: w * liste.reduce((x, a) => x + a.laenge, 0) }); return; }
          for (const a of atome) inhalt(liste.concat([a]), k);
        };
        for (let k = 1; k <= 3; k++) inhalt([], k);
      }
      // Rucksack: längstes Programm mit höchstens „rest“ Karten
      const dp = [{ laenge: 0, teile: [] }];
      for (let c = 1; c <= rest; c++) {
        dp[c] = dp[c - 1];
        for (const t of teile) if (t.kosten <= c && dp[c - t.kosten].laenge + t.laenge > dp[c].laenge) dp[c] = { laenge: dp[c - t.kosten].laenge + t.laenge, teile: dp[c - t.kosten].teile.concat([t.text]) };
      }
      const e = dp[rest] || dp[0];
      if (!e.teile.length) continue;
      if (s && !e.teile.some((t) => t.indexOf('@stern') >= 0)) continue;
      if (!best || e.laenge > best.laenge) best = { laenge: e.laenge, programm: e.teile.join(' '), spruch: s ? s.text : null };
    }
    // Gegenprobe mit dem Ausführer: Kartenzahl und Zahl der Befehle
    const sp = best.spruch ? { stern: best.spruch } : {};
    const karten = K().karten(best.programm, best.spruch ? sp : undefined);
    const laenge = K().ausrollen(best.programm, { sprueche: sp }).length;
    if (karten > n || laenge !== best.laenge) throw new Error('Rekord-Gegenprobe stimmt nicht');
    return best;
  }
  B['m-e19-rekord'] = function (el) {
    const h = H();
    const n = parseInt(el.getAttribute('karten') || '6', 10);
    let b;
    try { b = rekord(n, el.getAttribute('spruch') === 'ja'); } catch (e) { return h.fehler(el, e.message); }
    if (el.hasAttribute('l') && String(b.laenge) !== el.getAttribute('l')) return h.fehler(el, 'Im Text steht ' + el.getAttribute('l') + ', der Rekord mit ' + n + ' Karten ist ' + b.laenge + ' (z. B. ' + b.programm + (b.spruch ? ' mit @stern = ' + b.spruch : '') + ')');
    el.innerHTML = '<span class="e19-zahl-text">' + b.laenge + '</span>';
    el.dataset.loesung = b.laenge + ': ' + b.programm + (b.spruch ? ' / ' + b.spruch : '');
    el.classList.add('komp', 'geprueft');
  };

  // Alle Programme mit der kleinsten Kartenzahl (vom Löser vollständig gesucht), für die Lösungen.
  // anzahl="5" prüft, wie viele verschiedene es sind (gespiegelte Wenn-Karten zählt der Löser extra, hier nicht).
  B['m-e19-alle'] = function (el) {
    const r = raetsel(el, ['pfad']);
    if (!r) return;
    const h = H();
    const ew = r.loesung.erweitert;
    if (!ew || !ew.vollstaendig || !ew.kuerzeste.length) return h.fehler(el, 'Die kleinste Kartenzahl ist nicht bewiesen');
    if (ew.kuerzeste.length >= 20) return h.fehler(el, 'Zu viele Programme zum Auflisten');
    if (el.hasAttribute('anzahl') && String(ew.kuerzeste.length) !== el.getAttribute('anzahl')) return h.fehler(el, 'Es sind ' + ew.kuerzeste.length + ' Programme, im Text steht ' + el.getAttribute('anzahl'));
    const gr = el.getAttribute('gr') || '5.5';
    el.innerHTML = '<span class="e19-alle">' + ew.kuerzeste.map((k) => '<span class="e19-alle-eins"><m-programm befehle="' + h.esc(k.programm) + '" gr="' + gr + '" nummern="nein"></m-programm></span>').join('') + '</span>';
    el.dataset.loesung = ew.kuerzeste.map((k) => k.programm).join(' | ');
    el.classList.add('komp', 'geprueft');
  };

  B['m-e19-drache'] = function (el) {
    const f = el.getAttribute('farbe') || 'gruen';
    if (!['gruen', 'blau'].includes(f)) return H().fehler(el, 'farbe="gruen" oder "blau"');
    el.innerHTML = dracheSVG(f, parseFloat(el.getAttribute('gr') || '6') + 'mm', el.getAttribute('blick') || 'oben');
    el.classList.add('komp');
  };
})();
