"use client";

import { useOptimistic, useTransition } from "react";
import { Bell, Check, CheckCheck, Handshake, Info, MessageCircle } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppNotification } from "@/lib/types";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

const typeIcon = {
  system: Info,
  collaboration: Handshake,
  message: MessageCircle,
  reminder: Bell,
} as const;

export function NotificationsList({
  notifications,
  showMarkAll,
}: {
  notifications: AppNotification[];
  showMarkAll?: boolean;
}) {
  const t = useTranslations("dashboard");
  const tn = useTranslations("notifications");
  const format = useFormatter();
  const now = useNow();
  const [, startTransition] = useTransition();
  const [items, setRead] = useOptimistic(
    notifications,
    (state, id: string | "all") =>
      state.map((n) =>
        id === "all" || n.id === id
          ? { ...n, read_at: n.read_at ?? new Date().toISOString() }
          : n
      )
  );

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-surface-soft px-4 py-6 text-center text-sm text-muted">
        {t("noNotifications")}
      </p>
    );
  }

  const text = (n: AppNotification) => {
    if (n.template && tn.has(`templates.${n.template}.title`)) {
      const values = {
        name: "",
        title: "",
        rating: "",
        ...Object.fromEntries(
          Object.entries(n.data ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)])
        ),
      };
      return {
        title: tn(`templates.${n.template}.title`, values),
        body: tn.has(`templates.${n.template}.body`)
          ? tn(`templates.${n.template}.body`, values)
          : null,
      };
    }
    return { title: n.title, body: n.body };
  };

  const hasUnread = items.some((n) => !n.read_at);

  return (
    <div>
      {showMarkAll && hasUnread && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                setRead("all");
                await markAllNotificationsRead();
              })
            }
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            <CheckCheck className="h-4 w-4" />
            {tn("markAllRead")}
          </button>
        </div>
      )}
      <ul className="space-y-2.5">
        {items.map((n) => {
          const Icon = typeIcon[n.type] ?? Info;
          const unread = !n.read_at;
          const { title, body } = text(n);
          const requestId = typeof n.data?.request_id === "string" ? n.data.request_id : null;
          const content = (
            <>
              <p className={cn("text-sm", unread ? "font-bold" : "font-medium")}>{title}</p>
              {body && <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>}
              <time dateTime={n.created_at} className="mt-1 block text-xs text-muted">
                {format.relativeTime(new Date(n.created_at), now)}
              </time>
            </>
          );
          return (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                unread ? "border-brand-200 bg-brand-50/50" : "border-line bg-surface"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  unread ? "bg-brand-100 text-brand-600" : "bg-surface-soft text-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                {requestId ? (
                  <Link
                    href={{ pathname: "/dashboard/requests/[id]", params: { id: requestId } }}
                    className="block hover:text-brand-700"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
              {unread && (
                <button
                  type="button"
                  title={t("markRead")}
                  aria-label={t("markRead")}
                  onClick={() =>
                    startTransition(async () => {
                      setRead(n.id);
                      await markNotificationRead(n.id);
                    })
                  }
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-brand-500 hover:bg-brand-100"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
