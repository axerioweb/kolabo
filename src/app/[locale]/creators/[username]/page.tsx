import type { Metadata } from "next";
import { cache } from "react";
import { publicMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import {
  BadgeCheck,
  Calendar,
  Eye,
  Gift,
  Globe2,
  Languages,
  Lock,
  MapPin,
  Plane,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicCreator } from "@/lib/queries";
import { demoPublicCreator } from "@/lib/demo-data";
import {
  AGE_RANGE_LABELS,
  AUDIENCE_GENDER_LABELS,
  BARTER_PREF_LABELS,
  BARTER_TYPE_LABELS,
  categoryBySlug,
  CONTENT_LANGUAGES,
  COUNTRY_LABELS,
  FOLLOWER_RANGE_LABELS,
  label,
  PLATFORM_LABELS,
  SERVICE_LABELS,
} from "@/lib/taxonomy";
import { SITE_URL } from "@/lib/site";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { PublicCreator } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/rating";
import { SocialIcon } from "@/components/social-icons";
import { ProfileActions } from "@/components/creators/profile-actions";

// ISR: public profiles are cached and refreshed every 5 minutes
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; username: string }> };

// cache(): generateMetadata and the page share ONE query per request
const load = cache(async (username: string): Promise<PublicCreator | null> => {
  const u = decodeURIComponent(username).toLowerCase();
  if (!isSupabaseConfigured) return demoPublicCreator(u);
  return getPublicCreator(createPublicClient(), u);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const creator = await load(username);
  const t = await getTranslations({ locale, namespace: "profile" });
  if (!creator) return { title: t("notFound"), robots: { index: false } };

  const p = creator.profile;
  const cats = creator.categories
    .map((s) => categoryBySlug(s))
    .filter(Boolean)
    .map((c) => label(c!.label, locale))
    .slice(0, 3)
    .join(", ");
  const title = t("metaTitle", { name: p.full_name, username: p.username ?? "" });
  const description =
    p.bio?.slice(0, 155) ||
    t("metaDescription", { name: p.full_name, categories: cats, city: p.city ?? "" });
  return publicMetadata({
    locale,
    title,
    description,
    sr: `/kreatori/${p.username}`,
    en: `/en/creators/${p.username}`,
    type: "profile",
  });
}

export default async function CreatorProfilePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const creator = await load(username);
  if (!creator) notFound();

  const t = await getTranslations({ locale, namespace: "profile" });
  const format = await getFormatter({ locale });
  const { profile: p, socials, services, collaboration: collab, reviews, stats } = creator;

  const location = [p.city, p.country && label(COUNTRY_LABELS[p.country], locale)]
    .filter(Boolean)
    .join(", ");
  const languages = p.content_languages
    .map((code) => CONTENT_LANGUAGES.find((l) => l.code === code))
    .filter(Boolean)
    .map((l) => label(l!.label, locale));
  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : null;
  const sortedServices = [...services].sort(
    (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity)
  );
  const startingPrice = sortedServices.find((s) => s.price_min != null);
  const dateFmt = new Intl.DateTimeFormat(locale === "sr" ? "sr-Latn-RS" : "en-GB", {
    month: "long",
    year: "numeric",
  });

  const url = `${SITE_URL}${locale === "sr" ? "" : "/en"}/${locale === "sr" ? "kreatori" : "creators"}/${p.username}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    dateCreated: p.created_at,
    mainEntity: {
      "@type": "Person",
      name: p.full_name,
      alternateName: p.username,
      description: p.bio ?? undefined,
      image: p.avatar_url ?? undefined,
      address: p.city ? { "@type": "PostalAddress", addressLocality: p.city, addressCountry: p.country } : undefined,
      knowsLanguage: p.content_languages,
      sameAs: socials.map((s) => s.profile_url).filter(Boolean),
      ...(avgRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avgRating.toFixed(1),
              reviewCount: reviews.length,
              bestRating: 5,
            },
          }
        : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar solid />
      <main className="pt-16 pb-20">
        {/* Cover */}
        <div className="h-36 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 sm:h-44" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Left column */}
            <div className="min-w-0">
              <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
                <Avatar
                  src={p.avatar_url}
                  name={p.full_name}
                  size={128}
                  className="border-4 border-white shadow-lift"
                />
                <div className="pb-1">
                  <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-bold tracking-tight">
                    {p.full_name}
                    {p.verified_at && (
                      <BadgeCheck
                        className="h-7 w-7 text-brand-500"
                        aria-label={t("verified")}
                        // native tooltip explains what the badge certifies
                        {...{ title: t("verifiedMeaning") }}
                      />
                    )}
                  </h1>
                  <p className="mt-1 text-muted">@{p.username}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted" />
                    {location}
                  </span>
                )}
                {languages.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Languages className="h-4 w-4 text-muted" />
                    {languages.join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted" />
                  {t("memberSince", { date: dateFmt.format(new Date(p.created_at)) })}
                </span>
                {avgRating != null && (
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Stars value={avgRating} />
                    {avgRating.toFixed(1)}
                    <span className="font-normal text-muted">({reviews.length})</span>
                  </span>
                )}
              </div>

              {creator.categories.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {creator.categories.map((slug) => {
                    const c = categoryBySlug(slug);
                    if (!c) return null;
                    return (
                      <Link
                        key={slug}
                        href={{ pathname: "/creators/category/[slug]", params: { slug } }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                      >
                        <span aria-hidden>{c.emoji}</span>
                        {label(c.label, locale)}
                      </Link>
                    );
                  })}
                </div>
              )}

              {p.bio && (
                <section className="mt-8">
                  <h2 className="sr-only">{t("about")}</h2>
                  <p className="max-w-2xl text-base leading-relaxed whitespace-pre-line text-ink-soft">
                    {p.bio}
                  </p>
                </section>
              )}

              {/* Networks & audience */}
              {socials.length > 0 && (
                <section className="mt-10">
                  <h2 className="font-display text-xl font-bold">{t("networks")}</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[...socials]
                      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
                      .map((s) => (
                        <div key={s.id} className="card p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft">
                                <SocialIcon platform={s.platform} className="text-ink" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted">{PLATFORM_LABELS[s.platform]}</p>
                                {s.profile_url ? (
                                  <a
                                    href={s.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="block truncate font-semibold hover:text-brand-700"
                                  >
                                    @{s.handle}
                                  </a>
                                ) : (
                                  <p className="truncate font-semibold">@{s.handle}</p>
                                )}
                              </div>
                            </div>
                            {s.is_primary && <Badge tone="accent">{t("primary")}</Badge>}
                          </div>
                          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <dt className="flex items-center gap-1 text-xs text-muted">
                                <Users className="h-3.5 w-3.5" />
                                {t("followers")}
                              </dt>
                              <dd className="mt-0.5 font-semibold">{FOLLOWER_RANGE_LABELS[s.follower_range]}</dd>
                            </div>
                            {s.engagement_rate != null && (
                              <div>
                                <dt className="text-xs text-muted">{t("engagement")}</dt>
                                <dd className="mt-0.5 font-semibold">{s.engagement_rate}%</dd>
                              </div>
                            )}
                            {s.avg_views != null && (
                              <div>
                                <dt className="flex items-center gap-1 text-xs text-muted">
                                  <Eye className="h-3.5 w-3.5" />
                                  {t("avgViews")}
                                </dt>
                                <dd className="mt-0.5 font-semibold">{formatNumber(s.avg_views, locale)}</dd>
                              </div>
                            )}
                            {s.audience_gender && (
                              <div>
                                <dt className="text-xs text-muted">{t("audienceGender")}</dt>
                                <dd className="mt-0.5 font-semibold">
                                  {label(AUDIENCE_GENDER_LABELS[s.audience_gender], locale)}
                                </dd>
                              </div>
                            )}
                            {s.audience_top_age && (
                              <div>
                                <dt className="text-xs text-muted">{t("audienceAge")}</dt>
                                <dd className="mt-0.5 font-semibold">{AGE_RANGE_LABELS[s.audience_top_age]}</dd>
                              </div>
                            )}
                            {s.audience_countries.length > 0 && (
                              <div className="col-span-2">
                                <dt className="flex items-center gap-1 text-xs text-muted">
                                  <Globe2 className="h-3.5 w-3.5" />
                                  {t("audienceCountries")}
                                </dt>
                                <dd className="mt-0.5 font-semibold">
                                  {s.audience_countries.map((c) => label(COUNTRY_LABELS[c], locale)).join(", ")}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">{t("selfReported")}</p>
                </section>
              )}

              {/* Services */}
              {sortedServices.length > 0 && (
                <section className="mt-10">
                  <h2 className="font-display text-xl font-bold">{t("services")}</h2>
                  <div className="card mt-4 divide-y divide-line">
                    {sortedServices.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                        <span className="text-ink-soft">{label(SERVICE_LABELS[s.service_type], locale)}</span>
                        <span className="font-semibold">
                          {formatPrice(s.price_min, s.price_max, s.currency, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">{t("pricesNote")}</p>
                </section>
              )}

              {/* Barter */}
              {collab && collab.barter !== "no" && (
                <section className="mt-10">
                  <h2 className="font-display text-xl font-bold">{t("barter")}</h2>
                  <div className="card mt-4 p-5">
                    <p className="flex items-center gap-2 font-semibold">
                      <Gift className="h-4.5 w-4.5 text-accent-500" />
                      {label(BARTER_PREF_LABELS[collab.barter], locale)}
                    </p>
                    {collab.barter_types.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {collab.barter_types.map((b) => (
                          <Badge key={b} tone="neutral">
                            {label(BARTER_TYPE_LABELS[b], locale)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {collab.barter_min_value != null && (
                      <p className="mt-3 text-sm text-ink-soft">
                        {t("barterMin", { value: formatNumber(collab.barter_min_value, locale), currency: collab.currency })}
                      </p>
                    )}
                    {collab.notes && <p className="mt-3 text-sm text-ink-soft">{collab.notes}</p>}
                  </div>
                </section>
              )}

              {/* Reviews */}
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold">{t("reviews")}</h2>
                {reviews.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {reviews.map((r) => (
                      <li key={r.id} className="card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <Stars value={r.rating} />
                          <time className="text-xs text-muted" dateTime={r.created_at}>
                            {dateFmt.format(new Date(r.created_at))}
                          </time>
                        </div>
                        {r.comment && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.comment}</p>}
                        <p className="mt-2 text-xs text-muted">{t("verifiedCollab")}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">{t("noReviews")}</p>
                )}
              </section>
            </div>

            {/* Right column — sticky collaboration card */}
            <aside className="lg:pt-8">
              <div id="saradnja" className="card sticky top-24 scroll-mt-24 p-6">
                <p className="text-sm text-muted">{t("startingFrom")}</p>
                <p className="mt-1 font-display text-3xl font-bold">
                  {startingPrice
                    ? `${formatNumber(startingPrice.price_min!, locale)} ${startingPrice.currency}`
                    : t("onRequest")}
                </p>
                {startingPrice && (
                  <p className="text-xs text-muted">{label(SERVICE_LABELS[startingPrice.service_type], locale)}</p>
                )}
                <ul className="mt-5 space-y-2.5 text-sm">
                  {stats.response_rate != null ? (
                    <li className="flex items-center gap-2.5">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <span>
                        <span className="font-semibold">{t("responseRate")}: {stats.response_rate}%</span>
                        {stats.median_response_hours != null && (
                          <span className="text-muted">
                            {" · "}
                            {t("responseTime")} {t("responseHours", { hours: Math.max(1, stats.median_response_hours) })}
                          </span>
                        )}
                      </span>
                    </li>
                  ) : (
                    <li className="flex items-center gap-2.5 text-muted">
                      <Zap className="h-4 w-4" />
                      {t("noStats")}
                    </li>
                  )}
                  {stats.last_active_at && (
                    <li className="flex items-center gap-2.5 text-muted">
                      <Calendar className="h-4 w-4" />
                      {t("lastActive", {
                        when: format.relativeTime(new Date(stats.last_active_at), new Date()),
                      })}
                    </li>
                  )}
                  {collab && (
                    <li className="flex items-center gap-2.5">
                      <Gift className="h-4 w-4 text-muted" />
                      {label(BARTER_PREF_LABELS[collab.barter], locale)}
                    </li>
                  )}
                  {collab?.min_budget != null && (
                    <li className="flex items-center gap-2.5">
                      <span className="w-4 text-center font-bold text-muted">€</span>
                      {t("minBudget", { value: formatNumber(collab.min_budget, locale), currency: collab.currency })}
                    </li>
                  )}
                  {collab?.open_to_travel && (
                    <li className="flex items-center gap-2.5">
                      <Plane className="h-4 w-4 text-muted" />
                      {t("openToTravel")}
                    </li>
                  )}
                </ul>
                <div className="mt-6">
                  <ProfileActions influencerId={p.id} username={p.username ?? ""} />
                </div>
                <p className="mt-5 flex items-start gap-2 rounded-xl bg-surface-soft px-3.5 py-3 text-xs leading-relaxed text-muted">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("contactPrivacy")}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile: the collaboration card sits at the bottom — keep the CTA reachable */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 shadow-lift backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">{t("startingFrom")}</p>
            <p className="truncate font-display font-bold">
              {startingPrice
                ? `${formatNumber(startingPrice.price_min!, locale)} ${startingPrice.currency}`
                : t("onRequest")}
            </p>
          </div>
          <a
            href="#saradnja"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 px-5 text-sm font-semibold text-white shadow-lift"
          >
            {t("sendRequest")}
          </a>
        </div>
      </div>
      <Footer />
      {/* spacer so the fixed mobile CTA bar never covers the footer */}
      <div aria-hidden className="h-[4.5rem] lg:hidden" />
    </>
  );
}
