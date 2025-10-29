// src/index.ts
import express, { Request, Response } from 'express'
import { Pool } from 'pg'
import logger from './logger'
import pinoHttp from 'pino-http'

import cors from 'cors'


const app = express()
app.set('trust proxy', true)

// ✅ Allow requests from frontend
// app.use(cors({ origin: 'http://localhost:5173' }))

app.use(express.json())



// לוג לכל בקשה
app.use(pinoHttp({ logger }))

const pool = new Pool({
  connectionString: process.env.DB_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
})

app.get('/', (req: Request, res: Response) => {
  req.log.info('root endpoint hit') // יש לך logger פר־בקשה
  res.json({ ok: true, service: 'api', env: process.env.ENV || 'dev' })
})

// Get all users
app.get('/users', async (req: Request, res: Response) => {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id')
    res.json({ users: rows })
  })
  
  // Add user
  app.post('/users', async (req: Request, res: Response) => {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    const result = await pool.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [name])
    res.json(result.rows[0])
  })
// Create table if not exists
async function initDb() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      )
    `)
    console.log("✅ users table ready")
  }
  initDb()
  
app.get('/db-check', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT 1 as ok')
    req.log.info({ dbResult: result.rows[0] }, 'db-check success')
    res.json({ db: 'ok', result: result.rows[0].ok })
  } catch (err: any) {
    req.log.error({ err }, 'db-check failed')
    res.status(500).json({ db: 'error', detail: err.message })
  }
})

const port = Number(process.env.PORT || 8000)
app.listen(port, () => logger.info(`API running on http://localhost:${port}`))
