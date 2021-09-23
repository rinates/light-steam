import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;

const messageFormat = printf(
  // eslint-disable-next-line no-shadow
  ({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`,
);

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    messageFormat,
  ),
  transports: [
    new transports.File({ filename: './logs/error.log', level: 'error' }),
    new transports.File({ filename: './logs/combined.log' }),
    new transports.File({ filename: './logs/debug.log', level: 'debug' }),
  ],
});

logger.add(
  new transports.Console({
    format: format.combine(format.colorize(), messageFormat),
  }),
);

global.logger = logger;
