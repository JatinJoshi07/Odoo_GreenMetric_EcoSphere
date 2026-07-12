import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db.js'
import { Department, User, EmissionFactor, Challenge, CarbonTransaction, CsrParticipation, ComplianceIssue } from './models.js'

dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'EcoSphere API is running' })
})

app.post('/sync', async (req, res) => {
  const { carbon_transactions, csr_participations, compliance_issues } = req.body
  try {
    if (carbon_transactions && carbon_transactions.length > 0) {
      for (const tx of carbon_transactions) {
        await CarbonTransaction.findOneAndUpdate({ id: tx.id }, tx, { upsert: true })
      }
    }
    if (csr_participations && csr_participations.length > 0) {
      for (const csr of csr_participations) {
        await CsrParticipation.findOneAndUpdate({ id: csr.id }, csr, { upsert: true })
      }
    }
    if (compliance_issues && compliance_issues.length > 0) {
      for (const issue of compliance_issues) {
        await ComplianceIssue.findOneAndUpdate({ id: issue.id }, issue, { upsert: true })
      }
    }
    res.json({ status: 'synced', message: 'Data successfully saved to MongoDB' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

// Dev seeding endpoint to initialize master data
app.post('/dev/seed', async (_req, res) => {
  try {
    // 1. Clear existing master collections
    await Department.deleteMany({})
    await User.deleteMany({})
    await EmissionFactor.deleteMany({})
    await Challenge.deleteMany({})

    // 2. Seed departments
    const seedDepts = [
      { id: 'dept-eng', name: 'Engineering', headId: 'u-001', employeeCount: 15, esgScores: { env: 80.5, soc: 90.0, gov: 85.0 } },
      { id: 'dept-log', name: 'Logistics', headId: 'u-002', employeeCount: 40, esgScores: { env: 45.0, soc: 70.0, gov: 60.5 } },
      { id: 'dept-admin', name: 'Administration', headId: 'u-003', employeeCount: 10, esgScores: { env: 75.0, soc: 80.0, gov: 90.0 } }
    ]
    await Department.insertMany(seedDepts)

    // 3. Seed users
    const seedUsers = [
      { id: 'u-001', name: 'Jatin', departmentId: 'dept-eng', role: 'System Admin', totalXP: 1200, badges: ['Sustainably Starter', 'CSR Champion'] },
      { id: 'u-002', name: 'Sarah', departmentId: 'dept-log', role: 'Department Head', totalXP: 450, badges: ['Eco Driver'] },
      { id: 'u-003', name: 'Michael', departmentId: 'dept-admin', role: 'Employee', totalXP: 100, badges: [] }
    ]
    await User.insertMany(seedUsers)

    // 4. Seed emission factors
    const seedEFs = [
      { id: 'ef-001', sourceType: 'Fleet Fuel', multiplierValue: 2.31 },
      { id: 'ef-002', sourceType: 'Electricity', multiplierValue: 0.85 },
      { id: 'ef-003', sourceType: 'Natural Gas', multiplierValue: 1.88 }
    ]
    await EmissionFactor.insertMany(seedEFs)

    // 5. Seed challenges
    const seedChallenges = [
      { id: 'ch-001', title: 'Cycle to Work', xpValue: 150, status: 'Active' },
      { id: 'ch-002', title: 'Avoid Single-Use Plastics', xpValue: 100, status: 'Active' },
      { id: 'ch-003', title: 'Share Fleet Log', xpValue: 50, status: 'Active' }
    ]
    await Challenge.insertMany(seedChallenges)

    res.json({
      status: 'success',
      message: 'Master database successfully seeded',
      counts: {
        departments: seedDepts.length,
        users: seedUsers.length,
        emissionFactors: seedEFs.length,
        challenges: seedChallenges.length
      }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`EcoSphere server running on port ${port}`)
})

