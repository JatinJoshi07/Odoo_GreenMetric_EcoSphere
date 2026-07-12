import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'EcoSphere API is running' })
})

app.post('/sync', (req, res) => {
  const payload = req.body
  res.json({ status: 'synced', received: payload })
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`EcoSphere server running on port ${port}`)
})
