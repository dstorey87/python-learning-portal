# Python Learning Portal

A modern, interactive web application for learning Python programming with a beautiful dark theme inspired by CodeAcademy's design. Features a full-stack TypeScript architecture with React frontend and Node.js backend.

## ✨ Features

- 🚀 **Live Code Execution**: Write and run Python code directly in the browser
- 📝 **Interactive Exercises**: Step-by-step Python learning with guided exercises
- ✅ **Automated Testing**: Real-time feedback with automated test validation
- 🎯 **Solution Checking**: Compare your solutions with optimal implementations
- 📊 **Progress Tracking**: Monitor your learning journey and achievements
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- 🔒 **Secure Execution**: Safe Python code execution environment
- 🧪 **Full Test Coverage**: Comprehensive testing with Playwright

## 🏗️ Architecture

This project uses a **loosely coupled package architecture** for maintainability and scalability:

```
packages/
├── @portal/types/        # Shared TypeScript type definitions
├── @portal/backend/      # Express.js API server
├── @portal/frontend/     # React application with Vite
├── @portal/exercises/    # Exercise content and solutions
└── @portal/executor/     # Python execution microservice
```

## Tech Stack

### Frontend (`@portal/frontend`)
- React 18 + TypeScript
- Vite for fast development
- TailwindCSS for styling
- Monaco Editor (VS Code editor)
- React Query for state management

### Backend (`@portal/backend`)
- Node.js + Express + TypeScript
- SQLite database for progress tracking
- RESTful API design

### Python Execution (`@portal/executor`)
- Secure Python subprocess execution
- Independent microservice architecture
- Docker containerization support

### Exercise Content (`@portal/exercises`)
- Modular exercise definitions
- Solution management system
- Content parsing and validation

### Type System (`@portal/types`)
- Centralized TypeScript definitions
- Shared types across all packages
- Type safety enforcement

### Testing
- Playwright for E2E testing
- Jest for unit testing
- Full test automation

## Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. Clone and install dependencies:
```bash
git clone <repo-url>
cd python-learning-portal
npm run install:all
```

2. Start the development servers:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

### Testing

Run E2E tests with Playwright:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

## Project Structure

```
python-learning-portal/
├── backend/           # Express.js API server
├── frontend/          # React application
├── tests/            # Playwright E2E tests
├── shared/           # Shared TypeScript types
└── data/            # Exercise data and solutions
```

## Development Workflow

1. Backend API development with hot reload
2. Frontend React development with Vite
3. Continuous E2E testing with Playwright
4. No shortcuts - every feature fully tested

## License

MIT License