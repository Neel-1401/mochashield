import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { getSeries, TICKERS, type Ticker } from '../data/mockMarket'

type MarketChartProps = {
  selected: Ticker
  onSelect: (ticker: Ticker) => void
  crashed: boolean
  shockPct: number
}

export function MarketChart({ selected, onSelect, crashed, shockPct }: MarketChartProps) {
  const data = getSeries(selected, crashed, shockPct)
  const last = data[data.length - 1]?.price ?? 0
  const first = data[0]?.price ?? last
  const changePct = first ? ((last - first) / first) * 100 : 0
  const up = changePct >= 0

  return (
    <section className="flex h-full flex-col rounded-sm border border-[#2a2420] bg-[#151210]/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f1b18] px-4 py-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] text-[#9a9086] uppercase">
            Markets
          </h2>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-[#f2ebe3]">
            {selected}
          </span>
          <span className="text-sm tabular-nums text-[#9a9086]">
            {last.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span
            className={`text-xs tabular-nums ${up ? 'text-[#a3b18a]' : 'text-[#c43c2b]'}`}
          >
            {up ? '+' : ''}
            {changePct.toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {TICKERS.map((ticker) => (
            <button
              key={ticker}
              type="button"
              onClick={() => onSelect(ticker)}
              className={`rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors ${
                selected === ticker
                  ? 'border border-[#c96a3d]/45 bg-[#c96a3d]/10 text-[#e07840]'
                  : 'border border-transparent text-[#6b635c] hover:border-[#2a2420] hover:text-[#f2ebe3]'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full px-2 pb-2 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1f1b18" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#2a2420"
              tick={{ fill: '#6b635c', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#2a2420"
              tick={{ fill: '#6b635c', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: '#12100e',
                border: '1px solid #2a2420',
                borderRadius: 4,
                color: '#f2ebe3',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
              }}
              labelStyle={{ color: '#9a9086' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={crashed ? '#c43c2b' : '#c96a3d'}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
