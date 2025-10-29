import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', // יפה לקריאה במסוף
    options: { colorize: true }
  }
})

export default logger
