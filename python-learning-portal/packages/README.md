# Python Learning Platform - Monorepo

## 🏗️ Architecture Overview
This is a monorepo containing all packages for the Python Learning Platform, designed with loose coupling and independent deployability.

## 📦 Package Structure
```
packages/
├── @portal/types/        # Shared TypeScript type definitions
├── @portal/frontend/     # React frontend application  
├── @portal/backend/      # Express API server
├── @portal/exercises/    # Exercise content and metadata
└── @portal/executor/     # Python code execution service
```

## 🚀 Infrastructure
```
infrastructure/
├── docker/              # Container configurations
└── terraform/           # AWS infrastructure as code
```

## 📋 Current Migration Status
- [x] Phase 1: Preparation & Backup ✅
- [ ] Phase 2: Extract @portal/types Package
- [ ] Phase 3: Migrate Backend Package
- [ ] Phase 4: Migrate Frontend Package
- [ ] Phase 5: Extract Exercise Content Package
- [ ] Phase 6: Create Executor Service Package
- [ ] Phase 7: Infrastructure Setup
- [ ] Phase 8: CI/CD Pipeline Setup
- [ ] Phase 9: Testing & Validation
- [ ] Phase 10: Production Deployment

## 🎯 Success Criteria
- ✅ All 17 exercises remain functional
- ✅ Zero AWS costs (Free Tier only)
- ✅ Independent package deployment
- ✅ Loose coupling between packages
- ✅ Complete #playwright browser testing

## 🔄 Development Workflow
Each package maintains its own:
- `package.json` with dependencies
- `tsconfig.json` for TypeScript config
- Independent build and test scripts
- Separate Docker containers for deployment

## 📚 Documentation
- See `RESTRUCTURING_PLAN.md` for detailed migration steps
- See `.github/copilot-instructions.md` for development requirements
- See `.copilot/instructions.md` for project context