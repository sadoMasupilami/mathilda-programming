# Autoren-Leitfaden: eine Einheit schreiben

Eine Einheit besteht aus

- **einer HTML-Datei** `src/einheiten/NN-name.html` (nur Inhalt, kein `<html>`/`<head>`): zuerst die Anleitung für Mama oder Papa, danach 1–3 Blätter für das Kind,
- **ihren Rätseln** in `raetsel/eN.json` (Gitter, Programme, Kobold-Programme, Ablauf-Karten …). Dieselbe Datei liefert die Level der Web-App.

Reihenfolge im Buch: `src/buch.json`. Vorbild mit allen Bausteinen: `src/einheiten/00-muster.html` + `raetsel/e0-muster.json`. Begriffe, Symbole und Gitter-Regeln: `plan/lehrplan.md` **verbindlich** (Kurzfassung unten in Abschnitt 6).

```bash
./baue.sh --nur 03 --png --dpi 110   # nur Einheit 3, Seitenbilder in out/seiten-03/
./baue.sh                            # ganzes Buch + Kopiervorlagen
werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht   # nur die Rätsel lösen und prüfen
```

Der Build bricht mit ❌ ab, wenn ein Rätsel nicht eindeutig (und nicht gekennzeichnet) ist, eine Rechnung falsch ist, ein Blatt überläuft, ein Pflichtteil fehlt, die Schrift auf einem Blatt zu klein ist, ein Zeichen in der Schrift fehlt, ein QR-Code nicht lesbar ist oder der Name des Kindes in einer Quelldatei steht. Warnungen (⚠️) bitte auch beheben.

## 0. Datenschutz: der Name

Der Name des Kindes steht **nirgends** im Repo. In allen Quellen steht `{{KIND}}`, beim Bauen wird der Name aus `kind.json` (nicht eingecheckt) eingesetzt: „{{KIND}}, kannst du den Drachen zum Schatz programmieren?“, „{{KIND}}s Sammelpass“. Der Build prüft alle Dateien, die ins Repo kommen, und bricht ab, wenn der echte Name irgendwo steht (auch in Kommentaren).

## 1. Grundgerüst

```html
<section class="spick nur-buch" data-einheit="2" data-titel="Drachen-Pfade">  … Spickzettel … </section>

<section class="anleitung" data-einheit="2" data-titel="Drachen-Pfade">
  … Anleitung …
  <h2>Lösungen</h2>
  <m-loesungen einheit="2"></m-loesungen>
</section>

<section class="blatt" data-einheit="2" data-titel="Drachen-Pfade">  … </section>
<section class="blatt" data-einheit="2" data-titel="Meine Drachen-Figur" data-art="Bastelvorlage"> … </section>
```

- Kopf der Anleitung (Nummer, Titel, Block, Minuten) entsteht automatisch.
- Blätter werden automatisch nummeriert (Blatt 2-1, 2-2 …), bekommen Kopf mit Titel und „Geschafft?“-Stern und eine Fußzeile. `data-art` (Arbeitsblatt, Spielplan, Karten, Bastelvorlage) steht in der Fußzeile.
- Verweis auf ein Blatt in der Anleitung: `<a class="blattref" href="#blatt-2-2"></a>` → „Blatt 2-2 (S. 17)“.
- Eigene CSS-Regeln in einem `<style>`-Block oben in der Einheit, Klassen mit Präfix `eNN-` (z. B. `.e02-reihe`). `src/styles.css`, `src/components.js`, `src/bausteine/programmieren.js` und `web/kern/*.js` nicht ändern (gemeinsamer Kern). Braucht eine Einheit einen eigenen Baustein, kommt er in eine eigene Datei `src/bausteine/eN-name.js` (Muster: `programmieren.js`, Anmeldung über `window.__bausteine`, Hilfen über `window.__hilfen`).

## 2. Anleitung: Pflichtteile

Fehlt einer davon, bricht der Build ab. Überschriften der Kästen entstehen automatisch.

