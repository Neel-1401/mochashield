import { useState } from 'react'
import { MarketChart } from '../components/MarketChart'
import { useSimulation } from '../context/SimulationContext'
import { displayPrice, type Ticker } from '../data/mockMarket'
import { NUM, PANEL, SECTION_LABEL } from '../lib/theme'

function statusColor(status: string) {
  if (status === 'CRITICAL') return 'text-[#c43c2b]'
  if (status === 'AT RISK') return 'text-[#e07840]'
  if (status === 'WATCH') return 'text-[#c96a3d]'
  return 'text-[#a3b18a]'
}

export function MarketsPage() {
  const { assets, crashed, liveConditions, setTicker } = useSimulation()
  const [selected, setSelected] = useState<Ticker | null>(null)

  const detail = selected ? assets.find((a) => a.ticker === selected) : null

  const openDetail = (t: string) => {
    const asTicker = t as Ticker
    setSelected(asTicker)
    setTicker(asTicker)
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-4xl text-[#f2ebe3]">Markets</h1>
        <p className="mt-2 text-[13px] text-[#9a9086]">
          Simulated asset book — updates with the shared flash-crash state.
        </p>
      </header>

      <section className={`${PANEL} overflow-x-auto`}>
        <table className="w-full min-w-[900px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#1f1b18] text-[10px] tracking-[0.12em] text-[#6b635c] uppercase">
              <th className="px-4 py-3 font-semibold">Asset</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">24h</th>
              <th className="px-4 py-3 font-semibold">Volatility</th>
              <th className="px-4 py-3 font-semibold">Liquidity</th>
              <th className="px-4 py-3 font-semibold">Volume</th>
              <th className="px-4 py-3 font-semibold">OI Δ</th>
              <th className="px-4 py-3 font-semibold">L/S</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => {
              const up = a.changePct >= 0
              const active = selected === a.ticker
              return (
                <tr
                  key={a.ticker}
                  onClick={() => openDetail(a.ticker)}
                  className={`cursor-pointer border-b border-[#1f1b18] transition-colors last:border-0 hover:bg-[#1a1613] ${
                    active ? 'bg-[#1a1613]' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold tracking-wide text-[#f2ebe3]">{a.ticker}</td>
                  <td className={`${NUM} px-4 py-3 text-[#f2ebe3]`}>
                    {displayPrice(a.ticker as Ticker, a.price)}
                  </td>
                  <td
                    className={`${NUM} px-4 py-3 ${up ? 'text-[#a3b18a]' : 'text-[#c43c2b]'}`}
                  >
                    {up ? '+' : ''}
                    {a.changePct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-[#9a9086]">{a.volatility}</td>
                  <td className={`${NUM} px-4 py-3 text-[#9a9086]`}>{a.liquidity}%</td>
                  <td className={`${NUM} px-4 py-3 text-[#9a9086]`}>+{a.volumeSpike}%</td>
                  <td className={`${NUM} px-4 py-3 text-[#9a9086]`}>
                    {a.openInterestChange > 0 ? '+' : ''}
                    {a.openInterestChange}%
                  </td>
                  <td className={`${NUM} px-4 py-3 text-[#9a9086]`}>{a.longShortRatio}</td>
                  <td className={`px-4 py-3 font-semibold ${statusColor(a.status)}`}>{a.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {detail && selected && (
        <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MarketChart
              selected={selected}
              onSelect={(t) => {
                setSelected(t)
                setTicker(t)
              }}
              crashed={crashed}
              shockPct={liveConditions.marketPriceShock}
            />
          </div>
          <div className={`lg:col-span-2 ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={SECTION_LABEL}>Asset Detail</p>
                <h2 className="mt-1 text-xl font-semibold text-[#f2ebe3]">{detail.ticker}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-[11px] text-[#6b635c] hover:text-[#9a9086]"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-[12px]">
              <Row
                label="Price"
                value={displayPrice(detail.ticker as Ticker, detail.price)}
              />
              <Row
                label="24h Change"
                value={`${detail.changePct >= 0 ? '+' : ''}${detail.changePct.toFixed(1)}%`}
                tone={detail.changePct >= 0 ? 'ok' : 'bad'}
              />
              <Row label="Volatility" value={detail.volatility} />
              <Row label="Liquidity" value={`${detail.liquidity}%`} />
              <Row label="Exposure" value={`${detail.exposure}%`} />
              <Row label="Liquidation Risk" value={`${detail.liquidationRisk}/100`} />
              <Row label="Status" value={detail.status} tone="warn" />
            </div>
          </div>
        </section>
      )}
    </>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'ok' | 'bad' | 'warn'
}) {
  const color =
    tone === 'ok'
      ? 'text-[#a3b18a]'
      : tone === 'bad'
        ? 'text-[#c43c2b]'
        : tone === 'warn'
          ? 'text-[#e07840]'
          : 'text-[#f2ebe3]'
  return (
    <div className="flex items-center justify-between border-b border-[#1f1b18] pb-2">
      <span className="text-[#6b635c]">{label}</span>
      <span className={`${NUM} font-medium ${color}`}>{value}</span>
    </div>
  )
}
