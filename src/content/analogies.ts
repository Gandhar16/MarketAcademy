/**
 * Everyday comparisons for the glossary — "think of it like…".
 *
 * WHY THIS IS A SEPARATE FILE
 *
 * An analogy is a different kind of writing from a definition, and mixing the
 * two in one file made both worse. A definition is judged on precision; an
 * analogy is judged on whether it lands, which you can only assess by reading
 * sixty of them in a row and noticing that eleven are about queues. Keeping
 * them together is what makes that noticeable.
 *
 * THE THREE RULES
 *
 * 1. **Nothing here is load-bearing.** Every true statement lives in `plain`
 *    and `more`. Delete this entire file and the site loses no correctness,
 *    only a handhold. That is the test for whether an analogy has quietly
 *    started teaching: if removing it would make a reader wrong rather than
 *    lost, it is doing a job it is not allowed to do.
 *
 * 2. **Simplify, never falsify.** An analogy may leave things out. It may not
 *    say something untrue. Where the comparison breaks — and most of them break
 *    somewhere interesting — the break is named inside the analogy itself,
 *    because a reader who spots it unaided concludes the site is sloppy, and a
 *    reader who never spots it walks away with the wrong model.
 *
 * 3. **No jargon.** Same rule `plain` follows, checked by the same test in
 *    `glossary.test.ts`. An analogy that needs a second lookup has failed at
 *    the single job it has.
 *
 * Keyed by glossary id. Every key is checked against the glossary, so a
 * renamed term fails the suite rather than silently dropping its analogy.
 */
