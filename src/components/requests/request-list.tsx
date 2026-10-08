import { Clock, MessageCircle } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { InboxItem, UserRole } from "@/lib/types";
import { COMPENSATION_LABELS, label, SERVICE_LABELS } from "@/lib/taxonomy";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/requests/status-badge";
import { cn, formatNumber } from "@/lib/utils";

/** Inbox rows — the counterpart depends on who is looking. */
export function RequestList({
  items,
  viewer,
}: {
  items: InboxItem[];
  viewer: UserRole;
}) {
  const t = useTranslations("requests");
  const format = useFormatter();
  const now = useNow();
  const locale = useLocale();

  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {items.map((r) => {
        const other =
          viewer === "company"
            ? { name: r.influencer.full_name, avatar: r.influencer.avatar_url, company: false }
            : { name: r.company.name, avatar: r.company.logo_url, company: true };
        const unread = r.unread > 0;
        const isNew = viewer === "influencer" && r.status === "pending" && !r.viewed_at;
        const money =
          r.budget_amount != null
            ? `${formatNumber(r.budget_amount, locale)} ${r.currency}`
            : label(COMPENSATION_LABELS[r.compensation], locale);

        return (
          <li key={r.id}>
            <Link
              href={{ pathname: "/dashboard/requests/[id]", params: { id: r.id } }}
              className={cn(
                "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-soft",
                (unread || isNew) && "bg-brand-50/40"
              )}
            >
              <Avatar src={other.avatar} name={other.name} size={44} company={other.company} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className={cn("truncate text-sm", unread || isNew ? "font-bold" : "font-semibold")}>
                    {other.name}
                  </p>
                  <StatusBadge status={r.status} className="!px-2 !py-0.5 text-[11px]" />
                  {isNew && (
                    <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      {t("new")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-ink-soft">{r.title}</p>
                <p className="mt-1 truncate text-xs text-muted">
                  {r.deliverables
                    .slice(0, 2)
                    .map((d) => label(SERVICE_LABELS[d], locale))
                    .join(" · ")}
                  {" · "}
                  {money}
                </p>
                {r.last_message && (
                  <p className={cn("mt-1.5 flex items-center gap-1.5 truncate text-xs", unread ? "font-semibold text-ink" : "text-muted")}>
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {r.last_message.mine && `${t("you")}: `}
                      {r.last_message.body}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <time
                  dateTime={r.updated_at}
                  className="text-xs text-muted"
                  title={format.dateTime(new Date(r.updated_at), { dateStyle: "medium", timeStyle: "short" })}
                >
                  {format.relativeTime(new Date(r.updated_at), now)}
                </time>
                {unread && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">
                    {r.unread}
                  </span>
                )}
                {r.status === "pending" && r.respond_by && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                    <Clock className="h-3 w-3" />
                    {t("respondBy", { date: format.dateTime(new Date(r.respond_by), { day: "numeric", month: "short" }) })}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
