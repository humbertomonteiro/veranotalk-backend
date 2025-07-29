"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
// Base class for custom errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Error for resources not found
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
// Error for validation failures
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
// Error for server-side issues
class InternalServerError extends AppError {
    constructor(message = "Erro interno do servidor") {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=errors.js.map