import { useState } from 'react'
import { useApp } from '../store'

export default function Evaluation() {
  const { data, scores } = useApp()
  const [threshold, setThreshold] = useState(50)

  const truth = new Map(data.groundTruth.map(g => [g.account_id, g.isFraud]))
  const scoreMap = new Map(scores.map(s => [s.account_id, s.total]))

  let tp = 0, tn = 0, fp = 0, fn = 0
  for (const a of data.accounts) {
    const pred = (scoreMap.get(a.account_id) || 0) >= threshold
    const actual = truth.get(a.account_id) || false
    if (pred && actual) tp++
    else if (!pred && !actual) tn++
    else if (pred && !actual) fp++
    else fn++
  }
  const precision = tp + fp ? tp / (tp + fp) : 0
  const recall = tp + fn ? tp / (tp + fn) : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  const fpr = fp + tn ? fp / (fp + tn) : 0

  const benignSharedDeviceFp = data.accounts.filter(a => {
    const pred = (scoreMap.get(a.account_id) || 0) >= threshold
    const actual = truth.get(a.account_id) || false
    const hasBenignShared = data.transactions.some(t =>
      t.device_id === 'DEV_BENIGN_SHARED' &&
      (t.from_account === a.account_id || t.to_account === a.account_id))
    return pred && !actual && hasBenignShared
  }).length

  const positives = data.groundTruth.filter(g => g.isFraud).length
  const baselinePrecision = positives / data.accounts.length

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Evaluation</h1>

      <div className="card">
        <label className="text-sm text-slate-400">Alert threshold: {threshold}</label>
        <input className="w-full mt-2" type="range" min={0} max={230} value={threshold}
          onChange={e => setThreshold(Number(e.target.value))} />
      </div>

      <div className="card">
        <div className="font-medium mb-3">Confusion Matrix</div>
        <table className="table w-72">
          <thead>
            <tr><th></th><th>Predicted +</th><th>Predicted −</th></tr>
          </thead>
          <tbody>
            <tr><td>Actual +</td><td>{tp}</td><td>{fn}</td></tr>
            <tr><td>Actual −</td><td>{fp}</td><td>{tn}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card"><div className="text-slate-400 text-sm">Precision</div><div className="text-2xl font-bold">{(precision * 100).toFixed(1)}%</div></div>
        <div className="card"><div className="text-slate-400 text-sm">Recall</div><div className="text-2xl font-bold">{(recall * 100).toFixed(1)}%</div></div>
        <div className="card"><div className="text-slate-400 text-sm">F1</div><div className="text-2xl font-bold">{(f1 * 100).toFixed(1)}%</div></div>
        <div className="card"><div className="text-slate-400 text-sm">FPR</div><div className="text-2xl font-bold">{(fpr * 100).toFixed(1)}%</div></div>
      </div>

      <div className="card">
        <div className="font-medium mb-2">Benign shared-device false positives at this threshold</div>
        <div className="text-3xl font-bold">{benignSharedDeviceFp}</div>
        <div className="text-sm text-slate-400">
          Non-fraud accounts flagged who share a benign household/college device or IP.
          Shared device or IP alone never implies fraud.
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-2">Baseline comparison</div>
        <div className="text-sm text-slate-300">
          Random baseline precision ≈ {(baselinePrecision * 100).toFixed(2)}%
          (base rate of fraud in the synthetic population).
          The transparent rule score at the current threshold achieves
          precision {(precision * 100).toFixed(2)}%.
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-2">Threshold sweep</div>
        <table className="table">
          <thead><tr><th>Threshold</th><th>TP</th><th>FP</th><th>Precision</th><th>Recall</th></tr></thead>
          <tbody>
            {[20, 50, 90, 120, 160].map(th => {
              let t = 0, f = 0, r = 0
              for (const a of data.accounts) {
                const pred = (scoreMap.get(a.account_id) || 0) >= th
                const actual = truth.get(a.account_id) || false
                if (pred && actual) t++
                else if (pred && !actual) f++
                else if (!pred && actual) r++
              }
              const p = t + f ? t / (t + f) : 0
              const rec = t + r ? t / (t + r) : 0
              return (
                <tr key={th}>
                  <td>{th}</td><td>{t}</td><td>{f}</td>
                  <td>{(p * 100).toFixed(1)}%</td>
                  <td>{(rec * 100).toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}