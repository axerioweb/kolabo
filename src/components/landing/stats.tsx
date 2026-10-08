import { useTranslations } from "next-intl";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";

const stats = ["stat1", "stat2", "stat3", "stat4"] as const;

export function Stats() {
  const t = useTranslations("landing.stats");

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">{t("subtitle")}</p>
      </Reveal>

      <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s}>
            <div className="card h-full p-6 text-center transition-shadow hover:shadow-lift">
              <p className="font-display text-4xl font-bold text-gradient">
                {t(`${s}Value`)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`${s}Label`)}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
