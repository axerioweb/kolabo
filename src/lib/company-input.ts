import type { CompanyInput } from "@/app/actions/company";
import type { CompanyFull } from "./types";

/** Maps stored company rows into the editable form shape. */
export function toCompanyInput(c: CompanyFull, fallbackEmail?: string | null): CompanyInput {
  const x = c.company;
  return {
    name: x.name ?? "",
    legal_name: x.legal_name ?? "",
    company_type: x.company_type,
    tax_id: x.tax_id ?? "",
    registration_number: x.registration_number ?? "",
    industry: x.industry,
    size: x.size ?? "",
    website: x.website ?? "",
    instagram: x.instagram ?? "",
    country: x.country,
    city: x.city ?? "",
    description: x.description ?? "",
    contact_name: x.contact_name ?? c.profile.full_name ?? "",
    contact_role: x.contact_role ?? "",
    interested_categories: x.interested_categories ?? [],
    budget_min: x.budget_min?.toString() ?? "",
    budget_max: x.budget_max?.toString() ?? "",
    currency: x.currency,
    contact_email: c.contact?.contact_email ?? fallbackEmail ?? "",
    phone: c.contact?.phone ?? "",
  };
}
