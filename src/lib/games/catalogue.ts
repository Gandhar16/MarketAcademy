/**
 * The game catalogue — one place that knows what every game is and does.
 *
 * Both `/play` and `/play/[game]` read this, so a game can never appear in the
 * index without a page or vice versa. The `skill` line is the promise each game
 * makes: one specific, measurable thing it trains.
 */
export interface GameEntry {
  slug: string;
  name: string;
  skill: string;
  /** One-line description for the index card. */
  blurb: string;
  /** Longer framing shown above the game itself, including any honesty caveats. */
  intro: string;
  /** True where the game runs on a model rather than market data. */
  modelled?: boolean;
}

export const GAME_CATALOGUE: GameEntry[] = [
  {
    slug: 'chart-replay',
    name: 'Chart Replay',
    skill: 'Decision-making without hindsight',
    blurb:
      'Real historical bars, one at a time, symbol and dates hidden. You must write a thesis and set a stop before you can enter. The engine cannot read ahead.',
    intro:
      'Real daily bars from a real Indian stock, streamed from the server one at a time. The symbol and the dates are hidden so you cannot recall the outcome, and the future bars are never sent to your browser — there is nothing to peek at.',
  },
  {
    slug: 'order-gauntlet',
    name: 'Order Gauntlet',
    skill: 'Order-type selection under pressure',
    blurb:
      'Timed scenarios. Pick market, limit, SL or SL-M — and every wrong choice shows what it would actually have cost.',
    intro:
      'Six situations, each on a clock. There is only one question behind all of them: do you need certainty of FILL or certainty of PRICE? Running out of time counts as a wrong answer, because hesitating is a decision too.',
  },
  {
    slug: 'cost-cutter',
    name: 'Cost Cutter',
    skill: 'Cost drag awareness',
    blurb: 'Same idea, four levers. Get your annual cost under 1% of capital and find out which lever actually moved it.',
    intro:
      'Real Indian statutory charges as of August 2026, computed by the same engine the simulator fills against. Find the lever that actually matters — most people reach for the wrong one first.',
  },
  {
    slug: 'risk-roulette',
    name: 'Risk Roulette',
    skill: 'Position sizing and risk of ruin',
    blurb: 'A fixed, genuinely positive edge. The only variable is bet size. Watch a good strategy bankrupt itself.',
    intro:
      'Your edge is fixed and positive. The only variable is how much you bet. These are modelled draws with your stated edge, not market data — the point is the mathematics of sizing, which is identical either way.',
    modelled: true,
  },
  {
    slug: 'payoff-builder',
    name: 'Payoff Builder',
    skill: 'Options structures from first principles',
    blurb: 'Build four named structures from legs. Graded on the SHAPE, so any equivalent construction passes.',
    intro:
      'Four target payoffs, built from calls and puts you add yourself. Grading compares your curve against the target at sampled prices rather than checking a recipe — a bull call spread and a bull put spread have the same shape, and building the other one means you understood more, not less.',
    modelled: true,
  },
  {
    slug: 'circuit-breaker',
    name: 'Circuit Breaker',
    skill: 'Edge-case survival',
    blurb: 'A scripted crash. Gaps, a market-wide halt, and a lower circuit that locks your exit. Get out alive.',
    intro:
      'A limit-down session played out beat by beat, using the same circuit-breaker and price-band rules as the rest of the app. The lesson is that some actions are simply not available — no amount of chart study prepares you for a book with nobody on the other side.',
  },
  {
    slug: 'earnings-roulette',
    name: 'Earnings Roulette',
    skill: 'IV crush',
    blurb: 'Buy the straddle before results. Get the direction right. Lose money anyway.',
    intro:
      'Priced with Black–Scholes throughout, so the loss is a consequence of the model rather than a scripted punchline. Outcomes are drawn from a distribution shaped so most results move the stock less than the market priced in — which is what the historical record shows.',
    modelled: true,
  },
  {
    slug: 'bias-buster',
    name: 'Bias Buster',
    skill: 'Behavioural traps',
    blurb: 'Framing, anchoring, disposition effect, sunk cost. You fall for it, then it is explained.',
    intro:
      'Six questions. You must answer before anything is revealed, and the app then tells you whether you picked the answer most people pick. Reading a list of cognitive biases changes nothing; watching yourself fall for one — having been warned this is a bias test — is what makes it land.',
  },
  {
    slug: 'candle-sprint',
    name: 'Candle Sprint',
    skill: 'Pattern recognition, then the honest hit rate',
    blurb: 'Identify patterns fast on real bars — then find out what they were actually worth.',
    intro:
      'Ten charts of real daily bars, identified against the clock. The second half is the point: the debrief tells you what each pattern you spotted was actually worth on that symbol’s history, which is usually nothing.',
  },
  {
    slug: 'the-long-game',
    name: 'The Long Game',
    skill: 'Compounding and sequence risk',
    blurb: 'Twenty years of real NIFTY returns, inflation-adjusted, with fees — and the order of returns reversed.',
    intro:
      'Real NIFTY 50 calendar-year returns from 2005 to 2024, including the 52% fall of 2008. Four things almost nobody has seen a chart of: what inflation does to a big number, what a 1% fee costs over twenty years, why the average return is not the return you get, and why the ORDER of returns matters once you are contributing.',
  },
  {
    slug: 'margin-call',
    name: 'Margin Call',
    skill: 'Leverage and forced liquidation',
    blurb:
      'Real historical bars, a leveraged long, and a margin-call line drawn on the chart from the moment you enter. Cross it and the exchange closes you out at its price, not yours.',
    intro:
      'Real daily bars from a real Indian stock, streamed one at a time exactly like Chart Replay — future hidden, nothing to peek at. What is new is the leverage: pick 2x, 5x or 10x, and the margin-call line moves with it. The lesson is not that leverage is risky as a sentence; it is watching a bar cross a line you could see the whole time and getting force-closed at a worse price than you would have chosen.',
  },
  {
    slug: 'expiry-day',
    name: 'Expiry Day',
    skill: 'Assignment risk and physical settlement',
    blurb:
      "Buy an at-the-money call. Close it whenever you like — or don't, and find out what a contract you forgot about does to you on expiry.",
    intro:
      'A modelled options position on a compressed, real countdown to the close. Pick a cash-settled (index-style) or physically-settled (single-stock-style) contract before you buy: the cash-settled version just pays the difference if it expires in the money, the physical one hands you a bill for the full strike value of the shares — "the modern account-killer", and it only bites the position that was right and then forgotten.',
    modelled: true,
  },
  {
    slug: 'edge-or-luck',
    name: 'Edge or Luck',
    skill: 'Telling a real record from a run of good fortune',
    blurb:
      'Six track records, each with a confident story attached. Decide which ones prove anything — then find out that three of them were coin flips, and that one of the real edges could not be proved either.',
    intro:
      'Every record here was generated by a computer, so the truth about each one is known exactly rather than argued about. Some are literal coin flips, some contain a genuine edge, and one is a coin paying full Indian trading costs on every round trip. Your job is not to guess which made money — you can see that — but to say whether there is enough evidence to conclude anything. For most real track records the honest answer is no, and that is the answer this game is about. At the end it runs the same test on your own filed runs.',
    modelled: true,
  },
];

export const GAMES_BY_SLUG = new Map(GAME_CATALOGUE.map((g) => [g.slug, g]));

/**
 * Games whose process score genuinely measures TRADE discipline —
 * pre-commitment, a stop that was honoured or wasn't, sizing from that stop,
 * a planned reward-to-risk — because they are the games that actually have
 * those concepts: a real entry, a real stop, a real exit.
 *
 * This is what `user_stats.process_score` (the number the global
 * `/leaderboard` reads) is averaged over — see `refreshProcessScore` in
 * lib/db/progress.ts. Every other game still files a run, still earns XP,
 * and still has its own per-game leaderboard (`gameLeaderboard`, unaffected
 * by this list — it ranks each game against itself). What it does not get
 * to do is move a global score that measures a kind of discipline it was
 * never testing: a quiz game scoring near-zero on "stop honoured" — because
 * it has no stop — would otherwise drag down the discipline score of
 * someone who trades Chart Replay carefully and also likes Order Gauntlet.
 */
export const TRADE_DISCIPLINE_GAMES: readonly string[] = ['chart-replay', 'circuit-breaker', 'margin-call', 'expiry-day'];
