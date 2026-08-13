/**
 * GET /api/lesson/reveal?lesson=<id>&block=<index>
 *
 * Serves the answer for a single predict or checkpoint block. Answers are kept
 * out of the page payload entirely (see src/lib/lesson/sanitize.ts) so the
 * reveal cannot be read before the learner commits.
 */
import { NextResponse } from 'next/server';
import { LESSONS_BY_ID } from '@/content/registry';
import { SEQUENCE_BY_ID } from '@/content/syllabus';
import { checkpointAnswersFor, revealFor } from '@/lib/lesson/sanitize';
import { isTierGated, paywallEnabled } from '@/lib/payments/access';
import { currentUserHasProAccess } from '@/lib/payments/gate';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const lessonId = p.get('lesson');
  const blockIndex = Number(p.get('block'));

  if (!lessonId || !Number.isInteger(blockIndex)) {
    return NextResponse.json({ error: 'bad_request', message: 'Pass ?lesson= and ?block=' }, { status: 400 });
  }

  const lesson = LESSONS_BY_ID.get(lessonId);
  if (!lesson) {
    return NextResponse.json({ error: 'not_found', message: `Unknown lesson "${lessonId}"` }, { status: 404 });
  }

  // The page-level gate (app/learn/[lesson]/page.tsx) never sends this
  // lesson's content to a non-Pro browser at all — this is what stops
  // someone from getting the answer anyway by calling the reveal endpoint
  // directly with the lesson id and block index.
  const here = SEQUENCE_BY_ID.get(lessonId);
  if (paywallEnabled() && here && isTierGated(here.stage.tier) && !(await currentUserHasProAccess())) {
    return NextResponse.json({ error: 'forbidden', message: 'This lesson is part of Pro.' }, { status: 403 });
  }

  const predict = revealFor(lesson, blockIndex);
  if (predict) return NextResponse.json(predict);

  const checkpoint = checkpointAnswersFor(lesson, blockIndex);
  if (checkpoint) return NextResponse.json(checkpoint);

  return NextResponse.json(
    { error: 'not_found', message: `Block ${blockIndex} of ${lessonId} has no answer to reveal.` },
    { status: 404 },
  );
}
