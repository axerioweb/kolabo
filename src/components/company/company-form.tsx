"use client";

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, Check, PartyPopper, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { saveCompanyProfile, type CompanyInput } from "@/app/actions/company";
import {
  CATEGORIES,
  COMPANY_INDUSTRIES,
  COMPANY_INDUSTRY_LABELS,
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  COMPANY_TYPES,
  COMPANY_TYPE_LABELS,
  COUNTRIES,
  COUNTRY_LABELS,
  CURRENCIES,
  TAX_ID_LABELS,
  label,
} from "@/lib/taxonomy";
import { isValidTaxId } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { ChipToggle, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

const MAX_INTERESTS = 10;

export const emptyCompanyInput: CompanyInput = {
  name: "",
  legal_name: "",
  company_type: "legal_entity",
  tax_id: "",
  registration_number: "",
  industry: "other",
  size: "",
  website: "",
  instagram: "",
  country: "RS",
  city: "",
  description: "",
  contact_name: "",
  contact_role: "",
  interested_categories: [],
  budget_min: "",
  budget_max: "",
  currency: "EUR",
  contact_email: "",
  phone: "",
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function CompanyForm({
  initial,
  mode,
}: {
  initial: CompanyInput;
  mode: "onboarding" | "edit";
}) {
  const t = useTranslations("company");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [data, setData] = useState<CompanyInput>(initial);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<CompanyInput>) => {
    setData((d) => ({ ...d, ...patch }));
    setSaved(false);
  };

  const taxLabel = label(TAX_ID_LABELS[data.country] ?? { sr: "Poreski broj", en: "Tax ID" }, locale);
  const taxInvalid = data.tax_id.trim() !== "" && !isValidTaxId(data.country, data.tax_id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveCompanyProfile(data, true);
      if (!res.ok) {
        const key = res.error ?? "save_failed";
        setError({
          message: t.has(`errors.${key}`) ? t(`errors.${key}`) : tc("error"),
          field: res.field,
        });
        if (res.field) {
          document.getElementById(`company-${res.field}`)?.focus();
        }
        return;
      }
      if (mode === "onboarding") {
        setDone(true);
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card mx-auto max-w-lg p-10 text-center"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lift">
          <PartyPopper className="h-8 w-8" />
        </span>
        <h2 className="mt-6 font-display text-2xl font-bold">{t("done.title")}</h2>
        <p className="mt-3 text-muted">{t("done.subtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/creators">
              <Search className="h-4 w-4" />
              {t("done.cta")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              {t("done.dashboard")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  const fieldError = (f: string) =>
    error?.field === f ? (
      <span className="mt-1.5 block text-xs font-semibold text-red-600">{error.message}</span>
    ) : null;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6" noValidate>
      {mode === "onboarding" && (
        <div className="mb-2 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("onboardingTitle")}</h1>
            <p className="mt-1.5 text-muted">{t("onboardingSubtitle")}</p>
          </div>
        </div>
      )}

      <Section title={t("sections.about")} subtitle={t("sections.aboutHint")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("name")} className="sm:col-span-2">
            <Input
              id="company-name"
              value={data.name}
              onChange={(e) => set({ name: e.target.value })}
              maxLength={120}
              required
              placeholder="Zdravo Organic"
            />
            {fieldError("name")}
          </Field>
          <Field label={t("type")}>
            <Select
              value={data.company_type}
              onChange={(e) => set({ company_type: e.target.value as CompanyInput["company_type"] })}
            >
              {COMPANY_TYPES.map((c) => (
                <option key={c} value={c}>
                  {label(COMPANY_TYPE_LABELS[c], locale)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("industry")}>
            <Select
              value={data.industry}
              onChange={(e) => set({ industry: e.target.value as CompanyInput["industry"] })}
            >
              {COMPANY_INDUSTRIES.map((c) => (
                <option key={c} value={c}>
                  {label(COMPANY_INDUSTRY_LABELS[c], locale)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("size")} optional={tc("optional")}>
            <Select
              value={data.size}
              onChange={(e) => set({ size: e.target.value as CompanyInput["size"] })}
            >
              <option value="">—</option>
              {COMPANY_SIZES.map((c) => (
                <option key={c} value={c}>
                  {label(COMPANY_SIZE_LABELS[c], locale)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("city")}>
            <Input
              value={data.city}
              onChange={(e) => set({ city: e.target.value })}
              maxLength={80}
              placeholder={locale === "en" ? "Belgrade" : "Beograd"}
            />
          </Field>
          <Field
            label={t("description")}
            hint={t("descriptionHint", { count: 600 - data.description.length })}
            className="sm:col-span-2"
          >
            <Textarea
              value={data.description}
              onChange={(e) => set({ description: e.target.value })}
              maxLength={600}
              placeholder={t("descriptionPlaceholder")}
            />
          </Field>
        </div>
      </Section>

      <Section title={t("sections.legal")} subtitle={t("sections.legalHint")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("country")}>
            <Select
              value={data.country}
              onChange={(e) => set({ country: e.target.value as CompanyInput["country"] })}
            >
              {COUNTRIES.filter((c) => c !== "diaspora").map((c) => (
                <option key={c} value={c}>
                  {label(COUNTRY_LABELS[c], locale)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={taxLabel} hint={t("taxIdHint")}>
            <Input
              id="company-tax_id"
              value={data.tax_id}
              onChange={(e) => set({ tax_id: e.target.value })}
              inputMode="numeric"
              maxLength={20}
              aria-invalid={taxInvalid || error?.field === "tax_id"}
              className={taxInvalid ? "border-red-300 focus:border-red-400 focus:ring-red-100" : undefined}
            />
            {taxInvalid && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {t("errors.tax_id_invalid")}
              </span>
            )}
            {!taxInvalid && fieldError("tax_id")}
          </Field>
          <Field label={t("registrationNumber")} optional={tc("optional")}>
            <Input
              id="company-registration_number"
              value={data.registration_number}
              onChange={(e) => set({ registration_number: e.target.value })}
              inputMode="numeric"
              maxLength={20}
            />
            {fieldError("registration_number")}
          </Field>
          <Field label={t("legalName")} optional={tc("optional")}>
            <Input
              value={data.legal_name}
              onChange={(e) => set({ legal_name: e.target.value })}
              maxLength={200}
              placeholder="Zdravo Organic d.o.o. Beograd"
            />
          </Field>
        </div>
      </Section>

      <Section title={t("sections.contact")} subtitle={t("sections.contactHint")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("contactName")}>
            <Input
              id="company-contact_name"
              value={data.contact_name}
              onChange={(e) => set({ contact_name: e.target.value })}
              maxLength={100}
              autoComplete="name"
            />
            {fieldError("contact_name")}
          </Field>
          <Field label={t("contactRole")} optional={tc("optional")}>
            <Input
              value={data.contact_role}
              onChange={(e) => set({ contact_role: e.target.value })}
              maxLength={100}
              placeholder={t("contactRolePlaceholder")}
            />
          </Field>
          <Field label={t("contactEmail")} hint={t("contactEmailHint")}>
            <Input
              type="email"
              value={data.contact_email}
              onChange={(e) => set({ contact_email: e.target.value })}
              maxLength={254}
              autoComplete="email"
            />
          </Field>
          <Field label={t("phone")} optional={tc("optional")}>
            <Input
              type="tel"
              value={data.phone}
              onChange={(e) => set({ phone: e.target.value })}
              maxLength={30}
              autoComplete="tel"
              placeholder="+381 6x xxx xxxx"
            />
          </Field>
          <Field label={t("website")} optional={tc("optional")}>
            <Input
              id="company-website"
              value={data.website}
              onChange={(e) => set({ website: e.target.value })}
              maxLength={300}
              placeholder="www.primer.rs"
              inputMode="url"
            />
            {fieldError("website")}
          </Field>
          <Field label={t("instagram")} optional={tc("optional")}>
            <Input
              value={data.instagram}
              onChange={(e) => set({ instagram: e.target.value })}
              maxLength={100}
              placeholder="@brend"
            />
          </Field>
        </div>
      </Section>

      <Section title={t("sections.looking")} subtitle={t("sections.lookingHint")}>
        <Field
          label={t("interests")}
          hint={t("interestsCount", {
            count: data.interested_categories.length,
            max: MAX_INTERESTS,
          })}
        >
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const selected = data.interested_categories.includes(c.slug);
              return (
                <ChipToggle
                  key={c.slug}
                  selected={selected}
                  disabled={!selected && data.interested_categories.length >= MAX_INTERESTS}
                  onClick={() =>
                    set({
                      interested_categories: selected
                        ? data.interested_categories.filter((s) => s !== c.slug)
                        : [...data.interested_categories, c.slug],
                    })
                  }
                >
                  <span aria-hidden>{c.emoji}</span>
                  {label(c.label, locale)}
                </ChipToggle>
              );
            })}
          </div>
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t("budgetMin")} optional={tc("optional")}>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={data.budget_min}
              onChange={(e) => set({ budget_min: e.target.value })}
            />
          </Field>
          <Field label={t("budgetMax")} optional={tc("optional")}>
            <Input
              id="company-budget_max"
              type="number"
              min={0}
              inputMode="numeric"
              value={data.budget_max}
              onChange={(e) => set({ budget_max: e.target.value })}
            />
            {fieldError("budget_max")}
          </Field>
          <Field label={t("currency")}>
            <Select
              value={data.currency}
              onChange={(e) => set({ currency: e.target.value as CompanyInput["currency"] })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      {error && !error.field && <Alert tone="error">{error.message}</Alert>}
      {error?.field && (
        <Alert tone="error">{t("errors.checkFields")}</Alert>
      )}

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-line bg-white/90 p-3 shadow-lift backdrop-blur-xl">
        {saved && (
          <span className="mr-auto flex items-center gap-1.5 pl-2 text-sm font-semibold text-emerald-700" role="status">
            <Check className="h-4 w-4" />
            {tc("saved")}
          </span>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : mode === "onboarding" ? t("finish") : tc("save")}
          {!pending && mode === "onboarding" && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
