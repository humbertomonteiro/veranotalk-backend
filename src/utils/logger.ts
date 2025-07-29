import winston from "winston";

const logger = winston.createLogger({
  level: "info", // Nível mínimo de log (info, warn, error, etc.)
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Adiciona data/hora
    winston.format.json() // Formato JSON para logs estruturados
  ),
  transports: [
    // Salva erros em error.log
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Salva todos os logs em combined.log
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
    // Exibe logs no console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Cores no console
        winston.format.simple() // Formato legível no console
      ),
    }),
  ],
});

export default logger;
