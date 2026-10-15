import { CATEGORY_CAPS, MAX_SCORE, SIGNAL_LABELS, SIGNAL_POINTS } from '../scoring/rules'

export default function ScoringRules() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Scoring Rules</h1>

      <div className="card">
        <div className="text-sm text-slate-400 mb-3">
          Maximum score: {MAX_SCORE}. Category caps are applied before summing.
        </div>
        <table className="table">
          <thead><tr><th>Category</th><th>Cap</th></tr></thead>
          <tbody>
            {Object.entries(CATEGORY_CAPS).map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="font-medium mb-3">Signal Weights</div>
        <table className="table">
          <thead><tr><th>Signal</th><th>Points</th><th>Explanation</th></tr></thead>
          <tbody>
            {Object.entries(SIGNAL_POINTS).map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}</td><td>{SIGNAL_LABELS[k]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card text-sm text-slate-300">
        <div className="font-medium mb-2">Risk Levels</div>
        <div>0–19: Clean</div>
        <div>20–49: Low Risk</div>
        <div>50–89: Moderate Risk</div>
        <div>90–230: High Risk</div>
        <div className="mt-3 text-amber-300">
          No account is labeled definitely fraudulent. Scores represent investigation priority and require human review.
        </div>
        <div className="mt-3 text-slate-400">
          D1 only uses the analyst-maintained confirmed-accounts list. Shared devices/IPs alone never imply fraud.
        </div>
      </div>
    </div>
  )
}