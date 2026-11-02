/* =====================================================================
   Bausteine für Einheit 17 (Zaubersprüche)
     <m-e17-zahl raetsel="e17-l1" was="befehle">
         Antwortfeld: Wie viele Befehle macht der Drache wirklich? (lesen-Rätsel,
         Zaubersprüche ausgerollt; die Zahl kommt vom Löser)
     <m-e17-karten raetsel="e17-k1" teil="lang|kurz">
         Antwortfeld mit der Kartenzahl eines kuerzer-Rätsels (der Zauberspruch zählt
         mit: 1 Karte für den Namen plus sein Inhalt, jeder Aufruf 1 Karte; vom Löser)
     <m-e17-karten raetsel="e17-p2" teil="beispiel">
         Kartenzahl des Beispiels eines pfad-Rätsels (vorgegebene Sprüche zählen nicht)
     <m-e17-tanz name="stern" spruch="hüpfen, hüpfen, klatschen"
                 programm="@stern, @stern, Kreisel, @stern" fragen="bewegungen, karten, hüpfen">
         Ein Tanz mit Zauberspruch: oben der Spruch (braun, Siegel und Name, Tanz-Karten),
         darunter das Tanz-Programm (Aufruf-Karten mit Siegel und Tanz-Karten).
         fragen: bewegungen (alle Bewegungen, Sprüche ausgerollt), karten (der Spruch, den
         man selbst legt, zählt einmal: 1 + Inhalt; jede Programm-Karte 1), oder ein Wort
         (wie oft kommt diese Tanz-Karte beim Tanzen dran?). Die Antworten rechnet der
         Baustein selbst aus und zeigt sie in der Lösungsansicht rot.
   Beschreibung der Regeln: plan/lehrplan.md 7.8, vorlagen/AUTOREN-LEITFADEN.md 4a
   ===================================================================== */
