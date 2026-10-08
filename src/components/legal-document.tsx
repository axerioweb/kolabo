import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/site";

type Section = { title: string; body: string[] };

/** Renders a legal document whose sections live in messages (legal.<doc>). */
export async function LegalDocument({ doc }: { doc: "privacy" | "terms" }) {
  const t = await getTranslations(`legal.${doc}`);
  const tl = await getTranslations("legal");
  const sections = t.raw("sections") as Section[];
  const fill = (s: string) =>
    s
      .replaceAll("{entity}", LEGAL_ENTITY.name)
      .replaceAll("{address}", LEGAL_ENTITY.address)
      .replaceAll("{email}", LEGAL_ENTITY.email)
      .replaceAll("{mb}", LEGAL_ENTITY.registrationNumber)
      .replaceAll("{pib}", LEGAL_ENTITY.taxId);

  return (
    <article className="leading-relaxed text-ink-soft">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{tl("updated", { date: t("date") })}</p>
      <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {tl("draftNotice")}
      </p>
      <p className="mt-6">{fill(t.raw("intro") as string)}</p>
      {sections.map((s, i) => (
        <section key={s.title} className="mt-8">
          <h2 className="font-display text-xl font-bold text-ink">
            {i + 1}. {s.title}
          </h2>
          {s.body.map((p) => (
            <p key={p.slice(0, 40)} className="mt-3">
              {fill(p)}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
