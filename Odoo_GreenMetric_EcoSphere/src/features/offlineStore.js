import Dexie from 'dexie'

export const db = new Dexie('ecosphere-offline-db')

db.version(3).stores({
  carbon_transactions: 'id, sourceType, date, sync_status',
  csr_participations: 'id, userId, activityId, sync_status',
  compliance_issues: 'id, ownerId, dueDate, status, sync_status',
  departments: 'id, name, headId, sync_status',
  emission_factors: 'id, sourceType, sync_status',
  challenges: 'id, title, sync_status',
  users: 'id, username, role, departmentId, sync_status',
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
  await db.transaction('rw', db.carbon_transactions, db.csr_participations, db.compliance_issues, db.departments, db.emission_factors, db.challenges, db.users, async () => {
    const logsCount = await db.carbon_transactions.count()
    if (logsCount === 0) {
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
    }

    const csrCount = await db.csr_participations.count()
    if (csrCount === 0) {
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
    }

    const compCount = await db.compliance_issues.count()
    if (compCount === 0) {
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
    }

    const deptCount = await db.departments.count()
    if (deptCount === 0) {
      await db.departments.bulkAdd([
        { id: 'dept-eng', name: 'Engineering', headId: 'u-001', employeeCount: 15, esgScores: { env: 80.5, soc: 90.0, gov: 85.0 }, sync_status: 'synced' },
        { id: 'dept-log', name: 'Logistics', headId: 'u-002', employeeCount: 40, esgScores: { env: 45.0, soc: 70.0, gov: 60.5 }, sync_status: 'synced' },
        { id: 'dept-admin', name: 'Administration', headId: 'u-003', employeeCount: 10, esgScores: { env: 75.0, soc: 80.0, gov: 90.0 }, sync_status: 'synced' }
      ])
    }

    const efCount = await db.emission_factors.count()
    if (efCount === 0) {
      await db.emission_factors.bulkAdd([
        { id: 'ef-001', sourceType: 'Fleet Fuel', multiplierValue: 2.31, sync_status: 'synced' },
        { id: 'ef-002', sourceType: 'Electricity', multiplierValue: 0.85, sync_status: 'synced' },
        { id: 'ef-003', sourceType: 'Natural Gas', multiplierValue: 1.88, sync_status: 'synced' }
      ])
    }

    const chCount = await db.challenges.count()
    if (chCount === 0) {
      await db.challenges.bulkAdd([
        { id: 'ch-001', title: 'Cycle to Work', xpValue: 150, status: 'Active', sync_status: 'synced' },
        { id: 'ch-002', title: 'Avoid Single-Use Plastics', xpValue: 100, status: 'Active', sync_status: 'synced' },
        { id: 'ch-003', title: 'Share Fleet Log', xpValue: 50, status: 'Active', sync_status: 'synced' }
      ])
    }

    const userCount = await db.users.count()
    if (userCount === 0) {
      await db.users.bulkAdd([
        { id: 'u-001', name: 'Jatin', username: 'jatin', password: 'password123', departmentId: 'dept-eng', role: 'System Admin', totalXP: 1200, badges: ['Sustainably Starter', 'CSR Champion'], sync_status: 'synced' },
        { id: 'u-002', name: 'Sarah', username: 'sarah', password: 'password123', departmentId: 'dept-log', role: 'Department Head', totalXP: 450, badges: ['Eco Driver'], sync_status: 'synced' },
        { id: 'u-003', name: 'Michael', username: 'michael', password: 'password123', departmentId: 'dept-admin', role: 'Employee', totalXP: 100, badges: [], sync_status: 'synced' }
      ])
    }
  })
}

