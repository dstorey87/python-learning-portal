"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONCEPT_CATEGORIES = exports.THEMES = exports.DIFFICULTY_LEVELS = exports.ExecutionError = exports.ValidationError = exports.AppError = void 0;
exports.isExercise = isExercise;
exports.isTestResult = isTestResult;
exports.isAPIResponse = isAPIResponse;
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
function isExercise(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'title' in obj &&
        'starterCode' in obj &&
        typeof obj.id === 'string');
}
function isTestResult(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'passed' in obj &&
        'output' in obj &&
        'testCases' in obj &&
        typeof obj.passed === 'boolean');
}
function isAPIResponse(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'success' in obj &&
        typeof obj.success === 'boolean');
}
exports.DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];
exports.THEMES = ['light', 'dark'];
exports.CONCEPT_CATEGORIES = ['function', 'operator', 'keyword', 'data-type', 'method', 'concept'];
//# sourceMappingURL=index.js.map