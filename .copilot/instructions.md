# PROJECT-SPECIFIC COPILOT INSTRUCTIONS

## 🚨 CRITICAL SERVICE EXECUTION RULES
**MANDATORY RULE**: NEVER run long-running services (servers, dev servers, etc.) directly in terminal commands that block testing.

**CORRECT PATTERNS**:
- **Docker**: `docker run -d -p 3001:3001 executor-service` (detached)
- **PM2**: `pm2 start dist/index.js --name executor-service`
- **Background**: `nohup node dist/index.js > service.log 2>&1 &`
- **PowerShell**: `Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WindowStyle Hidden`

**TESTING PATTERN**:
1. Start service in background/detached mode
2. Wait 2-3 seconds for startup
3. Test with separate curl/Invoke-RestMethod command
4. Kill/stop service when done

**NEVER DO**: `node server.js` then try to test in same terminal - THIS ALWAYS FAILS

## 🎯 PROJECT CONTEXT
This is a Python learning platform transitioning from monolithic to microservice architecture with separate repositories. Currently has 17 working exercises in production, moving to industry-standard loosely coupled architecture with Infrastructure as Code (IaC).

## 🏗️ CURRENT ARCHITECTURE STATE
- **Status**: Modular authentication system deployed (PRODUCTION READY)
- **Main App**: AWS Lightsail Container Service v10  
- **Main URL**: https://python-portal-real.nf0keysv54fy8.eu-west-1.cs.amazonlightsail.com/
- **Auth Service**: https://python-portal-auth.nf0keysv54fy8.eu-west-1.cs.amazonlightsail.com/
- **Database**: https://python-portal-db.nf0keysv54fy8.eu-west-1.cs.amazonlightsail.com/
- **Structure**: Loosely coupled authentication with PocketBase + Express.js
- **Next Phase**: Frontend integration and paywall implementation

## 🎯 TARGET SEPARATE REPOSITORY ARCHITECTURE

**PRODUCTION-GRADE MICROSERVICE ARCHITECTURE**:

### 1. **python-portal-types** (npm: @python-portal/types)
```typescript
// Shared TypeScript definitions & contracts
export interface Exercise {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  // ... full type definitions
}
```
- **Purpose**: Single source of truth for all TypeScript interfaces
- **Dependencies**: None (pure type definitions)
- **Distribution**: Published npm package with semantic versioning
- **Testing**: TypeScript compilation validation, schema validation

### 2. **python-portal-exercises** (npm: @python-portal/exercises)
```
content/
├── E0_greet/
│   ├── instructions.md
│   ├── starter.py  
│   └── test.py
└── metadata.json
```
- **Purpose**: Exercise content management and validation
- **Dependencies**: @python-portal/types
- **Distribution**: Published npm package with content loaders
- **Testing**: Content validation, metadata schema compliance

### 3. **python-portal-executor** (Containerized Microservice)
```typescript
// Python code execution with security isolation
POST /execute
{
  "code": "print('Hello World')",
  "testCode": "assert output == 'Hello World'",
  "exerciseId": "E0_greet"
}
```
- **Purpose**: Secure Python code execution with sandboxing
- **Dependencies**: @python-portal/types
- **Deployment**: Independent Docker container with resource limits
- **Testing**: Security boundary testing, performance benchmarks

### 4. **python-portal-backend** (Express.js API)
```typescript
// RESTful API with OpenAPI 3.0 specification
GET /api/exercises          // List all exercises
GET /api/exercises/:id      // Get specific exercise
POST /api/progress         // Save user progress
```
- **Purpose**: Core API server with business logic
- **Dependencies**: @python-portal/types + @python-portal/exercises
- **Deployment**: Independent Docker container with health checks
- **Testing**: API contract testing, integration testing with test database

### 5. **python-portal-frontend** (React PWA)
```typescript
// Progressive Web App with offline capabilities
- Dashboard: Progress tracking & analytics
- Practice: Code editor with Monaco + Python execution
- Dictionary: Searchable Python concepts
- Learn: Interactive tutorials with embedded terminal
```
- **Purpose**: User interface with modern React patterns
- **Dependencies**: @python-portal/types (for API contracts)
- **Deployment**: Static build served via nginx in container
- **Testing**: Component testing + Playwright E2E automation

