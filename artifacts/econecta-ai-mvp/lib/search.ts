import { supabase } from "./supabase";

// Public-safe subset — never expose owner_name, email, phone
export type SearchResult = {
  id: string;
  created_at: string;
  business_name: string;
  category: string;
  city: string;
  state: string;
  neighborhood?: string | null;
  description?: string | null;
  opening_hours?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  promotion_title?: string | null;
  promotion_description?: string | null;
  discount_percentage?: number | null;
  promotion_expiration?: string | null;
};

/** Strip diacritics so "farmacia" also matches "Farmácias". */
function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Escape % and _ to prevent ilike injection. */
function escapeLike(s: string): string {
  return s.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Build a Supabase OR filter string for one search term across all public fields. */
function buildOrFilter(term: string): string {
  const t = escapeLike(term);
  const fields = [
    "business_name",
    "category",
    "city",
    "neighborhood",
    "description",
    "promotion_title",
    "promotion_description",
  ];
  return fields.map((f) => `${f}.ilike.%${t}%`).join(",");
}

/** Columns to select — excludes private fields. */
const PUBLIC_SELECT = [
  "id",
  "created_at",
  "business_name",
  "category",
  "city",
  "state",
  "neighborhood",
  "description",
  "opening_hours",
  "whatsapp",
  "instagram",
  "website",
  "promotion_title",
  "promotion_description",
  "discount_percentage",
  "promotion_expiration",
].join(", ");

/** Returns true if the business has a promotion that is current (expiry null or in the future). */
export function isPromoActive(biz: SearchResult): boolean {
  if (!biz.promotion_title) return false;
  if (!biz.promotion_expiration) return true; // no expiry = always active
  const exp = new Date(biz.promotion_expiration);
  exp.setHours(23, 59, 59, 999);
  return exp >= new Date();
}

/** Sort: active promos first → highest discount → newest record. */
function sortResults(rows: SearchResult[]): SearchResult[] {
  return [...rows].sort((a, b) => {
    const aP = isPromoActive(a) ? 1 : 0;
    const bP = isPromoActive(b) ? 1 : 0;
    if (aP !== bP) return bP - aP;

    const aD = a.discount_percentage ?? 0;
    const bD = b.discount_percentage ?? 0;
    if (aD !== bD) return bD - aD;

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export type SearchResponse = {
  data: SearchResult[];
  error: string | null;
};

/**
 * Main search function.
 * Parses "pizza em Santo André" → businessTerm="pizza", locationTerm="Santo André".
 * Runs two parallel queries (original + accent-stripped term) and deduplicates.
 */
export async function searchBusinesses(rawQuery: string): Promise<SearchResponse> {
  const query = rawQuery.trim();
  if (!query) return { data: [], error: null };

  // Parse "X em Y" → businessTerm=X, locationTerm=Y
  const emMatch = query.match(/\bem\s+(.+)$/i);
  const locationTerm = emMatch ? emMatch[1].trim() : null;
  const businessTerm = emMatch
    ? query.slice(0, emMatch.index).trim() || query
    : query;

  const businessTermNorm = removeAccents(businessTerm);
  const needsNormQuery = businessTermNorm !== businessTerm;

  // Build base queries
  async function runQuery(term: string) {
    let q = supabase
      .from("businesses")
      .select(PUBLIC_SELECT)
      .or(buildOrFilter(term));

    // If location was extracted, also filter by city/neighborhood AND business term
    if (locationTerm) {
      const locNorm = removeAccents(locationTerm);
      const locFilter =
        locNorm !== locationTerm
          ? `city.ilike.%${escapeLike(locationTerm)}%,neighborhood.ilike.%${escapeLike(locationTerm)}%,city.ilike.%${escapeLike(locNorm)}%,neighborhood.ilike.%${escapeLike(locNorm)}%`
          : `city.ilike.%${escapeLike(locationTerm)}%,neighborhood.ilike.%${escapeLike(locationTerm)}%`;
      q = q.or(locFilter);
    }

    return q;
  }

  // Run accent-original and accent-stripped queries in parallel
  const promises: Promise<{ data: SearchResult[] | null; error: unknown }>[] = [
    runQuery(businessTerm) as Promise<{ data: SearchResult[] | null; error: unknown }>,
  ];
  if (needsNormQuery) {
    promises.push(runQuery(businessTermNorm) as Promise<{ data: SearchResult[] | null; error: unknown }>);
  }

  const results = await Promise.all(promises);

  // Surface the first error
  for (const r of results) {
    if (r.error) {
      const err = r.error as { message?: string };
      return { data: [], error: err.message ?? "Erro na busca." };
    }
  }

  // Merge and deduplicate by id
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of results) {
    for (const row of (r.data ?? []) as SearchResult[]) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        merged.push(row);
      }
    }
  }

  return { data: sortResults(merged), error: null };
}