(function () {
  'use strict';
  const B = (window.__bausteine = window.__bausteine || {});
  const H = () => window.__hilfen;
  const K = () => window.WerkstattKern;
  const S = () => window.WerkstattSymbole;

  // Eigene Gestaltung (Präfix e17-), einmal pro Dokument. Farben wie die Zaubersprüche im Kern (braun).
  function stil() {
    if (document.getElementById('e17-stil')) return;
    const F = S().FARBE;
    const st = document.createElement('style');
    st.id = 'e17-stil';
    st.textContent = `
m-e17-zahl, m-e17-karten { display: inline-block; vertical-align: middle; line-height: 1; }
m-e17-tanz { display: block; }
.e17-tanz { display: flex; flex-direction: column; gap: 3mm; align-items: flex-start; }
.e17-tanz .e17-zeile { display: flex; align-items: center; gap: 2.2mm; flex-wrap: nowrap; }
.e17-tanz .e17-def { display: inline-flex; align-items: center; gap: 2.2mm; border: 0.8mm solid ${F.spruch}; background: ${F.spruchHell}; border-radius: 3mm; padding: 1.5mm 2.5mm 1.5mm 2mm; }
.e17-tanz .e17-kopf { display: inline-flex; flex-direction: column; align-items: center; gap: 0.6mm; }
.e17-tanz .e17-kopf svg { display: block; width: calc(var(--gr, 13mm) * 0.9); height: calc(var(--gr, 13mm) * 0.9); }
.e17-tanz .e17-wort { font-family: var(--kind); font-weight: 700; font-size: 14pt; color: ${F.spruch}; white-space: nowrap; line-height: 1; }
.e17-tanz .e17-tk { display: inline-flex; align-items: center; justify-content: center; height: var(--gr, 13mm); border: 0.55mm solid var(--tinte); border-radius: 2mm; background: white; padding: 0 2.4mm; font-family: var(--kind); font-size: 15pt; line-height: 1; white-space: nowrap; }
.e17-tanz .e17-ruf { display: inline-flex; align-items: center; justify-content: center; width: var(--gr, 13mm); height: var(--gr, 13mm); border: 0.55mm solid ${F.spruch}; border-radius: 2mm; background: ${F.spruchHell}; }
.e17-tanz .e17-ruf svg { display: block; width: 82%; height: 82%; }
.e17-tanz .e17-label { font-family: var(--kind); font-size: 15pt; color: var(--grau); min-width: 22mm; }
.e17-fragen { display: flex; flex-wrap: wrap; gap: 2.5mm 9mm; margin-top: 3mm; font-family: var(--kind); font-size: 16pt; }
.e17-fragen > span { white-space: nowrap; display: inline-flex; align-items: center; gap: 2mm; }
.e17-tanz-neben { display: flex; align-items: center; justify-content: space-between; gap: 6mm; align-self: stretch; }
.e17-fragen.e17-spalte { flex-direction: column; align-items: flex-end; flex-wrap: nowrap; gap: 2.5mm; margin-top: 0; }
.anleitung .e17-tanz .e17-tk { font-size: 10.5pt; padding: 0 1.4mm; border-width: 0.4mm; }
.anleitung .e17-tanz .e17-wort { font-size: 9.5pt; }
.anleitung .e17-tanz .e17-label { font-size: 10.5pt; min-width: 0; }
.anleitung .e17-tanz .e17-def { border-width: 0.5mm; padding: 0.8mm 1.4mm; }
.anleitung .loesung-mini .e17-tanz .e17-tk { font-size: 15pt; padding: 0 2.4mm; border-width: 0.55mm; }
.anleitung .loesung-mini .e17-tanz .e17-wort { font-size: 14pt; }
.anleitung .loesung-mini .e17-tanz .e17-label { font-size: 15pt; min-width: 22mm; }
.anleitung .loesung-mini .e17-tanz .e17-def { border-width: 0.8mm; padding: 1.5mm 2.5mm 1.5mm 2mm; }
`;
    document.head.appendChild(st);
  }

  function raetsel(el, arten) {
    const id = el.getAttribute('raetsel');
    if (!id) { H().fehler(el, 'raetsel="…" fehlt'); return null; }
    const r = H().DATEN.raetsel[id];
    if (!r) { H().fehler(el, 'Rätsel „' + id + '“ gibt es nicht in raetsel/*.json'); return null; }
    if (!arten.includes(r.art)) { H().fehler(el, 'Rätsel „' + id + '“ ist ' + r.art + ', erwartet: ' + arten.join(' oder ')); return null; }
    if (!r.loesung) { H().fehler(el, 'Rätsel „' + id + '“ hat keine Lösung (Löser-Fehler?)'); return null; }
    return r;
  }
  // Prüfwert l="…" (optional): stimmt die Zahl im Text mit der gerechneten überein?
  function feld(el, n) {
    const h = H();
    if (el.hasAttribute('l') && +el.getAttribute('l') !== n) return h.fehler(el, 'Die Zahl ist ' + n + ', nicht ' + el.getAttribute('l'));
    el.innerHTML = h.feldHTML(String(n), n >= 10 ? '' : 'k');
    el.dataset.loesung = String(n);
    el.classList.add('komp', 'geprueft');
  }

  // ---------------------------------------------------------------------
  // <m-e17-zahl raetsel="e17-l1" was="befehle">
  // ---------------------------------------------------------------------
  B['m-e17-zahl'] = function (el) {
    const r = raetsel(el, ['lesen']);
    if (!r) return;
    const was = el.getAttribute('was') || 'befehle';
    if (was !== 'befehle') return H().fehler(el, 'was="befehle"');
    feld(el, r.loesung.befehle);
  };

  // ---------------------------------------------------------------------
  // <m-e17-karten raetsel="e17-k1" teil="lang|kurz">  /  raetsel="e17-p2" teil="beispiel"
  // ---------------------------------------------------------------------
  B['m-e17-karten'] = function (el) {
    const r = raetsel(el, ['kuerzer', 'pfad']);
    if (!r) return;
    const teil = el.getAttribute('teil');
    let n;
    if (r.art === 'kuerzer') {
      if (teil === 'lang') n = r.loesung.kartenLang;
      else if (teil === 'kurz') n = r.loesung.kartenKurz;
      else return H().fehler(el, 'teil="lang" oder teil="kurz"');
    } else {
      const ew = r.loesung.erweitert;
      if (teil !== 'beispiel' || !ew || ew.beispielKarten === undefined) return H().fehler(el, 'pfad: teil="beispiel" (Rätsel mit "erlaubt")');
      n = ew.beispielKarten;
    }
    feld(el, n);
  };

  // ---------------------------------------------------------------------
  // <m-e17-tanz name="stern" spruch="…" programm="…" fragen="…" [gr="13"]>
  // ---------------------------------------------------------------------
  const liste = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  B['m-e17-tanz'] = function (el) {
    const h = H();
    stil();
    const name = el.getAttribute('name') || 'stern';
    if (!K().SPRUCH_NAMEN.includes(name)) return h.fehler(el, 'name="stern", "mond" oder "krone"');
    const gr = parseFloat(el.getAttribute('gr') || '13');
    const spruch = liste(el.getAttribute('spruch'));
    const prog = liste(el.getAttribute('programm'));
    if (spruch.length < 1 || spruch.length > K().MAX_SPRUCH) return h.fehler(el, 'Ein Zauberspruch hat 1 bis ' + K().MAX_SPRUCH + ' Karten');
    if (spruch.some((t) => t.charAt(0) === '@')) return h.fehler(el, 'Kein Zauberspruch in einem Zauberspruch');
    if (!prog.length) return h.fehler(el, 'programm="…" fehlt');
    for (const t of prog) if (t.charAt(0) === '@' && t !== '@' + name) return h.fehler(el, 'Aufruf „' + t + '“: Hier gibt es nur @' + name);
    // ausrollen: was wirklich getanzt wird
    const getanzt = [];
    prog.forEach((t) => { if (t === '@' + name) getanzt.push(...spruch); else getanzt.push(t); });
    const karten = 1 + spruch.length + prog.length;
    const sym = (n) => S().symbol(n);
    const tk = (w) => '<span class="e17-tk">' + h.esc(w) + '</span>';
    const ruf = '<span class="e17-ruf" aria-label="' + h.esc(K().SPRUCH_WORT[name]) + '">' + sym('spruch-' + name) + '</span>';
    const def = '<span class="e17-def"><span class="e17-kopf">' + sym('spruch-' + name) + '<span class="e17-wort">' + h.esc(K().SPRUCH_WORT[name]) + '</span></span>' +
      spruch.map(tk).join('') + '</span>';
    const tanz = prog.map((t) => (t.charAt(0) === '@' ? ruf : tk(t))).join('');
    const lbl = (t) => (el.hasAttribute('ohne-label') ? '' : '<span class="e17-label">' + t + '</span>');
    const neben = el.getAttribute('layout') === 'neben';
    const zeile1 = '<div class="e17-zeile">' + lbl('Spruch:') + def + '</div>';
    const zeile2 = '<div class="e17-zeile">' + lbl('Tanz:') + tanz + '</div>';
    const fragen = liste(el.getAttribute('fragen'));
    let fragenHTML = '';
    if (fragen.length) {
      fragenHTML = '<div class="e17-fragen' + (neben ? ' e17-spalte' : '') + '">' + fragen.map((f) => {
        let text, n;
        if (f === 'bewegungen') { text = 'Wie viele Bewegungen?'; n = getanzt.length; }
        else if (f === 'karten') { text = 'Wie viele Karten?'; n = karten; }
        else {
          n = getanzt.filter((x) => x === f).length;
          if (!n) h.fehler(el, 'Die Tanz-Karte „' + f + '“ kommt im Tanz nicht vor');
          const du = { hüpfen: 'hüpfst', klatschen: 'klatschst', stampfen: 'stampfst', verbeugen: 'verbeugst' }[f];
          text = du ? 'Wie oft ' + du + ' du?' : 'Wie oft kommt „' + f + '“ dran?';
        }
        return '<span>' + h.esc(text) + ' ' + h.feldHTML(String(n), n >= 10 ? '' : 'k') + '</span>';
      }).join('') + '</div>';
    }
    // layout="neben": Fragen rechts neben der Tanz-Zeile (spart Höhe auf dem Blatt)
    const kopf = '<div class="e17-tanz" style="--gr:' + gr + 'mm">';
    el.innerHTML = neben
      ? kopf + zeile1 + '<div class="e17-tanz-neben">' + zeile2 + fragenHTML + '</div></div>'
      : kopf + zeile1 + zeile2 + '</div>' + fragenHTML;
    el.dataset.bewegungen = String(getanzt.length);
    el.dataset.karten = String(karten);
    el.classList.add('komp', 'geprueft');
  };
})();
