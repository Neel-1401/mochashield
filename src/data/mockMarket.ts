export type Ticker = 'S&P 500' | 'AAPL' | 'NVDA' | 'TSLA' | 'GOLD'

export type PricePoint = {
  time: string
  price: number
}

const baseSeries: Record<Ticker, number[]> = {
  'S&P 500': [5120, 5135, 5142, 5130, 5155, 5168, 5150, 5172, 5180, 5165, 5190, 5205],
  AAPL: [178, 179, 180, 179.5, 181, 182, 181.2, 183, 184, 183.5, 185, 186],
  NVDA: [875, 880, 890, 885, 900, 910, 905, 920, 930, 925, 940, 950],
  TSLA: [245, 248, 252, 250, 255, 260, 258, 262, 265, 263, 268, 270],
  GOLD: [2320, 2325, 2330, 2328, 2335, 2340, 2338, 2345, 2350, 2348, 2355, 2360],
}

/** Relative crash sensitivity vs market shock (1 = full shock). */
export const ASSET_SHOCK_MULT: Record<Ticker, number> = {
  'S&P 500': 0.74,
  AAPL: 0.82,
  NVDA: 1.47,
  TSLA: 1.13,
  GOLD: 0.35,
}

function toPoints(prices: number[]): PricePoint[] {
  return prices.map((price, i) => ({
    time: `T${i + 1}`,
    price: Math.round(price * 100) / 100,
  }))
}

function crashShift(prices: number[], shockPct: number): number[] {
  const shock = Math.abs(shockPct) / 100
  return prices.map((price, i) => {
    if (i < 6) return price
    const drop = shock * ((i - 5) / (prices.length - 6))
    return Math.round(price * (1 - drop) * 100) / 100
  })
}

export function getSeries(ticker: Ticker, crashed: boolean, shockPct = -10): PricePoint[] {
  const base = baseSeries[ticker]
  if (!crashed) return toPoints(base)
  const scaled = shockPct * ASSET_SHOCK_MULT[ticker]
  return toPoints(crashShift(base, scaled))
}

export function basePrice(ticker: Ticker): number {
  const series = baseSeries[ticker]
  return series[series.length - 1]
}

/** Display price in INR-style marks for stocks; index/gold keep unit price. */
export function displayPrice(ticker: Ticker, usdPrice: number): string {
  if (ticker === 'S&P 500') {
    return usdPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  }
  if (ticker === 'GOLD') {
    return `$${usdPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }
  const inr = usdPrice * 83
  return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export const TICKERS: Ticker[] = ['S&P 500', 'AAPL', 'NVDA', 'TSLA', 'GOLD']