| Markup | Überschrift |
|---|---|
| `<div class="kasten ziel">` | Darum geht's heute |
| `<div class="kasten material">` | Material & Vorbereitung. **Vorbereitung ohne Kind getrennt und mit Minuten** (Liste „Vorher, ohne {{KIND}} (10 Min)“). Aufwändiges Basteln als Extra außerhalb der Einheit kennzeichnen |
| `<ol class="ablauf"><li data-min="5"><span class="schritt-titel">…</span> …</li></ol>` | Schritte mit Minuten; Summe wird angezeigt, Ziel 20–30 |
| `<div class="sag"><p class="du">„…“</p><p class="sie">„…“</p><p class="dann">…</p></div>` | Beispielsätze (Du / {{KIND}} / Hinweis) |
| `<div class="kasten stolper">` | Stolpersteine |
| `<m-linksrechts></m-linksrechts>` | Hilfen für links und rechts – **Pflicht in jeder Einheit mit Gitter oder Programm-Reihe** (immer derselbe Text) |
| `<div class="kasten leichter">` | Leichter machen |
| `<div class="kasten schwerer">` | Schwerer machen (**ausführlich!** Das Kind ist schnell, das ist ein vollwertiger Hauptteil) |
| `<div class="kasten bonus">` | Bonus-Knobelei für zwischendurch (ohne Papier: Auto, Abendessen) mit Kurz-Lösung |
| `<div class="kasten warum">` | Was hat das mit echtem Programmieren zu tun? (Fachwörter hier erklären) |
| `<div class="kasten bildschirm">` | Bildschirm-Bonus: welche Levels passen, wann das Gerät wieder weggelegt wird (Einheit 1: „heute kein Bildschirm“) |
| `<m-loesungen einheit="N">` | alle Blätter verkleinert mit roten Lösungen |

Lange Tabellen, die umbrechen dürfen: `<table class="tab darf-brechen">`. Kästen auch auf fließenden Rahmenseiten (`<section class="fliess">`) bekommen ihre Überschrift automatisch. Weitere Kästen: `kasten spiel` (mit `data-titel="Roboter-Koch"` → „Spiel: Roboter-Koch“), `kasten bewegung`, `kasten basteln`, `kasten tipp`, `kasten einschaetzung`, `kasten loesung` (Text-Lösungen), `kasten material`. Zwei Kästen nebeneinander: `<div class="zwei">…</div>`. Tabellen: `<table class="tab">`. Ein Begriff aus der Begriffsliste beim ersten Auftreten: `<span class="begriff">Wiederhol-Zauber</span>`.

Spielregeln immer so, dass sie **zu zweit** mit Haushaltsmaterial funktionieren: Material, Vorbereitung, Ziel, Ablauf eines Zuges, Ende/Gewinner, Varianten. Einmal im Kopf durchspielen.

Überschriften `<h2>` in der Anleitung (in dieser Reihenfolge, wenn passend): „Ablauf Schritt für Schritt“, „Spiele, Bewegung und Basteln“, „Wenn es hakt oder zu leicht ist“, „Hintergrund“, „Bildschirm-Bonus“, „Lösungen“.

## 2a. Spickzettel: Kurzfassung auf höchstens zwei Seiten

Zum Mitnehmen beim Durchführen, beidseitig gedruckt ein Blatt. Steht im Buch direkt vor der Anleitung und gesammelt in `out/spickzettel.pdf`. Fließt über höchstens zwei Seiten (wird geprüft), lange Schritte dürfen umbrechen, Regelkästen, Tabellen und Sätze bleiben ganz. Der Kopf entsteht automatisch, die Anleitung verweist mit „Kurzfassung: Spickzettel (S. n)“ zurück.

Aufbau: oben die Vorbereitung, dann der Ablauf als **Drehbuch** (pro Schritt: was zu tun ist, die Spielregeln in Kürze, die Sätze zum Sagen), am Ende Hilfen und Schluss. So muss man beim Durchführen nicht blättern.

