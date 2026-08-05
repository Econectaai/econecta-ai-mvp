import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { searchBusinesses, isPromoActive, type SearchResult } from "../../lib/search";

/* ─────────────────────────────────────────────
   Rate limiter — in-memory, per IP
   Max RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS
───────────────────────────────────────────── */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

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

/* ─────────────────────────────────────────────
   Build a safe, compact context string for OpenAI.
   Never includes owner_name, email, phone, or id.
───────────────────────────────────────────── */
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
          parts.push(
            `   Válido até: ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}`
          );
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

/* ─────────────────────────────────────────────
   POST /valen
───────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  // IP for rate limiting
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

  // Parse + validate body
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

  // Search Supabase
  const { data: results, error: searchError } = await searchBusinesses(query);

  if (searchError) {
    return NextResponse.json({ error: searchError }, { status: 500 });
  }

  // If OpenAI key is missing, fall back to v1
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({
      message: buildFallbackMessage(results.length, query),
      results,
      source: "fallback" as const,
    });
  }

  // Try OpenAI — timeout after 15s
  try {
    const openai = new OpenAI({ apiKey });

    const context =
      results.length === 0
        ? "Nenhum estabelecimento cadastrado foi encontrado para esta busca."
        : buildContext(results);

    const systemPrompt = `Você é Valen, assistente da EconectaAI — uma plataforma brasileira de busca de promoções e descontos locais.

Regras absolutas:
- Responda SEMPRE em português brasileiro.
- Baseie-se EXCLUSIVAMENTE nos dados fornecidos. Nunca invente negócios, preços, descontos, endereços, horários ou promoções.
- Se a informação não estiver nos dados, diga que não foi fornecida.
- Promoções marcadas como EXPIRADAS não devem ser apresentadas como ativas.
- Mencione no máximo 5 estabelecimentos por resposta.
- Seja conciso e útil — máximo 4 frases.
- Nunca revele dados privados (e-mail, telefone fixo, nome do proprietário).
- Prefira estabelecimentos com promoção ativa, depois maior desconto, depois mais recentes.`;

    const userMessage = `Busca do usuário: "${query}"

Dados disponíveis:
${context}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let aiMessage: string;

    try {
      const response = await openai.responses.create(
        {
          model,
          instructions: systemPrompt,
          input: userMessage,
        },
        { signal: controller.signal }
      );
      aiMessage = response.output_text?.trim() ?? buildFallbackMessage(results.length, query);
    } finally {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({
      message: aiMessage,
      results,
      source: "openai" as const,
    });
  } catch (err) {
    // OpenAI unavailable — fall back gracefully
    console.error("[valen/route] OpenAI error, using fallback:", err instanceof Error ? err.message : "unknown");

    return NextResponse.json({
      message: buildFallbackMessage(results.length, query),
      results,
      source: "fallback" as const,
    });
  }
}

function buildFallbackMessage(count: number, query: string): string {
  if (count === 0) return `Não encontrei resultados cadastrados para "${query}". Tente outros termos ou categorias.`;
  if (count === 1) return `Encontrei 1 opção para você.`;
  return `Encontrei ${count} opções para você.`;
}
