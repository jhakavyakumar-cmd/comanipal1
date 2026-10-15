export type RiskLevel = 'Clean' | 'Low Risk' | 'Moderate Risk' | 'High Risk'

export type AlertStatus =
  | 'New'
  | 'Investigating'
  | 'Confirmed'
  | 'Reviewed'
  | 'Dismissed'
  | 'Needs More Evidence'

export interface Account {
  account_id: string
  account_creation_time: string
  account_type: string
  customer_segment: string
  home_region: string
  normal_device_count: number
  normal_ip_count: number
  typical_transaction_frequency: number
  typical_transaction_amount: number
  account_status: string
}

export interface Transaction {
  transaction_id: string
  event_time: string
  ingestion_time: string
  from_account: string
  to_account: string
  amount: number
  device_id?: string
  ip_address?: string
  merchant_id?: string
  merchant_region?: string
  record_completeness: number
}

export interface CollectRequest {
  collect_request_id: string
  event_time: string
  ingestion_time: string
  requester_account: string
  target_account: string
  amount: number
  status: string
  device_id?: string
  ip_address?: string
  record_completeness: number
}

export interface Complaint {
  complaint_id: string
  complaint_time: string
  ingestion_time: string
  complainant_account: string
  referenced_account: string
  related_transaction_id?: string
  complaint_type: string
  record_completeness: number
}

export interface Device {
  device_id: string
  device_type: string
  os_family: string
  first_seen: string
  last_seen: string
  network_hint: string
}

export interface GroundTruth {
  account_id: string
  isFraud: boolean
  ringId?: string
  role?: string
}

export interface Ring {
  id: string
  type: string
  accounts: string[]
  description: string
}

export interface SignalHit {
  code: string
  label: string
  category: string
  points: number
  evidence: string
}

export interface ScoreResult {
  account_id: string
  total: number
  level: RiskLevel
  categoryScores: Record<string, number>
  signals: SignalHit[]
}

export interface Alert {
  id: string
  account_id: string
  score: number
  level: RiskLevel
  status: AlertStatus
  created_at: string
  evidence: string[]
  signals: SignalHit[]
}

export interface AnalystDecision {
  account_id: string
  status: AlertStatus
  note: string
  confirmed: boolean
  updated_at: string
}

export interface AppData {
  accounts: Account[]
  transactions: Transaction[]
  collectRequests: CollectRequest[]
  complaints: Complaint[]
  devices: Device[]
  groundTruth: GroundTruth[]
  rings: Ring[]
}