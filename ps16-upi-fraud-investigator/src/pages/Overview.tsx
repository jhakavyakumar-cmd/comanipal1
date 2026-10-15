import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../store'
import RiskBadge from '../components/RiskBadge'

export default function Overview() {
  const { data, scores, alerts } = useApp()

  const riskCounts = (['Clean','Low Risk','Moderate Risk','High Risk'] as const).map(level => ({
    level, count: scores.filter(s => s.level === level).length,
  }))

  const scoreBuckets = Array.from({ length: 12 }, (_, i) => ({
    bucket: `${i * 20}-${i * 20 + 19}`,
    count: scores.filter(s => s.total >= i * 20 && s.total < i * 20 + 20).length,
  }))

  const signalTally = scores.flatMap(s => s.signals).reduce((m: Record<string, number>, s) => {
    m[s.code] = (m[s.code] || 0) + 1
    return m
  }, {})
  const topSignals = Object.entries(signalTally).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const byDay = new Map<string, number>()
  for (const t of data.transactions) {
    const day = t.event_time.slice(0, 10)
    byDay.set(day, (byDay.get(day) || 0) + 1)
  }
  const timeline = Array.from(byDay.entries()).sort().slice(-30).map(([day, count]) => ({ day, count }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="text-slate-400 text-sm">Total Accounts</div>
          <div className="text-3xl font-bold">{data.accounts.length}</div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">Open Alerts</div>
          <div className="text-3xl font-bold">{alerts.length}</div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">High Risk</div>
          <div className="text-3xl font-bold text-red-300">{scores.filter(s => s.level === 'High Risk').length}</div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">Transactions</div>
          <div className="text-3xl font-bold">{data.transactions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="font-medium mb-3">Risk Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskCounts}>
              <XAxis dataKey="level" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="font-medium mb-3">Score Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreBuckets}>
              <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="font-medium mb-3">Top Signals</div>
          <div className="space-y-2">
            {topSignals.map(([code, count]) => (
              <div key={code} className="flex justify-between text-sm">
                <span>{code}</span><span className="text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="font-medium mb-3">Recent Alerts</div>
          <div className="space-y-2">
            {alerts.slice(0, 8).map(a => (
              <div key={a.id} className="flex justify-between text-sm border-b border-slate-800 pb-1">
                <span>{a.account_id}</span>
                <span>{a.score}</span>
                <RiskBadge level={a.level} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-3">Suspicious activity over time (last 30 days in the dataset)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={timeline}>
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#a78bfa" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}