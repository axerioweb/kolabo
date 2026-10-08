import { useTranslations } from "next-intl";
import { PLATFORMS, PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/taxonomy";
import { SocialIcon } from "@/components/social-icons";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";

export function Networks() {
  const t = useTranslations("landing.networks");

  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">{t("subtitle")}</p>
        </Reveal>

        <StaggerGroup className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((p) => (
            <StaggerItem key={p}>
              <div className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/10">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: PLATFORM_COLORS[p] }}
                >
                  <SocialIcon platform={p} className="h-6 w-6" />
                </span>
                <span className="font-display font-semibold">
                  {PLATFORM_LABELS[p]}
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
