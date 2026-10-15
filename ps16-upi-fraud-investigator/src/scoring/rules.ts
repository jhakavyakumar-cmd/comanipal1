import { RiskLevel } from '../types'

export const CATEGORY_CAPS = {
  V: 35,
  T: 45,
  D: 45,
  I: 25,
  C: 45,
  B: 30,
  M: 5,
} as const

export const SIGNAL_POINTS = {
  V1: 10, V2: 15, V3: 25,
  T1: 20, T2: 25, T3: 25,
  D1: 40, D2: 15, D3: 25,
  I1: 10, I2: 15,
  C1: 35, C2: 10, C3: 30,
  B1: 10, B2: 20, B3: 25,
  M1: 5,
} as const

export const MAX_SCORE = 230

export const SIGNAL_LABELS: Record<string, string> = {
  V1: 'Outgoing transaction velocity: >= 5 outgoing transactions in 24h',
  V2: 'Outgoing transaction velocity: >= 3 outgoing transactions in 1h',
  V3: 'Unusually large outgoing amount in a 24h window',
  T1: 'Pass-through: incoming funds forwarded to >= 2 accounts within 30 minutes',
  T2: 'Rapid onward transfer: forwards to >= 3 accounts within 30 minutes',
  T3: 'Participates in a cycle of 3+ accounts',
  D1: 'Matches analyst-maintained confirmed-accounts list',
  D2: 'Shared device used by >= 3 accounts in 24h',
  D3: 'Shared device used by >= 5 accounts in 24h with high amounts',
  I1: 'Shared IP used by >= 3 accounts in 24h',
  I2: 'Shared IP used by >= 5 accounts in 24h',
  C1: 'Referenced in >= 3 complaints',
  C2: 'Referenced in 1-2 complaints',
  C3: 'Has COLLECT_FRAUD or UNAUTHORIZED_TXN complaint',
  B1: 'Dormant account reactivated after > 30 days of inactivity',
  B2: 'Possible structuring: multiple amounts near a threshold in 24h',
  B3: 'Single transaction significantly above historical typical amount',
  M1: 'Merchant region does not match account home region',
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 90) return 'High Risk'
  if (score >= 50) return 'Moderate Risk'
  if (score >= 20) return 'Low Risk'
  return 'Clean'
}