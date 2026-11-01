/* =====================================================================
   Spiel-Plugin „kaestchen“ (Einheit 8 „Bilder aus Kästchen“)
   Drei Aufgaben, alles nur Antippen:
   - malen:     Kästchen-Maler. Der Code steht neben dem Gitter, das Kind tippt die Kästchen an
                (noch einmal antippen macht es wieder weiß). Mehrere Farben: zuerst die Farbe antippen.
                „Fertig“ prüft das Bild; Zeilen, die noch nicht stimmen, werden freundlich markiert.
   - schreiben: Code bauen. Das Bild ist fertig, das Kind tippt für jede Zeile Teile wie [3 weiß]
                (eine Taste pro Zahl und Farbe). Ist eine Zeile voll, geht es mit der nächsten weiter.
                Mehr, als in die Zeile passt, geht nicht (Kobold-Probe). „Fertig“ prüft den Code.
   - kobold:    Kobold-Zeile reparieren. Die App malt das Bild aus dem Code mit der Kobold-Zeile.
                Zeile antippen (im Bild oder im Code), Zahl antippen, mit − und + ändern; das Bild
                malt sich sofort neu. Ist das Bild heil, ist das Level geschafft.
   Bewertet wird nur nach dem Ergebnis, mit web/kern/kaestchen.js wie im Löser: malBild/bewerteMalen,
   bewerteCode, ausrollen. Die Daten enthalten keine Lösung (malen: nur der Code; schreiben: nur das
   Bild; kobold: der Code mit Kobold-Zeile und das Bild, wie es aussehen soll).
   Ruhig: kein Ton, keine Zeitgrenze, kein Blinken. Freundliche Hinweise statt „falsch“.
   Layout (web/spiele/kaestchen.css): Gitter oben bzw. links, Code und Tasten unten bzw. rechts.
   Die Kästchen sind keine Tasten (sie liegen dicht wie auf dem Kästchenpapier), aber mindestens 36 px.
   ===================================================================== */
