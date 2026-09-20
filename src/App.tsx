import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { SimulationProvider } from './context/SimulationContext'
import { IncidentsPage } from './pages/IncidentsPage'
import { MarketsPage } from './pages/MarketsPage'
import { OverviewPage } from './pages/OverviewPage'
import { RiskPage } from './pages/RiskPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <SimulationProvider>
      <BrowserRouter basename={basename === '/' ? undefined : basename}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="markets" element={<MarketsPage />} />
            <Route path="risk" element={<RiskPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  )
}
