/** Simulated market risk model — demo only, not predictive of real markets. */

export type SystemStatus = 'NORMAL' | 'ELEVATED' | 'HIGH RISK' | 'CRISIS'

export type SimStage =
  | 'IDLE'
  | 'NORMAL'
  | 'VOLATILITY SPIKE'
  | 'LIQUIDITY STRESS'
  | 'LIQUIDATION PRESSURE'
  | 'CRISIS'
  | 'DAMAGE CONTROL'
  | 'STABILIZATION'

export type ProtocolStatus = 'STANDBY' | 'MONITORING' | 'ACTIVE' | 'COMPLETED'

export type ProtocolId =
  | 'leverageReduction'
  | 'marginBuffer'
  | 'highRiskEntry'
  | 'liquidationProtection'
  | 'liquidityMonitoring'
  | 'priceFeedValidation'
  | 'exposureControl'
  | 'incidentEscalation'

export type MarketConditions = {
  marketPriceShock: number // 0 to -30
  volatilitySpike: number // 0 to 300
  liquidityDrop: number // 0 to -80
  tradingVolumeSpike: number // 0 to 400
  bidAskSpreadIncrease: number // 0 to 500
  longExposure: number // 20 to 90
  averageLeverage: number // 1 to 20
  positionsNearLiquidation: number // 0 to 50
  priceFeedDivergence: number // 0 to 5
  openInterestChange: number // -50 to 100
}

export type RiskBreakdown = {
  market: number
  liquidity: number
  leverage: number
  liquidation: number
  concentration: number
  priceFeed: number
  overall: number
  status: SystemStatus
}

export type ProtocolState = {
  id: ProtocolId
  name: string
  status: ProtocolStatus
  trigger: string
  action: string
}

export type CascadeSeries = {
  without: number[]
  withShield: number[]
}

export type ImpactMetrics = {
  peakRisk: number
  liquidationExposureCr: number
  positionsLiquidated: number
  cascadeIntensity: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE'
  liquidityStress: number
}

export type PriceFeeds = {
  feedA: number
  feedB: number
  feedC: number
  average: number
  maxDivergence: number
  anomaly: boolean
}

export const DEFAULT_CONDITIONS: MarketConditions = {
  marketPriceShock: -10,
  volatilitySpike: 80,
  liquidityDrop: -35,
  tradingVolumeSpike: 120,
  bidAskSpreadIncrease: 90,
  longExposure: 62,
  averageLeverage: 10,
  positionsNearLiquidation: 12,
  priceFeedDivergence: 0.4,
  openInterestChange: 25,
}

export const STAGE_TIMELINE: { atMs: number; stage: SimStage }[] = [
  { atMs: 0, stage: 'NORMAL' },
  { atMs: 2000, stage: 'VOLATILITY SPIKE' },
  { atMs: 4000, stage: 'LIQUIDITY STRESS' },
  { atMs: 6000, stage: 'LIQUIDATION PRESSURE' },
  { atMs: 8000, stage: 'CRISIS' },
  { atMs: 10000, stage: 'DAMAGE CONTROL' },
  { atMs: 12000, stage: 'STABILIZATION' },
]

export const SIM_DURATION_MS = 15000

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function round(n: number) {
  return Math.round(n)
}

/** Stage intensity 0–1 before damage control, then eases during stabilization. */
export function stageIntensity(stage: SimStage): number {
  switch (stage) {
    case 'IDLE':
      return 0
    case 'NORMAL':
      return 0.15
    case 'VOLATILITY SPIKE':
      return 0.4
    case 'LIQUIDITY STRESS':
      return 0.6
    case 'LIQUIDATION PRESSURE':
      return 0.8
    case 'CRISIS':
      return 1
    case 'DAMAGE CONTROL':
      return 0.85
    case 'STABILIZATION':
      return 0.55
  }
}

