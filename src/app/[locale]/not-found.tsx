import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-hero-glow px-6 text-center">
      <p className="font-display text-8xl font-bold text-gradient">404</p>
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-muted">{t("text")}</p>
      <Button asChild>
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  );
}
