# PROJECT-SPECIFIC COPILOT INSTRUCTIONS

## 🎯 PROJECT CONTEXT
This is a Python learning platform with 17 exercises, currently in monolithic structure but migrating to loosely coupled monorepo architecture.

## 🏗️ CURRENT ARCHITECTURE STATE
- **Status**: Monolithic structure (NEEDS RESTRUCTURING)
- **Production**: AWS Lightsail Container Service v10
- **URL**: https://python-portal-real.nf0keysv54fy8.eu-west-1.cs.amazonlightsail.com/
- **Structure**: Single repo with tightly coupled frontend/backend/shared

## 🎯 TARGET ARCHITECTURE (from RESTRUCTURING_PLAN.md)
```
python-learning-platform/
├── packages/
│   ├── @portal/types/        # Shared TypeScript definitions
│   ├── @portal/frontend/     # React application
│   ├── @portal/backend/      # Express API server
│   ├── @portal/exercises/    # Exercise content & metadata
│   └── @portal/executor/     # Python code execution service
└── infrastructure/
    ├── docker/              # Container configurations
    └── terraform/           # AWS infrastructure as code
```

## 📚 EXERCISE INVENTORY (ALL MUST WORK)
1. E0_greet - Welcome greeting
2. E1_seconds_to_hms - Time conversion
3. E1_tip_calc - Tip calculator
4. E2_initials - Name initials
5. E2_username_slug - Username creation
6. E3_grade_mapper - Grade assignment
7. E3_leap_year - Leap year checker
8. E4_fizzbuzz - FizzBuzz implementation
9. E4_prime_checker - Prime number detection
10. E5_math_utils - Math utilities
11. E5_password_strength - Password validator
12. E5_temp_convert - Temperature conversion
13. E6_set_ops - Set operations
14. E7_sum_numbers - Number summing
15. E8_ops_module - Operations module
16. E9_bug_hunt - Debug exercise
17. All exercises in solutions/ folder

## 🧪 TESTING PROTOCOL
When testing functionality:
1. Use `#playwright` browser automation tools
2. Navigate to production URL
3. Check console for errors (MUST be 0)
4. Test each exercise loads and executes
5. Verify Python code execution works
6. Run tests on exercises
7. Check progress saves
8. Verify responsive design
9. Test navigation between sections

## 💰 AWS COST CONSTRAINTS
- **CURRENT SPEND**: $0 (within $100 credit)
- **ANNUAL LIMIT**: Under $90/year
- **FREE TIER ONLY**: No exceptions
- **PROHIBITED**: RDS, NAT Gateways, Elastic IPs
- **ALLOWED**: Lightsail Container Service (3 months free, then $10/month)

## 🔧 DEVELOPMENT STANDARDS
- Zero lint errors (ESLint must pass)
- Zero TypeScript errors (tsc must pass) 
- No console.log in production code
- No commented-out code blocks
- No TODO comments (implement instead)
- All imports must resolve correctly
- Proper error handling required

## 📋 MIGRATION STATUS TRACKING
Refer to RESTRUCTURING_PLAN.md for current phase:
- [ ] Phase 1: Preparation & Backup
- [ ] Phase 2: Extract @portal/types
- [ ] Phase 3: Migrate Backend Package
- [ ] Phase 4: Migrate Frontend Package  
- [ ] Phase 5: Extract Exercise Content
- [ ] Phase 6: Create Executor Service
- [ ] Phase 7: Infrastructure Setup
- [ ] Phase 8: CI/CD Pipeline
- [ ] Phase 9: Testing & Validation
- [ ] Phase 10: Production Deployment

## 🚨 CRITICAL VALIDATIONS
Before ANY commit or deployment:
1. Run `npm run lint` - MUST pass
2. Run `npm run build` - MUST succeed
3. Test with `#playwright` browser - ALL features work
4. Check AWS billing - MUST show $0 charges
5. Verify all 17 exercises accessible
6. Confirm Python execution functional

## 📁 CURRENT FILE LOCATIONS
- **Exercises**: `exercises/E*_*/` (17 total)
- **Solutions**: `solutions/E*_*/` (matching exercises)
- **Frontend**: `python-learning-portal/frontend/src/`
- **Backend**: `python-learning-portal/backend/src/`
- **Shared Types**: `python-learning-portal/shared/types.ts`
- **Docker Config**: `python-learning-portal/docker-compose.yml`

## 🎯 IMMEDIATE PRIORITIES
1. Execute RESTRUCTURING_PLAN.md phases sequentially
2. Maintain production functionality throughout migration
3. Test every change with #playwright browser automation
4. Keep AWS costs at absolute zero
5. Ensure all 17 exercises remain functional

## 🔒 NON-NEGOTIABLES
- AWS Free Tier compliance (ZERO exceptions)
- Complete #playwright testing before any deployment
- Zero errors policy (lint, TypeScript, runtime)
- Loosely coupled final architecture
- All 17 exercises must remain functional