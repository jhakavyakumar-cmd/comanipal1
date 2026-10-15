import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadData } from './data/service'
import { scoreAccounts } from './scoring/engine'
import { Alert, AlertStatus, AnalystDecision, AppData, ScoreResult } from './types'

interface Ctx {
  data: AppData
  scores: ScoreResult[]
  alerts: Alert[]
  decisions: Record<string, AnalystDecision>
  confirmedAccounts: string[]
  updateDecision: (account_id: string, status: AlertStatus, note: string, confirmed: boolean) => void
}

const AppContext = createContext<Ctx>(null as any)

function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function safeStorageSet(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[Storage] Failed to save key "${key}":`, err)
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const data = useMemo(() => loadData(), [])
  const [decisions, setDecisions] = useState<Record<string, AnalystDecision>>(() =>
    safeStorageGet('ps16-decisions', {})
  )

  const confirmedAccounts = useMemo(
    () => Object.values(decisions).filter(d => d.confirmed).map(d => d.account_id),
    [decisions],
  )

  const scores = useMemo(() => scoreAccounts(data, confirmedAccounts), [data, confirmedAccounts])

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = safeStorageGet<Alert[] | null>('ps16-alerts', null)
    if (saved && Array.isArray(saved) && saved.length > 0) return saved
    return scores.filter(s => s.total >= 50).map(s => ({
      id: s.account_id,
      account_id: s.account_id,
      score: s.total,
      level: s.level,
      status: 'New' as AlertStatus,
      created_at: new Date().toISOString(),
      evidence: s.signals.map(x => x.evidence),
      signals: s.signals,
    }))
  })

  useEffect(() => {
    safeStorageSet('ps16-decisions', decisions)
  }, [decisions])

  useEffect(() => {
    safeStorageSet('ps16-alerts', alerts)
  }, [alerts])

  const updateDecision = (account_id: string, status: AlertStatus, note: string, confirmed: boolean) => {
    setDecisions(prev => ({
      ...prev,
      [account_id]: { account_id, status, note, confirmed, updated_at: new Date().toISOString() },
    }))
    setAlerts(prev => prev.map(a => (a.account_id === account_id ? { ...a, status } : a)))
  }

  return (
    <AppContext.Provider value={{ data, scores, alerts, decisions, confirmedAccounts, updateDecision }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)