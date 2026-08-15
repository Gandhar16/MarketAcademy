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

export type Scene = ChainScene | BarsScene | LadderScene | CompareScene;

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

export const EXPLAINERS: Explainer[] = [
  WHERE_YOUR_MONEY_GOES,
  WHAT_HAPPENS_WHEN_YOU_PRESS_BUY,
  WHY_YOUR_OPTION_EXPIRED_WORTHLESS,
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