```html
<section class="spick nur-buch" data-einheit="2" data-titel="Drachen-Pfade">
  <p class="spick-kern"><b>Darum geht’s:</b> …</p>
  <div class="spick-zwei breit-links">
    <div class="spick-block vorher"><h2>Vorher, ohne {{KIND}} <small>· etwa 25 Min</small></h2><ul class="check"><li>… <span class="min">10 Min</span></li></ul></div>
    <div class="spick-block vorher"><h2>Bereitlegen</h2><ul class="check">…</ul></div>
  </div>
  <h2>Gemeinsam</h2>
  <ol class="spick-ablauf">
    <li data-min="7"><div><b>Spiel „Schatz-Versteck“.</b> Das Hauptspiel, 4 Runden.
      <div class="spick-spiel"><h3>Schatz-Versteck</h3><p class="meta">Material</p>
        <ul><li><b>Rollen:</b> …</li><li><b>Ein Zug:</b> …</li><li><b>Punkte:</b> …</li><li><b>Ende:</b> …</li></ul></div>
      <div class="sag"><p class="du">„…“</p><p class="sie">„…“</p><p class="dann">Hinweis</p></div>
    </div></li>
  </ol>
  <div class="spick-zwei">
    <div class="spick-block stolper"><h2>Wenn es hakt</h2><ul>…</ul></div>
    <div class="spick-block schwerer"><h2>Zu leicht?</h2><ul>…</ul></div>
  </div>
  <div class="spick-block schluss"><h2>Zum Schluss nicht vergessen</h2><ul class="check">…</ul></div>
</section>
```

- `ol.spick-ablauf` braucht **dieselben Schritte mit denselben Minuten** wie `ol.ablauf` der Anleitung (wird geprüft). Ändert sich der Ablauf, den Spickzettel mitziehen.
- Der Schritt-Text sagt nur, was nicht schon im Regelkasten steht. Mehrere Satz-Gruppen in einem Schritt bekommen je eine `<p class="unterzeile">` davor. Tabellen: `<table class="spick-tab">` (z. B. „Kind sagt / Roboter macht“).
- `ul.check` zeichnet Abhak-Kästchen. Keine Verweise auf Rahmenseiten (`#rueckmeldebogen` …), sonst scheitert der Teil-Build; Blätter (`#blatt-N-M`) und die eigene Anleitung gehen.
- Die Einleitung verweist auf jeden Spickzettel (`#spick-N`). Bei einer neuen Einheit dort ergänzen.
- Zu lang? Zuerst doppelte Stellen streichen (Schritt-Text gegen Regelkasten), dann Sätze kürzen.

## 3. Blätter für das Kind

- **Eine A4-Seite pro Blatt**, nichts darf überlaufen (wird geprüft). Lieber weniger Aufgaben, dafür luftig.
- Schrift mindestens 14 pt (geprüft; Standard 16 pt). Kleinerer Hilfstext nur mit `class="klein"`.
- Kurze Hauptsätze, „du“, das Kind namentlich („{{KIND}}, wo ist der Drache nach Befehl 3?“).
- Unten eine `<div class="profi">` (Krone, „Profi-Aufgabe“) oder `<div class="knobel">` (Eule, „Knobel-Ecke“). Eigener Titel: `data-titel="Drachen-Profi"`.
- Aufgaben: `<div class="aufg"><p class="anw">Anweisung</p> … </div>` → automatisch nummeriert. Ohne Nummer: `class="aufg ohne-nr"`.
- Anordnung: `<div class="reihe">` (nebeneinander, umbrechend), `<div class="raster s3">` (Spalten s2–s5), `.mitte`, `.zentriert`. `data-verteilt` am Blatt verteilt die Aufgaben über die Höhe.
- **Jede Aufgabe braucht eine Lösung** in der Anleitung. Bausteine aus Rätseln bringen sie selbst mit (Lösungsansicht). Freie Aufgaben bekommen einen Lösungshinweis `<p class="lsg-nur">Mehrere Lösungen möglich, z. B. …</p>` (nur in der Lösungsansicht sichtbar) oder eine Text-Lösung im `kasten loesung`.
- Auf Blättern mit Bildschirm-Bonus: `<m-qr paket="eN"></m-qr>` (nur für Mama oder Papa, Pflicht, wird zurückgelesen).
- **Keine Fachwörter auf den Blättern** (Anweisung, Algorithmus, Schleife, Bug, Debuggen, Bedingung, Funktion, Unterprogramm, Binär, Computer …): wird geprüft. Dort stehen die Kinderwörter.
- Symbole **nur als Baustein** `<m-symbol>`, nie als Zeichen (kein ← → ↑ ↻ ★ ✓ im Text, auch nicht in der Anleitung): wird geprüft.

## 4. Rätsel-Daten: `raetsel/eN.json`

