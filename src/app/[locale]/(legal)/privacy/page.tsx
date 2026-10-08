import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sr = locale === "sr";

  return (
    <article className="prose-sm space-y-4 leading-relaxed text-ink-soft">
      <h1 className="font-display text-3xl font-bold text-ink">
        {sr ? "Politika privatnosti" : "Privacy policy"}
      </h1>
      <p>
        {sr
          ? "Kolabo prikuplja samo podatke koje sam uneseš u svoj profil: kontakt podatke, podatke o društvenim mrežama, kategorijama sadržaja i uslovima saradnje. Podaci se koriste isključivo za povezivanje sa brendovima i statistiku platforme."
          : "Kolabo collects only the data you enter into your profile: contact details, social network data, content categories and collaboration terms. Data is used exclusively for connecting you with brands and platform statistics."}
      </p>
      <p>
        {sr
          ? "Kontakt podatke (email, telefon) prikazujemo samo preko kanala koje si izričito dozvolio/la. U svakom trenutku možeš izmeniti ili obrisati svoj profil."
          : "Contact details (email, phone) are shown only via channels you explicitly allow. You can edit or delete your profile at any time."}
      </p>
      <p>
        {sr
          ? "Ovaj dokument je radna verzija i biće dopunjen pre javnog lansiranja platforme u skladu sa ZZPL/GDPR."
          : "This document is a working draft and will be completed before public launch in accordance with GDPR."}
      </p>
    </article>
  );
}