### 6. **python-portal-infrastructure** (Terraform IaC)
```hcl
# production/main.tf
module "lightsail_containers" {
  source = "../modules/lightsail-container"
  
  services = {
    executor = { port = 3001, scale = 2 }
    backend  = { port = 3000, scale = 2 }
    frontend = { port = 80,   scale = 1 }
  }
  
  environment = "production"
  cost_tags = {
    Project = "python-portal"
    Owner   = "dstorey87"
  }
}
```
- **Purpose**: Infrastructure as Code with cost optimization
- **Components**: Lightsail containers, load balancing, monitoring, security
- **Testing**: Terratest integration testing, cost validation, security scanning
- **Compliance**: AWS Well-Architected Framework, Free Tier optimization

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

## 🏗️ TERRAFORM INFRASTRUCTURE STANDARDS

**PRODUCTION-GRADE TERRAFORM STRUCTURE**:
```
python-portal-infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf              # Development environment
│   │   ├── variables.tf         # Dev-specific variables
│   │   ├── outputs.tf          # Dev environment outputs
│   │   └── terraform.tfvars    # Dev configuration values
│   ├── staging/                # Staging environment (same structure)
│   └── production/             # Production environment (same structure)
├── modules/
│   ├── lightsail-container/    # Reusable container service module
│   │   ├── main.tf             # Container service resources
│   │   ├── variables.tf        # Module input variables
│   │   ├── outputs.tf          # Module outputs
│   │   └── README.md           # Module documentation
│   ├── networking/             # Security groups, load balancer config
│   ├── monitoring/             # CloudWatch, alarms, dashboards
│   └── security/               # IAM roles, Parameter Store, secrets
├── scripts/
│   ├── deploy.sh               # Automated deployment script
│   ├── destroy.sh              # Resource cleanup script
│   ├── validate.sh             # Pre-deployment validation
│   └── cost-check.sh           # Cost estimation and validation
├── tests/
│   ├── integration/            # Terratest integration tests
│   ├── unit/                   # Module unit tests
│   └── security/               # Security compliance tests
└── docs/
    ├── architecture.md         # System architecture documentation
    ├── deployment.md           # Deployment procedures and runbooks
    ├── disaster-recovery.md    # DR procedures and backup strategies
    └── cost-optimization.md    # Cost management and optimization
```

**TERRAFORM CODE QUALITY STANDARDS**:
- **Formatting**: `terraform fmt -recursive` (automated formatting)
- **Validation**: `terraform validate` (syntax and configuration validation)
- **Security**: `tfsec` scanning with zero HIGH/CRITICAL issues
- **Linting**: `tflint` with AWS best practices ruleset
- **Documentation**: `terraform-docs` auto-generated documentation
- **Testing**: Terratest for integration testing all modules
- **State Management**: Terraform Cloud backend (FREE tier) with state locking
- **Version Control**: Semantic versioning for infrastructure changes

**AWS COST OPTIMIZATION REQUIREMENTS**:
```hcl
# Cost monitoring and alerting
resource "aws_budgets_budget" "python_portal" {
  name         = "python-portal-budget"
  budget_type  = "COST"
  limit_amount = "85"  # $85 maximum (within $90/year limit)
  limit_unit   = "USD"
  time_unit    = "ANNUALLY"
  
  cost_filters = {
    TagKey = ["Project"]
    TagValues = ["python-portal"]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 50  # Alert at 50% of budget
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = ["darren@example.com"]
  }
}

# Resource tagging for cost tracking
locals {
  common_tags = {
    Project     = "python-portal"
    Environment = var.environment
    Owner       = "dstorey87"
    CostCenter  = "free-tier"
    Terraform   = "true"
  }
}
```

## 🧪 COMPREHENSIVE TESTING STRATEGY

**MULTI-TIER TESTING APPROACH**:

