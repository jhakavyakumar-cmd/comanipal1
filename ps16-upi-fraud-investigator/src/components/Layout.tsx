import { Link, Outlet, useLocation } from 'react-router-dom'
import { resetData } from '../data/service'

const nav = [
  ['/', 'Overview'],
  ['/accounts', 'Accounts'],
  ['/alerts', 'Alerts'],
  ['/network', 'Network'],
  ['/rings', 'Rings'],
  ['/evaluation', 'Evaluation'],
  ['/rules', 'Scoring Rules'],
]

export default function Layout() {
  const loc = useLocation()
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <div className="text-lg font-semibold text-cyan-300 mb-1">PS16 Investigator</div>
        <div className="text-xs text-slate-500 mb-6">UPI Fraud-Ring Graph</div>
        <nav className="space-y-1 flex-1">
          {nav.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded-lg text-sm ${
                loc.pathname === to ? 'bg-cyan-600/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button className="btn text-xs" onClick={resetData}>Reset synthetic data</button>
      </aside>
      <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
    </div>
  )
}