/**
 * Risk of ruin — the engine behind the Risk Roulette game.
 *
 * The lesson this exists to deliver: an EDGE IS NOT ENOUGH. A 55%-win, 1:1
 * strategy is a genuinely good edge, and betting 20% of your account on each
 * trade still bankrupts you most of the time. Learners consistently refuse to
 * believe this until they watch it happen on their own draws.
 *
 * Everything in here is a MODEL and is labelled as such wherever it surfaces.
 * No real prices are involved.
 */
import { mulberry32 } from '../util/rng';

export interface RuinConfig {
  /** Probability of a winning trade, 0–1. */
  winRate: number;
  /** Reward-to-risk ratio. 1 means a win pays what a loss costs. */
  rewardRisk: number;
  /** Fraction of CURRENT equity risked per trade. */
  riskFraction: number;
  trades: number;
  startingEquity: number;
  /** Equity below this fraction of the start counts as ruined. */
  ruinThreshold: number;
}

export const DEFAULT_RUIN_CONFIG: RuinConfig = {
  winRate: 0.55,
  rewardRisk: 1,
  riskFraction: 0.02,
  trades: 200,
  startingEquity: 100_000,
  ruinThreshold: 0.5,
};

export interface RuinPath {
  equity: number[];
  ruined: boolean;
  finalEquity: number;
  maxDrawdown: number;
  longestLosingStreak: number;
}

/** Run one path. Risk is a fraction of CURRENT equity, so bets shrink as you lose. */
export function simulatePath(cfg: RuinConfig, seed: number): RuinPath {
  const rand = mulberry32(seed);
  const equity: number[] = [cfg.startingEquity];
  let e = cfg.startingEquity;
  let peak = e;
  let maxDrawdown = 0;
  let streak = 0;
  let longestLosingStreak = 0;
  let ruined = false;

  for (let i = 0; i < cfg.trades; i++) {
    const risk = e * cfg.riskFraction;
    const won = rand() < cfg.winRate;
    e += won ? risk * cfg.rewardRisk : -risk;

    if (won) streak = 0;
    else {
      streak += 1;
      longestLosingStreak = Math.max(longestLosingStreak, streak);
    }

    peak = Math.max(peak, e);
    maxDrawdown = Math.max(maxDrawdown, (peak - e) / peak);
    equity.push(e);

    if (e <= cfg.startingEquity * cfg.ruinThreshold) {
      ruined = true;
      break;
    }
  }

  return { equity, ruined, finalEquity: e, maxDrawdown, longestLosingStreak };
}

export interface RuinSummary {
  ruinProbability: number;
  medianFinal: number;
  /** 5th percentile outcome — the one people plan as though cannot happen. */
  p5Final: number;
  p95Final: number;
  medianMaxDrawdown: number;
  worstLosingStreak: number;
  paths: RuinPath[];
}

export function simulate(cfg: RuinConfig, runs = 500, baseSeed = 1): RuinSummary {
  const paths: RuinPath[] = [];
  for (let i = 0; i < runs; i++) paths.push(simulatePath(cfg, baseSeed + i * 7919));

  const finals = paths.map((p) => p.finalEquity).sort((a, b) => a - b);
  const dds = paths.map((p) => p.maxDrawdown).sort((a, b) => a - b);
  const pct = (arr: number[], q: number) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];

  return {
    ruinProbability: paths.filter((p) => p.ruined).length / runs,
    medianFinal: pct(finals, 0.5),
    p5Final: pct(finals, 0.05),
    p95Final: pct(finals, 0.95),
    medianMaxDrawdown: pct(dds, 0.5),
    worstLosingStreak: Math.max(...paths.map((p) => p.longestLosingStreak)),
    paths: paths.slice(0, 40), // enough to draw a spaghetti plot
  };
}

/**
 * Full-Kelly fraction for a binary bet.
 *
 * Included so the app can show it and then immediately explain why you should
 * not use it: Kelly maximises long-run growth given a KNOWN edge, and nobody
 * knows their edge to the precision Kelly assumes. Overestimate your win rate
 * by five points and full Kelly is well past the point of ruin. Half-Kelly
 * gives up about a quarter of the growth for a large reduction in variance,
 * which is why practitioners who use it at all use a fraction of it.
 */
export function kellyFraction(winRate: number, rewardRisk: number): number {
  const p = winRate;
  const q = 1 - p;
  const b = rewardRisk;
  if (b <= 0) return 0;
  return Math.max(0, (b * p - q) / b);
}

/** Expectancy per trade, as a multiple of the amount risked. */
export function expectancy(winRate: number, rewardRisk: number): number {
  return winRate * rewardRisk - (1 - winRate);
}
