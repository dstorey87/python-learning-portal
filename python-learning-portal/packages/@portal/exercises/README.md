# @portal/exercises

Exercise content package for the Python Learning Portal. This package contains all exercise definitions, content, and utilities for loading and managing programming exercises.

## Structure

```
@portal/exercises/
├── src/              # TypeScript source files
│   ├── loaders/      # Exercise loading utilities
│   ├── validators/   # Content validation
│   └── index.ts      # Main exports
├── content/          # Raw exercise content
│   ├── E0_greet/
│   ├── E1_seconds_to_hms/
│   └── ...
└── dist/            # Built TypeScript files
```

## Features

- **Exercise Loading**: Utilities to load exercises from content directory
- **Content Validation**: Validate exercise format and structure
- **Metadata Management**: Handle exercise metadata and categorization
- **Type Safety**: Full TypeScript support with shared types

## Usage

```typescript
import { ExerciseLoader, validateExercise } from '@portal/exercises';

const loader = new ExerciseLoader();
const exercises = await loader.loadAll();
```

## Content Format

Each exercise follows this structure:
- `instructions.md` - Exercise description and requirements
- `starter.py` - Initial code template
- `test.py` - Test cases for validation

## Development

```bash
npm run build    # Build TypeScript
npm run dev      # Watch mode
npm run lint     # ESLint check
```