import { cn } from "@/lib/utils";

/**
 * LeadForge brand mark: a geometric lightning bolt (forge / energy) on the
 * brand indigo→violet→purple gradient. Self-contained SVG so it renders
 * identically anywhere and scales down cleanly to the favicon.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="lfg"
          x1="6"
          y1="4"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient
          id="lfs"
          x1="24"
          y1="0"
          x2="24"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#lfg)" />
      <rect width="48" height="48" rx="12" fill="url(#lfs)" />
      <path d="M27 7L12 27H21L19 41L36 20H26Z" fill="#ffffff" />
    </svg>
  );
}

/** Mark + "LeadForge" wordmark. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark className={markClassName} />
      <span className="text-lg font-bold tracking-tight">
        Lead<span className="gradient-text">Forge</span>
      </span>
    </span>
  );
}