```json
{
  "paket": "e2",
  "einheit": 2,
  "titel": "Drachen-Pfade",
  "web": { "titel": "Drachen-Pfade", "art": "pfad", "levels": ["e2-w1", "e2-w2", "e2-a1"] },
  "raetsel": [
    { "id": "e2-a1", "art": "pfad", "aufgabe": "kuerzestes",
      "b": 3, "h": 3, "start": { "x": 0, "y": 2, "blick": "oben" }, "ziel": { "x": 2, "y": 0 },
      "hindernisse": [[1, 1]] }
  ]
}
```

Gitter: `x` nach rechts, `y` nach unten, Feld `(0, 0)` ist links oben. `blick`: `oben`, `rechts`, `unten`, `links` (ohne Angabe: oben). Optional `edelsteine: [[x, y], …]` (alle müssen eingesammelt werden), `zielSymbol`: `schatz` (Standard), `ziel` (Zielflagge) oder `stern`.

Programme als Text: `"vor vor rechts 3[vor links]"` (Befehle `vor`, `links` = links drehen, `rechts` = rechts drehen; `3[…]` = Zauber-Kasten „3-mal“, 2 bis 5, nicht verschachtelt).

| art | Felder | Was der Löser prüft (Abbruch, wenn nicht) | Lösung |
|---|---|---|---|
| `pfad` | Gitter, `aufgabe`: `kuerzestes` oder `ankommen`; optional `maxBefehle` (≤ 12), `beispiel`, `mehrereLoesungen`, `zauber: true`, `maxKarten` | Ziel erreichbar (Breitensuche über Feld **und** Blickrichtung). `kuerzestes`: genau **ein** kürzestes Programm, sonst `"mehrereLoesungen": true` setzen und auf dem Blatt „Mehrere Lösungen möglich“ dazuschreiben. Kürzestes ≤ `maxBefehle`. Mit `zauber`: kleinste Kartenzahl mit Wiederhol-Zauber; `maxKarten` muss den Zauber-Kasten erzwingen | kürzeste Länge, Anzahl, alle kürzesten Programme |
| `lesen` | Gitter (Ziel optional), `programm`, optional `fragen: [3]` (Stand nach Befehl 3), `erwartetStoss` | Programm läuft ohne Anstoßen (oder stößt, wenn `erwartetStoss`); mit Ziel muss es ankommen (sonst `"mussAnkommen": false`) | Endfeld + Blickrichtung, Stand nach n Befehlen, Weg |
| `kobold` | Gitter mit Ziel, `programm` (mit genau einem Fehler, ohne Zauber-Kasten), `reparatur`: `{ "art": "tauschen", "stelle": 3, "befehl": "rechts" }` oder `{ "art": "loeschen", "stelle": 4 }` oder `{ "art": "einfuegen", "stelle": 2, "befehl": "vor" }` (danach steht der neue Befehl an Stelle 2) | kaputtes Programm kommt nicht an; mit der gemeinten Reparatur kommt es an | gemeinte Reparatur und **alle anderen** Ein-Schritt-Reparaturen, die auch ankommen (in der Lösung nennen: „Auch richtig: …“) |
| `ablauf` | `karten: [{ "id", "text", "bild" }]` (≤ 8), `regeln: [["a", "b"]]` = a kommt vor b, optional `loesung`, `mehrereLoesungen` | alle gültigen Reihenfolgen gezählt; mehr als eine nur mit `"mehrereLoesungen": true` | alle Reihenfolgen, Paare mit egal-Reihenfolge |
| `kuerzer` | `lang` (ohne Zauber-Kasten), `kurz` (mit Zauber-Kasten), optional Gitter | `kurz` macht genau dasselbe wie `lang` (gleiche ausgerollte Befehle) und braucht weniger Karten | beide Programme, Kartenzahlen |

**Zauber-Kasten:** 2- bis 5-mal, darin **1 bis 3 Befehle** (höchstens 3, wie im Auftrag „eine Gruppe von 2–3 Befehlen“; Papier, Löser und App gleich, `K.MAX_INNEN`), nicht verschachtelt.

**Karten zählen** (Einheit 5): Ein Befehl ist 1 Karte, ein Zauber-Kasten ist 1 Karte plus die Befehle darin. „3-mal: vor“ = 2 Karten, „vor vor vor“ = 3 Karten. **Kürzestes Programm** (ohne Zauber-Kasten): die wenigsten Befehle, Drehungen zählen mit.

