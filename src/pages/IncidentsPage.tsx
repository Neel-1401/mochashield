import { useSimulation } from '../context/SimulationContext'
import {
  protocolStatusColor,
  protocolStatusLabel,
  statusStyles,
  type SystemStatus,
} from '../lib/simulation'
import { NUM, PANEL, SECTION_LABEL } from '../lib/theme'

const SEVERITIES: SystemStatus[] = ['NORMAL', 'ELEVATED', 'HIGH RISK', 'CRISIS']

export function IncidentsPage() {
  const {
    incidentEvents,
    incidentStatus,
    protocols,
    displayStatus,
    simulating,
    paused,
    pauseSimulation,
    resumeSimulation,
    reset,
    simulate,
  } = useSimulation()

  const incidentLabel =
    incidentStatus === 'IDLE'
      ? 'NONE'
      : incidentStatus === 'RESOLVED'
        ? 'RESOLVED'
        : incidentStatus === 'PAUSED'
          ? 'PAUSED'
          : 'ACTIVE'

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[#f2ebe3]">Incident Response</h1>
          <p className="mt-2 text-[13px] text-[#9a9086]">
            Timeline and protocols from the shared flash-crash simulation.
          </p>
        </div>
      </header>

      <section className={`${PANEL} mb-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={SECTION_LABEL}>Current Incident</p>
            <h2 className="mt-2 text-xl font-semibold tracking-wide text-[#f2ebe3]">
              FLASH CRASH SIMULATION
            </h2>
            <p className="mt-2 text-[13px]">
              Status:{' '}
              <span
                className={
                  incidentLabel === 'ACTIVE'
                    ? 'font-semibold text-[#e07840]'
                    : incidentLabel === 'RESOLVED'
                      ? 'font-semibold text-[#a3b18a]'
                      : incidentLabel === 'PAUSED'
                        ? 'font-semibold text-[#c96a3d]'
                        : 'font-semibold text-[#6b635c]'
                }
              >
                {incidentLabel}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pauseSimulation}
              disabled={!simulating || paused}
              className="rounded-sm border border-[#2a2420] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-[#9a9086] uppercase transition hover:border-[#c96a3d]/40 hover:text-[#f2ebe3] disabled:opacity-40"
            >
              Pause Simulation
            </button>
            <button
              type="button"
              onClick={resumeSimulation}
              disabled={!simulating || !paused}
              className="rounded-sm border border-[#2a2420] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-[#9a9086] uppercase transition hover:border-[#c96a3d]/40 hover:text-[#f2ebe3] disabled:opacity-40"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-sm border border-[#2a2420] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-[#9a9086] uppercase transition hover:border-[#c96a3d]/40 hover:text-[#f2ebe3]"
            >
              Reset Incident
            </button>
            <button
              type="button"
              onClick={simulate}
              disabled={simulating}
              className="rounded-sm bg-[#c96a3d] px-3 py-2 text-[11px] font-bold tracking-[0.08em] text-[#0b0908] uppercase transition hover:bg-[#e07840] disabled:opacity-40"
            >
              Simulate Flash Crash
            </button>
          </div>
        </div>
      </section>

      <section className={`${PANEL} mb-4 p-5`}>
        <p className={`${SECTION_LABEL} mb-4`}>Incident Severity</p>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((s) => {
            const active = displayStatus === s
            return (
              <span
                key={s}
                className={`rounded-sm border px-3 py-1.5 text-[11px] font-semibold tracking-wide ${
                  active ? statusStyles(s) : 'border-[#2a2420] text-[#6b635c]'
                }`}
              >
                {s}
              </span>
            )
          })}
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={`${PANEL} p-5`}>
          <h2 className={`${SECTION_LABEL} mb-4`}>Event Timeline</h2>
          {incidentEvents.length === 0 ? (
            <p className="text-[13px] text-[#6b635c]">
              No incident events yet. Start a flash-crash simulation to populate the timeline.
            </p>
          ) : (
            <ul className="space-y-0">
              {incidentEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex gap-4 border-b border-[#1f1b18] py-3 last:border-0"
                >
                  <span className={`${NUM} shrink-0 text-[12px] text-[#c96a3d]`}>{e.clock}</span>
                  <span className="text-[13px] text-[#f2ebe3]">{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={PANEL}>
          <div className="border-b border-[#1f1b18] px-5 py-3">
            <h2 className={SECTION_LABEL}>Response Protocols</h2>
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            {protocols.map((p) => (
              <div key={p.id} className="border-b border-[#1f1b18] px-5 py-3 last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-[#f2ebe3]">
                    {p.name}
                  </p>
                  <span
                    className={`${NUM} text-[10px] font-medium ${protocolStatusColor(p.status)}`}
                  >
                    {protocolStatusLabel(p.status)}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-[#6b635c]">
                  <p>
                    <span className="tracking-wide uppercase">Trigger</span> —{' '}
                    <span className="text-[#9a9086]">{p.trigger}</span>
                  </p>
                  <p>
                    <span className="tracking-wide uppercase">Action</span> —{' '}
                    <span className="text-[#9a9086]">{p.action}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