### **1. Unit Testing (Per Repository)**
```yaml
Frontend (React + TypeScript):
  Framework: Jest + React Testing Library
  Coverage: 90%+ line coverage required
  Focus: Component logic, hooks, utilities
  Mocking: MSW for API mocking
  
Backend (Express + TypeScript):  
  Framework: Jest + Supertest
  Coverage: 95%+ line coverage required
  Focus: API endpoints, business logic, data layer
  Database: In-memory SQLite for isolated tests

Executor (Node.js + Python):
  Framework: Jest for TypeScript + Pytest for Python validation
  Coverage: 95%+ coverage required
  Focus: Code execution, security boundaries, resource limits
  Isolation: Docker container testing

Infrastructure (Terraform):
  Framework: Terratest (Go-based testing)
  Coverage: All modules must have integration tests
  Focus: Resource creation, configuration validation, cost compliance
  Environment: Isolated test AWS account
```

### **2. Integration Testing**
```typescript
// API Contract Testing
describe('Exercise API Contract', () => {
  it('should match OpenAPI 3.0 specification', async () => {
    const response = await api.get('/exercises/E0_greet');
    expect(response).toMatchSchema(exerciseSchema);
  });
});

// Service-to-Service Integration
describe('Backend → Executor Integration', () => {
  it('should execute Python code and return results', async () => {
    const result = await executorClient.execute({
      code: 'print("Hello World")',
      exerciseId: 'E0_greet'
    });
    expect(result.success).toBe(true);
    expect(result.executionTime).toBeLessThan(5000);
  });
});
```

### **3. End-to-End Testing (Playwright)**
```typescript
// Comprehensive user journey testing
test('Complete Exercise Workflow', async ({ page }) => {
  // Navigate to exercise
  await page.goto('/exercise/E0_greet');
  
  // Verify exercise loads
  await expect(page.getByText('Greet')).toBeVisible();
  
  // Test code execution
  await page.fill('[data-testid=code-editor]', 'print("Hello World")');
  await page.click('[data-testid=run-code]');
  
  // Verify execution results
  await expect(page.getByText('✅ Code executed successfully')).toBeVisible();
  await expect(page.getByText('Hello World')).toBeVisible();
  
  // Test progress tracking
  await expect(page.getByText('1/17')).toBeVisible();
  await expect(page.getByText('6% Complete')).toBeVisible();
});

// Cross-browser compatibility testing
const browsers = ['chromium', 'firefox', 'webkit'];
browsers.forEach(browser => {
  test(`Exercise functionality works in ${browser}`, async ({ page }) => {
    // Full functionality test per browser
  });
});
```

### **4. Performance Testing**
```typescript
// Core Web Vitals compliance
test('Performance Benchmarks', async ({ page }) => {
  await page.goto('/');
  
  const metrics = await page.evaluate(() => ({
    LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
    FID: performance.getEntriesByType('first-input')[0]?.processingStart,
    CLS: performance.getEntriesByType('layout-shift').reduce((sum, entry) => 
      sum + entry.value, 0)
  }));
  
  expect(metrics.LCP).toBeLessThan(2500); // < 2.5s
  expect(metrics.FID).toBeLessThan(100);  // < 100ms  
  expect(metrics.CLS).toBeLessThan(0.1);  // < 0.1
});

// Python execution performance
test('Python Execution Performance', async ({ request }) => {
  const start = Date.now();
  const response = await request.post('/execute', {
    data: { code: 'print("Performance test")', exerciseId: 'test' }
  });
  const duration = Date.now() - start;
  
  expect(response.status()).toBe(200);
  expect(duration).toBeLessThan(5000); // < 5 seconds
});
```

### **5. Security Testing**
```typescript
// OWASP compliance testing
test('Security Boundaries', async ({ request }) => {
  // Test code injection prevention
  const maliciousCode = '__import__("os").system("rm -rf /")';
  const response = await request.post('/execute', {
    data: { code: maliciousCode, exerciseId: 'security-test' }
  });
  
  expect(response.status()).toBe(400); // Should reject malicious code
  
  // Test input validation
  const invalidInput = 'x'.repeat(100000); // Large payload
  const largeResponse = await request.post('/execute', {
    data: { code: invalidInput, exerciseId: 'size-test' }
  });
  
  expect(largeResponse.status()).toBe(413); // Payload too large
});
```

