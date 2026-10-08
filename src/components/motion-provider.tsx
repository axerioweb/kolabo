"use client";

import { MotionConfig } from "framer-motion";

/**
 * Global reduced-motion handling. With reducedMotion="user" framer-motion
 * skips transform/layout animations for people who enabled
 * prefers-reduced-motion, while server and client render the SAME markup.
 *
 * Do NOT branch `initial`/`variants` on useReducedMotion() in render —
 * it is null on the server and true/false on the client, which causes
 * hydration mismatches.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