Achtung beim Entwerfen: Eine Kehrtwende geht mit „links links“ oder „rechts rechts“, beide gleich lang. Wer ein „finde das kürzeste“-Rätsel will, das eine Kehrtwende braucht, bekommt deshalb immer mehrere kürzeste Programme. Ebenso hat ein freies Rechteck viele gleich lange Wege (oben-dann-rechts gegen rechts-dann-oben). Hindernisse und Startrichtung so setzen, dass genau ein kürzestes Programm übrig bleibt, oder kennzeichnen. Der Löser sagt es genau: `werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht`.

## 5. Bausteine

### Symbole (`web/kern/symbole.js`, einmal als SVG gezeichnet)
```html
<m-symbol name="vor" gr="8"></m-symbol>        <!-- gr in mm -->
<m-symbol name="drache" gr="20" blick="rechts"></m-symbol>
```
Namen: `vor`, `links` (links drehen), `rechts` (rechts drehen), `drache`, `schatz`, `stern`, `sternLeer`, `ziel`, `hindernis`, `edelstein`, `kobold`, `haken`. Farben: vor blau, links drehen grün, rechts drehen orange (wie die rechte Pfote des Drachen). In Fließtext der Anleitung: `gr="4.5"`.

### Gitter
```html
<m-gitter raetsel="e2-a1" feld="22"></m-gitter>                  <!-- Lösung: roter Weg + Drache am Ende -->
<m-gitter raetsel="e4-k1" feld="20" loesung="keine"></m-gitter>  <!-- in der Lösung nichts einzeichnen -->
<m-gitter raetsel="e2-l1" loesung="ende" ohne-ziel></m-gitter>   <!-- Lösung: nur Drache am Endfeld -->
<m-gitter raetsel="e4-l2" loesung="nach:3"></m-gitter>           <!-- Lösung: Weg bis Befehl 3 -->
<m-gitter deko b="4" h="4" start="0,3,oben" feld="20"></m-gitter> <!-- Bild ohne Aufgabe, leeres Gitter -->
```
`feld` in mm, **mindestens 20**. Ein 4 · 4-Gitter mit 22 mm ist knapp 9 cm breit. Das Startfeld ist hellgrün hinterlegt, der Drache zeigt mit der Nase (und einem kleinen Pfeil) die Blickrichtung.

### Programm-Reihe
```html
<m-programm befehle="vor vor rechts 3[vor]"></m-programm>        <!-- fertiges Programm zeigen -->
<m-programm raetsel="e2-a1"></m-programm>                         <!-- pfad: leere Kästchen (max(8, kürzeste)), Lösung = kürzestes -->
<m-programm raetsel="e2-a1" plaetze="6"></m-programm>             <!-- genau 6 leere Kästchen -->
<m-programm raetsel="e4-k1"></m-programm>                         <!-- kobold: kaputtes Programm, Lösung markiert den Fehler -->
<m-programm raetsel="e4-l1"></m-programm>                         <!-- lesen: das Programm -->
<m-programm raetsel="e5-k1" teil="lang"></m-programm>             <!-- kuerzer: langes Programm -->
<m-programm raetsel="e5-k1" teil="kurz"></m-programm>             <!-- kuerzer: leere Form mit Zauber-Kasten, Lösung gefüllt -->
<m-programm raetsel="e5-k1" teil="kurz" zeige></m-programm>       <!-- kuerzer: kurzes Programm gefüllt -->
<m-programm raetsel="e5-p1" teil="zauber"></m-programm>           <!-- pfad mit zauber: leere Form des kürzesten -->
<m-programm leer="6"></m-programm>                                <!-- 6 leere Kästchen ohne Lösung (eigene Programme) -->
```
`gr` = Kästchengröße in mm (Standard 14). Höchstens 12 Kästchen pro Reihe (geprüft). Bei 12 Kästchen nimmt der Baustein ohne `gr` automatisch 13 mm (12 · 14 mm plus Abstände wären breiter als das Blatt). Nummern über den Kästchen; `nummern="nein"` lässt die Nummernzeile ganz weg (für Programme im Fließtext). Bei Kobold-Rätseln markiert die Lösungsansicht die Fehlerstelle; wenn Streichen oder Einfügen an mehreren Stellen dasselbe Programm ergibt (z. B. in „vor vor vor“), werden alle diese Stellen genannt. Der Zauber-Kasten ist lila, links oben steht groß „3-mal“, kein Mal-Punkt.