### **6. Accessibility Testing**
```typescript
// WCAG 2.1 AA compliance
test('Accessibility Compliance', async ({ page }) => {
  await page.goto('/');
  
  // Run axe-core accessibility scan
  const accessibilityScanResults = await injectAxe(page);
  const violations = await checkA11y(page);
  
  expect(violations).toHaveLength(0);
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeFocused();
  
  // Test screen reader compatibility
  await expect(page.getByRole('main')).toHaveAttribute('aria-label');
});
```

## � AWS COST CONSTRAINTS & OPTIMIZATION

**ZERO-TOLERANCE COST POLICY**:
- **CURRENT SPEND**: $0 (within $100 AWS credit allowance)
- **ANNUAL HARD LIMIT**: Under $90/year (10% buffer from $100 credit)
- **FREE TIER COMPLIANCE**: Mandatory for all services except Lightsail
- **BILLING ALERTS**: $5, $25, $50, $75, $85 (progressive alerting)

**ALLOWED SERVICES** (Free Tier):
```yaml
Compute:
  - Lightsail Container Service: $10/month after 3-month free trial (ONLY paid service allowed)
  
Storage:  
  - S3: 5GB standard storage (for static assets if needed)
  - Parameter Store: 10,000 standard parameters (for secrets/config)
  
Monitoring:
  - CloudWatch: 10 custom metrics, 5GB log ingestion
  - CloudWatch Alarms: 10 alarms per month
  
Security:
  - IAM: Unlimited users, groups, policies
  - Certificate Manager: Unlimited SSL certificates
```

**PROHIBITED SERVICES** (Cost Risk):
- ❌ RDS (Database service - use SQLite instead)
- ❌ EC2 instances (Use Lightsail containers only)
- ❌ NAT Gateways ($0.045/hour = $32.40/month)
- ❌ Elastic IPs (when not attached = $3.60/month)
- ❌ Lambda (if exceeds free tier requests)
- ❌ API Gateway (if exceeds free tier requests)

**COST MONITORING & AUTOMATION**:
```hcl
# Terraform cost control
resource "aws_budgets_budget" "cost_control" {
  name         = "python-portal-strict-budget"
  budget_type  = "COST" 
  limit_amount = "85"    # $85 maximum
  limit_unit   = "USD"
  time_unit    = "ANNUALLY"
  
  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = 25  # Alert at $21.25 (25% of $85)
    threshold_type     = "PERCENTAGE" 
    notification_type  = "FORECASTED"
    # Automatic resource shutdown if approaching limit
  }
}
```

## � PRODUCTION-GRADE CODE STANDARDS

**TYPESCRIPT/NODE.JS EXCELLENCE**:
```typescript
// Strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}

// ESLint configuration (Airbnb + TypeScript)
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'airbnb-typescript/base',
    'plugin:import/typescript'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'error',  // No console.log in production
    'no-debugger': 'error', // No debugger statements
    'prefer-const': 'error' // Immutability preference
  }
}
```

**REACT FRONTEND STANDARDS**:
```typescript
// Modern React patterns with TypeScript
interface ExerciseProps {
  exercise: Exercise;
  onComplete: (result: ExerciseResult) => void;
}

const ExerciseComponent: React.FC<ExerciseProps> = ({ exercise, onComplete }) => {
  // Hooks with proper TypeScript typing
  const [code, setCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  
  // Error boundaries for graceful failure handling
  return (
    <ErrorBoundary fallback={<ExerciseErrorFallback />}>
      <Suspense fallback={<ExerciseLoadingSkeleton />}>
        {/* Component implementation */}
      </Suspense>
    </ErrorBoundary>
  );
};

// Performance optimization
export default React.memo(ExerciseComponent);
```

