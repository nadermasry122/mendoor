/* Lade-Platzhalter für Listen. */
export function SkeletonCard() {
  return (
    <div className="skeleton">
      <div className="skeleton__img shimmer" />
      <div className="skeleton__lines">
        <div className="skeleton__line shimmer" />
        <div className="skeleton__line skeleton__line--short shimmer" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />);
}
