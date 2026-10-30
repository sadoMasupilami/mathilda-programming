/* =====================================================================
   Bausteine nur für Einheit 1 (Ich bin dein Roboter)
     <m-e1-wahl raetsel="e1-d1" [nach="2"] [gr="20"] [reihe="oben rechts unten links"]>
         vier Drachen zum Ankreuzen: Wohin schaut der Drache am Ende
         (oder nach Befehl n)? Die Lösung kommt aus dem Rätsel-Löser
         (raetsel/e1.json, art "lesen"), die Lösungsansicht kreist den
         richtigen Drachen rot ein.
     <m-e1-befehlwahl raetsel="e1-d5" [gr="14"]>
         die drei Befehle zum Ankreuzen: Welcher EINE Befehl macht dasselbe
         wie das ganze Programm des Rätsels? Ausgerechnet mit dem Ausführer.
   Aussehen: <style> in src/einheiten/01-ich-bin-dein-roboter.html (.e01-…)
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const S = () => window.WerkstattSymbole;
  const K = () => window.WerkstattKern;
  const RICHTUNGEN = ['oben', 'rechts', 'unten', 'links'];

  function lesenRaetsel(el) {
    const h = H();
    const id = el.getAttribute('raetsel');
    const r = id && h.DATEN.raetsel[id];
    if (!r) { h.fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (r.art !== 'lesen' || !r.loesung) { h.fehler(el, 'Rätsel „' + id + '“ muss art "lesen" sein (und gelöst)'); return null; }
    return r;
  }
  function welt(r) {
    const w = {};
    for (const f of ['b', 'h', 'start', 'ziel', 'hindernisse', 'edelsteine']) if (r[f] !== undefined) w[f] = r[f];
    return w;
  }

  B['m-e1-wahl'] = function (el) {
    const h = H();
    const r = lesenRaetsel(el);
    if (!r) return;
    let ziel = r.loesung.ende;
    const nach = el.getAttribute('nach');
    if (nach) {
      ziel = r.loesung.nach && r.loesung.nach[nach];
      if (!ziel) return h.fehler(el, 'nach="' + nach + '": im Rätsel fehlt "fragen": [' + nach + ']');
    }
    const gr = parseFloat(h.attr(el, 'gr', '20'));
    if (gr < 20) return h.fehler(el, 'Felder mindestens 20 mm');
    const reihe = h.attr(el, 'reihe', RICHTUNGEN.join(' ')).trim().split(/\s+/);
    if (reihe.length !== 4 || new Set(reihe).size !== 4 || reihe.some((b) => !RICHTUNGEN.includes(b))) {
      return h.fehler(el, 'reihe: alle vier Richtungen genau einmal (oben rechts unten links)');
    }
    const mm = (gr * 1.12).toFixed(2) + 'mm';
    let html = '<span class="e01-wahl">';
    for (const b of reihe) {
      const svg = S().gitter({ b: 1, h: 1, start: { x: 0, y: 0, blick: b } }, { breite: mm, hoehe: mm, startFeld: false, label: 'Drache schaut nach ' + b });
      html += '<span class="e01-wahl-feld' + (b === ziel.blick ? ' e01-richtig' : '') + '">' + svg + '</span>';
    }
    html += '</span>';
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };

  B['m-e1-befehlwahl'] = function (el) {
    const h = H();
    const r = lesenRaetsel(el);
    if (!r) return;
    const gr = parseFloat(h.attr(el, 'gr', '14'));
    const w = welt(r);
    const soll = K().ausfuehren(w, r.programm).ende;
    let treffer = 0;
    let html = '<span class="e01-befehlwahl">';
    for (const b of K().BEFEHLE) {
      const e = K().ausfuehren(w, [b]);
      const gleich = !e.stoss && e.ende.x === soll.x && e.ende.y === soll.y && e.ende.blick === soll.blick;
      if (gleich) treffer++;
      html += '<span class="e01-wahl-feld e01-befehl' + (gleich ? ' e01-richtig' : '') + '" style="width:' + gr + 'mm;height:' + gr + 'mm">' + S().symbol(b, '82%') + '</span>';
    }
    html += '</span>';
    if (treffer !== 1) return h.fehler(el, treffer + ' Befehle machen dasselbe wie „' + r.programm + '“ (genau einer soll es sein)');
    el.innerHTML = html;
    el.classList.add('komp', 'geprueft');
  };
})();
