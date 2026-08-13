/**
 * POST /api/lesson/grade
 * { lesson, block, answers: unknown[] }
 *
 * Grading runs here, not in the browser, because the graders necessarily know
 * the answers. The response carries per-task feedback and the score — never the
 * raw spec.
 */
import { NextResponse } from 'next/server';
import { LESSONS_BY_ID } from '@/content/registry';
import { SEQUENCE_BY_ID } from '@/content/syllabus';
import { gradeCheckpoint, type TaskType } from '@/lib/lesson/grading';
import { enforceRateLimit } from '@/lib/market/http';
import { isTierGated } from '@/lib/payments/access';
import { currentUserHasProAccess } from '@/lib/payments/gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.lesson !== 'string' || !Number.isInteger(body.block) || !Array.isArray(body.answers)) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Pass { lesson, block, answers[] }.' },
      { status: 400 },
    );
  }

  const lesson = LESSONS_BY_ID.get(body.lesson);
  if (!lesson) {
    return NextResponse.json({ error: 'not_found', message: `Unknown lesson "${body.lesson}"` }, { status: 404 });
  }

  const here = SEQUENCE_BY_ID.get(body.lesson);
  if (here && isTierGated(here.stage.tier) && !(await currentUserHasProAccess())) {
    return NextResponse.json({ error: 'forbidden', message: 'This lesson is part of Pro.' }, { status: 403 });
  }

  const block = lesson.blocks[body.block];
  if (!block || block.kind !== 'checkpoint') {
    return NextResponse.json(
      { error: 'not_found', message: `Block ${body.block} of ${body.lesson} is not a checkpoint.` },
      { status: 404 },
    );
  }

  const graded = gradeCheckpoint(
    block.tasks.map((t) => ({ type: t.type as TaskType, spec: t.spec as Record<string, unknown> })),
    body.answers,
  );

  return NextResponse.json({
    score: graded.score,
    results: graded.results,
    explanations: block.tasks.map((t) => t.explanation),
  });
}
