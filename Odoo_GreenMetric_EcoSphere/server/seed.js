import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from './db.js'
import { Department, User, EmissionFactor, Challenge } from './models.js'

dotenv.config()

async function seed() {
  console.log('Connecting to database...')
  await connectDB()

  try {
    console.log('Clearing existing collections...')
    await Department.deleteMany({})
    await User.deleteMany({})
    await EmissionFactor.deleteMany({})
    await Challenge.deleteMany({})

  
    const seedDepts = [
      { id: 'dept-eng', name: 'Engineering', headId: 'u-001', employeeCount: 15, esgScores: { env: 80.5, soc: 90.0, gov: 85.0 } },
      { id: 'dept-log', name: 'Logistics', headId: 'u-002', employeeCount: 40, esgScores: { env: 45.0, soc: 70.0, gov: 60.5 } },
      { id: 'dept-admin', name: 'Administration', headId: 'u-003', employeeCount: 10, esgScores: { env: 75.0, soc: 80.0, gov: 90.0 } }
    ]
    await Department.insertMany(seedDepts)
    console.log('✓ Seeded Departments')


    const seedUsers = [
      { id: 'u-001', name: 'Jatin', username: 'jatin', password: 'password123', departmentId: 'dept-eng', role: 'System Admin', totalXP: 1200, badges: ['Sustainably Starter', 'CSR Champion'] },
      { id: 'u-002', name: 'Sarah', username: 'sarah', password: 'password123', departmentId: 'dept-log', role: 'Department Head', totalXP: 450, badges: ['Eco Driver'] },
      { id: 'u-003', name: 'Michael', username: 'michael', password: 'password123', departmentId: 'dept-admin', role: 'Employee', totalXP: 100, badges: [] }
    ]
    await User.insertMany(seedUsers)
    console.log('✓ Seeded Users')

    
    const seedEFs = [
      { id: 'ef-001', sourceType: 'Fleet Fuel', multiplierValue: 2.31 },
      { id: 'ef-002', sourceType: 'Electricity', multiplierValue: 0.85 },
      { id: 'ef-003', sourceType: 'Natural Gas', multiplierValue: 1.88 }
    ]
    await EmissionFactor.insertMany(seedEFs)
    console.log('✓ Seeded Emission Factors')

   
    const seedChallenges = [
      { id: 'ch-001', title: 'Cycle to Work', xpValue: 150, status: 'Active' },
      { id: 'ch-002', title: 'Avoid Single-Use Plastics', xpValue: 100, status: 'Active' },
      { id: 'ch-003', title: 'Share Fleet Log', xpValue: 50, status: 'Active' }
    ]
    await Challenge.insertMany(seedChallenges)
    console.log('✓ Seeded Challenges')

    console.log('🎉 Seeding successfully completed!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed.')
  }
}

seed()
