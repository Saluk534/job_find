// src/logger.ts (או הקובץ שבו ה-Logger מוגדר)

import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', 
    options: { 
      colorize: true,
      
      // 1. הגדרת זמן קריאה לאדם
      translateTime: 'SYS:HH:MM:ss Z', 
      
      // 2. התעלמות חלקית: נמחק שדות מיותרים, אבל *נשמור* את req ו-res.
      // השדות `req` ו-`res` מכילים את כל המידע על הבקשה והתגובה.
      ignore: 'pid,hostname,msg,res,responseTime', 
      
      // 3. הגדרת פורמט ההודעה המותאם אישית
      // אנחנו משתמשים ב-req.method וב-req.url מתוך אובייקט ה-req המלא
      messageFormat: '{level}: {req.method} {req.url} - {msg}'

    }
  }
})

export default logger