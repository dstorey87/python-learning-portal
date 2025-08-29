# @portal/types

Shared TypeScript type definitions for the Python Learning Portal.

## Purpose

This package serves as the **single source of truth** for all TypeScript type definitions across the Python Learning Portal monorepo. It provides:

- Core domain types (Exercise, User, UserProgress, etc.)
- API and execution types
- Frontend-specific interfaces
- Database schema types  
- Error classes and utilities
- Type guards and validation functions

## Architecture Principle

**NO OTHER PACKAGE should define types that could be shared.** All packages must import types from `@portal/types` to maintain loose coupling and prevent duplication.

## Usage

```typescript
import { Exercise, TestResult, APIResponse, AppError } from '@portal/types';

// Use types in your package
function processExercise(exercise: Exercise): APIResponse<TestResult> {
  // Implementation
}
```

## Development

```bash
# Build types
npm run build

# Watch for changes
npm run dev

# Lint types
npm run lint

# Clean build artifacts
npm run clean
```

## Package Structure

```
src/
├── index.ts          # Main types export file
└── ...               # Future: organized by domain if needed
```

## Guidelines

1. **Single Source of Truth**: All shared types belong here
2. **No Duplication**: If a type exists here, don't redefine it elsewhere
3. **Semantic Versioning**: Breaking changes require major version bumps
4. **Documentation**: Complex types should include JSDoc comments
5. **Type Guards**: Provide runtime validation functions when needed

## Dependencies

This package has **zero runtime dependencies** to avoid coupling issues. Only dev dependencies for TypeScript compilation and linting.