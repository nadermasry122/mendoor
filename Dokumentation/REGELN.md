# Dokumentations- und Arbeitsregeln — mendooR

> **Zweck:** Dieses Dokument hält die verbindlichen Regeln für die Zusammenarbeit am Projekt und an der Bachelorarbeit fest. Es wird bei Bedarf erweitert — Änderungen werden unten im Änderungsprotokoll geführt.
> **Stand:** 29.09.2026

---

## 1. Dateien und ihre Rollen (Single Source of Truth)

| Datei | Beantwortet | Charakter | Darf NICHT enthalten |
|---|---|---|---|
| `BACHELORARBEIT.md` | *Wissenschaftlicher Fließtext* der Arbeit | Fließtext, Quellen als `[Qn]` | rohe Debug-Logs, Session-Notizen |
| `QUELLEN.md` | *Welche* Quellen gibt es | zweistufiges Register (A: in der Arbeit zitiert · B: nur Arbeitsdokumente), stabile Schlüssel `[Qn]` | Diskussion, Bewertung |
| `ENTSCHEIDUNGEN.md` | *Warum* wurde etwas so entschieden | thematisch, ADR-Stil | Code-Dumps |
| `PROTOKOLLE.md` | *Was* geschah in welcher Sitzung | chronologisch | Wiederholung getroffener Entscheidungen |
| `EVALUATION.md` | *Messdaten* für Kapitel 8 | Tabellen, Kennzahlen | Begründungen |
| `CHANGELOG.md` | *Kleine* Änderungen im Überblick | chronologisch, eine Zeile je Eintrag | Begründungen, Prosa |
| `DOKUMENTATION.md` | *Wie* das System gebaut ist (Ist-Stand) | technische Referenz | Entscheidungsbegründungen |
| `REGELN.md` | *Regeln* dieser Zusammenarbeit | lebendes Dokument | Projektinhalte |

**Leitprinzip:** Redundanz vermeiden. Inhalte werden **verwiesen**, nicht kopiert. Wächst ein Inhalt, lebt er an *genau einer* Stelle.

---

## 2. Was ist dokumentationswürdig?

### 2.1 Große Änderung / Entscheidung → `ENTSCHEIDUNGEN.md` (ADR)
Eine Änderung ist „groß", wenn **mindestens eines** zutrifft:

