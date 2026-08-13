/**
 * Shared "does the current request have Pro access" check — used by the
 * lesson page, and by /api/lesson/reveal and /api/lesson/grade so that
 * gating a lesson at the page level can't be bypassed by calling those APIs
 * directly with the lesson id and block index. Server-only.
 */
import { currentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getUserPlan } from '@/lib/db/payments';
import { hasProAccess } from './access';

export async function currentUserHasProAccess(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const planState = await getUserPlan(await getDb(), user.id);
  return hasProAccess(planState);
}
