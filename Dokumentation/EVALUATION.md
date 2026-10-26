# Evaluation — mendooR

> **Zweck:** Erfassung der Messdaten für Kapitel 8 der Bachelorarbeit (Evaluation). Daten werden **während** der Nutzung/Entwicklung mitgeschrieben — was nicht erfasst wird, ist später nicht rekonstruierbar.
> **Regeln:** Siehe `REGELN.md` §8.6. Kapitelzuordnung: `BACHELORARBEIT.md` Kap. 8.
> **Stand:** 20.10.2026

---

## 1. Messdimensionen

Aus der Entwicklung ergibt sich eine **mehrdimensionale Messgröße** (siehe `BACHELORARBEIT.md` 6.5 und 7.5):

1. **OCR-Qualität** — Zeichenerkennungsrate der Engine auf dem Kamerabild.
2. **Verwertbarkeit** — Anteil der Fälle, in denen die Pipeline (Rausch-Gate → Typenschild-Filter → Extraktion) die **korrekte Modellbezeichnung** in die Vorschlagsliste aufnimmt.

Zusätzlich erhoben:
3. **Rausch-Resistenz** — Anteil der Nicht-Typenschild-Scans, die korrekt **keine** Kandidaten liefern (Vermeidung von False Positives).
4. **Suchtrefferquote** — Anteil der Fälle, in denen die Anleitungssuche mindestens einen passenden Treffer liefert.
5. **Latenz** — Zeit zwischen Auslöser und Ergebnisanzeige (Ziel: ≤ ~1 s).
6. **KI-Assistenz** — Quellenabdeckung, Fakten-Treue, deutsche Qualität, Latenz und Neurons/Anfrage (Details in §6).

---

## 2. Erfassungsanleitung (Feldtest)

1. App mit `?debug=1` öffnen → der Debug-Block zeigt den **Vision-Rohtext**.
2. Scan wie im Alltag durchführen.
3. Ergebnis in die Tabelle 2.1 eintragen; tatsächliches Modell des Geräts **vorher** notieren (nicht vom Ergebnis ableiten!).
4. Bedingung möglichst prägnant beschreiben (Licht, Winkel, Distanz, Oberfläche).

> **Wichtig:** Das tatsächliche Modell wird unabhängig vom Scan-Ergebnis bestimmt. Nur so ist eine Aussage über korrekt/inkorrekt möglich.

---

## 3. Feldtest — Erfassungstabelle

*Noch keine Feldtestdaten erfasst. Ab jetzt bei jedem Testscan ausfüllen.*

| ID | Datum | Kategorie | Gerät (tatsächlich) | Bedingung | Vision-Rohtext (Auszug) | Kandidat(en) | korrekt | Latenz (s) | Anleitungs-Treffer | Anmerkung |
|----|-------|-----------|---------------------|-----------|--------------------------|--------------|---------|-----------|--------------------|-----------|
| F001 | | | | | | | | | | |
| F002 | | | | | | | | | | |
| F003 | | | | | | | | | | |

*Kategorien gemäß Elektroaltgeräte-Systematik: Wärmeüberträger · Bildschirme · Lampen · Großgeräte · Kleingeräte · IT & Telekom.*

---

## 4. Dokumentierte Laborvalidierung (isoliert)

Diese Fälle wurden während der Entwicklung an konstruierten bzw. realen Beispielen geprüft (Stand 30.07.2026). Sie gelten **nicht** als Feldtest, belegen aber die Funktion der Extraktionsregeln und dienen als Regressionstest.

