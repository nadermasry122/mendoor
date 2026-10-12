const SCORES = [
  { value: '87%', label: 'Reparierbar', alt: false },
  { value: '62g', label: 'Metalle', alt: true },
  { value: '0.3g', label: 'Gold', alt: true },
];

/* Kennzahlen-Reihe auf dem Ergebnis-Screen (Platzhalterdaten). */
export function ScoreRow() {
  return (
    <div className="score-row">
      {SCORES.map((s) => (
        <div key={s.label} className={`score-pill ${s.alt ? 'score-pill--alt' : ''}`}>
          <div className="score-pill__val">{s.value}</div>
          <div className="score-pill__lbl">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
