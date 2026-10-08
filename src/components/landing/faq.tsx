"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

const items = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export function Faq() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = useState<string | null>("q1");

  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
      </Reveal>

      <div className="mt-10 space-y-3">
        {items.map((q) => {
          const isOpen = open === q;
          const a = q.replace("q", "a") as "a1";
          return (
            <Reveal key={q}>
              <div className="card overflow-hidden !shadow-none">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : q)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                >
                  {t(q)}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                        {t(a)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