| Fall | Erwartung | Ergebnis |
|---|---|---|
| Samsung-Verpackungsetikett | Modellnummer erkennen | `SM-A115A1L`, `SAMSUNG` |
| Apple-Geräterückseite | Modellnummer erkennen | `iPhone`, `A2890` |
| Bosch-Typenschild + Anleitungstext | Prosa verwerfen | `Bosch Serie 6`, `WAT28401` |
| Reiner Beipackzettel (nur Prosa) | keine Kandidaten | leere Ausgabe |
| Netzteil-Typenschild | Modellnummer erkennen | `EP-TA200` |
| Boden-/Wandscan (kein Text) | keine Kandidaten | verworfen (Rausch-Gate) |
| „Latitude 7421" (ungelistete Produktlinie) | erkennen | `Latitude 7421` |
| Fiktive Marke, Code `7B4XK21Q` | erkennen | `7B4XK21Q` |
| „220–240V ~ 50Hz" | ausschließen | korrekt ausgeschlossen |
| Chinesischer Fließtext | als Prosa verwerfen | verworfen |
| Kurzes CJK-Typenschild (Label+Code) | nicht verwerfen | erkannt |

---

## 5. Auswertung (nach Datenerhebung)

### 5.1 Kennzahlen

| Kennzahl | Formel | Wert |
|---|---|---|
| Extraktionsrate | korrekte Kandidaten / Feldtestfälle | `[offen]` |
| Rausch-Resistenz | korrekt leere / Nicht-Typenschild-Scans | `[offen]` |
| Suchtrefferquote | Fälle mit ≥1 passendem Treffer / Fälle | `[offen]` |
| Mittlere Latenz | Σ Latenz / Fälle | `[offen]` |

### 5.2 Testdatensatz-Anforderungen

Für eine belastbare Aussage sollte der Datensatz abdecken:
- alle sechs Gerätekategorien,
- variierende Bedingungen (hell/dunkel, frontal/schräg, nah/fern, matt/reflektierend),
- Typenschilder in unterschiedlichen Beschriftungssprachen (insb. nicht-lateinisch).

### 5.3 Nutzerbeobachtungen

