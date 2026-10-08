import { UserRoundPlus, SlidersHorizontal, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";

const steps = [
  { key: "step1", Icon: UserRoundPlus },
  { key: "step2", Icon: SlidersHorizontal },
  { key: "step3", Icon: Handshake },
] as const;

export function HowItWorks() {
  const t = useTranslations("landing.how");

  return (
    <section id="kako-radi" className="scroll-mt-24 bg-surface-soft py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-soft">{t("subtitle")}</p>
        </Reveal>

        <StaggerGroup className="relative mt-14 grid gap-6 md:grid-cols-3">
          {/* Connecting dashed line (desktop) */}
          <svg
            aria-hidden
            className="pointer-events-none absolute top-12 right-[16%] left-[16%] hidden h-2 md:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 2"
          >
            <line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="#BDA6FF"
              strokeWidth="2"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {steps.map(({ key, Icon }, i) => (
            <StaggerItem key={key}>
              <div className="card relative h-full p-7 text-center transition-all hover:-translate-y-1 hover:shadow-lift">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 opacity-10" />
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lift">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white font-display text-sm font-bold text-brand-600 shadow-soft">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">
                  {t(`${key}Title`)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {t(`${key}Text`)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
