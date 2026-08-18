/**
 * A second everyday comparison for each concept, from a different walk of life.
 *
 * WHY TWO
 *
 * One analogy always excludes somebody. `analogies.ts` leans on physical,
 * long-standing commerce — a property sale, a vegetable market, eggs by the
 * dozen, the barber you keep going back to. Those are the comparisons with the
 * longest reach in India, and they are the right first choice.
 *
 * But SEBI's own numbers say **43% of F&O traders are under 30** and **72% are
 * from beyond the top thirty cities**, which is not two audiences but one
 * overlapping crowd. A 22-year-old in Nagpur has never sat through a property
 * registration and uses UPI six times a day. Somebody who has run a shop for
 * twenty years has never paid for a refundable flight. Offering both is
 * cheaper than guessing which one is reading.
 *
 * So each entry here is deliberately from the app-era everyday — delivery fees,
 * refundable bookings, gold loans, minimum order values, free trials nobody
 * cancelled — and each is paired with, never a restatement of, the one in
 * `analogies.ts`. If the two ever collapse into the same comparison, the pair
 * has stopped doing its job and a test says so.
 *
 * THE SAME THREE RULES APPLY
 *
 * Nothing here is load-bearing; simplify but never falsify; no jargon. See the
 * header of `analogies.ts` for the argument. The break in the comparison is
 * named inside the analogy itself, for the same reason.
 *
 * WHY THIS IS A SEPARATE FILE RATHER THAN A SECOND FIELD
 *
 * `analogies.ts` is imported by `glossary.ts`, which three client components
 * import, so everything in it is downloaded on every route including /login and
 * /pricing. These are read only by `explainers.ts`, which is server-side, and
 * reach the browser as the props of the one explainer being watched. Keeping
 * them out of that import graph is the whole reason for the extra file.
 */
