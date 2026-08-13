import type { NextConfig } from "next";

/**
 * The one inline script on the page — the blocking theme-init script in
 * `app/layout.tsx` that reads `localStorage` before paint to avoid a flash of
 * the wrong theme. Its exact source is hashed here so the CSP can allow only
 * this literal script and nothing else, without falling back to
 * `'unsafe-inline'` and without switching the app to nonce-based CSP (which
 * would force every one of its ~119 static pages into dynamic rendering).
 * If that script's source ever changes, this hash must be regenerated:
 *   node -e "console.log('sha256-' + require('crypto').createHash('sha256').update(SCRIPT_SOURCE, 'utf8').digest('base64'))"
 */
const THEME_INIT_SCRIPT_HASH = "sha256-7aN+fbKypNNZzhDJXeiiVjZoYxJoDnOVEb4QMdPt4G0=";

const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  `script-src 'self' '${THEME_INIT_SCRIPT_HASH}'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind v4 and several widgets emit inline `style` attributes/CSS-in-JS at
  // runtime (e.g. progress bars, gradient positions) — an inline-style CSP that
  // still blocks arbitrary *script* injection is the practical tradeoff here.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .concat(";");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // `payment=(self)` rather than `payment=()`: this site does not use the
    // Payment Request API yet, but a payments integration is coming and
    // should not have to touch this header again to unblock itself.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
  },
  // 2 years, subdomains included, preload-eligible. Harmless on the http dev
  // server — browsers only honour it over an already-https connection.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
