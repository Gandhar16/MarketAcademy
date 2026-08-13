/**
 * Origin check for state-changing API routes.
 *
 * The session cookie is `sameSite: 'lax'`, which already blocks it from being
 * attached to most cross-site requests (any `<img>`/`<form>`-style simple
 * cross-site POST). This is a second, independent layer: it verifies the
 * request actually originated from this site's own pages, so a cross-site
 * request that *did* slip a cookie through — a stale browser, a broken
 * `sameSite` implementation, a future route that responds to a simple
 * cross-site form POST — still gets rejected before it can do anything.
 *
 * `Sec-Fetch-Site` is sent by all evergreen browsers and is the more precise
 * signal (it says "same-origin" or "cross-site" directly); `Origin` is the
 * fallback for the rare client that omits it. A request with neither header
 * is rejected rather than let through — a browser always sends at least one
 * of them on a fetch/XHR/form POST, so their total absence itself is a sign
 * of a non-browser or spoofed request, not a compatibility gap.
 */
export function verifySameOrigin(req: Request): Response | null {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin' || fetchSite === 'none') return null;
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    return Response.json({ error: 'forbidden', message: 'Cross-site request rejected.' }, { status: 403 });
  }

  const origin = req.headers.get('origin');
  if (!origin) {
    return Response.json({ error: 'forbidden', message: 'Missing origin.' }, { status: 403 });
  }

  const host = req.headers.get('host');
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return Response.json({ error: 'forbidden', message: 'Invalid origin.' }, { status: 403 });
  }

  if (!host || originHost !== host) {
    return Response.json({ error: 'forbidden', message: 'Cross-site request rejected.' }, { status: 403 });
  }
  return null;
}
