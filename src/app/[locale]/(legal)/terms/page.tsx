import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sr = locale === "sr";

  return (
    <article className="prose-sm space-y-4 leading-relaxed text-ink-soft">
      <h1 className="font-display text-3xl font-bold text-ink">
        {sr ? "Uslovi korišćenja" : "Terms of service"}
      </h1>
      <p>
        {sr
          ? "Kolabo je platforma koja povezuje kreatore sadržaja i brendove. Kreiranjem naloga potvrđuješ da su uneti podaci tačni i da imaš najmanje 16 godina."
          : "Kolabo is a platform connecting content creators and brands. By creating an account you confirm that the data you enter is accurate and that you are at least 16 years old."}
      </p>
      <p>
        {sr
          ? "Rasponi cena na profilu su informativnog karaktera — svaki dogovor o saradnji sklapa se direktno između kreatora i brenda. Kolabo trenutno ne posreduje u naplati."
          : "Price ranges on a profile are informational — every collaboration agreement is made directly between the creator and the brand. Kolabo currently does not mediate payments."}
      </p>
      <p>
        {sr
          ? "Ovaj dokument je radna verzija i biće dopunjen pre javnog lansiranja platforme."
          : "This document is a working draft and will be completed before public launch."}
      </p>
    </article>
  );
}
