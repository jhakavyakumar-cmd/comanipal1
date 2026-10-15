import { Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Accounts from './pages/Accounts'
import AccountInvestigation from './pages/AccountInvestigation'
import Alerts from './pages/Alerts'
import Network from './pages/Network'
import Rings from './pages/Rings'
import Evaluation from './pages/Evaluation'
import ScoringRules from './pages/ScoringRules'

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/account/:id" element={<AccountInvestigation />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/network" element={<Network />} />
          <Route path="/rings" element={<Rings />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/rules" element={<ScoringRules />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}