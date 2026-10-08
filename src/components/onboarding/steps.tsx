"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  AGE_RANGES,
  AGE_RANGE_LABELS,
  AUDIENCE_GENDERS,
  AUDIENCE_GENDER_LABELS,
  BARTER_PREFERENCES,
  BARTER_PREF_LABELS,
  BARTER_TYPES,
  BARTER_TYPE_LABELS,
  CATEGORIES,
  CATEGORY_GROUPS,
  CONTACT_CHANNELS,
  CONTACT_CHANNEL_LABELS,
  CONTENT_LANGUAGES,
  COUNTRIES,
  COUNTRY_LABELS,
  CURRENCIES,
  FOLLOWER_RANGES,
  FOLLOWER_RANGE_LABELS,
  GENDERS,
  GENDER_LABELS,
  MAX_CATEGORIES,
  PLATFORMS,
  PLATFORM_LABELS,
  SERVICE_TYPES,
  SERVICE_LABELS,
  label,
  type CategoryGroupSlug,
  type Platform,
} from "@/lib/taxonomy";
import type { OnboardingData, SocialInput } from "@/lib/onboarding-types";
import { Field, Input, Textarea, Select, ChipToggle, Toggle } from "@/components/ui/form";
import { SocialIcon } from "@/components/social-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StepProps = {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
};

/* ---------------------------------------------------------------- */
/* Step 1 — Basics                                                   */
/* ---------------------------------------------------------------- */

export function BasicsStep({ data, update }: StepProps) {
  const t = useTranslations("onboarding.basics");
  const tc = useTranslations("common");
  const locale = useLocale();
  const b = data.basics;
  const set = (patch: Partial<typeof b>) =>
    update({ basics: { ...b, ...patch } });

  const years: number[] = [];
  const now = new Date().getFullYear();
  for (let y = now - 13; y >= now - 70; y--) years.push(y);

  return (
    <div className="space-y-5">
      <Field label={t("username")} hint={t("usernameHint")}>
        <Input
          value={b.username}
          onChange={(e) => set({ username: e.target.value })}
          placeholder="milica.style"
        />
      </Field>
      <Field label={t("bio")}>
        <Textarea
          value={b.bio}
          onChange={(e) => set({ bio: e.target.value })}
          placeholder={t("bioPlaceholder")}
          maxLength={400}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("birthYear")} optional={tc("optional")}>
          <Select
            value={b.birth_year}
            onChange={(e) => set({ birth_year: e.target.value })}
          >
            <option value="">—</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("gender")} optional={tc("optional")}>
          <Select
            value={b.gender}
            onChange={(e) => set({ gender: e.target.value as typeof b.gender })}
          >
            <option value="">—</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {label(GENDER_LABELS[g], locale)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("country")}>
          <Select
            value={b.country}
            onChange={(e) =>
              set({ country: e.target.value as typeof b.country })
            }
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {label(COUNTRY_LABELS[c], locale)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("city")}>
          <Input
            value={b.city}
            onChange={(e) => set({ city: e.target.value })}
            placeholder={locale === "en" ? "Belgrade" : "Beograd"}
          />
        </Field>
      </div>
      <Field label={t("languages")}>
        <div className="flex flex-wrap gap-2">
          {CONTENT_LANGUAGES.map((l) => (
            <ChipToggle
              key={l.code}
              selected={b.languages.includes(l.code)}
              onClick={() =>
                set({
                  languages: b.languages.includes(l.code)
                    ? b.languages.filter((x) => x !== l.code)
                    : [...b.languages, l.code],
                })
              }
            >
              {label(l.label, locale)}
            </ChipToggle>
          ))}
        </div>
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Step 2 — Socials & audience                                       */
/* ---------------------------------------------------------------- */

function emptySocial(platform: Platform, isFirst: boolean): SocialInput {
  return {
    platform,
    handle: "",
    profile_url: "",
    follower_range: "1k_5k",
    engagement_rate: "",
    avg_views: "",
    audience_gender: "",
    audience_top_age: "",
    audience_countries: [],
    is_primary: isFirst,
  };
}

