/**
 * Animated explainers — the closest thing this site has to a video.
 *
 * WHY THESE ARE NOT VIDEO FILES
 *
 * The obvious build is an mp4. It was rejected for the same four reasons every
 * diagram on this site is inline SVG rather than a PNG (`docs/plain-language.md`
 * §2), and one more that only applies here:
 *
 *  - A video does not inherit the theme, so it is a bright rectangle in a dark
 *    page, forever.
 *  - A video is a fixed number of pixels. These are sharp on a 27-inch monitor
 *    and legible on a phone.
 *  - A video is megabytes. These are kilobytes of JSON and already-loaded code.
 *  - A video cannot be read by anyone who cannot hear it, unless somebody
 *    remembers to caption it. Here the caption IS the source, so an uncaptioned
 *    scene cannot exist.
 *  - **And the one that decided it:** the numbers in these come from the same
 *    cost engine that prices real fills. Change a statutory rate and the
 *    explainer re-derives itself. A recorded video would state the old rate,
 *    confidently, in a voice, until somebody re-recorded it — which is exactly
 *    the failure mode §7 of PLAN.md exists to prevent, wearing a friendlier
 *    face.
 *
 * WHAT A SCENE MAY DEPICT
 *
 * Mechanisms, never markets. Every scene kind below draws how something WORKS —
 * a chain of intermediaries, a total split into its parts, a queue of resting
 * orders. None of them draws a price path, because a drawn price path is
 * invented market data and PLAN.md §7.1 forbids it. That constraint is why
 * there is no `path` scene kind and why there should never be one; if an
 * explainer needs a chart, it needs real bars fetched from the real API, the
 * way `ta-tools.tsx` does it.
 */
import narration from './narration.json';
import { ANALOGIES } from './analogies';
import { computeCost, roundTripCost } from '@/lib/engine/costs';
import type { CostLine } from '@/lib/engine/costs';
import { blackScholesPrice, daysToYears, intrinsicValue } from '@/lib/engine/options';
import { canTradeAtBand, checkBand, indiaPriceBand } from '@/lib/engine/halts';
import { sizeFromStop } from '@/lib/engine/portfolio';
import { expectancy } from '@/lib/games/ruin';

export type Tone = 'neutral' | 'cost' | 'good' | 'bad';

/** A linear chain of steps with something travelling along it. */
export interface ChainScene {
  kind: 'chain';
  steps: { label: string; sub?: string }[];
  /** Index of the step the travelling token has reached. */
  at: number;
  /** What is travelling — "your ₹1,00,000", "the order", "the shares". */
  token?: string;
}

/** Parts of a total, drawn as bars that grow. */
export interface BarsScene {
  kind: 'bars';
  bars: { label: string; value: number; note?: string; tone?: Tone }[];
  /** Bars are scaled against this rather than against their own max, so two
   *  consecutive scenes stay comparable instead of silently rescaling. */
  scaleTo: number;
  unit?: string;
  /** Decimal places when the bar value is written out. */
  precision?: number;
}

/** Two facing queues of resting orders, and optionally an order eating them. */
export interface LadderScene {
  kind: 'ladder';
  bids: { price: number; qty: number }[];
  asks: { price: number; qty: number }[];
  /** How many units a market buy is taking off the ask side, top down. */
  taking?: number;
}

/**
 * A price band with its two edges, and optionally one stated price inside it.
 *
 * This is the closest any scene comes to drawing a market, so the line is worth
 * stating precisely. A band is ARITHMETIC — 10% either side of a reference — and
 * a single `at` marker is a stated hypothetical of the same kind the order-book
 * ladder already uses ("suppose it opens here"). Neither claims anything was
 * observed.
 *
 * What is still forbidden, and what there is deliberately no field for, is a
 * SEQUENCE of prices. One point is an example; a line joining several is a
 * chart of a day that never happened. See PLAN.md §7.1.
 */
export interface BandScene {
  kind: 'band';
  reference: number;
  lower: number;
  upper: number;
  bandPercent: number;
  /** One stated price, to show where it falls relative to the edges. */
  at?: number;
  /** What is true at that price — comes from the halts engine, never typed. */
  verdict?: string;
}

/**
 * One candle, drawn from four stated numbers.
 *
 * This is a STRUCTURE diagram, not a chart. It draws the glyph — wick, body,
 * open, close — so a learner can see what the shape encodes, and the explainer
 * it exists for is specifically about what the shape throws away. Four stated
 * numbers is the same status as the ladder's stated order book: an example, not
 * a claim that any day looked like this.
 *
 * There is one candle and there is no array. The moment this took a list it
 * would be a price chart of a week that never happened, which PLAN.md §7.1
 * forbids and which the scene-kind test guards.
 */
export interface CandleScene {
  kind: 'candle';
  open: number;
  high: number;
  low: number;
  close: number;
  /** What this candle is being used to show. */
  caption?: string;
  /** Optional labelled read-outs derived from the four numbers. */
  readouts?: { label: string; value: string; tone?: Tone }[];
}

/** The line drawings a compare scene may use. Fixed set, drawn in `Scenes.tsx`. */
export type Glyph = 'house' | 'taxi' | 'clock' | 'receipt' | 'exchange' | 'queue' | 'vault' | 'token';

/**
 * An everyday situation beside the market one it explains.
 *
 * This is the scene kind that only exists in the video, and it is why the video
 * is longer than the page. On the site an analogy is a paragraph you can choose
 * to read on a term page; in a video there is nobody to click, so the comparison
 * has to be shown.
 *
 * `breaks` is not optional and never should be. An analogy that is only ever
 * shown working teaches the analogy rather than the thing — the learner walks
 * away confident about taxis. Naming the point where the comparison stops being
 * true is what turns it back into a teaching aid, and it is usually the single
 * most useful sentence in the scene.
 */
export interface CompareScene {
  kind: 'compare';
  glyph: Glyph;
  /** The everyday comparison. Comes from `analogies.ts`, never retyped. */
  everyday: string;
  /** What it maps to, with the real engine-computed figure where there is one. */
  market: string;
  /** Where the comparison stops being true. */
  breaks: string;
}

export type Scene = ChainScene | BarsScene | LadderScene | CompareScene | BandScene | CandleScene;

export interface ExplainerScene {
  /**
   * How long this scene holds, in seconds — a MINIMUM, not the final duration.
   *
   * The author says how long the picture needs; `sceneSeconds` below then
   * guarantees the caption is also readable in the time given, and takes
   * whichever is longer. Authoring these by hand went badly enough to be worth
   * recording: every time a caption was reworded, its timing silently became
   * wrong, and the only thing that noticed was a test complaining about a
   * tenth of a second. Deriving it removes the class of mistake instead of
   * catching instances of it.
   */
  seconds: number;
  /**
   * What a narrator would say. This is the source of truth for the scene, not a
   * subtitle bolted onto it — every claim a scene makes has to be written here
   * in words, which is what stops a diagram implying something nobody checked.
   */
  caption: string;
  scene: Scene;
  /**
   * Which cut this scene belongs to. Absent means both.
   *
   * The video and the page are not the same lesson and should not pretend to
   * be. A reader on the page has the analogy a click away on the term page, the
   * transcript below, and the ability to stop and think; a viewer has none of
   * those and needs the comparison drawn, the example spelled out, and the
   * caveat said aloud. So the video gets extra scenes.
   *
   * One authored list, two cuts of it — rather than two lists that drift.
   * `timeline()` and `runtimeOf()` both take the medium and filter here, and a
   * test asserts the page cut stays the shorter one.
   */
  only?: 'video';
}

export interface Chapter {
  title: string;
  scenes: ExplainerScene[];
}

export interface Explainer {
  id: string;
  title: string;
  /** One line, shown on the index and on term pages. */
  blurb: string;
  /**
   * The question this answers, in the words someone stuck would use. Same
   * convention as the syllabus stages.
   */
  question: string;
  /** Glossary terms this explains — used to surface it on their term pages. */
  terms: string[];
  chapters: Chapter[];
}

