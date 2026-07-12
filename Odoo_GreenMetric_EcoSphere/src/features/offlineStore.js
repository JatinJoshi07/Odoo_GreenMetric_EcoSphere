import Dexie from 'dexie'

export const db = new Dexie('ecosphere-offline-db')

db.version(1).stores({
  carbon_transactions: 'id, sourceType, date, sync_status',
  csr_participations: 'id, userId, activityId, sync_status',
  compliance_issues: 'id, ownerId, dueDate, status, sync_status',
})

// Safe UUID generator supporting non-secure contexts (HTTP network IPs)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export async function seedLocalSampleData() {
  await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, async () => {
    const existing = await db.carbon_transactions.count()
    if (existing > 0) return

    await db.carbon_transactions.bulkAdd([
      {
        id: generateUUID(),
        sourceType: 'Fleet Fuel',
        rawAmount: 120,
        calculatedEmissions: 72,
        date: '2026-07-12',
        sync_status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ])

    await db.csr_participations.bulkAdd([
      {
        id: generateUUID(),
        userId: 'u-001',
        activityId: 'a-001',
        proofFile: 'base64-demo-proof',
        status: 'Submitted',
        sync_status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ])

    await db.compliance_issues.bulkAdd([
      {
        id: generateUUID(),
        description: 'Worker safety acknowledgement pending',
        ownerId: 'u-001',
        dueDate: '2026-07-14',
        status: 'Open',
        sync_status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ])
  })
}
