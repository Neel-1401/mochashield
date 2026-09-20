import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MarketChart } from './components/MarketChart'
import { basePrice, TICKERS, type Ticker } from './data/mockMarket'
import {
  applyStageToConditions,
  computeCascade,
  computeImpact,
  computePriceFeeds,
  computeRisk,
  DEFAULT_CONDITIONS,
  evaluateProtocols,
  protocolStatusColor,
  protocolStatusLabel,
  SIM_DURATION_MS,
  STAGE_TIMELINE,
  statusStyles,
  type MarketConditions,
  type ProtocolState,
  type SimStage,
  type SystemStatus,
} from './lib/simulation'

const PANEL =
  'rounded-sm border border-[#2a2420] bg-[#151210]/90 hover:border-[#3a322c] transition-colors'
const SECTION_LABEL =
  'text-[11px] font-semibold tracking-[0.16em] text-[#9a9086] uppercase'
const NUM = 'tabular-nums'

export default function App() {
  const [conditions, setConditions] = useState<MarketConditions>(DEFAULT_CONDITIONS)
  const [stage, setStage] = useState<SimStage>('IDLE')
  const [simulating, setSimulating] = useState(false)
  const [showImpact, setShowImpact] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [ticker, setTicker] = useState<Ticker>('S&P 500')
  const [conditionsOpen, setConditionsOpen] = useState(true)
  const timersRef = useRef<number[]>([])

  const liveConditions = useMemo(() => {
    if (stage === 'IDLE') return conditions
    return applyStageToConditions(conditions, stage)
  }, [conditions, stage])

  const risk = useMemo(() => computeRisk(liveConditions), [liveConditions])

  const protocols = useMemo(
    () => evaluateProtocols(risk, liveConditions, stage),
    [risk, liveConditions, stage],
  )

  const activeProtocolCount = protocols.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'COMPLETED',
  ).length

  const cascade = useMemo(
    () => computeCascade(risk, liveConditions, activeProtocolCount),
    [risk, liveConditions, activeProtocolCount],
  )

  const impact = useMemo(
    () => computeImpact(risk, liveConditions, cascade, activeProtocolCount),
    [risk, liveConditions, cascade, activeProtocolCount],
  )

  const feeds = useMemo(
    () => computePriceFeeds(basePrice(ticker), liveConditions.priceFeedDivergence),
    [ticker, liveConditions.priceFeedDivergence],
  )

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const reset = () => {
    clearTimers()
    setSimulating(false)
    setShowImpact(false)
    setCrashed(false)
    setStage('IDLE')
    setConditions(DEFAULT_CONDITIONS)
  }

  const simulate = () => {
    if (simulating) return
    clearTimers()
    setSimulating(true)
    setShowImpact(false)
    setCrashed(true)
    setStage('NORMAL')

    STAGE_TIMELINE.forEach(({ atMs, stage: next }) => {
      if (atMs === 0) return
      const id = window.setTimeout(() => setStage(next), atMs)
      timersRef.current.push(id)
    })

    const doneId = window.setTimeout(() => {
      setSimulating(false)
      setShowImpact(true)
      setStage('STABILIZATION')
    }, SIM_DURATION_MS)
    timersRef.current.push(doneId)
  }

  const updateCondition = <K extends keyof MarketConditions>(key: K, value: number) => {
    if (simulating) return
    setConditions((prev) => ({ ...prev, [key]: value }))
  }

  const displayStatus: SystemStatus = risk.status
  const stageLabel = stage === 'IDLE' ? 'READY' : stage
  const isCrisis =
    displayStatus === 'CRISIS' || stage === 'DAMAGE CONTROL' || stage === 'STABILIZATION'

  const riskScoreColor =
    risk.overall >= 80
      ? 'text-[#c43c2b]'
      : risk.overall >= 60
        ? 'text-[#e07840]'
        : risk.overall >= 40
          ? 'text-[#c96a3d]'
          : 'text-[#f2ebe3]'

  return (
    <div className={`app-shell ${isCrisis ? 'crisis-glow' : ''}`}>
      {/* Top branding bar */}
      <nav className="border-b border-[#2a2420] bg-[#12100e]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-10">
            <div>
              <div className="text-[13px] font-semibold tracking-[0.2em] text-[#f2ebe3] uppercase">
                MochaShield
              </div>
              <div className="mt-0.5 text-[10px] tracking-[0.14em] text-[#6b635c] uppercase">
                Market Risk & Crash Response
              </div>
            </div>
            <div className="hidden items-center gap-6 text-[12px] text-[#6b635c] sm:flex">
              <span className="text-[#f2ebe3]">Overview</span>
              <span>Markets</span>
              <span>Risk</span>
              <span>Incidents</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`${NUM} text-[11px] text-[#6b635c]`}>
              STAGE <span className="text-[#c96a3d]">{stageLabel}</span>
            </span>
            <span
              className={`rounded-sm border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusStyles(displayStatus)}`}
            >
              {displayStatus}
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-6 py-8">
        {/* Editorial headline */}
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-4xl leading-tight text-[#f2ebe3] md:text-5xl">
            Market risk &amp; crash response
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9a9086]">
            Simulated platform stress, protocol activation, and damage control — for demonstration
            only.
          </p>
        </header>

        {/* Market ticker */}
        <TickerStrip shockPct={liveConditions.marketPriceShock} crashed={crashed} />

        {/* Platform risk focus + metrics */}
        <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className={`lg:col-span-4 ${PANEL} p-5`}>
            <p className={SECTION_LABEL}>Platform Risk</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className={`${NUM} text-6xl font-semibold leading-none tracking-tight ${riskScoreColor}`}>
                {risk.overall}
                <span className="ml-1 text-xl font-medium text-[#6b635c]">/ 100</span>
              </p>
              <span
                className={`rounded-sm border px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles(displayStatus)}`}
              >
                {displayStatus}
              </span>
            </div>
            <div className="mt-5 h-[2px] w-full bg-[#1f1b18]">
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-8">
            <MetricCell
              label="Market Volatility"
              value={`+${Math.round(liveConditions.volatilitySpike)}%`}
              tone={liveConditions.volatilitySpike >= 150 ? 'warn' : 'ok'}
            />
            <MetricCell
              label="Liquidity Stress"
              value={`${Math.round(liveConditions.liquidityDrop)}%`}
              tone={Math.abs(liveConditions.liquidityDrop) >= 50 ? 'warn' : 'ok'}
            />
            <MetricCell
              label="Positions at Risk"
              value={`${Math.round(liveConditions.positionsNearLiquidation)}%`}
              tone={
                liveConditions.positionsNearLiquidation >= 25
                  ? 'crisis'
                  : liveConditions.positionsNearLiquidation >= 12
                    ? 'warn'
                    : 'ok'
              }
            />
          </div>
        </section>

        {/* Chart + conditions */}
        <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MarketChart
              selected={ticker}
              onSelect={setTicker}
              crashed={crashed}
              shockPct={liveConditions.marketPriceShock}
            />
          </div>
          <div className="lg:col-span-2">
            <MarketConditionsPanel
              conditions={conditions}
              live={liveConditions}
              open={conditionsOpen}
              onToggle={() => setConditionsOpen((o) => !o)}
              onChange={updateCondition}
              disabled={simulating}
              simulating={simulating}
              onSimulate={simulate}
              onReset={reset}
              stage={stageLabel}
            />
          </div>
        </section>

        {/* Risk Engine + Damage Control */}
        <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <RiskEnginePanel risk={risk} />
          <DamageControlPanel protocols={protocols} />
        </section>

        {/* Price Feed + Incident */}
        <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PriceFeedPanel feeds={feeds} />
          {isCrisis && <IncidentPanel protocols={protocols} />}
          {!isCrisis && (
            <section className={`${PANEL} p-5`}>
              <h2 className={`${SECTION_LABEL} mb-2`}>Incident Response</h2>
              <p className="text-[13px] text-[#6b635c]">
                Activates automatically when status reaches CRISIS.
              </p>
            </section>
          )}
        </section>

        {/* Cascade + Impact */}
        <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <LiquidationCascadePanel
            cascade={cascade}
            showProtection={
              activeProtocolCount > 0 &&
              (stage === 'DAMAGE CONTROL' ||
                stage === 'STABILIZATION' ||
                showImpact ||
                displayStatus === 'CRISIS')
            }
          />
          <ProtocolImpactPanel
            impact={impact}
            visible={
              showImpact ||
              stage === 'DAMAGE CONTROL' ||
              stage === 'STABILIZATION' ||
              activeProtocolCount >= 3
            }
          />
        </section>
      </div>
    </div>
  )
}

