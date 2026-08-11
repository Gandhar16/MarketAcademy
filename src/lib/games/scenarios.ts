/**
 * Scenario data for the judgement games.
 *
 * Kept out of the components so the scenarios are testable, reviewable, and
 * countable. Every scenario states the situation, the options, the correct
 * choice, and — the part that does the teaching — what the wrong choice would
 * actually have cost.
 */
import type { OrderType } from '../engine/order';

// ── Order Gauntlet ──────────────────────────────────────────────────────────

export interface GauntletScenario {
  id: string;
  /** The situation, written as it would actually feel. */
  situation: string;
  /** Seconds allowed. Time pressure is the point — real decisions are not leisurely. */
  seconds: number;
  correct: OrderType;
  /** Why the right answer is right. */
  reasoning: string;
  /** What each wrong answer costs, keyed by order type. */
  costs: Partial<Record<OrderType, string>>;
}

export const GAUNTLET_SCENARIOS: GauntletScenario[] = [
  {
    id: 'thin-book-entry',
    situation:
      'You want to buy 200 shares of a small-cap. Only 25 shares rest at the offer and the spread is 8 ticks wide. You are not in a hurry.',
    seconds: 20,
    correct: 'LIMIT',
    reasoning:
      'A limit order lets sellers come to you. With 25 shares at the touch, anything else walks the book and pays the spread eight times over.',
    costs: {
      MARKET: 'Your order eats eight levels. On a ₹48,000 position that is roughly ₹400 gone before the trade has done anything.',
      SL: 'A stop-limit is an ENTRY you have not triggered yet — wrong tool entirely, and it needs a trigger price you have no reason to set.',
      'SL-M': 'Same problem: stop orders are for exits or breakouts, not for patient entries.',
    },
  },
  {
    id: 'protective-stop',
    situation:
      'You are long from ₹1,400. You want out if it drops to ₹1,350, and you care more about GETTING OUT than about the exact price.',
    seconds: 15,
    correct: 'SL-M',
    reasoning:
      'SL-M becomes a market order when triggered. You will be filled — possibly badly on a gap, but filled. That is the trade-off you just said you wanted.',
    costs: {
      SL: 'A stop-LIMIT can trigger and then fail to fill. On a gap down to ₹1,200 your ₹1,345 limit never trades and you are still long, now 14% underwater.',
      MARKET: 'A market order sells immediately at ₹1,400. You have just exited a position you wanted to keep.',
      LIMIT: 'A sell limit below the market fills instantly at the market price — same mistake, dressed differently.',
    },
  },
  {
    id: 'breakout-entry',
    situation:
      'A stock is consolidating at ₹880. You only want to be long if it breaks ₹900, and you do not want to watch the screen.',
    seconds: 20,
    correct: 'SL-M',
    reasoning:
      'A BUY stop above the market. It sits dormant and becomes a market order only if ₹900 trades — which is exactly the condition you described.',
    costs: {
      LIMIT: 'A buy limit at ₹900 fills immediately, because ₹900 is above the market. You are long at ₹880 in a stock that has not broken out.',
      MARKET: 'You are long right now at ₹880, having explicitly said you did not want to be.',
      SL: 'Workable, but the limit can miss the very fast move you were trying to catch — breakouts are exactly when limits get skipped.',
    },
  },
  {
    id: 'liquid-urgent',
    situation:
      'News has just hit. You are long a large-cap with 4,000 shares at the touch and you want out NOW, at any reasonable price.',
    seconds: 10,
    correct: 'MARKET',
    reasoning:
      'Deep book, urgent exit, and you have explicitly accepted the price. This is the case market orders exist for, and hesitating costs more than the spread.',
    costs: {
      LIMIT: 'In a fast market your limit sits unfilled while the price runs away from it. You optimised a few paise and kept the risk.',
      SL: 'A stop below the market is a delay you did not need — you already want out at the current price.',
      'SL-M': 'Same delay. A trigger is for a condition you are waiting on; you are not waiting.',
    },
  },
  {
    id: 'target-exit',
    situation:
      'You are long at ₹520 and want to take profit at ₹560, but only at ₹560 or better. You are happy to wait, and happy not to fill.',
    seconds: 15,
    correct: 'LIMIT',
    reasoning:
      'A sell limit above the market rests until someone pays your price. Certain price, uncertain fill — which is precisely what you asked for.',
    costs: {
      MARKET: 'Sells at ₹520 right now, giving up the entire ₹40 you were waiting for.',
      'SL-M': 'A sell stop at ₹560 is above the market, so the exchange rejects it — and if it did work it would be a breakout trigger, not a target.',
      SL: 'Same rejection. Stops for sells go BELOW the market; targets go above.',
    },
  },
  {
    id: 'illiquid-stop',
    situation:
      'You hold an illiquid stock where the book is 8 ticks wide. You want a protective exit but a market order here would cost you 1.5%.',
    seconds: 25,
    correct: 'SL',
    reasoning:
      'A stop-LIMIT caps the damage of a wide spread. You accept the risk of not filling because in this name an SL-M could fill catastrophically far from your trigger.',
    costs: {
      'SL-M': 'Triggers into a book with nothing in it and fills wherever the first bid happens to be — which in an illiquid name can be several percent away.',
      MARKET: 'Exits right now at the far side of a wide spread, taking the loss you were trying to protect against.',
      LIMIT: 'A resting limit is not a stop. It offers no protection if the price falls; it just sits there.',
    },
  },
];

