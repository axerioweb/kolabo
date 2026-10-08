"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";

/**
 * Global motion setup:
 * - LazyMotion + `m.*` components: only the DOM animation feature set is
 *   bundled (~25 KB gzip less than the full `motion.*`). `strict` throws
 *   in dev if someone imports `motion` instead of `m`.
 * - reducedMotion="user": transform animations are skipped for people
 *   who enabled prefers-reduced-motion, while server and client render
 *   the SAME markup. Do NOT branch on useReducedMotion() in render.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