### QR-Code, Hilfen links/rechts
```html
<m-qr paket="e2"></m-qr>          <!-- 32 mm, Fehlerkorrektur M, Ruhezone 4 Module; Adresse …/#e2 -->
<m-linksrechts></m-linksrechts>   <!-- in jeder Gitter-Einheit in der Anleitung -->
```

### Bausteine einzelner Einheiten (`src/bausteine/eN-*.js`)

Jede Einheit darf eigene Bausteine in einer eigenen Datei anmelden. Die bisherigen (Beschreibung jeweils oben in der Datei):

| Datei | Bausteine | wofür |
|---|---|---|
| `e1-blick.js` | `<m-e1-wahl raetsel nach>`, `<m-e1-befehlwahl raetsel>` | vier Drachen zum Ankreuzen (Wohin schaut er?), drei Befehle zum Ankreuzen |
| `e2-drache.js` | `<m-e2-ausmal gr>` | großer Drache zum Anmalen (rechte Pfote orange) |
| `e3-ablauf.js` | `<m-ablaufbild>`, `<m-ablaufkarte>`, `<m-ablauf>`, `<m-ablaufpaar>`, `<m-ablaufanzahl>`, `<m-ablaufzuerst>` | Ablauf-Karten mit Bildern aus `web/kern/bilder.js` (auch in der Web-App), Nummern eintragen, falsche Reihenfolge, „egal?“ |
| `e4-kobold.js` | `<m-e4-blick raetsel nach>`, `<m-e4-befehl raetsel>`, `<m-e4-art raetsel>` | Einkreisen: Blickrichtung nach Befehl n, richtiger Befehl, Art des Fehlers |
| `e5-muster.js` | `<m-e5-muster art="malen|finden">`, `<m-e5-karten>` | Muster-Bilder auf 1-cm-Kästchen mit Wiederhol-Zauber, Karten zählen |

Ablauf-Karten (`art: "ablauf"`) dürfen ohne `bild` sein (leere Karte zum Selbermalen); optional `titel` und `gemischt` (Startreihenfolge in der Web-App). Jedes `bild` muss es in `web/kern/bilder.js` geben (geprüft).

### Verweise auf Blätter anderer Einheiten

`<a class="blattref" href="#blatt-1-1"></a>` geht auch über Einheiten hinweg. Im Teil-Build (`--nur 02`) steht dann nur „Blatt 1-1“, im Gesamtbuild mit Seitenzahl. Einen fehlenden Verweis meldet nur der Gesamtbuild als Fehler.

### Aus der Rechen-Werkstatt übernommen
`<m-feld l="5">` (Antwortkästchen, Lösung 5; `art="text"` für Wörter), `<m-aufgabe>3 + 4 = _</m-aufgabe>`, `<m-kaestchen b="18" h="3">` (echte 1-cm-Kästchen), `<m-karten spalten="4" zeilen="3" hoehe="55" breite="176">…</m-karten>` (Karten zum Ausschneiden, Schnittlinien), `<m-bild name="…">` (Strichzeichnungen: stern, zauberstab, krone, mond, edelstein, trank, zauberhut, schloss, drache, einhorn, fee, schere, gluehbirne, eule, wuerfel, rakete, karten, ei, kreide, haken, ziel, achtung, feder, huepfen, lupe, medaille, tablet, roboter), `<m-stern gr="14">`, `<m-wuerfel n="5">`, `<m-punkte>`. Rechnungen im Fließtext (`3 + 4 = 7`) werden geprüft.

## 6. Begriffe, Symbole, Gitter-Regeln (Kurzfassung, verbindlich)

| Kinderwort (Blätter, Beispielsätze, Web-App) | Fachwort (nur Anleitung, Kasten „Was hat das …“) |
|---|---|
| Befehl | Anweisung |
| Programm | Programm, Algorithmus, Sequenz |
| Wiederhol-Zauber, Zauber-Kasten („3-mal“) | Schleife |
| Fehler-Kobold, Kobold-Jagd | Bug, Debuggen |
| Wenn-dann-Regel | Bedingung (if) |
| Geheimcode | Verschlüsselung, Codierung |
| Ja/Nein-Zahlen | Binärzahlen (Bits) |
| Zauberspruch | Funktion, Unterprogramm |
| Roboter | Computer, Ausführender |
| Ablauf-Karten | Sequenz |
| Karten (beim Zählen von Programmen) | Programmlänge |

