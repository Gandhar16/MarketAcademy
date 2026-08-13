/**
 * StatusDot — the small colour-coded dot used next to a status label.
 * Always paired with visible text by its caller; colour is never the only
 * carrier of meaning.
 */
export function StatusDot({ colour }: { colour: string }) {
  return <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: colour }} />;
}
