import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, stack, service, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  // Only include metadata if there are additional fields beyond defaultMeta
  const filteredMetadata = { ...metadata };
  // Remove defaultMeta fields that we don't want to display
  delete filteredMetadata.service;
  
  if (Object.keys(filteredMetadata).length > 0) {
    msg += `\n${JSON.stringify(filteredMetadata, null, 2)}`;
  }
  
  return msg;
});

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format((info) => {
      // Remove service from metadata to prevent duplicate output
      delete info.service;
      return info;
    })(),
    logFormat
  ),
  defaultMeta: { service: 'nectar-api' },
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        winston.format((info) => {
          // Remove service from metadata to prevent duplicate output
          delete info.service;
          return info;
        })(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    // Only add file transports if not in Cloud Run environment
    ...(process.env.K_SERVICE ? [] : [
      // File transport for errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ])
  ],
  // Handle exceptions and rejections (only file handlers if not in Cloud Run)
  exceptionHandlers: process.env.K_SERVICE || process.env.FUNCTION_TARGET ? [] : [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: process.env.K_SERVICE || process.env.FUNCTION_TARGET ? [] : [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Create logs directory if it doesn't exist (basic check)
try {
  // Winston will create the directory automatically, but we can add a note
  logger.info('Logger initialized');
} catch (error) {
  console.error('Failed to initialize logger:', error);
}

export default logger;
