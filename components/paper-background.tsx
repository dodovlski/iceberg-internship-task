export function PaperBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-background" aria-hidden>
      <div className="absolute inset-0 bg-dot-grid opacity-40" />
      <div className="absolute -right-24 top-32 hidden h-48 w-48 rounded-full bg-secondary/25 blur-2xl md:block" />
      <div className="absolute -left-12 bottom-24 hidden h-36 w-36 rounded-full bg-quaternary/20 blur-2xl md:block" />
    </div>
  );
}