**EXPRESS.JS BACKEND STANDARDS**:
```typescript
// Type-safe API routes with validation
import { z } from 'zod';

const ExecuteCodeSchema = z.object({
  code: z.string().min(1).max(10000), // Size limits
  testCode: z.string().optional(),
  exerciseId: z.string().uuid()
});

app.post('/api/execute', 
  validateSchema(ExecuteCodeSchema), // Input validation
  rateLimiter({ max: 100, windowMs: 15 * 60 * 1000 }), // Rate limiting
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await executorService.execute(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error); // Centralized error handling
    }
  }
);
```

**DOCKER PRODUCTION STANDARDS**:
```dockerfile
# Multi-stage build for minimal production image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM gcr.io/distroless/nodejs20-debian11 AS production
# Distroless image for security (no shell, minimal attack surface)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER 1000:1000  # Non-root user
EXPOSE 3000
CMD ["dist/index.js"]

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

**CODE QUALITY AUTOMATION**:
```yaml
# GitHub Actions quality pipeline
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Lint (Zero Tolerance)
        run: npm run lint -- --max-warnings 0
      
      - name: TypeScript Check
        run: npm run type-check
      
      - name: Unit Tests (90%+ Coverage)
        run: npm run test -- --coverage --coverageThreshold.global.lines=90
      
      - name: Security Audit
        run: npm audit --audit-level=high
      
      - name: Build Validation
        run: npm run build