(function () {
  'use strict';
  const KK = window.WerkstattKaestchen;
  const SPIELE = (window.WerkstattSpiele = window.WerkstattSpiele || {});
  if (!KK) return;

  const T = '#1f2340';
  // Bilder für Meldungen und Tasten
  const STIFT = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect x="8" y="50" width="40" height="40" fill="#fff" stroke="' + T + '" stroke-width="5"/>' +
    '<rect x="8" y="50" width="20" height="20" fill="' + T + '"/><rect x="28" y="70" width="20" height="20" fill="' + T + '"/>' +
    '<path d="M50 70 L84 16 L95 23 L61 77 L48 84 Z" fill="#f5c518" stroke="' + T + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M77 27 L88 34" stroke="' + T + '" stroke-width="4"/></svg>';
  const CODE = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect x="5" y="22" width="42" height="56" rx="9" fill="#fff" stroke="#9aa0b8" stroke-width="4"/>' +
    '<text x="19" y="62" font-size="34" font-weight="700" text-anchor="middle" fill="' + T + '" font-family="Andika, sans-serif">3</text>' +
    '<rect x="29" y="38" width="13" height="13" fill="#fff" stroke="' + T + '" stroke-width="3.5"/>' +
    '<rect x="53" y="22" width="42" height="56" rx="9" fill="#fff" stroke="#9aa0b8" stroke-width="4"/>' +
    '<text x="67" y="62" font-size="34" font-weight="700" text-anchor="middle" fill="' + T + '" font-family="Andika, sans-serif">2</text>' +
    '<rect x="77" y="38" width="13" height="13" fill="' + T + '" stroke="' + T + '" stroke-width="3.5"/></svg>';
  const HAKEN = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 25 L20 35 L38 13" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const MINUS = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 24 H36" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 24 H36 M24 12 V36" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>';

  function paketBild() {
    const herz = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'].map((z) => z.replace(/#/g, 'r'));
    return KK.bildSVG(herz, { zeigen: true })
      .replace('<svg ', '<svg class="kaestchen-icon" ')
      .replace(' role="img" aria-label="Kästchenbild"', ' aria-hidden="true"');
  }

  // ---------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------
  const farbName = (f) => KK.FARBEN[f].name;
  const FARBWORT = { s: 'Schwarz', r: 'Rot', g: 'Grün', b: 'Blau', e: 'Gelb', o: 'Orange', n: 'Braun' };
  const quadrat = (f) => '<span class="kaestchen-q">' + KK.farbSVG(f) + '</span>';
  const kopie = (x) => JSON.parse(JSON.stringify(x));
  function und(liste) {
    if (liste.length < 2) return liste.join('');
    return liste.slice(0, -1).join(', ') + ' und ' + liste[liste.length - 1];
  }
  function zeilenWort(nrs) {
    return nrs.length === 1 ? 'Zeile ' + nrs[0] : 'die Zeilen ' + und(nrs);
  }
  // Ein Teil im Code (nur Anzeige): Zahl und Farb-Kästchen wie am Blatt
  function teilHTML(t, nurZahl) {
    return '<span class="kaestchen-t"><b>' + t.n + '</b>' + (nurZahl ? '' : quadrat(t.f)) + '</span>';
  }
  function zeileHTML(zeile, nurZahl) {
    return zeile.teile.map((t) => {
      if (!t.wdh) return teilHTML(t, nurZahl);
      return '<span class="kaestchen-kz"><b class="kaestchen-mal">' + t.wdh + '-mal</b>' + t.teile.map((u) => teilHTML(u)).join('') + '</span>';
    }).join('');
  }
  const summe = (teile) => teile.reduce((s, t) => s + t.n, 0);
  function holen(o, weg) { return weg.reduce((x, k) => x[k], o); }
  function setzen(o, weg, v) { holen(o, weg.slice(0, -1))[weg[weg.length - 1]] = v; }

  // ---------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------
  function neu(api) {
    const lv = api.lv;
    const z = api.zustand;
    for (const k of Object.keys(z)) delete z[k];
    z.lv = lv;
    z.aufgabe = lv.aufgabe;
    z.stifte = (lv.farben || []).filter((f) => f !== 'w');
    if (!z.stifte.length) z.stifte = ['s'];
    z.markiert = [];
    z.fertig = false;
    if (z.aufgabe === 'malen') {
      z.opt = { format: lv.format || '', richtung: lv.richtung || 'zeilen' };
      z.spalten = z.opt.richtung === 'spalten';
      // Was der Code malt, rechnet die App selbst aus (wie der Löser)
      z.soll = KK.malBild(lv.code, z.opt);
      z.h = z.soll.length;
      z.b = z.soll[0].length;
      z.bild = z.soll.map((r) => r.map(() => 'w'));
      // Zuerst die Farbe mit den meisten Kästchen (bei Gleichstand die erste)
      const zahl = (f) => z.soll.reduce((n, r) => n + r.filter((x) => x === f).length, 0);
      z.stift = z.stifte.reduce((best, f) => (zahl(f) > zahl(best) ? f : best), z.stifte[0]);
      z.linie = null;      // Zeile (oder Spalte), in der zuletzt gemalt wurde
    } else if (z.aufgabe === 'schreiben') {
      z.soll = KK.liesBild(lv.bild);
      z.h = z.soll.length;
      z.b = z.soll[0].length;
      z.reihen = z.soll.map(() => []);
      z.linie = 0;
    } else {
      z.soll = KK.liesBild(lv.bild);
      z.h = z.soll.length;
      z.b = z.soll[0].length;
      z.orig = kopie(KK.liesCode(lv.code));
      z.code = kopie(z.orig);
      z.eintrag = null;    // ausgewählter Eintrag des Codes (Zeile oder Zeilen-Kasten)
      z.zahl = null;       // ausgewählte Zahl darin (Nummer in zahlenVon)
      // die Kobold-Zeile (nur für den Satz im Geschafft-Fenster), aus Bild und Code gerechnet
      z.koboldZeilen = KK.unterschiede(z.soll, KK.ausrollen(z.orig)).map((i) => i + 1);
    }
  }

  // Code als Liste von Einträgen mit den Zeilen, die sie malen
  function eintraege(z) {
    if (z.aufgabe === 'schreiben') return z.reihen.map((r, i) => ({ zeile: { teile: r }, von: i, bis: i }));
    if (z.aufgabe === 'malen' && z.opt.format === 'zahlen') {
      return z.lv.code.map((t, i) => ({ zahlen: String(t).trim().split(/\s+/), von: i, bis: i }));
    }
    const code = z.aufgabe === 'malen' ? KK.liesCode(z.lv.code) : z.code;
    let nr = 0;
    return code.map((e) => {
      const n = KK.istKasten(e) ? e.wdh * e.zeilen.length : 1;
      const x = KK.istKasten(e) ? { kasten: e, von: nr, bis: nr + n - 1 } : { zeile: e, von: nr, bis: nr };
      nr += n;
      return x;
    });
  }
  function eintragVonLinie(z, linie) {
    const ee = eintraege(z);
    const i = ee.findIndex((e) => linie >= e.von && linie <= e.bis);
    return i < 0 ? null : i;
  }
  // Was im Gitter zu sehen ist: Zeilen mit Farben (bei kobold dürfen Zeilen zu kurz oder zu lang sein)
  function istBild(z) {
    if (z.aufgabe === 'malen') return z.bild;
    if (z.aufgabe === 'schreiben') return z.soll;
    return KK.ausrollen(z.code);
  }

  // Kobold: die Zahlen eines Eintrags, die man ändern kann (der Zauber-Kasten für Zeilen behält seine Zahl)
  function zahlenVon(z, e) {
    const aus = [];
    const zeile = (zl, vor) => zl.teile.forEach((t, j) => {
      if (t.wdh) {
        aus.push({ weg: vor.concat(['teile', j, 'wdh']), min: KK.WDH_MIN, max: KK.WDH_MAX, mal: true });
        t.teile.forEach((u, k) => aus.push({ weg: vor.concat(['teile', j, 'teile', k, 'n']), min: 1, max: z.b, f: u.f }));
      } else aus.push({ weg: vor.concat(['teile', j, 'n']), min: 1, max: z.b, f: t.f });
    });
    if (KK.istKasten(e)) e.zeilen.forEach((zl, i) => zeile(zl, ['zeilen', i]));
    else zeile(e, []);
    return aus;
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Gitter
  // ---------------------------------------------------------------------
  function zeichneFeld(api) {
    const z = api.zustand;
    const feld = api.feld;
    if (!feld) return;
    const ist = istBild(z);
    const malen = z.aufgabe === 'malen' && !z.fertig;
    let zellen = '';
    for (let r = 0; r < z.h; r++) {
      const reihe = ist[r] || [];
      for (let c = 0; c < z.b; c++) {
        const f = reihe[c];
        const cls = f === undefined ? ' kaestchen-leer' : f !== 'w' ? ' kaestchen-voll' : '';
        const wort = f === undefined ? 'leer' : farbName(f);
        zellen += '<span class="kaestchen-k' + cls + '" data-aktion="kaestchen-feld" data-i="' + r + '-' + c + '" data-r="' + r + '" data-c="' + c + '"' +
          (malen ? ' data-umschalter' : '') + ' role="button" aria-label="Zeile ' + (r + 1) + ', Kästchen ' + (c + 1) + ': ' + wort + '"' +
          (f && f !== 'w' ? ' style="background:' + KK.FARBEN[f].hex + '"' : '') + '></span>';
      }
      // Kobold-Probe: Die Zeile ist zu lang (mehr Kästchen, als das Bild breit ist)
      if (reihe.length > z.b) zellen += '<span class="kaestchen-ueber" style="--r:' + r + '">+' + (reihe.length - z.b) + '</span>';
    }
    // Rahmen: die Zeile (Spalte), um die es gerade geht, und Zeilen mit einem Hinweis
    // (eine Zeile mit Hinweis bekommt nur den orangen Rahmen)
    const linien = aktuelleLinien(z).filter((l) => !z.markiert.includes(l));
    for (const l of linien) zellen += '<span class="kaestchen-rahmen' + (z.spalten ? ' kaestchen-spalte' : '') + '" style="--r:' + l + '" aria-hidden="true"></span>';
    for (const l of z.markiert) zellen += '<span class="kaestchen-schau' + (z.spalten ? ' kaestchen-spalte' : '') + '" style="--r:' + l + '" aria-hidden="true"></span>';
    let nrs = '';
    // Zauber-Kasten für Zeilen: eine lila Klammer neben den Zeilennummern
    let klammer = false;
    if (!z.spalten && z.aufgabe !== 'schreiben' && !(z.aufgabe === 'malen' && z.opt.format === 'zahlen')) {
      for (const e of eintraege(z)) {
        if (!e.kasten) continue;
        klammer = true;
        nrs += '<span class="kaestchen-klammer" style="--von:' + e.von + ';--n:' + (e.bis - e.von + 1) + '"></span>';
      }
    }
    const n = z.spalten ? z.b : z.h;
    for (let i = 0; i < n; i++) {
      nrs += '<span class="kaestchen-nr' + (linien.includes(i) ? ' kaestchen-jetzt' : '') + (z.markiert.includes(i) ? ' kaestchen-markiert' : '') + '"><i>' + (i + 1) + '</i></span>';
    }
    const kl = 'kaestchen-brett kaestchen-' + z.aufgabe + (z.spalten ? ' kaestchen-spalten' : '') + (klammer ? ' kaestchen-mit-klammer' : '') + (z.fertig ? ' kaestchen-geschafft' : '');
    feld.innerHTML = '<div class="' + kl + '" style="--b:' + z.b + ';--h:' + z.h + '">' +
      '<div class="kaestchen-nrs" aria-hidden="true">' + nrs + '</div>' +
      '<div class="kaestchen-gitter" aria-label="Kästchenbild">' + zellen + '</div></div>';
  }
  // Welche Zeilen haben einen goldenen Rahmen? malen: wo zuletzt gemalt wurde, schreiben: die Zeile,
  // die gerade dran ist, kobold: alle Zeilen des ausgewählten Eintrags
  function aktuelleLinien(z) {
    if (z.fertig) return [];
    if (z.aufgabe === 'kobold') {
      if (z.eintrag === null) return [];
      const e = eintraege(z)[z.eintrag];
      const aus = [];
      for (let i = e.von; i <= e.bis; i++) aus.push(i);
      return aus;
    }
    return z.linie === null ? [] : [z.linie];
  }

  // Kobold: die Zahlen eines Eintrags als Tasten (Zahl und Farbe, beim Zauber-Kasten „3-mal“)
  function koboldTasten(api, e) {
    const z = api.zustand;
    let k = 0;
    const zahlTaste = (inhalt, label, cls) => {
      const i = k++;
      return api.taste('kaestchen-zahl', inhalt, {
        cls: 'befehl kaestchen-zt' + (cls || '') + (z.zahl === i ? ' kaestchen-an' : ''),
        daten: 'data-k="' + i + '" aria-pressed="' + (z.zahl === i) + '"', label,
      });
    };
    const zeileTasten = (zl) => zl.teile.map((t) => {
      if (!t.wdh) return zahlTaste('<span class="kaestchen-tz">' + t.n + '</span>' + quadrat(t.f), t.n + ' ' + farbName(t.f));
      return '<span class="kaestchen-kz-tasten">' +
        zahlTaste('<span class="kaestchen-tz">' + t.wdh + '</span><span class="kaestchen-malklein">-mal</span>', t.wdh + '-mal', ' kaestchen-mt') +
        t.teile.map((u) => zahlTaste('<span class="kaestchen-tz">' + u.n + '</span>' + quadrat(u.f), u.n + ' ' + farbName(u.f))).join('') + '</span>';
    }).join('');
    if (!KK.istKasten(e)) return zeileTasten(e);
    return '<span class="kaestchen-kz-tasten kaestchen-kz-zeilen"><span class="kaestchen-malfest">' + e.wdh + '-mal</span>' +
      e.zeilen.map((zl) => zeileTasten(zl)).join('') + '</span>';
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Code (Programm)
  // ---------------------------------------------------------------------
  function zeichneCode(api) {
    const z = api.zustand;
    const box = api.programm;
    if (!box) return;
    const ee = eintraege(z);
    const jetzt = z.fertig ? null : z.aufgabe === 'kobold' ? z.eintrag : z.linie === null ? null : eintragVonLinie(z, z.linie);
    let html = '';
    ee.forEach((e, i) => {
      const nr = e.von === e.bis ? String(e.von + 1) : (e.von + 1) + '–' + (e.bis + 1);
      let markiert = false;
      for (let l = e.von; l <= e.bis; l++) if (z.markiert.includes(l)) markiert = true;
      let inhalt;
      if (e.zahlen) inhalt = e.zahlen.map((x) => '<span class="kaestchen-t kaestchen-nurzahl"><b>' + x + '</b></span>').join('');
      else if (e.kasten) {
        inhalt = '<span class="kaestchen-kz kaestchen-kz-zeilen"><b class="kaestchen-mal">' + e.kasten.wdh + '-mal</b>' +
          e.kasten.zeilen.map((zl, j) => (j ? '<span class="kaestchen-strich">/</span>' : '') + zeileHTML(zl)).join('') + '</span>';
      } else {
        inhalt = zeileHTML(e.zeile);
        if (z.aufgabe === 'schreiben' && !z.fertig && summe(e.zeile.teile) < z.b) {
          inhalt += '<span class="kaestchen-t kaestchen-platz' + (i === jetzt ? ' kaestchen-dran' : '') + '"></span>';
        }
      }
      // Kobold: Die ausgewählte Zeile öffnet sich, ihre Zahlen werden zu Tasten
      const offen = z.aufgabe === 'kobold' && i === jetzt;
      if (offen) inhalt = koboldTasten(api, z.code[i]);
      html += '<div class="kaestchen-cz' + (i === jetzt ? ' kaestchen-jetzt' : '') + (offen ? ' kaestchen-offen' : '') + (markiert ? ' kaestchen-markiert' : '') +
        (e.kasten ? ' kaestchen-czk' : '') + '" data-aktion="kaestchen-zeile" data-e="' + i + '" data-i="' + i + '" data-linie="' + e.von + '">' +
        '<span class="kaestchen-cnr">' + nr + '</span><span class="kaestchen-teile">' + inhalt + '</span></div>';
    });
    const titel = z.spalten ? '<div class="kaestchen-code-titel">Spalte für Spalte, von oben nach unten</div>' : '';
    box.innerHTML = '<div class="kaestchen-code" data-n="' + ee.length + '" aria-label="Kästchen-Code">' + titel + html + '</div>';
  }

  // ---------------------------------------------------------------------
  // Zeichnen: Tasten
  // ---------------------------------------------------------------------
  function nochmalTaste(api) {
    return api.taste('nochmal', '<span>Nochmal</span>', { cls: 'breit', label: 'Nochmal: alles wie am Anfang' });
  }
  function fertigTaste(api, grau) {
    return api.taste('los', HAKEN + '<span>Fertig</span>', { cls: 'breit los kaestchen-fertig', grau, label: 'Fertig: Bild prüfen' });
  }
  function zeichneTasten(api) {
    const z = api.zustand;
    const box = api.tasten;
    if (!box) return;
    let html = '';
    if (z.aufgabe === 'malen') {
      let stifte = '';
      if (z.stifte.length > 1) {
        for (const f of z.stifte) {
          stifte += api.taste('kaestchen-stift', KK.farbSVG(f), {
            cls: 'befehl kaestchen-stift' + (z.stift === f ? ' kaestchen-an' : ''), daten: 'data-f="' + f + '" aria-pressed="' + (z.stift === f) + '"',
            label: 'Farbe ' + farbName(f), aus: z.fertig,
          });
        }
      }
      html = '<div class="reihe kaestchen-reihe">' + stifte + nochmalTaste(api) + fertigTaste(api, false) + '</div>';
    } else if (z.aufgabe === 'schreiben') {
      const frei = z.linie === null ? 0 : z.b - summe(z.reihen[z.linie]);
      const farben = ['w'].concat(z.stifte);
      for (const f of farben) {
        let r = '';
        for (let n = 1; n <= z.b; n++) {
          r += api.taste('kaestchen-teil', '<span class="kaestchen-tz">' + n + '</span>' + quadrat(f), {
            cls: 'befehl kaestchen-tt', daten: 'data-n="' + n + '" data-f="' + f + '"', label: n + ' ' + farbName(f),
            aus: z.fertig, grau: n > frei,
          });
        }
        html += '<div class="reihe kaestchen-reihe kaestchen-teile-reihe">' + r + '</div>';
      }
      const leer = z.reihen.every((r) => !r.length);
      const voll = z.reihen.every((r) => summe(r) === z.b);
      html += '<div class="reihe kaestchen-reihe">' +
        api.taste('kaestchen-weg', api.ICON.weg, { cls: 'befehl', label: 'Letzten Teil löschen', aus: z.fertig, grau: leer }) +
        nochmalTaste(api) + fertigTaste(api, !voll) + '</div>';
    } else {
      // Kobold: − und + ändern die Zahl, die in der offenen Code-Zeile ausgewählt ist
      const zahl = aktuelleZahl(z);
      html = '<div class="reihe kaestchen-reihe">' +
        api.taste('kaestchen-minus', MINUS, { cls: 'befehl kaestchen-pm', label: 'kleiner', aus: z.fertig, grau: !zahl || zahl.wert <= zahl.min }) +
        api.taste('kaestchen-plus', PLUS, { cls: 'befehl kaestchen-pm', label: 'größer', aus: z.fertig, grau: !zahl || zahl.wert >= zahl.max }) +
        nochmalTaste(api) + '</div>';
    }
    box.innerHTML = html;
    api.belegung(box);
  }
  function aktuelleZahl(z) {
    if (z.aufgabe !== 'kobold' || z.eintrag === null || z.zahl === null) return null;
    const x = zahlenVon(z, z.code[z.eintrag])[z.zahl];
    if (!x) return null;
    return Object.assign({ wert: holen(z.code[z.eintrag], x.weg) }, x);
  }

  function zeichne(api) {
    zeichneFeld(api);
    zeichneCode(api);
    zeichneTasten(api);
  }

  // ---------------------------------------------------------------------
  // Meldungen
  // ---------------------------------------------------------------------
  function grundMeldung(api) {
    const z = api.zustand;
    if (z.aufgabe === 'malen') {
      if (z.stifte.length > 1) {
        return api.meldung('Mal nach dem Code! Tippe zuerst eine Farbe an, dann die Kästchen.', '', STIFT);
      }
      return api.meldung('Mal nach dem Code! Tippe die Kästchen an.', '', STIFT);
    }
    if (z.aufgabe === 'schreiben') return api.meldung('Schreib den Code zum Bild! Tippe die Teile für Zeile ' + (z.linie + 1) + '.', '', CODE);
    return api.meldung('Der Kobold hat eine Zeile verändert! Findest du sie? Tippe sie an.', '', api.sym('kobold'));
  }

  // ---------------------------------------------------------------------
  // Malen
  // ---------------------------------------------------------------------
  function malenFeld(api, r, c) {
    const z = api.zustand;
    if (z.fertig) return;
    const alt = z.bild[r][c];
    z.bild[r][c] = alt === z.stift ? 'w' : z.stift;
    z.linie = z.spalten ? c : r;
    z.markiert = z.markiert.filter((l) => l !== z.linie);
    zeichneFeld(api);
    zeichneCode(api);
  }
  function malenStift(api, f) {
    const z = api.zustand;
    if (z.fertig || !z.stifte.includes(f)) return;
    z.stift = f;
    zeichneTasten(api);
    api.meldung('Jetzt malst du ' + FARBWORT[f] + '. Tippe die Kästchen an.', 'hinweis', KK.farbSVG(f));
  }
  function malenFertig(api) {
    const z = api.zustand;
    if (z.fertig) return;
    const e = KK.bewerteMalen(z.lv.code, z.bild, z.opt);
    if (e.geschafft) {
      z.fertig = true;
      z.markiert = [];
      zeichne(api);
      const name = z.lv.name ? 'Es ist ' + (z.lv.artikel || 'ein') + ' ' + z.lv.name + '!' : '';
      return api.geschafft({ zusatz: name });
    }
    if (z.bild.every((r) => r.every((f) => f === 'w'))) {
      return api.meldung('Noch ist alles weiß. Tippe die Kästchen an, die der Code anmalt.', 'hinweis', STIFT);
    }
    // Zeilen (bzw. Spalten), die noch nicht stimmen
    let falsch = e.falsch;
    if (z.spalten) {
      falsch = [];
      for (let c = 0; c < z.b; c++) if (z.soll.some((r, i) => r[c] !== z.bild[i][c])) falsch.push(c);
    }
    z.markiert = falsch;
    z.linie = null;
    zeichne(api);
    const nrs = falsch.map((i) => i + 1);
    const was = z.spalten ? (nrs.length === 1 ? 'Spalte ' + nrs[0] : 'die Spalten ' + und(nrs)) : zeilenWort(nrs);
    if (nrs.length === 1) api.meldung('Fast! In ' + was.replace(/^d/, 'D') + ' stimmt es noch nicht. Zähl nochmal nach!', 'hinweis', STIFT);
    else api.meldung('Fast! Schau dir ' + was + ' nochmal an. Zähl genau nach!', 'hinweis', STIFT);
  }

  // ---------------------------------------------------------------------
  // Code schreiben
  // ---------------------------------------------------------------------
  function naechsteOffene(z, ab) {
    for (let k = 1; k <= z.h; k++) {
      const i = (ab + k) % z.h;
      if (summe(z.reihen[i]) < z.b) return i;
    }
    return null;
  }
  function schreibenLinie(api, l) {
    const z = api.zustand;
    if (z.fertig) return;
    z.linie = l;
    zeichne(api);
    const frei = z.b - summe(z.reihen[l]);
    if (frei === z.b) api.meldung('Zeile ' + (l + 1) + ': Was siehst du von links nach rechts?', 'hinweis', CODE);
    else if (frei) api.meldung('Zeile ' + (l + 1) + ': noch ' + frei + ' Kästchen bis zum Rand.', 'hinweis', CODE);
    else api.meldung('Zeile ' + (l + 1) + ' ist voll. Mit der Taste unten löschst du den letzten Teil.', 'hinweis', CODE);
  }
  function schreibenTeil(api, n, f) {
    const z = api.zustand;
    if (z.fertig) return;
    if (z.linie === null) z.linie = naechsteOffene(z, z.h - 1) || 0;
    const reihe = z.reihen[z.linie];
    const frei = z.b - summe(reihe);
    if (n > frei) {
      if (!frei) return api.meldung('Zeile ' + (z.linie + 1) + ' ist schon voll. Tippe eine andere Zeile an.', 'hinweis', CODE);
      return api.meldung('So viele passen nicht: In Zeile ' + (z.linie + 1) + ' ' + (frei === 1 ? 'ist nur noch 1 Kästchen' : 'sind nur noch ' + frei + ' Kästchen') + ' frei.', 'hinweis', CODE);
    }
    reihe.push({ n, f });
    z.markiert = z.markiert.filter((l) => l !== z.linie);
    const voll = summe(reihe) === z.b;
    const alt = z.linie;
    if (voll) {
      const nx = naechsteOffene(z, z.linie);
      if (nx !== null) z.linie = nx;
    }
    zeichne(api);
    if (!voll) return api.meldung('Zeile ' + (alt + 1) + ': noch ' + (frei - n) + ' Kästchen bis zum Rand.', 'hinweis', CODE);
    if (z.linie !== alt) return api.meldung('Zeile ' + (alt + 1) + ' ist voll. Weiter mit Zeile ' + (z.linie + 1) + '!', 'hinweis', CODE);
    api.meldung('Alle Zeilen sind voll. Tippe auf „Fertig“!', 'hinweis', CODE);
  }
  function schreibenWeg(api) {
    const z = api.zustand;
    if (z.fertig) return;
    if (z.reihen.every((r) => !r.length)) return api.meldung('Da ist noch nichts zum Löschen.', 'hinweis', CODE);
    if (z.linie === null || !z.reihen[z.linie].length) {
      // wie beim Schreiben: zurück zur letzten Zeile mit Teilen
      let l = z.linie === null ? z.h - 1 : z.linie;
      for (let k = 0; k < z.h && !z.reihen[l].length; k++) l = (l - 1 + z.h) % z.h;
      z.linie = l;
    }
    z.reihen[z.linie].pop();
    z.markiert = z.markiert.filter((l) => l !== z.linie);
    zeichne(api);
    api.meldung('Zeile ' + (z.linie + 1) + ': Teil gelöscht.', 'hinweis', CODE);
  }
  function schreibenFertig(api) {
    const z = api.zustand;
    if (z.fertig) return;
    const offen = z.reihen.findIndex((r) => summe(r) < z.b);
    if (offen >= 0) {
      z.linie = offen;
      zeichne(api);
      const fehlt = z.b - summe(z.reihen[offen]);
      return api.meldung('Zeile ' + (offen + 1) + ' ist noch nicht voll: Es ' + (fehlt === 1 ? 'fehlt noch 1 Kästchen.' : 'fehlen noch ' + fehlt + ' Kästchen.'), 'hinweis', CODE);
    }
    const code = z.reihen.map((r) => ({ teile: r }));
    const e = KK.bewerteCode(z.soll, code);
    if (e.geschafft) {
      z.fertig = true;
      z.markiert = [];
      zeichne(api);
      const n = KK.zahlen(code);
      const kurz = KK.zahlenOhneKasten(z.soll);
      let zusatz = 'Dein Code hat ' + n + ' Zahlen.';
      if (n > kurz) zusatz += ' Profi-Frage: Geht es auch mit ' + kurz + ' Zahlen?';
      return api.geschafft({ zusatz });
    }
    z.markiert = e.falsch;
    z.linie = e.falsch[0];
    zeichne(api);
    const nrs = e.falsch.map((i) => i + 1);
    if (nrs.length === 1) api.meldung('Fast! Zeile ' + nrs[0] + ' malt noch etwas anderes als das Bild. Lösch die Teile und zähl nochmal!', 'hinweis', CODE);
    else api.meldung('Fast! ' + zeilenWort(nrs).replace(/^d/, 'D') + ' malen noch etwas anderes als das Bild. Zähl nochmal!', 'hinweis', CODE);
  }

  // ---------------------------------------------------------------------
  // Kobold-Zeile reparieren
  // ---------------------------------------------------------------------
  function koboldWaehle(api, i) {
    const z = api.zustand;
    if (z.fertig || i === null) return;
    const neu = z.eintrag !== i;
    if (neu) {
      z.eintrag = i;
      const zz = zahlenVon(z, z.code[i]);
      z.zahl = zz.length === 1 ? 0 : null;
    }
    zeichne(api);
    // Die Code-Zeile hat sich geöffnet (Tasten an neuer Stelle): kurz keine Tipps, damit ein Doppeltipp
    // nicht gleich eine Zahl trifft
    if (neu) api.sperren();
    const ee = eintraege(z)[i];
    const wo = ee.von === ee.bis ? 'Zeile ' + (ee.von + 1) : 'Zeilen ' + (ee.von + 1) + ' bis ' + (ee.bis + 1);
    if (z.zahl === null) api.meldung(wo + ': Welche Zahl soll anders sein? Tippe sie an.', 'hinweis', api.sym('kobold'));
    else api.meldung(wo + ': Mit Minus und Plus änderst du die Zahl.', 'hinweis', api.sym('kobold'));
  }
  function koboldZahl(api, k) {
    const z = api.zustand;
    if (z.fertig || z.eintrag === null) return;
    z.zahl = k;
    zeichneCode(api);
    zeichneTasten(api);
    const x = aktuelleZahl(z);
    if (x) api.meldung((x.mal ? x.wert + '-mal' : x.wert + ' ' + farbName(x.f)) + ': Mit Minus und Plus änderst du die Zahl.', 'hinweis', api.sym('kobold'));
  }
  function koboldAendern(api, d) {
    const z = api.zustand;
    if (z.fertig) return;
    const x = aktuelleZahl(z);
    if (!x) {
      if (z.eintrag === null) return api.meldung('Tippe zuerst die Zeile an, die der Kobold verändert hat.', 'hinweis', api.sym('kobold'));
      return api.meldung('Tippe zuerst die Zahl an, die du ändern willst.', 'hinweis', api.sym('kobold'));
    }
    const neu = x.wert + d;
    if (neu < x.min) return api.meldung(x.mal ? 'Weniger als ' + x.min + '-mal geht nicht.' : 'Kleiner als ' + x.min + ' geht nicht.', 'hinweis', api.sym('kobold'));
    if (neu > x.max) {
      return api.meldung(x.mal ? 'Mehr als ' + x.max + '-mal geht nicht.' : 'Größer als ' + x.max + ' geht nicht: Das Bild ist nur ' + z.b + ' Kästchen breit.', 'hinweis', api.sym('kobold'));
    }
    setzen(z.code[z.eintrag], x.weg, neu);
    z.markiert = [];
    const bild = KK.ausrollen(z.code);
    if (KK.bewerteCode(z.soll, z.code).geschafft) {
      z.fertig = true;
      zeichne(api);
      api.meldung('Das Bild ist wieder heil!', 'gut', api.sym('kobold'));
      const nrs = z.koboldZeilen;
      const zusatz = 'Kobold erwischt! ' + (nrs.length === 1 ? 'Zeile ' + nrs[0] + ' ist wieder richtig.' : 'Das Bild ist wieder heil.');
      // kurz das heile Bild zeigen, dann das Geschafft-Fenster
      api.spaeter(() => api.geschafft({ zusatz }), 700);
      return;
    }
    zeichne(api);
    // Kobold-Probe: Ist die Zeile so breit wie das Bild?
    const ee = eintraege(z)[z.eintrag];
    const lang = bild[ee.von].length;
    const wo = 'Zeile ' + (ee.von + 1);
    if (lang > z.b) api.meldung('Zu lang: ' + wo + ' malt jetzt ' + lang + ' Kästchen, das Bild ist nur ' + z.b + ' breit.', 'hinweis', api.sym('kobold'));
    else if (lang < z.b) api.meldung('Zu kurz: ' + wo + ' malt nur ' + lang + ' Kästchen, das Bild ist ' + z.b + ' breit.', 'hinweis', api.sym('kobold'));
    else api.meldung(wo + ' ist ' + z.b + ' Kästchen breit. Schau aufs Bild: Ist es heil?', 'hinweis', api.sym('kobold'));
  }

  // ---------------------------------------------------------------------
  // Plugin
  // ---------------------------------------------------------------------
  function start(api) {
    neu(api);
    const sp = api.feld && api.feld.closest('.spiel');
    if (sp) {
      sp.dataset.kAufgabe = api.lv.aufgabe;
      // Beim Malen und beim Kobold steht die Meldung quer rechts über dem Code (links braucht das Gitter
      // die ganze Höhe). Beim Code bauen brauchen rechts die Teil-Tasten den Platz.
      const m = sp.querySelector('.meldung');
      const rechts = sp.querySelector('.spalte-rechts');
      if (api.lv.aufgabe !== 'schreiben' && m && rechts && m.parentNode !== rechts) rechts.insertBefore(m, rechts.firstChild);
    }
    zeichne(api);
  }

  SPIELE.kaestchen = {
    icon: () => paketBild(),
    start,
    grundMeldung,
    klick(aktion, el, api) {
      const z = api.zustand;
      if (aktion === 'kaestchen-feld') {
        const r = parseInt(el.dataset.r, 10), c = parseInt(el.dataset.c, 10);
        if (z.aufgabe === 'malen') return malenFeld(api, r, c);
        if (z.aufgabe === 'schreiben') return schreibenLinie(api, r);
        return koboldWaehle(api, eintragVonLinie(z, r));
      }
      if (aktion === 'kaestchen-zeile') {
        const e = parseInt(el.dataset.e, 10);
        if (z.aufgabe === 'malen') {
          if (z.fertig || z.spalten) return;
          z.linie = parseInt(el.dataset.linie, 10);
          zeichneFeld(api);
          return zeichneCode(api);
        }
        if (z.aufgabe === 'schreiben') return schreibenLinie(api, e);
        return koboldWaehle(api, e);
      }
      if (aktion === 'kaestchen-stift') return malenStift(api, el.dataset.f);
      if (aktion === 'kaestchen-teil') return schreibenTeil(api, parseInt(el.dataset.n, 10), el.dataset.f);
      if (aktion === 'kaestchen-weg') return schreibenWeg(api);
      if (aktion === 'kaestchen-zahl') return koboldZahl(api, parseInt(el.dataset.k, 10));
      if (aktion === 'kaestchen-minus') return koboldAendern(api, -1);
      if (aktion === 'kaestchen-plus') return koboldAendern(api, 1);
    },
    los(api) {
      const z = api.zustand;
      if (z.aufgabe === 'malen') return malenFertig(api);
      if (z.aufgabe === 'schreiben') return schreibenFertig(api);
    },
    nochmal(api) {
      neu(api);
      api.laeuft(false);
      zeichne(api);
      grundMeldung(api);
    },
  };

  // app.js zeichnet die erste Ansicht, bevor die Spiel-Plugins geladen sind (sie stehen in index.html
  // nach app.js). Öffnet man ein Paket oder Level direkt (QR-Code am Blatt, Neuladen), fehlte sonst das
  // Paket-Bild oder das Spiel. Dann einmal neu zeichnen lassen, wie mit einem Tipp auf eine Taste.
  (function neuZeichnen() {
    const app = document.getElementById('app');
    const ans = document.body && document.body.dataset.ansicht;
    const DATEN = window.WERKSTATT_DATEN;
    if (!app || !ans || !DATEN || !['start', 'block', 'paket', 'level'].includes(ans)) return;
    if (!DATEN.pakete.some((p) => p.art === 'kaestchen' || p.levels.some((l) => l.art === 'kaestchen'))) return;
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
