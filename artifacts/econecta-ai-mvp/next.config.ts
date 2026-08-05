import type { NextConfig } from "next";

// Hard-code every known Replit origin format so Next.js never blocks
// the dev proxy regardless of when process.env is evaluated.
const replitDomain =
  process.env.REPLIT_DEV_DOMAIN ??
  "27980a73-5b38-4aae-8ada-d6c229651b42-00-zvix0p9jyifv.kirk.replit.dev";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    replitDomain,                   // hostname only  (what Next.js logs show)
    `https://${replitDomain}`,      // full origin    (what the browser sends)
    `http://${replitDomain}`,       // http fallback
  ],
};

export default nextConfig;
