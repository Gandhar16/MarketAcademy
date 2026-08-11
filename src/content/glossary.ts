/**
 * The glossary — every term this site uses, in plain words.
 *
 * WHY THIS EXISTS
 *
 * The lessons were written in plain-sounding English and were still not
 * beginner-safe, because plain STYLE is not the same as plain VOCABULARY. A
 * sentence like "price pauses where resting orders sit" has no long words in it
 * and is completely opaque to someone who does not know what an order is, let
 * alone a resting one. That gap is invisible to whoever wrote the sentence and
 * obvious to everybody reading it, which is exactly the kind of problem that
 * needs a mechanism rather than good intentions.
 *
 * So: every piece of jargon gets an entry here, and `plain` is written for
 * someone who has never opened a trading account. Two mechanisms then use it,
 * and neither asks an author to remember anything:
 *
 *  - The prose renderer AUTO-LINKS the first occurrence of every term in a
 *    lesson (src/lib/lesson/annotate.ts). Adding an entry here retroactively
 *    annotates every lesson that already used the word.
 *  - Validator rule C5 FAILS a lesson that uses a term from a later tier
 *    without introducing it, which is the case auto-linking cannot fix — a
 *    definition popup does not rescue a beginner from a sentence about lot
 *    sizes and margin in the third lesson they ever read.
 *
 * WRITING RULES FOR `plain`
 *
 *  - One or two sentences. If it needs three, it needs a lesson, not an entry.
 *  - No other jargon, unless that term is itself in `needs` and therefore
 *    linked. This is checked by a test, so it cannot rot.
 *  - Say what it IS before saying what it does. "A stop is an instruction" beats
 *    "a stop protects you from losses".
 *  - Concrete over general. Rupees and share counts, not "an asset".
 */

export type GlossaryCategory =
  | 'basics'
  | 'orders'
  | 'costs'
  | 'charts'
  | 'risk'
  | 'derivatives'
  | 'structure'
  | 'analysis'
  | 'india'
  | 'us';

export interface GlossaryEntry {
  /** URL-safe id. Also what `<Term id="...">` refers to. */
  id: string;
  /** The canonical spelling shown to the reader. */
  term: string;
  /** Other spellings that mean the same thing, matched by the jargon scanner. */
  aliases?: string[];
  /**
   * Spellings that are findable by search but NEVER auto-linked, because they
   * collide with ordinary English. "put" is a verb, "call" is a verb, "stops"
   * is a verb, and a definition of a put option appearing over "the money you
   * put down" is worse than no definition at all.
   */
  searchAliases?: string[];
  /**
   * Set when the canonical term itself is an everyday word. The entry is still
   * searchable and still linkable by hand; it is simply never matched
   * automatically.
   */
  noAutoLink?: boolean;
  category: GlossaryCategory;
  /** The whole definition, for someone who knows nothing. No jargon. */
  plain: string;
  /** Optional second layer, for a reader who wants the mechanism. Jargon allowed. */
  more?: string;
  /** A concrete instance with real numbers. */
  example?: string;
  /** Terms whose own entries this one depends on. Checked for cycles. */
  needs?: string[];
  /**
   * Words that, immediately before this term, mean it is not this term at all.
   * `neverAfter: ['in']` on `order` is what stops "in order to" being annotated.
   */
  neverAfter?: string[];
  /** The earliest tier at which a learner is expected to meet this. */
  tier?: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
}

