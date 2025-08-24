"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ExecutionError extends AppError {
    constructor(message, originalError) {
        super(message, 500, 'EXECUTION_ERROR');
        this.originalError = originalError;
        this.name = 'ExecutionError';
    }
}
exports.ExecutionError = ExecutionError;
//# sourceMappingURL=types.js.map