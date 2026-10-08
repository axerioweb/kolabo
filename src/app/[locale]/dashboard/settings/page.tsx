import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import {
  DeleteAccount,
  ExportButton,
  MarketingToggle,
  PasswordForm,
} from "@/components/settings/settings-forms";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title"), robots: { index: false } };
}

function Card({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-7">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "settings" });
  const session = await requireSession(locale, { allowIncomplete: true });

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted">{t("loggedInAs", { email: session.email ?? "—" })}</p>
        </div>

        <Card title={t("passwordTitle")} text={t("passwordText")}>
          <PasswordForm />
        </Card>

        <Card title={t("privacyTitle")} text={t("privacyText")}>
          <div className="space-y-4">
            <MarketingToggle initial={session.profile.marketing_opt_in} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <p className="text-sm">{t("exportText")}</p>
              <ExportButton />
            </div>
          </div>
        </Card>

        {session.profile.role !== "admin" && (
          <Card title={t("dangerTitle")} text={t("dangerText")}>
            <DeleteAccount />
          </Card>
        )}
      </main>
    </>
  );
}