// ── Bias Buster ─────────────────────────────────────────────────────────────

export interface BiasScenario {
  id: string;
  bias: string;
  /** The question, framed so the learner falls into it. */
  prompt: string;
  options: string[];
  /** The answer most people give — not necessarily wrong, but revealing. */
  trapIndex: number;
  /** The defensible answer. */
  correctIndex: number;
  reveal: string;
}

export const BIAS_SCENARIOS: BiasScenario[] = [
  {
    id: 'disposition',
    bias: 'Disposition effect',
    prompt:
      'You hold two positions. A is up 20%, B is down 20%. You need to raise cash and must sell one. Which do you sell?',
    options: ['Sell A — lock in the gain', 'Sell B — cut the loser', 'Whichever has the weaker outlook from here'],
    trapIndex: 0,
    correctIndex: 2,
    reveal:
      'Most people sell the winner. It feels like prudence and it is actually the disposition effect: we realise gains to feel competent and defer losses to avoid admitting we were wrong. Your purchase price is information about YOUR PAST, not about either company’s future — the market has never heard of it. The only defensible criterion is which position has the worse outlook from today’s price. In India there is even a tax argument for the opposite of the instinct: realising the loss can offset gains elsewhere.',
  },
  {
    id: 'anchoring',
    bias: 'Anchoring',
    prompt:
      'A stock fell from ₹1,000 to ₹600. Analysts now value it at ₹550. Is ₹600 cheap?',
    options: ['Yes — it is 40% off its high', 'No — it is above the ₹550 valuation', 'Impossible to say'],
    trapIndex: 0,
    correctIndex: 1,
    reveal:
      'The ₹1,000 is an anchor and it is doing all the work in the first answer. "40% off its high" describes the past; it says nothing about value. The stock is trading ABOVE the estimate of what it is worth, which makes it expensive, not cheap. Anchoring is why falling stocks attract buyers on the way down and why "it can’t go much lower" is such a reliable prelude to it going much lower.',
  },
  {
    id: 'framing',
    bias: 'Framing',
    prompt:
      'A strategy has a 90% chance of making ₹5,000 and a 10% chance of losing ₹60,000. Would you take it?',
    options: ['Yes — 90% win rate', 'No', 'Need more information'],
    trapIndex: 0,
    correctIndex: 1,
    reveal:
      'No. Expectancy is 0.9 × 5,000 − 0.1 × 60,000 = −₹1,500 per trade. The 90% win rate is doing the persuading and it is irrelevant on its own — win rate without payoff ratio is a marketing number. This is the exact shape of a naked short options position, which is why those strategies feel wonderful for months and then remove a year of profits in one session.',
  },
  {
    id: 'recency',
    bias: 'Recency',
    prompt:
      'A fund has beaten the index for three straight years. How much does that tell you about next year?',
    options: ['A great deal — clear skill', 'Very little', 'Nothing at all'],
    trapIndex: 0,
    correctIndex: 1,
    reveal:
      'Very little. With a few thousand funds competing, several hundred will beat the index three years running by chance alone — that is arithmetic, not cynicism. Three years is far too short to separate skill from luck in an activity this noisy; the research generally wants a decade or more. "Very little" rather than "nothing at all", because past performance is weak evidence rather than no evidence — it is just nowhere near as strong as the marketing implies.',
  },
  {
    id: 'sunk-cost',
    bias: 'Sunk cost',
    prompt:
      'You have held a position for 8 months and it is down 30%. Your original thesis has been disproven. What now?',
    options: ['Hold — it will come back', 'Average down to reduce the cost', 'Exit; the reason for holding is gone'],
    trapIndex: 0,
    correctIndex: 2,
    reveal:
      'Exit. The eight months and the 30% are sunk — no decision you make today can retrieve them, so they should carry zero weight. The only live question is whether you would buy this position at today’s price with today’s information, and you have just said the thesis is disproven. Averaging down is the most expensive answer: it adds money to a position you have already concluded you were wrong about, and it is how a manageable loss becomes the one that defines your year.',
  },
  {
    id: 'outcome-bias',
    bias: 'Outcome bias',
    prompt:
      'You risked 40% of your account on one trade with no stop. It made ₹80,000. How would you rate the decision?',
    options: ['Excellent — it worked', 'Poor, despite the outcome', 'Good, but got lucky'],
    trapIndex: 0,
    correctIndex: 1,
    reveal:
      'Poor. A good decision is one that was correct given what you knew when you made it, and risking 40% with no stop is indefensible regardless of what happened next. This is the bias the entire process score in this app exists to counteract: rewarding the outcome teaches your brain to repeat the behaviour, and the behaviour has a fat tail that has not shown up yet. "Good, but got lucky" is the seductive middle answer and it is still wrong — it was not good, it was lucky.',
  },
];
