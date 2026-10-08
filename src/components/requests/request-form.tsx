"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Megaphone, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createRequest, type RequestInput } from "@/app/actions/requests";
import {
  COMPENSATION_LABELS,
  COMPENSATION_TYPES,
  CURRENCIES,
  SERVICE_LABELS,
  SERVICE_TYPES,
  USAGE_RIGHTS,
  USAGE_RIGHTS_LABELS,
  label,
  type ServiceType,
} from "@/lib/taxonomy";
import { Button } from "@/components/ui/button";
import { ChipToggle, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm text-brand-700">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export function RequestForm({
  username,
  creatorName,
  offered,
  showMinorWarning,
}: {
  username: string;
  creatorName: string;
  /** Services the creator lists — shown first in the picker. */
  offered: ServiceType[];
  /** Brand is in a regulated industry and the creator has 13–17 audience. */
  showMinorWarning: boolean;
}) {
  const t = useTranslations("requestForm");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);

  const [data, setData] = useState<Omit<RequestInput, "influencerUsername" | "deliverables">>({
    title: "",
    goal: "",
    brief: "",
    key_messages: "",
    restrictions: "",
    compensation: "paid",
    budget_amount: "",
    currency: "EUR",
    barter_description: "",
    barter_value: "",
    usage_rights: "organic_only",
    revisions: 1,
    start_date: "",
    end_date: "",
    respond_by: "",
    ad_disclosure_ack: false,
  });
  const [deliverables, setDeliverables] = useState<Record<string, number>>(
    offered[0] ? { [offered[0]]: 1 } : {}
  );
  const set = (patch: Partial<typeof data>) => setData((d) => ({ ...d, ...patch }));

  const serviceOrder = useMemo(
    () => [...offered, ...SERVICE_TYPES.filter((s) => !offered.includes(s))],
    [offered]
  );

  const paid = data.compensation !== "barter";
  const barter = data.compensation !== "paid";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createRequest({
        ...data,
        influencerUsername: username,
        deliverables: Object.entries(deliverables).map(([type, count]) => ({
          type: type as ServiceType,
          count,
        })),
      });
      if (!res.ok) {
        const key = res.error ?? "save_failed";
        setError({
          message: t.has(`errors.${key}`) ? t(`errors.${key}`) : tc("error"),
          field: res.field,
        });
        if (res.field) document.getElementById(`req-${res.field}`)?.focus();
        return;
      }
      router.push({ pathname: "/dashboard/requests/[id]", params: { id: res.data!.id } });
    });
  }

  const fieldErr = (f: string) =>
    error?.field === f ? (
      <span className="mt-1.5 block text-xs font-semibold text-red-600">{error.message}</span>
    ) : null;

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {showMinorWarning && (
        <Alert tone="warning" title={t("minorWarningTitle")}>
          {t("minorWarning")}
        </Alert>
      )}

      <Section n={1} title={t("sections.campaign")}>
        <Field label={t("title")} hint={t("titleHint")}>
          <Input
            id="req-title"
            value={data.title}
            onChange={(e) => set({ title: e.target.value })}
            maxLength={120}
            required
            placeholder={t("titlePlaceholder")}
          />
          {fieldErr("title")}
        </Field>
        <Field label={t("goal")} optional={tc("optional")}>
          <Input
            value={data.goal}
            onChange={(e) => set({ goal: e.target.value })}
            maxLength={500}
            placeholder={t("goalPlaceholder")}
          />
        </Field>
        <Field label={t("brief")} hint={t("briefHint", { count: data.brief.length })}>
          <Textarea
            id="req-brief"
            value={data.brief}
            onChange={(e) => set({ brief: e.target.value })}
            maxLength={3000}
            required
            className="min-h-36"
            placeholder={t("briefPlaceholder", { name: creatorName.split(" ")[0] })}
          />
          {fieldErr("brief")}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("keyMessages")} optional={tc("optional")}>
            <Textarea
              value={data.key_messages}
              onChange={(e) => set({ key_messages: e.target.value })}
              maxLength={1000}
              placeholder={t("keyMessagesPlaceholder")}
            />
          </Field>
          <Field label={t("restrictions")} optional={tc("optional")}>
            <Textarea
              value={data.restrictions}
              onChange={(e) => set({ restrictions: e.target.value })}
              maxLength={1000}
              placeholder={t("restrictionsPlaceholder")}
            />
          </Field>
        </div>
      </Section>

      <Section n={2} title={t("sections.deliverables")}>
        <p className="-mt-2 text-sm text-muted">{t("deliverablesHint")}</p>
        <div id="req-deliverables" tabIndex={-1} className="flex flex-wrap gap-2">
          {serviceOrder.map((s) => {
            const selected = s in deliverables;
            return (
              <ChipToggle
                key={s}
                selected={selected}
                onClick={() =>
                  setDeliverables((d) => {
                    const next = { ...d };
                    if (selected) delete next[s];
                    else next[s] = 1;
                    return next;
                  })
                }
                className={cn(offered.includes(s) && !selected && "border-brand-200")}
              >
                {label(SERVICE_LABELS[s], locale)}
              </ChipToggle>
            );
          })}
        </div>
        {fieldErr("deliverables")}
        {Object.keys(deliverables).length > 0 && (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {Object.entries(deliverables).map(([s, count]) => (
              <li key={s} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium">{label(SERVICE_LABELS[s as ServiceType], locale)}</span>
                <div className="flex items-center gap-2" role="group" aria-label={t("quantity")}>
                  <button
                    type="button"
                    aria-label={t("decrease")}
                    disabled={count <= 1}
                    onClick={() => setDeliverables((d) => ({ ...d, [s]: Math.max(1, count - 1) }))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold tabular-nums">{count}</span>
                  <button
                    type="button"
                    aria-label={t("increase")}
                    disabled={count >= 20}
                    onClick={() => setDeliverables((d) => ({ ...d, [s]: Math.min(20, count + 1) }))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("usageRights")} hint={t("usageRightsHint")}>
            <Select
              value={data.usage_rights}
              onChange={(e) => set({ usage_rights: e.target.value as RequestInput["usage_rights"] })}
            >
              {USAGE_RIGHTS.map((u) => (
                <option key={u} value={u}>
                  {label(USAGE_RIGHTS_LABELS[u], locale)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("revisions")}>
            <Select value={data.revisions} onChange={(e) => set({ revisions: Number(e.target.value) })}>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {t("revisionsCount", { count: n })}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section n={3} title={t("sections.compensation")}>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t("compensation")}>
          {COMPENSATION_TYPES.map((c) => {
            const active = data.compensation === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ compensation: c })}
                className={cn(
                  "cursor-pointer rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors",
                  active ? "border-brand-500 bg-brand-50/70 text-brand-800" : "border-line hover:border-brand-200"
                )}
              >
                {label(COMPENSATION_LABELS[c], locale)}
              </button>
            );
          })}
        </div>
        {paid && (
          <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
            <Field label={t("budget")} hint={t("budgetHint")}>
              <Input
                id="req-budget_amount"
                type="number"
                min={0}
                inputMode="numeric"
                value={data.budget_amount}
                onChange={(e) => set({ budget_amount: e.target.value })}
              />
              {fieldErr("budget_amount")}
            </Field>
            <Field label={t("currency")}>
              <Select
                value={data.currency}
                onChange={(e) => set({ currency: e.target.value as RequestInput["currency"] })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        {barter && (
          <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
            <Field label={t("barterDescription")}>
              <Input
                id="req-barter_description"
                value={data.barter_description}
                onChange={(e) => set({ barter_description: e.target.value })}
                maxLength={500}
                placeholder={t("barterPlaceholder")}
              />
              {fieldErr("barter_description")}
            </Field>
            <Field label={t("barterValue")} optional={tc("optional")} hint={t("barterValueHint")}>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={data.barter_value}
                onChange={(e) => set({ barter_value: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Section>

      <Section n={4} title={t("sections.timeline")}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t("startDate")} optional={tc("optional")}>
            <Input
              type="date"
              min={today()}
              value={data.start_date}
              onChange={(e) => set({ start_date: e.target.value })}
            />
          </Field>
          <Field label={t("endDate")} optional={tc("optional")}>
            <Input
              id="req-end_date"
              type="date"
              min={data.start_date || today()}
              value={data.end_date}
              onChange={(e) => set({ end_date: e.target.value })}
            />
            {fieldErr("end_date")}
          </Field>
          <Field label={t("respondBy")} optional={tc("optional")}>
            <Input
              type="date"
              min={today()}
              value={data.respond_by}
              onChange={(e) => set({ respond_by: e.target.value })}
            />
          </Field>
        </div>
      </Section>

      <section className="card border-amber-200 bg-amber-50/60 p-6">
        <p className="flex items-center gap-2 font-display font-bold text-amber-900">
          <Megaphone className="h-5 w-5" />
          {t("disclosureTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/85">{t("disclosureText")}</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-semibold text-amber-950">
          <input
            id="req-ad_disclosure_ack"
            type="checkbox"
            checked={data.ad_disclosure_ack}
            onChange={(e) => set({ ad_disclosure_ack: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
          />
          {t("disclosureAck")}
        </label>
        {fieldErr("ad_disclosure_ack")}
      </section>

      {error && !error.field && <Alert tone="error">{error.message}</Alert>}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-muted">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t("footnote")}
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tc("loading") : t("submit")}
          {!pending && <ArrowRight className="h-5 w-5" />}
        </Button>
      </div>
    </form>
  );
}
