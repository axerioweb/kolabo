"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Lock, MessageCircle, Send } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { markMessagesRead, sendMessage } from "@/app/actions/requests";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Conversation attached to a collaboration request. New messages arrive
 * through Supabase Realtime (RLS applies to subscriptions too).
 */
export function MessageThread({
  requestId,
  initialMessages,
  myId,
  otherName,
  canSend,
}: {
  requestId: string;
  initialMessages: Message[];
  myId: string;
  otherName: string;
  canSend: boolean;
}) {
  const t = useTranslations("thread");
  const format = useFormatter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Keep scrolled to the newest message
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== myId) void markMessagesRead(requestId);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId, myId]);

  function submit() {
    const text = body.trim();
    if (!text || pending) return;
    setError(null);
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      request_id: requestId,
      sender_id: myId,
      recipient_id: "",
      body: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    startTransition(async () => {
      const res = await sendMessage(requestId, text);
      if (!res.ok || !res.data) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setBody(text);
        setError(t("sendError"));
        return;
      }
      const saved = { ...res.data, sender_id: res.demo ? myId : res.data.sender_id };
      // Realtime may already have delivered it — dedupe by id
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return without.some((m) => m.id === saved.id) ? without : [...without, saved];
      });
      textRef.current?.focus();
    });
  }

  return (
    <div className="card flex h-[min(70vh,640px)] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <MessageCircle className="h-4.5 w-4.5 text-brand-500" />
        <h2 className="font-display font-bold">{t("title", { name: otherName })}</h2>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto bg-surface-soft/60 px-4 py-5 sm:px-5"
        aria-live="polite"
        aria-label={t("title", { name: otherName })}
      >
        {messages.length === 0 && (
          <p className="mx-auto max-w-xs py-10 text-center text-sm text-muted">{t("empty")}</p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === myId;
          const prev = messages[i - 1];
          const newDay =
            !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
          return (
            <div key={m.id}>
              {newDay && (
                <p className="my-3 text-center text-xs font-semibold tracking-wide text-muted uppercase">
                  {format.dateTime(new Date(m.created_at), { weekday: "long", day: "numeric", month: "long" })}
                </p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-soft sm:max-w-[75%]",
                    mine
                      ? "rounded-br-md bg-gradient-to-br from-brand-600 to-brand-500 text-white"
                      : "rounded-bl-md border border-line bg-surface text-ink",
                    m.id.startsWith("tmp-") && "opacity-70"
                  )}
                >
                  {m.body}
                  <span
                    className={cn("mt-1 block text-right text-xs", mine ? "text-white/70" : "text-muted")}
                  >
                    {format.dateTime(new Date(m.created_at), { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {canSend ? (
        <form
          className="border-t border-line bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {error && <p className="mb-2 px-1 text-xs font-semibold text-red-600" role="alert">{error}</p>}
          <div className="flex items-end gap-2">
            <label htmlFor="thread-input" className="sr-only">
              {t("placeholder")}
            </label>
            <textarea
              id="thread-input"
              ref={textRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder={t("placeholder")}
              className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface px-4 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!body.trim() || pending}
              aria-label={t("send")}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-accent-500 text-white shadow-lift transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
          <p className="mt-1.5 px-1 text-xs text-muted">{t("hint")}</p>
        </form>
      ) : (
        <p className="flex items-center justify-center gap-2 border-t border-line bg-surface px-4 py-4 text-sm text-muted">
          <Lock className="h-4 w-4" />
          {t("closed")}
        </p>
      )}
    </div>
  );
}
