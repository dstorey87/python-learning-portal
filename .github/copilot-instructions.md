# MANDATORY: GitHub Copilot Instructions - COMPLETE REQUIREMENTS

## 🚨 ABSOLUTE REQUIREMENTS - MUST FOLLOW ALL

### 1. AWS COST REQUIREMENTS - ZERO TOLERANCE
- **MUST stay in AWS Free Tier ONLY**
- **NEVER exceed $0 in actual charges**
- **ONLY use the $100 AWS credit allowance**
- **Current setup MUST remain under $90/year**
- **Lightsail Container Service: 3 months free, then $10/month**
- **NEVER create resources that incur immediate charges**
- **NO RDS, NO NAT Gateways, NO Elastic IPs**
- **ALWAYS check Free Tier eligibility before creating ANY resource**

### 2. TESTING REQUIREMENTS - MANDATORY
- **MUST test EVERYTHING with Playwright browser automation**
- **Use #playwright browser tools, NOT local Playwright tests**
- **MUST verify ALL functionality works before declaring complete**
- **Test checklist MUST include:**
  - [ ] Frontend loads without errors
  - [ ] Backend API responds correctly
  - [ ] All 17 exercises load and display
  - [ ] Python code execution works
  - [ ] Test runner functions properly
  - [ ] Progress tracking saves correctly
  - [ ] No CORS errors
  - [ ] No console errors
  - [ ] All navigation works
  - [ ] Mobile responsive design works

### 3. CODE QUALITY REQUIREMENTS
- **ZERO lint errors allowed**
- **ZERO TypeScript errors allowed**
- **NO redundant code**
- **NO console.log in production**
- **NO commented-out code**
- **NO TODO comments - implement them**
- **MUST pass ALL ESLint rules**
- **MUST build successfully**

### 4. PROJECT STRUCTURE REQUIREMENTS
You MUST adhere to this exact structure:

```
python-learning-platform/
├── packages/
│   ├── @portal/types/        # ONLY place for type definitions
│   ├── @portal/frontend/     # React code ONLY
│   ├── @portal/backend/      # Express API ONLY
│   ├── @portal/exercises/    # Exercise content ONLY
│   └── @portal/executor/     # Python execution ONLY
└── infrastructure/           # Docker/Terraform ONLY
```

### 5. ARCHITECTURE RULES
1. **NEVER duplicate type definitions**
2. **NEVER mix infrastructure with application code**
3. **NEVER create tight coupling between packages**
4. **ALWAYS use @portal/types for shared types**
5. **ALWAYS maintain package boundaries**
6. **Each package MUST be independently deployable**
7. **Each package MUST have its own package.json**
8. **Each package MUST have its own tsconfig.json**

### 6. DEPLOYMENT REQUIREMENTS
- **MUST work in production on AWS Lightsail**
- **MUST use Docker containers**
- **MUST have health checks**
- **MUST handle errors gracefully**
- **MUST have proper logging**
- **MUST be accessible via HTTPS**
- **Current URL: https://python-portal-real.nf0keysv54fy8.eu-west-1.cs.amazonlightsail.com/**

### 7. FUNCTIONALITY REQUIREMENTS
The application MUST have:
- [ ] Dashboard with progress tracking
- [ ] Learn section with 5 chapters
- [ ] Practice section with ALL 17 exercises working
- [ ] Dictionary with 28 Python concepts
- [ ] Code editor with syntax highlighting
- [ ] Python execution in browser
- [ ] Test runner with visual feedback
- [ ] Progress persistence
- [ ] User authentication (at least guest mode)
- [ ] Responsive design for mobile/tablet/desktop

### 8. BROWSER TESTING PROTOCOL
When testing with #playwright:
1. Navigate to production URL
2. Check console for errors (MUST be zero)
3. Test each major section (Dashboard, Learn, Practice, Dictionary)
4. Verify exercises load with content
5. Test code execution with actual Python code
6. Run tests on at least one exercise
7. Verify progress saves
8. Check responsive design at different resolutions
9. Test navigation between sections
10. Verify no CORS errors

