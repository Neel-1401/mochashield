import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { basePrice, ASSET_SHOCK_MULT, TICKERS, type Ticker } from '../data/mockMarket'
import {
  applyStageToConditions,
  buildRiskTriggers,
  computeAssetSnapshot,
  computeCascade,
  computeImpact,
  computePriceFeeds,
  computeRisk,
  DEFAULT_CONDITIONS,
  evaluateProtocols,
  formatSimClock,
  SIM_DURATION_MS,
  STAGE_TIMELINE,
  stageIncidentMessages,
  type IncidentEvent,
  type MarketConditions,
  type ProtocolId,
  type SimStage,
  type SystemStatus,
} from '../lib/simulation'

export type IncidentStatus = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'RESOLVED'

type SimulationContextValue = {
  conditions: MarketConditions
  liveConditions: MarketConditions
  stage: SimStage
  stageLabel: string
  simulating: boolean
  paused: boolean
  showImpact: boolean
  crashed: boolean
  ticker: Ticker
  setTicker: (t: Ticker) => void
  conditionsOpen: boolean
  setConditionsOpen: (v: boolean | ((p: boolean) => boolean)) => void
  risk: ReturnType<typeof computeRisk>
  protocols: ReturnType<typeof evaluateProtocols>
  activeProtocolCount: number
  cascade: ReturnType<typeof computeCascade>
  impact: ReturnType<typeof computeImpact>
  feeds: ReturnType<typeof computePriceFeeds>
  assets: ReturnType<typeof computeAssetSnapshot>[]
  riskTriggers: ReturnType<typeof buildRiskTriggers>
  incidentEvents: IncidentEvent[]
  incidentStatus: IncidentStatus
  displayStatus: SystemStatus
  isCrisis: boolean
  shortExposure: number
  updateCondition: <K extends keyof MarketConditions>(key: K, value: number) => void
  simulate: () => void
  reset: () => void
  pauseSimulation: () => void
  resumeSimulation: () => void
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [conditions, setConditions] = useState<MarketConditions>(DEFAULT_CONDITIONS)
  const [stage, setStage] = useState<SimStage>('IDLE')
  const [simulating, setSimulating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showImpact, setShowImpact] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [ticker, setTicker] = useState<Ticker>('S&P 500')
  const [conditionsOpen, setConditionsOpen] = useState(true)
  const [incidentEvents, setIncidentEvents] = useState<IncidentEvent[]>([])
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>('IDLE')

  const timersRef = useRef<number[]>([])
  const wallStartRef = useRef(0)
  const elapsedBaseRef = useRef(0)
  const loggedProtocolsRef = useRef<Set<ProtocolId>>(new Set())
  const eventSeqRef = useRef(0)

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

  const assets = useMemo(
    () =>
      TICKERS.map((t) =>
        computeAssetSnapshot(t, basePrice(t), ASSET_SHOCK_MULT[t], liveConditions, crashed),
      ),
    [liveConditions, crashed],
  )

  const riskTriggers = useMemo(
    () => buildRiskTriggers(risk, liveConditions),
    [risk, liveConditions],
  )

  const shortExposure = Math.round(100 - liveConditions.longExposure)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const pushEvent = useCallback((atMs: number, message: string) => {
    eventSeqRef.current += 1
    const id = `evt-${eventSeqRef.current}`
    setIncidentEvents((prev) => {
      if (prev.some((e) => e.message === message && Math.abs(e.atMs - atMs) < 500)) return prev
      return [
        ...prev,
        { id, atMs, clock: formatSimClock(atMs), message },
      ]
    })
  }, [])

  const scheduleFrom = useCallback(
    (elapsedMs: number) => {
      clearTimers()

      STAGE_TIMELINE.forEach(({ atMs, stage: next }) => {
        if (atMs <= elapsedMs) return
        const id = window.setTimeout(() => {
          setStage(next)
          stageIncidentMessages(next).forEach((msg) => pushEvent(atMs, msg))
        }, atMs - elapsedMs)
        timersRef.current.push(id)
      })

      if (SIM_DURATION_MS > elapsedMs) {
        const doneId = window.setTimeout(() => {
          setSimulating(false)
          setPaused(false)
          setShowImpact(true)
          setStage('STABILIZATION')
          setIncidentStatus('RESOLVED')
          pushEvent(SIM_DURATION_MS, 'Incident marked resolved')
        }, SIM_DURATION_MS - elapsedMs)
        timersRef.current.push(doneId)
      }
    },
    [clearTimers, pushEvent],
  )

  const getElapsed = useCallback(() => {
    if (paused) return elapsedBaseRef.current
    if (!simulating) return elapsedBaseRef.current
    return elapsedBaseRef.current + (Date.now() - wallStartRef.current)
  }, [paused, simulating])

  const reset = useCallback(() => {
    clearTimers()
    setSimulating(false)
    setPaused(false)
    setShowImpact(false)
    setCrashed(false)
    setStage('IDLE')
    setConditions(DEFAULT_CONDITIONS)
    setIncidentEvents([])
    setIncidentStatus('IDLE')
    elapsedBaseRef.current = 0
    wallStartRef.current = 0
    loggedProtocolsRef.current = new Set()
    eventSeqRef.current = 0
  }, [clearTimers])

  const simulate = useCallback(() => {
    if (simulating) return
    clearTimers()
    loggedProtocolsRef.current = new Set()
    eventSeqRef.current = 0
    setSimulating(true)
    setPaused(false)
    setShowImpact(false)
    setCrashed(true)
    setStage('NORMAL')
    setIncidentStatus('ACTIVE')
    setIncidentEvents([])
    elapsedBaseRef.current = 0
    wallStartRef.current = Date.now()
    pushEvent(0, 'Flash crash simulation started')
    pushEvent(0, 'Market shock detected')
    scheduleFrom(0)
  }, [simulating, clearTimers, pushEvent, scheduleFrom])

  const pauseSimulation = useCallback(() => {
    if (!simulating || paused) return
    elapsedBaseRef.current = getElapsed()
    clearTimers()
    setPaused(true)
    setIncidentStatus('PAUSED')
    pushEvent(elapsedBaseRef.current, 'Simulation paused')
  }, [simulating, paused, getElapsed, clearTimers, pushEvent])

  const resumeSimulation = useCallback(() => {
    if (!simulating || !paused) return
    wallStartRef.current = Date.now()
    setPaused(false)
    setIncidentStatus('ACTIVE')
    pushEvent(elapsedBaseRef.current, 'Simulation resumed')
    scheduleFrom(elapsedBaseRef.current)
  }, [simulating, paused, pushEvent, scheduleFrom])

  // Log protocol activations as incident events
  useEffect(() => {
    if (stage === 'IDLE') return
    const elapsed = getElapsed()
    protocols.forEach((p) => {
      if (
        (p.status === 'ACTIVE' || p.status === 'COMPLETED') &&
        !loggedProtocolsRef.current.has(p.id)
      ) {
        loggedProtocolsRef.current.add(p.id)
        pushEvent(elapsed, `${p.name} activated`)
      }
    })
  }, [protocols, stage, getElapsed, pushEvent])

  const updateCondition = useCallback(
    <K extends keyof MarketConditions>(key: K, value: number) => {
      if (simulating) return
      setConditions((prev) => ({ ...prev, [key]: value }))
    },
    [simulating],
  )

  const displayStatus: SystemStatus = risk.status
  const stageLabel = stage === 'IDLE' ? 'READY' : stage
  const isCrisis =
    displayStatus === 'CRISIS' || stage === 'DAMAGE CONTROL' || stage === 'STABILIZATION'

  const value: SimulationContextValue = {
    conditions,
    liveConditions,
    stage,
    stageLabel,
    simulating,
    paused,
    showImpact,
    crashed,
    ticker,
    setTicker,
    conditionsOpen,
    setConditionsOpen,
    risk,
    protocols,
    activeProtocolCount,
    cascade,
    impact,
    feeds,
    assets,
    riskTriggers,
    incidentEvents,
    incidentStatus,
    displayStatus,
    isCrisis,
    shortExposure,
    updateCondition,
    simulate,
    reset,
    pauseSimulation,
    resumeSimulation,
  }

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}