// ── The real numbers these explainers are built on ──────────────────────────
//
// Computed, not typed. A ₹1,00,000 delivery round trip on the NSE at the
// discount-broker plan the rest of the app uses. Change a rate in
// `costs/india.ts` and every figure below moves with it, including the ones
// spoken in the captions — which is the whole argument for building these in
// code rather than recording them.

const DEMO_PRICE = 1_000;
const DEMO_QTY = 100;
const DEMO_TURNOVER = DEMO_PRICE * DEMO_QTY;

const DEMO_TRIP = roundTripCost(
  { market: 'IN', venue: 'NSE', product: 'delivery', side: 'buy', price: DEMO_PRICE, quantity: DEMO_QTY, scripCount: 1 },
  DEMO_PRICE,
);

const DEMO_INTRADAY = computeCost({
  market: 'IN',
  venue: 'NSE',
  product: 'intraday',
  side: 'sell',
  price: DEMO_PRICE,
  quantity: DEMO_QTY,
});

/** Both legs' charges added up per line, because a learner pays the round trip. */
function roundTripLines(): CostLine[] {
  const merged = new Map<string, CostLine>();
  for (const line of [...DEMO_TRIP.entry.lines, ...DEMO_TRIP.exit.lines]) {
    const existing = merged.get(line.key);
    merged.set(
      line.key,
      existing ? { ...existing, amount: existing.amount + line.amount, basis: 'both legs added up' } : { ...line },
    );
  }
  return [...merged.values()].filter((l) => l.amount > 0).sort((a, b) => b.amount - a.amount);
}

const PAYEE_LABEL: Record<CostLine['payee'], string> = {
  broker: 'your broker keeps this',
  exchange: 'the exchange keeps this',
  regulator: 'the regulator keeps this',
  government: 'the government keeps this',
  depository: 'the depository keeps this',
};

const TRIP_LINES = roundTripLines();
const TRIP_TOTAL = DEMO_TRIP.total;
const STT_TOTAL = TRIP_LINES.find((l) => l.key.toLowerCase().includes('stt'))?.amount ?? 0;
const BROKERAGE_TOTAL = TRIP_LINES.find((l) => l.key === 'brokerage')?.amount ?? 0;

