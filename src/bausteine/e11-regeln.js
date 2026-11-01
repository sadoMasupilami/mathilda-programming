/* =====================================================================
   Bausteine für Einheit 11 (Wenn-dann-Regeln)
     <m-e11-zahl raetsel="e11-l4" was="befehle|drehungen" [welt="2"] [l="6"]>
         Antwortkästchen zu einem lesen-Rätsel (oder zum Beispiel eines pfad-Rätsels
         in Welt welt="n"): Wie viele Befehle macht der
         Drache wirklich (Wiederhol-Zauber und Wenn-dann-Kasten wie ausgeführt)?
         bzw. wie oft dreht er sich? Die Zahl rechnet der Ausführer aus,
         l="…" prüft eine Zahl, die zusätzlich im Text steht.
     <m-e11-karten raetsel="e11-p1" [l="6"]>
         Antwortkästchen: Kartenzahl des Beispiel-Programms eines pfad-Rätsels
         (Wenn-Karte zählt 1, die Wörter wenn/dann/sonst zählen nicht).
     <m-e11-aufstellung raetsel="e11-b3" [feld="8"] [ohne-weg]>
         kleines Bild einer Aufstellung am Boden-Gitter, nur für die Anleitung
         (darum dürfen die Felder kleiner als 20 mm sein): Steine (Kuscheltiere),
         Startfeld, roter Weg und der Drache am Ende, gerechnet mit dem Ausführer.
     <m-e11-ende raetsel="e11-b3" ende="2,2,unten" [befehle="6"] [drehungen="2"] [stoss="5"]
                 [prog="kaputt"] [welt="2"]>Text</m-e11-ende>
         prüft eine Aussage im Text der Anleitung mit dem Ausführer (Endfeld x,y und
         Blickrichtung, Zahl der ausgeführten Befehle bzw. Drehungen, Stoß bei Befehl n)
         und lässt den Text stehen. lesen: das Programm; kobold: die gemeinte Reparatur
         (prog="kaputt": das kaputte Programm); pfad: das Beispiel in Welt welt="n".
   Die Lösungsansicht zeigt die Zahlen rot (wie <m-feld>).
   Aussehen: <style> in src/einheiten/11-wenn-dann-regeln.html (.e11-…)
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSymbole;
  const K = () => window.WerkstattKern;

  function raetsel(el, arten) {
    const h = H();
    const id = el.getAttribute('raetsel');
    const r = id && h.DATEN.raetsel[id];
    if (!r) { h.fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (!arten.includes(r.art) || !r.loesung) { h.fehler(el, 'Rätsel „' + id + '“ muss art ' + arten.join(' oder ') + ' sein (und gelöst)'); return null; }
    return r;
  }
  function welt(r) {
    const w = {};
    for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine', 'zielSymbol']) if (r[f] !== undefined) w[f] = r[f];
    return w;
  }
  function antwort(el, n) {
    const h = H();
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'Die Zahl ist ' + n + ', nicht ' + el.getAttribute('l'));
    el.innerHTML = h.feldHTML(String(n), n >= 10 ? '' : 'k');
    el.dataset.loesung = String(n);
    el.classList.add('komp', 'geprueft');
  }

  B['m-e11-zahl'] = function (el) {
    const r = raetsel(el, ['lesen', 'pfad']);
    if (!r) return;
    const was = el.getAttribute('was') || 'befehle';
    let w = welt(r), prog = r.loesung.programm;
    if (r.art === 'pfad') {
      // pfad: das Beispiel-Programm (welt="n" bei mehreren Gittern)
      prog = r.loesung.beispiel;
      if (!prog) return H().fehler(el, 'm-e11-zahl: pfad-Rätsel ohne Beispiel');
      if (r.welten) {
        const n = parseInt(el.getAttribute('welt') || '0', 10);
        if (!(n >= 1 && n <= r.welten.length)) return H().fehler(el, 'm-e11-zahl: welt="1" bis welt="' + r.welten.length + '" angeben');
        w = Object.assign(w, welt(r.welten[n - 1]));
      }
    }
    const e = K().ausfuehren(w, prog, { sprueche: r.loesung.sprueche });
    if (e.stoss || e.zuLang) return H().fehler(el, 'Das Programm läuft nicht sauber durch');
    let n;
    if (was === 'befehle') n = e.schritte.length;
    else if (was === 'drehungen') n = e.schritte.filter((s) => s.befehl !== 'vor').length;
    else return H().fehler(el, 'was="befehle" oder was="drehungen"');
    antwort(el, n);
  };

  B['m-e11-karten'] = function (el) {
    const r = raetsel(el, ['pfad']);
    if (!r) return;
    const ew = r.loesung.erweitert;
    if (!ew || !ew.beispiel) return H().fehler(el, 'm-e11-karten: pfad-Rätsel mit "erlaubt" und "beispiel"');
    antwort(el, ew.beispielKarten);
  };

  B['m-e11-aufstellung'] = function (el) {
    const h = H();
    const r = raetsel(el, ['lesen', 'kobold']);
    if (!r) return;
    const feld = parseFloat(h.attr(el, 'feld', '8'));
    const w = welt(r);
    const prog = r.art === 'kobold' ? r.loesung.gemeint : r.loesung.programm;
    const e = K().ausfuehren(w, prog);
    const opt = {
      breite: (feld * (w.b * 100 + 12) / 100).toFixed(2) + 'mm',
      hoehe: (feld * (w.h * 100 + 12) / 100).toFixed(2) + 'mm',
      label: 'Aufstellung ' + r.id,
    };
    if (!el.hasAttribute('ohne-weg')) { opt.weg = e.schritte.map((s) => s.nachher); opt.geist = true; }
    el.innerHTML = S().gitter(w, opt);
    el.dataset.ende = e.ende.x + ',' + e.ende.y + ',' + e.ende.blick;
    el.classList.add('komp', 'geprueft');
  };

  B['m-e11-ende'] = function (el) {
    const h = H();
    const r = raetsel(el, ['lesen', 'kobold', 'pfad']);
    if (!r) return;
    const L = r.loesung;
    let w = welt(r), prog, sp;
    if (r.art === 'lesen') { prog = L.programm; sp = L.sprueche; }
    else if (r.art === 'kobold') { prog = el.getAttribute('prog') === 'kaputt' ? L.programm : L.gemeint; sp = L.sprueche; }
    else {
      prog = L.beispiel; sp = L.sprueche;
      if (r.welten) {
        const n = parseInt(el.getAttribute('welt') || '0', 10);
        if (!(n >= 1 && n <= r.welten.length)) return h.fehler(el, 'm-e11-ende: welt="1" bis welt="' + r.welten.length + '" angeben');
        w = Object.assign(w, welt(r.welten[n - 1]));
      }
    }
    const e = K().ausfuehren(w, prog, sp ? { sprueche: sp } : undefined);
    const fehl = [];
    const soll = el.getAttribute('ende');
    if (soll) {
      const [x, y, blick] = soll.split(',').map((s) => s.trim());
      if (e.ende.x !== +x || e.ende.y !== +y || (blick && e.ende.blick !== blick)) fehl.push('Ende ist ' + e.ende.x + ',' + e.ende.y + ',' + e.ende.blick + ', nicht ' + soll);
    }
    if (el.hasAttribute('befehle') && e.schritte.length !== +el.getAttribute('befehle')) fehl.push(e.schritte.length + ' Befehle, nicht ' + el.getAttribute('befehle'));
    const dreh = e.schritte.filter((s) => s.befehl !== 'vor').length;
    if (el.hasAttribute('drehungen') && dreh !== +el.getAttribute('drehungen')) fehl.push(dreh + ' Drehungen, nicht ' + el.getAttribute('drehungen'));
    if (el.hasAttribute('stoss')) {
      if (!e.stoss) fehl.push('kein Stoß');
      else if (e.stoss.nr + 1 !== +el.getAttribute('stoss')) fehl.push('Stoß bei Befehl ' + (e.stoss.nr + 1) + ', nicht ' + el.getAttribute('stoss'));
    } else if (e.stoss) fehl.push('Der Drache stößt bei Befehl ' + (e.stoss.nr + 1) + ' an (stoss="…" angeben, wenn das gewollt ist)');
    if (fehl.length) return h.fehler(el, 'm-e11-ende ' + r.id + ': ' + fehl.join('; '));
    el.classList.add('geprueft');
  };
})();
