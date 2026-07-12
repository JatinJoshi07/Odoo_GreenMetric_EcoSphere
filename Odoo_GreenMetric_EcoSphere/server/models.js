import mongoose from 'mongoose'

// --- MASTER DATA SCHEMAS ---

const DepartmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  headId: { type: String, default: '' },
  employeeCount: { type: Number, default: 0 },
  esgScores: {
    env: { type: Number, default: 0 },
    soc: { type: Number, default: 0 },
    gov: { type: Number, default: 0 }
  }
}, { timestamps: true })

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  departmentId: { type: String, default: '' },
  role: { type: String, required: true, enum: ['System Admin', 'Department Head', 'Employee'] },
  totalXP: { type: Number, default: 0 },
  badges: { type: [String], default: [] }
}, { timestamps: true })

const EmissionFactorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  sourceType: { type: String, required: true },
  multiplierValue: { type: Number, required: true }
}, { timestamps: true })

const ChallengeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  xpValue: { type: Number, required: true },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] }
}, { timestamps: true })


// --- TRANSACTIONAL DATA SCHEMAS ---

const CarbonTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  sourceType: { type: String, required: true },
  rawAmount: { type: Number, required: true },
  calculatedEmissions: { type: Number, required: true },
  date: { type: String, required: true },
  sync_status: { type: String, default: 'synced', enum: ['pending', 'synced'] }
}, { timestamps: true })

const CsrParticipationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true },
  activityId: { type: String, required: true },
  proofFile: { type: String, default: '' }, // Base64 proof string
  status: { type: String, default: 'Submitted' },
  sync_status: { type: String, default: 'synced', enum: ['pending', 'synced'] }
}, { timestamps: true })

const ComplianceIssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  ownerId: { type: String, required: true },
  dueDate: { type: String, required: true },
  status: { type: String, default: 'Open', enum: ['Open', 'Closed'] },
  sync_status: { type: String, default: 'synced', enum: ['pending', 'synced'] }
}, { timestamps: true })


// --- EXPORTS ---

export const Department = mongoose.model('Department', DepartmentSchema)
export const User = mongoose.model('User', UserSchema)
export const EmissionFactor = mongoose.model('EmissionFactor', EmissionFactorSchema)
export const Challenge = mongoose.model('Challenge', ChallengeSchema)

export const CarbonTransaction = mongoose.model('CarbonTransaction', CarbonTransactionSchema)
export const CsrParticipation = mongoose.model('CsrParticipation', CsrParticipationSchema)
export const ComplianceIssue = mongoose.model('ComplianceIssue', ComplianceIssueSchema)
