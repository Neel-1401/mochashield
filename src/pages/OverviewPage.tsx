import { MarketChart } from '../components/MarketChart'
import { useSimulation } from '../context/SimulationContext'
import { displayPrice, type Ticker } from '../data/mockMarket'
import {
  protocolStatusColor,
  protocolStatusLabel,
  statusStyles,
  type MarketConditions,
  type ProtocolState,
} from '../lib/simulation'
import { NUM, PANEL, SECTION_LABEL } from '../lib/theme'

export function OverviewPage() {
  const sim = useSimulation()

  const riskScoreColor =
    sim.risk.overall >= 80
      ? 'text-[#c43c2b]'
      : sim.risk.overall >= 60
        ? 'text-[#e07840]'
        : sim.risk.overall >= 40
          ? 'text-[#c96a3d]'
          : 'text-[#f2ebe3]'

  return (
    <>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl leading-tight text-[#f2ebe3] md:text-5xl">
          Market risk &amp; crash response
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#9a9086]">
          Simulated platform stress, protocol activation, and damage control — for demonstration
          only.
        </p>
      </header>

      <TickerStrip />

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className={`lg:col-span-4 ${PANEL} p-5`}>
          <p className={SECTION_LABEL}>Platform Risk</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className={`${NUM} text-6xl font-semibold leading-none tracking-tight ${riskScoreColor}`}>
              {sim.risk.overall}
              <span className="ml-1 text-xl font-medium text-[#6b635c]">/ 100</span>
            </p>
            <span
              className={`rounded-sm border px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles(sim.displayStatus)}`}
            >
              {sim.displayStatus}
            </span>
          </div>
          <div className="mt-5 h-[2px] w-full bg-[#1f1b18]">
            <div
              className={`h-full transition-all duration-500 ${
                sim.risk.overall >= 80
                  ? 'bg-[#c43c2b]'
                  : sim.risk.overall >= 40
                    ? 'bg-[#c96a3d]'
                    : 'bg-[#6b635c]'
              }`}
              style={{ width: `${sim.risk.overall}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-8">
          <MetricCell
            label="Market Volatility"
            value={`+${Math.round(sim.liveConditions.volatilitySpike)}%`}
            tone={sim.liveConditions.volatilitySpike >= 150 ? 'warn' : 'ok'}
          />
          <MetricCell
            label="Liquidity Stress"
            value={`${Math.round(sim.liveConditions.liquidityDrop)}%`}
            tone={Math.abs(sim.liveConditions.liquidityDrop) >= 50 ? 'warn' : 'ok'}
          />
          <MetricCell
            label="Positions at Risk"
            value={`${Math.round(sim.liveConditions.positionsNearLiquidation)}%`}
            tone={
              sim.liveConditions.positionsNearLiquidation >= 25
                ? 'crisis'
                : sim.liveConditions.positionsNearLiquidation >= 12
                  ? 'warn'
                  : 'ok'
            }
          />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MarketChart
            selected={sim.ticker}
            onSelect={sim.setTicker}
            crashed={sim.crashed}
            shockPct={sim.liveConditions.marketPriceShock}
          />
        </div>
        <div className="lg:col-span-2">
          <MarketConditionsPanel
            conditions={sim.conditions}
            live={sim.liveConditions}
            open={sim.conditionsOpen}
            onToggle={() => sim.setConditionsOpen((o) => !o)}
            onChange={sim.updateCondition}
            disabled={sim.simulating}
            simulating={sim.simulating}
            paused={sim.paused}
            onSimulate={sim.simulate}
            onReset={sim.reset}
            stage={sim.stageLabel}
          />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RiskEnginePanel risk={sim.risk} />
        <DamageControlPanel protocols={sim.protocols} />
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <PriceFeedPanel feeds={sim.feeds} />
        {sim.isCrisis && <IncidentPanel protocols={sim.protocols} />}
        {!sim.isCrisis && (
          <section className={`${PANEL} p-5`}>
            <h2 className={`${SECTION_LABEL} mb-2`}>Incident Response</h2>
            <p className="text-[13px] text-[#6b635c]">
              Activates automatically when status reaches CRISIS.
            </p>
          </section>
        )}
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <LiquidationCascadePanel
          cascade={sim.cascade}
          showProtection={
            sim.activeProtocolCount > 0 &&
            (sim.stage === 'DAMAGE CONTROL' ||
              sim.stage === 'STABILIZATION' ||
              sim.showImpact ||
              sim.displayStatus === 'CRISIS')
          }
        />
        <ProtocolImpactPanel
          impact={sim.impact}
          visible={
            sim.showImpact ||
            sim.stage === 'DAMAGE CONTROL' ||
            sim.stage === 'STABILIZATION' ||
            sim.activeProtocolCount >= 3
          }
        />
      </section>
    </>
  )
}

function TickerStrip() {
  const { assets } = useSimulation()

  return (
    <div className="mb-6 flex gap-0 overflow-x-auto rounded-sm border border-[#2a2420] bg-[#12100e]/70">
      {assets.map((item) => {
        const up = item.changePct >= 0
        return (
          <div
            key={item.ticker}
            className="min-w-[140px] flex-1 border-r border-[#1f1b18] px-4 py-3 last:border-r-0"
          >
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#9a9086] uppercase">
              {item.ticker}
            </p>
            <p className={`${NUM} mt-1 text-[15px] font-semibold text-[#f2ebe3]`}>
              {displayPrice(item.ticker as Ticker, item.price)}
            </p>
            <p className={`${NUM} text-[11px] ${up ? 'text-[#a3b18a]' : 'text-[#c43c2b]'}`}>
              {up ? '+' : ''}
              {item.changePct.toFixed(2)}%
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
  paused,
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
  paused: boolean
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
            {simulating ? (paused ? 'Paused' : 'Simulating…') : 'Simulate Flash Crash'}
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
          <p className={`${NUM} text-[10px] text-[#e07840]`}>
            {paused ? 'Paused' : 'Running'} — {stage}
          </p>
        )}
      </div>
    </section>
  )
}

function RiskBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-[#c43c2b]' : score >= 50 ? 'bg-[#c96a3d]' : 'bg-[#6b635c]'

  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="tracking-wide text-[#6b635c] uppercase">{label}</span>
        <span className={`${NUM} font-medium text-[#f2ebe3]`}>{score}</span>
      </div>
      <div className="h-[2px] overflow-hidden bg-[#1f1b18]">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function RiskEnginePanel({ risk }: { risk: ReturnType<typeof useSimulation>['risk'] }) {
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
                <p className="text-[11px] font-semibold tracking-[0.08em] text-[#f2ebe3]">{p.name}</p>
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

function PriceFeedPanel({ feeds }: { feeds: ReturnType<typeof useSimulation>['feeds'] }) {
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
  cascade: ReturnType<typeof useSimulation>['cascade']
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
  impact: ReturnType<typeof useSimulation>['impact']
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