export function applyStageToConditions(
  base: MarketConditions,
  stage: SimStage,
): MarketConditions {
  const t = stageIntensity(stage)
  const shockAmp = 1 + t * 1.4
  const volAmp = 1 + t * 1.8
  const liqAmp = 1 + t * 1.2
  const feedAmp = 1 + t * 3

  return {
    marketPriceShock: clamp(base.marketPriceShock * shockAmp, -30, 0),
    volatilitySpike: clamp(base.volatilitySpike * volAmp, 0, 300),
    liquidityDrop: clamp(base.liquidityDrop * liqAmp, -80, 0),
    tradingVolumeSpike: clamp(base.tradingVolumeSpike * (1 + t), 0, 400),
    bidAskSpreadIncrease: clamp(base.bidAskSpreadIncrease * (1 + t * 1.5), 0, 500),
    longExposure: clamp(base.longExposure + t * 8, 20, 90),
    averageLeverage: clamp(base.averageLeverage, 1, 20),
    positionsNearLiquidation: clamp(
      base.positionsNearLiquidation * (1 + t * 2.2),
      0,
      50,
    ),
    priceFeedDivergence: clamp(base.priceFeedDivergence * feedAmp, 0, 5),
    openInterestChange: clamp(base.openInterestChange + t * 40, -50, 100),
  }
}

export function computeRisk(c: MarketConditions): RiskBreakdown {
  const market = clamp(
    Math.abs(c.marketPriceShock) * 2.2 +
      c.volatilitySpike * 0.18 +
      c.tradingVolumeSpike * 0.05 +
      Math.max(0, c.openInterestChange) * 0.12,
    0,
    100,
  )

  const liquidity = clamp(
    Math.abs(c.liquidityDrop) * 0.9 + c.bidAskSpreadIncrease * 0.08,
    0,
    100,
  )

  const leverage = clamp((c.averageLeverage / 20) * 100, 0, 100)

  const liquidation = clamp(c.positionsNearLiquidation * 1.8, 0, 100)

  const concentration = clamp(Math.abs(c.longExposure - 50) * 2.2, 0, 100)

  const priceFeed = clamp(c.priceFeedDivergence * 18, 0, 100)

  const overall = clamp(
    market * 0.22 +
      liquidity * 0.2 +
      leverage * 0.18 +
      liquidation * 0.2 +
      concentration * 0.1 +
      priceFeed * 0.1,
    0,
    100,
  )

  const status: SystemStatus =
    overall >= 80 ? 'CRISIS' : overall >= 60 ? 'HIGH RISK' : overall >= 40 ? 'ELEVATED' : 'NORMAL'

  return {
    market: round(market),
    liquidity: round(liquidity),
    leverage: round(leverage),
    liquidation: round(liquidation),
    concentration: round(concentration),
    priceFeed: round(priceFeed),
    overall: round(overall),
    status,
  }
}

const PROTOCOL_META: Record<
  ProtocolId,
  { name: string; trigger: string; action: string }
> = {
  leverageReduction: {
    name: 'LEVERAGE REDUCTION',
    trigger: 'Platform risk > 60',
    action: 'Maximum simulated leverage reduced from 10x → 5x',
  },
  marginBuffer: {
    name: 'MARGIN BUFFER',
    trigger: 'Volatility spike > 100% or market risk > 55',
    action: 'Required margin increased during high volatility',
  },
  highRiskEntry: {
    name: 'HIGH-RISK ENTRY CONTROL',
    trigger: 'Liquidity stress > 60',
    action: 'New high-risk positions restricted',
  },
  liquidationProtection: {
    name: 'LIQUIDATION PROTECTION',
    trigger: 'Positions near liquidation > 15% or liquidation risk > 50',
    action: 'Positions approaching liquidation prioritized for monitoring',
  },
  liquidityMonitoring: {
    name: 'LIQUIDITY MONITORING',
    trigger: 'Bid-ask spread increase > 100% or liquidity drop > 40%',
    action: 'Abnormal spread and liquidity deterioration flagged',
  },
  priceFeedValidation: {
    name: 'PRICE-FEED VALIDATION',
    trigger: 'Feed divergence > 1%',
    action: 'Affected liquidations flagged for review',
  },
  exposureControl: {
    name: 'EXPOSURE CONTROL',
    trigger: 'Long exposure > 70% or concentration risk > 45',
    action: 'Excessive directional concentration flagged',
  },
  incidentEscalation: {
    name: 'INCIDENT ESCALATION',
    trigger: 'Status moves NORMAL → ELEVATED → HIGH RISK → CRISIS',
    action: 'Incident response teams automatically escalated',
  },
}

