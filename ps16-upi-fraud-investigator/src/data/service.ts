import { AppData } from '../types'
import { generateData } from './generator'

const DATA_KEY = 'ps16-synthetic-data-v1'

export function loadData(): AppData {
  const cached = localStorage.getItem(DATA_KEY)
  if (cached) {
    try { return JSON.parse(cached) as AppData } catch { localStorage.removeItem(DATA_KEY) }
  }
  const data = generateData()
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
  return data
}

export function resetData() {
  localStorage.removeItem(DATA_KEY)
  localStorage.removeItem('ps16-decisions')
  localStorage.removeItem('ps16-alerts')
  window.location.reload()
}