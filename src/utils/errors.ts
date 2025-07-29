// Base class for custom errors
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error for resources not found
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

// Error for validation failures
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Error for server-side issues
export class InternalServerError extends AppError {
  constructor(message: string = "Erro interno do servidor") {
    super(message, 500);
  }
}