- sie berührt die **Architektur** (Datenfluss, neue Komponente, Deployment),
- sie hängt von einer **externen Abhängigkeit** ab oder ändert sie,
- sie etabliert oder ändert ein **UX-/UI-Muster**,
- sie betrifft **Datenhaltung, Sicherheit oder Recht** (z. B. DSGVO, API-Schlüssel, Nutzungsbedingungen),
- sie **widerspricht einer früheren Entscheidung** (dann muss die frühere als „abgelöst" markiert werden),
- sie ändert die **Erkennungs-/Extraktionslogik** (Kernfunktion).

### 2.2 Kleine Änderung → `CHANGELOG.md`
Alles andere: Bugfix, Textkorrektur, Styling-Detail, kleine Refaktorierung. **Eine Zeile:** Datum · Bereich · was.

### 2.3 Sitzung → `PROTOKOLLE.md`
Jede Arbeitssitzung erhält einen Eintrag: Datum, Ziel, Ergebnis, aufgetretene Fehler, nächste Schritte. Keine Wiederholung von Entscheidungsbegründungen — dort nur ein Verweis.

### 2.4 Thesis-Relevanz
Jede große Entscheidung vermerkt, **in welches Kapitel** der Arbeit sie fließt (Traceability). Fehlt ein passendes Kapitel, wird ein neues **kanonisch** angelegt (fortlaufende Nummer, in der Gliederung geführt) — nicht als loser Anhang.

---

## 3. Aufbau eines Entscheidungseintrags (ADR)

Jeder Eintrag in `ENTSCHEIDUNGEN.md` folgt diesem Schema:

```
### [Kürzel] Titel
- **Status:** aktiv | abgelöst durch [Kürzel] | verworfen
- **Datum:** JJJJ-MM-TT
- **Thesis-Kapitel:** z. B. 5.2
- **Kontext:** Welches Problem/welche Anforderung?
- **Optionen:** Welche Wege standen zur Wahl?
- **Entscheidung:** Was wurde gewählt?
- **Begründung:** Warum — mit Quellen `[Qn]`.
- **Verworfene Alternativen:** Warum nicht — das ist der wertvollste Teil.
- **Konsequenzen / Grenzen:** Was folgt daraus, was bleibt offen?
```

Der Abschnitt **„Verworfene Alternativen"** ist Pflicht. In einer wissenschaftlichen Arbeit belegt gerade das Verworfene die Qualität der Entscheidung.

---

## 4. Fehlerdokumentation

Jeder relevante Fehler wird nach festem Schema erfasst (im Protokoll, ggf. als Erkenntnis in die Thesis):

```
Symptom → Diagnose → Ursache → Lösung → Erkenntnis
```

Die **Erkenntnis** wird verallgemeinert formuliert (nicht „Bug X behoben", sondern die übertragbare Lehre), damit sie in der Reflexion wiederverwendbar ist.

---

## 5. Quellen und Belege

- **Jede** Technologie- und Designentscheidung wird belegt — keine unbelegten Verallgemeinerungen.
- **Designfragen** folgen der festen Hierarchie (siehe `ENTSCHEIDUNGEN.md`, Abschnitt „Methodik"):
  1. Apple HIG · 2. Google *Mobile App UX Principles* · 3. Google *Interactive Canvas Design* · (Basis:) Google *Actions SDK*.
- **Technikfragen** werden mit Primärquellen (offizielle Dokumentation) und, wo vorhanden, mit wissenschaftlichen Papern belegt.
- **Ein Master-Register:** Alle Quellen werden in `QUELLEN.md` mit **stabilen Schlüsseln `[Qn]`** geführt (einzige Quelle der Wahrheit). Es ist zweistufig: **Teil A** = in der Arbeit zitiert, **Teil B** = nur in Arbeitsdokumenten. Arbeitsdokumente referenzieren ausschließlich den Schlüssel.
- **Nummerierung der Arbeit:** Die Thesis führt seit 29.10.2026 ein **eigenes, fortlaufendes Verzeichnis** `[1]…[n]` (Reihenfolge der ersten Fundstelle) und ist ohne den Doku-Ordner lesbar. Die stabilen `[Qn]`-Schlüssel gelten nur noch in den Arbeitsdokumenten; bei Änderungen an den Zitaten wird die Thesis-Nummerierung mechanisch neu erzeugt.
- Bei Web-Quellen wird das **Abrufdatum** im Register vermerkt.

---

## 6. Sicherheit, Ehrlichkeit und Konsistenz

- **Keine Geheimnisse in Dateien.** API-Schlüssel, Tokens und Zugangsdaten dürfen **niemals** in Quellcode, Konfigurationsdateien, Textdateien oder Commits stehen. Sie werden ausschließlich im **Cloudflare Secrets Store** gehalten und im Code über Env-Bindings gelesen (`await env.X.get()`) — nie literal notiert.
- **Umgang mit einer Offenlegung:** Ein einmal offengelegter Schlüssel ist dauerhaft als kompromittiert zu behandeln. Vorgehen: (1) Schlüssel beim Anbieter **rotieren/löschen**, (2) neuen Wert nur im Secrets Store hinterlegen, (3) Fundstelle aus allen Dateien entfernen, (4) prüfen, ob er in der Git-Historie liegt (ggf. Historie bereinigen).
- **Vor jedem Commit** prüfen, dass keine Secret-Dateien enthalten sind (`.env*`, `.dev.vars*`, `*.key`, `*.pem`).

- **Keine erfundenen Inhalte.** Fehlende Abschnitte werden als `[LÜCKE]` markiert.
- **Widersprüche werden sichtbar gemacht**, nicht stillschweigend geglättet (z. B. „Android" vs. tatsächliche Web-App). Freigegebener Text wird nicht stillschweigend inhaltlich verändert; Abweichungen werden als Konsistenzhinweis ausgewiesen.
- **Vorläufige Einschätzungen** werden bei Korrektur als solche gekennzeichnet und nicht rückwirkend „weggeglättet".
- **Externe Randbedingungen** (z. B. Policy-Änderungen Dritter) werden separat geführt, damit klar bleibt, dass sie nicht selbstverschuldet sind.

---

## 7. Sprache und Stil

- **Projekt-/Arbeitsdokumente** (`REGELN`, `PROTOKOLLE`, `CHANGELOG`, `DOKUMENTATION`): Deutsch, technisch, knapp.
- **Thesis** (`BACHELORARBEIT.md`): wissenschaftlicher Fließtext, sachlich, keine direkte Nutzeransprache, Quellen nach Kapitel 5.
- **Entscheidungen:** sachlich, begründend, ohne Werbesprache.

---

## 8. Arbeitsweise (Workflow)

1. **Ziel & Fokus** der Sitzung zu Beginn festhalten.
2. **Eine große Entscheidung → ein ADR**; kleine Änderungen sammeln sich im Changelog.
3. **Testen vor Dokumentieren**, wenn möglich; sonst Teststatus ehrlich vermerken.
4. **Sitzungsende:** Protokolleintrag + (falls nötig) ADR + Thesis-Abschnitt + nächster Plan.
5. **Thesis wächst parallel**, nicht erst am Ende: Jede abgeschlossene Entscheidung wird zeitnah in Fließtext überführt und dem passenden Kapitel zugeordnet.
6. **Rohdaten für die Evaluation** (Messwerte, Testfälle, Nutzerbeobachtungen) direkt beim Entstehen mitschreiben, nicht rekonstruieren.

---

## 9. Änderungsprotokoll dieser Regeln

| Datum | Änderung |
|---|---|
| 2026-09-29 | Erstfassung: Dateirollen, Dokumentationswürdigkeit, ADR-Schema, Fehler-/Quellenregeln, Workflow, Trennung von Arbeitsdokument und Thesis-Text. |
| 2026-09-29 | Quellen auf Master-Register `QUELLEN.md` mit stabilen `[Qn]`-Schlüsseln umgestellt; `EVALUATION.md` als Pflicht-Erfassung aufgenommen. |
| 2026-09-29 | Sicherheitsabschnitt ergänzt (keine Geheimnisse in Dateien; Rotationspflicht bei Offenlegung). |
| 2026-10-29 | Thesis-Nummerierung `[1]…[n]` mit eigenem Quellenverzeichnis eingeführt; `[Qn]` nur noch in Arbeitsdokumenten. |
| 2026-10-29 | Quellenregister zweistufig: Teil A (39, in der Arbeit zitiert) und Teil B (17, nur Arbeitsdokumente). |
