/**
 * The syllabus — one ordered road from zero to professional.
 *
 * WHY THIS FILE EXISTS
 *
 * Until now the curriculum was a set of six tier buckets, and a learner arriving
 * at /learn saw eleven lessons scattered across them with no answer to the only
 * question they actually have: "where do I start, and what comes next?" Six
 * half-empty buckets read as a shelf of loose chapters, not a course.
 *
 * So this file replaces the buckets with a SEQUENCE. There is exactly one path
 * through the material, it is numbered, and step N+1 never depends on something
 * taught at step N+40. Tiers still exist — they are how difficulty is priced and
 * how mastery decay is grouped — but the learner never has to think in them.
 *
 * WHAT MAKES IT A SYLLABUS RATHER THAN A LIST
 *
 * Every stage is titled with the plain-English QUESTION it answers, because a
 * beginner does not know they want "market microstructure"; they know they want
 * to know why their order filled at a worse price than the screen showed.
 *
 * HONESTY ABOUT WHAT IS BUILT
 *
 * Every concept in trading and the stock market that this course intends to
 * cover is listed here, in the order it should be learnt, whether or not the
 * lesson has been written. A topic with no `built: true` renders as a visible,
 * numbered gap rather than being quietly omitted — the alternative is a course
 * that looks complete because the missing parts are invisible.
 *
 * Validator rules C6 and C7 hold the two invariants: every shipped lesson
 * appears here exactly once, and no lesson's prerequisite sits later in the
 * sequence than the lesson itself.
 */
import type { Tier } from '@/lib/lesson/dsl';

export interface SyllabusTopic {
  /**
   * Stable slug. For a built topic this is the lesson id, exactly — that
   * identity is what lets the sequence be derived rather than maintained twice.
   */
  id: string;
  title: string;
  /** What the learner can do afterwards, in words a beginner already knows. */
  covers: string;
  /** Set once a lesson file for this topic is registered. */
  built?: boolean;
}

export interface SyllabusStage {
  id: string;
  /** The plain-English question this stage answers. */
  question: string;
  /** The short name, for the sidebar and the progress bar. */
  name: string;
  /** Everything in a stage shares a tier, so the sequence is tier-monotonic. */
  tier: Tier;
  /** One sentence on why this stage comes where it does. */
  why: string;
  topics: SyllabusTopic[];
}