- **„Zauber“ nur** in Wiederhol-Zauber, Zauber-Kasten und Zauberspruch (geprüft). Kein „verzaubern“, „Zauberei“, „Zauberstab“ im Text.
- Befehle heißen immer **vor**, **links drehen**, **rechts drehen** (nie „geradeaus“, „gehe“, „dreh dich“). Kein seitlich oder rückwärts Gehen.
- Die Figur steht immer **in einem Feld**. Am Papier mindestens 20 mm, am Boden 40–50 cm (Malerkrepp oder Kreide). In der Wohnung ohne Gitter ist „vor“ **ein großer Schritt** bzw. eine Fliese.
- Jedes Gitter zeigt **Startfeld und Blickrichtung**. Ohne andere Angabe schaut der Drache nach oben. Stufen: zuerst Start nach oben, dann nach links oder rechts, nach unten erst im Schwerer-Teil.
- Programme als **nummerierte Reihe**, höchstens 12 Befehle. Beim Ausführen tippt das Kind mit dem Finger oder einem Muggelstein mit.
- Stößt der Drache an den Rand oder an einen Stein, bleibt er stehen: „Hier hat der Kobold zugeschlagen!“ Das Programm ist dann zu Ende.
- **Geschafft** heißt: Am Ende des Programms steht der Drache auf dem Schatz (und hat alle Edelsteine eingesammelt). Nur vorbeigehen zählt nicht.
- Österreichisch: Volksschule, Hausübung, Jänner, Sackerl, Zuckerl, Gummiringerl, Kasten, Stiege, Gang, Jause, Semmel, Tixo, Malerkrepp. Rechenzeichen: plus, minus, mal (·), durch (:). Kein × oder ÷.

### Pakete der Web-App

| Paket | Einheit | Adresse | Inhalt |
|---|---|---|---|
| e2 | 2 Drachen-Pfade | `…/#e2` | Drachen-Pfade programmieren (erst 3–5 Befehle, dann mit Steinen) |
| e3 | 3 Erst das, dann das | `…/#e3` | Bilder-Abläufe sortieren (antippen, kein Ziehen) |
| e4 | 4 Der Fehler-Kobold | `…/#e4` | Kaputte Programme reparieren |
| e5 | 5 Der Wiederhol-Zauber | `…/#e5` | Drachen-Pfade mit Zauber-Kasten und Kartengrenze |

Kein Schlüsselwort: Alle Pakete sind offen, der QR-Code führt direkt zum Paket. Jedes Paket hat 5–9 Levels (10–15 Minuten). Steine sollen nicht nur am Rand liegen, sondern auch mitten im Weg (direkt vor der Nase, Mauer mit Lücke, Slalom).

**Sterne in der App:** 1 Stern pro geschafftem Level. Bei `pfad`-Levels mit `"aufgabe": "kuerzestes"` (ohne Zauber) gibt es den Stern nur mit einem kürzesten Programm, sonst zeigt die App „Fast geschafft! Es geht kürzer“. Bei `maxKarten` zählt die Grenze. Texte im Kasten „bildschirm“ müssen diese Regel richtig wiedergeben. Danach kommt ein klares Ende: „Super! Jetzt zurück zum Papier.“

## 7. Qualität vor dem Abgeben

1. `./baue.sh --nur NN --png --dpi 110` ohne ❌ und ohne ⚠️.
2. **Jede Seite als Bild ansehen** (`out/seiten-NN/`): nichts abgeschnitten, nichts überlappt, Felder groß genug, Blatt luftig, Lösungsansicht lesbar und vollständig.
3. Jede Zahl im Text, in Spielregeln, Beispielsätzen und Lösungen nachrechnen (auch „nach 3 Befehlen steht er …“ in Worten: das prüft der Build nicht, also mit dem Ausführer nachrechnen).
4. Spiele einmal gedanklich zu zweit durchspielen: Geht es auf? Gibt es ein Ende? Reicht das Material?
5. Österreichisches Deutsch und Begriffe aus der Begriffsliste.
