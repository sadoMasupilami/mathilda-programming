# Herkunft der Bilder

Alle Bilder in diesem Ordner sind eigens für diese Werkstatt erzeugt, die Beschreibungen stehen in `bilder/motive.json`.

- `<id>.webp`: das Bild, 512 px, quadratisch, durchsichtiger Hintergrund, Motiv mittig. Bilder einer Bildfolge (gleiche `gruppe`) haben denselben Ausschnitt.
- `web/kern/erzeugt.js`: dieselben Bilder als data:-Adressen. Diese Datei laden Blätter und Web-App vor allen anderen Kern-Dateien. `symbole.js`, `bilder.js`, `logik.js` und `baum.js` nehmen ein Bild von dort, wenn es da ist, sonst ihre eigene Zeichnung (so laufen Löser und Node-Tests ohne Bilder).
- `umriss/<id>.svg`: Linienzeichnung zum Anmalen für die Heft-Bilder `<m-bild>` (Liste `umriss` in `bilder/motive.json`), als Vektor. `build.mjs` gibt sie den Blättern mit, `<m-bild name="krone">` zeigt sie. Mit `farbe="ja"` kommt das Farbbild, so auch bei den Kasten-Überschriften und auf den Urkunden. Die meisten Heft-Bilder sind dieselben wie in der Rechen-Werkstatt.

Gezeichnet bleiben: Befehls-Pfeile, der leere Stern zum Anmalen, Haken, Wenn-Karten-Rahmen, Spruch-Siegel, Formen, Perlen, Gitter und alles, was in den Spielen gerechnet wird. Die erzeugten Mützen werden in `logik.js` auf die Maße der gezeichneten Mütze gebracht, damit sie auf jeder Figur sitzen.

Erzeugen (Codex CLI, braucht ein Konto mit Bild-Erzeugung):

```bash
werkzeuge/mit-nix.sh node werkzeuge/bilder-erzeugen.mjs                        # alles, was in bilder/roh/ noch fehlt
werkzeuge/mit-nix.sh node werkzeuge/bilder-erzeugen.mjs --nur kobold --neu     # ein Bild noch einmal
werkzeuge/mit-nix.sh node werkzeuge/bilder-erzeugen.mjs --umriss               # Linienzeichnungen, die noch fehlen
```

Aufbereiten (schreibt `bilder/erzeugt/`, `bilder/erzeugt/umriss/` und `web/kern/erzeugt.js` neu):

```bash
nix shell nixpkgs#imagemagick nixpkgs#potrace nixpkgs#nodejs_22 -c node werkzeuge/bilder-verarbeiten.mjs
```

Die Rohbilder (`bilder/roh/`) werden nicht eingecheckt.
