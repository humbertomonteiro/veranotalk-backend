"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: "info", // Nível mínimo de log (info, warn, error, etc.)
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Adiciona data/hora
    winston_1.default.format.json() // Formato JSON para logs estruturados
    ),
    transports: [
        // Salva erros em error.log
        new winston_1.default.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        // Salva todos os logs em combined.log
        new winston_1.default.transports.File({
            filename: "logs/combined.log",
        }),
        // Exibe logs no console
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), // Cores no console
            winston_1.default.format.simple() // Formato legível no console
            ),
        }),
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map