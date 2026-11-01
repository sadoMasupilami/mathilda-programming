/* =====================================================================
   Spiel-Plugin „baum“ (Einheit 13 „Ja-Nein-Bäume“)
   Drei Aufgaben, alles nur Antippen (kein Ziehen):
   - folgen:       Einem Wesen durch den Baum folgen. Die Frage, bei der es gerade ist, leuchtet;
                   Ja oder Nein antippen, der Ast wird dick eingezeichnet. Unten öffnet sich der Platz.
                   Wohnt dort jemand anderes, zeigt die App, wer dort wohnt, und kreist die Frage ein,
                   bei der der Weg abgebogen ist. Dort geht es weiter.
   - einsortieren: Wesen unten (quer: rechts) antippen, dann seinen Platz im Baum. Bei „Los“ schickt
                   die App jedes Wesen der Reihe nach durch den Baum und bleibt beim ersten stehen,
                   das woanders landet („Die Fee landet bei Platz 3!“).
   - frage:        Eine Frage im Baum fehlt. Eine Frage-Taste antippen (sie steht dann im Kästchen),
                   „Los“: Alle laufen durch den Baum; landet eines falsch, sagt die App, bei wem.
   Bewertet wird nur nach dem Ergebnis, mit web/kern/baum.js wie im Löser (WerkstattBaum.folge,
   bewohner, pruefe, mitFrage). Die App bekommt keine Lösungen: Bei folgen und einsortieren sind die
   Plätze im Baum leer (fuerApp), wer wo wohnt, rechnet sie selbst aus der Merkmals-Tabelle aus.
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken. Freundliche Hinweise statt „falsch“.
   Layout: Baum im Feld (oben bzw. links), so groß wie möglich. Passen die langen Fragen nicht gut
   lesbar hinein, nimmt der Baum die kurzen („Flügel?“). Plätze zum Antippen sind mindestens 54 px.
   ===================================================================== */
