---
name: Auth routes
description: Why admin auth is at /admin/auth/ and how cookies are signed
---

All `/api/*` requests are intercepted by the api-server artifact at the Replit proxy layer and routed to port 8080. To keep auth in the Next.js app (port 3000), all auth routes were placed at `/admin/auth/`:

- POST `/admin/auth/login` → `app/admin/auth/login/route.ts`
- POST `/admin/auth/logout` → `app/admin/auth/logout/route.ts`

**Cookie signing:** HMAC-SHA256 using Web Crypto API (`crypto.subtle`). Works in both Edge middleware and Node.js API routes without external libraries. Token is `base64(payload).base64(signature)`.

**After login:** Uses `window.location.replace("/admin")` (hard redirect), NOT `router.push`. Soft Next.js navigation caused the Replit preview iframe to show the landing page instead of the admin panel.

**Middleware:** `middleware.ts` protects `/admin/*` except `/admin/login` and `/admin/auth/*`.

**Why:** The `/api` path conflict with the api-server artifact is permanent (registered artifact path). Any new auth-like routes must avoid `/api/` prefix.
