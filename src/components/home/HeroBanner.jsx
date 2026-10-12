/*
 * Hero-Banner der Startseite. Das Bild vermittelt auf den ersten Blick das
 * Thema der App (Reparieren/Wiederverwenden von Elektrogeräten); Titel und
 * Claim liegen als Text-Overlay darüber, damit die Aussage unabhängig vom
 * Bildinhalt verständlich bleibt.
 *
 * Bildquelle: Pexels, Foto-ID 6755053 (siehe QUELLEN.md [Q29]).
 * Der Abdunklungsverlauf („Scrim“) wird ausschließlich aus den fünf
 * UI-Farben gemischt — es kommt keine zusätzliche Basisfarbe hinzu.
 */
export function HeroBanner() {
  return (
    <section className="hero">
      <img
        className="hero__img"
        src="/hero.jpg"
        alt="Elektrogeräte reparieren und wiederverwenden statt entsorgen"
      />
      <div className="hero__scrim" />
      <div className="hero__content">
        <h1>mendooR</h1>
        <p>Aus alt mach neu – keine Wissenschaft</p>
        <span className="hero__lead">Gerät scannen · reparieren · weiternutzen</span>
      </div>
    </section>
  );
}