(function () {
  'use strict';
  const B = window.WerkstattBaum;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  if (!B) return;

  const T = '#1f2340';
  const F = B.FARBE;

  // Wie die Wesen im Satz heißen (wer, bei wem). Drachen-Kinder haben keinen kurzen Namen: „dieser Drache“.
  const WORTE = {
    einhorn: ['das Einhorn', 'beim Einhorn'], fluegelpferd: ['das Flügelpferd', 'beim Flügelpferd'],
    drache: ['der Drache', 'beim Drachen'], fee: ['die Fee', 'bei der Fee'], meerjungfrau: ['die Meerjungfrau', 'bei der Meerjungfrau'],
    eule: ['die Eule', 'bei der Eule'], ente: ['die Ente', 'bei der Ente'], fisch: ['der Fisch', 'beim Fisch'],
    frosch: ['der Frosch', 'beim Frosch'], katze: ['die Katze', 'bei der Katze'], biene: ['die Biene', 'bei der Biene'],
    schnecke: ['die Schnecke', 'bei der Schnecke'], marienkaefer: ['der Marienkäfer', 'beim Marienkäfer'],
  };
  const TIERE = ['eule', 'ente', 'fisch', 'frosch', 'katze', 'biene', 'schnecke', 'marienkaefer'];
  const wer = (d) => (WORTE[d.bild] ? WORTE[d.bild][0] : 'dieser Drache');
  const Wer = (d) => { const w = wer(d); return w.charAt(0).toUpperCase() + w.slice(1); };
  const beiWem = (d) => (WORTE[d.bild] ? WORTE[d.bild][1] : null);
  // „Hat es Flügel?“ wird „Hat das Einhorn Flügel?“
  const frageFuer = (text, d) => (WORTE[d.bild] ? text.replace(/\b(es|er)\b/, wer(d)) : text);
  function gruppenWort(dinge) {
    if (dinge.every((d) => /^drachenkind/.test(d.bild))) return 'Drachen';
    if (dinge.every((d) => TIERE.includes(d.bild))) return 'Tier';
    return 'Wesen';
  }

  // ---------------------------------------------------------------------
  // Bilder
  // ---------------------------------------------------------------------
  const bild = (name) => B.bild(name);
  const innen = (name, x, y, gr) => '<svg x="' + x + '" y="' + y + '" width="' + gr + '" height="' + gr + '" viewBox="0 0 100 100" overflow="visible">' + B.inhalt(name) + '</svg>';
  // Paket-Bild: eine Frage, Ja-Ast (grün, links) und Nein-Ast (orange, rechts), unten Einhorn und Drache
  function paketBild() {
    return '<svg class="baum-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' +
      '<path d="M34 34 C34 48 24 50 24 62" fill="none" stroke="' + F.ja + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M66 34 C66 48 76 50 76 62" fill="none" stroke="' + F.nein + '" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="20" y="6" width="60" height="28" rx="7" fill="' + F.frage + '" stroke="' + T + '" stroke-width="3.5"/>' +
      '<path d="M43 15 C43 9 57 9 57 15 C57 20 50 20 50 25" fill="none" stroke="' + T + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<circle cx="50" cy="30" r="2.6" fill="' + T + '"/>' +
      '<rect x="4" y="60" width="40" height="36" rx="7" fill="#fff" stroke="' + T + '" stroke-width="3.5"/>' +
      '<rect x="56" y="60" width="40" height="36" rx="7" fill="#fff" stroke="' + T + '" stroke-width="3.5"/>' +
      innen('einhorn', 8, 62, 32) + innen('drache', 60, 62, 32) + '</svg>';
  }
  // Meldungs-Bild für „Welche Frage fehlt?“: ein Frage-Kästchen mit Fragezeichen und Ja/Nein
  const FRAGE = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect x="8" y="14" width="84" height="56" rx="10" fill="#fff" stroke="' + T + '" stroke-width="5" stroke-dasharray="11 7"/>' +
    '<path d="M38 32 C38 22 62 22 62 32 C62 41 50 41 50 50" fill="none" stroke="' + F.grau + '" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="50" cy="60" r="4.5" fill="' + F.grau + '"/>' +
    '<rect x="6" y="70" width="34" height="20" rx="10" fill="' + F.ja + '"/><rect x="60" y="70" width="34" height="20" rx="10" fill="' + F.nein + '"/></svg>';
  // Ja: Ast nach links unten (grün), Nein: Ast nach rechts unten (orange) – wie im Baum
  const AST = {
    ja: '<svg class="baum-ast-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M36 10 L13 35 M12 19 L12 36 L29 36" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    nein: '<svg class="baum-ast-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 10 L35 35 M36 19 L36 36 L19 36" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  // ---------------------------------------------------------------------
  // Maße: Der Baum wird so groß wie möglich. Kandidaten von „lange Fragen, viel Platz“ bis „kurze
  // Fragen, eng“. Lange Fragen („Hat es Flügel?“), wenn sie gut lesbar sind, sonst der Kandidat mit
  // der größten Schrift und den größten Plätzen (zum Antippen mindestens 54 px, mit 9 px Luft).
  // Bleibt in der Höhe Platz, werden die Äste länger.
  // ---------------------------------------------------------------------
  const KANDIDATEN = [
    { frageB: 44, frageH: 17, blattB: 26, blattH: 26, luft: 6, ebene: 27, schrift: 5.4, rand: 2 },
    { frageB: 30, frageH: 13, blattB: 24, blattH: 24, luft: 6, ebene: 23, schrift: 6, rand: 2, kurz: true },
    { frageB: 30, frageH: 12, blattB: 19, blattH: 20, luft: 3.5, ebene: 22, schrift: 6, rand: 2, kurz: true },
    { frageB: 29, frageH: 12, blattB: 17, blattH: 18, luft: 2.5, ebene: 21, schrift: 6.2, rand: 2, kurz: true },
    { frageB: 26, frageH: 11, blattB: 17, blattH: 19, luft: 1.6, ebene: 20, schrift: 5.6, rand: 1.5, kurz: true },
  ];
  const ZIEL_SCHRIFT = 14;    // px, Fragen im Baum
  const LANG_SCHRIFT = 15;    // px: so groß müssen die langen Fragen mindestens sein
  const MAX_SCHRIFT = 30;     // px, damit der Baum am Tablet nicht riesig wird
  const MIN_PLATZ = 54;       // px, Platz zum Antippen (mindestens 48)
  const MIN_BILD = 46;        // px, Platz nur zum Anschauen
  const MIN_LUFT = 9;         // px zwischen zwei Plätzen zum Antippen (mindestens 8)

  function kleinsteSchrift(lv, L, o) {
    let min = Infinity;
    for (const k of L.fragen) {
      const t = k.f === '?' ? '?' : B.frageText(lv.fragen, k.f, o.kurz);
      min = Math.min(min, B.umbrechen(t, k.b - 3, o.schrift).gr);
      // in der Lücke muss jede Frage zur Auswahl passen
      if (k.f === '?') for (const f of lv.optionen || []) min = Math.min(min, B.umbrechen(B.frageText(lv.fragen, f, o.kurz), k.b - 3, o.schrift).gr);
    }
    return min;
  }
  function bewerte(z, o, W, H) {
    const tippen = z.aufgabe === 'einsortieren';
    const L = B.layout(z.baum, o);
    const sch = kleinsteSchrift(z.lv, L, o);
    const s = Math.min(W / L.breite, H / L.hoehe, MAX_SCHRIFT / sch);
    const px = sch * s;
    const wert = Math.min(px / ZIEL_SCHRIFT, o.blattB * s / (tippen ? MIN_PLATZ : MIN_BILD), tippen ? o.luft * s / MIN_LUFT : Infinity);
    return { o, L, s, px, wert };
  }
  function masse(z, W, H) {
    const alle = KANDIDATEN.map((o) => bewerte(z, o, W, H));
    const lang = alle.filter((k) => !k.o.kurz && k.wert >= 1 && k.px >= LANG_SCHRIFT);
    let k = lang.length ? lang[0] : alle.reduce((a, b) => (b.wert > a.wert + 0.01 ? b : a));
    const t = B.tiefe(z.baum);
    const frei = H / k.s - k.L.hoehe;
    if (t && frei > 1) {
      const o = Object.assign({}, k.o, { ebene: k.o.ebene + Math.min(frei / t, k.o.ebene * 0.5) });
      k = Object.assign({}, k, { o, L: B.layout(z.baum, o) });
    }
    return k;
  }

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  function neu(api) {
    const lv = api.lv;
    const z = api.zustand;
    for (const k of Object.keys(z)) if (k !== 'beob' && k !== 'masse') delete z[k];
    z.lv = lv;
    z.aufgabe = lv.aufgabe;
    z.baum = lv.baum;
    z.dinge = lv.dinge;
    z.fertig = false;
    z.laeuft = false;
    z.marke = {};       // pfad: 'ok' | 'hier' | 'falsch'
    z.weg = null;       // dick eingezeichneter Weg
    z.aktiv = null;     // leuchtende Frage
    z.kreis = null;     // eingekreiste Frage
    z.zeige = {};       // pfad: ding-id (wer an einem Platz zu sehen ist)
    if (z.aufgabe === 'folgen') {
      z.wer = lv.dinge.find((d) => d.id === lv.wer);
      z.antworten = [];
      z.daneben = null;   // { weg, pfad, wohnt }: falsch gelandet
      z.aktiv = '';
    } else if (z.aufgabe === 'einsortieren') {
      z.belegung = {};    // pfad: ding-id
      z.wahl = lv.dinge[0].id;
    } else {
      z.luecke = B.fragenImBaum(z.baum).find((k) => k.f === '?').pfad;
      z.wahl = null;      // gewählte Frage (id)
      for (const b of B.blaetter(z.baum)) if (b.inhalt) z.zeige[b.pfad] = b.inhalt;
    }
  }
  const dingVon = (z, id) => z.dinge.find((d) => d.id === id);
  const nrVon = (z, pfad) => B.blaetter(z.baum).find((b) => b.pfad === pfad).nr;
  const platzVon = (z, id) => Object.keys(z.belegung).find((p) => z.belegung[p] === id);
  const unplatziert = (z) => z.dinge.filter((d) => platzVon(z, d.id) === undefined);

  // ---------------------------------------------------------------------
  // Zeichnen: Feld (Baum als SVG, darüber die Plätze)
  // ---------------------------------------------------------------------
  function zeichneFeld(api) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld) return;
    const W = feld.clientWidth, H = feld.clientHeight;
    if (W < 10 || H < 10) return;
    const m = masse(z, W - 4, H - 4);
    z.masse = { W, H };
    const s = m.s, L = m.L, o = m.o;
    const opt = Object.assign({}, o, {
      fragen: z.lv.fragen, dinge: z.dinge, leer: true, breite: '100%',
      weg: z.weg || undefined, aktiv: z.aktiv, kreis: z.kreis,
    });
    if (z.aufgabe === 'frage' && z.wahl) opt.luecke = { text: B.frageText(z.lv.fragen, z.wahl, o.kurz) };
    const svg = B.svg(z.baum, opt);
    let plaetze = '';
    const tippen = z.aufgabe === 'einsortieren';
    for (const k of L.blaetter) {
      const st = 'left:' + ((k.x - k.b / 2) * s).toFixed(1) + 'px;top:' + (k.y * s).toFixed(1) + 'px;width:' + (k.b * s).toFixed(1) + 'px;height:' + (k.h * s).toFixed(1) + 'px';
      const id = tippen ? z.belegung[k.pfad] : z.zeige[k.pfad];
      const d = id ? dingVon(z, id) : null;
      const marke = z.marke[k.pfad];
      let cls = 'baum-platz' + (d ? ' baum-voll' : ' baum-frei') + (marke ? ' baum-' + marke : '');
      if (tippen && d && z.wahl === d.id && !z.laeuft) cls += ' baum-gewaehlt';
      if (tippen && !d && z.wahl && !z.fertig && !z.laeuft) cls += ' baum-einladend';
      const inhalt = '<span class="baum-nr" aria-hidden="true">' + k.nr + '</span>' +
        (d ? '<span class="baum-bild">' + bild(d.bild) + '</span>' : '') +
        (marke === 'ok' ? '<span class="baum-haken" aria-hidden="true">' + api.sym('haken') + '</span>' : '');
      const label = 'Platz ' + k.nr + (d ? ': ' + d.name : ', leer');
      if (tippen) {
        plaetze += '<button class="' + cls + '" style="' + st + '" data-aktion="baum-platz" data-pfad="' + k.pfad + '" data-i="' + k.nr + '" data-umschalter aria-label="' + api.esc(label) + '"' +
          (z.fertig ? ' disabled' : '') + '>' + inhalt + '</button>';
      } else {
        plaetze += '<span class="' + cls + '" style="' + st + '" data-pfad="' + k.pfad + '" data-i="' + k.nr + '" role="img" aria-label="' + api.esc(label) + '">' + inhalt + '</span>';
      }
    }
    feld.innerHTML = '<div class="baum-feld baum-' + z.aufgabe + '" data-weg="' + (z.weg ? B.pfadText(z.weg) : '') + '"' +
      (z.aktiv !== null ? ' data-aktiv="' + z.aktiv + '"' : '') + (z.kreis !== null ? ' data-kreis="' + z.kreis + '"' : '') + (o.kurz ? ' data-kurz' : '') + '>' +
      '<div class="baum-flaeche" style="width:' + (L.breite * s).toFixed(1) + 'px;height:' + (L.hoehe * s).toFixed(1) + 'px;--s:' + s.toFixed(3) + '">' +
      svg + '<div class="baum-plaetze">' + plaetze + '</div></div></div>';
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Programm-Bereich (folgen: wer gesucht wird) und Tasten
  // ---------------------------------------------------------------------
  function zeichneProgramm(api) {
    const z = api.zustand;
    const box = api.programm;
    if (!box) return;
    if (z.aufgabe !== 'folgen') { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="baum-wer"><span class="baum-wer-bild">' + bild(z.wer.bild) + '</span>' +
      '<span class="baum-wer-text">Wo landet<b>' + api.esc(wer(z.wer)) + '?</b></span></div>';
  }
  function losReihe(api, losGrau) {
    const z = api.zustand;
    return '<div class="reihe">' +
      api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: alles wie am Anfang' }) +
      api.taste('los', api.ICON.los + '<span>Los</span>', { cls: 'breit los', grau: losGrau, aus: z.laeuft || z.fertig }) +
      '</div>';
  }
  function zeichneTasten(api) {
    const z = api.zustand;
    const box = api.tasten;
    if (!box) return;
    if (z.aufgabe === 'folgen') {
      const aus = z.fertig;
      box.innerHTML = '<div class="reihe baum-janein">' +
        api.taste('baum-antwort', AST.ja + '<span>Ja</span>', { cls: 'breit gross baum-ja', daten: 'data-id="ja" data-umschalter', label: 'Ja', aus }) +
        api.taste('baum-antwort', '<span>Nein</span>' + AST.nein, { cls: 'breit gross baum-nein', daten: 'data-id="nein" data-umschalter', label: 'Nein', aus }) +
        api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: wieder oben anfangen' }) +
        '</div>';
    } else if (z.aufgabe === 'einsortieren') {
      let r = '';
      for (const d of z.dinge) {
        if (platzVon(z, d.id) !== undefined) { r += '<span class="baum-ding baum-leer" aria-hidden="true"></span>'; continue; }
        r += api.taste('baum-ding', '<span class="baum-bild">' + bild(d.bild) + '</span>', {
          cls: 'baum-ding' + (z.wahl === d.id ? ' baum-gewaehlt' : ''), daten: 'data-id="' + d.id + '" data-umschalter',
          label: d.name, aus: z.laeuft || z.fertig,
        });
      }
      box.innerHTML = '<div class="baum-dinge" data-n="' + z.dinge.length + '">' + r + '</div>' + losReihe(api, unplatziert(z).length > 0);
    } else {
      let r = '';
      for (const f of z.lv.optionen) {
        r += api.taste('baum-option', '<span>' + api.esc(B.frageText(z.lv.fragen, f)) + '</span>', {
          cls: 'baum-option' + (z.wahl === f ? ' baum-gewaehlt' : ''), daten: 'data-id="' + f + '" data-umschalter',
          aus: z.laeuft || z.fertig,
        });
      }
      box.innerHTML = '<div class="baum-optionen">' + r + '</div>' + losReihe(api, !z.wahl);
    }
    api.belegung(box);
  }
  function zeichne(api) {
    zeichneProgramm(api);
    zeichneTasten(api);
    zeichneFeld(api);
  }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  const bildIcon = (d) => '<span class="baum-meldung-bild">' + bild(d.bild) + '</span>';
  function grundMeldung(api) {
    const z = api.zustand;
    if (z.aufgabe === 'folgen') return api.meldung('Fang oben an: ' + frageFuer(B.frageText(z.lv.fragen, z.baum.f), z.wer), '', bildIcon(z.wer));
    if (z.aufgabe === 'einsortieren') return wahlMeldung(api);
    const oben = z.luecke === '';
    return api.meldung((oben ? 'Welche Frage kommt ganz oben?' : 'Welche Frage fehlt?') + ' Tippe eine an.', '', FRAGE);
  }
  function wahlMeldung(api) {
    const z = api.zustand;
    if (!z.wahl) {
      if (!unplatziert(z).length) return api.meldung('Alle sitzen? Dann tippe auf „Los“!', 'hinweis', api.ICON.los);
      return api.meldung('Tippe ein ' + gruppenWort(z.dinge) + ' an, dann seinen Platz.', '', bildIcon(unplatziert(z)[0]));
    }
    const d = dingVon(z, z.wahl);
    return api.meldung('Wo wohnt ' + wer(d) + '? Tippe den Platz an.', '', bildIcon(d));
  }

  // ---------------------------------------------------------------------
  // folgen: Ja oder Nein antippen
  // ---------------------------------------------------------------------
  function antwort(api, seite) {
    const z = api.zustand;
    if (z.fertig || z.laeuft) return;
    if (z.daneben) {   // falsch gelandet: weiter bei der eingekreisten Frage
      z.daneben = null;
      z.kreis = null;
      z.marke = {};
      z.zeige = {};
    }
    z.antworten.push(seite);
    const pfad = B.pfadText(z.antworten);
    const k = B.bei(z.baum, pfad);
    z.weg = z.antworten.slice();
    if (!B.istBlatt(k)) {
      z.aktiv = pfad;
      zeichne(api);
      return api.meldung(frageFuer(B.frageText(z.lv.fragen, k.f), z.wer), '', bildIcon(z.wer));
    }
    // unten angekommen: Wer wohnt hier? (aus der Merkmals-Tabelle, nicht gespeichert)
    z.aktiv = null;
    const wohnt = B.bewohner(z.baum, z.dinge)[pfad][0];
    const nr = nrVon(z, pfad);
    z.zeige = {};
    z.zeige[pfad] = wohnt;
    if (wohnt === z.wer.id) {
      z.fertig = true;
      z.marke = {};
      z.marke[pfad] = 'ok';
      zeichne(api);
      const n = z.antworten.length;
      return api.geschafft({ zusatz: Wer(z.wer) + ' wohnt bei Platz ' + nr + '. Der Baum hat ' + n + ' Fragen gestellt.' });
    }
    // Wo ist der Weg abgebogen? Ab dort geht es weiter.
    const soll = B.folge(z.baum, z.wer).weg;
    let j = 0;
    while (j < z.antworten.length && z.antworten[j] === soll[j]) j++;
    z.daneben = { weg: z.antworten.slice(), pfad, wohnt };
    z.marke = {};
    z.marke[pfad] = 'hier';
    z.antworten = z.antworten.slice(0, j);
    z.kreis = B.pfadText(z.antworten);
    z.aktiv = z.kreis;
    zeichne(api);
    const d = dingVon(z, wohnt);
    api.meldung('Hier wohnt ' + wer(d) + '! Schau die Frage im roten Kreis nochmal an.', 'hinweis', bildIcon(d));
  }

  // ---------------------------------------------------------------------
  // einsortieren: Wesen antippen, dann Platz
  // ---------------------------------------------------------------------
  function aenderung(api) {
    const z = api.zustand;
    if (z.fertig || z.laeuft) return false;
    z.marke = {};
    z.weg = null;
    z.aktiv = null;
    return true;
  }
  function dingTippen(api, id) {
    const z = api.zustand;
    if (!aenderung(api)) return;
    z.wahl = z.wahl === id ? null : id;
    zeichne(api);
    wahlMeldung(api);
  }
  function platzTippen(api, pfad) {
    const z = api.zustand;
    if (!aenderung(api)) return;
    const hier = z.belegung[pfad];
    if (z.wahl) {
      if (hier === z.wahl) {   // dasselbe Wesen nochmal: wieder heraus
        delete z.belegung[pfad];
        zeichne(api);
        return wahlMeldung(api);
      }
      const alt = platzVon(z, z.wahl);
      if (alt !== undefined) delete z.belegung[alt];
      z.belegung[pfad] = z.wahl;   // wer hier saß, kommt zurück nach unten
      const rest = unplatziert(z);
      z.wahl = hier && rest.some((d) => d.id === hier) ? hier : rest.length ? rest[0].id : null;
      zeichne(api);
      return wahlMeldung(api);
    }
    if (hier) {   // ohne Auswahl: das Wesen aufnehmen, um es umzusetzen
      z.wahl = hier;
      zeichne(api);
      return wahlMeldung(api);
    }
    api.meldung('Tippe zuerst ein ' + gruppenWort(z.dinge) + ' an.', 'hinweis', bildIcon(unplatziert(z)[0] || z.dinge[0]));
  }
  function einsortierenLos(api) {
    const z = api.zustand;
    if (z.fertig || z.laeuft) return;
    const rest = unplatziert(z);
    if (rest.length) {
      aenderung(api);
      z.wahl = rest[0].id;
      zeichne(api);
      return api.meldung('Es sind noch Plätze leer. Wo wohnt ' + wer(rest[0]) + '?', 'hinweis', bildIcon(rest[0]));
    }
    aenderung(api);
    z.wahl = null;
    // der Reihe nach, wie sie im Baum sitzen (von links nach rechts)
    const reihe = B.blaetter(z.baum).map((b) => dingVon(z, z.belegung[b.pfad]));
    schicke(api, z.baum, reihe, (d) => platzVon(z, d.id), (d, landet) => {
      z.marke[platzVon(z, d.id)] = 'falsch';
      z.wahl = d.id;
      api.meldung(Wer(d) + ' landet bei Platz ' + nrVon(z, landet) + '!', 'hinweis', bildIcon(d));
    }, () => {
      const n = z.dinge.length;
      api.geschafft({ zusatz: 'Alle ' + n + ' landen an ihrem Platz.' });
    });
  }

  // ---------------------------------------------------------------------
  // frage: Frage wählen, Los
  // ---------------------------------------------------------------------
  function optionTippen(api, f) {
    const z = api.zustand;
    if (!aenderung(api)) return;
    z.wahl = z.wahl === f ? null : f;
    zeichne(api);
    if (!z.wahl) return grundMeldung(api);
    api.meldung('Passt die Frage? Tippe auf „Los“!', 'hinweis', FRAGE);
  }
  function frageLos(api) {
    const z = api.zustand;
    if (z.fertig || z.laeuft) return;
    if (!z.wahl) return api.meldung('Tippe zuerst eine Frage an.', 'hinweis', FRAGE);
    aenderung(api);
    const voll = B.mitFrage(z.baum, z.luecke, z.wahl);
    const reihe = B.blaetter(z.baum).map((b) => dingVon(z, b.inhalt));
    const text = B.frageText(z.lv.fragen, z.wahl);
    schicke(api, voll, reihe, (d) => B.blaetter(z.baum).find((b) => b.inhalt === d.id).pfad, (d, landet) => {
      const bei = dingVon(z, z.zeige[landet]);
      const w = beiWem(bei);
      api.meldung('Fast! Mit dieser Frage landet ' + wer(d) + (w && WORTE[d.bild] ? ' ' + w : ' am falschen Platz') + '.', 'hinweis', bildIcon(d));
    }, () => {
      // Endgültig mit dem Kern: Landet jedes Ding genau an seinem Platz?
      if (!B.pruefe(voll, z.dinge).ok) return api.meldung('Fast! Mit dieser Frage landen nicht alle richtig.', 'hinweis', FRAGE);
      api.geschafft({ zusatz: '„' + text + '“ passt: Alle landen an ihrem Platz.' });
    });
  }

  // ---------------------------------------------------------------------
  // Alle der Reihe nach durch den Baum schicken (langsam, Frage für Frage).
  // reihe: Dinge; soll(d): Pfad des Platzes, an dem d sitzt; daneben(d, landet): beim ersten,
  // das woanders landet (dann ist Schluss); fertig(): alle richtig.
  // ---------------------------------------------------------------------
  function schicke(api, baum, reihe, soll, daneben, fertig) {
    const z = api.zustand;
    const takt = Math.max(30, Math.round(api.TEMPO * 0.45));
    z.laeuft = true;
    api.laeuft(true);
    let i = 0, k = 0;
    let weg = null;
    const ende = () => { z.laeuft = false; api.laeuft(false); z.aktiv = null; };
    const tick = () => {
      if (!z.laeuft) return;
      const d = reihe[i];
      if (k === 0) {
        weg = B.folge(baum, d).weg;
        api.meldung(Wer(d) + ' geht durch den Baum …', 'laeuft', bildIcon(d));
      }
      if (k < weg.length) {
        z.weg = weg.slice(0, k);
        z.aktiv = B.pfadText(z.weg);
        k++;
        zeichne(api);
        api.spaeter(tick, takt);
        return;
      }
      // angekommen
      const landet = B.pfadText(weg);
      z.weg = weg.slice();
      z.aktiv = null;
      if (landet !== soll(d)) {
        z.marke[landet] = 'hier';
        ende();
        daneben(d, landet);
        zeichne(api);
        return;
      }
      z.marke[landet] = 'ok';
      i++; k = 0;
      if (i < reihe.length) {
        zeichne(api);
        api.spaeter(tick, takt);
        return;
      }
      z.weg = null;
      ende();
      z.fertig = true;
      zeichne(api);
      fertig();
    };
    zeichne(api);
    api.spaeter(tick, Math.min(250, api.TEMPO));
  }

  // ---------------------------------------------------------------------
  // Plugin
  // ---------------------------------------------------------------------
  function start(api) {
    neu(api);
    const sp = api.feld && api.feld.closest('.spiel');
    if (sp) sp.classList.add('baum-' + api.lv.aufgabe);
    zeichne(api);
    // Neu zeichnen, wenn sich der Platz ändert (Drehen, längere Meldung): Baum-Größe anpassen
    const z = api.zustand;
    if (window.ResizeObserver && api.feld) {
      let geplant = false;
      z.beob = new ResizeObserver(() => {
        if (geplant) return;
        geplant = true;
        requestAnimationFrame(() => {
          geplant = false;
          const m = z.masse;
          if (!api.feld.isConnected) return;
          if (!m || Math.abs(api.feld.clientWidth - m.W) > 1 || Math.abs(api.feld.clientHeight - m.H) > 1) zeichneFeld(api);
        });
      });
      z.beob.observe(api.feld);
    }
  }
  function stopp(api) {
    const z = api.zustand;
    if (z && z.beob) { z.beob.disconnect(); z.beob = null; }
    if (z) z.laeuft = false;
  }

  SPIELE.baum = {
    icon: () => paketBild(),
    start,
    grundMeldung,
    klick(aktion, el, api) {
      if (aktion === 'baum-antwort') return antwort(api, el.dataset.id === 'ja' ? 'ja' : 'nein');
      if (aktion === 'baum-ding') return dingTippen(api, el.dataset.id);
      if (aktion === 'baum-platz') return platzTippen(api, el.dataset.pfad);
      if (aktion === 'baum-option') return optionTippen(api, el.dataset.id);
    },
    los(api) {
      const z = api.zustand;
      if (z.aufgabe === 'einsortieren') return einsortierenLos(api);
      if (z.aufgabe === 'frage') return frageLos(api);
    },
    nochmal(api) {
      neu(api);
      api.laeuft(false);
      zeichne(api);
      grundMeldung(api);
    },
    stopp,
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man ein Paket oder Level direkt (QR-Code am Blatt, Neuladen), fehlte sonst das
  // Paket-Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const DATEN = window.WERKSTATT_DATEN;
    if (!app || !ans || !DATEN || !['start', 'block', 'paket', 'level'].includes(ans)) return;
    if (!DATEN.pakete.some((p) => p.art === 'baum' || p.levels.some((l) => l.art === 'baum'))) return;
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
