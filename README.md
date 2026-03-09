# KommUnikation 💬

**AAC-Kommunikationshilfe für Menschen, die nicht sprechen können.**

KommUnikation ist eine webbasierte App (Progressive Web App), mit der Nutzer durch Antippen von Symbolen und Bildern ihre Bedürfnisse mitteilen können. Die App spricht den gewählten Begriff per Text-to-Speech laut aus.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen.svg)
![Languages](https://img.shields.io/badge/Sprachen-5-orange.svg)

---

## ✨ Features

- **Symbol-Kommunikation** – Tippe auf ein Bild/Emoji, um einen Satz laut aussprechen zu lassen
- **Mehrere Ebenen** – Kategorien → Unterkategorien → Einzelsymbole (z. B. Essen → Obst → Apfel)
- **11 Kategorien** – Essen, Trinken, Spielen, Raus gehen, Toilette, Schlafen, Gefühle, Antworten, Schmerzen, HILFE
- **5 Sprachen** – Deutsch 🇩🇪, Englisch 🇬🇧, Türkisch 🇹🇷, Ukrainisch 🇺🇦, Russisch 🇷🇺
- **Text-to-Speech** – Sprachausgabe in der gewählten Sprache (Web Speech API)
- **Anpassbar** – Eigene Bilder hochladen, Texte ändern, eigene Sounds aufnehmen
- **PWA** – Installierbar auf Handy/Tablet, offline nutzbar
- **Kein Server nötig** – Läuft komplett im Browser, alle Daten lokal (IndexedDB)
- **Responsiv** – Optimiert für Tablets, Handys und Desktop

## 📸 Screenshots

| Hauptmenü | Unterkategorie | Einstellungen |
|-----------|---------------|---------------|
| 11 Kategorien als große Kacheln mit Emojis | Einzelsymbole zum Antippen | Sprachauswahl & Bearbeitungsmodus |

## 🚀 Schnellstart

### Option 1: Direkt im Browser öffnen
```
index.html im Browser öffnen (Doppelklick)
```
> Für volle PWA-Funktionalität (Offline, Installieren) einen lokalen Server verwenden:

### Option 2: Mit lokalem Server
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# Dann im Browser öffnen:
# http://localhost:8080
```

### Option 3: Online nutzen (GitHub Pages)
Die App ist live verfügbar unter:

**https://fryntvitali.github.io/KommunikationsApp/**

Einfach im Browser öffnen — funktioniert auf jedem Gerät.

### Option 4: Als PWA installieren

**Android (Chrome):**
1. App im Chrome öffnen
2. Auf das Installations-Symbol in der Adressleiste tippen
3. „Installieren" bestätigen

**iPhone / iPad (Safari):**
1. App in Safari öffnen
2. Teilen-Button tippen (Quadrat mit Pfeil)
3. „Zum Home-Bildschirm" wählen
4. „Hinzufügen" tippen

**Windows / Mac (Chrome/Edge):**
1. App im Browser öffnen
2. Auf das Installations-Symbol in der Adressleiste klicken
3. „Installieren" bestätigen

Die App funktioniert danach auch **offline** — alle Daten werden lokal gespeichert.

## 📁 Projektstruktur

```
KommunikationsApp/
├── index.html          # Haupt-HTML (App-Shell)
├── manifest.json       # PWA-Manifest
├── sw.js               # Service Worker (Offline-Cache)
├── css/
│   └── style.css       # Komplettes Styling (Responsive Grid, Modals, Animationen)
├── js/
│   ├── i18n.js         # Internationalisierung (5 Sprachen, UI-Übersetzungen)
│   ├── data.js         # Alle Kategorien & Symbole (mehrsprachig)
│   ├── storage.js      # IndexedDB-Wrapper (Benutzeranpassungen)
│   └── app.js          # Hauptlogik (Rendering, Navigation, TTS, Bearbeitung)
└── icons/
    ├── icon-192.png    # PWA-Icon 192×192
    └── icon-512.png    # PWA-Icon 512×512
```

## 🌍 Unterstützte Sprachen

| Sprache | Code | TTS | UI | Daten |
|---------|------|-----|----|-------|
| Deutsch 🇩🇪 | `de` | ✅ | ✅ | ✅ |
| English 🇬🇧 | `en` | ✅ | ✅ | ✅ |
| Türkçe 🇹🇷 | `tr` | ✅ | ✅ | ✅ |
| Українська 🇺🇦 | `uk` | ✅ | ✅ | ✅ |
| Русский 🇷🇺 | `ru` | ✅ | ✅ | ✅ |

Weitere Sprachen geplant: Französisch, Spanisch, Italienisch, Portugiesisch, Niederländisch, Polnisch, Arabisch, Farsi, Tschechisch, Kroatisch, Serbisch, Dänisch, Schwedisch, Norwegisch, Finnisch, Isländisch.

## 🎯 Kategorien

| Kategorie | Emoji | Beschreibung |
|-----------|-------|-------------|
| Essen | 🍽️ | Speisen (+ Unterkategorien: Obst, Süßigkeiten) |
| Trinken | 🥤 | Getränke |
| Spielen | 🎮 | Aktivitäten & Spiele |
| Raus gehen | 🚶 | Orte & Ausflüge |
| Toilette | 🚽 | Körperpflege |
| Schlafen | 😴 | Müdigkeit & Ruhe |
| Gefühle | 😊 | Emotionen ausdrücken |
| Antworten | 💬 | Ja, Nein, Danke, Bitte, etc. |
| Schmerzen | 🤕 | Wo tut es weh? |
| HILFE | 🆘 | Sofort-Hilferuf |

## ⚙️ Anpassungen

Im **Bearbeitungsmodus** (Einstellungen → Bearbeitungsmodus aktivieren) kann jedes Symbol angepasst werden:

- **Bild ändern** – Eigenes Foto/Bild hochladen (max. 2 MB)
- **Text ändern** – Beschriftung und gesprochenen Text ändern
- **Sound aufnehmen** – Eigenen Sound per Mikrofon aufnehmen

Alle Anpassungen werden lokal im Browser gespeichert (IndexedDB) und bleiben nach dem Neuladen erhalten.

## 🔧 Technologie

- **HTML5 / CSS3 / Vanilla JavaScript** – Kein Framework, keine Build-Tools
- **Web Speech API** – Text-to-Speech in verschiedenen Sprachen
- **IndexedDB** – Lokale Datenspeicherung für Anpassungen
- **MediaRecorder API** – Sound-Aufnahme per Mikrofon
- **Service Worker** – Offline-Caching für PWA
- **CSS Grid** – Responsives Kachel-Layout

## 🤝 Mitmachen

Beiträge sind willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

- **Neue Sprachen** hinzufügen (in `js/i18n.js` und `js/data.js`)
- **Neue Kategorien/Symbole** ergänzen (in `js/data.js`)
- **Bugs melden** über GitHub Issues
- **Design-Verbesserungen** vorschlagen

## 📄 Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

---

**Entwickelt mit ❤️ für Menschen, die eine Stimme brauchen.**
