import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "../../lib/supabase";
import { isPromoActive, type SearchResult } from "../../lib/search";

/* ─────────────────────────────────────────────────────────────
   Rate limiter — in-memory, per IP
   10 requests per minute per IP
───────────────────────────────────────────────────────────── */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

/* ─────────────────────────────────────────────────────────────
   Structured search intent extracted from natural-language query
───────────────────────────────────────────────────────────── */
type SearchIntent = {
  category: string | null;
  product_or_service: string | null;
  city: string | null;
  neighborhood: string | null;
  wants_promotion: boolean;
  keywords: string[];
};

/* ─────────────────────────────────────────────────────────────
   Filler words stripped in deterministic fallback
───────────────────────────────────────────────────────────── */
const FILLER_WORDS = new Set([
  "quero", "uma", "um", "uns", "umas", "para", "tomar", "onde", "encontro",
  "encontrar", "bom", "boa", "bons", "boas", "amanhã", "cedo", "perto",
  "de", "em", "o", "a", "os", "as", "no", "na", "nos", "nas", "e", "que",
  "com", "por", "do", "da", "dos", "das", "ao", "à", "num", "numa", "é",
  "não", "tenho", "tem", "ter", "ser", "está", "estou", "preciso", "precisa",
  "gostaria", "queria", "barata", "barato", "boa", "bom", "melhor", "mais",
  "muito", "pouco", "algum", "alguma", "alguns", "algumas", "qualquer",
  "aqui", "lá", "agora", "hoje", "logo", "também", "só", "já", "ainda",
]);

/* ─────────────────────────────────────────────────────────────
   Supabase search helpers — server-side, public fields only
───────────────────────────────────────────────────────────── */
const PUBLIC_SELECT = [
  "id", "created_at", "business_name", "category", "city", "state",
  "neighborhood", "description", "opening_hours", "whatsapp", "instagram",
  "website", "promotion_title", "promotion_description",
  "discount_percentage", "promotion_expiration",
].join(", ");

const SEARCHABLE_FIELDS = [
  "business_name", "category", "city", "neighborhood",
  "description", "promotion_title", "promotion_description",
];