export function evaluateProtocols(
  risk: RiskBreakdown,
  conditions: MarketConditions,
  stage: SimStage,
): ProtocolState[] {
  const inDamageControl = stage === 'DAMAGE CONTROL' || stage === 'STABILIZATION'
  const monitoringFloor = stageIntensity(stage) >= 0.15

  const checks: { id: ProtocolId; shouldActivate: boolean; shouldMonitor: boolean }[] = [
    {
      id: 'leverageReduction',
      shouldActivate: risk.overall > 60,
      shouldMonitor: risk.overall > 40 || monitoringFloor,
    },
    {
      id: 'marginBuffer',
      shouldActivate: conditions.volatilitySpike > 100 || risk.market > 55,
      shouldMonitor: conditions.volatilitySpike > 50 || monitoringFloor,
    },
    {
      id: 'highRiskEntry',
      shouldActivate: risk.liquidity > 60,
      shouldMonitor: risk.liquidity > 35 || monitoringFloor,
    },
    {
      id: 'liquidationProtection',
      shouldActivate: conditions.positionsNearLiquidation > 15 || risk.liquidation > 50,
      shouldMonitor: conditions.positionsNearLiquidation > 8 || monitoringFloor,
    },
    {
      id: 'liquidityMonitoring',
      shouldActivate:
        conditions.bidAskSpreadIncrease > 100 || Math.abs(conditions.liquidityDrop) > 40,
      shouldMonitor: conditions.bidAskSpreadIncrease > 40 || monitoringFloor,
    },
    {
      id: 'priceFeedValidation',
      shouldActivate: conditions.priceFeedDivergence > 1,
      shouldMonitor: conditions.priceFeedDivergence > 0.5 || monitoringFloor,
    },
    {
      id: 'exposureControl',
      shouldActivate: conditions.longExposure > 70 || risk.concentration > 45,
      shouldMonitor: conditions.longExposure > 60 || monitoringFloor,
    },
    {
      id: 'incidentEscalation',
      shouldActivate: risk.status === 'CRISIS' || risk.status === 'HIGH RISK',
      shouldMonitor: risk.status !== 'NORMAL' || monitoringFloor,
    },
  ]

  return checks.map(({ id, shouldActivate, shouldMonitor }) => {
    const meta = PROTOCOL_META[id]
    let status: ProtocolStatus = 'STANDBY'
    if (inDamageControl && shouldActivate) status = 'COMPLETED'
    else if (shouldActivate) status = 'ACTIVE'
    else if (shouldMonitor) status = 'MONITORING'

    let action = meta.action
    if (id === 'leverageReduction' && shouldActivate) {
      const from = Math.round(conditions.averageLeverage)
      const to = Math.max(1, Math.round(from * 0.5))
      action = `Maximum simulated leverage reduced from ${from}x → ${to}x`
    }

    return {
      id,
      name: meta.name,
      status,
      trigger: meta.trigger,
      action,
    }
  })
}

export function computeCascade(
  risk: RiskBreakdown,
  conditions: MarketConditions,
  protocolsActive: number,
): CascadeSeries {
  const base = 80 + Math.abs(conditions.marketPriceShock) * 3 + risk.liquidation * 0.4
  const growthWithout = 1.35 + conditions.averageLeverage / 40
  const growthWith = Math.max(1.08, growthWithout - protocolsActive * 0.04 - 0.18)

  const without: number[] = []
  const withShield: number[] = []
  let w = base
  let s = base
  for (let i = 0; i < 4; i++) {
    without.push(round(w))
    withShield.push(round(s))
    w *= growthWithout
    s *= growthWith
  }
  return { without, withShield }
}

function cascadeIntensity(peakLiqs: number): ImpactMetrics['cascadeIntensity'] {
  if (peakLiqs >= 300) return 'SEVERE'
  if (peakLiqs >= 200) return 'HIGH'
  if (peakLiqs >= 140) return 'MODERATE'
  return 'LOW'
}

