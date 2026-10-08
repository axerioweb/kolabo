import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // Balkan market — one shared zone avoids server/client date mismatches
    timeZone: "Europe/Belgrade",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
