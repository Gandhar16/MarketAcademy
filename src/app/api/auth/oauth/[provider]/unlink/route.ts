/**
 * POST /api/auth/oauth/:provider/unlink
 *
 * Removes a linked identity, unless it is the only way into the account — an
 * account created through Google has no usable password, so unlinking its last
 * provider would lock someone out of their own progress with no recovery. The
 * refusal lives in the database layer, next to the rule it depends on.
 */
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { unlinkProvider } from '@/lib/db/oauthAccounts';
import { requireUser } from '@/lib/auth/session';
import { providerById } from '@/lib/auth/oauth';
import { enforceRateLimit } from '@/lib/market/http';
import { verifySameOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: RouteContext<'/api/auth/oauth/[provider]/unlink'>) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const forbidden = verifySameOrigin(req);
  if (forbidden) return forbidden;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const { provider: providerId } = await ctx.params;
  // Resolved against the registry rather than trusted from the URL, so this
  // cannot delete rows for a provider string somebody invented.
  const provider = providerById(providerId);
  if (!provider) {
    return NextResponse.json({ error: 'unknown_provider', message: 'No such sign-in method.' }, { status: 404 });
  }

  const result = await unlinkProvider(await getDb(), user.id, provider.id);
  if (!result.ok) return NextResponse.json({ error: 'last_method', message: result.message }, { status: 400 });

  return NextResponse.json({ ok: true, message: `${provider.label} unlinked.` });
}