export function computeImpact(
  risk: RiskBreakdown,
  conditions: MarketConditions,
  cascade: CascadeSeries,
  protocolsActive: number,
): { without: ImpactMetrics; withShield: ImpactMetrics } {
  const peakWithout = clamp(risk.overall + 8 + Math.abs(conditions.marketPriceShock) * 0.4, 0, 99)
  const reduction = clamp(0.12 + protocolsActive * 0.035, 0.12, 0.35)
  const peakWith = clamp(peakWithout * (1 - reduction), 0, 99)

  const exposureBase =
    0.8 +
    (conditions.averageLeverage / 20) * 1.6 +
    (conditions.positionsNearLiquidation / 50) * 1.2 +
    Math.abs(conditions.marketPriceShock) / 30

  const withoutExposure = Math.round(exposureBase * 100) / 100
  const withExposure = Math.round(withoutExposure * (1 - reduction * 1.1) * 100) / 100

  const liqWithout = cascade.without[cascade.without.length - 1]
  const liqWith = cascade.withShield[cascade.withShield.length - 1]

  const liqStressWithout = clamp(risk.liquidity + 10, 0, 100)
  const liqStressWith = clamp(liqStressWithout * (1 - reduction * 0.9), 0, 100)

  return {
    without: {
      peakRisk: round(peakWithout),
      liquidationExposureCr: withoutExposure,
      positionsLiquidated: liqWithout,
      cascadeIntensity: cascadeIntensity(liqWithout),
      liquidityStress: round(liqStressWithout),
    },
    withShield: {
      peakRisk: round(peakWith),
      liquidationExposureCr: withExposure,
      positionsLiquidated: liqWith,
      cascadeIntensity: cascadeIntensity(liqWith),
      liquidityStress: round(liqStressWith),
    },
  }
}

export function computePriceFeeds(
  basePrice: number,
  divergencePct: number,
): PriceFeeds {
  const d = divergencePct / 100
  const feedA = Math.round(basePrice * (1 + d * 0.4) * 100) / 100
  const feedB = Math.round(basePrice * 100) / 100
  const feedC = Math.round(basePrice * (1 - d * 0.55) * 100) / 100
  const average = Math.round(((feedA + feedB + feedC) / 3) * 100) / 100
  const maxDivergence =
    Math.round(
      (Math.max(Math.abs(feedA - average), Math.abs(feedB - average), Math.abs(feedC - average)) /
        average) *
        10000,
    ) / 100

  return {
    feedA,
    feedB,
    feedC,
    average,
    maxDivergence,
    anomaly: divergencePct > 1,
  }
}

export function effectiveLeverageAfterProtocols(
  leverage: number,
  protocols: ProtocolState[],
): number {
  const active = protocols.find(
    (p) =>
      p.id === 'leverageReduction' &&
      (p.status === 'ACTIVE' || p.status === 'COMPLETED'),
  )
  if (!active) return leverage
  return Math.max(1, Math.round(leverage * 0.5))
}

export function statusStyles(status: SystemStatus): string {
  switch (status) {
    case 'NORMAL':
      return 'border-[#2a2420] text-[#9a9086] bg-[#12100e]'
    case 'ELEVATED':
      return 'border-[#c96a3d]/45 text-[#e07840] bg-[#161210]'
    case 'HIGH RISK':
      return 'border-[#d97706]/55 text-[#e07840] bg-[#1a120c]'
    case 'CRISIS':
      return 'border-[#c43c2b]/55 text-[#e05a45] bg-[#1a0e0c]'
  }
}

export function protocolStatusLabel(status: ProtocolStatus): string {
  switch (status) {
    case 'STANDBY':
      return 'STANDBY'
    case 'MONITORING':
      return 'MONITORING'
    case 'ACTIVE':
      return 'ACTIVE'
    case 'COMPLETED':
      return 'COMPLETED'
  }
}

export function protocolStatusColor(status: ProtocolStatus): string {
  switch (status) {
    case 'STANDBY':
      return 'text-[#6b635c]'
    case 'MONITORING':
      return 'text-[#c96a3d]'
    case 'ACTIVE':
      return 'text-[#e07840]'
    case 'COMPLETED':
      return 'text-[#a3b18a]'
  }
}
