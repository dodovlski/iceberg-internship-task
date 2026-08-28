/** Lightweight confetti shapes for marketing sections ,  hidden on small screens */

const shapes = [
  { className: "top-8 right-[12%] h-4 w-4 rotate-12 bg-secondary", shape: "rounded-full" },
  { className: "top-24 right-[8%] h-3 w-3 -rotate-6 bg-tertiary", shape: "rounded-sm" },
  { className: "bottom-16 left-[6%] h-5 w-5 rotate-45 bg-quaternary", shape: "rounded-sm" },
  { className: "top-1/3 left-[4%] h-3 w-3 bg-primary", shape: "rounded-full" },
] as const;

export function ConfettiDots({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`} aria-hidden>
      {shapes.map((item, i) => (
        <span
          key={i}
          className={`absolute hidden border-2 border-ink md:block ${item.className} ${item.shape}`}
        />
      ))}
    </div>
  );
}

export function SquiggleUnderline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="12"
      viewBox="0 0 120 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 8C20 2 40 14 60 6C80 -2 100 10 118 4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-secondary"
      />
    </svg>
  );
}
