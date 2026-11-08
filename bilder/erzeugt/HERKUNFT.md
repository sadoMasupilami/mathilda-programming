# Herkunft der Bilder

Alle Bilder in diesem Ordner sind eigens für diese Werkstatt erzeugt, die Beschreibungen stehen in `bilder/motive.json`.

- `<id>.webp`: das Bild, 512 px, quadratisch, durchsichtiger Hintergrund, Motiv mittig. Bilder einer Bildfolge (gleiche `gruppe`) haben denselben Ausschnitt.
- `web/kern/erzeugt.js`: dieselben Bilder als data:-Adressen. Diese Datei laden Blätter und Web-App vor allen anderen Kern-Dateien. `symbole.js`, `bilder.js`, `logik.js` und `baum.js` nehmen ein Bild von dort, wenn es da ist, sonst ihre eigene Zeichnung (so laufen Löser und Node-Tests ohne Bilder).

Gezeichnet bleiben: Befehls-Pfeile, Stern, Ziel-Fahne, Haken, Wenn-Karten-Rahmen, Spruch-Siegel, Mützen, Formen, Perlen, Gitter und alles, was in den Spielen gerechnet wird.

Erzeugen (Codex CLI, braucht ein Konto mit Bild-Erzeugung):

```bash
werkzeuge/mit-nix.sh node werkzeuge/bilder-erzeugen.mjs                        # alles, was in bilder/roh/ noch fehlt
werkzeuge/mit-nix.sh node werkzeuge/bilder-erzeugen.mjs --nur kobold --neu     # ein Bild noch einmal
```

Aufbereiten (schreibt `bilder/erzeugt/` und `web/kern/erzeugt.js` neu):

```bash
nix shell nixpkgs#imagemagick nixpkgs#nodejs_22 -c node werkzeuge/bilder-verarbeiten.mjs
```

Die Rohbilder (`bilder/roh/`) werden nicht eingecheckt.
