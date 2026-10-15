import {
  Account, AppData, CollectRequest, Complaint, Device, GroundTruth, Ring, Transaction,
} from '../types'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const randInt = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a
const randAmount = (a = 50, b = 20000) => Math.round((rand() * (b - a) + a) * 100) / 100

function iso(d: Date) {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}
function addDays(d: Date, days: number) {
  const x = new Date(d); x.setDate(x.getDate() + days); return x
}
function addMinutes(d: Date, minutes: number) {
  const x = new Date(d); x.setMinutes(x.getMinutes() + minutes); return x
}

const REGIONS = ['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Kolkata','Pune','Jaipur','Lucknow','Ahmedabad','Chandigarh','Kochi']
const SEGMENTS = ['LOW','MEDIUM','HIGH']
const TYPES = ['INDIVIDUAL','BUSINESS']
const STATUS = ['ACTIVE','NEW','DORMANT']

export function generateData(): AppData {
  const accounts: Account[] = []
  const transactions: Transaction[] = []
  const collectRequests: CollectRequest[] = []
  const complaints: Complaint[] = []
  const devices: Device[] = []
  const groundTruth: GroundTruth[] = []
  const rings: Ring[] = []

  const totalAccounts = 400
  const ringCount = 14
  const ringAccounts = new Set<string>()
  const accountRing = new Map<string, string>()

  for (let i = 0; i < ringCount; i++) {
    const size = randInt(5, 11)
    const ringId = `RING_${String(i + 1).padStart(3, '0')}`
    const members: string[] = []
    for (let j = 0; j < size; j++) {
      const id = `ACC${String(accounts.length + 1).padStart(5, '0')}`
      members.push(id)
      ringAccounts.add(id)
      accountRing.set(id, ringId)
      accounts.push({
        account_id: id,
        account_creation_time: iso(addDays(new Date('2020-01-01'), randInt(0, 1500))),
        account_type: 'INDIVIDUAL',
        customer_segment: pick(SEGMENTS),
        home_region: pick(REGIONS),
        normal_device_count: randInt(1, 2),
        normal_ip_count: randInt(1, 3),
        typical_transaction_frequency: Math.round((rand() * 1.5 + 0.05) * 10000) / 10000,
        typical_transaction_amount: Math.round((rand() * 8000 + 100) * 100) / 100,
        account_status: 'ACTIVE',
      })
    }
    rings.push({
      id: ringId,
      type: pick(['pass-through','fan-in','fan-out','cycle','shared-device','shared-IP']),
      accounts: members,
      description: `Synthetic suspicious ring ${ringId} with ${size} member accounts`,
    })
  }

  while (accounts.length < totalAccounts) {
    const id = `ACC${String(accounts.length + 1).padStart(5, '0')}`
    accounts.push({
      account_id: id,
      account_creation_time: iso(addDays(new Date('2020-01-01'), randInt(0, 1500))),
      account_type: pick(TYPES),
      customer_segment: pick(SEGMENTS),
      home_region: pick(REGIONS),
      normal_device_count: randInt(1, 2),
      normal_ip_count: randInt(1, 3),
      typical_transaction_frequency: Math.round((rand() * 1.5 + 0.05) * 10000) / 10000,
      typical_transaction_amount: Math.round((rand() * 8000 + 100) * 100) / 100,
      account_status: pick(STATUS),
    })
  }

  for (let i = 0; i < 250; i++) {
    const id = `DEV${String(i + 1).padStart(5, '0')}`
    devices.push({
      device_id: id,
      device_type: pick(['MOBILE_ANDROID','MOBILE_IOS','WEB_BROWSER','TABLET','POS_TERMINAL']),
      os_family: pick(['Android','iOS','Web','Linux']),
      first_seen: iso(addDays(new Date('2023-01-01'), randInt(0, 400))),
      last_seen: iso(addDays(new Date('2024-06-01'), randInt(0, 200))),
      network_hint: pick(['personal','household','workplace','college','suspicious']),
    })
  }

  const normalAccounts = accounts.filter(a => !ringAccounts.has(a.account_id))
  const benignSharedDevice = 'DEV_BENIGN_SHARED'
  const benignSharedIp = '10.0.0.42'

  const accountDevice = new Map<string, string>()
  const accountIp = new Map<string, string>()
  for (const a of accounts) {
    const isRing = ringAccounts.has(a.account_id)
    if (isRing) {
      const ringId = accountRing.get(a.account_id)!
      accountDevice.set(a.account_id, `DEV_${ringId}`)
      accountIp.set(a.account_id, `192.168.${randInt(1, 20)}.${randInt(2, 250)}`)
    } else {
      const useBenign = rand() < 0.08
      accountDevice.set(a.account_id, useBenign ? benignSharedDevice : pick(devices).device_id)
      accountIp.set(a.account_id, useBenign ? benignSharedIp : `10.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`)
    }
  }

  let txSeq = 1
  const tx = (
    from: string, to: string, time: Date, amount: number,
    device?: string, ip?: string, merchantRegion?: string,
  ): Transaction => ({
    transaction_id: `TX${String(txSeq++).padStart(8, '0')}`,
    event_time: iso(time),
    ingestion_time: iso(addMinutes(time, randInt(1, 90))),
    from_account: from,
    to_account: to,
    amount,
    device_id: device,
    ip_address: ip,
    merchant_id: rand() < 0.35 ? `MER${randInt(1, 300)}` : undefined,
    merchant_region: merchantRegion || (rand() < 0.12 ? pick(REGIONS) : undefined),
    record_completeness: rand() < 0.08 ? 0.75 : 1,
  })

  for (const a of normalAccounts) {
    const count = randInt(0, 8)
    let t = addDays(new Date('2024-01-01'), randInt(0, 180))
    for (let i = 0; i < count; i++) {
      t = addMinutes(t, randInt(60, 6000))
      const target = pick(normalAccounts).account_id
      transactions.push(tx(a.account_id, target, t, randAmount(50, a.typical_transaction_amount * 2.5),
        accountDevice.get(a.account_id), accountIp.get(a.account_id)))
    }
  }

  for (const ring of rings) {
    const members = ring.accounts
    const base = addDays(new Date('2024-02-01'), randInt(0, 120))
    for (let k = 0; k < members.length * 4; k++) {
      const from = pick(members)
      const to = pick(members.filter(x => x !== from))
      const t = addMinutes(base, randInt(0, 60 * 24 * 14))
      const amount = randAmount(8000, 95000)
      transactions.push(tx(from, to, t, amount, accountDevice.get(from), accountIp.get(from)))
      const next = pick(members.filter(x => x !== to && x !== from))
      transactions.push(tx(to, next, addMinutes(t, randInt(2, 25)), amount * (0.75 + rand() * 0.2),
        accountDevice.get(to), accountIp.get(to)))
    }
    for (let i = 0; i < members.length; i++) {
      const a = members[i]
      const b = members[(i + 1) % members.length]
      const c = members[(i + 2) % members.length]
      const t = addMinutes(base, randInt(0, 60 * 24 * 7))
      transactions.push(tx(a, b, t, randAmount(5000, 30000), accountDevice.get(a), accountIp.get(a)))
      transactions.push(tx(b, c, addMinutes(t, randInt(5, 30)), randAmount(4000, 25000), accountDevice.get(b), accountIp.get(b)))
      transactions.push(tx(c, a, addMinutes(t, randInt(5, 30)), randAmount(3000, 20000), accountDevice.get(c), accountIp.get(c)))
    }
  }

  for (let i = 0; i < 25; i++) {
    const a = pick(normalAccounts)
    const t = addDays(new Date('2024-03-01'), randInt(0, 100))
    for (let j = 0; j < 5; j++) {
      transactions.push(tx(a.account_id, pick(normalAccounts).account_id, addMinutes(t, j * 7),
        randAmount(20000, 80000), accountDevice.get(a.account_id), accountIp.get(a.account_id)))
    }
  }

  let cmpSeq = 1
  for (const a of accounts) {
    const isRing = ringAccounts.has(a.account_id)
    const count = isRing ? randInt(0, 4) : rand() < 0.04 ? randInt(1, 2) : 0
    for (let i = 0; i < count; i++) {
      const time = addDays(new Date('2024-01-01'), randInt(0, 180))
      complaints.push({
        complaint_id: `CMP${String(cmpSeq++).padStart(6, '0')}`,
        complaint_time: iso(time),
        ingestion_time: iso(addDays(time, randInt(1, 20))),
        complainant_account: pick(accounts).account_id,
        referenced_account: a.account_id,
        related_transaction_id: rand() < 0.5 ? `TX${String(randInt(1, txSeq)).padStart(8, '0')}` : undefined,
        complaint_type: pick(['COLLECT_FRAUD','UNAUTHORIZED_TXN','PHISHING','MULE_SUSPECTED','WRONG_TRANSFER','SERVICE_ISSUE']),
        record_completeness: rand() < 0.1 ? 0.7 : 1,
      })
    }
  }

  let crSeq = 1
  for (let i = 0; i < 600; i++) {
    const from = pick(accounts).account_id
    const to = pick(accounts).account_id
    const time = addDays(new Date('2024-01-01'), randInt(0, 180))
    collectRequests.push({
      collect_request_id: `CR${String(crSeq++).padStart(7, '0')}`,
      event_time: iso(time),
      ingestion_time: iso(addMinutes(time, randInt(1, 240))),
      requester_account: from,
      target_account: to,
      amount: randAmount(10, 60000),
      status: pick(['PENDING','PAID','DECLINED']),
      device_id: accountDevice.get(from),
      ip_address: accountIp.get(from),
      record_completeness: rand() < 0.1 ? 0.75 : 1,
    })
  }

  for (const a of accounts) {
    groundTruth.push({
      account_id: a.account_id,
      isFraud: ringAccounts.has(a.account_id),
      ringId: accountRing.get(a.account_id),
      role: ringAccounts.has(a.account_id) ? pick(['mule','collector','pass-through','cash-out']) : 'benign',
    })
  }

  return { accounts, transactions, collectRequests, complaints, devices, groundTruth, rings }
}