export const SYLLABUS: SyllabusStage[] = [
  {
    id: 'stage-1',
    name: 'Ground floor',
    question: 'What am I actually buying, and who sells it to me?',
    tier: 'T0',
    why: 'Nothing later makes sense until you know what a share is and which company holds it for you.',
    topics: [
      {
        id: 'in-t0-what-is-a-share',
        title: 'What a share actually is',
        covers: 'Ownership, why a company sells part of itself, and what you own the day after you buy.',
        built: true,
      },
      {
        id: 'in-t0-who-does-what',
        title: 'Exchange, broker, depository — who does what',
        covers: 'Three different companies stand between you and a share. Knowing which one to blame is half of fixing a problem.',
        built: true,
      },
      {
        id: 'in-t0-order-book',
        title: 'Who is on the other side of your trade',
        covers: 'The order book, and why your buy needs somebody else to want to sell at that moment.',
        built: true,
      },
      {
        id: 'in-t0-settlement',
        title: 'Where the shares go after you buy',
        covers: 'Demat accounts, T+1 settlement, and why the money leaves before the shares arrive.',
        built: true,
      },
      {
        id: 'in-t0-what-moves-price',
        title: 'What actually moves a price',
        covers: 'Supply, demand, and why news you already read is usually already in the price.',
        built: true,
      },
      {
        id: 'in-t0-index',
        title: 'What an index is counting',
        covers: 'Nifty and Sensex as baskets, how weights work, and why "the market was up" can hide a bad day.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-2',
    name: 'Placing a trade',
    question: 'How do I buy something without getting a worse price than I expected?',
    tier: 'T1',
    why: 'The mechanics of a single order, and every rupee it costs, before any question of what to buy.',
    topics: [
      {
        id: 'in-t1-order-types',
        title: 'Four orders, one trade-off',
        covers: 'Market, limit, stop-loss and SL-M: do you need certainty of fill, or certainty of price?',
        built: true,
      },
      {
        id: 'in-t1-real-cost-of-a-trade',
        title: 'The real cost of a trade',
        covers: 'Every statutory charge, computed on your own numbers, and the break-even they force on you.',
        built: true,
      },
      {
        id: 'in-t1-contract-note',
        title: 'Reading your contract note',
        covers: 'The document your broker sends after every trade, line by line, so a wrong charge is visible.',
        built: true,
      },
      {
        id: 'in-t1-reading-candles',
        title: 'What a candle does and does not tell you',
        covers: 'Four numbers per bar, what they hide, and why the same candle means different things at different times.',
        built: true,
      },
      {
        id: 'in-t1-first-trade',
        title: 'One trade, end to end',
        covers: 'Idea to order to fill to exit to contract note, with every screen and every cost in sequence.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-3',
    name: 'Staying alive',
    question: 'How do I make sure one bad trade does not end this?',
    tier: 'T1',
    why: 'Survival is taught before selection, because a good idea at the wrong size still bankrupts you.',
    topics: [
      {
        id: 'in-t1-position-sizing',
        title: 'How many shares should I buy?',
        covers: 'Sizing from the distance to your stop, so the loss you accept is a number you chose.',
        built: true,
      },
      {
        id: 'in-t1-stops',
        title: 'Stops that survive contact with the market',
        covers: 'Where a stop belongs, why a stop is not a guaranteed price, and what a gap does to it.',
        built: true,
      },
      {
        id: 'in-t1-expectancy',
        title: 'Win rate is not the point',
        covers: 'Reward against risk, expectancy, and why a strategy that loses most of the time can still pay.',
        built: true,
      },
      {
        id: 'in-t1-journal',
        title: 'Writing down why, before you find out',
        covers: 'A trade journal that records the reasoning, so you can grade the decision separately from the result.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-4',
    name: 'Owning for years',
    question: 'What if I do not want to trade at all?',
    tier: 'T1',
    why: 'Most people are better served by holding than by trading, and they deserve to hear that early.',
    topics: [
      {
        id: 'in-t1-compounding',
        title: 'What compounding really does',
        covers: 'Time, rate and contribution pulled apart, with the fee drag shown against them.',
        built: true,
      },
      {
        id: 'in-t1-sip',
        title: 'Buying the same amount every month',
        covers: 'Rupee-cost averaging, what it does and does not protect you from, on real index history.',
        built: true,
      },
      {
        id: 'in-t1-index-vs-stock',
        title: 'One company or all of them',
        covers: 'Single-stock risk against index risk, and what diversification actually removes.',
        built: true,
      },
      {
        id: 'in-t1-dividends',
        title: 'Dividends, splits and bonuses',
        covers: 'What lands in your account, what only changes the arithmetic, and why the price drops on the ex-date.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-5',
    name: 'Reading a chart honestly',
    question: 'Do the patterns everyone draws actually predict anything?',
    tier: 'T2',
    why: 'Charts come after risk, and every claim about them is checked against a base rate before it is taught.',
    topics: [
      {
        id: 'in-t2-chart-types',
        title: 'Chart types, and what one bar actually contains',
        covers: 'Candlestick, OHLC bar, Heikin-Ashi, hollow candle and line charts on the same real data, and how much trading one bar compresses at each interval.',
        built: true,
      },
      {
        id: 'in-t2-trend',
        title: 'Trend, without hindsight',
        covers: 'Defining a trend by a rule you could have applied at the time, not one visible only afterwards.',
        built: true,
      },
      {
        id: 'in-t2-support-resistance',
        title: 'Levels are zones, and everyone can see them',
        covers: 'Why a level is a band rather than a line, and what happens when the whole market watches it.',
        built: true,
      },
      {
        id: 'in-t2-volume',
        title: 'What volume adds, and what it does not',
        covers: 'Volume as participation, the traps in comparing it across days, and delivery volume in India.',
        built: true,
      },
      {
        id: 'in-t2-does-this-pattern-work',
        title: 'Does this pattern actually work?',
        covers: 'Testing a named pattern against its own base rate, on real bars, before believing it.',
        built: true,
      },
      {
        id: 'in-t2-pattern-catalogue',
        title: 'The ten named patterns, all tested at once',
        covers: 'Engulfing, hammer, doji, gaps, inside bars, streaks — every pattern with a name, measured and ranked.',
        built: true,
      },
      {
        id: 'in-t2-indicators',
        title: 'Indicators and the lag you are paying for',
        covers: 'Moving averages, RSI and MACD as arithmetic on past prices — and what that arithmetic cannot know.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-5b',
    name: "The technician's toolkit",
    question: 'How do traders actually mark up a chart — and which of those markings mean anything?',
    tier: 'T2',
    why: 'Stage 5 already established the habit of testing a claim before believing it. This stage aims that same scepticism at the tools people draw by hand.',
    topics: [
      {
        id: 'in-t2-trendlines',
        title: 'Drawing a trendline that means something',
        covers: 'Two swing points always make a line. What a third touch adds, and why hindsight draws a better one than you did.',
        built: true,
      },
      {
        id: 'in-t2-fibonacci',
        title: 'Fibonacci retracement and extension',
        covers: 'Anchoring a grid on two points, why 50% is on the chart anyway, and what the levels are actually worth.',
        built: true,
      },
      {
        id: 'in-t2-reversal-chart-patterns',
        title: 'Head and shoulders, double tops and double bottoms',
        covers: 'The anatomy of the three named reversal shapes, the neckline, and the measured-move arithmetic behind the target.',
        built: true,
      },
      {
        id: 'in-t2-continuation-patterns',
        title: 'Triangles, flags and wedges: pauses, not reversals',
        covers: 'Shapes that say a trend is pausing rather than turning, and why the breakout direction is the only part that tells you anything.',
        built: true,
      },
      {
        id: 'in-t2-elliott-wave',
        title: 'Elliott wave: the count nobody can agree on',
        covers: 'The five-and-three wave framework, and why the same chart supports more than one defensible count at once.',
        built: true,
      },
      {
        id: 'in-t2-candlestick-patterns-2',
        title: 'Evening star, morning star, and the three-candle patterns',
        covers: 'The reversal patterns the ten-pattern catalogue left out, tested the same way: real bars, real base rates.',
        built: true,
      },
      {
        id: 'in-t2-fibonacci-confluence',
        title: 'When a candle or a chart shape lands on a Fibonacci level',
        covers: 'Confluence — why it draws more attention, why that is not the same as more certainty, and which retracement levels traders actually watch.',
        built: true,
      },
      {
        id: 'in-t2-vwap-volume-profile',
        title: 'VWAP and volume profile: where the day’s business actually happened',
        covers: 'VWAP as an execution benchmark rather than a signal, and volume sorted by price instead of by time.',
        built: true,
      },
      {
        id: 'in-t2-pivot-points',
        title: 'Pivot points: the levels every intraday desk starts the day with',
        covers: 'A fixed formula on yesterday’s OHLC, computed live, and why the whole grid is really just support and resistance wearing a formula.',
        built: true,
      },
      {
        id: 'in-t2-bollinger-bands',
        title: 'Bollinger Bands and the volatility squeeze',
        covers: 'A moving average with statistical rails, why the bands widen and narrow, and what a squeeze does and does not predict.',
        built: true,
      },
      {
        id: 'in-t2-rsi-divergence',
        title: 'RSI divergence: when price and momentum disagree',
        covers: 'Price making a new extreme while RSI does not, and why matching the two by eye is a judgement call like a chart shape.',
        built: true,
      },
      {
        id: 'in-t2-adx-trend-strength',
        title: 'ADX: telling a trend from a chop',
        covers: 'A number that measures how much a market is trending, without saying which direction — and why that pairs with the earlier trend lesson.',
        built: true,
      },
      {
        id: 'in-t2-choosing-the-right-tool',
        title: 'Which tool, for which job',
        covers: 'A working map of every technical tool in this stage — what each is actually for, when it applies, and why most of them reduce to marking a level.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-6',
    name: 'Reading a business',
    question: 'Is this company worth what it costs?',
    tier: 'T2',
    why: 'The other half of selection. A chart says what happened; the accounts say what the company did.',
    topics: [
      {
        id: 'in-t2-financials',
        title: 'The three statements, in plain words',
        covers: 'Profit and loss, balance sheet and cash flow, and the one question each is trying to answer.',
        built: true,
      },
      {
        id: 'in-t2-profit-vs-cash',
        title: 'Profit is an opinion, cash is a fact',
        covers: 'Why a profitable company can run out of money, and where in the accounts that shows up first.',
        built: true,
      },
      {
        id: 'in-t2-valuation',
        title: 'What a multiple is really saying',
        covers: 'P/E, P/B and EV/EBITDA as sentences about expectations, not as scores out of ten.',
        built: true,
      },
      {
        id: 'in-t2-screening',
        title: 'Screening without fooling yourself',
        covers: 'Building a filter, and the survivorship and look-ahead traps that make every screen look brilliant.',
        built: true,
      },
      {
        id: 'in-t2-sectors',
        title: 'Sectors, cycles and why comparisons break',
        covers: 'Why a bank and a software firm cannot be compared on the same ratios.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-6b',
    name: 'Reading a business like an analyst',
    question: 'A company looks fine on the surface. What would actually change your mind?',
    tier: 'T2',
    why: 'Stage 6 taught the three statements and a first valuation. This stage teaches the ratios analysts actually compute from them, and the specific things that make a good-looking number worth doubting.',
    topics: [
      {
        id: 'in-t2-return-ratios',
        title: 'Return on equity, capital and assets',
        covers: 'The ratios that measure how efficiently a company turns capital into profit, and how leverage can inflate the most-quoted one.',
        built: true,
      },
      {
        id: 'in-t2-debt-and-solvency',
        title: 'Debt, and when it actually becomes dangerous',
        covers: 'Debt-to-equity, interest coverage and the current ratio, and why the same number means different things in different businesses.',
        built: true,
      },
      {
        id: 'in-t2-quality-of-earnings',
        title: 'When profit is not what it looks like',
        covers: 'Reading the gap between profit and cash for warning signs, and the handful of red flags worth checking before anything else.',
        built: true,
      },
      {
        id: 'in-t2-moat',
        title: 'Does this business have a moat, and does it matter',
        covers: 'Pricing power, margin durability and why "hold for years" only makes sense for some companies.',
        built: true,
      },
      {
        id: 'in-t2-reading-annual-report',
        title: 'Reading an annual report, not a summary of one',
        covers: 'Where the real information actually sits — the auditor’s report, related-party note, and the cash flow statement read first.',
        built: true,
      },
      {
        id: 'in-t2-promoter-signals',
        title: 'Promoter and governance signals',
        covers: 'Pledged shares, promoter buying and selling, and what these India-specific signals do and do not prove.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-7',
    name: 'Your own head',
    question: 'Why do I keep doing the thing I promised myself I would not?',
    tier: 'T2',
    why: 'Placed after the first real decisions, because a bias you have already fallen for teaches more than one described in advance.',
    topics: [
      {
        id: 'in-t2-loss-aversion',
        title: 'Why you sell the winners and keep the losers',
        covers: 'The disposition effect, demonstrated on your own choices before it is named.',
        built: true,
      },
      {
        id: 'in-t2-anchoring',
        title: 'The price you paid is not information',
        covers: 'Anchoring and framing, and why your entry price is invisible to everybody else.',
        built: true,
      },
      {
        id: 'in-t2-overtrading',
        title: 'The cost of needing to be in a trade',
        covers: 'Activity against edge, and what the cost engine says about trading twice as often.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-8',
    name: 'Leverage and derivatives',
    question: 'How do futures and options work, and why do they end so many accounts?',
    tier: 'T3',
    why: 'Borrowed money and time-limited contracts, taught only after sizing and stops are automatic — and built up from what a contract IS, not from a strategy name.',
    topics: [
      {
        id: 'in-t3-margin',
        title: 'What margin actually lends you',
        covers: 'Leverage, margin calls, and the arithmetic of a position larger than your account.',
        built: true,
      },
      // The A-B-C of derivatives. Everything after this stage used to assume a
      // reader who already knew what a contract on a share was — which is the
      // one assumption a course starting from zero is not allowed to make.
      {
        id: 'in-t3-what-is-a-derivative',
        title: 'A contract about a share is not a share',
        covers: 'What a derivative is, in plain words, and the one question that separates a future from an option.',
        built: true,
      },
      {
        id: 'in-t3-futures',
        title: 'Futures: an agreement to trade later',
        covers: 'Both sides obliged, lot sizes, why the futures price differs from the share, and what rolling costs.',
        built: true,
      },
      {
        id: 'in-t3-call-and-put',
        title: 'Calls and puts, from scratch',
        covers: 'The right to buy and the right to sell, the strike price, the premium, and who is on the other side.',
        built: true,
      },
      {
        id: 'in-t3-strike-prices',
        title: 'Which strikes exist, and why',
        covers: 'How the exchange lists strikes, the intervals it uses, and what in, at and out of the money mean.',
        built: true,
      },
      {
        id: 'in-t3-options-from-first-principles',
        title: 'An option is a bet with a clock on it',
        covers: 'What you are actually paying for: intrinsic value, time value, and why being right is not enough.',
        built: true,
      },
      {
        id: 'in-t3-greeks',
        title: 'The greeks you can feel',
        covers: 'Delta, theta, vega and gamma as things that move on a chart you drag, not as formulas.',
        built: true,
      },
      {
        id: 'in-t3-vix',
        title: 'India VIX: what the market expects',
        covers: 'What the volatility index measures, what it can and cannot tell you, and how to read it honestly.',
        built: true,
      },
      {
        id: 'in-t3-iv',
        title: 'Implied volatility and the crush',
        covers: 'What the market is paying for uncertainty, and why being right on direction can still lose.',
        built: true,
      },
      {
        id: 'in-t3-spreads',
        title: 'Combining legs into a shape',
        covers: 'Spreads and combinations as payoff shapes, and what each one costs to be wrong about.',
        built: true,
      },
      {
        id: 'in-t3-expiry',
        title: 'Expiry-day mechanics',
        covers: 'Settlement prices, pin risk, and how an option that looked worthless becomes an obligation.',
        built: true,
      },
      {
        id: 'in-t3-hedging',
        title: 'Paying to reduce a risk',
        covers: 'Hedging a holding, what the protection costs, and when the cost is not worth it.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-9',
    name: 'Thinking like a professional',
    question: 'How do people who do this for a living decide anything?',
    tier: 'T4',
    why: 'Portfolio-level thinking, where the unit of analysis stops being the trade.',
    topics: [
      {
        id: 'in-t4-risk-of-ruin',
        title: 'Why a good strategy still goes broke',
        covers: 'Risk of ruin: the same positive edge, bankrupt at one bet size and compounding at another.',
        built: true,
      },
      {
        id: 'in-t4-kelly',
        title: 'Kelly, and why nobody sane uses all of it',
        covers: 'The growth-optimal fraction, and the drawdown that makes half of it the practical answer.',
        built: true,
      },
      {
        id: 'in-t4-backtest-pitfalls',
        title: 'Why your backtest is lying to you',
        covers: 'Look-ahead, survivorship and overfitting, each demonstrated on a test you run yourself.',
        built: true,
      },
      {
        id: 'in-t4-microstructure',
        title: 'What happens inside the millisecond',
        covers: 'Queue position, spread capture, and where the cost of impatience actually goes.',
        built: true,
      },
      {
        id: 'in-t4-portfolio',
        title: 'Building a portfolio, not a pile of trades',
        covers: 'Position limits, sizing across correlated names, and the risk you cannot see one trade at a time.',
        built: true,
      },
      {
        id: 'in-t4-correlation',
        title: 'Correlation goes to one exactly when it matters',
        covers: 'Why diversification thins out in a crash, shown on real drawdown history.',
        built: true,
      },
      {
        id: 'in-t4-algo',
        title: 'Rules a computer can follow',
        covers: 'Turning a discretionary idea into a specification precise enough to test, and what that reveals.',
        built: true,
      },
      {
        id: 'in-t4-tax',
        title: 'Indian capital-gains tax, honestly',
        covers: 'Short and long term, speculative against non-speculative, and set-off rules that change what you keep.',
        built: true,
      },
    ],
  },
  {
    id: 'stage-10',
    name: 'The things that end accounts',
    question: 'What is going to happen that nobody warned me about?',
    tier: 'T5',
    why: 'Edge cases last, because each one only makes sense once the normal case is second nature.',
    topics: [
      {
        id: 'in-t5-circuit-lock',
        title: 'The upper circuit you cannot sell into',
        covers: 'Price bands, locked circuits, and a position you legally hold but practically cannot exit.',
        built: true,
      },
      {
        id: 'in-t5-physical-settlement',
        title: 'The ₹2,000 option that owes ₹3,37,500',
        covers: 'Physical settlement of stock derivatives on expiry, and the obligation nobody reads about first.',
        built: true,
      },
      {
        id: 'in-t5-short-delivery',
        title: 'Short delivery and the auction',
        covers: 'What happens when the seller does not deliver, and who pays the penalty.',
        built: true,
      },
      {
        id: 'in-t5-freeze-quantity',
        title: 'Order too big to place',
        covers: 'Freeze quantity limits, and splitting an order without moving the price against yourself.',
        built: true,
      },
      {
        id: 'in-t5-surveillance',
        title: 'ASM, GSM and the surveillance ladder',
        covers: 'What happens to a stock under surveillance, and why margin and trading rules change overnight.',
        built: true,
      },
      {
        id: 'in-t5-corporate-actions',
        title: 'When a corporate action rewrites your contract',
        covers: 'Strike and lot adjustments for splits, bonuses and rights, and the arithmetic that keeps value flat.',
        built: true,
      },
      {
        id: 'in-t5-freak-trades',
        title: 'Freak trades in illiquid options',
        covers: 'A market order into an empty book, and the trade that prints far away from any sensible price.',
        built: true,
      },
      {
        id: 'in-t5-mtf',
        title: 'Margin trading facility, and what it can force',
        covers: 'Borrowing from your broker to hold shares, and the liquidation nobody asks your permission for.',
        built: true,
      },
      {
        id: 'in-t5-pledge',
        title: 'Pledging shares and the haircut',
        covers: 'Turning holdings into collateral, the haircut applied, and the cash component still required.',
        built: true,
      },
      {
        id: 'in-t5-slb',
        title: 'Lending and borrowing stock',
        covers: 'How a share is borrowed to be sold short, and what a recall does to that position.',
        built: true,
      },
      {
        id: 'in-t5-gaps',
        title: 'The weekend that skipped your stop',
        covers: 'Gap risk over closed sessions, and why a stop is an instruction rather than a promise.',
        built: true,
      },
      {
        id: 'in-t5-liquidity',
        title: 'When the buyers simply leave',
        covers: 'Liquidity evaporating in a fast market, and what that does to every exit at once.',
        built: true,
      },
    ],
  },
];

/** Every topic in the one true order, flattened, with its stage attached. */
export interface SequencedTopic extends SyllabusTopic {
  /** 1-based position in the whole course. This is the number the learner sees. */
  step: number;
  stage: SyllabusStage;
}

export const SEQUENCE: SequencedTopic[] = SYLLABUS.flatMap((stage) =>
  stage.topics.map((t) => ({ ...t, stage, step: 0 })),
).map((t, i) => ({ ...t, step: i + 1 }));

export const SEQUENCE_BY_ID = new Map(SEQUENCE.map((t) => [t.id, t]));

export const TOTAL_TOPICS = SEQUENCE.length;
export const BUILT_TOPICS = SEQUENCE.filter((t) => t.built).length;

/** Position in the course, or null for an id the syllabus does not know. */
export function stepOf(topicId: string): number | null {
  return SEQUENCE_BY_ID.get(topicId)?.step ?? null;
}

/**
 * The next BUILT topic after this one, which is what a "continue" button needs.
 *
 * Deliberately skips unbuilt topics rather than stopping at them: a learner
 * should never hit a dead end because step 12 has not been written yet. The gap
 * is still shown on the map — it is just not allowed to block the road.
 */
export function nextBuilt(topicId: string): SequencedTopic | null {
  const here = SEQUENCE_BY_ID.get(topicId);
  if (!here) return null;
  return SEQUENCE.find((t) => t.step > here.step && t.built) ?? null;
}

export function previousBuilt(topicId: string): SequencedTopic | null {
  const here = SEQUENCE_BY_ID.get(topicId);
  if (!here) return null;
  for (let i = here.step - 2; i >= 0; i--) if (SEQUENCE[i].built) return SEQUENCE[i];
  return null;
}

/**
 * Where a learner should go next, given what they have finished.
 *
 * The rule is the simplest one that is never wrong: the earliest built topic
 * they have not completed. No cleverness, no recommendation engine — the course
 * is already in the right order, so "the next one" is the right answer.
 */
export function resumeAt(completed: ReadonlySet<string>): SequencedTopic | null {
  return SEQUENCE.find((t) => t.built && !completed.has(t.id)) ?? null;
}
