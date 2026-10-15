import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store'
import RiskBadge from '../components/RiskBadge'

export default function Accounts() {
  const { data, scores } = useApp()
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [status, setStatus] = useState('')

  const scoreMap = new Map(scores.map(s => [s.account_id, s]))
  const rows = data.accounts.filter(a => {
    const s = scoreMap.get(a.account_id)
    const matchQ =
      a.account_id.toLowerCase().includes(q.toLowerCase()) ||
      a.home_region.toLowerCase().includes(q.toLowerCase())
    const matchL = !level || s?.level === level
    const matchS = !status || a.account_status === status
    return matchQ && matchL && matchS
  }).slice(0, 500)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <div className="flex flex-wrap gap-3">
        <input className="input w-72" placeholder="Search account / region" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All risk</option>
          <option>Clean</option><option>Low Risk</option><option>Moderate Risk</option><option>High Risk</option>
        </select>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option>ACTIVE</option><option>NEW</option><option>DORMANT</option>
        </select>
      </div>
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Account</th><th>Type</th><th>Segment</th><th>Region</th>
              <th>Status</th><th>Score</th><th>Risk</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(a => {
              const s = scoreMap.get(a.account_id)
              return (
                <tr key={a.account_id}>
                  <td>{a.account_id}</td>
                  <td>{a.account_type}</td>
                  <td>{a.customer_segment}</td>
                  <td>{a.home_region}</td>
                  <td>{a.account_status}</td>
                  <td>{s?.total ?? 0}</td>
                  <td><RiskBadge level={s?.level || 'Clean'} /></td>
                  <td><Link className="text-cyan-300" to={`/account/${a.account_id}`}>Investigate</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}