export const SECOND_ANALOGIES: Record<string, string> = {
  // ------------------------------------------------------------------ basics
  share:
    'You and four friends buy a second-hand car together and put it on a rental app. Each of you owns a fifth of what it earns and a fifth of the repair bill. None of you gets to decide alone where it drives, and none of you can take a wheel home.',
  'secondary-market':
    'Buying a used phone from someone on a resale app. The company that made it gets nothing from that sale — the money goes to the person who is done with it. Almost every phone changing hands today is this kind of sale, not a fresh one from a shop.',
  spread:
    'The gap between what a resale app offers you for your phone and what it lists the same phone for an hour later. Sell and immediately buy it back and you are down that gap, and nobody puts it on a bill.',
  'clearing-corporation':
    'Paying for something on a marketplace app: your money sits with the app, not the seller, until the parcel is confirmed delivered. Neither side has to trust the other — only the thing in the middle, which is why it has to be boring and well funded.',

  // ------------------------------------------------------------------- costs
  stt: 'The convenience fee on a booking app. It is charged because a booking happened, not because you enjoyed the film — you pay it in full on the show you walked out of twenty minutes in.',
  brokerage:
    'The delivery fee on a food app. It is the line on the bill that changes if you switch apps, while the taxes underneath it do not — which is why it is the only one worth shopping around for.',
  breakeven:
    'How many rides a month before the ₹199 pass beats paying per ride. Below that number you bought the pass for nothing, however good the discount looked.',

  // ----------------------------------------------------------------- options
  option:
    'A refundable booking on a travel app. You pay a little extra now for the right to change your mind later. Walk away and you lose the fee, not the fare — and if the price doubles, you still travel at the rate you locked.',
  'time-value':
    'The refundable part of that same booking, shrinking as the date gets closer. A month out, changing your mind costs almost nothing. The night before, the option to change is worth nearly nothing to you and nearly everything to the airline.',
  'lot-size':
    'The minimum order on a delivery app. You wanted one item; nothing moves for less than ₹199, so that is the smallest order that exists for you, however carefully you shop.',
  'physical-settlement':
    'The free trial nobody cancelled — except the bill that lands is not ₹499 but the full price of the thing you were only ever sampling. Nobody rang to remind you. The date simply arrived, and the amount was set long before you forgot about it.',

  // ------------------------------------------------------------ market moves
  'circuit-limit':
    'The ticketing site freezing the moment a big match goes on sale. Nobody can buy or sell until it comes back — protective if you were about to overpay, and infuriating if you were the one trying to get out.',
  gap: 'You checked a flight at ₹4,000 last night; this morning it is ₹6,200. It never passed through ₹5,000 on the way — there was no ₹5,000 to catch. The fare you saw was for seats that no longer exist.',
  volume:
    'How many people opened the video, not whether they liked it. A million views on something everybody hated and a million on something everybody loved are the same number.',
  candle:
    "Your phone's summary of yesterday: steps, the high point, the low point, where you finished. Four numbers standing in for a whole day — and, like the summary, it cannot tell you whether you ran for a bus or strolled the whole way.",

  // --------------------------------------------------------------- your risk
  'position-size':
    'How much of this month’s salary goes into one purchase. Whether it was a good buy, whether you got a discount, whether the reviews were kind — all of it matters less than this one number, and this is the only part you decide entirely.',
  'risk-per-trade':
    'The spending limit you set on a payment app before you start shopping, not after the cart is full. Set while calm, because it cannot be set while you are deciding whether to add one more thing.',

  // ------------------------------------------------------- reading a claim
  'base-rate':
    'Before you are impressed that an app’s recommendations are all four stars, check what the average restaurant on it scores. If nearly everything is four stars, the recommendation has told you nothing at all.',
  overfitting:
    'A playlist built from one week of your listening. It fits that week perfectly and is unbearable the following month — and it is unbearable precisely because it fitted so well.',
  'survivorship-bias':
    'Reading only the reviews of people still using the app. Everyone who deleted it in the first week is not there to write one, and they were the ones with something useful to say.',

  // --------------------------------------------------- reading a business
  'quality-of-earnings':
    'The earnings screen on a delivery rider’s app at the end of a long shift, against what actually lands on settlement day. The first is what the app says the shift was worth. The second is after every adjustment, and it is the only one that buys anything.',
  roce: 'Asking what every rupee parked in the shop actually earned, including the rupees borrowed to stock it — the way you would compare running a side business against simply leaving the money in a fixed deposit.',
  'pledged-shares':
    'The scooter you are still paying instalments on is not entirely yours yet. Miss enough of them and the financier takes it back and auctions it for whatever it fetches that morning — not for what you believe it is worth, and not on a day you chose.',
  moat: 'Why you have not switched banks despite better offers elsewhere: the salary account, the standing instructions, the sheer bother of it. None of that is loyalty, and none of it lasts forever — a good enough offer eventually beats inertia.',
  dividend:
    'The interest your bank credits each quarter. It arrives because the bank made money using your deposit, not as a reward for staying — and the rate can be cut without anybody asking you first.',

  // ------------------------------------------------------------- chart shapes
  trendline:
    'The line a fitness app draws through your weigh-ins. It describes where you have been. Your body never agreed to stay on it, and the line moves every time a new reading arrives.',
  'swing-point':
    'The worst moment of a traffic jam. Obvious an hour later. While you are sitting in it, you cannot tell whether it is about to clear or about to get considerably worse.',
  confluence:
    'Three delivery apps all quoting forty minutes. It feels like three opinions agreeing, until you notice all three are reading the same traffic feed — in which case it is one opinion, repeated.',
  'head-and-shoulders':
    'A face in the pattern of tiles at a metro station. Everyone can see it once somebody points, most people walked past it for years, and the tiler was not trying to draw anything.',
  'elliott-wave':
    'Reading a personality into how fast somebody types. The rules bend far enough to explain whatever they just did, which is why two people applying them confidently predict opposite things.',
};