const rupees = (n: number, dp = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

// ── The option this explainer follows, priced by the real engine ────────────
//
// A slightly in-the-money call, so that BOTH halves of the premium are non-zero
// and the split is visible. These are MODEL prices from the same Black-Scholes
// implementation the greeks widget uses — explicitly a model, not a quote, and
// the captions say so. PLAN.md §7.1 allows that and forbids the alternative:
// typing plausible-looking numbers and letting a reader assume they are real.

const OPT = { spot: 1_000, strike: 990, volatility: 0.25, rate: 0.065, type: 'call' as const };

/** Premium with `days` left, everything else held still. */
const premiumAt = (days: number, spot = OPT.spot) =>
  blackScholesPrice({ ...OPT, spot, timeToExpiry: daysToYears(days) });

const OPT_INTRINSIC = intrinsicValue(OPT.spot, OPT.strike, OPT.type);
const OPT_PAID = premiumAt(28);
const OPT_TIME_VALUE = OPT_PAID - OPT_INTRINSIC;

/** Time value alone, week by week, with the spot deliberately not moving. */
const DECAY = [28, 21, 14, 7, 0].map((days) => ({
  days,
  timeValue: premiumAt(days) - OPT_INTRINSIC,
}));

/** What the same option is worth at expiry, for three ways of being right. */
const AT_EXPIRY = {
  rightByALittle: intrinsicValue(1_005, OPT.strike, OPT.type),
  rightByEnough: intrinsicValue(1_040, OPT.strike, OPT.type),
  wrong: intrinsicValue(970, OPT.strike, OPT.type),
};

// ── Circuit limits, from the halts engine ───────────────────────────────────
//
// The same `indiaPriceBand` / `canTradeAtBand` the simulator enforces. The
// verdict sentences below are the engine's own words, not a paraphrase — if the
// rule ever changed, the explainer would say the new thing.

const BAND_REF = 1_000;
const BAND = indiaPriceBand(BAND_REF, 10);
const BAND_AT = BAND.lower;
const BAND_BREACH = checkBand(BAND_AT, BAND);
const BAND_VERDICT = canTradeAtBand(BAND_BREACH, 'sell');

// ── Position sizing, from the portfolio engine ──────────────────────────────
//
// One account, one risk budget, three stop distances. The point of the scene is
// that the quantity is an OUTPUT — so it is computed here rather than chosen.

const ACCOUNT = 500_000;
const RISK_FRACTION = 0.01;
const ENTRY = 1_000;

const SIZINGS = [2, 5, 10].map((stopPercent) => {
  const stop = ENTRY * (1 - stopPercent / 100);
  const sized = sizeFromStop({ equity: ACCOUNT, riskFraction: RISK_FRACTION, entry: ENTRY, stop });
  return { stopPercent, stop, ...sized, deployed: sized.quantity * ENTRY };
});

const TIGHT = SIZINGS[0];

/** Equity left after `n` consecutive losses of `fraction` each. Compounding down. */
const afterLosses = (fraction: number, n: number) => ACCOUNT * Math.pow(1 - fraction, n);

/** How far a fall of `lost` from `ACCOUNT` must climb, in percent, to get back. */
const climbBack = (remaining: number) => (ACCOUNT / remaining - 1) * 100;

const RUIN = [0.01, 0.02, 0.05, 0.1].map((fraction) => ({
  fraction,
  remaining: afterLosses(fraction, 10),
  climb: climbBack(afterLosses(fraction, 10)),
}));

// ── Evidence arithmetic ─────────────────────────────────────────────────────
//
// All exact, none of it claimed about any real market. The base rate is a
// STATED assumption — "suppose this stock rises the next day 52% of the time" —
// and every figure downstream is arithmetic on that assumption. Real base rates
// come from real bars in `analysis/patterns.ts`, which needs data this module
// does not have and must never invent.

const BASE_RATE = 0.52;
const PATTERN_HIT = 0.54;

/** Chance of at least one "significant at 5%" result from `n` worthless ideas. */
const falsePositiveChance = (n: number) => 1 - Math.pow(0.95, n);
const IDEAS_TRIED = [1, 5, 20, 100].map((n) => ({ n, chance: falsePositiveChance(n) * 100 }));

/** Two strategies with the same expectancy reached from opposite directions. */
const EXPECTANCIES = [
  { label: 'Right 54% of the time, 1:1', value: expectancy(0.54, 1) },
  { label: 'Right 40% of the time, 2:1', value: expectancy(0.4, 2) },
  { label: 'Right 70% of the time, 0.4:1', value: expectancy(0.7, 0.4) },
];

// ── One candle, as a structure ──────────────────────────────────────────────
//
// Four stated numbers. The scene exists to show what the shape encodes and,
// more importantly, what it discards.

const CANDLE = { open: 100, high: 106, low: 98, close: 101 };
const CANDLE_RANGE = CANDLE.high - CANDLE.low;
const CANDLE_NET = CANDLE.close - CANDLE.open;

// ── The explainers ──────────────────────────────────────────────────────────

const WHERE_YOUR_MONEY_GOES: Explainer = {
  id: 'where-your-money-goes',
  title: 'Where your money actually goes',
  blurb: `Buy and sell ${rupees(DEMO_TURNOVER, 0)} of shares and ${rupees(TRIP_TOTAL, 0)} never comes back. Here is who took it.`,
  question: 'I bought and sold at the same price, so why am I down?',
  terms: ['stt', 'brokerage', 'gst', 'stamp-duty', 'dp-charges', 'turnover', 'breakeven', 'round-trip'],
  chapters: [
    {
      title: 'The trade that lost money at the same price',
      scenes: [
        {
          seconds: 7,
          caption: `You buy ${DEMO_QTY} shares at ${rupees(DEMO_PRICE, 0)} each. That is ${rupees(DEMO_TURNOVER, 0)} of your money, and nothing has gone wrong yet.`,
          scene: {
            kind: 'chain',
            token: rupees(DEMO_TURNOVER, 0),
            steps: [
              { label: 'You', sub: 'press buy' },
              { label: 'Your broker', sub: 'passes it on' },
              { label: 'The exchange', sub: 'matches it' },
              { label: 'You own the shares', sub: 'settled next day' },
            ],
            at: 0,
          },
        },
        {
          seconds: 8,
          caption: 'Weeks later you sell the same 100 shares at exactly the same price. You are square. On paper you neither made nor lost anything.',
          scene: {
            kind: 'chain',
            token: rupees(DEMO_TURNOVER, 0),
            steps: [
              { label: 'You', sub: 'press sell' },
              { label: 'Your broker', sub: 'passes it on' },
              { label: 'The exchange', sub: 'matches it' },
              { label: 'Money back', sub: 'or so you would think' },
            ],
            at: 3,
          },
        },
        {
          seconds: 6,
          caption: `You are down ${rupees(TRIP_TOTAL)}. Not because you were wrong about anything — because a trade is not free, and you paid for two of them.`,
          scene: {
            kind: 'bars',
            scaleTo: TRIP_TOTAL,
            unit: '₹',
            bars: [{ label: 'What the round trip cost you', value: TRIP_TOTAL, tone: 'cost', note: 'both legs' }],
          },
        },
      ],
    },
    {
      title: 'Who took what',
      scenes: [
        {
          seconds: 8,
          caption: `Here is the whole bill, biggest first. Five separate parties took a slice, and only the first one is negotiable.`,
          scene: {
            kind: 'bars',
            scaleTo: TRIP_LINES[0]?.amount ?? 1,
            unit: '₹',
            bars: TRIP_LINES.map((l) => ({
              label: l.label,
              value: l.amount,
              note: PAYEE_LABEL[l.payee],
              tone: 'cost' as const,
            })),
          },
        },
        {
          seconds: 7,
          caption: `The largest single line is STT — ${rupees(STT_TOTAL)} of the ${rupees(TRIP_TOTAL)}. It is a tax on the transaction happening, not on you doing well. You pay it in full on a trade you lost money on.`,
          scene: {
            kind: 'bars',
            scaleTo: TRIP_LINES[0]?.amount ?? 1,
            unit: '₹',
            bars: TRIP_LINES.map((l) => ({
              label: l.label,
              value: l.amount,
              note: PAYEE_LABEL[l.payee],
              tone: l.key.toLowerCase().includes('stt') ? ('bad' as const) : ('neutral' as const),
            })),
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption: `If you have ever bought property, you have already paid this tax under another name. The registration charge is not a fee for a service and it is not a share of your profit — the state takes it because a transfer happened. STT is the same instrument pointed at shares: ${rupees(STT_TOTAL)} on this round trip, taken on the way out, owed just as fully on the day you sell at a loss.`,
          scene: {
            kind: 'compare',
            glyph: 'house',
            everyday: ANALOGIES.stt,
            market: `${rupees(STT_TOTAL)} of the ${rupees(TRIP_TOTAL)} on this trade — the single largest line, charged on the sell leg.`,
            breaks:
              'A flat changes hands once in a decade. This is charged on every trade you ever place, so somebody trading weekly pays it fifty times a year on the same money.',
          },
        },
        {
          seconds: 8,
          only: 'video',
          caption: `Now look at what is missing from that bill. Brokerage is the estate agent's commission here — the one negotiable line — and on this trade it is ${rupees(BROKERAGE_TOTAL)}. The advert was telling the truth. You paid no brokerage whatsoever, and the trade still cost you ${rupees(TRIP_TOTAL)}, because the only charge they were ever able to waive was the smallest thing on the list.`,
          scene: {
            kind: 'compare',
            glyph: 'receipt',
            everyday: ANALOGIES.brokerage,
            market: `Brokerage on this delivery trade: ${rupees(BROKERAGE_TOTAL)}. Total cost: ${rupees(TRIP_TOTAL)}. Every rupee of it went to somebody who was never going to negotiate.`,
            breaks:
              'An agent who charges nothing has no reason to sell your flat. A broker charging nothing is still paid — usually for where they send your order, which appears on no bill you will ever be shown.',
          },
        },
        {
          seconds: 7,
          caption:
            'Only brokerage is yours to shop around for. STT, stamp duty, the exchange charge, the regulator fee and the depository charge are the same whichever broker you use — which is why "zero brokerage" is an advert, not a free trade.',
          scene: {
            kind: 'bars',
            scaleTo: TRIP_LINES[0]?.amount ?? 1,
            unit: '₹',
            bars: TRIP_LINES.map((l) => ({
              label: l.label,
              value: l.amount,
              note: l.payee === 'broker' ? 'you can change this' : 'fixed — same everywhere',
              tone: l.payee === 'broker' ? ('good' as const) : ('neutral' as const),
            })),
          },
        },
      ],
    },
    {
      title: 'What it means for the next trade',
      scenes: [
        {
          seconds: 7,
          caption: `So the price has to rise ${rupees(DEMO_TRIP.breakevenMove)} per share — ${DEMO_TRIP.breakevenPercent.toFixed(2)}% — before you have made your first rupee. That is the real starting line, and no app draws it on your screen.`,
          scene: {
            kind: 'bars',
            scaleTo: DEMO_PRICE * 0.01,
            unit: '₹',
            precision: 2,
            bars: [
              { label: 'Move you need just to be square', value: DEMO_TRIP.breakevenMove, tone: 'cost', note: 'per share' },
              { label: '1% move, for comparison', value: DEMO_PRICE * 0.01, tone: 'neutral', note: 'per share' },
            ],
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption: `Think of a taxi that charges fifty rupees the moment you sit down. A two-minute ride is terrible value; an hour-long one barely notices it. Traders assume costs work that way and that trading bigger dilutes them. Here they do not: almost every line on this bill is a percentage, so the starting line stays ${DEMO_TRIP.breakevenPercent.toFixed(2)}% away whether you trade a lakh or a crore.`,
          scene: {
            kind: 'compare',
            glyph: 'taxi',
            everyday: ANALOGIES.breakeven,
            market: `${rupees(DEMO_TRIP.breakevenMove)} per share, or ${DEMO_TRIP.breakevenPercent.toFixed(2)}%, before the trade has made you anything.`,
            breaks:
              'The taxi fee is flat, so a longer ride dilutes it. These are mostly percentages, so a bigger trade does not — the only thing that genuinely dilutes them is trading less often.',
          },
        },
        {
          seconds: 8,
          caption: `And it changes with how you trade, not just how much. The same ${rupees(DEMO_TURNOVER, 0)} sold the same day is charged ${rupees(DEMO_INTRADAY.total)} on the sell leg instead — different product, different tax treatment, same shares.`,
          scene: {
            kind: 'bars',
            scaleTo: Math.max(DEMO_TRIP.exit.total, DEMO_INTRADAY.total),
            unit: '₹',
            bars: [
              { label: 'Held overnight, then sold', value: DEMO_TRIP.exit.total, tone: 'cost', note: 'sell leg only' },
              { label: 'Bought and sold same day', value: DEMO_INTRADAY.total, tone: 'good', note: 'sell leg only' },
            ],
          },
        },
      ],
    },
  ],
};

const WHAT_HAPPENS_WHEN_YOU_PRESS_BUY: Explainer = {
  id: 'what-happens-when-you-press-buy',
  title: 'What happens when you press buy',
  blurb: 'Six parties touch your order between the tap and the shares being yours. Most people know about one of them.',
  question: 'I tapped buy and it filled. What actually happened in between?',
  terms: ['order', 'broker', 'exchange', 'order-book', 'fill', 'clearing-corporation', 'depository', 't-plus-one', 'bid', 'ask', 'spread', 'market-order', 'resting-order'],
  chapters: [
    {
      title: 'The tap',
      scenes: [
        {
          seconds: 5,
          caption: 'You tap buy. What leaves your phone is an instruction, not a purchase — and an instruction can be refused, delayed, or filled at a price you did not expect.',
          scene: {
            kind: 'chain',
            token: 'your instruction',
            steps: [
              { label: 'You', sub: 'tap buy' },
              { label: 'Your broker', sub: 'checks you can afford it' },
              { label: 'The exchange', sub: 'puts it in the queue' },
              { label: 'Matched', sub: 'against someone selling' },
            ],
            at: 0,
          },
        },
        {
          seconds: 6,
          caption: 'Your broker checks it first — enough money, allowed quantity, a price the exchange will accept. Plenty of orders die right here, and the reason you get back is usually one line long.',
          scene: {
            kind: 'chain',
            token: 'your instruction',
            steps: [
              { label: 'You', sub: 'tap buy' },
              { label: 'Your broker', sub: 'checks you can afford it' },
              { label: 'The exchange', sub: 'puts it in the queue' },
              { label: 'Matched', sub: 'against someone selling' },
            ],
            at: 1,
          },
        },
      ],
    },
    {
      title: 'The queue you never see',
      scenes: [
        {
          seconds: 7,
          caption: 'At the exchange your order joins two facing queues. Everyone wanting to buy on one side, everyone wanting to sell on the other, each holding up a price and a quantity.',
          scene: {
            kind: 'ladder',
            bids: [
              { price: 999.8, qty: 250 },
              { price: 999.75, qty: 400 },
              { price: 999.7, qty: 1_200 },
            ],
            asks: [
              { price: 1_000.0, qty: 180 },
              { price: 1_000.05, qty: 500 },
              { price: 1_000.1, qty: 900 },
            ],
          },
        },
        {
          seconds: 7,
          caption: 'The gap between the best buyer and the best seller is the spread. It is a real cost that appears on no bill: buy and instantly sell, and you are down that gap before anything has moved.',
          scene: {
            kind: 'ladder',
            bids: [
              { price: 999.8, qty: 250 },
              { price: 999.75, qty: 400 },
              { price: 999.7, qty: 1_200 },
            ],
            asks: [
              { price: 1_000.0, qty: 180 },
              { price: 1_000.05, qty: 500 },
              { price: 1_000.1, qty: 900 },
            ],
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'The clearest version of the spread is the currency counter at an airport. It buys dollars at one figure and sells them at a higher one, and the gap is the whole business. Walk up, change rupees to dollars and immediately change them back, and you get less money than you started with — nobody cheated you and nobody handed you a bill. Every share you buy works exactly like that.',
          scene: {
            kind: 'compare',
            glyph: 'exchange',
            everyday: ANALOGIES.spread,
            market:
              'Best buyer ₹999.80, best seller ₹1,000.00. Buy and instantly sell 100 shares and you are ₹20 down before the market has moved at all.',
            breaks:
              'The airport counter posts its two figures and keeps them. A share spread widens the moment things get uncertain, so it is worst precisely when you most want out.',
          },
        },
        {
          seconds: 8,
          caption: 'Ask for 500 at whatever it costs and you do not get 500 at ₹1,000. You get the 180 sitting there, then the next 320 higher up. Your average is worse than the price you saw, and the bigger your order the worse it gets.',
          scene: {
            kind: 'ladder',
            bids: [
              { price: 999.8, qty: 250 },
              { price: 999.75, qty: 400 },
              { price: 999.7, qty: 1_200 },
            ],
            asks: [
              { price: 1_000.0, qty: 180 },
              { price: 1_000.05, qty: 500 },
              { price: 1_000.1, qty: 900 },
            ],
            taking: 500,
          },
        },
      ],
    },
    {
      title: 'After the fill',
      scenes: [
        {
          seconds: 9,
          only: 'video',
          caption:
            'This is the part almost nobody thinks about, and it is the reason the whole thing works. When you buy a flat, you do not hand a stranger a suitcase of cash and hope the papers turn up — the money and the deeds both go to a neutral third party that releases each only once the other has arrived. The market has exactly that, for every trade, automatically.',
          scene: {
            kind: 'compare',
            glyph: 'vault',
            everyday: ANALOGIES['clearing-corporation'],
            market:
              'The clearing corporation stands between you and the seller. Neither of you ever finds out who the other was, and neither of you has to care.',
            breaks:
              'In a property sale you choose the escrow agent and pay for it. Here it is compulsory, invisible, and already priced into the charges you just saw.',
          },
        },
        {
          seconds: 7,
          caption: 'Filled is not finished. Neither side hands anything to the other directly — money and shares both go to a clearing corporation in the middle, which is what stops your trade depending on a stranger keeping their word.',
          scene: {
            kind: 'chain',
            token: 'the trade',
            steps: [
              { label: 'Matched', sub: 'you and a seller' },
              { label: 'Clearing corporation', sub: 'stands in the middle' },
              { label: 'Depository', sub: 'moves the shares' },
              { label: 'Your account', sub: 'next working day' },
            ],
            at: 1,
          },
        },
        {
          seconds: 7,
          caption: 'The shares land in your account the next working day. They are yours from the moment you were filled — but until the paperwork lands, some things you might want to do with them are not available yet.',
          scene: {
            kind: 'chain',
            token: 'the shares',
            steps: [
              { label: 'Matched', sub: 'you and a seller' },
              { label: 'Clearing corporation', sub: 'stands in the middle' },
              { label: 'Depository', sub: 'moves the shares' },
              { label: 'Your account', sub: 'next working day' },
            ],
            at: 3,
          },
        },
      ],
    },
  ],
};

const WHY_YOUR_OPTION_EXPIRED_WORTHLESS: Explainer = {
  id: 'why-your-option-expired-worthless',
  title: 'Why your option expired worthless',
  blurb: 'You were right about the direction and still lost everything. This is the part nobody explains first.',
  question: 'The stock went up like I said. Why did my option go to zero?',
  terms: ['option', 'premium', 'time-value', 'intrinsic-value', 'expiry', 'moneyness', 'call-option', 'volatility'],
  chapters: [
    {
      title: 'What you actually bought',
      scenes: [
        {
          seconds: 7,
          caption: `You pay ${rupees(OPT_PAID)} for the right to buy at ${rupees(OPT.strike, 0)} when the share is ${rupees(OPT.spot, 0)}, four weeks out. That one figure is really two things stuck together, and only one of them survives to the end.`,
          scene: {
            kind: 'bars',
            scaleTo: OPT_PAID,
            unit: '₹',
            bars: [{ label: 'What you paid', value: OPT_PAID, tone: 'neutral', note: 'one figure, two halves' }],
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption: `Before the arithmetic, the thing itself. You have seen a builder take a token to hold a flat for a month at a fixed figure. If prices jump you buy at the old figure and you have done very well. If you change your mind you lose the token and nothing more. What you bought was not the flat — it was a month of being allowed to decide, and ${rupees(OPT_PAID)} is what that month cost.`,
          scene: {
            kind: 'compare',
            glyph: 'token',
            everyday: ANALOGIES.option,
            market: `${rupees(OPT_PAID)} buys the right — not the obligation — to pay ${rupees(OPT.strike, 0)} for a share currently worth ${rupees(OPT.spot, 0)}, any time in the next four weeks.`,
            breaks:
              'The builder holds your flat off the market for that month. Nobody is holding a share for you — you can be right about the direction and still be handed nothing, which is what the rest of this explains.',
          },
        },
        {
          seconds: 8,
          caption: `Split apart: ${rupees(OPT_INTRINSIC)} of it is plain arithmetic — the ${rupees(OPT.spot, 0)} share against the ${rupees(OPT.strike, 0)} you agreed to pay. The other ${rupees(OPT_TIME_VALUE)} is not arithmetic at all.`,
          scene: {
            kind: 'bars',
            scaleTo: OPT_PAID,
            unit: '₹',
            bars: [
              { label: 'Worth this if you act right now', value: OPT_INTRINSIC, tone: 'good', note: 'the real half' },
              { label: 'Paid for there still being time', value: OPT_TIME_VALUE, tone: 'cost', note: 'the melting half' },
            ],
          },
        },
        {
          seconds: 8,
          caption: `That second ${rupees(OPT_TIME_VALUE)} is what everyone else will pay you for the fact that anything could still happen before the clock runs out. Nothing has to go wrong for it to shrink. The clock alone does it.`,
          scene: {
            kind: 'bars',
            scaleTo: OPT_PAID,
            unit: '₹',
            bars: [
              { label: 'Worth this if you act right now', value: OPT_INTRINSIC, tone: 'neutral', note: 'unchanged by time' },
              { label: 'Paid for there still being time', value: OPT_TIME_VALUE, tone: 'bad', note: 'shrinks every day' },
            ],
          },
        },
      ],
    },
    {
      title: 'The clock',
      scenes: [
        {
          seconds: 9,
          only: 'video',
          caption: `The half that melts is the one worth understanding, and there is an everyday object that behaves identically: a carton of milk. Two weeks out nobody hesitates. On the last day it is discounted hard. One day past the date it is not worth slightly less, it is worth nothing, and no shop gives you a grace period. Your ${rupees(OPT_TIME_VALUE)} of time value is on exactly that schedule.`,
          scene: {
            kind: 'compare',
            glyph: 'clock',
            everyday: ANALOGIES['time-value'],
            market: `${rupees(OPT_TIME_VALUE)} of the ${rupees(OPT_PAID)} you paid is time value. Held four weeks with the share completely still, all of it goes.`,
            breaks:
              'Milk spoils at a steady rate. Time value does not — it barely moves in the first week and falls off a cliff in the last, which is why the calendar hurts far more at the end than the beginning.',
          },
        },
        {
          seconds: 10,
          caption: `Here is the melting half alone, week by week, with the share price deliberately held completely still at ${rupees(OPT.spot, 0)}. It does not fall in a straight line — it goes slowly, then all at once, and the last week takes more than the first two put together.`,
          scene: {
            kind: 'bars',
            scaleTo: OPT_TIME_VALUE,
            unit: '₹',
            bars: DECAY.map((d) => ({
              label: d.days === 0 ? 'Expiry day' : `${d.days} days left`,
              value: d.timeValue,
              tone: d.days === 0 ? ('bad' as const) : d.days <= 14 ? ('cost' as const) : ('neutral' as const),
              note: d.days === 0 ? 'gone — nothing went wrong' : undefined,
            })),
          },
        },
        {
          seconds: 10,
          caption: `So being right is not enough — you have to be right by more than ${rupees(OPT_PAID)} before the clock runs out. A share that ends at ${rupees(1_005, 0)} rose, exactly as you said, and still hands you ${rupees(AT_EXPIRY.rightByALittle)} against the ${rupees(OPT_PAID)} you paid.`,
          scene: {
            kind: 'bars',
            scaleTo: AT_EXPIRY.rightByEnough,
            unit: '₹',
            bars: [
              { label: 'What you paid, four weeks earlier', value: OPT_PAID, tone: 'neutral' },
              { label: `Right by a little — ends at ${rupees(1_005, 0)}`, value: AT_EXPIRY.rightByALittle, tone: 'bad', note: 'you were right, and you lost' },
              { label: `Right by enough — ends at ${rupees(1_040, 0)}`, value: AT_EXPIRY.rightByEnough, tone: 'good', note: 'the only winning case' },
              { label: `Wrong — ends at ${rupees(970, 0)}`, value: AT_EXPIRY.wrong, tone: 'bad', note: 'nothing' },
            ],
          },
        },
        {
          seconds: 8,
          caption: 'Every figure in this explainer is a model price, not a quote — the same Black-Scholes maths the greeks widget uses, with volatility and rates held fixed. Real premiums move for reasons this deliberately leaves out. The shape of the melt is the part that is true.',
          scene: {
            kind: 'bars',
            scaleTo: OPT_TIME_VALUE,
            unit: '₹',
            bars: DECAY.map((d) => ({
              label: d.days === 0 ? 'Expiry day' : `${d.days} days left`,
              value: d.timeValue,
              tone: 'neutral' as const,
            })),
          },
        },
      ],
    },
  ],
};

const WHY_YOU_COULD_NOT_SELL: Explainer = {
  id: 'why-you-could-not-sell',
  title: 'Why you could not sell',
  blurb: `A stock can only move ±${BAND.bandPercent}% in a day. At the edge, the exit you were counting on stops existing.`,
  question: 'My stop-loss was set. Why did it never fill?',
  terms: ['circuit-limit', 'stop-loss', 'order-book', 'liquidity', 'exchange', 'bid', 'ask'],
  chapters: [
    {
      title: 'The fence around the day',
      scenes: [
        {
          seconds: 8,
          caption: `Every Indian stock trades inside a fence drawn before the day starts. Yesterday it closed at ${rupees(BAND_REF, 0)}; today it is allowed anywhere between ${rupees(BAND.lower)} and ${rupees(BAND.upper)} and nowhere else. Not "unlikely to" — not allowed to. The exchange will refuse an order outside it.`,
          scene: {
            kind: 'band',
            reference: BAND.reference,
            lower: BAND.lower,
            upper: BAND.upper,
            bandPercent: BAND.bandPercent,
          },
        },
        {
          seconds: 8,
          caption: `Now bad news arrives and the price falls all the way to the bottom of the fence, ${rupees(BAND.lower)}. Everybody who wants out today is looking at the same number, because there is no lower number to look at. This is what people mean when they say a stock is at its lower circuit.`,
          scene: {
            kind: 'band',
            reference: BAND.reference,
            lower: BAND.lower,
            upper: BAND.upper,
            bandPercent: BAND.bandPercent,
            at: BAND_AT,
            verdict: BAND_VERDICT.reason,
          },
        },
      ],
    },
    {
      title: 'Locked, and what that means',
      scenes: [
        {
          seconds: 8,
          caption:
            'Look at the queues and the problem becomes obvious. Every seller in the market is stacked on one side. The other side is empty — not thin, empty. A trade needs two people, and today there is only one kind of person.',
          scene: {
            kind: 'ladder',
            bids: [],
            asks: [
              { price: BAND.lower, qty: 48_000 },
              { price: BAND.lower, qty: 92_000 },
              { price: BAND.lower, qty: 210_000 },
            ],
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'The comparison people reach for is a referee stopping play, and it is a good one as far as it goes. The crowd is out of hand, so everything pauses until it calms down. What the comparison hides is who is standing where when the whistle blows — because the pause is not neutral. It costs whoever needed the next few seconds most.',
          scene: {
            kind: 'compare',
            glyph: 'queue',
            everyday: ANALOGIES['circuit-limit'],
            market: `Locked at ${rupees(BAND.lower)}: sell orders stacked up, no buy orders at all. Your order joins a queue that is not moving.`,
            breaks:
              'A referee restarts the same match. The exchange restarts tomorrow, with a new fence drawn around a much lower close — so the fall you could not escape today has already happened by the time you can act.',
          },
        },
      ],
    },
    {
      title: 'What it does to your stop-loss',
      scenes: [
        {
          seconds: 9,
          caption:
            'Here is where the money goes. Your stop-loss did everything it promised: it watched, it triggered, it sent a sell order. It just arrived in a market with nobody on the other side. A stop-loss is a request to trade, and a request needs somebody to accept it.',
          scene: {
            kind: 'chain',
            token: 'your stop-loss',
            steps: [
              { label: 'Price falls', sub: 'to your trigger' },
              { label: 'Stop fires', sub: 'exactly as set' },
              { label: 'Order reaches the book', sub: 'sell, at the circuit' },
              { label: 'No buyer', sub: 'it simply waits' },
            ],
            at: 3,
          },
        },
        {
          seconds: 8,
          caption:
            'So the honest way to hold a stop-loss is as a plan that usually works, not a floor under your losses. It protects you on ordinary days, which is most days. The days it fails are exactly the days you needed it — and that is not a flaw in your broker, it is what a fence around the day does.',
          scene: {
            kind: 'chain',
            token: 'the next morning',
            steps: [
              { label: 'Still holding', sub: 'the stop never filled' },
              { label: 'New close', sub: 'a new reference price' },
              { label: 'New fence', sub: `±${BAND.bandPercent}% around it` },
              { label: 'Try again', sub: 'lower down' },
            ],
            at: 3,
          },
        },
      ],
    },
  ],
};

const HOW_MUCH_SHOULD_YOU_BUY: Explainer = {
  id: 'how-much-should-you-buy',
  title: 'How much should you buy',
  blurb: `The one calculation that decides whether being wrong is survivable. On a ${rupees(ACCOUNT, 0)} account, the answer is arithmetic, not instinct.`,
  question: 'I found a stock I like. How many shares do I actually buy?',
  terms: ['position-size', 'risk-per-trade', 'stop-loss', 'position', 'drawdown', 'risk-of-ruin'],
  chapters: [
    {
      title: 'Two numbers people confuse',
      scenes: [
        {
          seconds: 8,
          caption: `Almost everyone answers "how much should I buy" with a rupee amount they are comfortable spending. That is the wrong number. What you put in and what you can lose are two different figures, and only the second one should decide the first.`,
          scene: {
            kind: 'bars',
            scaleTo: TIGHT.deployed,
            unit: '₹',
            precision: 0,
            bars: [
              { label: 'Money you put to work', value: TIGHT.deployed, tone: 'neutral', note: 'the number people pick' },
              { label: 'Money actually at risk', value: TIGHT.riskAmount, tone: 'cost', note: 'the number that matters' },
            ],
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption: `The gap between those two bars is the whole idea, and it exists because you have a stop-loss. You are not betting ${rupees(TIGHT.deployed, 0)} on this company being right. You are betting ${rupees(TIGHT.riskAmount, 0)} on it not falling ${TIGHT.stopPercent}% first — and if it does, you leave. Everything else is still yours.`,
          scene: {
            kind: 'compare',
            glyph: 'receipt',
            everyday: ANALOGIES['position-size'],
            market: `${rupees(ACCOUNT, 0)} account, ${(RISK_FRACTION * 100).toFixed(0)}% risk budget: ${rupees(TIGHT.riskAmount, 0)} is what a wrong answer costs you.`,
            breaks:
              'A bet settles when the match ends. A position can gap past your stop overnight and take more than you agreed to lose, which is why the risk budget is a plan rather than a guarantee.',
          },
        },
      ],
    },
    {
      title: 'The arithmetic',
      scenes: [
        {
          seconds: 9,
          caption: `Once the risk is fixed, the quantity is not a decision — it falls out. Divide what you are willing to lose by how far away your stop is. Same ${rupees(TIGHT.riskAmount, 0)} of risk, three different stop distances, three completely different order sizes.`,
          scene: {
            kind: 'bars',
            scaleTo: Math.max(...SIZINGS.map((s) => s.quantity)),
            precision: 0,
            bars: SIZINGS.map((s) => ({
              label: `Stop ${s.stopPercent}% away (${rupees(s.stop, 0)})`,
              value: s.quantity,
              tone: 'good' as const,
              note: `${s.quantity} shares — ${rupees(s.deployed, 0)} deployed`,
            })),
          },
        },
        {
          seconds: 9,
          caption: `Notice what that means. A tighter stop lets you buy more, not less — ${SIZINGS[0].quantity} shares at a ${SIZINGS[0].stopPercent}% stop against ${SIZINGS[2].quantity} at ${SIZINGS[2].stopPercent}%. The risk is identical in every case. That is the entire trick, and it is why "how confident am I" is not one of the inputs.`,
          scene: {
            kind: 'bars',
            scaleTo: Math.max(...SIZINGS.map((s) => s.riskAmount)) * 1.4,
            unit: '₹',
            precision: 0,
            bars: SIZINGS.map((s) => ({
              label: `Stop ${s.stopPercent}% away`,
              value: s.riskAmount,
              tone: 'cost' as const,
              note: 'identical, by construction',
            })),
          },
        },
      ],
    },
    {
      title: 'Why the percentage is small',
      scenes: [
        {
          seconds: 10,
          caption: `Everything above assumed a ${(RISK_FRACTION * 100).toFixed(0)}% risk budget. Here is what that choice is really for. Ten losing trades in a row happens to everyone eventually — this is what is left of the account afterwards at four different budgets.`,
          scene: {
            kind: 'bars',
            scaleTo: ACCOUNT,
            unit: '₹',
            precision: 0,
            bars: RUIN.map((r) => ({
              label: `${(r.fraction * 100).toFixed(0)}% risked per trade`,
              value: r.remaining,
              tone: r.fraction <= 0.02 ? ('good' as const) : ('bad' as const),
              note: 'left after 10 losses in a row',
            })),
          },
        },
        {
          seconds: 10,
          caption: `And the part that finishes people off is the climb back, because losses and gains are not symmetrical. After ten losses at ${(RUIN[0].fraction * 100).toFixed(0)}% you need ${RUIN[0].climb.toFixed(0)}% to be whole again. At ${(RUIN[3].fraction * 100).toFixed(0)}% you need ${RUIN[3].climb.toFixed(0)}%. The small number is not timidity — it is the only version where being wrong ten times is survivable.`,
          scene: {
            kind: 'bars',
            scaleTo: Math.max(...RUIN.map((r) => r.climb)),
            precision: 0,
            bars: RUIN.map((r) => ({
              label: `${(r.fraction * 100).toFixed(0)}% risked per trade`,
              value: r.climb,
              tone: r.fraction <= 0.02 ? ('good' as const) : ('bad' as const),
              note: `% gain needed to get back to ${rupees(ACCOUNT, 0)}`,
            })),
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'Which is why the risk budget is decided once, while nothing is happening, and then left alone. It is not a view about this trade. Every argument about whether a particular stock is a good idea sits downstream of a number you should already have chosen — and the moment you raise it because you feel sure, you have replaced the arithmetic with a feeling.',
          scene: {
            kind: 'compare',
            glyph: 'vault',
            everyday: ANALOGIES['risk-per-trade'],
            market: `${(RISK_FRACTION * 100).toFixed(0)}% of ${rupees(ACCOUNT, 0)} is ${rupees(TIGHT.riskAmount, 0)} per trade, whatever the trade is and however good it looks.`,
            breaks:
              'At a table you can stand up and walk away. A position held overnight can gap, so the amount you agreed to lose is the floor of what you might lose, not the ceiling.',
          },
        },
      ],
    },
  ],
};

const WHY_THE_BACKTEST_LIED: Explainer = {
  id: 'why-the-backtest-lied',
  title: 'Why the backtest lied',
  blurb: `Test ${IDEAS_TRIED[2].n} worthless ideas and there is a ${IDEAS_TRIED[2].chance.toFixed(0)}% chance one of them looks significant. Here is how a result appears out of nothing.`,
  question: 'It worked on ten years of data. Why did it stop working on mine?',
  terms: ['backtest', 'base-rate', 'statistical-significance', 'overfitting', 'lookahead-bias', 'survivorship-bias', 'expectancy'],
  chapters: [
    {
      title: 'The number nobody compares against',
      scenes: [
        {
          seconds: 8,
          caption: `A pattern is announced: it works ${(PATTERN_HIT * 100).toFixed(0)}% of the time. That sounds like an edge until you ask the only question that matters — how often would you have been right by guessing "up" every single day? Suppose the answer is ${(BASE_RATE * 100).toFixed(0)}%. The pattern is now worth ${((PATTERN_HIT - BASE_RATE) * 100).toFixed(0)} percentage points, not ${(PATTERN_HIT * 100).toFixed(0)}.`,
          scene: {
            kind: 'bars',
            scaleTo: 100,
            precision: 0,
            bars: [
              { label: 'The pattern is right', value: PATTERN_HIT * 100, tone: 'good', note: '% of the time' },
              { label: 'Guessing "up" every day is right', value: BASE_RATE * 100, tone: 'neutral', note: 'the base rate' },
              {
                label: 'What the pattern actually adds',
                value: (PATTERN_HIT - BASE_RATE) * 100,
                tone: 'cost',
                note: 'percentage points',
              },
            ],
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'Medicine has known this for a century and never states a result without it. Nobody accepts "eighty percent of patients improved" on its own, because the first question back is always how many would have improved anyway. A market has a base rate too, and almost nothing published about patterns quotes it.',
          scene: {
            kind: 'compare',
            glyph: 'receipt',
            everyday: ANALOGIES['base-rate'],
            market: `A pattern that fires ${(PATTERN_HIT * 100).toFixed(0)}% right, against a ${(BASE_RATE * 100).toFixed(0)}% base rate, has to earn its costs out of ${((PATTERN_HIT - BASE_RATE) * 100).toFixed(0)} points.`,
            breaks:
              'A trial fixes its question before collecting data. A chart lets you look first and decide what you were testing afterwards, which is the next problem.',
          },
        },
      ],
    },
    {
      title: 'Finding an edge that was never there',
      scenes: [
        {
          seconds: 10,
          caption: `This is the part that does the damage, and it is pure arithmetic. Take an idea with no merit at all and test it at the usual 5% threshold: a 1 in 20 chance it looks significant by luck. Now test ${IDEAS_TRIED[1].n} ideas, then ${IDEAS_TRIED[2].n}, then ${IDEAS_TRIED[3].n}. The chance that at least one worthless idea passes climbs to ${IDEAS_TRIED[3].chance.toFixed(0)}%.`,
          scene: {
            kind: 'bars',
            scaleTo: 100,
            precision: 0,
            bars: IDEAS_TRIED.map((r) => ({
              label: `${r.n} idea${r.n === 1 ? '' : 's'} tested`,
              value: r.chance,
              tone: r.chance > 50 ? ('bad' as const) : ('neutral' as const),
              note: '% chance at least one looks significant anyway',
            })),
          },
        },
        {
          seconds: 8,
          caption: `Nobody sets out to do this. You try a 20-day average, then 50, then 200; you try it on large caps, then mid caps; you add a volume filter. That is dozens of tests, and you only ever report the one that worked. The result is not the best rule — it is the luckiest one, and luck does not repeat.`,
          scene: {
            kind: 'chain',
            token: 'the search',
            steps: [
              { label: 'Try a rule', sub: 'it does not work' },
              { label: 'Tweak it', sub: 'and try again' },
              { label: 'One finally works', sub: 'beautifully' },
              { label: 'Publish that one', sub: 'the others are forgotten' },
            ],
            at: 3,
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'A tailor fits a suit to one body. Every extra measurement makes it fit that person better and everybody else worse, and past a point the suit is a description of one afternoon rather than a garment. A rule tuned until it fits ten years of history exactly has become a description of those ten years.',
          scene: {
            kind: 'compare',
            glyph: 'receipt',
            everyday: ANALOGIES.overfitting,
            market:
              'Every parameter you tune is another measurement. The fit to the past improves; the fit to next year does not.',
            breaks:
              'A suit that fits badly is obvious the moment you put it on. An overfitted rule looks perfect right up until it is running on your money.',
          },
        },
      ],
    },
    {
      title: 'Two ways the past lies about itself',
      scenes: [
        {
          seconds: 9,
          caption:
            'The first is using information that had not arrived yet. It happens by accident constantly: you decide to buy on days that closed strong, and record the trade at that day\'s open. The decision used the close. The trade used the open. On the day itself, the close had not happened.',
          scene: {
            kind: 'chain',
            token: 'one backtested trade',
            steps: [
              { label: '09:15 — the open', sub: 'you record the buy here' },
              { label: 'The day happens', sub: 'you do not know this yet' },
              { label: '15:30 — the close', sub: 'strong, so the rule fires' },
              { label: 'Recorded as a win', sub: 'using tomorrow to trade today' },
            ],
            at: 3,
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'The second is subtler and it is baked into most data. Test a strategy on the fifty companies in the index today, and every company that was in it and got thrown out is missing from your sample. You have tested it exclusively on survivors, and survivors are not a random selection.',
          scene: {
            kind: 'compare',
            glyph: 'queue',
            everyday: ANALOGIES['survivorship-bias'],
            market:
              'Today\'s index members are the ones that did well enough to still be there. The delisted and demoted are not in the file you downloaded.',
            breaks:
              'A marathon has a finish line and a known list of starters. Nobody publishes a convenient list of the companies quietly removed from an index over twenty years, which is why this bias is the easiest one to import without noticing.',
          },
        },
        {
          seconds: 10,
          caption: `And when a rule does survive all of that, judge it on expectancy rather than on how often it is right. These three are the same idea reached three ways: being right seldom and large beats being right often and small, and a high hit rate can be the worst of the set.`,
          scene: {
            kind: 'bars',
            scaleTo: Math.max(...EXPECTANCIES.map((e) => Math.abs(e.value))),
            precision: 2,
            bars: EXPECTANCIES.map((e) => ({
              label: e.label,
              value: e.value,
              tone: e.value > 0 ? ('good' as const) : ('bad' as const),
              note: 'expected R per trade',
            })),
          },
        },
      ],
    },
  ],
};

const WHAT_ONE_CANDLE_HIDES: Explainer = {
  id: 'what-one-candle-hides',
  title: 'What one candle hides',
  blurb: `Four numbers in one shape — and ${CANDLE_RANGE.toFixed(0)} points of movement compressed into a ${CANDLE_NET.toFixed(0)}-point result.`,
  question: 'What is a candle actually telling me?',
  terms: ['candle', 'ohlc', 'volume', 'gap'],
  chapters: [
    {
      title: 'Four facts in one shape',
      scenes: [
        {
          seconds: 8,
          caption: `A candle is not a picture of a day. It is four numbers from a day, arranged into a shape: where it opened, where it closed, and the furthest it got in each direction. The thick part is open-to-close. The thin line is everything else that happened.`,
          scene: {
            kind: 'candle',
            ...CANDLE,
          },
        },
        {
          seconds: 9,
          caption: `Now read what those four numbers actually say. The price covered ${CANDLE_RANGE.toFixed(2)} points of ground between its lowest and highest moment, and finished ${CANDLE_NET.toFixed(2)} above where it started. Almost everything that happened cancelled out — and the shape shows you the ${CANDLE_NET.toFixed(2)}, not the ${CANDLE_RANGE.toFixed(2)}.`,
          scene: {
            kind: 'candle',
            ...CANDLE,
            readouts: [
              { label: 'Ground covered', value: `${CANDLE_RANGE.toFixed(2)} points`, tone: 'bad' },
              { label: 'Net change', value: `${CANDLE_NET > 0 ? '+' : ''}${CANDLE_NET.toFixed(2)} points` },
              { label: 'Cancelled out', value: `${(CANDLE_RANGE - Math.abs(CANDLE_NET)).toFixed(2)} points`, tone: 'bad' },
            ],
          },
        },
      ],
    },
    {
      title: 'The order it does not record',
      scenes: [
        {
          seconds: 9,
          caption: `Here is the part that matters for every rule anyone builds on candles. This one is consistent with a day that opened, sank to ${CANDLE.low.toFixed(0)} first while everyone panicked, then climbed all the way to ${CANDLE.high.toFixed(0)} before easing back.`,
          scene: {
            kind: 'chain',
            token: 'one possible day',
            steps: [
              { label: `Opens ${CANDLE.open.toFixed(0)}`, sub: 'the day begins' },
              { label: `Falls to ${CANDLE.low.toFixed(0)}`, sub: 'the low comes first' },
              { label: `Rallies to ${CANDLE.high.toFixed(0)}`, sub: 'the high comes later' },
              { label: `Closes ${CANDLE.close.toFixed(0)}`, sub: 'eases back at the end' },
            ],
            at: 3,
          },
        },
        {
          seconds: 9,
          caption: `It is equally consistent with the exact opposite: a day that ran to ${CANDLE.high.toFixed(0)} in the first hour, gave all of it back and more, and only recovered to ${CANDLE.close.toFixed(0)} at the very end. Two completely different days. One identical candle. Nothing in the shape distinguishes them.`,
          scene: {
            kind: 'chain',
            token: 'the other possible day',
            steps: [
              { label: `Opens ${CANDLE.open.toFixed(0)}`, sub: 'the same open' },
              { label: `Runs to ${CANDLE.high.toFixed(0)}`, sub: 'the high comes first' },
              { label: `Slides to ${CANDLE.low.toFixed(0)}`, sub: 'gives it all back' },
              { label: `Closes ${CANDLE.close.toFixed(0)}`, sub: 'the same close' },
            ],
            at: 3,
          },
        },
        {
          seconds: 9,
          only: 'video',
          caption:
            'Which is why a candle is best thought of as a weather summary rather than a recording. High of thirty-four, low of nineteen, ended mild. True, useful, and it cannot tell you whether the cold came before the heat — and if your plan depended on being outside at the right moment, that is the only thing you needed.',
          scene: {
            kind: 'compare',
            glyph: 'clock',
            everyday: ANALOGIES.candle,
            market: `Open ${CANDLE.open.toFixed(2)}, high ${CANDLE.high.toFixed(2)}, low ${CANDLE.low.toFixed(2)}, close ${CANDLE.close.toFixed(2)} — and no ordering at all.`,
            breaks:
              'A weather summary is nobody\'s trading signal. Named candle patterns are, and a great many of them are claims about a sequence the data does not contain.',
          },
        },
      ],
    },
    {
      title: 'And the number beside it',
      scenes: [
        {
          seconds: 9,
          only: 'video',
          caption:
            'Volume gets read the same hopeful way. It counts how many shares changed hands and nothing else — not who was keen, not which side was in a hurry. Every share sold was also bought, so a heavy day cannot tell you that selling outweighed buying. It only tells you a lot of people disagreed about the price.',
          scene: {
            kind: 'compare',
            glyph: 'queue',
            everyday: ANALOGIES.volume,
            market: 'Every trade has a buyer and a seller. Volume is the count of agreements, not a balance of opinion.',
            breaks:
              'Footfall through a shop at least tells you people walked in. Volume does not even tell you that much about direction — the same figure appears on the day something is dumped and the day it is snapped up.',
          },
        },
        {
          seconds: 8,
          caption: `So use the candle for what it holds — four honest numbers — and stop asking it for the fifth. If your rule depends on which came first, the high or the low, it depends on something this data does not contain, and testing it on this data will not find that out.`,
          scene: {
            kind: 'candle',
            ...CANDLE,
            readouts: [
              { label: 'Recorded', value: 'open · high · low · close' },
              { label: 'Not recorded', value: 'the order any of it happened', tone: 'bad' },
            ],
          },
        },
      ],
    },
  ],
};

export const EXPLAINERS: Explainer[] = [
  WHERE_YOUR_MONEY_GOES,
  WHAT_HAPPENS_WHEN_YOU_PRESS_BUY,
  WHY_YOUR_OPTION_EXPIRED_WORTHLESS,
  WHY_YOU_COULD_NOT_SELL,
  HOW_MUCH_SHOULD_YOU_BUY,
  WHY_THE_BACKTEST_LIED,
  WHAT_ONE_CANDLE_HIDES,
];

export const EXPLAINER_BY_ID = new Map(EXPLAINERS.map((e) => [e.id, e]));

/** Every explainer that covers a given glossary term. */
export function explainersForTerm(termId: string): Explainer[] {
  return EXPLAINERS.filter((e) => e.terms.includes(termId));
}

/**
 * Comfortable reading speed, in characters per second.
 *
 * Deliberately slow. 15 c/s is roughly 180 words a minute, which is an
 * unhurried read — and the reader is also looking at a picture, which is the
 * entire point of the scene. A caption that has scrolled away before it was
 * finished is worse than no animation at all.
 */
export const READING_CHARS_PER_SECOND = 15;

/**
 * The narration manifest, keyed on the caption text itself.
 *
 * Keying on the words rather than on a scene id is what makes stale audio
 * impossible instead of merely unlikely. Reword a caption and the key stops
 * matching: the lookup misses, the scene falls back to reading-speed timing
 * with no voice, and `narration.test.ts` fails naming the line that now has the
 * wrong recording behind it. An id-keyed manifest would cheerfully have gone on
 * playing the old sentence over the new text.
 *
 * An empty manifest is a valid state, not a broken one — a fresh clone with no
 * `pnpm narrate` run behaves exactly as this file did before narration existed.
 */
const NARRATION = narration as {
  voice: string;
  tailSeconds: number;
  lines: Record<string, { file: string; seconds: number }>;
};

export interface Narration {
  /** File under `public/narration/`. */
  file: string;
  /** Measured from the encoded mp3, which is what actually plays. */
  seconds: number;
}

/** The recorded line for a caption, or null if there is not a current one. */
export function narrationFor(caption: string): Narration | null {
  return NARRATION.lines[caption] ?? null;
}

/** Silence allowed after the last spoken word before the scene may change. */
export const NARRATION_TAIL_SECONDS = NARRATION.tailSeconds;

/**
 * How long a scene actually holds: long enough to look, to read, and to hear.
 *
 * Three floors, whichever is highest. The spoken length is the one that
 * usually wins, because a voice at a natural pace is slower than a comfortable
 * silent read — which is worth knowing before wondering why adding narration
 * made every explainer longer.
 */
export function sceneSeconds(scene: ExplainerScene): number {
  const spoken = narrationFor(scene.caption);
  return Math.max(
    scene.seconds,
    scene.caption.length / READING_CHARS_PER_SECOND,
    spoken ? spoken.seconds + NARRATION_TAIL_SECONDS : 0,
  );
}

/**
 * Which cut of an explainer is being asked for.
 *
 * `page` is the default everywhere, so nothing that does not care about video
 * has to think about this.
 */
export type Medium = 'page' | 'video';

function scenesFor(explainer: Explainer, medium: Medium): { chapter: Chapter; scene: ExplainerScene }[] {
  return explainer.chapters.flatMap((chapter) =>
    chapter.scenes
      .filter((scene) => medium === 'video' || scene.only !== 'video')
      .map((scene) => ({ chapter, scene })),
  );
}

/**
 * The same explainer with only one medium's scenes left in it.
 *
 * Needed because the player is a client component, so whatever it is handed is
 * serialised into the page for the browser. Passing the whole explainer meant
 * every reader downloaded the video-only analogy scenes — several paragraphs of
 * prose per page — which nothing would ever render. Nothing looked wrong; it
 * was simply weight nobody asked for.
 */
export function forMedium(explainer: Explainer, medium: Medium): Explainer {
  if (medium === 'video') return explainer;
  return {
    ...explainer,
    chapters: explainer.chapters
      .map((chapter) => ({ ...chapter, scenes: chapter.scenes.filter((s) => s.only !== 'video') }))
      // A chapter that was entirely video-only would otherwise survive as an
      // empty heading in the chapter list, linking to nothing.
      .filter((chapter) => chapter.scenes.length > 0),
  };
}

/** Total running time, in seconds. Derived, never typed. */
export function runtimeOf(explainer: Explainer, medium: Medium = 'page'): number {
  return scenesFor(explainer, medium).reduce((total, { scene }) => total + sceneSeconds(scene), 0);
}

/**
 * The scenes of an explainer flattened in playing order, with their start times.
 *
 * Flattened rather than nested, because the player's single source of truth is
 * one number — elapsed seconds — and the only question it ever asks is "which
 * entry is showing now". Chapters survive as a label on each entry so the
 * chapter list can still highlight itself, which is cheaper than making the
 * player walk a tree on every frame.
 */
export interface TimelineEntry {
  caption: string;
  scene: Scene;
  seconds: number;
  chapter: string;
  chapterIndex: number;
  startsAt: number;
  /** The spoken line, or null where none has been generated yet. */
  narration: Narration | null;
}

export function timeline(explainer: Explainer, medium: Medium = 'page'): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  let t = 0;
  for (const { chapter, scene } of scenesFor(explainer, medium)) {
    const seconds = sceneSeconds(scene);
    out.push({
      caption: scene.caption,
      scene: scene.scene,
      seconds,
      chapter: chapter.title,
      chapterIndex: explainer.chapters.indexOf(chapter),
      startsAt: t,
      narration: narrationFor(scene.caption),
    });
    t += seconds;
  }
  return out;
}