```

## � REPOSITORY SEPARATION MIGRATION PLAN

**CURRENT STATUS**: ✅ Loosely Coupled Monorepo Complete (Phase 1)

**PHASE A: REPOSITORY INFRASTRUCTURE** 
```yaml
Status: ❌ PENDING
Tasks:
  - [ ] Create 6 separate GitHub repositories with branch protection
  - [ ] Set up repository templates with consistent structure  
  - [ ] Configure GitHub Security (Dependabot, CodeQL, Secret Scanning)
  - [ ] Set up npm organization: @python-portal/*
  - [ ] Configure Terraform Cloud workspace (FREE tier)
  - [ ] Create deployment keys and access tokens
```

**PHASE B: SERVICE EXTRACTION & PUBLISHING**
```yaml  
Status: ❌ PENDING
Tasks:
  - [ ] Extract & publish @python-portal/types (npm package)
  - [ ] Extract & publish @python-portal/exercises (npm package)
  - [ ] Extract python-portal-executor (containerized service)
  - [ ] Extract python-portal-backend (containerized service) 
  - [ ] Extract python-portal-frontend (containerized service)
  - [ ] Create python-portal-infrastructure (Terraform IaC)
  - [ ] Update all inter-service dependencies to published packages
```

**PHASE C: INFRASTRUCTURE AS CODE**
```yaml
Status: ❌ PENDING  
Tasks:
  - [ ] Create Terraform modules for all AWS resources
  - [ ] Implement environment-specific configurations (dev/staging/prod)
  - [ ] Set up Terraform state management with locking
  - [ ] Create cost monitoring and alerting infrastructure
  - [ ] Implement security hardening (IAM, Parameter Store, SSL)
  - [ ] Create automated deployment pipelines
```

**PHASE D: COMPREHENSIVE TESTING & DEPLOYMENT**
```yaml
Status: ❌ PENDING
Tasks:
  - [ ] Deploy infrastructure using Terraform
  - [ ] Deploy all 5 microservices to separate containers
  - [ ] Execute comprehensive Playwright testing across all browsers
  - [ ] Perform security penetration testing
  - [ ] Validate performance benchmarks (Core Web Vitals)
  - [ ] Test disaster recovery procedures
  - [ ] Complete accessibility compliance testing (WCAG 2.1 AA)
```

**SUCCESS CRITERIA FOR COMPLETION**:
```yaml
Technical Requirements:
  ✅ All 17 exercises fully functional
  ✅ Python execution < 5 seconds per request
  ✅ Zero console errors in production
  ✅ Zero ESLint/TypeScript errors across all repositories
  ✅ 90%+ test coverage across all services
  ✅ Core Web Vitals compliance (LCP<2.5s, FID<100ms, CLS<0.1)

Business Requirements:
  ✅ AWS costs remain under $85/year (10% buffer from $100 credit)
  ✅ Each service can be developed independently
  ✅ Teams can work in parallel without conflicts
  ✅ Services can be deployed independently
  ✅ Infrastructure is managed as code (Terraform)
  ✅ Production deployment is automated and repeatable
```

## � CRITICAL VALIDATION GATES

**BEFORE ANY REPOSITORY CREATION**:
```bash
# Code quality validation
npm run lint          # MUST pass with 0 warnings/errors
npm run type-check    # MUST pass TypeScript validation  
npm run test          # MUST pass with 90%+ coverage
npm run build         # MUST build successfully across all packages

# Security validation  
npm audit --audit-level=high    # MUST show 0 high/critical vulnerabilities
docker scan <image>             # MUST pass container security scan

# Performance validation
npm run test:e2e      # Playwright tests MUST pass all scenarios
```

**BEFORE ANY INFRASTRUCTURE DEPLOYMENT**:
```bash
# Terraform validation
terraform validate    # MUST pass syntax validation
terraform plan        # MUST show expected resource changes
tfsec .               # MUST show 0 HIGH/CRITICAL security issues
terraform-docs .      # MUST generate complete documentation

# Cost validation
infracost breakdown   # MUST confirm Free Tier compliance (< $85/year)
aws budgets describe-budgets  # MUST show current spend < $5
```

**BEFORE PRODUCTION DEPLOYMENT**:
```typescript  
// Comprehensive E2E testing with Playwright
test('Production Readiness', async ({ page, request }) => {
  // 1. Application functionality
  await validateAllExercisesWork(page);      // All 17 exercises
  await validatePythonExecution(request);    // < 5 second execution
  await validateProgressTracking(page);      // Save/load user progress
  
  // 2. Performance requirements
  await validateCoreWebVitals(page);         // LCP<2.5s, FID<100ms, CLS<0.1
  await validateBundleSize();                // Frontend < 1MB gzipped
  await validateAPIResponseTimes(request);   // All endpoints < 500ms
  
  // 3. Security validation
  await validateHTTPSOnly(page);             // No HTTP requests
  await validateNoSecrets(page);             // No exposed API keys/tokens
  await validateInputSanitization(request);  // Injection prevention
  
  // 4. Accessibility compliance
  await validateWCAGCompliance(page);        // WCAG 2.1 AA standards
  await validateKeyboardNavigation(page);    // Full keyboard accessibility
  await validateScreenReaderSupport(page);   // Proper ARIA labels
});
```

**CONTINUOUS MONITORING REQUIREMENTS**:
```yaml
Cost Monitoring:
  - Real-time AWS billing alerts at $5, $25, $50, $75, $85
  - Daily cost reporting with service breakdown
  - Automated resource shutdown if approaching $85 limit

Performance Monitoring:
  - Application performance monitoring (APM) with New Relic/DataDog
  - Real-time error rate monitoring with automatic alerting
  - Core Web Vitals monitoring with performance regression alerts

Security Monitoring:  
  - Automated vulnerability scanning with Dependabot/Snyk
  - Container security scanning with Trivy/Aqua
  - Infrastructure drift detection with automated remediation
  - Security incident response procedures documented and tested
```

## 🧪 COMPREHENSIVE TESTING STRATEGY BY PHASE

**MANDATORY TESTING FRAMEWORK FOR EACH PHASE:**

**Phase A Testing Protocol:**
- Repository Structure: GitHub CLI validation + Custom scripts
- Security Setup: GitHub Security feature verification + Scan execution
- NPM Organization: Publishing permission testing + Access validation
- Terraform Cloud: State management testing + Cost alert verification
- Success Criteria: All infrastructure setup and validated

**Phase B Testing Protocol:**
- Types Package: TypeScript strict compilation + Type resolution testing
- Exercises Package: Content validation + Metadata schema compliance
- Executor Service: Python execution testing + Security boundary validation + Performance benchmarking
- Backend Service: API contract testing + Authentication validation + Load testing
- Frontend Service: Component testing + PWA validation + Performance auditing + Cross-browser testing
- Infrastructure IaC: Terraform validation + Security scanning + Cost estimation

**Phase C Testing Protocol:**
- Module Testing: Terratest integration testing + Reusability validation
- Cost Monitoring: Budget alert testing + Automatic shutdown validation
- Security Hardening: IAM policy testing + Secret management validation
- Deployment Pipelines: Blue-green testing + Rollback validation + Health check verification

**Phase D Testing Protocol:**
- Infrastructure Deployment: Resource provisioning + Service health validation
- Microservice Deployment: Container orchestration + Inter-service communication testing
- E2E Testing: Playwright cross-browser + User journey validation + Performance benchmarking
- Security Testing: Penetration testing + Vulnerability scanning + Attack prevention validation
- Performance Testing: Load testing + Core Web Vitals validation + API response time verification
- Accessibility Testing: WCAG 2.1 AA compliance + Screen reader validation + Keyboard navigation
- Disaster Recovery: Backup/restore testing + Failover validation + Data consistency verification

**CONTINUOUS MONITORING & VALIDATION:**
- Cost Monitoring: Real-time billing alerts + Automatic resource management
- Performance Monitoring: APM integration + Error rate tracking + Response time monitoring
- Security Monitoring: Vulnerability scanning + Threat detection + Infrastructure drift detection

## 🎯 IMMEDIATE NEXT ACTIONS WITH COMPREHENSIVE TESTING

**Ready to Execute**: Repository separation with Infrastructure as Code implementation

**PHASE A: REPOSITORY CREATION & INFRASTRUCTURE SETUP**
Tasks with mandatory testing validation:
1. **Create 6 separate GitHub repositories with production templates**
   - Testing: Repository access validation, branch protection verification, security scanning activation
2. **Set up GitHub Security & CI/CD workflows**
   - Testing: Workflow execution validation, security scan verification, deployment pipeline testing
3. **Configure NPM organization & Terraform Cloud workspace**
   - Testing: Package publishing validation, state management verification, cost monitoring activation

**PHASE B: SERVICE EXTRACTION & PACKAGE PUBLISHING** 
Tasks with comprehensive testing protocols:
1. **Extract & publish @python-portal/types + @python-portal/exercises**
   - Testing: TypeScript compilation, content validation, npm publishing verification, dependency resolution
2. **Extract containerized services (executor, backend, frontend)**
   - Testing: Docker build validation, security boundary testing, API contract verification, PWA functionality
3. **Create production-grade Terraform Infrastructure as Code**
   - Testing: Terraform validation, security scanning, cost estimation, module reusability testing

**PHASE C: INFRASTRUCTURE IMPLEMENTATION**
Tasks with production-grade validation:
1. **Deploy Terraform modules with cost monitoring**
   - Testing: Resource provisioning validation, cost alert verification, security hardening confirmation
2. **Implement automated deployment pipelines**
   - Testing: Blue-green deployment testing, rollback procedure validation, health check verification

**PHASE D: PRODUCTION DEPLOYMENT & VALIDATION**
Tasks with comprehensive testing coverage:
1. **Deploy all microservices to separate repositories**
   - Testing: Service deployment validation, inter-service communication testing, health monitoring
2. **Execute comprehensive Playwright testing across all browsers**
   - Testing: Cross-browser compatibility, user journey completion, performance benchmarking, accessibility compliance
3. **Perform security penetration testing & disaster recovery validation**
   - Testing: Vulnerability scanning, attack prevention verification, backup/restore procedures

**SUCCESS CRITERIA WITH VALIDATION:**
- ✅ All 17 exercises fully functional (validated via Playwright testing)
- ✅ Python execution < 5 seconds (validated via performance testing)
- ✅ Zero console errors (validated via browser automation)
- ✅ AWS costs < $85/year (validated via cost monitoring)
- ✅ Each service deployable independently (validated via CI/CD testing)
- ✅ Core Web Vitals compliance (validated via Lighthouse auditing)
- ✅ WCAG 2.1 AA accessibility compliance (validated via automated scanning)
- ✅ Security hardened (validated via penetration testing)

This will achieve your goal of true microservice architecture where each team can work independently while maintaining industry-standard code quality, comprehensive testing coverage at every phase, and zero-cost AWS deployment with full production validation.