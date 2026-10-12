/* Kurzmitteilung am unteren Rand. */
export function Toast({ message }) {
  return (
    <div className="toast" data-show={message ? 'true' : 'false'} role="status" aria-live="polite">
      {message || ''}
    </div>
  );
}
