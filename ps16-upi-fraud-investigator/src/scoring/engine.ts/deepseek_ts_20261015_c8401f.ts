import { AppData, ScoreResult, SignalHit } from '../types'
import { CATEGORY_CAPS, SIGNAL_LABELS, SIGNAL_POINTS, getRiskLevel } from './rules'

const ts = (s: string) => Date.parse(s.replace(' ', 'T'))

function hasWindow(times: number[], windowMs: number, count: number) {
  const sorted = [...times].sort((a, b) => a - b)
  for (let i = 0; i + count - 1 < sorted.length; i++) {
    if (sorted[i + count - 1] - sorted[i] <= windowMs) return true
  }
  return false
}

function maxSumWindow(times: number[], amounts: number[], windowMs: number) {
  const items = times.map((t, i) => ({ t, a: amounts[i] })).sort((x, y) => x.t - y.t)
  let max = 0
  for (let i = 0; i < items.length; i++) {
    let s = 0
    for (let j = i; j < items.length && items[j].t - items[i].t <= windowMs; j++) s += items[j].a
    max = Math.max(max, s)
  }
  return max
}

export function scoreAccounts(data: AppData, confirmedAccounts: string[] = []): ScoreResult[] {
  const { accounts, transactions, complaints } = data
  const confirmed = new Set(confirmedAccounts)

  const txFrom = new Map<string, typeof transactions>()
  const txTo = new Map<string, typeof transactions>()
  const deviceAccounts = new Map<string, Set<string>>()
  const deviceAmount = new Map<string, number>()
  const ipAccounts = new Map<string, Set<string>>()
  const complaintByRef = new Map<string, typeof complaints>()

  for (const t of transactions) {
    if (!txFrom.has(t.from_account)) txFrom.set(t.from_account, [])
    if (!txTo.has(t.to_account)) txTo.set(t.to_account, [])
    txFrom.get(t.from_account)!.push(t)
    txTo.get(t.to_account)!.push(t)
    if (t.device_id) {
      if (!deviceAccounts.has(t.device_id)) deviceAccounts.set(t.device_id, new Set())
      deviceAccounts.get(t.device_id)!.add(t.from_account)
      deviceAccounts.get(t.device_id)!.add(t.to_account)
      deviceAmount.set(t.device_id, (deviceAmount.get(t.device_id) || 0) + t.amount)
    }
    if (t.ip_address) {
      if (!ipAccounts.has(t.ip_address)) ipAccounts.set(t.ip_address, new Set())
      ipAccounts.get(t.ip_address)!.add(t.from_account)
      ipAccounts.get(t.ip_address)!.add(t.to_account)
    }
  }
  for (const c of complaints) {
    if (!complaintByRef.has(c.referenced_account)) complaintByRef.set(c.referenced_account, [])
    complaintByRef.get(c.referenced_account)!.push(c)
  }

  const cycles = new Set<string>()
  const adj = new Map<string, Set<string>>()
  for (const t of transactions) {
    if (!adj.has(t.from_account)) adj.set(t.from_account, new Set())
    adj.get(t.from_account)!.add(t.to_account)
  }
  const nodes = Array.from(adj.keys()).slice(0, 800)
  for (const start of nodes) {
    const path: string[] = []
    const dfs = (cur: string, depth: number) => {
      if (depth > 5) return
      path.push(cur)
      const nexts = adj.get(cur)
      if (nexts) {
        for (const nxt of nexts) {
          if (nxt === start && depth >= 3) path.forEach(a => cycles.add(a))
          else if (!path.includes(nxt)) dfs(nxt, depth + 1)
        }
      }
      path.pop()
    }
    dfs(start, 1)
  }

  return accounts.map(acc => {
    const signals: SignalHit[] = []
    const add = (code: keyof typeof SIGNAL_POINTS, evidence: string) => {
      signals.push({ code, label: SIGNAL_LABELS[code], category: code[0], points: SIGNAL_POINTS[code], evidence })
    }

    const fromTx = txFrom.get(acc.account_id) || []
    const toTx = txTo.get(acc.account_id) || []
    const fromTimes = fromTx.map(t => ts(t.event_time))
    const fromAmounts = fromTx.map(t => t.amount)

    if (hasWindow(fromTimes, 24 * 3600 * 1000, 5)) add('V1', `24h outgoing transactions: ${fromTx.length} (threshold 5)`)
    if (hasWindow(fromTimes, 3600 * 1000, 3)) add('V2', '1h outgoing transactions >= 3')
    const expectedWindow = Math.max(5000, acc.typical_transaction_amount * Math.max(1, acc.typical_transaction_frequency) * 5)
    const max24 = maxSumWindow(fromTimes, fromAmounts, 24 * 3600 * 1000)
    if (max24 > expectedWindow) add('V3', `24h outgoing total ${max24.toFixed(2)} exceeds expected ${expectedWindow.toFixed(2)}`)

    for (const incoming of toTx) {
      const inTime = ts(incoming.event_time)
      const outgoing = fromTx.filter(t => ts(t.event_time) >= inTime && ts(t.event_time) <= inTime + 30 * 60 * 1000)
      const outSum = outgoing.reduce((s, t) => s + t.amount, 0)
      const targets = new Set(outgoing.map(t => t.to_account))
      if (outgoing.length && outSum >= incoming.amount * 0.8 && targets.size >= 2) {
        add('T1', `Incoming ${incoming.transaction_id} forwarded to ${targets.size} accounts within 30m`)
      }
      if (outgoing.length && targets.size >= 3) {
        add('T2', `Rapid onward transfer to ${targets.size} accounts within 30m`)
      }
    }

    if (cycles.has(acc.account_id)) add('T3', 'Participates in a 3+ account cycle')
    if (confirmed.has(acc.account_id)) add('D1', 'Matches analyst-maintained confirmed-accounts list')

    for (const [dev, set] of deviceAccounts) {
      if (set.has(acc.account_id) && set.size >= 3) {
        add('D2', `Device ${dev} used by ${set.size} accounts`)
        if (set.size >= 5 && (deviceAmount.get(dev) || 0) > 10000) {
          add('D3', `Device ${dev} used by ${set.size} accounts with total amount ${(deviceAmount.get(dev) || 0).toFixed(2)}`)
        }
        break
      }
    }

    for (const [ip, set] of ipAccounts) {
      if (set.has(acc.account_id) && set.size >= 3) {
        add('I1', `IP ${ip} used by ${set.size} accounts`)
        if (set.size >= 5) add('I2', `IP ${ip} used by ${set.size} accounts`)
        break
      }
    }

    const comps = complaintByRef.get(acc.account_id) || []
    if (comps.length >= 3) add('C1', `Referenced in ${comps.length} complaints`)
    else if (comps.length >= 1) add('C2', `Referenced in ${comps.length} complaint(s)`)
    if (comps.some(c => c.complaint_type === 'COLLECT_FRAUD' || c.complaint_type === 'UNAUTHORIZED_TXN')) {
      add('C3', 'Has COLLECT_FRAUD or UNAUTHORIZED_TXN complaint')
    }

    const sortedFrom = [...fromTx].sort((a, b) => ts(a.event_time) - ts(b.event_time))
    for (let i = 1; i < sortedFrom.length; i++) {
      if (ts(sortedFrom[i].event_time) - ts(sortedFrom[i - 1].event_time) > 30 * 24 * 3600 * 1000) {
        add('B1', 'Gap > 30 days followed by new activity')
        break
      }
    }

    const nearThreshold = (a: number) =>
      (a >= 9000 && a < 10000) || (a >= 45000 && a < 50000) || (a >= 99000 && a < 100000)
    if (hasWindow(fromTimes, 24 * 3600 * 1000, 3) && fromAmounts.some(nearThreshold)) {
      add('B2', 'Multiple amounts near thresholds within 24h')
    }

    if (fromTx.some(t => t.amount > 3 * acc.typical_transaction_amount && t.amount > 5000)) {
      add('B3', 'Single transaction significantly above historical typical amount')
    }

    if (fromTx.some(t => t.merchant_region && t.merchant_region !== acc.home_region)) {
      add('M1', 'Merchant region does not match home region')
    }

    const categoryScores: Record<string, number> = {}
    for (const s of signals) categoryScores[s.category] = (categoryScores[s.category] || 0) + s.points
    for (const k of Object.keys(categoryScores)) {
      const cap = (CATEGORY_CAPS as any)[k] || 0
      categoryScores[k] = Math.min(categoryScores[k], cap)
    }
    const total = Object.values(categoryScores).reduce((a, b) => a + b, 0)

    return {
      account_id: acc.account_id,
      total,
      level: getRiskLevel(total),
      categoryScores,
      signals,
    }
  })
}