# {{KIND}}s Denk- und Programmier-Werkstatt: Lehrplan

Langfristiger Plan für 20 Einheiten plus Extras. Er ist ein **Vorschlag** und wird nach der Rückmeldung zu den Einheiten 1–5 angepasst (Tempo, Schwierigkeit, Länge, Stil, Bildschirm-Anteil). Abschnitt 7 (Begriffsliste, Symbole, Gitter-Regeln, Pakete der Web-App) ist **verbindlich** für alle Einheiten, die Rahmenseiten und die Web-App.

- **Für wen:** {{KIND}}, 6 Jahre, 1. Klasse Volksschule (Österreich). Sie liest kurze Sätze selbst, zählt bis 100, rechnet mit kleinen Zahlen und ist schnell. Ziel ist **Fordern**, nicht Aufholen. Links und rechts sind noch unklar und werden in Einheit 1 eingeschätzt.
- **Wie:** zu zweit ({{KIND}} und Mama oder Papa), 20–30 Minuten gemeinsame Zeit, 2- bis 3-mal pro Woche. Vorbereitung ohne {{KIND}} steht getrennt mit Minuten. Fast alles am Papier, mit Bewegung und Basteln.
- **Bildschirm:** höchstens 5–10 Minuten pro Einheit, am Schluss, als Bonus. Jede Einheit funktioniert komplett ohne Bildschirm. Einheit 1 hat absichtlich keinen.
- **Wie es sich anfühlen soll:** Spaß, Neugier, Bewegung, Basteln. Fantasie-Flair in einzelnen Aufgaben (ein Drache sucht den Schatz, ein Fehler-Kobold versteckt Fehler, eine Fee schreibt Geheimbriefe), aber **keine durchgehende Geschichte**.
- **Belohnung:** Sammelpass (ein Feld pro Einheit, Stempel oder Sticker, 1–3 Sterne „Wie hat's dir gefallen?“), Urkunden nach Einheit 10 („Drachen-Programmiererin“) und nach Einheit 20 („Code-Meisterin“). Sterne in der Web-App zählen nur als Extra, der Sammelpass am Papier zählt.

Status: **Einheiten 1–5 ausformuliert** (`src/einheiten/01-…` bis `05-…`, Rätsel in `raetsel/e1.json` bis `raetsel/e5.json`, Web-Pakete e2–e5). Ab Einheit 6 erst nach der Rückmeldung.

---

## 1. Leitideen

1. **Unplugged zuerst.** Jedes Konzept wird zuerst mit dem Körper oder mit Material erlebt (Mama oder Papa ist der Roboter, {{KIND}} ist der Drache am Boden-Gitter), dann am Papier, erst dann (optional) am Bildschirm.
2. **Genau sein ist das Spiel.** Ein Roboter macht genau, was dasteht, auch Unsinn. Daraus entstehen die lustigsten Momente und die wichtigste Einsicht: Ein Programm muss genau sein.
3. **Fehler sind normal und gut.** Der Fehler-Kobold ist kein Schimpfwort, sondern ein Rätsel. Wer einen Fehler findet, hat gewonnen. Nie „falsch“, lieber „Wo hat der Kobold zugeschlagen?“.
4. **Jede Einheit hat einen starken „Schwerer“-Teil.** {{KIND}} ist schnell. Profi-Aufgaben und der Kasten „Schwerer machen“ greifen bewusst vor (größere Gitter, Blick nach unten, Gruppen im Zauber-Kasten, eigene Rätsel erfinden) und sind trotzdem mit den Werkzeugen der Einheit lösbar.
5. **Sprechen lassen.** {{KIND}} erklärt ihr Programm laut („Befehl 3 ist rechts drehen, weil …“). Gelobt wird der Plan, nicht nur das Ergebnis.
6. **Ein Wort für eine Sache.** Alle Einheiten, die Rahmenseiten und die Web-App verwenden die Wörter, Symbole und Regeln aus Abschnitt 7. Fachwörter nur in der Anleitung.
7. **Bildschirm ist Bonus.** Kurz, am Schluss, ruhig, mit klarem Ende („Super! Jetzt zurück zum Papier.“). Das Papier bleibt die Hauptsache.
8. **Nicht doppelt mit der Rechen-Werkstatt.** Themen, die dort schon vorkommen (Gedankenlese-Karten, Zahl raten, magische Quadrate, Nim), kommen hier aus Programmier-Sicht und verweisen auf das andere Heft (Abschnitt 3.3).

---

## 2. Aufbau einer Einheit

Der Ablauf ist **flexibel** und richtet sich nach dem Thema. Jede Einheit hat aber dieselben Bausteine (Details und Markup: `vorlagen/AUTOREN-LEITFADEN.md`).

**Anleitung (für Mama oder Papa):**

| Teil | Inhalt |
|---|---|
| Darum geht's heute | Ziel in 2–4 Sätzen, neue Begriffe hervorgehoben |
| Material & Vorbereitung | was bereitliegt; **„Vorher, ohne {{KIND}} (… Min)“** getrennt und mit Minuten; aufwändiges Basteln als Extra außerhalb der Einheit |
| Ablauf Schritt für Schritt | 3–6 Schritte mit Minuten, zusammen 20–30 |
| Beispielsätze | „Du sagst …“, „{{KIND}} sagt vielleicht …“ und wie du reagierst |
| Spiele, Bewegung und Basteln | Regeln, die zu zweit wirklich spielbar sind (Material, Vorbereitung, Ziel, ein Zug, Ende, Varianten) |
| Stolpersteine | typische Fehler und wie man reagiert; in jeder Gitter-Einheit dieselben **Hilfen für links und rechts** (`<m-linksrechts>`) |
| Leichter machen / Schwerer machen | „Schwerer“ ist wichtiger und ausführlicher, ein vollwertiger Hauptteil |
| Bonus-Knobelei | ohne Papier (Auto, Abendessen), mit Kurz-Lösung |
| Was hat das mit echtem Programmieren zu tun? | kurzer Hintergrund, hier werden die Fachwörter erklärt |
| Bildschirm-Bonus | Paket, welche Levels, wann das Gerät wieder weggelegt wird (Einheit 1: „heute kein Bildschirm“) |
| Lösungen | alle Blätter verkleinert mit roten Lösungen, dazu Lösungen der Knobeleien |

**{{KIND}}s Blätter:** 1–3 pro Einheit (Arbeitsblatt, Spielplan, Karten, Bastelvorlage). Jedes Blatt passt auf genau eine A4-Seite, ist luftig, hat oben den Stern „Geschafft?“ (automatisch), große Schrift (mindestens 14 pt, meist 16–22 pt), Gitterfelder mindestens 20 mm und unten eine Profi-Aufgabe (Krone) oder Knobel-Ecke (Eule). {{KIND}} wird mit „du“ und mit Namen angesprochen. Auf einem Blatt jeder Einheit mit Bildschirm-Bonus steht der QR-Code zum Paket (`<m-qr paket="eN">`, nur für Mama oder Papa).

---

## 3. Übersicht

| Block | Einheiten | Thema | Farbe |
|---|---|---|---|
| A | 1–5 | Befehle, Programme, Fehler | Blau |
| B | 6–10 | Muster und Geheimcodes | Türkis |
| C | 11–14 | Wenn-dann und Logik | Orange |
| D | 15–20 | Strategie und Projekte | Pink |
| Extras | X1–X10 | Ideen-Parkplatz, einzeln einschiebbar | – |

Die Blockgrenzen sind im Code fest (`src/components.js`, `blockVon`: 1–5 A, 6–10 B, 11–14 C, ab 15 D) und müssen zu Sammelpass, Titelseite und diesem Plan passen.

### 3.1 Rote Fäden

- **Befehle:** vor, links drehen, rechts drehen (E1) → Programme lesen und schreiben (E2) → Reihenfolge (E3) → Fehler finden (E4) → Wiederhol-Zauber (E5) → Wenn-dann-Regel (E11) → Zauberspruch (E17) → alles zusammen (E19).
- **Der Drache und sein Gitter:** Boden-Gitter aus Malerkrepp (ab E2), Drachen-Figur zum Ausschneiden mit oranger rechter Pfote (ab E2), Papiergitter mit Feldern ab 20 mm, dieselben Gitter in der Web-App.
- **Material, das wieder vorkommt:** Befehlskarten aus Blatt 1-1 (8 Karten vor, 4 Karten links drehen, 4 Karten rechts drehen; in E2, E4, E5 und später), Drachen-Figur (ab E2), Boden-Gitter (E2, E4, E5, E16, E19), Ablauf-Karten (E3), Zauber-Kasten zum Basteln (ab E5, wieder in E17), Muggelsteine zum Mittippen und als Spielsteine (alle).
- **Fehler finden:** Der Fehler-Kobold kommt nach E4 in jeder Einheit einmal vor (ein Muster mit Fehler, ein falsch verschlüsselter Brief, eine falsche Wenn-dann-Regel).
- **Kürzer ist schlauer:** kürzestes Programm (E2) → mit Zauber-Kasten kürzer schreiben (E5) → mit Zauberspruch noch kürzer (E17); Karten zählen ab E5.

### 3.2 Bildschirm-Bonus (Web-App)

Ein Level-Paket pro Einheit ab E2 (E1, E18 ohne), 5–9 Levels, 10–15 Minuten, ohne Schlüsselwort (alle Pakete sind offen). Mindestens 2 Levels sind genau Rätsel von den Blättern. Die Levels stehen in derselben Datei `raetsel/eN.json` wie die Rätsel der Blätter (`"web": { "titel", "art", "levels": […] }`). Bewertet wird nach dem Ergebnis mit demselben Ausführer (`web/kern/ausfuehrer.js`), nie durch Vergleich mit einer gespeicherten Lösung. Am Paket-Ende: „Super! Jetzt zurück zum Papier.“

### 3.3 Querverweise zur Rechen-Werkstatt

Die Rechen-Werkstatt (anderes Heft, gleiches Format) läuft parallel. Was dort schon vorkommt, wird hier **aus Programmier-Sicht** gebracht und mit einem Satz verwiesen, statt es zu wiederholen. Belegt sind nur die Bezüge aus dem Auftrag (Abschnitt 1): **R8** Zahl raten (größer/kleiner), **R17** magische Quadrate mit Summen und Muster fortsetzen, **R19** Gedankenlese-Karten 1–31, **Nim** im Ideen-Parkplatz. Andere Rechen-Einheiten werden ohne Nummer und Titel genannt, bis sie gegen das echte Heft geprüft sind.

| Hier | Rechen-Werkstatt | So hängt es zusammen |
|---|---|---|
| E2 Drachen-Pfade (Befehle zählen, kürzestes Programm) | kein eigenes Thema dort | Befehle zählen ist Zählen und Vergleichen mit kleinen Zahlen; nichts doppelt |
| E5 Der Wiederhol-Zauber („3-mal: vor“) | Mal als wiederholtes Plus, falls es dort schon vorkam (Einheit noch nicht geprüft) | „3-mal: 2 Felder vor“ ist 3 · 2. Kommt das Mal-Rechnen dort später, ist das ein schöner Wiedererkennungsmoment. Hier wird **nicht** gerechnet, sondern wiederholt |
| E6 Muster-Detektivin | R17 Magische Quadrate und Muster fortsetzen | Dort Zahlenmuster, hier Farb-, Form- und Bewegungsmuster als Programm („Wiederhol-Zauber für Muster“) |
| E8 Bilder aus Kästchen | 1-cm-Kästchen der Antwortfelder | Dasselbe Kästchenpapier; hier wird ein Bild zu einem Code, dort eine Ziffer pro Kästchen |
| E9 Nur Ja oder Nein (Ja/Nein-Karten 1, 2, 4, 8, 16) | R19 Gedankenlese-Karten 1–31 | Hier wird erklärt, **warum** der Gedankenlese-Trick funktioniert: Jede Zahl bis 31 hat genau eine Ja/Nein-Schreibweise. Die Karten der Rechen-Werkstatt werden nicht neu gedruckt, sondern wieder verwendet |
| E10 Sortieren und Suchen (Halbier-Suche) | R8 Zahl raten (größer/kleiner) | Hier wird das Raten zur Strategie: immer in der Mitte fragen, „Wie viele Fragen brauche ich höchstens?“ |
| E14 Formen-Quadrate | R17 Magische Quadrate (Summen) | Hier keine Summen: jede Form einmal pro Reihe und Spalte (Logik statt Rechnen) |
| E15 Gewinnen mit Plan (Nim, „Wer sagt 20?“) | Nim (dort im Ideen-Parkplatz) | Wurde Nim dort schon gespielt: hier die Gewinn-Strategie als Regel aufschreiben (Wenn-dann) und gegen den Computer testen |

**Wörter-Hinweis:** Kommt „Zauber“ in der Rechen-Werkstatt in Spielnamen vor, gilt das nur dort. Hier ist das Wort reserviert (Abschnitt 7.3). Erwähnt {{KIND}} die Rechen-Wörter, ist das kein Problem: Es ist das andere Heft.

---

## 4. Block A: Befehle, Programme, Fehler (Einheiten 1–5) – ausformuliert

### Einheit 1: Ich bin dein Roboter ✅ ausformuliert (`src/einheiten/01-ich-bin-dein-roboter.html`)

- **Ziel:** Befehle müssen genau sein. Die drei Befehle **vor** (ein großer Schritt), **links drehen**, **rechts drehen** kennenlernen. {{KIND}} programmiert Mama oder Papa durch die Wohnung (zum Kühlschrank, zum Kuscheltier). Nebenbei einschätzen: Sind links und rechts sicher? Kann sie aus Sicht des Roboters denken?
- **Neue Begriffe:** Befehl, Programm, Roboter, vor, links drehen, rechts drehen, Befehlskarten, Blickrichtung.
- **Einschätzen:** Kasten „Nebenbei einschätzen“ (links und rechts am eigenen Körper, am Roboter von hinten, am Roboter von vorne). Das Ergebnis kommt in den Rückmeldebogen („Links und rechts aus Sicht des Roboters“).
- **Spiel / Bewegung:** Roboter-Spiel im Gang. Der Roboter macht **genau**, was dasteht, auch Unsinn (gegen die Wand laufen = stehen bleiben und „Hier hat der Kobold zugeschlagen!“ sagen). Rollentausch.
- **Blätter:** 1-1 **Meine Befehlskarten** zum Ausschneiden (8 Karten vor, 4 Karten links drehen, 4 Karten rechts drehen), werden in E2, E4 und E5 wieder verwendet; 1-2 Wohin schaut der Drache?; 1-3 Roboter-Programme.
- **Vorbereitung:** Befehlskarten liegen fertig ausgeschnitten bereit (ohne {{KIND}}), Bemalen als Extra.
- **Schwerer:** längere Wege mit Hindernissen (Sessel), Programm erst ganz legen, dann ausführen; Roboter steht verkehrt herum (Blick zu {{KIND}}).
- **Bildschirm-Bonus:** keiner (heute nur Körper und Karten).
- **Rechen-Werkstatt:** kein Bezug nötig.

### Einheit 2: Drachen-Pfade ✅ ausformuliert (`src/einheiten/02-drachen-pfade.html`, `raetsel/e2.json`)

- **Ziel:** Programme am Papier: nummerierte Befehls-Reihen schreiben und lesen, ein Programm Schritt für Schritt mit der ausgeschnittenen Drachen-Figur „ausführen“. Kürzeste Programme finden (Drehungen zählen mit). Normal bis 8 Befehle, Schwerer bis 12.
- **Neue Begriffe:** Gitter, Feld, Startfeld, Drache, Schatz, Stein (Hindernis), kürzestes Programm, geschafft.
- **Basteln:** Drachen-Figuren zum Ausschneiden mit **oranger rechter Pfote** (wie der Befehl „rechts drehen“), dazu Plättchen für Schatz, Edelsteine und Steine; ein großer Drache zum Anmalen als Extra.
- **Bewegung:** Boden-Gitter aus Malerkrepp **3 · 3** (Schwerer 4 · 4; Felder 40–50 cm; vorher ohne {{KIND}} kleben), {{KIND}} ist der Drache, ein Schatz-Zuckerl liegt im Zielfeld. Die Befehlskarten aus Blatt 1-1 werden als Programm hingelegt.
- **Blätter:** 2-1 Drachen-Pfade (ein Programm lesen und mit der Figur mitschieben, ein Programm zum Schatz schreiben), 2-2 Drachen-Pfade mit Steinen (Start nach rechts, dann nach links mit „Finde das kürzeste Programm“), 2-3 Meine Drachen-Figur (Bastelvorlage: 4 Drachen-Figuren, 2 Schatz-, 2 Edelstein- und 8 Stein-Plättchen, großer Drache zum Anmalen, leeres Rätsel-Gitter für eigene Rätsel). QR-Code e2.
- **Schwerer:** 4 · 4-Gitter, Steine, Start mit Blick nach rechts oder links, erst ganz am Ende Blick nach unten; eigene Drachen-Pfade für Mama oder Papa erfinden.
- **Bildschirm-Bonus:** Paket **e2**: erste Drachen-Pfade (3–5 Befehle), dann mit Steinen.
- **Rechen-Werkstatt:** Befehle zählen und vergleichen, keine neue Rechnung.

### Einheit 3: Erst das, dann das ✅ ausformuliert (`src/einheiten/03-erst-das-dann-das.html`, `raetsel/e3.json`)

- **Ziel:** Reihenfolge zählt. Abläufe aus dem Alltag (Zähne putzen, Jause machen, anziehen) als Programm. Bildkarten in die richtige Reihenfolge legen. Was passiert bei falscher Reihenfolge? Wo ist die Reihenfolge egal?
- **Neue Begriffe:** Ablauf-Karten, Reihenfolge, „egal-Reihenfolge“ (zwei Schritte, die man tauschen darf).
- **Spiel / Basteln:** Ablauf-Karten ausschneiden. **Roboter-Koch:** Mama oder Papa macht ein Butterbrot (Semmel, Butter, Messer) nach {{KIND}}s Programm und nimmt jeden Befehl wörtlich.
- **Blätter:** 3-1 Ablauf-Karten (16 Karten zum Ausschneiden in drei Farben: Zähne putzen, Jause, Anziehen; eine leere Karte zum Selbermalen), 3-2 Was kommt zuerst? (Drachen-Ei nummerieren, zwei vertauschte Karten finden, „Reihenfolge egal“ beim Belag), 3-3 Der Roboter-Koch (Anziehen: zuerst oder egal?, eigenes Butterbrot-Programm schreiben). QR-Code e3.
- **Schwerer:** Abläufe mit 6–8 Karten, mehrere richtige Reihenfolgen finden und zählen, eigenen Ablauf erfinden, der Roboter-Koch bekommt einen Fehler.
- **Bildschirm-Bonus:** Paket **e3**: Bilder-Abläufe sortieren (antippen, kein Ziehen).
- **Rechen-Werkstatt:** kein Bezug nötig.

### Einheit 4: Der Fehler-Kobold ✅ ausformuliert (`src/einheiten/04-der-fehler-kobold.html`, `raetsel/e4.json`)

- **Ziel:** Fehler finden und reparieren: Programme mit **genau einem** Fehler (falscher, fehlender oder überzähliger Befehl). Programm im Kopf durchgehen („Wo ist der Drache nach Befehl 3?“). Fehler sind normal und gut.
- **Neue Begriffe:** Fehler-Kobold, Kobold-Jagd, reparieren (tauschen, streichen, einfügen).
- **Spiel / Bewegung:** **Kobold-Jagd:** Mama oder Papa baut absichtlich einen Fehler ins Roboter-Programm (Befehlskarten am Boden-Gitter), {{KIND}} findet ihn. Rollentausch: {{KIND}} versteckt einen Kobold.
- **Blätter:** 4-1 Kobold-Jagd („Wo ist der Drache nach Befehl 3?“, zweimal einen falschen Befehl finden und reparieren), 4-2 Wo ist der Drache? („nach Befehl 5“, ein fehlender und ein überzähliger Befehl), 4-3 Kobold-Profi (für „Schwerer machen“: Art des Fehlers bestimmen, Drache mit Blick nach unten). QR-Code e4.
- **Schwerer:** längere Programme, Fehler ohne Gitter nur im Kopf finden, mehrere mögliche Reparaturen finden („Auch richtig: …“), selbst Kobold-Programme für Mama oder Papa bauen.
- **Bildschirm-Bonus:** Paket **e4**: kaputte Programme reparieren.
- **Rechen-Werkstatt:** kein Bezug nötig (hier geht es um Fehler in Befehlen, nicht in Rechnungen).

### Einheit 5: Der Wiederhol-Zauber ✅ ausformuliert (`src/einheiten/05-der-wiederhol-zauber.html`, `raetsel/e5.json`)

- **Ziel:** Wiederholungen: Zauber-Kasten „3-mal: vor“ statt „vor, vor, vor“. Im Schwerer-Teil eine Gruppe („2-mal: vor, rechts drehen“). Muster tanzen und zeichnen. Kürzer schreiben ist schlauer: Karten zählen.
- **Neue Begriffe:** Wiederhol-Zauber, Zauber-Kasten, „3-mal“, Karten zählen.
- **Basteln:** Zauber-Kasten zum Basteln (lila Rahmen, in den Befehlskarten gelegt werden, mit Zahl 2–5).
- **Bewegung:** **Wiederhol-Tanz:** ein Programm aus Bewegungen mit Zauber-Kasten (z. B. „4-mal: hüpfen, klatschen“), {{KIND}} erfindet eigene Tänze.
- **Basteln / Papier:** Muster-Bild auf Kästchenpapier mit Wiederholungen.
- **Blätter:** 5-1 Der Zauber-Kasten (Programm kürzer schreiben und Karten zählen, Muster-Bild nach Zauber-Kästen malen), 5-2 Drache und Zauber-Kasten (Programm mit Zauber-Kasten lesen, Drachen-Pfad mit Kartengrenze „nur 4 Karten“), 5-3 Mein Zauber-Kasten (Bastelvorlage: lila Streifen, Zahlenkarten „2-mal“ bis „5-mal“, Tanz-Karten). QR-Code e5.
- **Schwerer:** Gruppe aus 2–3 Befehlen im Kasten, kleinste Kartenzahl finden, Quadrat-Tanz („4-mal: vor, vor, rechts drehen“), eigene Kartengrenzen.
- **Bildschirm-Bonus:** Paket **e5**: Drachen-Pfade mit Zauber-Kasten und Kartengrenze.
- **Rechen-Werkstatt:** „3-mal: 2 Felder“ ist 3 · 2 (Mal als wiederholtes Plus), nur als Ausblick.
- **Schluss von Block A:** Rückmeldebogen ausfüllen, Sammelpass stempeln. Danach wird der Plan angepasst (Abschnitt 10).

---

## 5. Blöcke B bis D (Einheiten 6–20) – Planung

Die Einheiten werden erst nach der Rückmeldung ausformuliert. Titel stehen schon im Sammelpass (`src/rahmen/04-sammelpass.html`) und können sich noch ändern.

### Block B: Muster und Geheimcodes (Einheiten 6–10)

| Nr | Titel | Ziel und Inhalt | Spiel / Bewegung / Basteln | Bildschirm-Bonus | Neue Begriffe | Rechen-Werkstatt |
|---|---|---|---|---|---|---|
| 6 | Muster-Detektivin | Muster erkennen und fortsetzen (Farben, Formen, Bewegungen), den „Kern“ eines Musters finden und mit Zauber-Kasten aufschreiben („3-mal: rot, blau, blau“), Kobold im Muster finden | Muster-Armband fädeln (Perlen, Nudeln), Klatsch-Muster, Muster-Tanz | Muster fortsetzen (e6) | Muster, Muster-Kern | R17 Muster fortsetzen (Zahlenmuster) |
| 7 | Geheimschrift der Feen | Buchstaben verschieben mit dem Geheimschrift-Rad (A–Z, nur Großbuchstaben, Geheimtexte ohne Umlaute und ß), Symbol-Alphabet, Nachrichten ver- und entschlüsseln, Schlüssel (Verschiebe-Zahl) | Geheimschrift-Rad basteln (zwei Pappteller, Musterklammer), geheime Feen-Briefe im Haus verstecken | Geheimschrift-Rad digital (e7) | Geheimcode, Geheimschrift-Rad, Schlüssel-Zahl, verschlüsseln/entschlüsseln (als Kinderwort: „in Geheimschrift schreiben“ / „lesen“) | – |
| 8 | Bilder aus Kästchen | Pixelbilder nach Code malen („3 weiß, 2 schwarz“), eigene Bilder als Code aufschreiben, Code mit Zauber-Kasten kürzer schreiben | Kästchenbild auf 1-cm-Kästchenpapier, mit Muggelsteinen legen, Code-Diktat zu zweit | Kästchen-Maler (e8) | Kästchenbild, Kästchen-Code | 1-cm-Kästchen wie dort |
| 9 | Nur Ja oder Nein | Ja/Nein-Zahlen: Karten 1, 2, 4, 8, 16 an oder aus, bis 31 mit den Fingern einer Hand zählen, Lampen-Code (an/aus) | Ja/Nein-Karten basteln, Finger-Zählen, Taschenlampen-Botschaft | Ja/Nein-Zahlen (e9) | Ja/Nein-Zahlen, Ja/Nein-Karten, an/aus | R19 Gedankenlese-Karten 1–31: erklärt, **warum** der Trick funktioniert |
| 10 | Sortieren und Suchen | Sortieren nach Regeln (Größe, Farbe), Vergleichen zu zweit, Suchen durch Halbieren als Strategie („Wie viele Fragen brauche ich höchstens?“) | Sortier-Netz mit Kreide im Hof (Kuscheltiere tauschen Plätze nach Regel), Halbier-Raten. **Urkunde 1** | Halbier-Suche gegen den Computer (e10) | sortieren, Sortier-Netz, Halbier-Suche | R8 Zahl raten (größer/kleiner) aus Programmier-Sicht |

**Urkunde 1 nach Einheit 10:** „Drachen-Programmiererin“ (`src/rahmen/80-urkunden.html`, erste Seite). Feierlich überreichen, z. B. beim Abendessen; {{KIND}} darf der Familie ein Programm vorführen (Roboter-Spiel mit Oma oder Opa als Roboter).

### Block C: Wenn-dann und Logik (Einheiten 11–14)

| Nr | Titel | Ziel und Inhalt | Spiel / Bewegung / Basteln | Bildschirm-Bonus | Neue Begriffe | Rechen-Werkstatt |
|---|---|---|---|---|---|---|
| 11 | Wenn-dann-Regeln | Bedingungen: „Wenn ich klatsche, hüpfst du“, Roboter mit Regel „Wenn Stein vor dir, dann rechts drehen“, Regeln mit „sonst“ (Schwerer) | Regel-Spiel mit Bewegung, Regel-Karten basteln, Drache am Boden-Gitter mit einer Regel | Drache mit Wenn-dann-Regeln (e11) | Wenn-dann-Regel, sonst | – |
| 12 | Logikrätsel | Kleine Logikgitter mit Bildern statt Wörtern: zuerst 2 · 2, normal höchstens 3 Personen/Tiere und 3 Dinge, 4 · 4 nur im Schwerer-Teil. Jeder Hinweis ein kurzer Satz. Wahr oder falsch, und/oder | Rätsel für die Familie erfinden, „Wer bin ich?“ mit und/oder | Logikgitter (e12) | wahr, falsch, und, oder, Logikgitter | – |
| 13 | Ja-Nein-Bäume | Entscheidungsbäume: Tiere raten mit Ja/Nein-Fragen, Dinge sortieren, „Welche Frage teilt am besten?“ | Ratebaum basteln (Schnur und Wäscheklammern), Knöpfe sortieren | Tier-Ratebaum (e13) | Ja-Nein-Baum, Frage, Ast | Verbindung zu E10 (Halbieren) |
| 14 | Formen-Quadrate | 4 · 4-Rätsel mit Formen (jede Form einmal pro Reihe und Spalte), zuerst 3 · 3; genau eine Lösung (Löser prüft) | Rätsel mit Spielkarten oder Muggelsteinen legen | Formen-Quadrat-Rätsel (e14) | Formen-Quadrat, Reihe, Spalte | R17 magische Quadrate (dort Summen, hier keine) |

### Block D: Strategie und Projekte (Einheiten 15–20)

| Nr | Titel | Ziel und Inhalt | Spiel / Bewegung / Basteln | Bildschirm-Bonus | Neue Begriffe | Rechen-Werkstatt |
|---|---|---|---|---|---|---|
| 15 | Gewinnen mit Plan | Nim-Spiele mit Muggelsteinen (eigene Varianten), „Wer sagt 20?“ (1 oder 2 weiterzählen), Gewinn-Strategie entdecken und als Wenn-dann-Regel aufschreiben; Strategie per Spielbaum geprüft | Turniere zu zweit, Strategie-Karte basteln | Strategiespiel gegen den Computer (e15) | Gewinn-Strategie, Gewinnzahl | Nim (dort im Ideen-Parkplatz) |
| 16 | Labyrinth-Meisterin | Labyrinth-Regeln (Hand an der Wand), kürzesten Weg finden, Labyrinth als Programm, Sackgassen | Labyrinth mit Kreide oder Malerkrepp, eigenes Labyrinth zeichnen | Labyrinth-Programmierer (e16) | Labyrinth, Sackgasse, Hand-an-der-Wand-Regel | – |
| 17 | Zaubersprüche | Eine Befehlsgruppe bekommt einen Namen („Hüpf-Zauberspruch“ = vor, vor, links drehen) und wird wiederverwendet; Zauberspruch und Zauber-Kasten zusammen | Zauberspruch-Karten basteln, Tanz mit Zaubersprüchen | Drache mit eigenen Zaubersprüchen (e17) | Zauberspruch | – |
| 18 | Ich erfinde ein Spiel | Eigenes Spiel mit klaren Regeln (Regeln sind ein Programm), testen, Kobold in den Regeln finden, verbessern | Brettspiel basteln, Familie testet | – (bewusst ohne Bildschirm) | Spielregel, testen | – |
| 19 | Großer Roboter-Parcours | Alles zusammen: Wiederhol-Zauber, Wenn-dann, Zaubersprüche im Garten-Parcours, zwei Roboter | Parcours im Garten oder Gang | Parcours-Levels (e19) | – | – |
| 20 | Das große Code-Fest | Stationen zu allen Themen (je 3–4 Minuten), Fest-Rätsel mit Geheimcode-Schatz | Stationen im Haus. **Urkunde 2 („Code-Meisterin“)** | Fest-Level-Paket (e20) | – | – |

**Urkunde 2 nach Einheit 20:** „Code-Meisterin“ (`src/rahmen/80-urkunden.html`, zweite Seite).

---

## 6. Ideen-Parkplatz (Extras, jederzeit einschiebbar)

| Nr | Idee | Kurz |
|---|---|---|
| X1 | Zwei Roboter gleichzeitig | Zwei Programme im selben Gitter, die Drachen dürfen nicht im selben Feld stehen |
| X2 | Fehler im Rezept | Kobold-Jagd in der Küche: Ein Rezept mit vertauschter Reihenfolge (Bezug E3/E4) |
| X3 | Morsecode mit Taschenlampe | kurz/lang als Geheimcode, Botschaften am Abend durchs Fenster |
| X4 | Kästchen-Weihnachtskarten | Kästchenbild als Code verschicken (E8) |
| X5 | Nachrichten weitergeben | Netzwerk-Spiel: Zettel über mehrere Stationen, was passiert, wenn einer fehlt? |
| X6 | Wie findet ein Navi den Weg? | kürzester Weg im Stadtplan-Gitter, Bezug E2/E16 |
| X7 | Bastel-Roboter aus Schachteln | Roboter mit Befehls-Taschen, die Karten steckt man hinein |
| X8 | Lichtschalter-Logik | und/oder mit zwei Schaltern basteln (Batterie, Lämpchen, Alufolie) |
| X9 | Absolute Pfeile | nach oben/unten/links/rechts als Vergleich zu den relativen Befehlen. **Achtung:** erst, wenn die drei relativen Befehle sicher sind, und mit eigenen, deutlich anderen Symbolen |
| X10 | Programmieren im Alltag | Auto, Einkaufen, Abendessen: „Welches Programm hat die Ampel?“, „Was ist der Wiederhol-Zauber beim Stiegensteigen?“ |

---

## 7. Begriffsliste (verbindlich für Einheiten, Rahmenseiten und Web-App)

Die Spalte **Kinderwort** wird auf den Blättern, in den Beispielsätzen und in der Web-App verwendet. **Fachwörter** stehen nur in der Anleitung (vor allem im Kasten „Was hat das mit echtem Programmieren zu tun?“). Der Build prüft auf den Blättern: Anweisung, Algorithmus, Schleife, Bug, Debuggen, Bedingung, Funktion, Unterprogramm, Binär, Bit, Sequenz, Codierung, Verschlüsselung, Computer sind dort verboten.

### 7.1 Kinderwörter und Fachwörter

| Kinderwort (Blätter, Beispielsätze, Web-App) | Fachwort (nur Anleitung) | Bedeutung | Nicht verwenden | ab Einheit |
|---|---|---|---|---|
| **Befehl** | Anweisung | ein Schritt, den der Roboter oder Drache ausführt | Kommando, Aktion | 1 |
| **Programm** | Programm, Algorithmus, Sequenz | eine genaue Reihe von Befehlen, nummeriert | Code (als Kinderwort erst ab Block B für Geheimcodes) | 1 |
| **Roboter** | Computer, Ausführender | wer das Programm genau so ausführt, wie es dasteht | Maschine | 1 |
| **vor**, **links drehen**, **rechts drehen** | relative Bewegungsbefehle | die drei Befehle (Abschnitt 7.2) | geradeaus, gehe, dreh dich, links, rechts (allein); „Schritt“ als Befehlsname („mach einen Schritt“). Zur Erklärung bleibt erlaubt: „vor“ ist ein großer Schritt | 1 |
| **Befehlskarten** | – | die ausgeschnittenen Karten von Blatt 1-1 | Pfeilkarten | 1 |
| **Blickrichtung** (Nase) | Orientierung | wohin der Drache oder Roboter schaut | Ausrichtung | 1 |
| **Gitter**, **Feld** | Raster, Zelle | Spielfeld aus Feldern; der Drache steht immer in einem Feld | Kästchen (das sind die 1-cm-Kästchen) | 1 |
| **Startfeld**, **Schatz**, **Stein** | Start, Ziel, Hindernis | Startfeld hellgrün; Ziel ist meist der Schatz; Steine kann man nicht betreten | Wand (für Steine), Mauer | 2 |
| **kürzestes Programm** | kürzeste Sequenz, optimaler Pfad | die wenigsten Befehle, Drehungen zählen mit | schnellstes Programm | 2 |
| **geschafft** | Ziel erreicht, Programm korrekt | am Ende des Programms auf dem Schatz (und alle Edelsteine eingesammelt) | „richtig“ beim bloßen Vorbeigehen | 2 |
| **Ablauf-Karten** | Sequenz | Bildkarten eines Ablaufs zum Ordnen | Bildergeschichte | 3 |
| **Reihenfolge**, „**Reihenfolge egal**“ | Abhängigkeit, Parallelität | was vor was kommen muss / was man tauschen darf | – | 3 |
| **Fehler-Kobold**, **Kobold-Jagd** | Bug, Debuggen | ein Fehler im Programm / Fehler suchen und reparieren | Fehler „machen“ als Vorwurf, falsch | 4 |
| **reparieren** (tauschen, streichen, einfügen) | Bugfix | einen Befehl tauschen, streichen oder einen fehlenden einfügen | korrigieren | 4 |
| **Wiederhol-Zauber**, **Zauber-Kasten** („3-mal“) | Schleife (Loop) | Befehle im Kasten werden so oft ausgeführt, wie oben steht | Schleife, Zaubertrick, „mal“ mit Malpunkt | 5 |
| **Karten** (beim Zählen von Programmen) | Programmlänge | wie viele Karten man zum Hinlegen braucht (Abschnitt 7.5) | Befehle zählen (beim Zauber-Kasten mehrdeutig) | 5 |
| **Muster**, **Muster-Kern** | Periode, Wiederholungseinheit | was sich wiederholt | – | 6 |
| **Geheimcode**, **Geheimschrift** | Verschlüsselung, Codierung | Nachricht so schreiben, dass nur Eingeweihte sie lesen | geheim „verzaubern“ | 7 |
| **Schlüssel-Zahl** | Schlüssel (Caesar-Verschiebung) | um wie viele Buchstaben verschoben wird | – | 7 |
| **Kästchenbild**, **Kästchen-Code** | Pixelgrafik, Lauflängencodierung | Bild aus 1-cm-Kästchen und sein Code („3 weiß, 2 schwarz“) | Pixel (nur in der Anleitung) | 8 |
| **Ja/Nein-Zahlen**, **Ja/Nein-Karten** | Binärzahlen (Bits) | Zahlen nur mit „Karte da“ und „Karte weg“ | Nullen und Einsen (erst Schwerer-Teil) | 9 |
| **sortieren**, **Halbier-Suche** | Sortieralgorithmus, binäre Suche | ordnen nach Regel / immer in der Mitte fragen | – | 10 |
| **Wenn-dann-Regel**, **sonst** | Bedingung (if), else | „Wenn …, dann …“ | falls | 11 |
| **wahr**, **falsch**, **und**, **oder** | Wahrheitswerte, logische Operatoren | – | richtig/falsch für Aussagen | 12 |
| **Ja-Nein-Baum** | Entscheidungsbaum | Fragen mit Ja- und Nein-Ast | – | 13 |
| **Formen-Quadrat** | lateinisches Quadrat | jede Form einmal pro Reihe und Spalte | magisches Quadrat (das ist in der Rechen-Werkstatt) | 14 |
| **Gewinn-Strategie** | Strategie, Spielbaum | ein Plan, mit dem man immer gewinnt | Trick | 15 |
| **Labyrinth**, **Sackgasse** | Graph, Suche | – | Irrgarten (geht auch, nicht als Hauptwort) | 16 |
| **Zauberspruch** | Funktion, Unterprogramm | eine Befehlsgruppe mit Namen, die man wiederverwenden kann | Funktion | 17 |
| **Spielregel**, **testen** | Spezifikation, Test | – | – | 18 |

### 7.2 Die drei Befehle (Einheiten 1–5, bleiben für immer)

| Befehl | Was passiert | Symbol | Farbe |
|---|---|---|---|
| **vor** | ein Feld in Blickrichtung (am Boden ohne Gitter: ein großer Schritt bzw. eine Fliese) | gerader dicker Pfeil nach oben (`vor`) | Blau `#2b6fd6` |
| **links drehen** | Vierteldrehung nach links auf der Stelle, bleibt im Feld | Pfeil, der hinaufgeht und nach links abbiegt (`links`) | Grün `#1f9d55` |
| **rechts drehen** | Vierteldrehung nach rechts auf der Stelle, bleibt im Feld | gespiegelt (`rechts`) | Orange `#e8731a` (wie die rechte Pfote des Drachen) |

- Immer in genau diesen Worten. Kein „geradeaus“, „gehe“, „dreh dich“, kein seitlich oder rückwärts Gehen.
- Für Drehungen **nie** ← oder →. Symbole nie als Schriftzeichen, immer als SVG (`<m-symbol>`).
- Eine Kehrtwende ist „links drehen, links drehen“ oder „rechts drehen, rechts drehen“ (beide gleich lang).

### 7.3 Das Wort „Zauber“

„Zauber“ nur in **Wiederhol-Zauber**, **Zauber-Kasten** und **Zauberspruch** (der Build prüft das in allen Texten der PDFs). Alles andere bekommt andere Namen: Formen-Quadrat, Code-Meisterin, Drachen-Programmiererin. Kein „verzaubern“, „Zauberei“, „Zauberstab“, „Zauberin“ im Text. Bilder (`<m-bild name="zauberstab">`, `zauberhut`) sind erlaubt, sie sind nur Deko ohne Wort.

### 7.4 Symbole (SVG, `web/kern/symbole.js`)

Einmal gezeichnet, überall gleich (Blätter, Anleitung, Befehlskarten, Rahmenseiten, Web-App). Im HTML: `<m-symbol name="…" gr="…">` (gr in mm; im Fließtext der Anleitung `gr="4.5"`). Mit `blick="rechts"` wird der Drache gedreht.

| Name | Bedeutung | Farbe |
|---|---|---|
| `vor` | Befehl vor | Blau `#2b6fd6` |
| `links` | Befehl links drehen | Grün `#1f9d55` |
| `rechts` | Befehl rechts drehen | Orange `#e8731a` |
| `drache` | der Drache von oben, Nase und kleiner Pfeil zeigen die Blickrichtung; rechte Vorderpfote orange | Grün `#7cc96b`, Flügel `#3f8a35`, Bauch `#e9f7c9`, Zacken und Hörnchen Gold `#f2b705` |
| `schatz` | Schatztruhe, das übliche Ziel | Holz `#b86b2c` / `#e0a060`, Beschläge Gold `#f2b705` |
| `ziel` | Zielflagge (Ziel ohne Schatz) | Schwarz-weiß kariert, Tinte `#1f2340` |
| `stern` | gefüllter Stern (Belohnung, Ziel-Variante) | Gold `#f2b705` |
| `sternLeer` | leerer Stern zum Anmalen | Rand Gold `#f2b705`, innen weiß |
| `hindernis` | Stein, kann nicht betreten werden | Grau `#a3a8b8` / `#6b6f86` |
| `edelstein` | Edelstein zum Einsammeln | Hellblau `#8fd3ff` |
| `kobold` | der Fehler-Kobold | Kopf Grün `#9ad16b`, Mütze und Körper Lila `#c25a9e` |
| `haken` | geschafft, richtig | Grün `#1f9d55` |
| `wenn-stein`, `wenn-frei` | Wenn-Karten (ab E11): Stein bzw. freies Feld **vor der Nase**. Im Bild schaut der Drache immer nach oben, das Feld liegt über ihm | Türkiser Grund `#e0f4f4`, Stein grau, freies Feld weiß mit gestricheltem Rand |
| `wenn-stein-links`, `wenn-frei-links`, `wenn-stein-rechts`, `wenn-frei-rechts` | Wenn-Karten (ab E16): Stein bzw. freies Feld **links oder rechts neben** dem Drachen, von ihm aus gesehen (Drache im Bild nach oben, Feld links bzw. rechts von ihm) | wie oben |
| `wenn` | Wenn-dann-Kasten allgemein (Taste in der App): der Drache schaut auf ein Feld | Türkis `#0b8a8f` |
| `bis` | Wiederhol-Zauber „bis zum Schatz“ (Taste in der App): Kreis-Pfeil um die Schatztruhe | Lila `#7a4fd1` |
| `spruch-stern`, `spruch-mond`, `spruch-krone` | Siegel des Stern-, Mond- und Kronen-Spruchs (ab E17): auf der Spruch-Karte und auf jeder Aufruf-Karte | Siegel Braun `#8a5a2b` auf `#fbf0dc`; Stern Gold, Mond Hellblau `#8fb9f2`, Krone Gold |

Weitere feste Farben: Zauber-Kasten Lila `#7a4fd1` (hell `#f1ebff`), Weg und Lösungen Rot `#d1335b`, Tinte `#1f2340`. Startfeld im Gitter hellgrün hinterlegt. Ab Block C (Abschnitt 7.8): **Wenn-dann-Kasten Türkis `#0b8a8f`** (hell `#e0f4f4`), **Zaubersprüche Braun `#8a5a2b`** (hell `#fbf0dc`, wie eine Spruch-Rolle), der Wiederhol-Zauber **„bis zum Schatz“ ist ein Zauber-Kasten und bleibt Lila**. Diese Farben sind deutlich anders als vor (Blau), links drehen (Grün), rechts drehen (Orange), der Zauber-Kasten (Lila) und Rot (Lösungen). Die Wörter „wenn“, „dann“, „sonst“, „bis zum Schatz“ und der Spruch-Name stehen in der Kinderschrift auf den Kästen.

**Strichzeichnungen** (`<m-bild name="…">`, aus der Rechen-Werkstatt, nur Deko und Kasten-Symbole): stern, zauberstab, krone, mond, edelstein, trank, zauberhut, schloss, drache, einhorn, fee, schere, gluehbirne, eule, wuerfel, rakete, karten, ei, kreide, haken, ziel, achtung, feder, huepfen, lupe, medaille, tablet, roboter. Feste Bedeutungen: **Krone** = Profi-Aufgabe, **Eule** = Knobel-Ecke, **Medaille** = Urkunde, **Tablet** = Bildschirm-Bonus, **Roboter** = „Was hat das mit echtem Programmieren zu tun?“, **Lupe** = Hilfen für links und rechts / Einschätzen.

### 7.5 Gitter-Regeln (Blätter, Boden-Gitter und Web-App)

1. **Felder:** Die Figur (der Drache) steht immer **in einem Feld**, nie auf einer Linie. Am Papier mindestens **20 mm** pro Feld (geprüft), am Boden etwa **40–50 cm** (Malerkrepp oder Kreide). In der Wohnung ohne Gitter ist „vor“ **ein großer Schritt** bzw. eine Fliese.
2. **Startfeld und Blickrichtung:** Jedes Gitter zeigt das Startfeld (hellgrün) und die Blickrichtung (Nase und kleiner Pfeil). Ohne andere Angabe schaut der Drache am Start **nach oben**.
3. **Stufen der Blickrichtung:** zuerst Start nach oben, dann nach links oder rechts, **nach unten erst im Schwerer-Teil** (dann ist sein Links von {{KIND}} aus gesehen rechts). Bis zur Rückmeldung bleibt das so.
4. **Befehle:** genau die drei aus Abschnitt 7.2. „vor“ geht ein Feld in Blickrichtung, Drehungen bleiben im Feld.
5. **Programme** stehen als **nummerierte Reihe** in einer Zeile, **höchstens 12 Befehle** (geprüft). Beim Ausführen tippt {{KIND}} mit dem Finger oder einem Muggelstein mit.
6. **Anstoßen:** Stößt der Drache mit „vor“ an den Rand oder an einen Stein, **bleibt er stehen**, und das Programm ist **zu Ende** (die restlichen Befehle werden nicht mehr ausgeführt). Am Papier und in der App heißt das: „Hier hat der Kobold zugeschlagen!“ Der Befehl, bei dem es passiert, wird markiert. Ein Programm, das anstößt, ist nicht geschafft.
7. **Geschafft** heißt: **Am Ende des Programms** steht der Drache auf dem Schatz (bzw. Ziel) **und** hat alle Edelsteine eingesammelt (falls es welche gibt). Nur vorbeigehen zählt nicht. Ein Edelstein ist eingesammelt, sobald der Drache sein Feld betritt.
8. **Kürzestes Programm:** die wenigsten Befehle, **Drehungen zählen mit**, ohne Zauber-Kasten. Gibt es mehrere gleich kurze, steht auf dem Blatt „Mehrere Lösungen möglich“ (der Löser zählt sie).
9. **Wiederhol-Zauber am Papier:** ein lila Zauber-Kasten, links oben steht groß „3-mal“ (2- bis 5-mal), im Kasten stehen die Befehle, die wiederholt werden. Kein Mal-Punkt. In Einheit 5 zuerst ein Befehl im Kasten, im Schwerer-Teil eine Gruppe von 2–3 Befehlen. **Höchstens 3 Befehle in einem Kasten** (Papier, Löser und App gleich; `K.MAX_INNEN` in web/kern/ausfuehrer.js). **Nie ein Zauber-Kasten in einem Zauber-Kasten.** Ab Block C dürfen Wenn-dann-Kästen und Zauberspruch-Aufrufe hinein (Abschnitt 7.8). Die Web-App zeigt denselben Kasten.
10. **Karten zählen** (ab Einheit 5): Ein Befehl ist **1 Karte**, ein Zauber-Kasten ist **1 Karte plus die Befehle darin**. „3-mal: vor“ = 2 Karten, „vor vor vor“ = 3 Karten, „2-mal: vor, rechts drehen“ = 3 Karten. Eine Kartengrenze („höchstens 5 Karten“) zwingt zum Zauber-Kasten.
11. **Nummern beim Nachfragen:** „nach Befehl 3“ zählt ausgeführte Befehle; im Zauber-Kasten zählt jede Wiederholung mit („3-mal: vor“ sind 3 ausgeführte Befehle).
12. **Koordinaten in den Rätsel-Daten** (`raetsel/eN.json`, nur für Autoren, nie auf den Blättern): `x` wächst nach rechts, `y` nach unten, Feld `(0, 0)` ist **links oben**. Ein 3 · 3-Gitter hat links unten `(0, 2)` und rechts oben `(2, 0)`. `blick`: `oben`, `rechts`, `unten`, `links`. Hindernisse und Edelsteine als `[[x, y], …]`. Was in Worten in der Anleitung steht („nach Befehl 3 steht er im Feld rechts oben“), wird mit dem Ausführer nachgerechnet.
13. **Gleiche Regeln überall:** Blätter, Boden-Gitter und Web-App verwenden denselben Ausführer (`web/kern/ausfuehrer.js`). Das Gitter dreht sich in der App **nie mit** (oben bleibt oben wie am Papier), nur die Tasten ordnen sich um.

### 7.6 Rätselarten und was „eindeutig“ heißt

Rätsel stehen immer in `raetsel/eN.json` und werden beim Bauen gelöst und geprüft (`werkzeuge/raetsel.mjs`). Kurzfassung (Details im Leitfaden, Abschnitt 4):

| Art | Was es ist | Eindeutig heißt |
|---|---|---|
| `pfad` | Drachen-Pfad: Programm zum Schatz finden | erreichbar; bei „finde das kürzeste“ genau ein kürzestes Programm, sonst gekennzeichnet |
| `lesen` | Programm lesen: Wo landet der Drache? | läuft ohne Anstoßen (oder stößt absichtlich) |
| `kobold` | Kobold-Programm mit genau einem Fehler | kaputt kommt nicht an, die gemeinte Reparatur schon; alle anderen Ein-Schritt-Reparaturen gelten auch |
| `ablauf` | Ablauf-Karten ordnen | alle gültigen Reihenfolgen gezählt; mehrere nur gekennzeichnet |
| `kuerzer` | Programm mit Zauber-Kasten kürzer schreiben | macht genau dasselbe und braucht weniger Karten |
| später | Logikgitter, Formen-Quadrate, Geheimtexte (genau eine Lösung); Strategiespiele (Gewinn-Strategie per Spielbaum) | – |

`pfad`, `lesen`, `kobold` und `kuerzer` verstehen ab Block C auch die erweiterten Befehle aus Abschnitt 7.8 (Wenn-dann-Kasten, „bis zum Schatz“, Zaubersprüche) und `pfad` mehrere Gitter auf einmal („ein Programm für alle“). Felder und Prüfungen: Leitfaden Abschnitt 4.

### 7.7 Pakete der Web-App

| Paket | Einheit | Adresse | Inhalt |
|---|---|---|---|
| e2 | 2 Drachen-Pfade | `…/#e2` | Drachen-Pfade programmieren (erst 3–5 Befehle, dann mit Steinen, auch mitten im Weg) |
| e3 | 3 Erst das, dann das | `…/#e3` | Bilder-Abläufe sortieren (antippen, kein Ziehen) |
| e4 | 4 Der Fehler-Kobold | `…/#e4` | Kaputte Programme reparieren (einen Befehl tauschen) |
| e5 | 5 Der Wiederhol-Zauber | `…/#e5` | Drachen-Pfade mit Zauber-Kasten und Kartengrenze |

- Kein Schlüsselwort: Alle Pakete sind offen. Der QR-Code auf dem Blatt führt direkt zum Paket.
- Jedes Paket hat 5–9 Levels (10–15 Minuten), danach ein klares Ende: „Super! Jetzt zurück zum Papier.“
- Steine liegen nicht nur am Rand, sondern auch mitten im Weg (direkt vor der Nase, Mauer mit Lücke, Slalom).
- Die Adresse ist `<pagesBasis>#eN` (`werkstatt.json`, lokal überschreibbar in `kind.json`). Die volle Adresse steht nie im Text der Blätter oder der Anleitung, nur im QR-Code.


### 7.8 Erweiterte Befehle ab Block C (Wenn-dann-Kasten, Wiederhol-Zauber „bis zum Schatz“, Zaubersprüche)

Gilt für Blätter, Löser und App gleich (`web/kern/ausfuehrer.js`, umgesetzt und getestet in `tests/kern.test.mjs`). Die drei Befehle vor, links drehen, rechts drehen und der Zauber-Kasten „2-mal“ bis „5-mal“ bleiben unverändert. Neu kommen drei Kästen dazu, jeder mit eigener Farbe und eigenem Symbol (SVG, nie als Schriftzeichen, Abschnitt 7.4):

| Kinderwort | Text in den Rätsel-Daten | Was passiert | ab Einheit |
|---|---|---|---|
| **Wenn-dann-Kasten** (Wenn-dann-Regel) | `wenn[stein: rechts]`, mit sonst: `wenn[stein: rechts sonst vor]` | Der Drache schaut, was vor seiner Nase (bzw. neben ihm) ist. Stimmt die Bedingung, macht er die Befehle nach „dann“ (1 bis 3), sonst die nach „sonst“ (0 bis 3). Er schaut nur, er bewegt sich dabei nicht. | 11 |
| Bedingungen (Wenn-Karten) | `stein` = vor der Nase ist ein Stein oder der Rand; `frei` = vor der Nase ist ein freies Feld; im Schwerer-Teil auch `stein-links`, `stein-rechts`, `frei-links`, `frei-rechts` (neben dem Drachen, von ihm aus gesehen) | Der Rand zählt wie ein Stein („Am Rand liegen unsichtbare Steine“). `frei` ist immer genau das Gegenteil von `stein`. Schatz und Edelsteine liegen auf freien Feldern. | 11 (links/rechts ab 16) |
| **Wiederhol-Zauber „bis zum Schatz“** | `bis[wenn[stein: rechts sonst vor]]` | Zauber-Kasten, auf dem statt einer Zahl „bis zum Schatz“ steht (lila, Schatz im Kopf). Er wiederholt seinen Inhalt, **bis der Drache auf dem Schatz steht**: geprüft, bevor er anfängt (steht der Drache schon dort, passiert nichts) und **nach jedem ausgeführten Befehl**; dann hört der Kasten sofort auf, auch mitten in einer Runde, und das Programm geht nach dem Kasten weiter. Höchstens 3 Teile im Kasten. | 16 |
| **Zauberspruch** | in den Daten `"sprueche": { "stern": "vor vor links" }`, im Programm `@stern` | Eine Befehlsgruppe mit Namen. Steht `@stern` im Programm, macht der Drache alle Befehle des Stern-Spruchs. Namen mit eigenem Symbol: `stern` (Stern-Spruch), `mond` (Mond-Spruch), `krone` (Kronen-Spruch). Ein Spruch hat 1 bis 4 Teile (Befehle, Zauber-Kasten, Wenn-dann-Kasten), **kein Spruch in einem Spruch** (auch nicht in einem Kasten im Spruch). | 17 |

- **Erlaubte Verschachtelung:** Ein Zauber-Kasten (Zahl oder „bis zum Schatz“) darf Befehle, Wenn-dann-Kästen und Spruch-Aufrufe enthalten (zusammen höchstens 3 Teile). Ein Wenn-dann-Kasten enthält nur Befehle und Spruch-Aufrufe. Kein Zauber-Kasten in einem Zauber-Kasten, kein Wenn-dann-Kasten in einem Wenn-dann-Kasten. Über einen Spruch kann trotzdem ein Kasten in einem Kasten landen (`3[@stern]` mit `stern = bis[vor]`): Das ist erlaubt und läuft nach denselben Regeln.
- **Karten zählen:** Befehl, Spruch-Aufruf = 1 Karte. Zauber-Kasten (Zahl oder „bis zum Schatz“) = 1 Karte plus sein Inhalt. Wenn-dann-Kasten = 1 Karte (die Wenn-Karte mit der Bedingung) plus die Befehle nach „dann“ und nach „sonst“. Ein Zauberspruch, den {{KIND}} selbst schreibt, zählt einmal: 1 Karte (Spruch-Name) plus sein Inhalt, jeder Aufruf 1 Karte. Ein vorgegebener Spruch (steht fertig auf dem Blatt) zählt nicht. Beispiele: `bis[wenn[stein: rechts sonst vor]]` = 4 Karten; `@stern @stern @stern` mit `stern = vor vor rechts` = 3 + 4 = 7 Karten.
- **Nummern:** Am Papier bekommt jeder Teil der Reihe eine Nummer (ein Kasten eine Nummer), die Kästchen in einem Kasten keine. **Nummern beim Nachfragen** („nach Befehl 5“) zählen weiter nur ausgeführte Befehle (vor, links drehen, rechts drehen), so wie der Drache sie wirklich macht.
- **Höchstens 60 ausgeführte Befehle** pro Programm (`K.MAX_SCHRITTE`). Läuft ein Programm länger (z. B. ein „bis zum Schatz“-Kasten, der den Schatz nie erreicht), hört der Drache auf: „Der Drache läuft im Kreis. Er findet den Schatz so nicht.“ Das ist nicht geschafft. Eine Runde „bis zum Schatz“ ganz ohne ausgeführten Befehl (alle Wenn-Karten falsch, nichts nach „sonst“) würde nie aufhören und zählt sofort als „läuft im Kreis“.
- **Anstoßen** bleibt wie in Regel 6: Ein vor in einen Stein oder den Rand beendet das Programm („Hier hat der Kobold zugeschlagen!“), auch im dann-Zweig oder in einem Spruch. Ein Wenn-dann-Kasten mit `stein` schaut nur, er stößt nie an.
- **Ein Wenn-dann-Kasten allein (nicht im Zauber-Kasten)** wird genau einmal ausgeführt. In einem einzelnen Gitter ist dann der Zweig allein immer kürzer: Sinnvoll ist er in einem Wiederhol-Zauber, in einem Zauberspruch oder bei Rätseln mit **mehreren Gittern** („Ein Programm für beide Gitter“, Daten: `"welten"`), wo dasselbe Programm in jedem Gitter ankommen muss.
- **Gespiegelte Wenn-Karten:** `wenn[stein: A sonst B]` macht immer genau dasselbe wie `wenn[frei: B sonst A]`. Beide sind richtige Lösungen. Ein „Finde das kürzeste“-Rätsel mit sonst hat deshalb fast immer „Mehrere Lösungen möglich“; der Löser zählt beide.
- **Am Papier** (`<m-programm>`, `<m-spruch>`): Wenn-dann-Kasten türkis in einer Zeile: „wenn“ [Wenn-Karte] „dann“ [Befehle] „sonst“ [Befehle]. „bis zum Schatz“ wie der Zauber-Kasten (lila), oben Schatztruhe und „bis zum Schatz“. Ein Zauberspruch ist eine braune Spruch-Karte: links Siegel und Name („Stern-Spruch“), rechts seine Befehle in einer nummerierten Reihe. Ein Aufruf ist eine Karte mit dem Siegel. Höchstens 12 Kästchen pro Reihe (Wenn-Karten und Aufrufe zählen mit).
- **Prüfen im Löser** (`werkzeuge/raetsel.mjs`, `werkzeuge/loeser.mjs`): Bei Rätseln mit erweiterten Befehlen prüft der Löser das angegebene Beispiel-Programm (kommt in jedem Gitter an, benutzt nur Erlaubtes, Kartenzahl ≤ `maxKarten`) und beweist mit der Kartengrenze, dass es **ohne** den neuen Kasten nicht geht (sonst ist die Grenze zu groß): für jeden neuen Kasten aus `erlaubt` einzeln (alles andere bleibt erlaubt), oder nur für die in `erzwingt` genannten. Dazu sucht er die kleinste Kartenzahl und zählt die Programme mit dieser Kartenzahl (Suche über alle Programme bis zur Grenze, mit Beschneiden; Rechen-Grenze etwa 2–3 Sekunden pro Suche). „Finde das kürzeste“ nur, wenn der Löser die Eindeutigkeit beweisen kann, sonst „Mehrere Lösungen möglich“. Grenzen der Suche (gemessen, Leitfaden Abschnitt 4a): höchstens ein selbst geschriebener Spruch (`spruchFrei`); mit Zauber-Kasten, Wenn-dann und „bis“ reicht sie mit 2 Wenn-Karten bis etwa 9 Karten, mit allen sechs bis etwa 7 Karten. Darüber bricht sie ab: Dann ist „ohne … geht es nicht“ nicht bewiesen (Fehler), und für die kleinste Kartenzahl wird nur das Beispiel geprüft (bei „Finde das kürzeste“ ein Fehler).
- **Web-App** (`web/app.js`, Bedienung im Leitfaden Abschnitt 4b): bekommt `erlaubt`, `bedingungen`, `maxKarten`, `sprueche`, `spruchFrei`, `welten` und die kleinste Kartenzahl (`minKarten`, wenn bewiesen), nie Beispiel oder Lösung, und bietet genau das Erlaubte an. Nur Antippen: Wenn-dann-Kasten (Wenn-Karte wählen, Befehle nach „dann“, optional „sonst“, „fertig“), Zauber-Kasten mit „Wie oft?“ 2–5 und „bis zum Schatz“, Wenn-dann-Kasten im Zauber-Kasten, vorgegebene Zaubersprüche als Spruch-Reihe mit Aufruf-Taste, ein eigener Spruch wird zuerst in seiner Spruch-Reihe geschrieben. Beim Laufen leuchtet der Befehl mit allen Kästen darum (Runde, Zweig „dann“/„sonst“, Aufruf und Spruch-Reihe), der Drache „schaut“ sichtbar auf das Feld der Wenn-Karte; mehrere Gitter laufen nacheinander. Gleiche Farben wie am Papier. Erweiterte Kobold-Levels (Stellen im Kasten) gehen in der App noch nicht.

---

## 8. Material für alle Einheiten

| Material | wofür | ab Einheit |
|---|---|---|
| Drucker, Papier, etwas dickeres Papier (160 g) oder Karton (Müslischachtel) | Blätter; Befehlskarten (1-1), Drachen-Figur (2-3), Ablauf-Karten (3-1), Zauber-Kasten (5-3) verstärken | 1 |
| Schere, Kleber, Bleistift, Bunt- oder Filzstifte (Blau, Grün, Orange, Lila, Rot) | Karten ausschneiden, Basteln, Sterne anmalen | 1 |
| Kuvert oder Sackerl für die Befehlskarten | Karten aufheben (werden oft wieder gebraucht) | 1 |
| Gummiringerl oder Sticker | rechte Hand markieren (Hilfen für links und rechts) | 1 |
| Kuscheltier, Platz im Gang oder Wohnzimmer | Roboter-Spiel, Ziel für den Roboter | 1 |
| Malerkrepp (oder Straßenkreide für draußen), Maßband | Start-Kreuz (1), Boden-Gitter 3 · 3 bzw. 4 · 4, Felder 40–50 cm | 1 |
| Polster, einige Kuscheltiere oder Schuhe | Polster zeigt am Boden-Gitter, wo oben ist; Kuscheltiere als Steine am 4 · 4-Gitter | 2 |
| 3 Becher (Plastik- oder Joghurtbecher), Würfel | Spiel „Schatz-Versteck“ | 2 |
| Zuckerl als Schatz, Muggelsteine (etwa 15) | Schatz im Zielfeld; Muggelsteine zum Mittippen und als Punkte | 2 |
| Semmel oder Brot, Butter, Schinken oder Käse, Gurke, stumpfes Messer, Teller | Roboter-Koch | 3 |
| Wollfaden (etwa 2 m), Wäschekluppen | Schwerer-Teil Einheit 3 | 3 |
| Wäschekluppe, leeres Marmeladeglas | Kobold-Kluppe, Fehler-Schatzglas | 4 |
| Kästchenpapier (Rechenheft) | Muster-Bild, Kästchenbilder | 5 |
| Musik (optional) | Bewegungsspiele, Wiederhol-Tanz | 4 |
| Perlen oder Nudeln, Schnur | Muster-Armband | 6 |
| zwei Pappteller, Musterklammer | Geheimschrift-Rad | 7 |
| Taschenlampe | Lampen-Code, Morsecode | 9 |
| Spielkarten, Würfel | Formen-Quadrate, Strategiespiele | 14 |
| Stempel oder Sticker | Sammelpass | 1 |
| Handy oder Tablet (optional) | Bildschirm-Bonus | 2 |

---

## 9. Bildschirm-Regeln (für alle Einheiten)

- Höchstens 10–15 Minuten, **am Schluss**, optional. Die Einheit ist ohne Bildschirm vollständig.
- Mama oder Papa scannt den QR-Code (oder öffnet die Adresse), das Paket geht direkt auf.
- In der Anleitung steht, welche Levels passen und wann das Gerät wieder weggelegt wird: spätestens beim Ende-Bildschirm „Super! Jetzt zurück zum Papier.“
- Die App ist ruhig: keine Werbung, keine Zeitlimits, kein Fehlerton, kein Leben-Verlieren, keine blinkenden Belohnungen, kein endloses „noch ein Level“.
- Ein Stern pro Level. Bewertet wird nach dem Ergebnis; nur bei Levels „Finde das kürzeste Programm“ gibt es den Stern erst mit dem kürzesten Programm (sonst „Fast geschafft!“ mit der kürzesten Befehlszahl).
- Sterne in der App zählen nur als Extra. Gehen sie verloren (Safari löscht Daten von Seiten, die etwa eine Woche nicht benutzt wurden, außer die App liegt am Home-Bildschirm), ist das egal: Der Sammelpass am Papier zählt.

---

## 10. Rückmeldung einarbeiten

Der Rückmeldebogen (`src/rahmen/90-rueckmeldebogen.html`, hinten im PDF) fragt pro Einheit Spaß, Schwierigkeit, Dauer, Bildschirm (ja/nein, Minuten) und was gut oder schlecht war, dazu allgemeine Fragen und das Ergebnis des Gerätetests. Daraus folgt vor Einheit 6:

| Rückmeldung | Anpassung |
|---|---|
| Schwierigkeit meist „zu leicht“ | Block B straffen: Schwerer-Teile werden Hauptteil, Programme bis 12 Befehle und 4 · 4-Gitter als Standard, Blick nach unten schon im Normalteil, Zauber-Kasten mit Gruppen früher; Einheiten 6 und 8 eventuell zusammenlegen |
| „passt“ | Plan wie oben |
| meist „zu schwer“ | Einheit 6 als Wiederholungs-Einheit (Lieblingsspiele aus 1–5 mit neuen Gittern), Programme höchstens 6 Befehle, Profi-Teile kürzer |
| Dauer über 30 Minuten | weniger Aufgaben pro Blatt, 3 statt 5 Ablauf-Schritte, Bastelteil als Extra auslagern |
| Dauer unter 20 Minuten | mehr Spiel-Varianten, Profi-Aufgabe als eigener Ablauf-Schritt |
| Anleitung „zu lang“ / „mehr Details“ | Beispielsätze und Stolpersteine kürzen bzw. ausbauen; Lösungen immer vollständig lassen |
| Blätter „zu viele Aufgaben“ / „mehr“ | 2 statt 3 Aufgaben pro Blatt bzw. ein drittes Blatt |
| Bildschirm „zu viel“ oder „Konnte sie gut aufhören?“ = nein | Pakete auf 5 Levels kürzen, Bildschirm nur jede zweite Einheit, Gerät von Anfang an mit „Wir spielen bis zum Ende-Bildschirm“ ankündigen |
| Bildschirm „zu wenig“ | ein zusätzliches Übungs-Paket für das Wochenende (bleibt optional) |
| Gerätetest: etwas hakt (iPhone, iPad, Android) | Fehler in der Web-App beheben, bevor Paket e6 kommt; Hinweise in der Einleitung (Abschnitt Web-App) ergänzen |
| Links und rechts „noch schwer“ | in jeder Einheit 2 Minuten Roboter-Aufwärmen, Blick nach unten weiter nur im Schwerer-Teil, Extra X9 (absolute Pfeile) **nicht** einschieben |
| Links und rechts „sicher“ | Blick nach unten ab Einheit 6 im Normalteil, Extra X9 als Vergleich anbieten |
| Lieblingsspiel | in späteren Einheiten Varianten davon einbauen (z. B. Roboter-Spiel mit Wenn-dann-Regel in E11) |
| „mehr Bewegung / Basteln / Geheimcodes / Rätsel“ | Block-Reihenfolge anpassen (z. B. Geheimcodes E7 vorziehen), Extras einschieben |
| „Was soll weg?“ | streichen, auch wenn es im Plan steht |
| Sammelpass motiviert nicht | andere Belohnung: Sticker-Leiste pro Blatt, Drachen-Rangstufen, eigene Urkunde nach Einheit 5 |

**So wird angepasst:** zuerst dieser Plan (Abschnitte 4–6 und 10), dann die Sammelpass-Titel (`src/rahmen/04-sammelpass.html`), die Begriffsliste (Abschnitt 7) und der Autoren-Leitfaden, dann der Rückmeldebogen für den nächsten Block (Einheiten 6–10 statt 1–5). Erst dann werden die nächsten Einheiten geschrieben.

---

## 11. Technik

- Quelle: `src/` (HTML-Teile pro Einheit, `styles.css`, `components.js`, Bausteine in `src/bausteine/`), Reihenfolge in `src/buch.json`, Rätsel in `raetsel/eN.json`.
- Bauen: `./baue.sh` → `out/denk-werkstatt.pdf` (alles) und `out/kopiervorlagen.pdf` (nur {{KIND}}s Seiten). Teil-Builds: `./baue.sh --nur 03 --png --dpi 110`, `./baue.sh --nur rahmen --png`.
- Rätsel allein prüfen: `werkzeuge/mit-nix.sh node werkzeuge/raetsel.mjs --bericht`.
- Web-App: `web/` mit demselben Ausführer `web/kern/ausfuehrer.js` und denselben Symbolen `web/kern/symbole.js`; Veröffentlichung über GitHub Pages (`.github/workflows/pages.yml`).
- Regeln und Bausteine zum Schreiben einer Einheit: `vorlagen/AUTOREN-LEITFADEN.md`.
