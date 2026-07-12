import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'node:dns'

dns.setServers(['8.8.8.8', '1.1.1.1'])
dotenv.config()

const CarbonTransactionSchema = new mongoose.Schema({
  id: String,
  sourceType: String,
  rawAmount: Number,
  calculatedEmissions: Number,
  date: String,
  sync_status: String,
  createdAt: String
})

const CarbonTransaction = mongoose.model('CarbonTransaction', CarbonTransactionSchema)

async function checkDatabase() {
  const uri = process.env.MONGODB_URI
  console.log('Connecting to MongoDB...')
  try {
    await mongoose.connect(uri)
    console.log('Connected!')
    
    const count = await CarbonTransaction.countDocuments()
    console.log(`Total Carbon Transactions: ${count}`)
    
    const transactions = await CarbonTransaction.find().sort({ $natural: -1 }).limit(1)
    console.log('\nLatest Transaction in MongoDB:')
    console.log(JSON.stringify(transactions, null, 2))
    
    await mongoose.disconnect()
  } catch (error) {
    console.error('Failed to query database:', error.message)
  }
}

checkDatabase()