export const ANALOGIES: Record<string, string> = {
  // ------------------------------------------------------------------ basics
  share:
    'Think of a company as a very large pizza that has been cut into a million slices. Buying one slice does not let you tell the chef what to cook, but if the restaurant has a good year, your slice is worth more and you get a share of the takings.',
  exchange:
    'A vegetable market. The market itself grows nothing and owns nothing — it provides the stalls, publishes what things are going for, and throws out anyone who cheats. It takes a small fee for running the place.',
  broker:
    'The licensed customs agent at a port. You are not allowed to walk into the docks yourself, so you hand your paperwork to someone who is, and they charge you for the walk.',
  depository:
    'The bank vault where your gold sits, versus the receipt in your pocket that says it is yours. Your shares live in one central vault for the whole country; your account is the receipt.',
  shareholder:
    'A part-owner of the restaurant rather than a customer of it. You do not get free meals, and you cannot walk into the kitchen — but if it is sold, you get your slice of what it sells for.',
  'primary-market':
    'Buying a flat directly from the builder, before anyone has lived in it. The money goes to the builder, who uses it to build.',
  'secondary-market':
    'Buying that same flat five years later from whoever owns it now. The builder gets nothing this time — the money goes to the person selling. Almost everything you will ever buy is this kind.',
  ipo: 'The day the builder finishes the tower and puts the flats on sale to the public for the first time. Everyone wants in on the good ones, so they are handed out by draw rather than first-come.',
  'clearing-corporation':
    'The escrow account in a property sale. Neither side hands anything over to the other directly — money and papers both go to a neutral middle party that only releases them once both have arrived.',
  regulator:
    'The food safety inspector. They do not cook, they do not decide what a restaurant charges, and they cannot make a bad meal good. They can shut the place down for lying about what is in it.',
  dividend:
    'The rent cheque from a property you part-own. It arrives because the business made money and chose to hand some out. It is not a reward for holding on, and a company can stop sending it whenever it likes.',
  index:
    'The exam class average. It tells you how the whole room did without telling you anything about any one student, and a single brilliant result barely moves it.',

  price:
    'The figure on the last thing that actually sold, not a valuation and not an opinion. The shop next door asking double does not make your one worth double.',
  'investment-return':
    'The bicycle you paid ₹8,000 for is worth ₹9,500 now. The ₹1,500 is only real once somebody hands it to you — until then it is what you believe the next buyer will pay.',
  'investment-loss':
    'The same bicycle, now worth ₹6,000. The ₹2,000 is just as real as the gain would have been, and refusing to sell does not undo it — it only postpones finding out.',

  // ------------------------------------------------------------------ orders
  order:
    'The written instruction you hand the shopkeeper, not the purchase itself. Handing it over starts something; it does not finish it, and plenty of instructions are never carried out at all.',
  'order-book':
    'The queue at a busy counter, except there are two queues facing each other — everyone who wants to buy on one side, everyone who wants to sell on the other, each holding up the amount they will accept. A deal happens the moment the two front people agree.',
  'resting-order':
    'A note left with the shopkeeper saying "if the mangoes ever drop to ₹80 a kilo, put five kilos aside for me". You are not in the shop. The note waits.',
  bid: 'The most anyone in the room is currently willing to pay for your thing right now. If you want out this second, this is what you get — not the number on the price tag.',
  ask: 'The least anyone in the room is currently willing to sell for. If you want it this second, this is what you pay.',
  spread:
    'The difference between what the money changer at the airport buys dollars at and sells them at. You lose that difference the instant you go in and back out again, and nobody hands you a bill for it.',
  'market-order':
    'Telling the taxi driver "just go, whatever the meter says". You are guaranteed a ride. You are guaranteed nothing about the fare.',
  'limit-order':
    'Telling the driver "I will pay ₹300, not a rupee more". You are guaranteed the fare. You are guaranteed nothing about getting a ride.',
  'stop-loss':
    'The automatic cut-off on an electric kettle. You set it once, walk away, and it acts without you — which is the entire point, because the moment it needs to act is the moment you will most want to argue with it.',
  'trigger-price':
    'The temperature at which the kettle decides to switch off — not the temperature the water ends up at. Something has to happen after the switch flips, and the world does not stand still while it does.',
  slippage:
    'You see a ₹40 auto fare on your phone, and by the time you tap it is ₹47. Nobody lied to you. The screen showed a real number and the world moved between the looking and the booking.',
  liquidity:
    'How quickly you could sell your car at a fair figure. A five-year-old hatchback sells this week. A vintage motorcycle sells eventually, to the one person who wants it, at whatever they feel like offering.',
  fill: 'The receipt, not the request. You asked for something; this is what you actually got, and the two are allowed to differ.',

  // ------------------------------------------------------------------- costs
  brokerage:
    'The estate agent\'s commission on a property sale. It is the one charge on the whole bill that is negotiable and that different agents quote differently — everything else is fixed by the government.',
  stt: 'The registration charge on a property sale. The government takes its cut because a transaction happened, not because you did well out of it. You pay it in full on a sale you lost money on, and you cannot claim it back afterwards.',
  'stamp-duty':
    'The court fee on a legal document. It is charged for the paperwork existing, is a rounding error on any one trade, and is charged by the state you live in rather than the exchange you traded on.',
  gst: 'The tax on the waiter\'s service charge, not on the food. It applies to what the middlemen charged you for their work — and taxes are not charged on other taxes, so it leaves the government\'s own cuts alone.',
  turnover:
    'The odometer, not the fuel gauge. It counts how much value passed through your hands, which is why someone who bought and sold the same ₹1 lakh forty times has a turnover of ₹40 lakh and possibly no money left.',
  'dp-charges':
    'The locker rental at the bank, charged when you take something out. It is a flat figure per withdrawal, so it is nothing on a large holding and brutal on a small one.',
  breakeven:
    'How far the taxi has to go before the ride is worth the ₹50 pickup fee. Below that distance you walked there for nothing.',
  'round-trip':
    'A return train ticket. Beginners price the journey out and forget that coming home costs too — and every charge on this site is paid twice, once each way.',

  // ------------------------------------------------------------------ charts
  candle:
    'The daily weather summary for one stock: where it started, where it ended, and the hottest and coldest it got in between. Four facts squeezed into one shape — and, like a weather summary, it cannot tell you what order any of it happened in.',
  gap: 'You go to bed with the shop charging ₹100 and it opens tomorrow at ₹85. Nothing traded at ₹92 on the way down. There was no ₹92 — the world changed while the shutters were down, and no instruction you left behind could have got you out at ₹95.',
  ohlc: 'A day compressed to four facts, the way a cricket scorecard compresses an innings. Useful, and it has thrown away almost everything that actually happened.',
  volume:
    'The footfall through the shop, not the mood of the crowd. Heavy footfall on a day the shop empties out and heavy footfall on a day it sells out look identical on this number.',
  'moving-average':
    'Your rolling average marks over the last ten tests, rather than today\'s. One bad paper barely moves it, which is the point — and it is also why it always tells you about a slump some weeks after the slump began.',
  support:
    'The floor a dropped ball keeps bouncing off. It holds until the day it does not, and nothing about the previous bounces tells you which day that is.',
  resistance:
    'The ceiling a helium balloon keeps bumping into. Same idea as the floor, upside down, and with the same honest ending.',
  rsi: 'A speedometer, not a map. It tells you how hard the thing has been moving lately. A car doing 140 tells you nothing about whether the road ahead turns.',
  atr: 'How much this particular road usually shakes the car. A road that always rattles is not having an emergency today just because it rattled.',
  vwap: 'The average figure paid across the whole day by everybody, weighted so a huge purchase counts more than a tiny one. Large institutions are graded against it — beat it and you bought well, miss it and you explain yourself.',

  // -------------------------------------------------------------------- risk
  position:
    'What you are currently holding, and therefore what the world can currently do to you. Owning nothing is a perfectly good place to stand, and it is the only place where tomorrow cannot cost you anything.',
  long: 'Owning the umbrella, and quietly hoping it rains. You do better the more the thing goes up, which is the ordinary way most people hold most things.',
  'position-size':
    'How much of your salary you put on one bet. Every argument about whether the bet is a good one is downstream of this, and this is the only part you fully control.',
  'risk-per-trade':
    'The most you have agreed to lose on one hand before you sit down at the table. Decided while calm, because it cannot be decided while losing.',
  drawdown:
    'How far below the high-water mark on the wall the river has fallen. What matters is not that it is low — it is how far it has to climb to get back, and that climb is always steeper than the fall was.',
  'risk-of-ruin':
    'The odds of the well running dry before the rains come. You can be right about the rains and still lose the farm, purely because of the order things happened in.',
  margin:
    'The deposit on a rented flat. It is not the rent and it is not a payment — it is money held to prove you can cover what you might owe, and it comes back if nothing goes wrong.',
  leverage:
    'A home loan. Twenty percent down buys the whole flat, which multiplies your gain if prices rise — and means a twenty percent fall wipes out everything you put in, while the bank is still owed all of theirs.',
  expectancy:
    'What the average ticket is worth at a fair that runs a hundred stalls. No single go tells you anything. Play enough times and the average is the only number that survives.',

  // ------------------------------------------------------------- derivatives
  derivative:
    'A bet on tomorrow\'s cricket score. It is real, it settles in real money, and it does not require you to own a cricket team.',
  future:
    'Agreeing today to buy next year\'s wheat harvest at a figure fixed now. Both sides are locked in. If wheat collapses, you still have to buy at the agreed figure, and that obligation is what separates this from the next entry.',
  option:
    'The token you pay to hold a flat for a month. If you walk away, you lose the token and nothing else. If the flat doubles, you still buy at the figure written on the token. You bought the right to decide later, and the token is the fee for the delay.',
  'call-option':
    'That same holding token on a flat you think is about to get more expensive. You are paying for the right to buy later at today\'s figure.',
  'put-option':
    'An insurance policy on your car. You pay a fee, and if the thing loses value you are covered. If nothing happens, the fee is gone and you are not owed an apology — that is what insurance is.',
  'strike-price':
    'The figure written on the holding token — the one you get to buy or sell at, no matter what the world says the thing is worth on the day.',
  premium:
    'The fee on the insurance policy, not the payout. It is what you hand over on day one, and it is gone whether or not you ever claim.',
  expiry:
    'The date on a milk carton, except the carton is worth exactly nothing the second past it. Not less — nothing. There is no grace period and nobody rings to remind you.',
  'intrinsic-value':
    'What your holding token would be worth if you had to act on it right this second. Often that is zero, and a token worth zero today can still cost real money, which is the next entry.',
  'time-value':
    'What people will pay you for the fact that there is still a month left on the clock. It shrinks every single day, faster near the end, and on the last day it is gone. Nothing has to go wrong for you to lose it.',
  volatility:
    'How jumpy a thing is, not which way it is heading. A road that throws the car around is a rough road whether you are driving uphill or down.',
  moneyness:
    'Whether the figure on your holding token is currently a bargain, a joke, or exactly what everyone else is paying.',
  'lot-size':
    'Eggs come by the dozen. You cannot buy seven. If a dozen is more than you wanted, that is the smallest bet available to you and no amount of care changes it.',
  'open-interest':
    'How many unfinished bets are still on the table, rather than how many were placed today. A busy table where everyone settles up by evening ends the day at zero.',
  'physical-settlement':
    'You bought a ₹2,000 holding token as a flutter, forgot about it, and the clock ran out — so now a lorry is at your gate with the actual goods and an invoice for the full amount. Nobody asked whether you had the money.',
  'india-vix':
    'The nervousness reading for the whole market, taken from what people are currently paying for insurance. High readings mean everyone expects a bumpy ride — not that the ride goes down.',

  // --------------------------------------------------------------- structure
  't-plus-one':
    'You pay for the sofa in the showroom today; it is delivered tomorrow. It is yours the moment you pay, but the paperwork catching up takes a day, and until it does you cannot sell it on to somebody else.',
  'tick-size':
    'Prices come in five-paise steps the way a ruler comes in millimetres. There is no figure between two steps, so asking for one is not a fussy request — it is an impossible one.',
  'market-impact':
    'You are the only buyer at the fish market at closing time and you want everything. The first crate is cheap. By the last crate the seller has noticed you have no alternative.',
  'short-selling':
    'Borrowing your neighbour\'s ladder, selling it for ₹5,000 because ladders are expensive this month, and buying an identical one back for ₹3,000 next month to return. You keep the difference — and if ladders go to ₹20,000 instead, you still owe a ladder.',
  'circuit-limit':
    'The referee stopping play when the crowd gets out of hand. Nobody can trade until it restarts — which sounds protective until you are the one holding something you desperately wanted to sell.',
  'corporate-action':
    'The company changing the packaging without changing what is inside: same quantity of biscuits, now in two smaller boxes. Your holding looks different afterwards and is worth the same, which is why the chart needs adjusting rather than believing.',
  intraday:
    'Renting the bicycle for the afternoon and returning it before the shop shuts. You never take it home, so the paperwork is lighter and cheaper — and the shop will come and take it off you at closing time whether you are ready or not.',
  delivery:
    'Buying the bicycle. It comes home with you, it is yours until you sell it, and there is a charge on the day you hand it back.',

  // ---------------------------------------------------------------- analysis
  backtest:
    'Marking your own exam paper with the answer key open beside you. It proves something. It does not prove what you would like it to prove.',
  'lookahead-bias':
    'Betting on yesterday\'s match. Every prediction is uncannily good and none of it means anything, and the horrible part is how easy it is to do this by accident and never notice.',
  'survivorship-bias':
    'Asking only the people who finished the marathon whether the training plan works. Everyone who collapsed at kilometre thirty is not in the room to be asked.',
  overfitting:
    'Tailoring a suit to fit one person exactly, then being surprised it fits nobody else. The tighter it fitted the person you measured, the worse it fits everyone you did not.',
  'base-rate':
    'Before you decide the new medicine works, you need to know how many people got better on their own. A pattern that "works 55% of the time" in a market that rises 55% of days has told you nothing at all.',
  'statistical-significance':
    'Three heads in a row proves nothing about the coin. Three hundred starts to. This is the arithmetic for how many throws it takes before you are allowed to believe the coin is bent.',

  // ------------------------------------------------------------------- india
  'promoter-shareholding':
    'How much of the restaurant the founding family still eats at, rather than how loudly they praise the food. It is a fact you can look up, and it is not proof of anything by itself.',
  'pledged-shares':
    'The family mortgaged their stake in the restaurant to borrow money. If the value drops far enough, the lender sells their stake — into the same falling market, which pushes it lower. Trouble feeds itself.',

  // ---------------------------------------------------- reading a business
  roe: 'How much a shopkeeper earns per rupee of their own money in the business. High is good and is not automatically skill — borrowing heavily flatters this number, which is why the next one exists.',
  roce: 'The same question asked of every rupee in the business, borrowed or not. It is harder to flatter, and that is exactly why it is the more honest of the pair.',
  'debt-to-equity':
    'How much of the flat the bank owns versus how much you do. Borrowing is not a sin — it is a promise, and promises come due on their schedule and not on yours.',
  'interest-coverage-ratio':
    'How many times over your salary covers your loan instalment. Ten times is comfortable. One-point-one times is a household that cannot afford one bad month.',
  'current-ratio':
    'Whether there is enough in the account this month to cover the bills due this month. A business can be genuinely valuable and still fail to make Friday\'s payroll.',
  'quality-of-earnings':
    'The difference between a shop that made ₹10 lakh and a shop that has ₹10 lakh. The first is a pile of unpaid invoices, the second is money in the bank, and the distance between the two is where trouble hides longest.',
  moat: 'The reason people keep walking past two other barbers to reach yours. Habit, location, the fact that switching is a nuisance — and none of it is permanent, because moats dry up.',
};
