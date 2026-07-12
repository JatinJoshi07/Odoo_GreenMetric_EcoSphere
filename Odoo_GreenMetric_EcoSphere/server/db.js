import mongoose from 'mongoose'
import dns from 'node:dns'

dns.setServers(['8.8.8.8', '1.1.1.1'])

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecosphere'
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds instead of 30 seconds
    })
    console.log('MongoDB connected successfully to', uri)
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message)
    console.warn('⚠️ Server is running, but database operations will fail until MongoDB is started.')
  }
}