export const GLOSSARY: GlossaryEntry[] = [
  // ---------------------------------------------------------------- basics
  {
    id: 'share',
    term: 'share',
    aliases: ['shares', 'stock', 'stocks', 'equity'],
    category: 'basics',
    tier: 'T0',
    plain:
      'A share is a slice of ownership in a company. Buy one share of a company that has divided itself into a million shares and you own a millionth of it.',
    more: 'Ownership is legal, not symbolic: shareholders vote on certain decisions and are entitled to whatever the company chooses to pay out. It is also last in line — if the company is wound up, lenders and employees are paid before shareholders see anything.',
    example:
      'Reliance Industries has roughly 6.7 billion shares outstanding. Owning 100 of them makes you an owner of about 0.0000015% of the company.',
  },
  {
    id: 'exchange',
    term: 'exchange',
    aliases: ['exchanges', 'NSE', 'BSE', 'bourse'],
    category: 'basics',
    tier: 'T0',
    plain:
      'An exchange is the marketplace where buyers and sellers of shares are matched. In India the two big ones are the NSE and the BSE.',
    more: 'The exchange does not buy or sell anything itself. It runs the matching engine, publishes prices, sets trading hours, and enforces rules like circuit limits. Its revenue comes from transaction charges on the trades it matches.',
    needs: ['share'],
  },
  {
    id: 'broker',
    term: 'broker',
    aliases: ['brokers', 'brokerage account', 'trading account'],
    category: 'basics',
    tier: 'T0',
    plain:
      'A broker is the company whose app you use to place orders. You cannot talk to an exchange directly — the broker is the licensed intermediary that passes your order on.',
    more: 'Brokers are members of the exchange and are regulated by SEBI in India. They hold your trading account, collect the statutory charges on the government\'s behalf, and charge their own brokerage on top.',
    needs: ['exchange', 'order'],
  },
  {
    id: 'depository',
    term: 'depository',
    aliases: ['depositories', 'CDSL', 'NSDL', 'demat'],
    category: 'india',
    tier: 'T0',
    plain:
      'A depository is where your shares actually live once you own them — an electronic record, like a bank holding your money. India has two: CDSL and NSDL.',
    more: 'Your broker and your depository are separate on purpose. If the broker fails, the shares in your demat account are still recorded as yours at the depository, which is the single most important structural protection an Indian retail investor has.',
    needs: ['share', 'broker'],
  },
  {
    id: 'order',
    term: 'order',
    aliases: ['orders'],
    // "in order to" is not an order. It is by far the most common way this
    // word appears in English prose, and a definition popping up over it would
    // read as a bug rather than as help.
    neverAfter: ['in'],
    category: 'orders',
    tier: 'T0',
    plain:
      'An order is an instruction to buy or sell — a specific number of shares, of a specific company, under specific conditions. Placing one is not the same as owning anything; it is a request that may or may not be filled.',
    needs: ['share'],
  },
  {
    id: 'fill',
    term: 'fill',
    aliases: ['filled', 'fills', 'execution', 'executed'],
    category: 'orders',
    tier: 'T0',
    plain:
      'A fill is the moment your order actually becomes a trade, because somebody on the other side agreed to the price. An order that never finds a counterparty is never filled.',
    more: 'A large order can be filled in pieces at several prices — a partial fill. The price you see quoted is the price of the next small trade, not a promise about yours.',
    needs: ['order'],
  },
  {
    id: 'liquidity',
    term: 'liquidity',
    aliases: ['liquid', 'illiquid', 'illiquidity'],
    category: 'structure',
    tier: 'T0',
    plain:
      'Liquidity is how easily you can buy or sell without moving the price. A liquid stock has many people waiting to trade it; an illiquid one has few, so your own order pushes the price around.',
    example:
      'Selling 500 shares of Reliance barely registers. Selling 500 shares of a small company with a hundred trades a day can move the price several percent against you.',
    needs: ['share'],
  },

  // ---------------------------------------------------------------- orders
  {
    id: 'order-book',
    term: 'order book',
    aliases: ['the book', 'book', 'depth', 'market depth'],
    category: 'structure',
    tier: 'T0',
    plain:
      'The order book is the live list of everyone waiting to buy and everyone waiting to sell, with the price and quantity each is waiting at. It is what the market actually is, underneath the single number quoted as "the price".',
    more: 'Buyers are stacked highest-first, sellers lowest-first. A trade happens when someone crosses the gap between the two sides. Indian exchanges publish the best five levels of each side to retail platforms.',
    needs: ['order', 'price'],
  },
  {
    id: 'resting-order',
    term: 'resting order',
    aliases: ['resting orders', 'resting'],
    category: 'orders',
    tier: 'T0',
    plain:
      'A resting order is one that is sitting in the order book waiting, because its price has not been reached yet. It provides liquidity rather than taking it.',
    needs: ['order-book', 'liquidity'],
  },
  {
    id: 'bid',
    term: 'bid',
    aliases: ['bids', 'best bid'],
    category: 'orders',
    tier: 'T0',
    plain: 'The bid is the highest price anyone is currently willing to pay. It is the price you get if you sell right now.',
    needs: ['order-book'],
  },
  {
    id: 'ask',
    term: 'ask',
    // 'offer' is an ordinary verb — "apps offer dozens of tools". Findable,
    // never auto-linked. Same rule as 'order', 'basis' and 'underlying'.
    aliases: ['asks', 'best ask'],
    searchAliases: ['offer'],
    category: 'orders',
    tier: 'T0',
    plain: 'The ask is the lowest price anyone is currently willing to sell at. It is the price you pay if you buy right now.',
    needs: ['order-book'],
  },
  {
    id: 'spread',
    term: 'spread',
    aliases: ['bid-ask spread', 'bid–ask spread'],
    category: 'costs',
    tier: 'T0',
    plain:
      'The spread is the gap between the best buying price and the best selling price. It is a real cost: buy and instantly sell and you lose it, having done nothing.',
    example: 'Bid ₹1,199.50, ask ₹1,200.00. The spread is 50 paise, or about 0.04% of the price.',
    needs: ['bid', 'ask'],
  },
  {
    id: 'market-order',
    term: 'market order',
    aliases: ['market orders'],
    category: 'orders',
    tier: 'T1',
    plain:
      'A market order says "buy now, whatever it costs". It is almost certain to be filled and gives you no control at all over the price.',
    more: 'It walks the book, consuming resting orders from the best price outward until the quantity is complete. In a liquid stock that is one tick of difference; in an illiquid one it can be several percent.',
    needs: ['order', 'order-book', 'fill'],
  },
  {
    id: 'limit-order',
    term: 'limit order',
    aliases: ['limit orders'],
    category: 'orders',
    tier: 'T1',
    plain:
      'A limit order says "buy, but not above this price". You control the price and give up the certainty of being filled — if the market never comes to your price, nothing happens.',
    needs: ['order', 'fill'],
  },
  {
    id: 'stop-loss',
    term: 'stop-loss',
    aliases: ['stop loss', 'stop-loss order', 'SL'],
    searchAliases: ['stop', 'stops'],
    category: 'orders',
    tier: 'T1',
    plain:
      'A stop is an instruction that sits dormant until the price reaches a level you chose, and then fires an order to get you out. It is how you decide in advance what being wrong looks like.',
    more: 'A stop is not a guarantee of the price. It is a trigger: once hit, it becomes an ordinary order and fills wherever the market is — which on a gap can be far below the trigger.',
    needs: ['order', 'trigger-price'],
  },
  {
    id: 'trigger-price',
    term: 'trigger price',
    aliases: ['trigger'],
    category: 'orders',
    tier: 'T1',
    plain: 'The trigger price is the level that wakes a dormant order up. Reaching it does not fill the order; it merely sends it to the exchange.',
    needs: ['order'],
  },
  {
    id: 'slippage',
    term: 'slippage',
    category: 'costs',
    tier: 'T1',
    plain:
      'Slippage is the difference between the price you expected and the price you actually got. It is caused by the market moving, or by your own order being big enough to move it.',
    needs: ['fill', 'order-book'],
  },
  {
    id: 'gap',
    term: 'gap',
    // "the gap between two prices" is ordinary English far more often than it
    // is an overnight jump, so the bare word is search-only.
    aliases: ['gapped', 'gap down', 'gap up', 'gaps down', 'gaps up'],
    searchAliases: ['gap', 'gaps'],
    noAutoLink: true,
    category: 'charts',
    tier: 'T1',
    plain:
      'A gap is when a stock opens at a very different price from where it closed, because news arrived while the market was shut. No trading happened in between, so there was no chance to get out along the way.',
    more: 'This is why a stop is not a guarantee. A stop at ₹1,372 on a stock that closes at ₹1,400 and opens at ₹1,290 fills at ₹1,290 — the trigger was passed in a single jump.',
    needs: ['stop-loss', 'price'],
  },

  // ---------------------------------------------------------------- prices and charts
  {
    id: 'price',
    term: 'price',
    aliases: ['last traded price', 'LTP'],
    category: 'basics',
    tier: 'T0',
    plain:
      'The price of a share is simply what the most recent trade happened at. It is a record of one past agreement between two people, not a valuation and not a promise about your next trade.',
    needs: ['share'],
  },
  {
    id: 'ohlc',
    term: 'OHLC',
    aliases: ['open, high, low, close', 'open high low close'],
    category: 'charts',
    tier: 'T1',
    plain:
      'Four numbers that summarise a period of trading: the first price (open), the highest and lowest reached, and the last price (close). Almost every chart is built from these.',
    needs: ['price'],
  },
  {
    id: 'candle',
    term: 'candle',
    aliases: ['candles', 'candlestick', 'candlesticks', 'bar', 'bars'],
    category: 'charts',
    tier: 'T1',
    plain:
      'A candle is one period of trading drawn as a shape: a body between the opening and closing price, and thin lines to the highest and lowest price reached. One candle can be a minute, a day, or a month.',
    more: 'A candle discards the path. Two completely different days — one that rose steadily, one that crashed and recovered — can produce an identical candle, which is why any story told from a single candle is a guess.',
    needs: ['ohlc'],
  },
  {
    id: 'volume',
    term: 'volume',
    category: 'charts',
    tier: 'T1',
    plain: 'Volume is the number of shares traded in a period. It says how much activity there was, not which direction it pushed.',
    needs: ['share'],
  },
  {
    id: 'support',
    term: 'support',
    // "support complaint", "support the argument", "customer support". Ordinary
    // English far more often than a chart level, so only the qualified form
    // auto-links. Same rule as 'basis', 'underlying', 'edge' and 'lot'.
    aliases: ['support level'],
    searchAliases: ['support'],
    noAutoLink: true,
    category: 'analysis',
    tier: 'T2',
    plain:
      'Support is a price area where a stock has repeatedly stopped falling. There is nothing magical in it — it is a place where enough people had orders waiting to buy.',
    needs: ['resting-order', 'price'],
  },
  {
    id: 'resistance',
    term: 'resistance',
    category: 'analysis',
    tier: 'T2',
    plain: 'Resistance is a price area where a stock has repeatedly stopped rising, because enough sellers were waiting there.',
    needs: ['resting-order', 'price'],
  },
  {
    id: 'moving-average',
    term: 'moving average',
    aliases: ['moving averages', 'SMA', 'EMA', 'simple moving average', 'exponential moving average'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A moving average is the average price over the last N days, recalculated each day. It smooths out daily noise so a longer trend is easier to see, at the cost of always being a little behind.',
    more: 'A simple moving average weights every day equally. An exponential one weights recent days more, so it turns faster and whipsaws more.',
    needs: ['price'],
  },
  {
    id: 'rsi',
    term: 'RSI',
    aliases: ['relative strength index'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'RSI is a number between 0 and 100 that compares how much a stock has risen against how much it has fallen over the last N days. High means it has been rising hard lately; it does not mean it must now fall.',
    more: 'The 30/70 lines are a convention, not a rule. A strongly trending stock can hold above 70 for weeks, and "overbought" has bankrupted a great many people who read it as "about to reverse".',
    needs: ['price'],
  },
  {
    id: 'atr',
    term: 'ATR',
    aliases: ['average true range', 'true range'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'ATR measures how much a stock typically moves in a day, in rupees. It is the practical way to answer "is this move unusual, or is this just what this stock does?"',
    more: 'True range includes gaps, so ATR does not understate a stock that regularly jumps overnight. It is most useful for setting a stop far enough away that ordinary noise does not hit it.',
    needs: ['gap', 'candle'],
  },
  {
    id: 'vwap',
    term: 'VWAP',
    aliases: ['volume weighted average price'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'VWAP is the average price over a period, weighted by how many shares traded at each price. It answers "what did the average share actually change hands at", which a plain average does not.',
    needs: ['volume', 'price'],
  },

  // ---------------------------------------------------------------- costs
  {
    id: 'brokerage',
    term: 'brokerage',
    category: 'costs',
    tier: 'T1',
    plain: 'Brokerage is what your broker charges you for placing the order. It is the only cost on the list that is negotiable, and usually the smallest.',
    needs: ['broker'],
  },
  {
    id: 'stt',
    term: 'STT',
    aliases: ['securities transaction tax'],
    category: 'india',
    tier: 'T1',
    plain:
      'STT is a tax the Indian government charges on share transactions, collected automatically by your broker. It is charged as a percentage of the value traded, and cannot be avoided or reclaimed.',
    more: 'The rate depends on what you traded and how: delivery equity is charged on both buy and sell, intraday only on the sell, and options on the premium. It is levied on turnover, not on profit — you pay it on a losing trade too.',
    needs: ['turnover'],
  },
  {
    id: 'turnover',
    term: 'turnover',
    category: 'costs',
    tier: 'T1',
    plain:
      'Turnover is the total rupee value of what you traded — price times quantity. Most charges are a percentage of it, which is why they apply whether or not you made money.',
    example: 'Buying 35 shares at ₹1,400 is a turnover of ₹49,000. Selling them again makes the round trip ₹98,000 of turnover.',
    needs: ['price'],
  },
  {
    id: 'stamp-duty',
    term: 'stamp duty',
    category: 'india',
    tier: 'T1',
    plain: 'A small state government charge on the purchase of shares. In India it is charged only when you buy, never when you sell.',
    needs: ['turnover'],
  },
  {
    id: 'gst',
    term: 'GST',
    aliases: ['goods and services tax'],
    category: 'india',
    tier: 'T1',
    plain:
      'An 18% tax charged on the SERVICES involved in a trade — the brokerage, the exchange charge, the regulator\'s fee. It is not charged on STT or stamp duty, which are themselves taxes.',
    needs: ['brokerage', 'stt', 'stamp-duty'],
  },
  {
    id: 'dp-charges',
    term: 'DP charges',
    aliases: ['DP charge', 'depository participant charges'],
    category: 'india',
    tier: 'T1',
    plain:
      'A flat fee charged when shares leave your demat account — that is, when you sell something you held. It is per company per day, not per share, so it hurts small sells disproportionately.',
    needs: ['depository', 'share'],
  },
  {
    id: 'breakeven',
    term: 'breakeven',
    aliases: ['break even', 'break-even'],
    category: 'costs',
    tier: 'T1',
    plain:
      'Breakeven is how far the price must move in your favour before you have merely got your money back. Below it you are still down, even if the trade "went the right way".',
    needs: ['turnover', 'spread'],
  },
  {
    id: 'round-trip',
    term: 'round trip',
    aliases: ['round-trip', 'round trips'],
    category: 'costs',
    tier: 'T1',
    plain: 'One complete trade: getting in and getting out again. Costs are usually quoted per round trip because that is what you actually pay.',
    needs: ['turnover'],
  },

  // ---------------------------------------------------------------- risk
  {
    id: 'position',
    term: 'position',
    aliases: ['positions'],
    category: 'risk',
    tier: 'T1',
    plain: 'A position is whatever you currently hold — 100 shares of a company is a position. You are "in a position" from the moment you are filled until you close it.',
    needs: ['fill', 'share'],
  },
  {
    id: 'position-size',
    term: 'position size',
    aliases: ['position sizing', 'sizing'],
    category: 'risk',
    tier: 'T1',
    plain:
      'Position size is how many shares you buy. It is not the same as how much you risk: the risk is the size multiplied by the distance to your stop, which is usually a far smaller number.',
    example: 'Buying ₹1,00,000 of a stock with a stop 2% away puts ₹1,00,000 to work and ₹2,000 at risk.',
    needs: ['position', 'stop-loss', 'share'],
  },
  {
    id: 'risk-per-trade',
    term: 'risk per trade',
    aliases: ['risk budget', 'one R', '1R', 'R'],
    category: 'risk',
    tier: 'T1',
    plain:
      'The amount you have decided in advance to lose if a particular trade goes wrong — usually a small percentage of your account. Traders call one unit of it "one R", which makes trades of different sizes comparable.',
    needs: ['position-size', 'stop-loss'],
  },
  {
    id: 'drawdown',
    term: 'drawdown',
    category: 'risk',
    tier: 'T2',
    plain:
      'A drawdown is how far your account has fallen from its highest point. It is the number that decides whether you can actually stick to a strategy, because it is what you have to live through.',
  },
  {
    id: 'risk-of-ruin',
    term: 'risk of ruin',
    category: 'risk',
    tier: 'T4',
    plain:
      'The probability that a run of ordinary bad luck takes your account low enough that you cannot recover. A strategy that makes money on average can still ruin you if you bet too much of the account each time.',
    needs: ['risk-per-trade', 'drawdown'],
  },
  {
    id: 'margin',
    term: 'margin',
    category: 'derivatives',
    tier: 'T2',
    plain:
      'Margin is the deposit an exchange requires you to keep with your broker to hold certain positions, because those positions could lose more than they cost to open.',
    more: 'It is not a loan and not a fee — it is collateral, returned when you close. But it is recalculated as prices move, and a shortfall must be topped up the same day or the position is closed for you.',
    needs: ['position', 'broker', 'exchange'],
  },
  {
    id: 'leverage',
    term: 'leverage',
    aliases: ['leveraged'],
    category: 'risk',
    tier: 'T2',
    plain:
      'Leverage is controlling a position larger than the money you put down. It multiplies the result in both directions, which is the entire story — nothing about it improves your odds.',
    needs: ['margin', 'position'],
  },

  // ---------------------------------------------------------------- products
  {
    id: 'intraday',
    term: 'intraday',
    aliases: ['MIS', 'day trade', 'day trading'],
    category: 'india',
    tier: 'T1',
    plain:
      'An intraday trade is opened and closed on the same day, so no shares ever reach your demat account. It attracts lower STT and no DP charge, and is automatically closed by the broker before the market shuts.',
    needs: ['stt', 'depository', 'dp-charges', 'share', 'broker'],
  },
  {
    id: 'delivery',
    term: 'delivery',
    aliases: ['CNC', 'delivery trade'],
    category: 'india',
    tier: 'T1',
    plain:
      'A delivery trade is one where you actually take the shares into your demat account and keep them. Higher STT than intraday, and a DP charge when you eventually sell.',
    needs: ['depository', 'stt', 'dp-charges', 'intraday', 'share'],
  },
  {
    id: 't-plus-one',
    term: 'T+1 settlement',
    aliases: ['T+1', 'settlement cycle', 'settlement'],
    category: 'india',
    tier: 'T0',
    plain:
      'Settlement is the day the shares and the money actually change hands, which is not the day you traded. India settles the next working day — trade on Monday, own the shares on Tuesday.',
    needs: ['depository'],
  },
  {
    id: 'derivative',
    term: 'derivative',
    aliases: ['derivatives', 'F&O'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'A derivative is a contract whose value comes from something else — usually a share or an index. You are trading an agreement about the thing, not the thing.',
    needs: ['share', 'index'],
  },
  {
    id: 'underlying',
    term: 'underlying',
    // "the underlying cause", "the underlying problem". Ordinary English far
    // more often than a derivatives noun, so only the unambiguous two-word form
    // is auto-linked. See the working note in PLAN.md.
    aliases: ['underlying asset'],
    searchAliases: ['underlying'],
    noAutoLink: true,
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The thing a contract is about. A NIFTY option\'s underlying is the NIFTY index; a Reliance future\'s underlying is the Reliance share.',
    example: 'You can hold a contract on Reliance without ever owning a single Reliance share.',
    needs: ['derivative', 'share', 'index'],
  },
  {
    id: 'spot-price',
    term: 'spot price',
    // "spot a trend", "on the spot". Only the unambiguous two-word form is
    // auto-linked — same rule as 'basis', 'underlying' and 'offer'.
    aliases: ['spot price'],
    searchAliases: ['spot'],
    noAutoLink: true,
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The price of the thing itself right now, as opposed to the price of a contract about it. "Spot 1,400" means the share is trading at 1,400 today.',
    needs: ['price', 'underlying'],
  },
  {
    id: 'moneyness',
    term: 'moneyness',
    aliases: ['in the money', 'out of the money', 'at the money', 'ITM', 'OTM', 'ATM'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'Where the current price sits relative to the strike. In the money means exercising would gain you something today. Out of the money means it would not. At the money means the two are level.',
    more:
      'It changes minute by minute as the price moves, and it is the single biggest driver of what a contract costs. An out-of-the-money contract is cheap precisely because it is currently worth nothing.',
    needs: ['strike-price', 'spot-price', 'option'],
  },
  {
    id: 'india-vix',
    term: 'India VIX',
    aliases: ['VIX', 'volatility index', 'fear index'],
    category: 'india',
    tier: 'T3',
    plain:
      'India VIX is a number the NSE publishes that says how much movement the options market is pricing into the next 30 days, as a percentage per year.',
    more:
      'It is computed from the prices people are actually paying for NIFTY options, so it is a measure of expectation rather than of anything that has happened. It says nothing about direction — only about size.',
    example: 'India VIX at 14 means the market is pricing roughly a 4% NIFTY move over the coming month, up or down.',
    needs: ['volatility', 'option', 'index'],
  },
  {
    id: 'basis',
    term: 'basis',
    // "on a per-trade basis", "no basis for that claim". Same problem as
    // `underlying`: only the qualified form may auto-link.
    aliases: ['futures basis'],
    searchAliases: ['basis'],
    noAutoLink: true,
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The gap between a futures price and the spot price of the same thing. It shrinks as expiry approaches and is zero on the day itself.',
    needs: ['future', 'spot-price', 'expiry'],
  },
  {
    id: 'open-interest',
    term: 'open interest',
    aliases: ['OI'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The number of contracts currently open and unsettled. Different from volume, which counts trades — one contract changing hands ten times adds ten to volume and nothing to open interest.',
    needs: ['derivative', 'volume'],
  },
  {
    id: 'future',
    term: 'futures contract',
    aliases: ['futures contract', 'futures'],
    searchAliases: ['future'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'A futures contract is an agreement to buy or sell something at a set price on a set future date. Both sides are obliged — there is no choosing later whether to go through with it.',
    needs: ['derivative', 'margin', 'price'],
  },
  {
    id: 'option',
    term: 'option',
    // Both spellings are search-only. "The first option is wrong" appears in
    // every multiple-choice block on this site, and showing a definition of a
    // derivatives contract over it would be worse than showing nothing. The
    // cost is real — the T3 lesson cannot auto-link its own subject — and is
    // covered by that lesson declaring `introduces: ['option']` and by the
    // glossary page.
    aliases: ['options contract'],
    searchAliases: ['option', 'options'],
    noAutoLink: true,
    category: 'derivatives',
    tier: 'T3',
    plain:
      'An option is the right, but not the obligation, to buy or sell at a set price before a set date. The buyer pays for that right up front; the seller keeps the payment and takes on the obligation.',
    needs: ['derivative'],
  },
  {
    id: 'call-option',
    term: 'call option',
    aliases: ['call option', 'call options'],
    searchAliases: ['call', 'calls'],
    category: 'derivatives',
    tier: 'T3',
    plain: 'A call is the right to BUY at a set price. It becomes valuable when the share price rises above that level.',
    needs: ['option', 'share', 'price'],
  },
  {
    id: 'put-option',
    term: 'put option',
    aliases: ['put option', 'put options'],
    searchAliases: ['put', 'puts'],
    category: 'derivatives',
    tier: 'T3',
    plain: 'A put is the right to SELL at a set price. It becomes valuable when the share price falls below that level.',
    needs: ['option', 'share', 'price'],
  },
  {
    id: 'strike-price',
    term: 'strike price',
    aliases: ['strike', 'strikes'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The strike is the fixed price written into the contract — the level at which its holder may buy or sell if they choose to.',
    needs: ['option'],
  },
  {
    id: 'premium',
    term: 'premium',
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The premium is what the buyer pays to get the contract. The buyer can lose all of it; the seller receives it and keeps it whatever happens.',
    needs: ['option'],
  },
  {
    id: 'expiry',
    term: 'expiry',
    // "the offer expires", "my patience expired". Ordinary English, so only
    // the noun forms auto-link.
    aliases: ['expiration', 'expiry day'],
    searchAliases: ['expires', 'expired'],
    category: 'derivatives',
    tier: 'T3',
    plain: 'The date a contract ends. After it, an option is either settled or worth nothing at all — there is no holding on and hoping.',
    needs: ['option'],
  },
  {
    id: 'intrinsic-value',
    term: 'intrinsic value',
    category: 'derivatives',
    tier: 'T3',
    plain: 'The part of an option\'s price that would survive if expiry were right now — how far in your favour the strike already is. It is never negative.',
    needs: ['strike-price', 'premium', 'option', 'expiry', 'price'],
  },
  {
    id: 'time-value',
    term: 'time value',
    aliases: ['extrinsic value', 'theta decay'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'The rest of an option\'s price: what you are paying for the chance that things improve before expiry. It shrinks every day and reaches exactly zero at expiry, whatever happens.',
    needs: ['premium', 'intrinsic-value', 'expiry', 'option', 'price'],
  },
  {
    id: 'volatility',
    term: 'volatility',
    aliases: ['implied volatility', 'IV', 'vol'],
    category: 'derivatives',
    tier: 'T3',
    plain:
      'Volatility is how much a price moves around, expressed as a percentage per year. Implied volatility is the amount of future movement that an option\'s current price implies people are expecting.',
    needs: ['price', 'option'],
  },
  {
    id: 'lot-size',
    term: 'lot size',
    // "is that a lot?", "lots of people". Only the two-word form auto-links.
    aliases: ['lot size'],
    searchAliases: ['lot', 'lots'],
    category: 'india',
    tier: 'T3',
    plain:
      'Indian derivatives are traded in fixed bundles, not single units. A lot is that bundle — you cannot buy half of one, which is what puts many contracts out of reach of a small account.',
    needs: ['derivative'],
  },
  {
    id: 'physical-settlement',
    term: 'physical settlement',
    category: 'india',
    tier: 'T5',
    plain:
      'When a single-stock derivative expires in the money in India, it is settled by actually delivering the shares — not by paying the difference in cash. That can mean owing far more money than the contract cost.',
    needs: ['expiry', 'derivative', 'delivery', 'share', 'moneyness'],
  },

  // ---------------------------------------------------------------- structure
  {
    id: 'circuit-limit',
    term: 'circuit limit',
    aliases: ['circuit', 'circuits', 'price band', 'upper circuit', 'lower circuit'],
    category: 'india',
    tier: 'T5',
    plain:
      'A daily cap on how far a stock is allowed to move before trading in it pauses or stops. Hitting one does not just slow things down — it can leave you unable to sell at all that day.',
    needs: ['exchange', 'price', 'share'],
  },
  {
    id: 'index',
    term: 'index',
    aliases: ['indices', 'NIFTY', 'SENSEX', 'NIFTY 50'],
    category: 'basics',
    tier: 'T0',
    plain:
      'An index is a single number summarising a basket of shares, so people can talk about "the market" in one figure. The NIFTY 50 tracks 50 large Indian companies.',
    more: 'Membership changes over time. A company that performs badly enough is removed and replaced, which is why testing a strategy on today\'s members quietly excludes the failures.',
    needs: ['share'],
  },
  {
    id: 'tick-size',
    term: 'tick size',
    aliases: ['tick', 'ticks'],
    category: 'structure',
    tier: 'T0',
    plain: 'The smallest price step allowed. On most Indian shares it is 5 paise, so a price of ₹1,200.03 simply cannot exist.',
    needs: ['price', 'share'],
  },
  {
    id: 'market-impact',
    term: 'market impact',
    aliases: ['impact'],
    category: 'structure',
    tier: 'T2',
    plain:
      'Market impact is the price moving against you because of your own order. Buy enough and you consume the cheap sellers, so the rest of your order pays more.',
    needs: ['order-book', 'liquidity', 'slippage', 'order', 'price'],
  },
  {
    id: 'short-selling',
    term: 'short selling',
    aliases: ['short selling', 'shorting', 'short position', 'go short'],
    searchAliases: ['short'],
    category: 'risk',
    tier: 'T2',
    plain:
      'Selling something you do not own, so you can buy it back cheaper later. It profits when the price falls, and its losses have no natural ceiling because a price can keep rising indefinitely.',
    needs: ['position', 'share', 'price'],
  },
  {
    id: 'long',
    term: 'long',
    aliases: ['go long', 'long position'],
    searchAliases: ['long'],
    noAutoLink: true,
    category: 'risk',
    tier: 'T1',
    plain:
      'Being long simply means owning something — you profit if the price rises. The word exists only because traders needed an opposite for selling what you do not own.',
    needs: ['position', 'price'],
  },
  {
    id: 'dividend',
    term: 'dividend',
    aliases: ['dividends'],
    category: 'basics',
    tier: 'T0',
    plain:
      'A dividend is cash a company pays out to its shareholders from its profits. On the day it is paid the share price usually drops by roughly the same amount, which surprises people who expected it to be free money.',
    needs: ['share', 'price'],
  },
  {
    id: 'corporate-action',
    term: 'corporate action',
    aliases: ['corporate actions', 'stock split', 'bonus issue'],
    category: 'basics',
    tier: 'T0',
    plain:
      'Something a company does that changes its shares — splitting them into more, issuing bonus shares, paying a dividend. Charts adjust for these, which is why a historical price may not match what actually traded that day.',
    needs: ['share', 'dividend', 'price'],
  },

  // ---------------------------------------------------------------- analysis and thinking
  {
    id: 'backtest',
    term: 'backtest',
    aliases: ['backtesting', 'backtested'],
    category: 'analysis',
    tier: 'T4',
    plain:
      'Testing a trading rule against historical prices to see what it would have done. Useful, and systematically optimistic — every easy mistake in a backtest happens to flatter the result.',
    needs: ['price'],
  },
  {
    id: 'lookahead-bias',
    term: 'lookahead bias',
    aliases: ['lookahead', 'look-ahead bias'],
    category: 'analysis',
    tier: 'T4',
    plain:
      'Accidentally using information in a test that you could not have known at the time. Deciding to buy "at today\'s close" is the classic case: you cannot know the closing price until the day is over.',
    needs: ['backtest', 'ohlc', 'price'],
  },
  {
    id: 'survivorship-bias',
    term: 'survivorship bias',
    aliases: ['survivorship'],
    category: 'analysis',
    tier: 'T4',
    plain:
      'Testing a strategy only on the companies that are still around, which quietly deletes every company that failed. The result looks good at picking winners because the losers were removed before the test began.',
    needs: ['backtest', 'index'],
  },
  {
    id: 'overfitting',
    term: 'overfitting',
    aliases: ['overfit', 'curve fitting'],
    category: 'analysis',
    tier: 'T4',
    plain:
      'Tuning a rule until it fits the past beautifully and describes nothing about the future. Try two hundred variations and keep the best one, and you have found the luckiest one, not the best one.',
    needs: ['backtest'],
  },
  {
    id: 'base-rate',
    term: 'base rate',
    aliases: ['base rates'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'How often something happens in general, before you look at any particular case. If a stock rises the next day 52% of the time regardless, then a pattern that "works 53% of the time" has told you almost nothing.',
    needs: ['share'],
  },
  {
    id: 'statistical-significance',
    term: 'statistical significance',
    aliases: ['significant', 'p-value'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A way of asking whether a result is bigger than random noise would comfortably produce. It is not a measure of how useful a result is, and it can be manufactured by testing enough ideas.',
    needs: ['base-rate'],
  },
  {
    id: 'expectancy',
    term: 'expectancy',
    // 'edge' is ordinary English — "the right-hand edge of the chart", "on
    // edge". It is also the site's term of art, which is exactly why the
    // collision is dangerous: a definition of expectancy over "edge of the
    // chart" reads as a bug. Findable by search, never auto-linked.
    aliases: ['expected value'],
    searchAliases: ['edge'],
    category: 'risk',
    // T1, not T4. The course teaches this at stage 3, before any chart reading,
    // because a learner who cannot do this one multiplication has no way to
    // evaluate anything that comes after it.
    tier: 'T1',
    plain:
      'What you make per trade on average, once wins and losses are weighted by how often each happens. A strategy that wins 70% of the time can still have negative expectancy if the losses are large enough.',
    needs: ['risk-per-trade'],
  },
  // ------------------------------------------ technical-analysis toolkit
  {
    id: 'swing-point',
    term: 'swing point',
    aliases: ['swing points', 'swing high', 'swing low', 'swing highs', 'swing lows'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A swing point is a price high that is higher than the highs on either side of it, or a price low that is lower than the lows on either side of it. It is the starting point most chart-drawing tools are built from.',
    needs: ['price'],
  },
  {
    id: 'trendline',
    term: 'trendline',
    aliases: ['trend line', 'trendlines', 'trend lines'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A trendline is a straight line drawn through two or more swing points, used to show the general direction price has been moving in and to mark roughly where that direction might change.',
    needs: ['swing-point'],
  },
  {
    id: 'fibonacci-retracement',
    term: 'Fibonacci retracement',
    aliases: ['fibonacci retracements', 'fibonacci levels', 'fibonacci extension', 'fibonacci extensions', 'fib levels', 'fibonacci'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Fibonacci retracement is a set of horizontal lines drawn between a swing high and a swing low, at fixed percentages of that move, used to guess where a pullback might pause or how far a further move might reach.',
    needs: ['swing-point'],
  },
  {
    id: 'neckline',
    term: 'neckline',
    aliases: ['necklines'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A neckline is the line drawn under the low points, or over the high points, of a named chart shape. Price closing back through it is usually treated as confirmation that the shape is complete.',
    needs: ['swing-point'],
  },
  {
    id: 'head-and-shoulders',
    term: 'head and shoulders',
    aliases: ['head-and-shoulders', 'inverse head and shoulders', 'inverse head-and-shoulders'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Head and shoulders is a chart shape made of three peaks, a taller one in the middle between two shorter ones, said to mark a rising trend running out of strength. Turned upside down, on three troughs instead of three peaks, it is called inverse head and shoulders and is read as a falling trend running out of strength.',
    needs: ['swing-point'],
  },
  {
    id: 'double-top',
    term: 'double top',
    aliases: ['double tops', 'double bottom', 'double bottoms', 'M pattern', 'W pattern', 'M top', 'W bottom'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A double top is a chart shape where price reaches roughly the same high twice with a dip between the two, said to mark a level that rejected price twice in a row. The mirror image, on two lows instead of two highs, is called a double bottom.',
    needs: ['swing-point'],
  },
  {
    id: 'measured-move',
    term: 'measured move',
    aliases: ['measured-move target', 'measured move target'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A measured move is a price target found by measuring the height of a chart shape and projecting that same distance onward from the point where the shape is considered complete.',
    needs: ['neckline'],
  },
  {
    id: 'elliott-wave',
    term: 'Elliott wave',
    aliases: ['Elliott waves', 'Elliott wave theory', 'wave count', 'wave counting'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Elliott wave is a framework that describes a price move as five waves running with the trend, followed by three waves running against it, with each of those waves said to be built from the same five-and-three pattern at a smaller scale.',
    needs: ['swing-point'],
  },
  // -------------------------------------- second toolkit pass: intraday tools
  {
    id: 'volume-profile',
    term: 'volume profile',
    aliases: ['value area', 'point of control', 'POC'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Volume profile shows how much trading happened at each PRICE over a period, rather than at each moment in time. The price with the most volume is the point of control; the band around it holding most of the volume is the value area.',
    needs: ['volume', 'price'],
  },
  {
    id: 'pivot-point',
    term: 'pivot point',
    aliases: ['pivot points', 'pivot level', 'pivot levels'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'A pivot point is a price level computed from yesterday’s high, low and close using a fixed formula, used as a rough guide to where today’s price might pause before the day has traded at all.',
    needs: ['ohlc'],
  },
  {
    id: 'bollinger-bands',
    term: 'Bollinger Bands',
    aliases: ['bollinger band', 'bollinger squeeze'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Bollinger Bands are a moving average with two lines drawn a fixed statistical distance above and below it, widening when price is volatile and narrowing when it is calm.',
    needs: ['moving-average'],
  },
  // -------------------------------------- second toolkit pass: fundamentals
  {
    id: 'roe',
    term: 'return on equity',
    aliases: ['ROE'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Return on equity measures how much profit a company makes for every rupee shareholders have invested in it. A company earning ₹18 for every ₹100 of shareholder money has a return on equity of 18%.',
    needs: ['share'],
  },
  {
    id: 'roa',
    term: 'return on assets',
    aliases: ['ROA'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Return on assets measures profit generated per rupee of everything a company owns, regardless of whether that was funded by shareholders or by borrowing.',
    needs: ['share'],
  },
  {
    id: 'roce',
    term: 'return on capital employed',
    aliases: ['ROCE'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Return on capital employed measures profit generated per rupee of all the money funding a business, both what shareholders put in and what the company borrowed. It is a broader measure than return on equity: how well the whole capital base is used, not just the shareholders’ slice of it.',
    needs: ['roe'],
  },
  {
    id: 'debt-to-equity',
    term: 'debt-to-equity ratio',
    aliases: ['debt to equity', 'D/E ratio'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Debt-to-equity compares how much a company has borrowed to how much shareholders have put in. A ratio of 1 means it has borrowed roughly as much as shareholders have invested.',
    needs: ['share'],
  },
  {
    id: 'interest-coverage-ratio',
    term: 'interest coverage ratio',
    aliases: ['interest coverage'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'Interest coverage ratio compares a company’s operating profit to the interest it owes on its debt each year. A ratio of 5 means operating profit is five times the annual interest bill, a comfortable cushion before a missed payment becomes a real risk.',
    needs: [],
  },
  {
    id: 'current-ratio',
    term: 'current ratio',
    category: 'analysis',
    tier: 'T2',
    plain:
      'Current ratio compares what a company can turn into cash within a year to what it owes within a year. A ratio above 1 means it can, on paper, cover its near-term bills.',
    needs: [],
  },
  {
    id: 'quality-of-earnings',
    term: 'quality of earnings',
    category: 'analysis',
    tier: 'T2',
    plain:
      'Quality of earnings is a question about whether a company’s reported profit is actually backed by cash coming in the door, or built partly from accounting choices that can reverse. The same rupee of profit can mean very different things depending on the answer.',
    needs: [],
  },
  {
    id: 'confluence',
    term: 'confluence',
    category: 'analysis',
    tier: 'T2',
    plain:
      'Confluence is when two or more separate tools point at the same price — Fibonacci retracement and a candle shape, for example. It means more traders are watching that price. It does not mean the signal is more likely to be correct.',
    needs: ['fibonacci-retracement', 'candle'],
  },
  // ------------------------------------------------------- chart types
  {
    id: 'ohlc-bar-chart',
    term: 'OHLC bar chart',
    aliases: ['bar chart', 'bar charts', 'OHLC bar', 'OHLC bars'],
    category: 'charts',
    tier: 'T2',
    plain:
      'An OHLC bar chart draws the same four prices as a candle, as a single vertical line with two small marks — one on the left for the open, one on the right for the close — instead of a filled body.',
    needs: ['ohlc', 'candle'],
  },
  {
    id: 'heikin-ashi',
    term: 'Heikin-Ashi',
    aliases: ['heikin ashi', 'heiken ashi'],
    category: 'charts',
    tier: 'T2',
    plain:
      'Heikin-Ashi is a way of drawing a candle chart where each bar is smoothed using the previous bar, rather than that bar’s own real open. It makes a trend look calmer, at the cost of the bars no longer being real prices anyone could have traded at.',
    needs: ['candle'],
  },
  {
    id: 'hollow-candle',
    term: 'hollow candle',
    aliases: ['hollow candles'],
    category: 'charts',
    tier: 'T2',
    plain:
      'A hollow candle chart packs in two separate facts per bar. Whether the body is filled or hollow shows the close against that bar’s own open. The colour shows the close against the PREVIOUS bar’s close, which an ordinary candle does not show at all.',
    needs: ['candle'],
  },
  // ------------------------------------------------------- indicators, extended
  {
    id: 'rsi-divergence',
    term: 'RSI divergence',
    aliases: ['RSI divergence', 'bullish divergence', 'bearish divergence'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'RSI divergence is when price makes a new high or low but RSI does not agree — for example, price falls to a lower low while RSI rises to a higher low. It means the move that produced the new price extreme was, by this one measure, weaker than the move before it.',
    needs: ['rsi'],
  },
  {
    id: 'adx',
    term: 'ADX',
    aliases: ['ADX', 'average directional index'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'ADX is a number that measures how strongly a market is trending, without saying which direction. It rises during a strong move up or down and falls when a market goes sideways.',
  },
  // ------------------------------------------------------- fundamentals, extended
  {
    id: 'moat',
    term: 'economic moat',
    aliases: ['economic moat', 'competitive moat'],
    searchAliases: ['moat'],
    category: 'analysis',
    tier: 'T2',
    plain:
      'An economic moat is a durable reason competitors cannot simply copy what is working and compete away a company’s profits — a real barrier like high switching costs or a network effect, not just a good year of results.',
  },
  // ------------------------------------------------------- india, extended
  {
    id: 'promoter-shareholding',
    term: 'promoter shareholding',
    aliases: ['promoter shareholding', 'promoter holding', 'promoter stake'],
    searchAliases: ['promoter', 'promoters'],
    category: 'india',
    tier: 'T2',
    plain:
      'In India, "promoters" are a company’s founders and their families, tracked separately from other shareholders and disclosed as a percentage of the company each quarter, because that stake is assumed to carry more information than an ordinary investor’s.',
  },
  {
    id: 'pledged-shares',
    term: 'pledged shares',
    aliases: ['pledged shares', 'share pledging'],
    searchAliases: ['pledge', 'pledged', 'pledging'],
    category: 'india',
    tier: 'T2',
    plain:
      'Pledged shares are shares posted as collateral against a loan, valued at a discount. A promoter can pledge their own shares the same way a trader can pledge holdings to borrow against them — the shares stay owned, but a large enough price fall can force them to be sold to cover the loan.',
    needs: ['promoter-shareholding'],
  },
];

export const GLOSSARY_BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));

/**
 * The words every other definition is allowed to be written in.
 *
 * These six are introduced in the first T0 lesson and auto-linked in prose like
 * everything else, so a reader who does not know them is one tap away. What
 * they are exempt from is the `needs` declaration: requiring every entry to
 * list `share` and `price` would turn the dependency graph — which exists to
 * show a reader what to read first — into a wall of noise that shows nothing.
 *
 * Keep this list short. Every addition is a word the glossary stops checking.
 */
export const ASSUMED_VOCABULARY = ['share', 'price', 'order', 'exchange', 'fill', 'broker'] as const;

/**
 * Every spelling that may be AUTO-LINKED in prose, longest first so that
 * "market order" is matched before "order".
 *
 * Excludes searchAliases and noAutoLink entries — see those fields for why.
 */
export const GLOSSARY_LOOKUP: { phrase: string; id: string }[] = GLOSSARY.flatMap((g) => [
  // noAutoLink suppresses only the everyday canonical spelling. The precise
  // aliases beside it are unambiguous and still worth linking.
  ...(g.noAutoLink ? [] : [{ phrase: g.term, id: g.id }]),
  ...(g.aliases ?? []).map((a) => ({ phrase: a, id: g.id })),
]).sort((a, b) => b.phrase.length - a.phrase.length);

/** Everything searchable on the glossary page, including the ambiguous spellings. */
export const GLOSSARY_SEARCH: { phrase: string; id: string }[] = GLOSSARY.flatMap((g) => [
  { phrase: g.term, id: g.id },
  ...(g.aliases ?? []).map((a) => ({ phrase: a, id: g.id })),
  ...(g.searchAliases ?? []).map((a) => ({ phrase: a, id: g.id })),
]).sort((a, b) => b.phrase.length - a.phrase.length);

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  basics: 'The basics',
  orders: 'Orders and how they fill',
  costs: 'What a trade costs',
  charts: 'Charts and prices',
  risk: 'Risk and sizing',
  derivatives: 'Options and futures',
  structure: 'How the market works underneath',
  analysis: 'Analysis and evidence',
  india: 'India-specific',
  us: 'US-specific',
};
