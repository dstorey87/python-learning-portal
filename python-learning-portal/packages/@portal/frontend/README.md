# @portal/frontend

React frontend application for the Python Learning Portal - a modern, interactive platform for learning Python through hands-on exercises.

## Overview

This package contains the complete React frontend built with TypeScript, Vite, and Tailwind CSS. It provides a rich, interactive user experience with features including:

- **Interactive Dashboard**: Progress tracking and learning analytics
- **Code Editor**: Monaco-powered Python code editing with syntax highlighting
- **Live Execution**: In-browser Python code execution and testing
- **Exercise System**: 17 structured Python programming exercises
- **Learning Sections**: Comprehensive tutorials and concept explanations  
- **Progress Tracking**: User progress persistence and achievements
- **Responsive Design**: Mobile-first design for all devices

## Architecture

### Package Structure
```
packages/@portal/frontend/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/              # Top-level page components
│   ├── api/                # API client and service layers
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state management
│   ├── data/               # Static data and configurations
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── dist/                   # Build output
└── package.json            # Package dependencies
```

### Dependencies
- **React 18**: Modern React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server  
- **Tailwind CSS**: Utility-first styling
- **Monaco Editor**: VS Code-powered code editor
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **@portal/types**: Shared TypeScript type definitions

## Development

### Scripts
- `npm run dev`: Start development server (port 3010)
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm run clean`: Clean build artifacts

### Development Server
The frontend runs on **port 3010** in development mode to avoid conflicts with the backend service (ports 3050-3060).

### API Integration
The frontend communicates with the `@portal/backend` service through a well-defined REST API:

- **Exercise Management**: CRUD operations for exercises and progress
- **Code Execution**: Python code execution and testing
- **User Management**: Authentication and profile management
- **Progress Tracking**: Learning progress and analytics

## Features

### Core Components

#### Dashboard
- Real-time progress tracking
- Exercise completion statistics
- Learning streak tracking
- Quick access to exercises

#### Exercise System
- 17 structured Python exercises
- Difficulty progression (Beginner → Intermediate → Advanced)
- Interactive code editor with syntax highlighting
- Live code execution and testing
- Hints and solutions system

#### Learning Sections
- Comprehensive Python tutorials
- Interactive code examples
- Concept explanations with practical examples
- Progress tracking through learning materials

#### Code Editor
- Monaco Editor integration (VS Code editor)
- Python syntax highlighting
- IntelliSense and code completion
- Error highlighting and diagnostics

### State Management
Uses Zustand for lightweight, predictable state management:

- **Exercise State**: Current exercise, code, and progress
- **User State**: Authentication and profile information  
- **UI State**: Theme, loading states, and navigation
- **Progress State**: Learning progress and achievements

### Responsive Design
Mobile-first design approach with Tailwind CSS:
- **Desktop**: Full-featured layout with sidebar navigation
- **Tablet**: Optimized layout with collapsible components
- **Mobile**: Touch-friendly interface with bottom navigation

## Integration

### Type Safety
Leverages `@portal/types` package for complete type safety across the frontend-backend boundary. All API interfaces, data models, and component props are fully typed.

### Backend Communication
Integrates seamlessly with `@portal/backend` through:
- Axios-based API client with response/request interceptors
- Error handling and retry logic
- Loading states and optimistic updates
- Real-time progress synchronization

### Build Process
- TypeScript compilation with strict type checking
- Vite-based bundling with code splitting
- CSS optimization with Tailwind JIT compilation
- Asset optimization and compression

## Deployment

### Production Build
```bash
npm run build
```

Creates optimized production bundle in `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting for optimal loading
- Asset optimization and compression
- Source maps for debugging

### Docker Support
The package includes Docker configuration for containerized deployment:
- Multi-stage builds for optimal image size
- Production-optimized Nginx configuration
- Health checks and monitoring
- Environment variable configuration

### Integration with Backend
The frontend is designed to work with the `@portal/backend` service:
- CORS configuration for cross-origin requests
- API base URL configuration through environment variables
- Authentication token management
- Error handling and user feedback

## Contributing

This package follows the loosely coupled monorepo architecture:
- Independent deployment capability
- Shared type definitions through `@portal/types`
- Clean separation of concerns
- Comprehensive testing and validation

For development, ensure all changes maintain:
- Zero TypeScript compilation errors
- Zero ESLint violations
- Full functionality preservation
- Responsive design compliance