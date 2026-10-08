"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  CATEGORIES,
  COMPANY_INDUSTRIES,
  COMPANY_SIZES,
  COMPANY_TYPES,
  COUNTRIES,
  CURRENCIES,
  type CompanyIndustry,
  type CompanySize,
  type CompanyType,
  type Country,
  type Currency,
} from "@/lib/taxonomy";
import { isValidRegistrationNumber, isValidTaxId, normalizeUrl } from "@/lib/validation";

export interface CompanyInput {
  name: string;
  legal_name: string;
  company_type: CompanyType;
  tax_id: string;
  registration_number: string;
  industry: CompanyIndustry;
  size: CompanySize | "";
  website: string;
  instagram: string;
  country: Country;
  city: string;
  description: string;
  contact_name: string;
  contact_role: string;
  interested_categories: string[];
  budget_min: string;
  budget_max: string;
  currency: Currency;
  contact_email: string;
  phone: string;
}

export type CompanyResult = { ok: boolean; demo?: boolean; error?: string; field?: string };

const intOrNull = (v: string) => {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

/** Saves the company profile (onboarding + later edits). */
export async function saveCompanyProfile(
  input: CompanyInput,
  completed: boolean
): Promise<CompanyResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  // --- Validation (server is the source of truth) -------------------
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "required", field: "name" };
  if (!COMPANY_TYPES.includes(input.company_type)) return { ok: false, error: "invalid" };
  if (!COMPANY_INDUSTRIES.includes(input.industry)) return { ok: false, error: "invalid" };
  if (!COUNTRIES.includes(input.country)) return { ok: false, error: "invalid" };
  if (input.size && !COMPANY_SIZES.includes(input.size)) return { ok: false, error: "invalid" };
  if (!CURRENCIES.includes(input.currency)) return { ok: false, error: "invalid" };

  const taxId = input.tax_id.replace(/[\s-]/g, "");
  if (taxId && !isValidTaxId(input.country, taxId)) {
    return { ok: false, error: "tax_id_invalid", field: "tax_id" };
  }
  if (completed && !taxId) return { ok: false, error: "required", field: "tax_id" };

  const regNo = input.registration_number.replace(/[\s-]/g, "");
  if (regNo && !isValidRegistrationNumber(input.country, regNo)) {
    return { ok: false, error: "reg_no_invalid", field: "registration_number" };
  }

  let website: string | null = null;
  if (input.website.trim()) {
    website = normalizeUrl(input.website);
    if (!website) return { ok: false, error: "url_invalid", field: "website" };
  }

  const contactName = input.contact_name.trim();
  if (completed && !contactName) return { ok: false, error: "required", field: "contact_name" };

  const budgetMin = intOrNull(input.budget_min);
  const budgetMax = intOrNull(input.budget_max);
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return { ok: false, error: "budget_order", field: "budget_max" };
  }

  const validSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const categories = input.interested_categories.filter((s) => validSlugs.has(s)).slice(0, 10);

  // --- Writes -------------------------------------------------------
  // UPDATE, not upsert: ON CONFLICT DO UPDATE needs SELECT on every column,
  // but authenticated only sees the public company columns (0014).
  // The row always exists — handle_new_user creates it at sign-up.
  const companyRow = {
    name: name.slice(0, 120),
    legal_name: input.legal_name.trim().slice(0, 200) || null,
    company_type: input.company_type,
    tax_id: taxId || null,
    registration_number: regNo || null,
    industry: input.industry,
    size: input.size || null,
    website,
    instagram: input.instagram.trim().replace(/^@/, "").slice(0, 100) || null,
    country: input.country,
    city: input.city.trim().slice(0, 80) || null,
    description: input.description.trim().slice(0, 600) || null,
    contact_name: contactName.slice(0, 100) || null,
    contact_role: input.contact_role.trim().slice(0, 100) || null,
    interested_categories: categories,
    budget_min: budgetMin,
    budget_max: budgetMax,
    currency: input.currency,
  };
  const { error: companyError, count } = await supabase
    .from("companies")
    .update(companyRow, { count: "exact" })
    .eq("profile_id", user.id);
  if (companyError) return { ok: false, error: "save_failed" };
  if (!count) {
    const { error: insertError } = await supabase
      .from("companies")
      .insert({ profile_id: user.id, ...companyRow });
    if (insertError) return { ok: false, error: "save_failed" };
  }

  const phone = input.phone.trim().slice(0, 30);
  const [profileRes, contactRes] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        full_name: contactName.slice(0, 100) || undefined,
        country: input.country,
        city: input.city.trim().slice(0, 80) || null,
        ...(completed ? { onboarding_completed: true } : {}),
      })
      .eq("id", user.id),
    supabase.from("contact_prefs").upsert({
      profile_id: user.id,
      contact_email: input.contact_email.trim().slice(0, 254) || null,
      phone: phone || null,
      preferred_channel: "platform",
      allowed_channels: phone ? ["platform", "email", "phone"] : ["platform", "email"],
      allow_platform_messages: true,
      email_notifications: true,
    }),
  ]);
  if (profileRes.error || contactRes.error) return { ok: false, error: "save_failed" };

  revalidatePath("/", "layout");
  return { ok: true };
}
