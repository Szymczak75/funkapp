# 📻 FunkApp – Einrichtungsanleitung

## Übersicht

Die App besteht aus zwei Teilen:

* **`server/`** → läuft auf Railway (kostenlos)
* **`frontend/`** → läuft auf GitHub Pages (kostenlos)

\---

## SCHRITT 1 – GitHub Repository erstellen

1. Gehe zu **github.com** und logge dich ein
2. Klicke auf **"New repository"** (grüner Button oben rechts)
3. Name: `funkapp`
4. Stelle auf **Public**
5. Klicke **"Create repository"**
6. Lade alle Dateien aus diesem Paket hoch:

   * `server/` Ordner komplett
   * `frontend/` Ordner komplett

\---

## SCHRITT 2 – Backend auf Railway deployen

1. Gehe zu **railway.app** und klicke **"Login with GitHub"**
2. Klicke **"New Project"** → **"Deploy from GitHub repo"**
3. Wähle dein `funkapp` Repository
4. Wähle den **`server/`** Ordner als Root-Verzeichnis
5. Railway erkennt automatisch Node.js und startet den Server

### Passwort festlegen:

* In Railway → dein Projekt → **Variables** Tab
* Klicke **"+ New Variable"**
* Name: `ROOM\\\_PASSWORD`
* Wert: `deinWunschpasswort`
* Speichern

### Deine Server-URL herausfinden:

* In Railway → **Settings** → **Domains**
* Klicke **"Generate Domain"**
* Du siehst eine URL wie: `walkie-talkie-server-abc123.up.railway.app`
* **Merke dir diese URL!**

\---

## SCHRITT 3 – Frontend konfigurieren

1. Öffne die Datei `frontend/index.html`
2. Suche diese Zeile (ca. Zeile 280):

```javascript
   const SERVER\\\_URL = "DEINE\\\_RAILWAY\\\_URL\\\_HIER";
   ```

3. Ersetze sie mit deiner Railway-URL:

```javascript
   const SERVER\\\_URL = "wss://walkie-talkie-server-abc123.up.railway.app";
   ```

⚠️ Wichtig: `wss://` am Anfang (nicht `https://`)!

4. Speichere die Datei und lade sie wieder auf GitHub hoch

   \---

   ## SCHRITT 4 – GitHub Pages aktivieren

5. In deinem GitHub Repository → **Settings** Tab
6. Linke Leiste: **Pages**
7. Source: **"Deploy from a branch"**
8. Branch: `main` / Ordner: `/frontend`
9. **Save** klicken
10. Nach 1-2 Minuten erscheint deine App-URL:  
`https://DEIN-USERNAME.github.io/funkapp/`

    \---

    ## SCHRITT 5 – Testen \& Teilen

11. Öffne die App-URL im Browser
12. Gib einen Namen ein und das Passwort das du gesetzt hast
13. Öffne denselben Link auf einem anderen Gerät/Browser
14. Beide einloggen → Teilnehmer erscheinen in der Liste
15. Button **halten** → sprechen → loslassen

    ### Link an Teilnehmer schicken:

    ```
🎙️ FunkApp – unser digitales Walkie-Talkie!

    🎙️ FunkApp – unser digitales Walkie-Talkie!

    Link: https://DEIN-USERNAME.github.io/funkapp/
Passwort: deinWunschpasswort

    Einfach Link öffnen, Namen eingeben, fertig!

    ```

   \\---

   ## So benutzt du die App

|Aktion|Beschreibung|
|-|-|
|\*\*📢 Alle\*\*|Alle Teilnehmer hören dich|
|\*\*👤 Auswahl\*\*|Karte antippen → Person markieren → sprechen|
|\*\*Knopf halten\*\*|Sprechen (loslassen = Ende)|
|\*\*Leertaste\*\*|Alternative auf Desktop|

### Dein Szenario:

1. \*\*Info an alle\*\* → Modus "Alle" → Knopf halten
2. \*\*Tipp an eine Person\*\* → Person antippen → Modus wechselt zu "Auswahl" → sprechen
3. \*\*Gruppe ansprechen\*\* → Mehrere Personen antippen → sprechen

\\---

## Häufige Probleme

\*\*Kein Ton?\*\*

\* Browser fragt nach Mikrofon-Erlaubnis → \*\*Erlauben\*\* klicken
\* iOS Safari: Immer erlauben wenn gefragt

\*\*Teilnehmer erscheinen nicht?\*\*

\* Alle müssen das gleiche Passwort eingeben
\* Seite neu laden

\*\*Server nicht erreichbar?\*\*

\* Railway URL prüfen (muss `wss://` haben, nicht `https://`)
\* Railway Dashboard prüfen ob Server läuft

\\---

## Kosten

|Service|Kosten|
|-|-|
|GitHub Pages|Gratis|
|Railway (Hobby Plan)|$5/Monat nach Free-Trial|
|Railway Free Trial|500 Std./Monat gratis|

💡 \*\*Tipp:\*\* Für gelegentliche Nutzung reicht Railway's Free-Tier völlig aus. Der Server schläft bei Inaktivität – beim ersten Aufruf 5-10 Sekunden Wartezeit.

\\---

\*Erstellt mit Claude · Anthropic\*


