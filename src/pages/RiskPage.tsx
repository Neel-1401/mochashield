import { useSimulation } from '../context/SimulationContext'
import {
  riskExplanation,
  scoreStatus,
  statusStyles,
  type RiskBreakdown,
} from '../lib/simulation'
import { NUM, PANEL, SECTION_LABEL } from '../lib/theme'

const COMPONENTS: {
  key: keyof Omit<RiskBreakdown, 'overall' | 'status'>
  label: string
}[] = [
  { key: 'market', label: 'Market Risk' },
  { key: 'liquidity', label: 'Liquidity Risk' },
  { key: 'leverage', label: 'Leverage Risk' },
  { key: 'liquidation', label: 'Liquidation Risk' },
  { key: 'concentration', label: 'Concentration Risk' },
  { key: 'priceFeed', label: 'Price Feed Risk' },
]

export function RiskPage() {
  const { risk, liveConditions, shortExposure, riskTriggers, displayStatus } = useSimulation()

  const riskScoreColor =
    risk.overall >= 80
      ? 'text-[#c43c2b]'
      : risk.overall >= 60
        ? 'text-[#e07840]'
        : risk.overall >= 40
          ? 'text-[#c96a3d]'
          : 'text-[#f2ebe3]'

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-4xl text-[#f2ebe3]">Risk</h1>
        <p className="mt-2 text-[13px] text-[#9a9086]">
          Platform risk engine driven by the shared simulation state.
        </p>
      </header>

      <section className={`${PANEL} mb-4 p-6`}>
        <p className={SECTION_LABEL}>Overall Platform Risk</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <p className={`${NUM} text-6xl font-semibold leading-none ${riskScoreColor}`}>
            {risk.overall}
            <span className="ml-2 text-xl font-medium text-[#6b635c]">/ 100</span>
          </p>
          <span
            className={`rounded-sm border px-3 py-1.5 text-sm font-semibold tracking-wide ${statusStyles(displayStatus)}`}
          >
            {displayStatus}
          </span>
        </div>
        <div className="mt-5 h-[3px] w-full bg-[#1f1b18]">
          <div
            className={`h-full transition-all duration-500 ${
              risk.overall >= 80
                ? 'bg-[#c43c2b]'
                : risk.overall >= 40
                  ? 'bg-[#c96a3d]'
                  : 'bg-[#6b635c]'
            }`}
            style={{ width: `${risk.overall}%` }}
          />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {COMPONENTS.map(({ key, label }) => {
          const score = risk[key]
          const status = scoreStatus(score)
          return (
            <div key={key} className={`${PANEL} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <p className={SECTION_LABEL}>{label}</p>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    status === 'CRITICAL'
                      ? 'text-[#c43c2b]'
                      : status === 'HIGH'
                        ? 'text-[#e07840]'
                        : status === 'ELEVATED'
                          ? 'text-[#c96a3d]'
                          : 'text-[#9a9086]'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className={`${NUM} mt-3 text-3xl font-semibold text-[#f2ebe3]`}>
                {score} <span className="text-sm text-[#6b635c]">/ 100</span>
              </p>
              <div className="mt-3 h-[2px] bg-[#1f1b18]">
                <div
                  className={`h-full ${
                    score >= 75 ? 'bg-[#c43c2b]' : score >= 50 ? 'bg-[#c96a3d]' : 'bg-[#6b635c]'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[#9a9086]">
                {riskExplanation(key, score)}
              </p>
            </div>
          )
        })}
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={`${PANEL} p-5`}>
          <h2 className={`${SECTION_LABEL} mb-4`}>Portfolio Exposure</h2>
          <div className="space-y-3 text-[13px]">
            <ExposureRow label="Long Exposure" value={`${Math.round(liveConditions.longExposure)}%`} />
            <ExposureRow label="Short Exposure" value={`${shortExposure}%`} />
            <ExposureRow
              label="Average Leverage"
              value={`${Math.round(liveConditions.averageLeverage)}x`}
            />
            <ExposureRow
              label="Positions Near Liquidation"
              value={`${Math.round(liveConditions.positionsNearLiquidation)}%`}
            />
            <ExposureRow
              label="Open Interest Change"
              value={`${liveConditions.openInterestChange > 0 ? '+' : ''}${Math.round(liveConditions.openInterestChange)}%`}
            />
          </div>
        </div>

        <div className={`${PANEL} p-5`}>
          <h2 className={`${SECTION_LABEL} mb-4`}>Risk Triggers</h2>
          <ul className="space-y-2">
            {riskTriggers.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 border-b border-[#1f1b18] py-2 text-[13px] last:border-0"
              >
                <span
                  className={
                    t.level === 'critical'
                      ? 'text-[#c43c2b]'
                      : t.level === 'warn'
                        ? 'text-[#e07840]'
                        : 'text-[#a3b18a]'
                  }
                >
                  {t.level === 'ok' ? '✓' : '⚠'}
                </span>
                <span className="text-[#f2ebe3]">{t.label}</span>
                <span className="ml-auto text-[10px] tracking-wide text-[#6b635c] uppercase">
                  {t.level === 'ok' ? 'Clear' : t.level === 'warn' ? 'Warn' : 'Hit'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

function ExposureRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1f1b18] pb-2">
      <span className="text-[#6b635c]">{label}</span>
      <span className={`${NUM} font-semibold text-[#f2ebe3]`}>{value}</span>
    </div>
  )
}