export function SocialsStep({ data, update }: StepProps) {
  const t = useTranslations("onboarding.socials");
  const tc = useTranslations("common");
  const locale = useLocale();
  const socials = data.socials;

  const usedPlatforms = socials.map((s) => s.platform);
  const availablePlatforms = PLATFORMS.filter(
    (p) => !usedPlatforms.includes(p)
  );

  const setSocial = (i: number, patch: Partial<SocialInput>) => {
    const next = socials.map((s, j) => (j === i ? { ...s, ...patch } : s));
    update({ socials: next });
  };

  const setPrimary = (i: number) =>
    update({
      socials: socials.map((s, j) => ({ ...s, is_primary: j === i })),
    });

  const remove = (i: number) => {
    const next = socials.filter((_, j) => j !== i);
    if (next.length > 0 && !next.some((s) => s.is_primary)) {
      next[0] = { ...next[0], is_primary: true };
    }
    update({ socials: next });
  };

  return (
    <div className="space-y-6">
      {socials.map((s, i) => (
        <div key={s.platform} className="card space-y-5 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <SocialIcon platform={s.platform} />
            </span>
            <p className="font-display font-bold">
              {PLATFORM_LABELS[s.platform]}
            </p>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPrimary(i)}
                title={t("isPrimary")}
                className={cn(
                  "cursor-pointer rounded-lg p-2 transition-colors",
                  s.is_primary
                    ? "text-amber-500"
                    : "text-muted/50 hover:text-amber-500"
                )}
              >
                <Star
                  className="h-5 w-5"
                  fill={s.is_primary ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                title={tc("delete")}
                className="cursor-pointer rounded-lg p-2 text-muted/50 transition-colors hover:text-red-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("handle")}>
              <Input
                value={s.handle}
                onChange={(e) => setSocial(i, { handle: e.target.value })}
                placeholder="@moj.profil"
              />
            </Field>
            <Field label={t("profileUrl")} optional={tc("optional")}>
              <Input
                value={s.profile_url}
                onChange={(e) => setSocial(i, { profile_url: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label={t("followerRange")}>
              <Select
                value={s.follower_range}
                onChange={(e) =>
                  setSocial(i, {
                    follower_range: e.target
                      .value as SocialInput["follower_range"],
                  })
                }
              >
                {FOLLOWER_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {FOLLOWER_RANGE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("engagementRate")}
              optional={tc("optional")}
              hint={t("engagementHint")}
            >
              <Input
                inputMode="decimal"
                value={s.engagement_rate}
                onChange={(e) =>
                  setSocial(i, { engagement_rate: e.target.value })
                }
                placeholder="4.2"
              />
            </Field>
            <Field label={t("avgViews")} optional={tc("optional")}>
              <Input
                inputMode="numeric"
                value={s.avg_views}
                onChange={(e) => setSocial(i, { avg_views: e.target.value })}
                placeholder="5000"
              />
            </Field>
            <Field label={t("audienceGender")} optional={tc("optional")}>
              <Select
                value={s.audience_gender}
                onChange={(e) =>
                  setSocial(i, {
                    audience_gender: e.target
                      .value as SocialInput["audience_gender"],
                  })
                }
              >
                <option value="">—</option>
                {AUDIENCE_GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {label(AUDIENCE_GENDER_LABELS[g], locale)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("audienceAge")} optional={tc("optional")}>
              <Select
                value={s.audience_top_age}
                onChange={(e) =>
                  setSocial(i, {
                    audience_top_age: e.target
                      .value as SocialInput["audience_top_age"],
                  })
                }
              >
                <option value="">—</option>
                {AGE_RANGES.map((a) => (
                  <option key={a} value={a}>
                    {AGE_RANGE_LABELS[a]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t("audienceCountries")} optional={tc("optional")}>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <ChipToggle
                  key={c}
                  selected={s.audience_countries.includes(c)}
                  onClick={() =>
                    setSocial(i, {
                      audience_countries: s.audience_countries.includes(c)
                        ? s.audience_countries.filter((x) => x !== c)
                        : [...s.audience_countries, c],
                    })
                  }
                >
                  {label(COUNTRY_LABELS[c], locale)}
                </ChipToggle>
              ))}
            </div>
          </Field>
        </div>
      ))}

      {availablePlatforms.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">
            {t("addNetwork")}
          </p>
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((p) => (
              <Button
                key={p}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  update({
                    socials: [...socials, emptySocial(p, socials.length === 0)],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                <SocialIcon platform={p} className="h-4 w-4" />
                {PLATFORM_LABELS[p]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {socials.length === 0 && (
        <p className="text-sm text-muted">{t("atLeastOne")}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Step 3 — Categories                                               */
/* ---------------------------------------------------------------- */

export function CategoriesStep({ data, update }: StepProps) {
  const t = useTranslations("onboarding.categoriesStep");
  const locale = useLocale();
  const selected = data.categories;

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      update({ categories: selected.filter((s) => s !== slug) });
    } else if (selected.length < MAX_CATEGORIES) {
      update({ categories: [...selected, slug] });
    }
  };

  const groups = Object.keys(CATEGORY_GROUPS) as CategoryGroupSlug[];

  return (
    <div className="space-y-7">
      <p className="inline-flex rounded-full bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700">
        {t("selected", { count: selected.length, max: MAX_CATEGORIES })}
      </p>
      {groups.map((g) => {
        const cats = CATEGORIES.filter((c) => c.group === g);
        if (cats.length === 0) return null;
        return (
          <div key={g}>
            <p className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted">
              {label(CATEGORY_GROUPS[g], locale)}
            </p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <ChipToggle
                  key={c.slug}
                  selected={selected.includes(c.slug)}
                  disabled={
                    !selected.includes(c.slug) &&
                    selected.length >= MAX_CATEGORIES
                  }
                  onClick={() => toggle(c.slug)}
                >
                  <span aria-hidden>{c.emoji}</span>
                  {label(c.label, locale)}
                </ChipToggle>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Step 4 — Pricing & barter                                         */
/* ---------------------------------------------------------------- */

export function PricingStep({ data, update }: StepProps) {
  const t = useTranslations("onboarding.pricing");
  const tc = useTranslations("common");
  const locale = useLocale();
  const collab = data.collaboration;

  const setCollab = (patch: Partial<typeof collab>) =>
    update({ collaboration: { ...collab, ...patch } });

  const serviceFor = (type: (typeof SERVICE_TYPES)[number]) =>
    data.services.find((s) => s.service_type === type);

  const setService = (
    type: (typeof SERVICE_TYPES)[number],
    field: "price_min" | "price_max",
    value: string
  ) => {
    const existing = serviceFor(type);
    let next;
    if (existing) {
      next = data.services.map((s) =>
        s.service_type === type ? { ...s, [field]: value } : s
      );
    } else {
      next = [
        ...data.services,
        { service_type: type, price_min: "", price_max: "", [field]: value },
      ];
    }
    update({ services: next });
  };

  return (
    <div className="space-y-8">
      {/* Services */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="font-display font-bold">{t("servicesTitle")}</p>
          <label className="flex items-center gap-2 text-sm text-muted">
            {t("currency")}
            <Select
              className="!w-24"
              value={data.currency}
              onChange={(e) =>
                update({ currency: e.target.value as typeof data.currency })
              }
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="space-y-2.5">
          {SERVICE_TYPES.map((type) => {
            const s = serviceFor(type);
            return (
              <div
                key={type}
                className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 sm:grid-cols-[1fr_7rem_7rem]"
              >
                <span className="text-sm font-medium">
                  {label(SERVICE_LABELS[type], locale)}
                </span>
                <Input
                  inputMode="numeric"
                  aria-label={t("priceMin")}
                  placeholder={t("priceMin")}
                  className="!px-3 !py-2 text-center"
                  value={s?.price_min ?? ""}
                  onChange={(e) => setService(type, "price_min", e.target.value)}
                />
                <Input
                  inputMode="numeric"
                  aria-label={t("priceMax")}
                  placeholder={t("priceMax")}
                  className="!px-3 !py-2 text-center"
                  value={s?.price_max ?? ""}
                  onChange={(e) => setService(type, "price_max", e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Barter */}
      <div className="card space-y-5 bg-brand-50/40 p-5">
        <p className="font-display font-bold">{t("barterTitle")}</p>
        <Field label={t("barterQuestion")}>
          <div className="flex flex-wrap gap-2">
            {BARTER_PREFERENCES.map((b) => (
              <ChipToggle
                key={b}
                selected={collab.barter === b}
                onClick={() => setCollab({ barter: b })}
              >
                {label(BARTER_PREF_LABELS[b], locale)}
              </ChipToggle>
            ))}
          </div>
        </Field>
        {collab.barter !== "no" && (
          <>
            <Field label={t("barterTypes")}>
              <div className="flex flex-wrap gap-2">
                {BARTER_TYPES.map((b) => (
                  <ChipToggle
                    key={b}
                    selected={collab.barter_types.includes(b)}
                    onClick={() =>
                      setCollab({
                        barter_types: collab.barter_types.includes(b)
                          ? collab.barter_types.filter((x) => x !== b)
                          : [...collab.barter_types, b],
                      })
                    }
                  >
                    {label(BARTER_TYPE_LABELS[b], locale)}
                  </ChipToggle>
                ))}
              </div>
            </Field>
            <Field label={t("barterMinValue")} optional={tc("optional")}>
              <Input
                inputMode="numeric"
                className="sm:!w-40"
                value={collab.barter_min_value}
                onChange={(e) => setCollab({ barter_min_value: e.target.value })}
                placeholder="50"
              />
            </Field>
          </>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("minBudget")} optional={tc("optional")}>
          <Input
            inputMode="numeric"
            value={collab.min_budget}
            onChange={(e) => setCollab({ min_budget: e.target.value })}
            placeholder="100"
          />
        </Field>
      </div>

      <Toggle
        checked={collab.open_to_travel}
        onChange={(v) => setCollab({ open_to_travel: v })}
        label={t("openToTravel")}
      />

      <Field label={t("notes")} optional={tc("optional")}>
        <Textarea
          value={collab.notes}
          onChange={(e) => setCollab({ notes: e.target.value })}
          maxLength={300}
        />
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Step 5 — Contact & notifications                                  */
/* ---------------------------------------------------------------- */

export function ContactStep({ data, update }: StepProps) {
  const t = useTranslations("onboarding.contact");
  const tc = useTranslations("common");
  const locale = useLocale();
  const c = data.contact;
  const set = (patch: Partial<typeof c>) =>
    update({ contact: { ...c, ...patch } });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("contactEmail")} hint={t("contactEmailHint")}>
          <Input
            type="email"
            value={c.contact_email}
            onChange={(e) => set({ contact_email: e.target.value })}
          />
        </Field>
        <Field label={t("phone")} optional={tc("optional")}>
          <Input
            type="tel"
            value={c.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="+381 6x xxx xxxx"
          />
        </Field>
      </div>

      <Field label={t("preferredChannel")}>
        <Select
          value={c.preferred_channel}
          onChange={(e) =>
            set({
              preferred_channel: e.target
                .value as typeof c.preferred_channel,
            })
          }
        >
          {CONTACT_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {label(CONTACT_CHANNEL_LABELS[ch], locale)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("allowedChannels")}>
        <div className="flex flex-wrap gap-2">
          {CONTACT_CHANNELS.map((ch) => (
            <ChipToggle
              key={ch}
              selected={c.allowed_channels.includes(ch)}
              onClick={() =>
                set({
                  allowed_channels: c.allowed_channels.includes(ch)
                    ? c.allowed_channels.filter((x) => x !== ch)
                    : [...c.allowed_channels, ch],
                })
              }
            >
              {label(CONTACT_CHANNEL_LABELS[ch], locale)}
            </ChipToggle>
          ))}
        </div>
      </Field>

      <div className="space-y-3 pt-2">
        <Toggle
          checked={c.allow_platform_messages}
          onChange={(v) => set({ allow_platform_messages: v })}
          label={t("platformMessages")}
        />
        <Toggle
          checked={c.email_notifications}
          onChange={(v) => set({ email_notifications: v })}
          label={t("emailNotifications")}
        />
      </div>
    </div>
  );
}
