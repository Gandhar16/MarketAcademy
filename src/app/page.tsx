import Link from 'next/link';
import { LiveTicker } from '@/components/LiveTicker';
import { CostRealityCheck } from '@/components/CostRealityCheck';
import { TIER_LABELS, TIERS } from '@/lib/lesson/dsl';

const TIER_BLURBS: Record<string, string> = {
  T0: 'What a share is, who is on the other side of your trade, and how settlement actually works.',
  T1: 'Order types, the real cost of a trade, reading candles honestly, position sizing.',
  T2: 'Technical analysis with base rates, volume, fundamentals, valuation, screening.',
  T3: 'Futures, options from first principles, greeks you can move, spreads, IV crush, expiry.',
  T4: 'Risk of ruin, Kelly, backtest pitfalls, microstructure, portfolio construction, tax.',
  T5: 'Circuit locks, freeze quantity, ITM expiry STT, short delivery, PDT, wash sales, pin risk.',
};

const FIXES = [
  {
    problem: 'Courses are textbooks on a webpage.',
    fix: 'The lesson format structurally forbids more than two prose blocks in a row. CI fails the build otherwise.',
  },
  {
    problem: 'Quizzes test recall, not judgement.',
    fix: 'You commit to a decision on a live chart before the outcome is revealed. Scored on the decision, not the memory.',
  },
  {
    problem: 'Simulators ignore costs and taxes, so their P&L is fiction.',
    fix: 'Every fill is charged real STT, exchange, SEBI, stamp duty, GST and DP charges — itemised, every time.',
  },
  {
    problem: 'Paper trading has perfect fills and infinite money.',
    fix: 'Spread, market impact, partial fills, gaps and circuit locks are modelled. Your stop can fail to fill, as it would.',
  },
  {
    problem: 'Backtests lie, and nobody shows you how.',
    fix: 'The replay engine never loads future bars. Lookahead is impossible by construction, not by convention.',
  },
  {
    problem: 'Leaderboards reward lucky risk-takers.',
    fix: 'Rankings use a process score. A disciplined loss ranks above a reckless win, and the app says so out loud.',
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
      <section>
        <p className="text-[11px] uppercase tracking-[0.2em] text-accent">India-first · NSE &amp; BSE · US pack</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          Learn the market by
          <br />
          making decisions, not
          <br />
          reading about them.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">
          Real prices. Real costs. Real fills that can fail. Market Academy teaches the stock market from what a share
          is through to why a deep-in-the-money option you forgot to square off can cost more than the premium you paid
          for it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/learn"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-ground transition-opacity hover:opacity-90"
          >
            Start at the beginning
          </Link>
          <Link
            href="/play"
            className="rounded-lg border border-line-strong px-5 py-2.5 text-ink-muted transition-colors hover:text-ink"
          >
            Play a game
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <LiveTicker />
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">Most people have never seen what a trade costs</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          &ldquo;Zero brokerage&rdquo; is not zero. Move the slider and watch what the market actually charges you to
          get in and back out again — and how far the price has to move before you are even.
        </p>
        <div className="mt-8">
          <CostRealityCheck />
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">Six things every other platform gets wrong</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {FIXES.map((f) => (
            <div key={f.problem} className="bg-surface p-6">
              <p className="text-[13px] font-medium text-down">{f.problem}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">Six tiers, and it gets harder on purpose</h2>
        <div className="mt-8 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {TIERS.map((t) => (
            <div key={t} className="flex flex-col gap-1 bg-surface p-5 md:flex-row md:items-baseline md:gap-6">
              <div className="num w-10 shrink-0 text-accent">{t}</div>
              <div className="w-44 shrink-0 font-medium">{TIER_LABELS[t]}</div>
              <div className="text-sm text-ink-muted">{TIER_BLURBS[t]}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-24 border-t border-line pt-8 text-[13px] text-ink-faint">
        <p>
          Market Academy teaches mechanics and reasoning. It never tells you what to buy, and it is not investment
          advice. Simulated performance is not indicative of real results — which is precisely why the fills here are
          modelled honestly rather than generously.
        </p>
      </footer>
    </main>
  );
}
