import { useState } from 'react'
import { Layout, type AppPage } from './components/Layout'
import { SimulationProvider } from './context/SimulationContext'
import { IncidentsPage } from './pages/IncidentsPage'
import { MarketsPage } from './pages/MarketsPage'
import { OverviewPage } from './pages/OverviewPage'
import { RiskPage } from './pages/RiskPage'

function AppShell() {
  const [activePage, setActivePage] = useState<AppPage>('overview')

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'overview' && <OverviewPage />}
      {activePage === 'markets' && <MarketsPage />}
      {activePage === 'risk' && <RiskPage />}
      {activePage === 'incidents' && <IncidentsPage />}
    </Layout>
  )
}

export default function App() {
  return (
    <SimulationProvider>
      <AppShell />
    </SimulationProvider>
  )
}
