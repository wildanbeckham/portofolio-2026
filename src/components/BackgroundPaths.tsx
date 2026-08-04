"use client";

import { motion, useReducedMotion } from "motion/react";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.6 + i * 0.04,
    opacity: 0.08 + i * 0.015,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-30">
      <svg
        className="h-full w-full text-ink"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.35 }}
            animate={{ pathLength: [0.35, 1, 0.35] }}
            transition={{
              duration: 20 + path.id * 0.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,118,110,0.16),transparent_55%),linear-gradient(180deg,var(--page)_0%,var(--page-elevated)_100%)]" />
      {!reduce ? (
        <>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </>
      ) : null}
    </div>
  );
}
