---
name: Valen v2 architecture
description: Two-step OpenAI flow for natural language business search
---

Route: `artifacts/econecta-ai-mvp/app/valen/route.ts` (POST /valen, server-only)

**Flow:**
1. Rate limit (10 req/min per IP, in-memory map)
2. Extract structured intent via OpenAI Responses API (`openai.responses.create`)
   - Fields: category, product_or_service, city, neighborhood, wants_promotion, keywords[]
   - 5s AbortController timeout, maxRetries: 0
   - Failure → deterministic fallback: strip Portuguese filler words, extract remaining tokens
3. Search Supabase using extracted terms with pure OR logic (no required matches)
   - One query per unique term across 7 searchable fields via ilike
   - Accent-stripped variants run in parallel
   - Results merged, deduped by id, sorted: active promos → highest discount → newest
   - Limited to 10 records
4. Generate Portuguese response via OpenAI (only if step 2 succeeded)
   - 8s timeout, same client (maxRetries: 0)
   - Failure → count-based fallback message

**Why OR logic for search:** Natural language queries like "Quero uma padaria barata" extract multiple terms (padaria, café, barata). No single term should be required — any match returns the candidate.

**Key security:** PUBLIC_SELECT excludes owner_name, email, phone. Context sent to OpenAI also excludes all private fields.

**Filler words stripped in fallback:** quero, uma, um, para, tomar, onde, encontro, bom, boa, amanhã, cedo, perto, de, em, o, a, os, as, no, na, nos, nas, e, que, com, por, do, da, dos, das, ao, à, num, numa, é, não, (and more)
