import { Check, ChevronRight, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { InfluencerFull } from "@/lib/types";
import { profileCompleteness } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Step = "basics" | "socials" | "categories" | "pricing" | "contact";

/**
 * Replaces the bare percentage with the concrete items that are missing,
 * each deep-linking to the wizard step that fixes it.
 */
export async function ProfileChecklist({
  full,
  avatarMissing,
}: {
  full: InfluencerFull;
  avatarMissing: boolean;
}) {
  const t = await getTranslations("dashboard.checklist");
  const p = full.profile;
  const items: { key: string; done: boolean; step: Step | "photo" }[] = [
    { key: "photo", done: !avatarMissing, step: "photo" },
    { key: "bio", done: !!p.bio && p.bio.length >= 40, step: "basics" },
    { key: "socials", done: full.socials.length > 0, step: "socials" },
    { key: "engagement", done: full.socials.some((s) => s.engagement_rate != null), step: "socials" },
    { key: "categories", done: full.categories.length > 0, step: "categories" },
    {
      key: "pricing",
      done: full.services.length > 0 || full.collaboration?.barter === "yes",
      step: "pricing",
    },
    { key: "contact", done: !!full.contact?.contact_email, step: "contact" },
  ];
  const value = profileCompleteness(full);
  const missing = items.filter((i) => !i.done);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-display font-bold">{t("title")}</p>
        <p className="font-display text-2xl font-bold text-brand-600">{value}%</p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("title")}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-700 motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
      {missing.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Check className="h-4 w-4" />
          {t("complete")}
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {items.map((i) => (
            <li key={i.key}>
              <Link
                href={
                  i.step === "photo"
                    ? "/dashboard/profile"
                    : { pathname: "/dashboard/profile", query: { step: i.step } }
                }
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-brand-50",
                  i.done ? "text-muted line-through" : "font-medium text-ink"
                )}
              >
                {i.done ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-brand-400" />
                )}
                <span className="flex-1">{t(`items.${i.key}`)}</span>
                {!i.done && <ChevronRight className="h-4 w-4 text-muted" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">{t("hint")}</p>
    </div>
  );
}
