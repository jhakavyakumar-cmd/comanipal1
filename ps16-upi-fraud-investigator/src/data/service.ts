import { AppData } from '../types'
import { generateData } from './generator'

const DATA_KEY = 'ps16-synthetic-data-v1'

export function loadData(): AppData {
  try {
    const cached = localStorage.getItem(DATA_KEY)
    if (cached) {
      return JSON.parse(cached) as AppData
    }
  } catch {
    try {
      localStorage.removeItem(DATA_KEY)
    } catch {}
  }
  const data = generateData()
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[Storage] Could not cache synthetic dataset in localStorage; continuing with memory dataset:', e)
  }
  return data
}

export function resetData() {
  try {
    localStorage.removeItem(DATA_KEY)
    localStorage.removeItem('ps16-decisions')
    localStorage.removeItem('ps16-alerts')
  } catch {}
  window.location.reload()
}