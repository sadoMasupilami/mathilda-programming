/* =====================================================================
   Bausteine für Einheit 16 (Labyrinth-Meisterin)
     <m-e16-labyrinth raetsel="e16-m1" feld="22" [zeige="sackgassen weg zu"]>
         Labyrinth wie <m-gitter>. Lösungsansicht: Sackgassen-Felder rot schraffiert
         (sackgassen), der kürzeste Weg rot (weg), ein rotes Kreuz im ersten Feld jeder
         Sackgasse (zu: dort zugemacht gibt es keine Sackgasse mehr).
         Sackgassen rechnet der Baustein selbst aus („Sackgassen auffüllen“): Felder mit
         höchstens einem freien Nachbarn wegnehmen, bis keines mehr übrig ist; Start und
         Schatz bleiben. Eine Sackgasse ist ein zusammenhängendes Stück davon.
     <m-e16-zahl raetsel="e16-m1" was="sackgassen|zu|felder|kuerzestes|befehle|vor|links|rechts|zurueck" [l="3"] [text]>
         Antwortkästchen mit der ausgerechneten Zahl (mit text: nur die Zahl im Fließtext,
         l ist dann Pflicht und wird geprüft). sackgassen: wie viele Sackgassen; zu: wie viele
         Steine alle Sackgassen zumachen (je einer ins erste Feld, mit Gegenprobe); felder:
         Felder auf dem kürzesten Weg ohne Startfeld; kuerzestes: Befehle des kürzesten
         Programms (pfad); befehle, vor, links, rechts: was der Drache beim Programm eines
         lesen-Rätsels wirklich macht; zurueck: nach wie vielen Befehlen er wieder am Start steht.
     <m-e16-janein raetsel="e16-la" frage="kuerzester">
         „ja / nein“ zum Ankreuzen. Lösung: Geht die Regel (lesen-Rätsel) den kürzesten
         Weg, also über so wenige Felder wie das kürzeste Programm?
     <m-e16-form raetsel="e16-b1" [anzahl="4"] [bedingungen="alle"]>
         Nur für die Lösung: Alle Programme in der Form des Beispiels (gleiche Kästen,
         jede Wenn-Karte aus "bedingungen", mit bedingungen="alle" jede der sechs Wenn-Karten,
         jeder Befehl vor/links/rechts), die in allen Gittern ankommen, als Liste von <m-programm>
         (der Baustein zeichnet sie gleich selbst). anzahl prüft, wie viele es sind.
     <m-e16-kuerzeste raetsel="e16-b1" [karten="5"] [max="2"] [programm="…"]>
         Nur für die Lösung: die Programme mit der kleinsten Kartenzahl, die der Löser
         gefunden hat (r.loesung.erweitert.kuerzeste), als <m-programm>. karten prüft die
         kleinste Kartenzahl; programm zeigt genau dieses (geprüft: kommt überall an und
         hat die kleinste Kartenzahl).
   Rätsel: raetsel/e16.json. Ausführer: web/kern/ausfuehrer.js (wie Löser und App).
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const K = () => window.WerkstattKern;
  const S = () => window.WerkstattSymbole;
  const istLoesung = (el) => !!el.closest('.loesungsmodus');
  const ROT = '#d1335b';

  function raetsel(el, arten) {
    const id = el.getAttribute('raetsel');
    const r = id && H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (arten && !arten.includes(r.art)) { H().fehler(el, 'Rätsel „' + id + '“ ist ' + r.art + ', erwartet ' + arten.join(' oder ')); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Fehler im Löser?)'); return null; }
    return r;
  }
  function weltVon(r) {
    const w = {};
    for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine', 'zielSymbol']) if (r[f] !== undefined) w[f] = r[f];
    return w;
  }

  // Sackgassen auffüllen: freie Felder (ohne Start und Schatz) mit höchstens einem freien Nachbarn
  // wegnehmen, bis keines mehr übrig ist. Ergebnis: weggenommene Felder, die Sackgassen (zusammen-
  // hängende Stücke) und ihr erstes Feld (das Feld an der Abzweigung).
  function sackgassen(w) {
    const W = K().welt(w);
    const key = (x, y) => x + ',' + y;
    const nb = (k) => { const [x, y] = k.split(',').map(Number); return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].map(([a, b]) => key(a, b)); };
    // nur Felder, die der Drache vom Start aus erreichen kann (abgeschlossene Felder gehören nicht zum Labyrinth)
    const frei = new Set([key(W.start.x, W.start.y)]);
    const offen0 = [key(W.start.x, W.start.y)];
    while (offen0.length) {
      for (const n of nb(offen0.pop())) {
        const [x, y] = n.split(',').map(Number);
        if (W.frei(x, y) && !frei.has(n)) { frei.add(n); offen0.push(n); }
      }
    }
    const fest = new Set([key(W.start.x, W.start.y)]);
    if (W.ziel) fest.add(key(W.ziel.x, W.ziel.y));
    const rest = new Set(frei);
    const weg = new Set();
    let geaendert = true;
    while (geaendert) {
      geaendert = false;
      for (const k of Array.from(rest)) {
        if (fest.has(k)) continue;
        if (nb(k).filter((n) => rest.has(n)).length <= 1) { rest.delete(k); weg.add(k); geaendert = true; }
      }
    }
    // Stücke (zusammenhängend) und ihre ersten Felder (Nachbar eines übrig gebliebenen Felds)
    const stuecke = [];
    const gesehen = new Set();
    for (const k of weg) {
      if (gesehen.has(k)) continue;
      const stueck = [];
      const offen = [k];
      gesehen.add(k);
      while (offen.length) {
        const a = offen.pop();
        stueck.push(a);
        for (const n of nb(a)) if (weg.has(n) && !gesehen.has(n)) { gesehen.add(n); offen.push(n); }
      }
      const erste = stueck.filter((a) => nb(a).some((n) => rest.has(n)));
      stuecke.push({ felder: stueck, erste });
    }
    return { weg: Array.from(weg).map((k) => k.split(',').map(Number)), stuecke, rest };
  }

  function wegVon(r, w) {
    const L = r.loesung;
    let prog = null;
    if (r.art === 'pfad') prog = L.beispiel || (L.programme && L.programme[0] && L.programme[0].join(' '));
    if (r.art === 'lesen') prog = L.programm;
    if (!prog) return [];
    return K().ausfuehren(w, prog).schritte.map((s) => s.nachher);
  }

  // ---------------------------------------------------------------------
  B['m-e16-labyrinth'] = function (el) {
    const r = raetsel(el, ['pfad', 'lesen']);
    if (!r) return;
    const feld = parseFloat(el.getAttribute('feld') || '22');
    if (feld < 20) return H().fehler(el, 'Felder mindestens 20 mm (feld="20")');
    const zeige = (el.getAttribute('zeige') || 'sackgassen weg').split(/\s+/);
    const w = weltVon(r);
    let sg;
    try { sg = sackgassen(w); } catch (e) { return H().fehler(el, e.message); }
    for (const s of sg.stuecke) if (s.erste.length !== 1) return H().fehler(el, 'Eine Sackgasse hängt an ' + s.erste.length + ' Stellen (ist das ein Labyrinth mit Ring?)');
    const opt = { breite: (feld * (w.b * 100 + 12) / 100).toFixed(2) + 'mm', hoehe: (feld * (w.h * 100 + 12) / 100).toFixed(2) + 'mm', label: 'Labyrinth ' + r.id };
    const L = istLoesung(el);
    if (L && zeige.includes('weg')) { opt.weg = wegVon(r, w); opt.geist = true; }
    let svg = S().gitter(w, opt);
    if (L && zeige.includes('sackgassen')) {
      const grau = sg.weg.map(([x, y]) => '<rect x="' + (x * 100 + 3) + '" y="' + (y * 100 + 3) + '" width="94" height="94" fill="' + ROT + '" opacity="0.2"/>').join('');
      svg = svg.replace(/(<rect x="0" y="0"[^>]*\/>)/, '$1' + grau);
    }
    if (L && zeige.includes('zu')) {
      const kreuze = sg.stuecke.map((s) => {
        const [x, y] = s.erste[0].split(',').map(Number);
        const a = x * 100 + 22, b = y * 100 + 22, c = x * 100 + 78, d = y * 100 + 78;
        return '<path d="M' + a + ' ' + b + ' L' + c + ' ' + d + ' M' + c + ' ' + b + ' L' + a + ' ' + d + '" stroke="' + ROT + '" stroke-width="10" stroke-linecap="round"/>';
      }).join('');
      svg = svg.replace(/<\/svg>$/, kreuze + '</svg>');
    }
    el.innerHTML = svg;
    el.dataset.sackgassen = String(sg.stuecke.length);
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  function zahlVon(r, was) {
    const w = weltVon(r);
    if (was === 'sackgassen' || was === 'zu') {
      const sg = sackgassen(w);
      if (was === 'zu') {
        // Gegenprobe: ein Stein in jedes erste Feld, dann gibt es keine Sackgasse mehr, und der Schatz bleibt erreichbar
        const neu = Object.assign({}, w, { hindernisse: (w.hindernisse || []).concat(sg.stuecke.map((s) => s.erste[0].split(',').map(Number))) });
        if (sackgassen(neu).stuecke.length) throw new Error('Mit Steinen in den ersten Feldern bleibt eine Sackgasse übrig');
        if (r.art === 'pfad' && !K().ausfuehren(neu, r.loesung.programme[0].join(' ')).geschafft) throw new Error('Die Steine sperren den Weg zum Schatz');
      }
      return sg.stuecke.length;
    }
    if (was === 'felder') {
      if (r.art !== 'pfad' || !r.loesung.programme) throw new Error('was="felder" nur bei pfad-Rätseln');
      if (!r.loesung.eindeutig) throw new Error('was="felder": das kürzeste Programm ist nicht eindeutig');
      return r.loesung.programme[0].filter((b) => b === 'vor').length;
    }
    if (was === 'kuerzestes') {
      if (r.art !== 'pfad' || r.loesung.laenge === undefined) throw new Error('was="kuerzestes" nur bei pfad-Rätseln mit einem Gitter');
      return r.loesung.laenge;
    }
    if (['befehle', 'vor', 'links', 'rechts', 'zurueck'].includes(was)) {
      if (r.art !== 'lesen') throw new Error('was="' + was + '" nur bei lesen-Rätseln');
      const e = K().ausfuehren(w, r.loesung.programm, { sprueche: r.loesung.sprueche });
      if (was === 'zurueck') {
        // erst weg vom Startfeld, dann wieder darauf
        const amStart = (s) => s.nachher.x === w.start.x && s.nachher.y === w.start.y;
        const weg = e.schritte.findIndex((s) => !amStart(s));
        const i = weg < 0 ? -1 : e.schritte.findIndex((s, j) => j > weg && amStart(s));
        if (i < 0) throw new Error('Der Drache kommt nie wieder ans Startfeld');
        return i + 1;
      }
      return was === 'befehle' ? e.schritte.length : e.schritte.filter((s) => s.befehl === was).length;
    }
    throw new Error('was: sackgassen, zu, felder, kuerzestes, befehle, vor, links, rechts oder zurueck');
  }
  B['m-e16-zahl'] = function (el) {
    const r = raetsel(el);
    if (!r) return;
    let n;
    try { n = zahlVon(r, el.getAttribute('was')); } catch (e) { return H().fehler(el, e.message); }
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return H().fehler(el, 'Die Zahl ist ' + n + ', nicht ' + el.getAttribute('l'));
    // text: nur die Zahl im Fließtext der Anleitung (geprüft mit l="…"), sonst ein Antwortkästchen
    if (el.hasAttribute('text')) {
      if (!el.hasAttribute('l')) return H().fehler(el, 'Mit text bitte l="…" angeben (die Zahl, die im Text stehen soll)');
      el.textContent = String(n);
    } else el.innerHTML = H().feldHTML(String(n), n >= 10 ? '' : 'k');
    el.dataset.loesung = String(n);
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // ja / nein: Geht die Regel den kürzesten Weg?
  B['m-e16-janein'] = function (el) {
    const r = raetsel(el, ['lesen']);
    if (!r) return;
    if ((el.getAttribute('frage') || 'kuerzester') !== 'kuerzester') return H().fehler(el, 'frage="kuerzester"');
    const w = weltVon(r);
    let ja;
    try {
      const e = K().ausfuehren(w, r.loesung.programm, { sprueche: r.loesung.sprueche });
      if (!e.geschafft) throw new Error('Die Regel kommt nicht an');
      // kürzester Weg: so wenige vor wie im kürzesten Programm (Breitensuche über alle Wege)
      const W = K().welt(w);
      const key = (x, y) => x + ',' + y;
      const dist = new Map([[key(W.start.x, W.start.y), 0]]);
      const q = [[W.start.x, W.start.y]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [a, b] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (W.frei(a, b) && !dist.has(key(a, b))) { dist.set(key(a, b), dist.get(key(x, y)) + 1); q.push([a, b]); }
        }
      }
      const kurz = dist.get(key(W.ziel.x, W.ziel.y));
      ja = e.schritte.filter((s) => s.befehl === 'vor').length === kurz;
    } catch (e) { return H().fehler(el, e.message); }
    const kreuz = (an) => '<span class="e16-kreuz">' + (an && istLoesung(el) ? '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 22 L78 78 M78 22 L22 78" stroke="' + ROT + '" stroke-width="13" stroke-linecap="round"/></svg>' : '') + '</span>';
    el.innerHTML = '<span class="e16-janein">' + kreuz(ja) + '<span>ja</span>' + kreuz(!ja) + '<span>nein</span></span>';
    el.dataset.loesung = ja ? 'ja' : 'nein';
    el.classList.add('komp', 'geprueft');
  };

  // ---------------------------------------------------------------------
  // Alle Füllungen der Form des Beispiels, die in allen Gittern ankommen
  function formFuellungen(r, alle) {
    const L = r.loesung;
    const ew = L.erweitert;
    if (!ew || !ew.beispiel) throw new Error('m-e16-form nur bei pfad-Rätseln mit "erlaubt" und Beispiel');
    const welten = (r.welten || [{}]).map((x) => Object.assign(weltVon(r), weltVon(x)));
    const form = K().lies(ew.beispiel);
    const bed = alle ? K().BEDINGUNGEN : (ew.bedingungen && ew.bedingungen.length ? ew.bedingungen : ['stein', 'frei']);
    // Plätze sammeln: Befehle und Wenn-Karten (Zahl im Zauber-Kasten bleibt fest)
    const plaetze = [];
    const geh = (l) => l.forEach((t, i) => {
      if (typeof t === 'string') { plaetze.push({ l, i, art: 'befehl' }); return; }
      if (t.spruch) throw new Error('m-e16-form: Zaubersprüche gehen hier nicht');
      if (t.wenn) { plaetze.push({ t, art: 'wenn' }); geh(t.dann); geh(t.sonst); return; }
      geh(t.befehle);
    });
    const kopie = JSON.parse(JSON.stringify(form));
    geh(kopie);
    const optionen = plaetze.map((p) => (p.art === 'wenn' ? bed : ['vor', 'links', 'rechts']));
    const anzahl = optionen.reduce((s, o) => s * o.length, 1);
    if (anzahl > 200000) throw new Error('m-e16-form: zu viele Füllungen (' + anzahl + ')');
    const gute = [];
    for (let n = 0; n < anzahl; n++) {
      let rest = n;
      plaetze.forEach((p, j) => {
        const o = optionen[j][rest % optionen[j].length];
        rest = Math.floor(rest / optionen[j].length);
        if (p.art === 'wenn') p.t.wenn = o; else p.l[p.i] = o;
      });
      const text = K().alsText(kopie);
      if (welten.every((w) => K().ausfuehren(w, text).geschafft)) gute.push(text);
    }
    if (!gute.includes(K().alsText(form))) throw new Error('m-e16-form: das Beispiel selbst kommt nicht an?');
    // Reihenfolge: zuerst das Beispiel, dann die mit denselben Wenn-Karten wie im Beispiel (vorne zuerst)
    const karten = (t) => (t.match(/wenn\[[a-z-]+/g) || []).map((w) => w.slice(5));
    const bk = karten(K().alsText(form));
    const schluessel = (t) => karten(t).map((c, i) => (c === bk[i] ? '0' : '1')).join('');
    return gute.map((t, i) => ({ t, i })).sort((a, b) => schluessel(a.t).localeCompare(schluessel(b.t)) || a.i - b.i).map((x) => x.t);
  }
  function liste(el, programme, gr) {
    el.innerHTML = '<span class="e16-progliste">' + programme.map((p) => '<span class="e16-progzeile"><m-programm befehle="' + H().esc(p) + '" gr="' + gr + '" nummern="nein"></m-programm></span>').join('') + '</span>';
    // gleich zeichnen (unabhängig davon, ob programmieren.js vor oder nach dieser Datei an der Reihe ist;
    // ein zweites Zeichnen im Durchgang für <m-programm> ergibt dasselbe)
    if (B['m-programm']) el.querySelectorAll('m-programm').forEach((p) => B['m-programm'](p));
  }
  B['m-e16-form'] = function (el) {
    const r = raetsel(el, ['pfad']);
    if (!r) return;
    let gute;
    const bAttr = el.getAttribute('bedingungen');
    if (bAttr && bAttr !== 'alle') return H().fehler(el, 'bedingungen="alle" oder weglassen');
    try { gute = formFuellungen(r, bAttr === 'alle'); } catch (e) { return H().fehler(el, e.message); }
    if (el.hasAttribute('anzahl') && +el.getAttribute('anzahl') !== gute.length) return H().fehler(el, 'In die Form passen ' + gute.length + ' Programme, die ankommen, nicht ' + el.getAttribute('anzahl'));
    liste(el, gute, el.getAttribute('gr') || '6');
    el.dataset.anzahl = String(gute.length);
    el.classList.add('komp', 'geprueft');
  };
  B['m-e16-kuerzeste'] = function (el) {
    const r = raetsel(el, ['pfad']);
    if (!r) return;
    const ew = r.loesung.erweitert;
    if (!ew || !ew.vollstaendig || !ew.kuerzeste || !ew.kuerzeste.length) return H().fehler(el, 'Der Löser hat für „' + r.id + '“ keine kleinste Kartenzahl bewiesen');
    if (el.hasAttribute('karten') && +el.getAttribute('karten') !== ew.minKarten) return H().fehler(el, 'Kleinste Kartenzahl ist ' + ew.minKarten + ', nicht ' + el.getAttribute('karten'));
    if (el.hasAttribute('programm')) {
      // ein bestimmtes Programm zeigen: Es muss in jedem Gitter ankommen und die kleinste Kartenzahl haben
      const p = el.getAttribute('programm');
      const welten = (r.welten || [{}]).map((x) => Object.assign(weltVon(r), weltVon(x)));
      try {
        if (!welten.every((w) => K().ausfuehren(w, p).geschafft)) throw new Error('„' + p + '“ kommt nicht in jedem Gitter an');
        if (K().karten(p) !== ew.minKarten) throw new Error('„' + p + '“ hat ' + K().karten(p) + ' Karten, die kleinste Zahl ist ' + ew.minKarten);
      } catch (e) { return H().fehler(el, e.message); }
      liste(el, [K().alsText(p)], el.getAttribute('gr') || '6');
    } else {
      const n = el.hasAttribute('max') ? +el.getAttribute('max') : ew.kuerzeste.length;
      liste(el, ew.kuerzeste.slice(0, n).map((p) => p.programm), el.getAttribute('gr') || '6');
    }
    el.dataset.minKarten = String(ew.minKarten);
    el.classList.add('komp', 'geprueft');
  };
})();
