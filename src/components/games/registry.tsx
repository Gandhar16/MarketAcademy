'use client';

/**
 * Game registry, so a lesson can embed a game by name and `/play/[game]` can
 * resolve one from a URL.
 *
 * Same contract as the widget registry: an unknown name renders a loud error
 * rather than nothing, because a lesson that silently drops its practice
 * exercise still looks fine to everyone except the learner.
 */
import type { ComponentType } from 'react';
import { RiskRoulette } from './RiskRoulette';
import { CostCutter } from './CostCutter';
import { ChartReplay } from './ChartReplay';
import { OrderGauntlet } from './OrderGauntlet';
import { BiasBuster } from './BiasBuster';
import { CircuitBreaker } from './CircuitBreaker';
import { PayoffBuilder } from './PayoffBuilder';
import { EarningsRoulette } from './EarningsRoulette';
import { CandleSprint } from './CandleSprint';
import { TheLongGame } from './TheLongGame';
import { MarginCall } from './MarginCall';
import { ExpiryDay } from './ExpiryDay';
import { EdgeOrLuck } from './EdgeOrLuck';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- per-game props are the game's own concern; the registry is deliberately untyped at this seam
type AnyGame = ComponentType<any>;

export const GAMES: Record<string, AnyGame> = {
  'chart-replay': ChartReplay,
  'order-gauntlet': OrderGauntlet,
  'cost-cutter': CostCutter,
  'risk-roulette': RiskRoulette,
  'payoff-builder': PayoffBuilder,
  'circuit-breaker': CircuitBreaker,
  'earnings-roulette': EarningsRoulette,
  'bias-buster': BiasBuster,
  'candle-sprint': CandleSprint,
  'the-long-game': TheLongGame,
  'margin-call': MarginCall,
  'expiry-day': ExpiryDay,
  'edge-or-luck': EdgeOrLuck,
};

/**
 * Renders a game by slug.
 *
 * This is a COMPONENT rather than a function because server components can
 * render a client component across the boundary but cannot call a client
 * function — `/play/[game]` is a server component and needs this one.
 */
export function GameHost({ slug, config = {} }: { slug: string; config?: Record<string, unknown> }) {
  return <>{renderGame(slug, config)}</>;
}

/** Function form, for use from other CLIENT components such as the lesson player. */
export function renderGame(name: string, config: Record<string, unknown>) {
  const Game = GAMES[name];
  if (!Game) {
    return (
      <div className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm">
        <div className="font-medium text-danger">Game &ldquo;{name}&rdquo; is not registered.</div>
        <p className="mt-1 text-ink-muted">
          Add it to <code className="num">src/components/games/registry.tsx</code>.
        </p>
      </div>
    );
  }
  return <Game {...config} />;
}
