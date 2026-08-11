/**
 * GET /api/lesson/reveal?lesson=<id>&block=<index>
 *
 * Serves the answer for a single predict or checkpoint block. Answers are kept
 * out of the page payload entirely (see src/lib/lesson/sanitize.ts) so the
 * reveal cannot be read before the learner commits.
 */
import { NextResponse } from 'next/server';
import { LESSONS_BY_ID } from '@/content/registry';
import { checkpointAnswersFor, revealFor } from '@/lib/lesson/sanitize';

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

  const predict = revealFor(lesson, blockIndex);
  if (predict) return NextResponse.json(predict);

  const checkpoint = checkpointAnswersFor(lesson, blockIndex);
  if (checkpoint) return NextResponse.json(checkpoint);

  return NextResponse.json(
    { error: 'not_found', message: `Block ${blockIndex} of ${lessonId} has no answer to reveal.` },
    { status: 404 },
  );
}