function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeLike(s: string): string {
  return s.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function buildOrFilter(term: string): string {
  const t = escapeLike(term);
  return SEARCHABLE_FIELDS.map((f) => `${f}.ilike.%${t}%`).join(",");
}

function sortResults(rows: SearchResult[]): SearchResult[] {
  return [...rows].sort((a, b) => {
    const aP = isPromoActive(a) ? 1 : 0;
    const bP = isPromoActive(b) ? 1 : 0;
    if (aP !== bP) return bP - aP;
    const aD = a.discount_percentage ?? 0;
    const bD = b.discount_percentage ?? 0;
    if (aD !== bD) return bD - aD;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/* ─────────────────────────────────────────────────────────────
   Search Supabase by structured intent using OR logic.
   Each extracted term is searched independently across all
   public fields — no term is required to match.
───────────────────────────────────────────────────────────── */
async function searchByIntent(intent: SearchIntent): Promise<{ data: SearchResult[]; error: string | null }> {
  // Collect all unique meaningful terms
  const termSet = new Set<string>();
  if (intent.category) {
    termSet.add(intent.category);
    // Also add singular stem (strip trailing 's') so "Padarias" → "Padaria"
    // matches business_name fields that store the singular form.
    const singular = intent.category.replace(/s$/i, "");
    if (singular !== intent.category) termSet.add(singular);
  }
  if (intent.product_or_service) termSet.add(intent.product_or_service);
  if (intent.city) termSet.add(intent.city);
  if (intent.neighborhood) termSet.add(intent.neighborhood);
  if (intent.wants_promotion) {
    termSet.add("promoção");
    termSet.add("desconto");
  }
  for (const kw of intent.keywords) {
    if (kw.trim().length >= 2) termSet.add(kw.trim());
  }

  const terms = [...termSet].filter(Boolean);
  if (terms.length === 0) {
    return { data: [], error: null };
  }

  // Also include accent-stripped variants
  const allTerms = new Set(terms);
  for (const t of terms) {
    const stripped = removeAccents(t);
    if (stripped !== t) allTerms.add(stripped);
  }

  // Run one query per term in parallel — pure OR, no required matches
  const queries = [...allTerms].map((term) =>
    supabase.from("businesses").select(PUBLIC_SELECT).or(buildOrFilter(term))
  );

  const results = await Promise.all(queries);

  // Surface first hard error
  for (const r of results) {
    if (r.error) return { data: [], error: r.error.message };
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

  return { data: sortResults(merged).slice(0, 10), error: null };
}

/* ─────────────────────────────────────────────────────────────
   Step 1a: Use OpenAI to extract structured intent.
   Returns null if extraction fails (caller uses fallback).
───────────────────────────────────────────────────────────── */
const INTENT_SYSTEM = `Você é um extrator de intenção de busca para uma plataforma brasileira de negócios locais.
Receba uma consulta em português e retorne APENAS um objeto JSON válido com estes campos exatos:
{
  "category": string ou null,
  "product_or_service": string ou null,
  "city": string ou null,
  "neighborhood": string ou null,
  "wants_promotion": boolean,
  "keywords": array de strings (máximo 4, somente termos relevantes para busca)
}
Exemplos de categorias: Padarias, Restaurantes, Farmácias, Supermercados, Eletrônicos, Moda.
Regras para keywords:
- Sempre inclua o tipo de negócio principal em keywords no singular (ex: se category é "Padarias", adicione "padaria" em keywords; se é "Restaurantes", adicione "restaurante").
- Inclua também produto/serviço específico mencionado (ex: "café", "croissant", "pizza").
- Não inclua palavras de preenchimento, adjetivos genéricos (barato, bom, perto), advérbios de tempo (amanhã, cedo, hoje).
Retorne somente o JSON, sem explicações.`;

type IntentResult =
  | { intent: SearchIntent; available: true }
  | { intent: null; available: boolean }; // available=false → skip all further OpenAI calls

async function extractIntent(
  openai: OpenAI,
  model: string,
  query: string
): Promise<IntentResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await openai.responses.create(
      { model, instructions: INTENT_SYSTEM, input: query },
      { signal: controller.signal }
    );
    const text = response.output_text?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { intent: null, available: true };
    const parsed = JSON.parse(jsonMatch[0]) as Partial<SearchIntent>;
    return {
      available: true,
      intent: {
        category: typeof parsed.category === "string" ? parsed.category : null,
        product_or_service:
          typeof parsed.product_or_service === "string" ? parsed.product_or_service : null,
        city: typeof parsed.city === "string" ? parsed.city : null,
        neighborhood:
          typeof parsed.neighborhood === "string" ? parsed.neighborhood : null,
        wants_promotion: parsed.wants_promotion === true,
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.filter((k): k is string => typeof k === "string").slice(0, 4)
          : [],
      },
    };
  } catch {
    // Any failure during intent extraction means we should not attempt the
    // response-generation call either — they use the same API key/endpoint,
    // so if one fails the other will too (auth, billing, timeout, network).
    // Returning available=false causes the handler to skip step 3 immediately.
    return { intent: null, available: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ─────────────────────────────────────────────────────────────
   Step 1b: Deterministic intent fallback — strip filler words,
   treat remaining tokens as keywords.
───────────────────────────────────────────────────────────── */
function buildFallbackIntent(query: string): SearchIntent {
  const tokens = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !FILLER_WORDS.has(t));

  // Detect "em <location>" pattern for city
  const emIdx = query.toLowerCase().indexOf(" em ");
  const city =
    emIdx !== -1 ? query.slice(emIdx + 4).trim().split(/[,.]/, 1)[0].trim() : null;

  return {
    category: null,
    product_or_service: null,
    city,
    neighborhood: null,
    wants_promotion:
      query.toLowerCase().includes("desconto") ||
      query.toLowerCase().includes("promoção") ||
      query.toLowerCase().includes("barato") ||
      query.toLowerCase().includes("barata"),
    keywords: [...new Set(tokens)].slice(0, 4),
  };
}

/* ─────────────────────────────────────────────────────────────
   Build a compact, public-safe context block for OpenAI response.
   Never includes owner_name, email, phone.
───────────────────────────────────────────────────────────── */
function buildContext(records: SearchResult[]): string {
  return records
    .slice(0, 10)
    .map((b, i) => {
      const parts: string[] = [`${i + 1}. ${b.business_name} (${b.category})`];
      const location = [b.neighborhood, b.city, b.state].filter(Boolean).join(", ");
      if (location) parts.push(`   Localização: ${location}`);
      if (b.description) parts.push(`   Descrição: ${b.description}`);
      if (b.opening_hours) parts.push(`   Horário: ${b.opening_hours}`);

      const active = isPromoActive(b);
      if (active && b.promotion_title) {
        parts.push(`   Promoção ATIVA: ${b.promotion_title}`);
        if (b.promotion_description) parts.push(`   Detalhes: ${b.promotion_description}`);
        if (b.discount_percentage != null) parts.push(`   Desconto: ${b.discount_percentage}%`);
        if (b.promotion_expiration) {
          const d = new Date(b.promotion_expiration + "T00:00:00");
          parts.push(`   Válido até: ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}`);
        }
      } else if (b.promotion_title) {
        parts.push(`   Promoção EXPIRADA: ${b.promotion_title} (não apresentar como ativa)`);
      }

      const contacts: string[] = [];
      if (b.whatsapp) contacts.push(`WhatsApp: ${b.whatsapp}`);
      if (b.instagram) contacts.push(`Instagram: ${b.instagram}`);
      if (b.website) contacts.push(`Site: ${b.website}`);
      if (contacts.length) parts.push(`   Contato: ${contacts.join(" | ")}`);

      return parts.join("\n");
    })
    .join("\n\n");
}

function buildFallbackMessage(count: number, query: string): string {
  if (count === 0)
    return `Não encontrei resultados cadastrados para "${query}". Tente outros termos ou categorias.`;
  if (count === 1) return `Encontrei 1 opção para você.`;
  return `Encontrei ${count} opções para você.`;
}

/* ─────────────────────────────────────────────────────────────
   POST /valen — main handler
   Flow:
     1. Rate limit + validate input
     2. Extract intent (OpenAI → deterministic fallback)
     3. Search Supabase by structured intent (OR logic)
     4. Generate Portuguese response (OpenAI → message fallback)
───────────────────────────────────────────────────────────── */
const RESPONSE_SYSTEM = `Você é Valen, assistente da EconectaAI — plataforma brasileira de busca de promoções e descontos locais.

Regras absolutas:
- Responda SEMPRE em português brasileiro.
- Baseie-se EXCLUSIVAMENTE nos dados fornecidos. Nunca invente negócios, preços, descontos, endereços, horários ou promoções.
- Se a informação não estiver nos dados, diga que não foi fornecida.
- Promoções marcadas como EXPIRADAS não devem ser apresentadas como ativas.
- Mencione no máximo 5 estabelecimentos por resposta.
- Seja conciso e útil — máximo 4 frases.
- Nunca revele dados privados (e-mail, telefone fixo, nome do proprietário).
- Prefira estabelecimentos com promoção ativa, depois maior desconto, depois mais recentes.`;

export async function POST(req: NextRequest) {
  // ── Rate limit ──
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde um momento e tente novamente." },
      { status: 429 }
    );
  }

  // ── Validate input ──
  let query: string;
  try {
    const body = await req.json();
    if (typeof body?.query !== "string") throw new Error("invalid");
    query = body.query.trim().slice(0, 500);
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: "A busca não pode estar vazia." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  // maxRetries: 0 ensures we fail fast on 401/network errors and reach the
  // deterministic fallback immediately rather than waiting on SDK retry delays.
  const openai = apiKey && model ? new OpenAI({ apiKey, maxRetries: 0 }) : null;

  // ── Step 1: Extract intent ──
  let intent: SearchIntent;
  let intentSource: "openai" | "fallback";
  let openaiAvailable = !!openai; // flips to false on auth errors, skipping step 3

  if (openai && model) {
    const result = await extractIntent(openai, model, query);
    if (result.intent) {
      intent = result.intent;
      intentSource = "openai";
      console.log(
        `[valen] intent extraction: OK | category="${intent.category}" | keywords=[${intent.keywords.join(", ")}] | wants_promotion=${intent.wants_promotion}`
      );
    } else {
      intent = buildFallbackIntent(query);
      intentSource = "fallback";
      openaiAvailable = result.available; // false = auth error, skip response call
      console.log(
        `[valen] intent extraction: FAILED (available=${result.available}) → deterministic fallback | keywords=[${intent.keywords.join(", ")}]`
      );
    }
  } else {
    intent = buildFallbackIntent(query);
    intentSource = "fallback";
    openaiAvailable = false;
    console.log(
      `[valen] intent extraction: no API key → deterministic fallback | keywords=[${intent.keywords.join(", ")}]`
    );
  }

  // ── Step 2: Search Supabase by intent ──
  const { data: results, error: searchError } = await searchByIntent(intent);

  if (searchError) {
    return NextResponse.json({ error: searchError }, { status: 500 });
  }

  console.log(`[valen] Supabase candidates: ${results.length} (intent source: ${intentSource})`);

  // ── Step 3: Generate Portuguese response ──
  // Skip if OpenAI is unavailable (no key, or auth error on step 1)
  if (!openai || !model || !openaiAvailable) {
    return NextResponse.json({
      message: buildFallbackMessage(results.length, query),
      results,
      source: "fallback" as const,
    });
  }

  const context =
    results.length === 0
      ? "Nenhum estabelecimento cadastrado foi encontrado para esta busca."
      : buildContext(results);

  const userMessage = `Mensagem do usuário: "${query}"

Estabelecimentos encontrados:
${context}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await openai.responses.create(
      { model, instructions: RESPONSE_SYSTEM, input: userMessage },
      { signal: controller.signal }
    );
    const aiMessage = response.output_text?.trim() ?? buildFallbackMessage(results.length, query);
    console.log("[valen] OpenAI response: OK");

    return NextResponse.json({
      message: aiMessage,
      results,
      source: "openai" as const,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "unknown";
    console.error("[valen] OpenAI response: FAILED —", errMsg);

    return NextResponse.json({
      message: buildFallbackMessage(results.length, query),
      results,
      source: "fallback" as const,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
