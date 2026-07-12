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
  console.log('Connecting to MongoDB database...')
  try {
    await mongoose.connect(uri)
    console.log('Connected!')
    
    const transactions = await CarbonTransaction.find({ rawAmount: 77 })
    console.log('\nFound Transactions in MongoDB with rawAmount 77:')
    console.log(JSON.stringify(transactions, null, 2))
    
    await mongoose.disconnect()
    console.log('\nDisconnected successfully.')
  } catch (error) {
    console.error('Database connection or query failed:', error.message)
  }
}

checkDatabase()
