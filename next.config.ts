import type { NextConfig } from "next";

/**
 * CORRECTION (see commit history): this used to hash-pin the one
 * developer-authored inline script (theme-init) and rely on that alone for
 * script-src. That broke every page in production. Two things were wrong
 * with the assumption behind it:
 *
 *  1. Next's <Script strategy="beforeInteractive"> does not emit the raw
 *     script text as the element's content — it wraps it in a runtime call
 *     (`self.__next_s.push([...])`), so the hash of the bare source never
 *     matched what was actually served.
 *  2. Next.js App Router itself injects further inline <script> tags on
 *     EVERY page to stream RSC "flight" data to the client
 *     (`self.__next_f.push(...)`) — this is how hydration receives
 *     server-rendered data at all, it is not something this app's code
 *     controls or can enumerate hashes for, and it changes per page and per
 *     build. A CSP that blocks it blocks hydration everywhere, which is
 *     what happened.
 *
 * The fix is Next's own documented default for apps not using a nonce-based
 * CSP: `'unsafe-inline'` on script-src. See
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md,
 * "Without Nonces". This still blocks any *externally hosted* script
 * (script-src has no third-party origins in it), which is the injection
 * vector that actually matters here — the two dangerouslySetInnerHTML sites
 * in this app are a static developer-authored string and an
 * HTML-escaped-then-markdown-subset renderer, neither of which is live user
 * input. A genuine defence against inline-script injection would need
 * nonce-based CSP via proxy.ts, which is a larger change than a hotfix
 * warrants — worth revisiting, not worth rushing.
 */
const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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
