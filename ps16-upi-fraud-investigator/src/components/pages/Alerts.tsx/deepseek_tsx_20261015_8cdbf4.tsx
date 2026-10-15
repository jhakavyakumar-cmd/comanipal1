import { Link } from 'react-router-dom'
import { useApp } from '../store'
import RiskBadge from '../components/RiskBadge'

const STATUSES = ['New','Investigating','Confirmed','Reviewed','Dismissed','Needs More Evidence']

export default function Alerts() {
  const { alerts, decisions, updateDecision } = useApp()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Alerts</h1>
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Account</th><th>Score</th><th>Risk</th><th>Status</th>
              <th>Evidence</th><th></th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => {
              const d = decisions[a.account_id]
              const status = d?.status || a.status
              return (
                <tr key={a.id}>
                  <td><Link className="text-cyan-300" to={`/account/${a.account_id}`}>{a.account_id}</Link></td>
                  <td>{a.score}</td>
                  <td><RiskBadge level={a.level} /></td>
                  <td>
                    <select className="input" value={status}
                      onChange={e => updateDecision(a.account_id, e.target.value as any, d?.note || '', d?.confirmed || false)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="max-w-lg text-xs text-slate-400">{a.evidence.slice(0, 3).join('; ')}</td>
                  <td><Link className="text-cyan-300" to={`/account/${a.account_id}`}>Open</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!alerts.length && <div className="text-slate-400 p-3">No alerts.</div>}
      </div>
    </div>
  )
}