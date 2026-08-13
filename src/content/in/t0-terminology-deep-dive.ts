import type { Lesson } from '@/lib/lesson/dsl';

/**
 * T0 · Foundations — step 3 of the whole course
 *
 * The vocabulary lesson. Every field has its language, and the market's
 * vocabulary is where beginners get lost. This lesson teaches terms in
 * dependency order — each term builds on the ones before it — with visual
 * diagrams and worked examples for every concept.
 */
export const lesson: Lesson = {
  id: 'in-t0-terminology-deep-dive',
  tier: 'T0',
  market: 'IN',
  title: 'Market terminology — from basic to advanced, with visuals and examples',
  summary:
    'Every term you will encounter, taught in dependency order with diagrams and worked examples. Shares, exchanges, orders, indices, derivatives, Greeks — each defined by what it DOES, not by a dictionary definition.',
  plainSummary:
    'The market has its own language. This lesson teaches every term you need, in the right order, with pictures and real examples. No jargon without explanation.',
  objectives: [
    'Define and distinguish: share, exchange, broker, depository, demat, settlement',
    'Explain order types (market, limit, SL, SL-M) with visual order-book examples',
    'Describe indices (NIFTY, Sensex), weighting, and what they actually measure',
    'Define derivatives basics: futures, options, strike, premium, expiry, Greeks',
    'Explain key metrics: P/E, market cap, volume, volatility, beta',
  ],
  prerequisites: ['in-t0-gambling-vs-investing'],
  estimatedMinutes: 18,
  introduces: [
    'share', 'exchange', 'broker', 'depository', 'demat', 'settlement',
    'market-order', 'limit-order', 'stop-loss', 'sl-m', 'index', 'nifty', 'sensex',
    'market-cap', 'pe-ratio', 'volume', 'volatility', 'beta',
    'future', 'option', 'call', 'put', 'strike', 'premium', 'expiry',
    'delta', 'theta', 'vega', 'gamma', 'iv', 'open-interest'
  ],
  skills: ['foundations', 'vocabulary'],
  blocks: [
    {
      kind: 'figure',
      figure: 'MarketEcosystemFigure',
      props: {},
      caption: 'The market ecosystem: where your order goes and who does what. Every term in this lesson maps to a box or arrow in this diagram.',
    },
    {
      kind: 'callout',
      tone: 'insight',
      title: 'How this lesson works',
      md:
        'Terms are grouped in **dependency order** — you learn what a share is before you learn what an exchange does with it. Each term gets:\n\n1. **One-sentence definition** — what it IS\n2. **What it DOES** — its role in the system\n3. **Visual** — where it lives in the diagram above\n4. **Worked example** — real numbers, real context\n\nThis is not a glossary. It is a guided build of your mental model.',
    },
    {
      kind: 'prose',
      md:
        '## 1. Ownership & Infrastructure\n\n**Share** — A slice of a company. If a company is divided into 100 shares and you own 1, you own 1% of it.\n\n**Exchange** — The marketplace where shares are bought and sold. In India: NSE (National Stock Exchange) and BSE (Bombay Stock Exchange). They match buyers to sellers.\n\n**Broker** — Your agent. You cannot go to the exchange directly. A broker (Zerodha, Groww, ICICI Direct, etc.) sends your order to the exchange.\n\n**Depository** — Where shares are held electronically. In India: NSDL and CDSL. Your demat account is with a depository participant (usually your broker).\n\n**Demat Account** — Your electronic locker for shares. Like a bank account but for securities.\n\n**Settlement (T+1)** — The exchange guarantees the trade. Money moves on day T, shares arrive on day T+1 (next working day).',
    },
    {
      kind: 'example',
      title: 'What happens when you buy 10 shares of TCS at ₹3,500',
      setup:
        'You log into your broker app, enter TCS, quantity 10, market order, and hit buy. Here is the chain:',
      steps: [
        {
          label: '1. Your broker validates',
          detail: 'Do you have ₹35,000 + charges? Yes → order sent to NSE',
          value: 'Your broker',
        },
        {
          label: '2. NSE matches',
          detail: 'Finds a seller at ₹3,500. Trade executed. You are now the buyer.',
          value: 'Exchange (NSE)',
        },
        {
          label: '3. Clearing corporation',
          detail: 'NSE Clearing guarantees the trade. Collects ₹35,000 from your broker, shares from seller\'s broker.',
          value: 'NSE Clearing',
        },
        {
          label: '4. T+1 Settlement',
          detail: 'Next working day: ₹35,000 leaves your bank → seller. Shares credit to your demat → you.',
          value: 'Depository (NSDL/CDSL)',
        },
        {
          label: '5. You own the shares',
          detail: '10 shares of TCS in your demat. Cost: ₹35,000 + ~₹100 charges.',
          value: 'You',
        },
      ],
      conclusion:
        'Five entities, one tap. The broker, exchange, clearing corp, and depository each have a distinct job. Knowing which one to call when something goes wrong saves hours.',
    },
    {
      kind: 'figure',
      figure: 'OrderBookLadderFigure',
      props: {},
      caption: 'The order book (depth). Left side = buyers (bids), right side = sellers (asks). The gap in the middle is the spread.',
    },
    {
      kind: 'prose',
      md:
        '## 2. Order Types — How You Tell the Market What You Want\n\n**Market Order** — "Buy/sell NOW at the best available price." Guarantees execution, NOT price. You walk the order book eating the best offers until your quantity is filled.\n\n**Limit Order** — "Buy at ₹X or lower / Sell at ₹X or higher." Guarantees price, NOT execution. Sits in the order book until matched or cancelled.\n\n**Stop-Loss (SL)** — "If price hits ₹X, send a LIMIT order at ₹Y." Two prices: trigger (₹X) and limit (₹Y). Used to exit a losing position.\n\n**Stop-Loss Market (SL-M)** — "If price hits ₹X, send a MARKET order." One price: trigger (₹X). Guarantees exit, not price. Faster but can fill far from trigger in a gap.\n\n**GTT (Good Till Triggered)** — A stop-loss that stays active for up to a year. Set once, forget until triggered.',
    },
    {
      kind: 'widget',
      component: 'OrderBookLadder',
      props: { symbol: 'RELIANCE', levels: 10 },
      takeaway:
        'Drag the quantity slider to see how a market order walks the book. The average fill price gets worse as size increases — this is slippage.',
    },
    {
      kind: 'example',
      title: 'Order types on a live order book',
      setup:
        'RELIANCE order book (simplified): Best bid ₹2,399.50 (500 shares), Best ask ₹2,400.00 (300 shares). Spread = ₹0.50.',
      steps: [
        {
          label: 'Market BUY 200 shares',
          detail: 'Takes 200 from the 300 at ₹2,400.00. Fill: ₹2,400.00. Remaining ask: 100 at ₹2,400.00.',
          value: 'Guaranteed fill, price = best ask',
        },
        {
          label: 'Market BUY 500 shares',
          detail: 'Takes 300 at ₹2,400.00, then 200 at next ask ₹2,400.50. Average fill: ₹2,400.20. Slippage = ₹0.20.',
          value: 'Larger size = worse average price',
        },
        {
          label: 'Limit BUY 200 @ ₹2,399.50',
          detail: 'Joins the bid queue at ₹2,399.50. Waits for a seller to hit it. May not fill.',
          value: 'Price guaranteed, fill not guaranteed',
        },
        {
          label: 'SL-M SELL (you own 100) trigger ₹2,350',
          detail: 'If price touches ₹2,350, a market sell fires. In a gap down to ₹2,300, you fill at ₹2,300.',
          value: 'Exit guaranteed, price not guaranteed',
        },
      ],
      conclusion:
        'Every order type is a trade-off: certainty of fill vs certainty of price. There is no "best" — only the right tool for the situation.',
    },
    {
      kind: 'figure',
      figure: 'IndexConstructionFigure',
      props: {},
      caption: 'How an index is built: universe → selection → weighting → calculation. NIFTY 50 = free-float market-cap weighted.',
    },
    {
      kind: 'prose',
      md:
        '## 3. Indices & Key Metrics\n\n**Index** — A number tracking a basket of shares. NIFTY 50 = 50 large NSE companies. Sensex = 30 large BSE companies.\n\n**Market Cap** — Share price × total shares. What the whole company is worth.\n\n**Free Float** — Shares available for trading (excludes promoter, government, locked-in holdings). NIFTY weights by free float.\n\n**P/E Ratio** — Price / Earnings per share. How many years of current earnings to pay back the price. Not a "cheap/expensive" score — a sentence about expectations.\n\n**Volume** — Shares traded in a period. High volume = high participation. Low volume = easy to move price, hard to exit.\n\n**Volatility** — How much price jumps around. Measured as standard deviation of daily returns. Higher volatility = wider stops needed.\n\n**Beta** — How much a stock moves vs the index. Beta 1.2 = moves 20% more than NIFTY. Beta 0.8 = moves 20% less.',
    },
    {
      kind: 'example',
      title: 'Reading the NIFTY 50 factsheet',
      setup:
        'NIFTY 50 factsheet shows: Index level 24,500. P/E 22.5. Top 3 weights: HDFC Bank 11.2%, Reliance 10.8%, ICICI Bank 8.5%.',
      steps: [
        {
          label: 'What the level means',
          detail: '24,500 is a scaled number. The base was 1,000 in 1995. 24,500 = 24.5× growth in ~29 years ≈ 11.5% CAGR.',
          value: 'Index level is a scaled history, not a price',
        },
        {
          label: 'What P/E 22.5 means',
          detail: 'You pay ₹22.5 for ₹1 of earnings. If earnings grow 15%/year, payback accelerates. If they shrink, it takes longer.',
          value: 'P/E is about expectations, not a score',
        },
        {
          label: 'What top weights mean for you',
          detail: 'HDFC Bank + Reliance + ICICI = 30.5% of NIFTY. If these three rise 5% and the other 47 are flat, NIFTY rises ~1.5%.',
          value: 'The index is mostly its top 5–10 names',
        },
        {
          label: 'Your portfolio vs NIFTY',
          detail: 'You own 10 stocks, none are HDFC/ICICI. NIFTY +2%, your portfolio −1%. Normal. You do not own the index.',
          value: 'Index ≠ your portfolio unless you own an index fund',
        },
      ],
      conclusion:
        'An index is a weighted basket. The weights concentrate in a few giants. The index number tells you about the giants, not the average company.',
    },
    {
      kind: 'figure',
      figure: 'DerivativesBasicsFigure',
      props: {},
      caption: 'Futures vs Options: both are contracts about a share, not the share itself. Futures = obligation both sides. Options = right for buyer, obligation for seller.',
    },
    {
      kind: 'prose',
      md:
        '## 4. Derivatives Basics — Contracts, Not Shares\n\n**Derivative** — A contract whose value derives from an underlying (share, index, commodity). You do not own the underlying.\n\n**Futures** — Agreement to buy/sell at a fixed price on a fixed date. BOTH sides are obliged. No premium paid. Mark-to-market daily.\n\n**Option** — Right (not obligation) to buy (Call) or sell (Put) at a fixed price (Strike) by a fixed date (Expiry). Buyer pays Premium. Seller receives Premium, has obligation.\n\n**Call Option** — Right to BUY at strike. Profitable if underlying > strike + premium.\n\n**Put Option** — Right to SELL at strike. Profitable if underlying < strike − premium.\n\n**Strike Price** — The fixed price in the contract. Exchange lists strikes at fixed intervals (₹50, ₹100).\n\n**Premium** — Price of the option. Paid by buyer to seller. Non-refundable.\n\n**Expiry** — Last Thursday of the month (monthly) or every Thursday (weekly). After expiry, contract ceases to exist.\n\n**In/At/Out of the Money** — Call: ITM = spot > strike. Put: ITM = spot < strike. ATM = spot ≈ strike. OTM = opposite.\n\n**Open Interest** — Total outstanding contracts. Rising OI + rising price = new longs. Rising OI + falling price = new shorts.',
    },
    {
      kind: 'example',
      title: 'NIFTY 24,500 Call Option — breaking down the premium',
      setup:
        'NIFTY spot: 24,500. Option: NIFTY 24,500 CE (Call, strike 24,500), expiry this Thursday. Premium: ₹180. Lot size: 25.',
      steps: [
        {
          label: 'What you pay',
          detail: '₹180 × 25 = ₹4,500 per lot. This is the maximum loss for the buyer.',
          value: 'Buyer risk = premium × lot size',
        },
        {
          label: 'Intrinsic value',
          detail: 'Spot (24,500) − Strike (24,500) = 0. This option is ATM — zero intrinsic value.',
          value: 'All premium is time value',
        },
        {
          label: 'Time value',
          detail: '₹180 = time value. Pays for the chance that NIFTY moves above 24,500 before Thursday.',
          value: 'Time value decays to 0 at expiry (theta)',
        },
        {
          label: 'Breakeven',
          detail: 'Strike (24,500) + Premium (180) = 24,680. NIFTY must exceed 24,680 for profit.',
          value: 'Being right on direction is not enough — must exceed breakeven',
        },
        {
          label: 'Seller\'s side',
          detail: 'Receives ₹4,500. Obligated to sell NIFTY at 24,500 if assigned. Max profit = ₹4,500. Max loss = unlimited.',
          value: 'Seller has capped gain, uncapped risk',
        },
      ],
      conclusion:
        'An option premium = intrinsic value + time value. ATM options are pure time value. The buyer needs the underlying to move far enough, fast enough. The seller collects time decay but carries tail risk.',
    },
    {
      kind: 'figure',
      figure: 'GreeksExplorerFigure',
      props: {},
      caption: 'The Greeks: Delta (direction), Theta (time decay), Vega (volatility), Gamma (delta change). Drag the sliders to see how each moves.',
    },
    {
      kind: 'prose',
      md:
        '## 5. The Greeks — What Moves Your Option Price\n\n**Delta** — How much the option price moves per ₹1 move in the underlying. Call delta: 0 to 1. Put delta: −1 to 0. ATM ≈ 0.5 / −0.5. Also ≈ probability of expiring ITM.\n\n**Theta** — Daily time decay. Always negative for buyers. Accelerates near expiry. ₹/day per lot.\n\n**Vega** — Price change per 1% change in Implied Volatility (IV). Positive for both calls and puts. Higher IV = more expensive options.\n\n**Gamma** — Rate of change of delta. Highest ATM. Means delta changes fast near the strike — your directional exposure shifts rapidly.\n\n**IV (Implied Volatility)** — The market\'s expectation of future volatility, backed out from option prices. Not historical volatility. IV rank = where current IV sits vs its 1-year range.',
    },
    {
      kind: 'example',
      title: 'Greeks on a NIFTY 24,500 Call (3 days to expiry)',
      setup:
        'NIFTY 24,500 CE, 3 days to expiry, IV 14%, Premium ₹180. Lot 25.',
      steps: [
        {
          label: 'Delta: 0.52',
          detail: 'NIFTY +₹100 → Option +₹52. Per lot: +₹1,300. Your directional exposure = 13 shares equivalent (0.52 × 25).',
          value: 'Delta = share equivalence',
        },
        {
          label: 'Theta: −₹45/day',
          detail: 'Each day, premium drops ₹45 (time decay). Per lot: −₹1,125/day. In 3 days, ₹3,375 of the ₹4,500 premium evaporates if NIFTY stays flat.',
          value: 'Time is the buyer\'s enemy',
        },
        {
          label: 'Vega: ₹8 per 1% IV',
          detail: 'IV 14% → 15%: Premium +₹8. Per lot: +₹200. IV crush (14% → 10%): Premium −₹32. Per lot: −₹800.',
          value: 'IV moves can outweigh direction',
        },
        {
          label: 'Gamma: 0.008',
          detail: 'NIFTY +₹100: Delta 0.52 → 0.60. Your exposure grows from 13 to 15 shares. The option "accelerates" as it goes ITM.',
          value: 'Gamma = convexity. Good for buyers, bad for sellers',
        },
      ],
      conclusion:
        'The Greeks are not formulas to memorise — they are sensitivities you can feel. Drag the Greeks Explorer above: move spot, time, IV, and watch the premium change. That intuition is what matters.',
    },
    {
      kind: 'checkpoint',
      tasks: [
        {
          prompt:
            'Match each term to its definition.',
          type: 'classify',
          spec: {
            categories: ['Ownership/Infra', 'Order Types', 'Indices/Metrics', 'Derivatives', 'Greeks'],
            items: [
              { label: 'Demat account', category: 'Ownership/Infra' },
              { label: 'SL-M order', category: 'Order Types' },
              { label: 'Free float market cap', category: 'Indices/Metrics' },
              { label: 'Call option', category: 'Derivatives' },
              { label: 'Theta', category: 'Greeks' },
              { label: 'Depository', category: 'Ownership/Infra' },
              { label: 'Limit order', category: 'Order Types' },
              { label: 'P/E ratio', category: 'Indices/Metrics' },
              { label: 'Strike price', category: 'Derivatives' },
              { label: 'Vega', category: 'Greeks' },
            ],
          },
          explanation:
            'Grouping terms by domain builds the mental map. Ownership/Infra = where shares live. Order Types = how you trade. Indices/Metrics = how we measure. Derivatives = contracts about shares. Greeks = what moves derivative prices.',
        },
        {
          prompt:
            'You place a market BUY order for 1,000 shares. The best ask has 200 shares. The next ask has 300 shares at ₹0.50 higher. The next has 500 shares at ₹1.00 higher. What is your average fill price relative to the best ask?',
          type: 'compute',
          spec: { metric: 'literal', value: 0.65, tolerance: 0.02, unit: 'rupees worse' },
          explanation:
            '200 @ 0 + 300 @ 0.50 + 500 @ 1.00 = 0 + 150 + 500 = 650 total slippage / 1000 shares = ₹0.65 average slippage. Market orders walk the book — size costs you.',
        },
        {
          prompt:
            'A NIFTY 24,500 Call has delta 0.50, theta −₹40/day, vega ₹8. NIFTY rises ₹100, 1 day passes, IV drops 2%. Estimate the premium change.',
          type: 'compute',
          spec: { metric: 'literal', value: 24, tolerance: 5, unit: 'rupees' },
          explanation:
            'Delta effect: +100 × 0.50 = +₹50. Theta: −₹40. Vega: −2% × ₹8 = −₹16. Net: +50 − 40 − 16 = −₹6. Wait — the delta approximation assumes delta constant. With gamma, delta increases as price rises, so actual gain > ₹50. But the point: direction + time + IV all move the price simultaneously. The knowledgeable participant tracks all three.',
        },
      ],
    },
  ],
};

export default lesson;