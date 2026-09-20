import { type ReactNode } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { NUM } from '../lib/theme'
import { statusStyles } from '../lib/simulation'

export type AppPage = 'overview' | 'markets' | 'risk' | 'incidents'

const NAV_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'markets', label: 'Markets' },
  { id: 'risk', label: 'Risk' },
  { id: 'incidents', label: 'Incidents' },
]

type LayoutProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  children: ReactNode
}

export function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const { stageLabel, displayStatus, isCrisis } = useSimulation()

  return (
    <div className={`app-shell ${isCrisis ? 'crisis-glow' : ''}`}>
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
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`text-[12px] transition-colors ${
                      isActive
                        ? 'text-[#f2ebe3]'
                        : 'text-[#6b635c] hover:text-[#9a9086]'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
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

      <div className="mx-auto max-w-[1440px] px-6 py-8">{children}</div>
    </div>
  )
}
