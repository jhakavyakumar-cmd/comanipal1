import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../store'
import RiskBadge from '../components/RiskBadge'
import GraphView from '../components/GraphView'
import { buildGraph } from '../graph/buildGraph'

export default function AccountInvestigation() {
  const { id = '' } = useParams()
  const { data, scores, decisions, updateDecision } = useApp()
  const account = data.accounts.find(a => a.account_id === id)
  const score = scores.find(s => s.account_id === id)
  const decision = decisions[id]

  const [note, setNote] = useState(decision?.note || '')
  const [status, setStatus] = useState(decision?.status || 'New')
  const [confirmed, setConfirmed] = useState(decision?.confirmed || false)

  const graph = useMemo(
    () => buildGraph(data, { focusAccount: id, hopDepth: 1, minAmount: 0 }),
    [data, id],
  )

  const tx = useMemo(() => data.transactions
    .filter(t => t.from_account === id || t.to_account === id)
    .sort((a, b) => b.event_time.localeCompare(a.event_time))
    .slice(0, 80), [data, id])

  const related = useMemo(() => {
    const s = new Set<string>()
    tx.forEach(t => {
      if (t.from_account !== id) s.add(t.from_account)
      if (t.to_account !== id) s.add(t.to_account)
    })
    return Array.from(s).slice(0, 20)
  }, [tx, id])

  const complaints = useMemo(
    () => data.complaints.filter(c => c.referenced_account === id),
    [data, id],
  )

  if (!account || !score) return <div className="text-slate-300">Account not found.</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-sm">
            <Link to="/accounts" className="text-cyan-300">Accounts</Link> / {account.account_id}
          </div>
          <h1 className="text-2xl font-semibold">{account.account_id}</h1>
          <div className="text-sm text-slate-400">
            {account.account_type} · {account.customer_segment} · {account.home_region} · {account.account_status}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{score.total}</div>
          <RiskBadge level={score.level} />
          <div className="text-xs text-slate-500 mt-1">Investigation priority only. Requires human review.</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <div className="font-medium mb-3">Risk Explanation</div>
          <div className="space-y-3">
            {score.signals.map(s => (
              <div key={s.code} className="border-b border-slate-800 pb-2">
                <div className="flex justify-between">
                  <span className="text-cyan-300">{s.code} · {s.label}</span>
                  <span>+{s.points}</span>
                </div>
                <div className="text-xs text-slate-500">{s.evidence}</div>
              </div>
            ))}
            {!score.signals.length && <div className="text-slate-400">No signals triggered. Score 0 / Clean.</div>}
          </div>
        </div>
        <div className="card">
          <div className="font-medium mb-3">Category Scores (capped)</div>
          {(['V','T','D','I','C','B','M'] as const).map(k => (
            <div key={k} className="flex justify-between text-sm">
              <span>{k}</span><span>{score.categoryScores[k] || 0}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between font-medium">
            <span>Total</span><span>{score.total}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-3">Interactive Graph (1 hop)</div>
        <GraphView elements={graph} height={520} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="font-medium mb-3">Chronological Timeline</div>
          <div className="max-h-96 overflow-auto space-y-1">
            {tx.map(t => (
              <div key={t.transaction_id} className="text-sm border-b border-slate-800 pb-1">
                <span className="text-slate-400">{t.event_time}</span> · {t.from_account} → {t.to_account} · ₹{t.amount}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="font-medium mb-3">Related Accounts</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {related.map(r => (
              <Link key={r} to={`/account/${r}`} className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">
                {r}
              </Link>
            ))}
          </div>
          <div className="font-medium mb-3">Evidence Links</div>
          <div className="text-sm space-y-1">
            {score.signals.map(s => (
              <div key={s.code} className="text-slate-300">
                <span className="text-cyan-300">{s.code}</span> → {s.evidence}
              </div>
            ))}
          </div>
          <div className="font-medium mt-4 mb-2">Complaints referencing this account</div>
          <div className="text-sm max-h-40 overflow-auto">
            {complaints.length === 0 && <div className="text-slate-500">None</div>}
            {complaints.map(c => (
              <div key={c.complaint_id} className="border-b border-slate-800 pb-1">
                {c.complaint_time} · {c.complaint_type} · from {c.complainant_account}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-3">Analyst Notes & Status</div>
        <select className="input w-full mb-2" value={status} onChange={e => setStatus(e.target.value as any)}>
          {['New','Investigating','Confirmed','Reviewed','Dismissed','Needs More Evidence'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <textarea className="input w-full h-28 mb-2" value={note}
          onChange={e => setNote(e.target.value)} placeholder="Add investigation notes..." />
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
          Add to analyst-maintained confirmed-accounts list (enables D1)
        </label>
        <button className="btn-primary" onClick={() => updateDecision(id, status as any, note, confirmed)}>
          Save decision
        </button>
      </div>
    </div>
  )
}