import Link from 'next/link';
import { LiveTicker } from '@/components/LiveTicker';
import { CostRealityCheck } from '@/components/CostRealityCheck';
import { TIER_LABELS, TIERS } from '@/lib/lesson/dsl';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';

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
      <Reveal as="section">
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
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-on-emphasis transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[0.98]"
          >
            Start at the beginning
          </Link>
          <Link
            href="/play"
            className="rounded-lg border border-line-strong px-5 py-2.5 text-ink-muted transition-all duration-200 hover:scale-[1.03] hover:text-ink active:scale-[0.98]"
          >
            Play a game
          </Link>
        </div>
      </Reveal>

      {/*
        SEBI's own study, not a marketing number: "Analysis of Profit and
        Loss of Individual Traders dealing in Equity Futures & Options
        Segment", Sept 2024 — 93% of individual F&O traders lost money over
        FY22–FY24, aggregate net loss over ₹1.8 lakh crore.
        https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html
        Led with here, not buried, because it is the actual argument for a
        site that teaches costs and process honestly rather than a platform
        that profits from more of this.
      */}
      <Reveal as="section" className="mt-14">
        <div className="rounded-xl border border-down/30 bg-down/5 px-6 py-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            <span className="num text-2xl font-semibold text-down">93%</span>
            <span className="ml-3">
              of individual equity F&amp;O traders in India lost money over FY22–FY24, for a combined loss above{' '}
              <span className="num text-ink">₹1.8 lakh crore</span> — SEBI&rsquo;s own study, not ours. Realistic
              costs and honest fills are not a feature here. They are the whole point.
            </span>
          </p>
        </div>
      </Reveal>

      <Reveal as="section" className="mt-14" delay={0.1}>
        <LiveTicker />
      </Reveal>

      <Reveal as="section" className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">Most people have never seen what a trade costs</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          &ldquo;Zero brokerage&rdquo; is not zero. Move the slider and watch what the market actually charges you to
          get in and back out again — and how far the price has to move before you are even.
        </p>
        <div className="mt-8">
          <CostRealityCheck />
        </div>
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight">Six things every other platform gets wrong</h2>
        </Reveal>
        <StaggerContainer className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {FIXES.map((f) => (
            <StaggerItem key={f.problem}>
              <div className="h-full bg-surface p-6 transition-colors duration-200 hover:bg-surface-2">
                <p className="text-[13px] font-medium text-down">{f.problem}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.fix}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <section className="mt-24">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight">Six tiers, and it gets harder on purpose</h2>
        </Reveal>
        <StaggerContainer className="mt-8 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {TIERS.map((t) => (
            <StaggerItem key={t}>
              <div className="flex flex-col gap-1 bg-surface p-5 transition-colors duration-200 hover:bg-surface-2 md:flex-row md:items-baseline md:gap-6">
                <div className="num w-10 shrink-0 text-accent">{t}</div>
                <div className="w-44 shrink-0 font-medium">{TIER_LABELS[t]}</div>
                <div className="text-sm text-ink-muted">{TIER_BLURBS[t]}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <Reveal as="section" className="mt-24">
        <footer className="border-t border-line pt-8 text-[13px] text-ink-faint">
          <p>
            Market Academy teaches mechanics and reasoning. It never tells you what to buy, and it is not investment
            advice. Simulated performance is not indicative of real results — which is precisely why the fills here are
            modelled honestly rather than generously.
          </p>
        </footer>
      </Reveal>
    </main>
  );
}
