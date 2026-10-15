import { useMemo, useState } from 'react'
import { useApp } from '../store'
import GraphView from '../components/GraphView'
import { buildGraph } from '../graph/buildGraph'

export default function Network() {
  const { data, scores } = useApp()
  const [focus, setFocus] = useState('')
  const [hop, setHop] = useState(1)
  const [minAmount, setMinAmount] = useState(0)
  const [maxAmount, setMaxAmount] = useState(200000)
  const [level, setLevel] = useState('')

  const elements = useMemo(() => {
    const allowed = level ? scores.filter(s => s.level === level).map(s => s.account_id) : undefined
    return buildGraph(data, {
      focusAccount: focus || undefined,
      hopDepth: hop, minAmount, maxAmount,
      accountIds: allowed,
    })
  }, [data, scores, focus, hop, minAmount, maxAmount, level])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Network</h1>
      <div className="flex flex-wrap gap-3">
        <input className="input" placeholder="Focus account e.g. ACC00001" value={focus} onChange={e => setFocus(e.target.value)} />
        <select className="input" value={hop} onChange={e => setHop(Number(e.target.value))}>
          <option value={1}>1 hop</option>
          <option value={2}>2 hops</option>
          <option value={3}>3 hops</option>
        </select>
        <input className="input" type="number" placeholder="Min amount" value={minAmount}
          onChange={e => setMinAmount(Number(e.target.value))} />
        <input className="input" type="number" placeholder="Max amount" value={maxAmount}
          onChange={e => setMaxAmount(Number(e.target.value))} />
        <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All risk</option>
          <option>Clean</option><option>Low Risk</option><option>Moderate Risk</option><option>High Risk</option>
        </select>
      </div>
      <GraphView elements={elements} height={720} />
      <div className="text-xs text-slate-500">
        Zoom: mouse wheel · Pan: drag background · Select: click a node.
      </div>
    </div>
  )
}