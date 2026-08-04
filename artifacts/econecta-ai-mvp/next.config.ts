import type { NextConfig } from "next";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  allowedDevOrigins: replitDevDomain
    ? [`https://${replitDevDomain}`]
    : [],
};

export default nextConfig;
