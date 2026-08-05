---
name: Valen route path
description: Why the Valen AI search route lives at /valen instead of /api/valen
---

The api-server artifact in artifact.toml claims `paths = ["/api"]` at the Replit proxy layer. Any browser fetch to `/api/*` is routed to the api-server on port 8080, NOT to the Next.js app on port 3000.

**Why:** All Next.js route handlers that need to be reachable from the browser must be placed outside `/api/`. The Valen route is at `app/valen/route.ts` → accessible at `/valen`.

**How to apply:** Any new Next.js API route handler must avoid the `/api` prefix. Use paths like `/valen`, `/admin/auth/`, etc.