### 9. MIGRATION STATUS TRACKING
Current Migration Status (UPDATE AFTER EACH PHASE):
- [ ] Phase 1: Preparation - backup and structure creation
- [ ] Phase 2: Extract Types Package - single source of truth
- [ ] Phase 3: Migrate Backend - Express API isolation
- [ ] Phase 4: Migrate Frontend - React app isolation
- [ ] Phase 5: Extract Exercise Content - separate package
- [ ] Phase 6: Create Executor Service - Python runner
- [ ] Phase 7: Infrastructure Setup - Docker/Terraform
- [ ] Phase 8: CI/CD Pipeline Setup - GitHub Actions
- [ ] Phase 9: Testing & Validation - Playwright verification
- [ ] Phase 10: Deployment - AWS Lightsail update

### 10. VALIDATION CHECKLIST
Before ANY deployment or declaring ANYTHING complete:
- [ ] Run `npm run lint` - MUST pass with 0 errors
- [ ] Run `npm run build` - MUST succeed
- [ ] Test with #playwright browser - ALL features work
- [ ] Check AWS billing - MUST show $0 charges
- [ ] Verify Free Tier usage - MUST be within limits
- [ ] Check CloudWatch - No errors in logs
- [ ] Test on mobile device/responsive mode
- [ ] Verify all 17 exercises are accessible
- [ ] Confirm Python execution works
- [ ] Validate progress saves correctly

### 11. GIT & REPOSITORY REQUIREMENTS
- **MUST commit clean, working code only**
- **MUST push to Azure DevOps: dstorey87/Python-private**
- **MUST tag versions properly**
- **MUST have clear commit messages**
- **NEVER commit secrets or API keys**
- **ALWAYS use .gitignore properly**

### 12. ERROR HANDLING
When encountering issues:
1. **MUST fix immediately - no "partial" solutions**
2. **MUST test the fix with #playwright**
3. **MUST verify no new issues introduced**
4. **MUST update documentation if behavior changes**

### 13. PERFORMANCE REQUIREMENTS
- Frontend bundle < 5MB
- Backend startup < 30 seconds
- API response time < 500ms
- Python execution < 5 seconds
- Page load time < 3 seconds

### 14. SECURITY REQUIREMENTS
- **NO hardcoded secrets**
- **NO exposed API keys**
- **Use environment variables**
- **Sanitize user inputs**
- **Prevent code injection**
- **Use HTTPS only**

### 15. CURRENT PRODUCTION STATE
As of last update:
- ✅ Deployed to AWS Lightsail
- ✅ 17 exercises loaded and working
- ✅ Python execution functional
- ✅ CORS issues resolved
- ✅ Within Free Tier limits
- ✅ Accessible at production URL
- ⚠️ Needs restructuring to loosely coupled architecture

## 🔴 CRITICAL REMINDERS

1. **COST**: If ANYTHING might cost money, DON'T DO IT
2. **TESTING**: If you haven't tested with #playwright, it's NOT done
3. **QUALITY**: If there are ANY errors or warnings, FIX THEM
4. **STRUCTURE**: Follow the package structure EXACTLY
5. **DEPLOYMENT**: Always verify production works after changes

## 📝 When Writing Code:
- CHECK: Will this stay in Free Tier?
- CHECK: Have I tested with #playwright?
- CHECK: Are there any lint/build errors?
- CHECK: Does this maintain loose coupling?
- CHECK: Is this in the correct package?
- CHECK: Am I following ALL requirements above?
- CHECK: Will production still work after this change?

## 🚫 NEVER:
- Create resources outside Free Tier
- Deploy without testing
- Leave errors unfixed
- Mix package concerns
- Duplicate code or types
- Commit broken code
- Declare complete without full testing

## ✅ ALWAYS:
- Test with #playwright browser
- Stay in Free Tier
- Fix all errors immediately
- Follow package boundaries
- Maintain clean code
- Verify production works
- Check AWS costs