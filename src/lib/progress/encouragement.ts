/**
 * What we say to someone who earned nothing.
 *
 * WHY THIS IS NOT A CONSTANT STRING
 *
 * A learner will stop out five times in an evening. The fifth time they read
 * the same sentence, it stops being encouragement and becomes the site being
 * smug at them — a canned line repeated is worse than silence, because it
 * proves nobody is listening. So there are pools, and the message varies.
 *
 * WHY IT IS NOT `Math.random()`
 *
 * The message is stored on the run and shown again whenever that run is read
 * back. A random pick would give the same run a different message every time
 * the page loaded, which reads as a bug. Instead the pick is a hash of the run
 * id: stable for one run, varied across runs, and reproducible in a test.
 *
 * WHAT THE MESSAGES MAY AND MAY NOT SAY
 *
 * They may say the decision was sound. They may not say the loss was bad luck,
 * predict a future result, or imply the next one will go better — that is
 * gambler's talk and it is exactly the voice this site exists to argue with.
 * A stop that was hit and honoured is the system working, and the messages say
 * so plainly rather than consoling anybody about it.
 */

export type Mood =
  /** Gates passed, the stop was hit and honoured. The most common good loss. */
  | 'stopped-out'
  /** Gates passed, the run lost money some other way. */
  | 'lost'
  /** The plan itself did not clear the bar — reason, reward-to-risk or process. */
  | 'gates-failed'
  /** Oversized risk or an abandoned stop. Said kindly, but said. */
  | 'gambled'
  /** No trades taken. */
  | 'flat';

const POOLS: Record<Mood, string[]> = {
  'stopped-out': [
    'Your stop did its job and you let it. That is the single hardest habit in this and you already have it.',
    'Stopped out, exactly as planned. A loss you decided the size of in advance is not a mistake — it is the price of finding out.',
    'You said where you would be wrong, and then you acted like you meant it. Most people move the line instead.',
    'That is what a stop is for. The trade did not work; the process did.',
    'Small, planned, and over. Every trader who lasts has thousands of these behind them.',
    'You took the loss on your own terms rather than on the market’s. Keep doing exactly that.',
    'Honouring a stop feels like losing twice. It is the thing that keeps you here for the trade that works.',
  ],
  lost: [
    'Down on this one, and the plan behind it held. Judge the decision, not the result — they are not the same thing.',
    'A losing run with a real plan behind it is worth more than a winning one without. Read your own reasoning back and see if you still agree with it.',
    'The market did not cooperate. That happens to every strategy that has ever worked.',
    'Not this time. The useful question is not "why did it lose" but "would I take it again knowing only what I knew then".',
    'You lost money and learned something, which is the cheaper of the two ways to learn it.',
    'Losses are the tuition. The only bad ones are the ones you cannot explain.',
  ],
  'gates-failed': [
    'The plan did not quite clear the bar this time. Tighten one thing — usually the target — and go again.',
    'Close. Look at which gate failed below: it is nearly always the reward-to-risk, and it is the easiest one to fix before you enter.',
    'No XP, but nothing here is wasted. The gates are a checklist, not a verdict on you.',
    'The trade may well have been reasonable. What was missing was the part that lets anybody else tell.',
    'Worth another run. Decide the target at the same moment as the stop and most of this fixes itself.',
  ],
  gambled: [
    'That was a bet, not a trade — and it would have been a bet even if it had paid. Halve the size and try the same idea again.',
    'Oversized risk or a stop that moved. Everything else you did may have been fine; this one thing overrides it.',
    'The account survives position size, not opinions. Bring the risk down and the rest of your process gets a chance to show.',
    'No XP for this one. Not because it lost — because it could not have taught you anything either way.',
    'Move the size, keep the idea. The thinking might have been good; the exposure was not.',
  ],
  flat: [
    'You stayed out. That is a real decision and it costs nothing, which is more than can be said for most of the alternatives.',
    'No trade is a position. Sitting on your hands when nothing is there is a skill, and a rare one.',
    'Nothing taken, nothing lost. Come back when there is something worth a stop.',
  ],
};

/**
 * FNV-1a. Chosen because it is four lines, dependency-free, and deterministic
 * across platforms — the only properties that matter for picking an index.
 */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Picks the message for a run.
 *
 * `seed` should be the run id, so the same run always shows the same words and
 * two runs a second apart show different ones.
 */
export function encouragement(mood: Mood, seed: string): string {
  const pool = POOLS[mood];
  return pool[hash(seed) % pool.length];
}

/** Exported so a test can assert every pool is non-empty and none repeats. */
export const ENCOURAGEMENT_POOLS = POOLS;
