'use client';

/**
 * The `/play` card grid, client-side so it can show which games a learner
 * has actually unlocked by finishing the matching course. Not a lock yet —
 * every game stays fully playable regardless of this badge, on purpose,
 * while the games themselves are still being tested. The badge is the whole
 * feature for now; turning it into an access gate is a deliberate follow-up.
 */
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GAME_CATALOGUE } from '@/lib/games/catalogue';
import { useProgress } from '@/lib/progress/store';
import { useHydrated } from '@/lib/util/client-hooks';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';

export function GameGrid() {
  const hydrated = useHydrated();
  const unlockedGames = useProgress((s) => s.unlockedGames);
  const unlocked = new Set(hydrated ? unlockedGames() : []);

  return (
    <StaggerContainer className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
      {GAME_CATALOGUE.map((g) => {
        const isUnlocked = unlocked.has(g.slug);
        return (
          <StaggerItem key={g.slug} className="h-full">
            <motion.div whileHover={{ y: -3 }} whileTap={{ y: 0, scale: 0.99 }} transition={{ duration: 0.2 }} className="h-full">
              <Link
                href={`/play/${g.slug}`}
                className={[
                  'card-interactive block h-full bg-surface p-5 transition-colors duration-200 hover:bg-surface-2 hover:shadow-lg hover:shadow-black/10',
                  isUnlocked ? 'ring-1 ring-inset ring-up/30' : '',
                ].join(' ')}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{g.name}</span>
                  <div className="flex items-center gap-2">
                    {isUnlocked && (
                      <span className="text-[10px] uppercase tracking-wider text-up">unlocked by a course</span>
                    )}
                    {g.modelled && <span className="text-[10px] uppercase tracking-wider text-ink-faint">modelled</span>}
                  </div>
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-accent">{g.skill}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{g.blurb}</p>
              </Link>
            </motion.div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
