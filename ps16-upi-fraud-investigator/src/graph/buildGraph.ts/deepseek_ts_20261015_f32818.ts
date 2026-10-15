import { AppData } from '../types'

export function buildGraph(data: AppData, opts: {
  minAmount?: number
  maxAmount?: number
  riskLevels?: string[]
  accountIds?: string[]
  hopDepth?: number
  focusAccount?: string
}) {
  const { transactions, accounts, rings } = data
  const accountSet = new Set(opts.accountIds || accounts.map(a => a.account_id))
  const min = opts.minAmount ?? 0
  const max = opts.maxAmount ?? Infinity

  let filtered = transactions.filter(t =>
    accountSet.has(t.from_account) &&
    accountSet.has(t.to_account) &&
    t.amount >= min &&
    t.amount <= max,
  )

  if (opts.focusAccount) {
    const depth = opts.hopDepth ?? 1
    const keep = new Set([opts.focusAccount])
    let frontier = [opts.focusAccount]
    for (let d = 0; d < depth; d++) {
      const next: string[] = []
      for (const t of filtered) {
        if (frontier.includes(t.from_account) && !keep.has(t.to_account)) {
          keep.add(t.to_account); next.push(t.to_account)
        }
        if (frontier.includes(t.to_account) && !keep.has(t.from_account)) {
          keep.add(t.from_account); next.push(t.from_account)
        }
      }
      frontier = next
    }
    filtered = filtered.filter(t => keep.has(t.from_account) && keep.has(t.to_account))
  }

  const elements: any[] = []
  const nodeIds = new Set<string>()
  filtered.forEach(t => { nodeIds.add(t.from_account); nodeIds.add(t.to_account) })
  nodeIds.forEach(id => {
    const acc = accounts.find(a => a.account_id === id)
    const ring = rings.find(r => r.accounts.includes(id))
    elements.push({ data: { id, label: id.replace('ACC', ''), region: acc?.home_region, ring: ring?.id } })
  })

  const edgeMap = new Map<string, number>()
  filtered.forEach(t => {
    const key = `${t.from_account}->${t.to_account}`
    edgeMap.set(key, (edgeMap.get(key) || 0) + t.amount)
  })
  edgeMap.forEach((amount, key) => {
    const [source, target] = key.split('->')
    elements.push({
      data: { id: key, source, target, amount, label: amount > 50000 ? `${Math.round(amount / 1000)}k` : '' },
    })
  })
  return elements
}