/* ---------- Presentational helpers (styling only) ---------- */

function TickerStrip({ shockPct, crashed }: { shockPct: number; crashed: boolean }) {
  const display = TICKERS.map((t) => {
    const base = basePrice(t)
    const inr = t === 'S&P 500' ? base : base * 83
    const change = crashed ? shockPct * 0.74 : t === 'NVDA' ? 2.4 : t === 'AAPL' ? 0.44 : -0.3
    return { ticker: t, price: inr, change }
  })

  return (
    <div className="mb-6 flex gap-0 overflow-x-auto rounded-sm border border-[#2a2420] bg-[#12100e]/70">
      {display.map((item) => {
        const up = item.change >= 0
        return (
          <div
            key={item.ticker}
            className="min-w-[150px] flex-1 border-r border-[#1f1b18] px-4 py-3 last:border-r-0"
          >
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#9a9086] uppercase">
              {item.ticker}
            </p>
            <p className={`${NUM} mt-1 text-[15px] font-semibold text-[#f2ebe3]`}>
              {item.ticker === 'S&P 500'
                ? item.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })
                : `₹${item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
            </p>
            <p className={`${NUM} text-[11px] ${up ? 'text-[#a3b18a]' : 'text-[#c43c2b]'}`}>
              {up ? '+' : ''}
              {item.change.toFixed(2)}%
            </p>
          </div>
        )
      })}
    </div>
  )
}

function MetricCell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ok' | 'warn' | 'crisis'
}) {
  const valueColor =
    tone === 'crisis' ? 'text-[#c43c2b]' : tone === 'warn' ? 'text-[#e07840]' : 'text-[#f2ebe3]'

  return (
    <div className={`${PANEL} p-4`}>
      <p className={SECTION_LABEL}>{label}</p>
      <p className={`${NUM} mt-3 text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
    </div>
  )
}

function CompactSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-wide text-[#6b635c] uppercase">{label}</span>
        <span className={`${NUM} text-[11px] font-medium text-[#c96a3d]`}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full disabled:opacity-40"
      />
    </label>
  )
}

function MarketConditionsPanel({
  conditions,
  live,
  open,
  onToggle,
  onChange,
  disabled,
  simulating,
  onSimulate,
  onReset,
  stage,
}: {
  conditions: MarketConditions
  live: MarketConditions
  open: boolean
  onToggle: () => void
  onChange: <K extends keyof MarketConditions>(key: K, value: number) => void
  disabled: boolean
  simulating: boolean
  onSimulate: () => void
  onReset: () => void
  stage: string
}) {
  return (
    <section className={`flex h-full flex-col ${PANEL}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between border-b border-[#1f1b18] px-4 py-3 text-left"
      >
        <h2 className={SECTION_LABEL}>Market Conditions</h2>
        <span className="text-[10px] text-[#6b635c]">{open ? '−' : '+'}</span>
      </button>

      <div className="grid grid-cols-2 gap-px border-b border-[#1f1b18] bg-[#1f1b18]">
        {[
          ['Market Shock', `${Math.round(live.marketPriceShock)}%`],
          ['Volatility', `+${Math.round(live.volatilitySpike)}%`],
          ['Liquidity', `${Math.round(live.liquidityDrop)}%`],
          ['Leverage', `${Math.round(live.averageLeverage)}x`],
        ].map(([k, v]) => (
          <div key={k} className="bg-[#151210] px-3 py-2.5">
            <p className="text-[9px] tracking-wide text-[#6b635c] uppercase">{k}</p>
            <p className={`${NUM} text-sm font-semibold text-[#f2ebe3]`}>{v}</p>
          </div>
        ))}
      </div>

      {open && (
        <div className="max-h-56 space-y-2.5 overflow-y-auto px-4 py-3">
          <CompactSlider
            label="Market Price Shock"
            value={conditions.marketPriceShock}
            display={`${Math.round(live.marketPriceShock)}%`}
            min={-30}
            max={0}
            step={1}
            disabled={disabled}
            onChange={(v) => onChange('marketPriceShock', v)}
          />
          <CompactSlider
            label="Volatility Spike"
            value={conditions.volatilitySpike}
            display={`+${Math.round(live.volatilitySpike)}%`}
            min={0}
            max={300}
            step={5}
            disabled={disabled}
            onChange={(v) => onChange('volatilitySpike', v)}
          />
          <CompactSlider
            label="Liquidity Drop"
            value={conditions.liquidityDrop}
            display={`${Math.round(live.liquidityDrop)}%`}
            min={-80}
            max={0}
            step={1}
            disabled={disabled}
            onChange={(v) => onChange('liquidityDrop', v)}
          />
          <CompactSlider
            label="Trading Volume Spike"
            value={conditions.tradingVolumeSpike}
            display={`+${Math.round(live.tradingVolumeSpike)}%`}
            min={0}
            max={400}
            step={10}
            disabled={disabled}
            onChange={(v) => onChange('tradingVolumeSpike', v)}
          />
          <CompactSlider
            label="Bid-Ask Spread Increase"
            value={conditions.bidAskSpreadIncrease}
            display={`+${Math.round(live.bidAskSpreadIncrease)}%`}
            min={0}
            max={500}
            step={10}
            disabled={disabled}
            onChange={(v) => onChange('bidAskSpreadIncrease', v)}
          />
          <CompactSlider
            label="Long Exposure"
            value={conditions.longExposure}
            display={`${Math.round(live.longExposure)}%`}
            min={20}
            max={90}
            step={1}
            disabled={disabled}
            onChange={(v) => onChange('longExposure', v)}
          />
          <CompactSlider
            label="Average Leverage"
            value={conditions.averageLeverage}
            display={`${Math.round(live.averageLeverage)}x`}
            min={1}
            max={20}
            step={1}
            disabled={disabled}
            onChange={(v) => onChange('averageLeverage', v)}
          />
          <CompactSlider
            label="Positions Near Liquidation"
            value={conditions.positionsNearLiquidation}
            display={`${Math.round(live.positionsNearLiquidation)}%`}
            min={0}
            max={50}
            step={1}
            disabled={disabled}
            onChange={(v) => onChange('positionsNearLiquidation', v)}
          />
          <CompactSlider
            label="Price Feed Divergence"
            value={conditions.priceFeedDivergence}
            display={`${live.priceFeedDivergence.toFixed(1)}%`}
            min={0}
            max={5}
            step={0.1}
            disabled={disabled}
            onChange={(v) => onChange('priceFeedDivergence', v)}
          />
          <CompactSlider
            label="Open Interest Change"
            value={conditions.openInterestChange}
            display={`${live.openInterestChange > 0 ? '+' : ''}${Math.round(live.openInterestChange)}%`}
            min={-50}
            max={100}
            step={5}
            disabled={disabled}
            onChange={(v) => onChange('openInterestChange', v)}
          />
        </div>
      )}

      <div className="mt-auto space-y-2 border-t border-[#1f1b18] px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSimulate}
            disabled={simulating}
            className="rounded-sm bg-[#c96a3d] px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] text-[#0b0908] uppercase transition hover:bg-[#e07840] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {simulating ? 'Simulating…' : 'Simulate Flash Crash'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-sm border border-[#2a2420] bg-transparent px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] text-[#9a9086] uppercase transition hover:border-[#c96a3d]/40 hover:text-[#f2ebe3]"
          >
            Reset
          </button>
        </div>
        {simulating && (
          <p className={`${NUM} text-[10px] text-[#e07840]`}>Running — {stage}</p>
        )}
      </div>
    </section>
  )
}

function RiskBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 75 ? 'bg-[#c43c2b]' : score >= 50 ? 'bg-[#c96a3d]' : 'bg-[#6b635c]'

  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="tracking-wide text-[#6b635c] uppercase">{label}</span>
        <span className={`${NUM} font-medium text-[#f2ebe3]`}>{score}</span>
      </div>
      <div className="h-[2px] overflow-hidden bg-[#1f1b18]">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function RiskEnginePanel({ risk }: { risk: ReturnType<typeof computeRisk> }) {
  return (
    <section className={`${PANEL} p-5`}>
      <h2 className={`${SECTION_LABEL} mb-4`}>Risk Engine</h2>
      <RiskBar label="Market Risk" score={risk.market} />
      <RiskBar label="Liquidity Risk" score={risk.liquidity} />
      <RiskBar label="Leverage Risk" score={risk.leverage} />
      <RiskBar label="Liquidation Risk" score={risk.liquidation} />
      <RiskBar label="Concentration Risk" score={risk.concentration} />
      <RiskBar label="Price-Feed Risk" score={risk.priceFeed} />

      <div className="mt-4 rounded-sm border border-[#2a2420] bg-[#12100e] p-4">
        <p className={SECTION_LABEL}>Overall Platform Risk</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className={`${NUM} text-3xl font-semibold text-[#f2ebe3]`}>
            {risk.overall} <span className="text-base text-[#6b635c]">/ 100</span>
          </p>
          <span
            className={`rounded-sm border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${statusStyles(risk.status)}`}
          >
            {risk.status}
          </span>
        </div>
      </div>
    </section>
  )
}

function StatusDot({ status }: { status: ProtocolState['status'] }) {
  const color =
    status === 'ACTIVE'
      ? 'bg-[#e07840]'
      : status === 'COMPLETED'
        ? 'bg-[#a3b18a]'
        : status === 'MONITORING'
          ? 'bg-[#c96a3d]'
          : 'bg-[#6b635c]'
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
}

function DamageControlPanel({ protocols }: { protocols: ProtocolState[] }) {
  return (
    <section className={PANEL}>
      <div className="border-b border-[#1f1b18] px-5 py-3">
        <h2 className={SECTION_LABEL}>Damage Control</h2>
        <p className="mt-1 text-[11px] text-[#6b635c]">
          Protocols activate from simulated risk thresholds
        </p>
      </div>
      <div className="max-h-[28rem] overflow-y-auto">
        {protocols.map((p) => (
          <div key={p.id} className="border-b border-[#1f1b18] px-5 py-3 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <StatusDot status={p.status} />
                <p className="text-[11px] font-semibold tracking-[0.08em] text-[#f2ebe3]">
                  {p.name}
                </p>
              </div>
              <span
                className={`${NUM} text-[10px] font-medium tracking-wide ${protocolStatusColor(p.status)}`}
              >
                {protocolStatusLabel(p.status)}
              </span>
            </div>
            {(p.status === 'ACTIVE' || p.status === 'COMPLETED') && (
              <div className="mt-1.5 space-y-0.5 pl-4 text-[10px] leading-relaxed text-[#6b635c]">
                <p>
                  Trigger: <span className="text-[#9a9086]">{p.trigger}</span>
                </p>
                <p>
                  Action: <span className="text-[#9a9086]">{p.action}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function PriceFeedPanel({ feeds }: { feeds: ReturnType<typeof computePriceFeeds> }) {
  return (
    <section className={`${PANEL} p-5`}>
      <h2 className={`${SECTION_LABEL} mb-3`}>Price Feed Health</h2>
      <div className="mb-3 grid grid-cols-3 gap-px bg-[#1f1b18]">
        {[
          ['Feed A', feeds.feedA],
          ['Feed B', feeds.feedB],
          ['Feed C', feeds.feedC],
        ].map(([name, price]) => (
          <div key={String(name)} className="bg-[#151210] px-3 py-2.5 text-center">
            <p className="text-[9px] tracking-wide text-[#6b635c] uppercase">{name}</p>
            <p className={`${NUM} mt-1 text-sm font-semibold text-[#f2ebe3]`}>{price}</p>
          </div>
        ))}
      </div>
      <div className={`${NUM} space-y-1.5 text-[12px]`}>
        <div className="flex justify-between">
          <span className="text-[#6b635c]">Average Price</span>
          <span className="text-[#c96a3d]">{feeds.average}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b635c]">Max Divergence</span>
          <span className={feeds.anomaly ? 'text-[#e07840]' : 'text-[#f2ebe3]'}>
            {feeds.maxDivergence}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b635c]">Feed Status</span>
          <span className={feeds.anomaly ? 'text-[#e07840]' : 'text-[#a3b18a]'}>
            {feeds.anomaly ? 'ANOMALY' : 'HEALTHY'}
          </span>
        </div>
      </div>
      {feeds.anomaly && (
        <div className="mt-3 rounded-sm border border-[#c96a3d]/35 bg-[#1a120c] px-3 py-2 text-[11px] text-[#e07840]">
          PRICE FEED ANOMALY — validation active; liquidations flagged for review
        </div>
      )}
    </section>
  )
}

function IncidentPanel({ protocols }: { protocols: ProtocolState[] }) {
  const active = protocols.filter((p) => p.status === 'ACTIVE' || p.status === 'COMPLETED')

  return (
    <section className="rounded-sm border border-[#c43c2b]/40 bg-[#151210]/95 p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-[#c43c2b]/20 pb-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#c43c2b] uppercase">
            Crisis Mode
          </p>
          <p className="font-display mt-1 text-2xl text-[#e05a45]">Active</p>
        </div>
        <p className="text-[10px] text-[#6b635c]">Simulated incident response</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-px bg-[#1f1b18] sm:grid-cols-3">
        {['Trading / Tech Ops', 'User Support', 'Communication'].map((team) => (
          <div key={team} className="bg-[#12100e] px-3 py-2.5 text-center">
            <p className="text-[9px] tracking-wide text-[#6b635c] uppercase">{team}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#c96a3d]">ACTIVE</p>
          </div>
        ))}
      </div>

      <p className={`${SECTION_LABEL} mb-2`}>Active Protocols</p>
      <ul className="space-y-0">
        {active.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 border-b border-[#1f1b18] py-2 text-[11px] text-[#f2ebe3] last:border-0"
          >
            <span className="h-1 w-1 rounded-full bg-[#c96a3d]" />
            {p.name}
          </li>
        ))}
      </ul>
    </section>
  )
}

function LiquidationCascadePanel({
  cascade,
  showProtection,
}: {
  cascade: ReturnType<typeof computeCascade>
  showProtection: boolean
}) {
  const steps = [
    'PRICE SHOCK',
    'MARGIN PRESSURE',
    'POSITIONS AT RISK',
    'LIQUIDATIONS',
    'SELLING PRESSURE',
    'CASCADE RISK',
  ]

  return (
    <section className={`${PANEL} p-5`}>
      <h2 className={`${SECTION_LABEL} mb-3`}>Liquidation Cascade</h2>

      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium tracking-wide ${
                showProtection ? 'text-[#c96a3d]' : 'text-[#e07840]'
              }`}
            >
              {step}
            </span>
            {i < steps.length - 1 && <span className="text-[#6b635c]">→</span>}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-sm border border-[#c96a3d]/25 bg-[#12100e] p-3">
          <p className="mb-2 text-[9px] font-semibold tracking-[0.12em] text-[#e07840] uppercase">
            Without Protection
          </p>
          <p className={`${NUM} text-[12px] text-[#f2ebe3]`}>{cascade.without.join(' → ')}</p>
        </div>
        <div
          className={`rounded-sm border p-3 ${
            showProtection
              ? 'border-[#c96a3d]/30 bg-[#12100e]'
              : 'border-[#2a2420] bg-[#12100e] opacity-50'
          }`}
        >
          <p className="mb-2 text-[9px] font-semibold tracking-[0.12em] text-[#c96a3d] uppercase">
            With Protection
          </p>
          <p className={`${NUM} text-[12px] text-[#f2ebe3]`}>
            {showProtection ? cascade.withShield.join(' → ') : '— awaiting protocols —'}
          </p>
        </div>
      </div>
    </section>
  )
}

function ProtocolImpactPanel({
  impact,
  visible,
}: {
  impact: ReturnType<typeof computeImpact>
  visible: boolean
}) {
  if (!visible) {
    return (
      <section className={`${PANEL} p-5`}>
        <h2 className={`${SECTION_LABEL} mb-2`}>Protocol Impact</h2>
        <p className="text-[13px] text-[#6b635c]">
          Before/after comparison appears as damage-control protocols activate.
        </p>
      </section>
    )
  }

  const rows: {
    label: string
    key: keyof typeof impact.without
    format: (v: number | string) => string
  }[] = [
    { label: 'Peak Risk', key: 'peakRisk', format: (v) => String(v) },
    {
      label: 'Liquidation Exposure',
      key: 'liquidationExposureCr',
      format: (v) => `₹${v} Cr`,
    },
    {
      label: 'Positions Liquidated',
      key: 'positionsLiquidated',
      format: (v) => String(v),
    },
    {
      label: 'Cascade Intensity',
      key: 'cascadeIntensity',
      format: (v) => String(v),
    },
    {
      label: 'Liquidity Stress',
      key: 'liquidityStress',
      format: (v) => `${v}%`,
    },
  ]

  return (
    <section className={`${PANEL} p-5`}>
      <h2 className={`${SECTION_LABEL} mb-1`}>Protocol Impact</h2>
      <p className="mb-3 text-[9px] font-semibold tracking-[0.14em] text-[#6b635c] uppercase">
        Simulated — Not Real Market Results
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-sm border border-[#c96a3d]/25 bg-[#12100e] p-3">
          <h3 className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-[#e07840] uppercase">
            Without MochaShield
          </h3>
          <ul className="space-y-1.5 text-[12px]">
            {rows.map((r) => (
              <li key={r.label} className="flex justify-between gap-2">
                <span className="text-[#6b635c]">{r.label}</span>
                <span className={`${NUM} font-medium text-[#e07840]`}>
                  {r.format(impact.without[r.key])}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-[#2a2420] bg-[#12100e] p-3">
          <h3 className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-[#c96a3d] uppercase">
            With MochaShield
          </h3>
          <ul className="space-y-1.5 text-[12px]">
            {rows.map((r) => (
              <li key={r.label} className="flex justify-between gap-2">
                <span className="text-[#6b635c]">{r.label}</span>
                <span className={`${NUM} font-medium text-[#f2ebe3]`}>
                  {r.format(impact.withShield[r.key])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
