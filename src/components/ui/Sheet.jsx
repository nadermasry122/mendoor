/* Bottom-Sheet. Bleibt gemountet, damit die Aufklapp-Animation läuft. */
export function Sheet({ open, children, label }) {
  return (
    <div
      className="sheet"
      data-open={open ? 'true' : 'false'}
      role="dialog"
      aria-modal={open || undefined}
      aria-label={label}
      aria-hidden={!open}
    >
      <div className="sheet__handle" />
      {children}
    </div>
  );
}
