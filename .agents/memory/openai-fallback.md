---
name: OpenAI fallback pattern
description: How to avoid double timeouts when OpenAI is unavailable
---

**Rule:** If intent extraction (step 1) fails for ANY reason, return `available: false`. The POST handler skips response generation (step 3) entirely and returns the fallback message immediately.

**Why:** Both calls use the same API key and endpoint. If one fails (auth, billing/429, timeout, network), the other will too. Running both wastes up to 13s (5s + 8s timeouts) on every request when OpenAI is down.

**How to apply:**
```typescript
} catch {
  // Any failure → skip response generation too
  return { intent: null, available: false };
}
```
In the POST handler: `if (!openai || !model || !openaiAvailable) { return fallback; }`

**Timeouts:**
- Intent extraction: 5s AbortController
- Response generation: 8s AbortController  
- Both use `maxRetries: 0` on the OpenAI client to prevent SDK retry delays

**Current status (2026-08-05):** Account has no OpenAI credits (429). Deterministic fallback is active. Fallback extracts keywords by stripping filler words and still returns correct Supabase results.