Qualitative Beobachtungen aus realer Nutzung (z. B. Subreddit-Mismatch, fehlende Zahl bei „iPhone 14") werden hier gesammelt und fließen in Kapitel 4 (Anforderungen) und 8 ein.

| Datum | Beobachtung | Folge |
|---|---|---|
| 2026-09-25 | Subreddit-Suche passt nicht immer zum Gerät | ToDo: Suchlogik verfeinern |
| 2026-09-25 | Wunsch nach YouTube/Google-Anbindung | ToDo: Quellen erweitern |
| 2026-09-25 | Wunsch nach Recyclinghöfen in der Nähe | ToDo: Entsorgungsfunktion |
| 2026-10-21 | Websuche „latitude 7420“ liefert in der App keine Treffer; ohne Domain-Allowlist erscheint das offizielle Dell-Handbuch als zweiter Treffer | ADR D8: offene Websuche + Trust-Ranking |

---

## 6. KI-Assistenz (RAG + Workers AI)

**Status:** `[OFFEN]` — implementiert (Stufe 1+2, ADR D6/D7), aber noch nicht gemessen.

### 6.1 Messgrößen

| Kennzahl | Definition | Anmerkung |
|---|---|---|
| **Quellen-Recall** | Anteil der Geräte, für die mindestens eine relevante Quelle gefunden wird | Getrennt nach iFixit/Archiv/Web |
| **Quellenabdeckung** | Anteil der inhaltlichen Aussagen mit gültiger Citation `[n]` | Manuelle Prüfung gegen die Quellenliste |
| **Fakten-Treue** | 5-Punkt-Skala: Sind Aussagen durch die Quellen gedeckt? | Zusätzlich Anteil nicht belegter Aussagen |
| **Deutsche Sprachqualität** | 5-Punkt-Skala: Verständlichkeit, Terminologie, keine Anglizismen-Fehler | Zwei unabhängige Bewertungen |
| **Latenz** | Retrieval + AI-Aufruf, p50/p95 | Getrennt messen |
| **Neurons/Anfrage** | Verbrauch pro Assistenz-Anfrage | Cloudflare-Dashboard bzw. `usage`-Feld |
| **Fehlerquote** | `no_sources`, `AI_ERROR`, `AI_TIMEOUT` / Anfragen | Fallback muss erhalten bleiben |
| **Safety** | Anteil der Antworten mit Warnhinweis bei Akku/Netz/Wasser | Manuelle Prüfung |

### 6.2 Testaufbau

- **Testset:** 20–30 reale Scans aus allen sechs Gerätekategorien; tatsächliches Gerät unabhängig notieren.
- **Pro Anfrage erfassen:** Gerät, gefundene Quellen, Antwort, Citations, Latenz, Neurons, Fehler.
- **Modellvergleich:** `gpt-oss-20b` (implementiert) gegen Qwen3-30B-A3B und Llama 3.1 8B als Baseline.
- **Prompt-Injection-Test:** Eine Quelle enthält eine eingebettete Anweisung; das Modell darf sie nicht ausführen und muss bei den Quellen bleiben.
- **Abbruchkriterien:** keine Antwort ohne Quellen; bei fehlenden Quellen klare Lücke; bei AI-Fehler bleibt die Quellenliste nutzbar.

### 6.3 Erfassungstabelle

| ID | Datum | Gerät | Quellen (n) | Quellen-Recall | Quellenabdeckung | Fakten-Treue (1–5) | Deutsch (1–5) | Latenz (s) | Neurons | Fehler | Anmerkung |
|---|---|---|---|---|---|---|---|---|---|---|---|
| K001 | | | | | | | | | | | |
| K002 | | | | | | | | | | | |
| K003 | | | | | | | | | | | |

*Ergebnisse werden nicht geschätzt; nicht erhobene Werte bleiben `[offen]`.*

### 6.4 Websuche — geplante Messung (D8)

**Status:** D8 umgesetzt (2026-10-26); Live-Messung mit Tavily ausstehend.

**Testset (erweitert, ADR D8):** mindestens ein Gerät je Elektroaltgeräte-Kategorie plus Sprach- und Obsolet-Fälle —
- IT & Telekom: Dell Latitude 7420, iPhone 14 Pro, MacBook Pro 13, Samsung Galaxy S21, Sony WH-1000XM4
- Großgeräte: Bosch Serie 6 (Waschmaschine), Kühlschrank (z. B. Bosch/Siemens)
- Kleingeräte: DeLonghi/Jura Kaffeemaschine, Toaster/Mixer
- Bildschirme: Dell/LG-Monitor
- Lampen: Philips Hue/LED
- Wärmeüberträger: Daikin/Vaillant Wärmepumpe
- Sprache: Xiaomi (CN), Sony (JP), rein englisch dokumentiertes Gerät
- Obsolet: alte Digitalkamera (nur Internet Archive)

**Pro Fall erfassen:** verwendete Query, Top-5-Quellen mit Domain und Typ, offizielles Herstellerhandbuch in Top 5 (ja/nein), Precision@5 (manuelle Prüfung), Nulltreffer (ja/nein), Latenz, Tavily-Credits.

**Varianten:** (A) bisherige Domain-Allowlist (Baseline), (B) offene Suche ohne Ranking, (C) offene Suche + Trust-Ranking, (D) zusätzlich Marken-Inferenz und bilinguale Dokumentationsbegriffe. Umgesetzt ist (C)+(D); (A) dient als Vergleichsbasis.

| ID | Datum | Gerät | Variante | Query | Offizielles Handbuch in Top 5 | Precision@5 | Nulltreffer | Latenz (s) | Credits | Anmerkung |
|---|---|---|---|---|---|---|---|---|---|---|
| W001 | | Dell Latitude 7420 | | | | | | | | |
| W002 | | iPhone 14 Pro | | | | | | | | |
| W003 | | Bosch Serie 6 (Waschmaschine) | | | | | | | | |
| W004 | | Sony WH-1000XM4 | | | | | | | | |
