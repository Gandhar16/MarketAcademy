'use client';

/**
 * The course picker — /learn's landing view.
 *
 * Replaces one long scrolling road with a grid of named courses ("Basics of
 * the Stock Market", "Technical Analysis I", ...), each showing how much of
 * it is done. This is a real product decision, not a refinement of the old
 * design: the previous `CourseTrack` page deliberately rejected exactly this
 * shape, on the grounds that a learner's only real question is "what's
 * next", not "which subject am I in". That is still true for someone mid-
 * course — which is why the "continue where you left off" strip above the
 * grid still jumps straight to the next lesson, full stop, regardless of
 * which course it belongs to. The grid is for the other real question this
 * page needs to answer: "have I actually finished the basics", which a
 * single continuous scroll has no way to represent.
 *
 * Nothing is locked here either, same as before — every course card is
 * clickable regardless of progress in any other course.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SYLLABUS, SEQUENCE, TOTAL_TOPICS, resumeAt, stepOf, type SyllabusStage } from '@/content/syllabus';
import { TIER_LABELS } from '@/lib/lesson/dsl';
import { GAMES_BY_SLUG } from '@/lib/games/catalogue';
import { useProgress } from '@/lib/progress/store';
import { useHydrated } from '@/lib/util/client-hooks';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { CourseRing } from './CourseRing';

export function CourseGrid() {
  const hydrated = useHydrated();
  const lessons = useProgress((s) => s.lessons);

  const completed = useMemo(
    () =>
      new Set(
        hydrated
          ? Object.values(lessons)
              .filter((l) => l.completedAt != null)
              .map((l) => l.lessonId)
          : [],
      ),
    [hydrated, lessons],
  );

  const next = resumeAt(completed);
  const doneCount = SEQUENCE.filter((t) => t.built && completed.has(t.id)).length;
  const builtCount = SEQUENCE.filter((t) => t.built).length;

  return (
    <div>
      <Reveal className="rounded-card border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-ink-faint">Across every course</p>
            <p className="num mt-1 text-2xl sm:text-3xl">
              {doneCount}
              <span className="text-ink-faint"> / {builtCount}</span>
            </p>
            <p className="mt-1 text-sm text-ink-muted">lessons finished, out of {TOTAL_TOPICS} planned in total.</p>
          </div>

          {next && (
            <Link href={`/learn/${next.id}`} className="btn-primary w-full justify-center sm:w-auto sm:justify-start">
              {doneCount === 0 ? 'Start at step 1' : `Continue — step ${stepOf(next.id)}`}
            </Link>
          )}
        </div>
      </Reveal>

      <StaggerContainer className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {SYLLABUS.map((stage) => (
          <StaggerItem key={stage.id}>
            <CourseCard stage={stage} completed={completed} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}

function CourseCard({ stage, completed }: { stage: SyllabusStage; completed: ReadonlySet<string> }) {
  const built = stage.topics.filter((t) => t.built);
  const done = built.filter((t) => completed.has(t.id)).length;
  const pct = built.length === 0 ? 0 : Math.round((done / built.length) * 100);
  const complete = built.length > 0 && done === built.length;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
    <Link
      href={`/learn/course/${stage.id}`}
      className={[
        'card-interactive flex h-full flex-col rounded-xl border p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2 hover:shadow-lg hover:shadow-black/10',
        complete ? 'border-up/40 bg-up/5' : 'border-line bg-surface',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">{TIER_LABELS[stage.tier]}</div>
          <h3 className="mt-1 font-medium leading-snug text-ink">{stage.courseTitle}</h3>
        </div>
        <CourseRing percent={pct} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{stage.why}</p>

      <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-faint">
        {complete ? (
          <span className="text-up">✓ Complete</span>
        ) : (
          <span>
            {done}/{built.length} lessons done
          </span>
        )}
        {built.length < stage.topics.length && <span>· {stage.topics.length - built.length} not written yet</span>}
      </div>

      {stage.capstoneGames && stage.capstoneGames.length > 0 && (
        <div className="mt-3 text-[11px] text-ink-faint">
          {complete ? '🎮 Unlocked: ' : '🎮 Unlocks: '}
          {stage.capstoneGames.map((slug) => GAMES_BY_SLUG.get(slug)?.name ?? slug).join(', ')}
        </div>
      )}
    </Link>
    </motion.div>
  );
}
