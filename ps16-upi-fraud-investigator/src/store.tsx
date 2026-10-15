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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const data = useMemo(() => loadData(), [])
  const [decisions, setDecisions] = useState<Record<string, AnalystDecision>>(() => {
    try { return JSON.parse(localStorage.getItem('ps16-decisions') || '{}') } catch { return {} }
  })

  const confirmedAccounts = useMemo(
    () => Object.values(decisions).filter(d => d.confirmed).map(d => d.account_id),
    [decisions],
  )

  const scores = useMemo(() => scoreAccounts(data, confirmedAccounts), [data, confirmedAccounts])

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const saved = localStorage.getItem('ps16-alerts')
      if (saved) return JSON.parse(saved)
    } catch {}
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

  useEffect(() => { localStorage.setItem('ps16-decisions', JSON.stringify(decisions)) }, [decisions])
  useEffect(() => { localStorage.setItem('ps16-alerts', JSON.stringify(alerts)) }, [alerts])

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