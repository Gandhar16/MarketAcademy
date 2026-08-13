'use client';

/**
 * Learner progress, persisted to localStorage.
 *
 * No accounts, no backend, no sign-up wall. A learner should be able to open
 * the site and start, and their progress should still be there tomorrow. When
 * a backend eventually exists this store becomes its cache rather than being
 * replaced — hence the explicit `version` and the migration hook.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isStageComplete, SEQUENCE, stageOf, type SyllabusStage } from '@/content/syllabus';
import {
  currentRetention,
  isDue,
  lessonXp,
  newMastery,
  recordActivity,
  review,
  type SkillMastery,
  type Streak,
} from './mastery';

export interface LessonProgress {
  lessonId: string;
  completedAt: number | null;
  attempts: number;
  bestScore: number;
  /** Block index the learner last reached, so they resume where they stopped. */
  lastBlockIndex: number;
}

/** A committed prediction. Stored so the reveal cannot be un-seen and re-answered. */
export interface Commitment {
  lessonId: string;
  blockIndex: number;
  choice: number;
  why?: string;
  at: number;
}

export interface LessonCompletionResult {
  xp: number;
  /** Set only the moment a course transitions from incomplete to complete. */
  unlockedStage: SyllabusStage | null;
}

interface ProgressState {
  version: number;
  xp: number;
  streak: Streak;
  lessons: Record<string, LessonProgress>;
  mastery: Record<string, SkillMastery>;
  commitments: Commitment[];
  /** Stage id → when it first became complete. The unlock event fires once, here. */
  completedCourses: Record<string, number>;

  commit: (c: Omit<Commitment, 'at'>) => void;
  commitmentFor: (lessonId: string, blockIndex: number) => Commitment | undefined;
  setBlockIndex: (lessonId: string, index: number) => void;
  completeLesson: (args: {
    lessonId: string;
    tier: string;
    skills: string[];
    score: number;
  }) => LessonCompletionResult;
  /** Every game slug unlocked by a completed course, deduped. */
  unlockedGames: () => string[];
  dueSkills: (now?: number) => SkillMastery[];
  retention: (skill: string, now?: number) => number;
  reset: () => void;
}

const emptyStreak: Streak = { current: 0, longest: 0, lastActiveAt: 0 };

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      version: 1,
      xp: 0,
      streak: emptyStreak,
      lessons: {},
      mastery: {},
      commitments: [],
      completedCourses: {},

      commit: (c) => {
        // A commitment is write-once. Re-answering after seeing the reveal
        // would defeat the entire predict-then-reveal mechanism, so the store
        // simply refuses the second write.
        if (get().commitmentFor(c.lessonId, c.blockIndex)) return;
        set((s) => ({
          commitments: [...s.commitments, { ...c, at: Date.now() }],
          streak: recordActivity(s.streak),
        }));
      },

      commitmentFor: (lessonId, blockIndex) =>
        get().commitments.find((c) => c.lessonId === lessonId && c.blockIndex === blockIndex),

      setBlockIndex: (lessonId, index) =>
        set((s) => {
          const prev = s.lessons[lessonId];
          return {
            lessons: {
              ...s.lessons,
              [lessonId]: {
                lessonId,
                completedAt: prev?.completedAt ?? null,
                attempts: prev?.attempts ?? 0,
                bestScore: prev?.bestScore ?? 0,
                lastBlockIndex: Math.max(prev?.lastBlockIndex ?? 0, index),
              },
            },
          };
        }),

      completeLesson: ({ lessonId, tier, skills, score }) => {
        const s = get();
        const prev = s.lessons[lessonId];
        const firstAttempt = !prev?.completedAt;
        const earned = lessonXp(tier, score, firstAttempt);
        const passed = score >= 60;

        const mastery = { ...s.mastery };
        for (const skill of skills) {
          const existing = mastery[skill] ?? newMastery(skill);
          // Quality scales with how well they did, so a 100% pass consolidates
          // harder than a 65% scrape.
          mastery[skill] = review(existing, passed, Math.min(1, score / 100));
        }

        const lessons = {
          ...s.lessons,
          [lessonId]: {
            lessonId,
            completedAt: Date.now(),
            attempts: (prev?.attempts ?? 0) + 1,
            bestScore: Math.max(prev?.bestScore ?? 0, score),
            lastBlockIndex: prev?.lastBlockIndex ?? 0,
          },
        };

        // A course "unlocks" its game the moment its last built lesson is
        // completed. Checked only against the stage this lesson belongs to —
        // completing one lesson can never finish a course it is not part of.
        const stage = stageOf(lessonId);
        const completedIds = new Set(Object.keys(lessons).filter((id) => lessons[id].completedAt != null));
        const alreadyUnlocked = stage ? s.completedCourses[stage.id] != null : true;
        const nowComplete = stage ? isStageComplete(stage, completedIds) : false;
        const unlockedStage = stage && nowComplete && !alreadyUnlocked ? stage : null;

        set({
          xp: s.xp + earned,
          streak: recordActivity(s.streak),
          mastery,
          lessons,
          completedCourses: unlockedStage
            ? { ...s.completedCourses, [unlockedStage.id]: Date.now() }
            : s.completedCourses,
        });

        return { xp: earned, unlockedStage };
      },

      unlockedGames: () => {
        const s = get();
        const stages = new Set(Object.keys(s.completedCourses));
        // Re-derive from SEQUENCE's stages rather than storing games directly,
        // so a later edit to a course's capstoneGames takes effect for
        // learners who already finished that course, not just new completions.
        const games = new Set<string>();
        for (const id of stages) {
          const stage = SEQUENCE.find((t) => t.stage.id === id)?.stage;
          stage?.capstoneGames?.forEach((g) => games.add(g));
        }
        return [...games];
      },

      dueSkills: (now = Date.now()) => Object.values(get().mastery).filter((m) => isDue(m, now)),

      retention: (skill, now = Date.now()) => {
        const m = get().mastery[skill];
        return m ? currentRetention(m, now) : 0;
      },

      reset: () =>
        set({ xp: 0, streak: emptyStreak, lessons: {}, mastery: {}, commitments: [], completedCourses: {} }),
    }),
    {
      name: 'market-academy-progress',
      version: 1,
    },
  ),
);
