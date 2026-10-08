"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Segment error boundary — keeps the header/layout, offers retry. */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    // Surface in the console / hosting logs; no third-party tracking here.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <p className="font-display text-6xl font-bold text-gradient">500</p>
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-muted">{t("text")}</p>
      {error.digest && (
        <p className="text-xs text-muted">
          {t("code")}: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          {t("retry")}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </main>
  );
}
