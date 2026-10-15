import { Link } from 'react-router-dom'
import { useApp } from '../store'

export default function Rings() {
  const { data, scores } = useApp()
  const scoreMap = new Map(scores.map(s => [s.account_id, s]))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Detected Rings</h1>
      <div className="text-sm text-slate-400">
        Patterns: pass-through, fan-in, fan-out, cycle, shared-device, shared-IP.
      </div>
      <div className="grid grid-cols-2 gap-4">
        {data.rings.map(r => (
          <div className="card" key={r.id}>
            <div className="flex justify-between">
              <div className="font-medium">{r.id}</div>
              <div className="text-cyan-300 text-sm">{r.type}</div>
            </div>
            <div className="text-sm text-slate-400 mb-3">{r.description}</div>
            <div className="flex flex-wrap gap-2">
              {r.accounts.slice(0, 14).map(a => (
                <Link key={a} to={`/account/${a}`}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">
                  {a} ({scoreMap.get(a)?.total ?? 0})
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}