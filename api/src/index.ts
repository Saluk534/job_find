// src/index.ts
import express, { Request, Response } from 'express'
import { Pool } from 'pg'
import logger from './logger'
import pinoHttp from 'pino-http'

import Redis from 'ioredis'
const app = express()
app.set('trust proxy', true)
// src/index.ts (בתוך שירות ה-API)

import promClient from 'prom-client';
// ... שאר הייבוא ...

// 💡 1. הגדרת רג'יסטרי גלובלי
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register }); // איסוף מדדי ברירת מחדל של Node.js (CPU, Memory, GC)

// 💡 2. הוספת מדד ספציפי (דוגמה)
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

// 💡 3. הוספת המדד ל-API
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 💡 4. הוספת לוגיקה למונה (דוגמה) - הוסף את זה לפני כל res.json
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

// ... שאר הקוד וה-Endpoints ...
// ✅ Allow requests from frontend
// app.use(cors({ origin: 'http://localhost:5173' }))
// ...

// קריאה למשתני סביבה חדשים
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
})

const CACHE_KEY = 'all_users' // מפתח קבוע לשמירת רשימת המשתמשים
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
    try {
        // 1. נסה להביא מה-Cache
        const cachedData = await redisClient.get(CACHE_KEY)
        if (cachedData) {
            req.log.info('Data served from Redis cache')
            console.log('✅ CACHE HIT: Data served from Redis')
            return res.json({ users: JSON.parse(cachedData), source: 'cache' })
        }

        // 2. אם לא נמצא, הבא מה-DB
        console.log('❌ CACHE MISS: Fetching data from Postgres')
        const { rows } = await pool.query('SELECT * FROM users ORDER BY id')

        // 3. שמור ב-Cache (עם TTL של 60 שניות)
        await redisClient.set(CACHE_KEY, JSON.stringify(rows), 'EX', 60) 
        
        return res.json({ users: rows, source: 'database' })
        
    } catch (error) {
        req.log.error(error, 'Error fetching users')
        res.status(500).json({ error: 'Internal server error' })
    }
})
  
  // Add user
  app.post('/users', async (req: Request, res: Response) => {
      const { name } = req.body
      
      if (!name) return res.status(400).json({ error: 'name required' })
      
      try {
          // 1. שמירת המשתמש החדש במסד הנתונים (הלוגיקה הקיימת)
          const result = await pool.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [name])
          
          // 2. 💡 הוספת Cache Invalidation: מחיקת המפתח מ-Redis
          // זה יגרום לבקשת ה-GET הבאה להביא את הנתונים המעודכנים ישירות מה-Postgres.
          await redisClient.del(CACHE_KEY) 
          
          res.json(result.rows[0])
          
      } catch (err) {
          // טיפול בשגיאות DB
          console.error("Database or Redis error:", err)
          res.status(500).json({ error: "Failed to add user." })
      }
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
  // initDb()
  
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
