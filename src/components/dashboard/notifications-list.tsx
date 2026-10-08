"use client";

import { useTransition, useOptimistic } from "react";
import { Bell, Check, Handshake, Info, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AppNotification } from "@/lib/types";
import { markNotificationRead } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

const typeIcon = {
  system: Info,
  collaboration: Handshake,
  message: MessageCircle,
  reminder: Bell,
} as const;

export function NotificationsList({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const t = useTranslations("dashboard");
  const [, startTransition] = useTransition();
  const [items, setRead] = useOptimistic(
    notifications,
    (state, id: string) =>
      state.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
  );

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-surface-soft px-4 py-6 text-center text-sm text-muted">
        {t("noNotifications")}
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.map((n) => {
        const Icon = typeIcon[n.type] ?? Info;
        const unread = !n.read_at;
        return (
          <li
            key={n.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
              unread
                ? "border-brand-200 bg-brand-50/50"
                : "border-line bg-surface"
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
              <p className={cn("text-sm", unread ? "font-bold" : "font-medium")}>
                {n.title}
              </p>
              {n.body && (
                <p className="mt-0.5 text-sm leading-relaxed text-muted">
                  {n.body}
                </p>
              )}
            </div>
            {unread && (
              <button
                type="button"
                title={t("markRead")}
                onClick={() =>
                  startTransition(async () => {
                    setRead(n.id);
                    await markNotificationRead(n.id);
                  })
                }
                className="cursor-pointer rounded-lg p-1.5 text-brand-500 hover:bg-brand-100"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
