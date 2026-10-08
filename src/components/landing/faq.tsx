import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion";

const items = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

/**
 * Native <details> accordion: every answer is in the HTML (required for
 * the FAQPage JSON-LD on the landing page), no client JS needed.
 */
export function Faq() {
  const t = useTranslations("landing.faq");

  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
      </Reveal>

      <div className="mt-10 space-y-3">
        {items.map((q, i) => {
          const a = q.replace("q", "a") as "a1";
          return (
            <Reveal key={q}>
              <details className="card group overflow-hidden !shadow-none" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold [&::-webkit-details-marker]:hidden">
                  {t(q)}
                  <ChevronDown className="h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{t(a)}</p>
              </details>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
