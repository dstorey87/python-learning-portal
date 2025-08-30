# CI/CD Pipeline Documentation

This directory contains comprehensive CI/CD pipeline configurations for the Python Learning Portal microservice architecture.

## Overview

The CI/CD pipeline is designed to provide:

- **Automated Build & Test** - Comprehensive testing on every commit
- **Pull Request Validation** - Quality gates for code contributions
- **Automated Deployment** - Seamless deployment to AWS Lightsail
- **Release Management** - Automated versioning and release creation
- **Security Scanning** - Vulnerability detection and compliance

## Pipeline Structure

```
.github/workflows/
├── ci-cd.yml           # Main build and test pipeline
├── deploy.yml          # AWS Lightsail deployment
├── pr-validation.yml   # Pull request quality gates
└── release.yml         # Release management and versioning
```

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Changes to source code or infrastructure

**Jobs:**
1. **Code Quality & Security** - ESLint, TypeScript, audit checks
2. **Test Microservices** - Unit tests for each service
3. **Build Docker Images** - Production-ready containers
4. **Integration Tests** - Full system testing with Playwright
5. **Security Scanning** - Trivy vulnerability scanning
6. **Performance Tests** - Load testing (main branch only)

**Duration:** ~15-25 minutes

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers:**
- Push to `main` branch (automatic)
- Manual workflow dispatch with environment selection

**Jobs:**
1. **Pre-deployment Validation** - Change detection and credential checks
2. **Build Production Images** - Docker images with versioning
3. **Deploy Infrastructure** - Terraform infrastructure provisioning
4. **Deploy Application** - Container service deployment
5. **Post-deployment Validation** - Health checks and smoke tests

**Duration:** ~20-30 minutes

### 3. Pull Request Validation (`pr-validation.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened
- Ready for review (not draft)

**Jobs:**
1. **PR Information** - Pull request metadata and summary
2. **Code Quality** - ESLint, Prettier, TypeScript checks
3. **Changed Files Analysis** - Smart testing based on changes
4. **Targeted Testing** - Only test affected components
5. **Security Checks** - Secret scanning, dependency audits
6. **Docker Build Test** - Validate container builds
7. **Integration Tests** - Full system validation (if needed)

**Duration:** ~10-20 minutes (depending on changes)

### 4. Release Management (`release.yml`)

**Triggers:**
- Git tag push (`v*.*.*`)
- Manual workflow dispatch with version bump

**Jobs:**
1. **Create Release** - Version bumping and changelog generation
2. **Build Release Assets** - Distribution archives
3. **Build Docker Images** - Multi-platform container builds
4. **Create GitHub Release** - Release notes and asset publishing
5. **Deploy Release** - Automatic production deployment

**Duration:** ~25-35 minutes

## Configuration Files

### `.audit-ci.json`
```json
{
  "moderate": true,
  "high": true,
  "critical": true,
  "allowlist": [],
  "skip-dev": false
}
```

### Environment Variables

**Repository Secrets Required:**
- `AWS_ACCESS_KEY_ID` - AWS credentials for deployment
- `AWS_SECRET_ACCESS_KEY` - AWS credentials for deployment
- `GITHUB_TOKEN` - Automatic token for releases (provided by GitHub)

**Pipeline Environment Variables:**
- `NODE_VERSION: '20'` - Node.js version
- `PYTHON_VERSION: '3.11'` - Python version for executor service
- `AWS_REGION: 'eu-west-1'` - AWS deployment region
- `CONTAINER_SERVICE_NAME: 'python-portal-containers'` - Lightsail service name

## Quality Gates

### Code Quality Requirements

**ESLint Rules:**
- Zero errors allowed in production
- Warnings allowed but reported
- TypeScript strict mode enabled

**Test Coverage:**
- Minimum 80% code coverage per service
- Critical paths must have 95% coverage
- Integration tests required for API endpoints

**Security Requirements:**
- No high/critical vulnerabilities in dependencies
- Secret scanning passes
- License compatibility verified

### Deployment Requirements

**Health Checks:**
- All services must respond to `/health` endpoint
- Response time < 5 seconds
- HTTP 200 status code required

**Performance Criteria:**
- API response time < 500ms (95th percentile)
- Frontend load time < 3 seconds
- Zero critical errors in logs

## Branch Strategy

### Main Branch (`main`)
- **Protection Rules:** Require PR reviews, status checks
- **Automatic Deployment:** Production deployment on successful CI
- **Release Strategy:** Tagged releases trigger automated deployment

### Development Branch (`develop`)
- **Integration Branch:** Feature branch merging
- **Staging Deployment:** Automatic deployment to staging environment
- **Testing:** Full CI/CD pipeline execution

### Feature Branches
- **Naming:** `feature/description`, `fix/issue-number`
- **Requirements:** Pass all PR validation checks
- **Testing:** Targeted testing based on changed files

## Monitoring & Observability

### Build Monitoring
- **GitHub Actions Dashboard** - Workflow status and history
- **Step Summary Reports** - Detailed execution summaries
- **Artifact Storage** - Test results and build outputs

### Deployment Monitoring
- **AWS CloudWatch** - Infrastructure metrics and logs
- **Health Check Endpoints** - Service availability monitoring
- **Performance Metrics** - Response times and error rates

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check lint errors
npm run lint

# Fix TypeScript issues
npm run type-check

# Run tests locally
npm test
```

**Deployment Failures:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate Terraform
cd infrastructure/terraform
terraform validate

# Test Docker builds
cd infrastructure
./deploy.ps1 build
```

**Security Scan Failures:**
```bash
# Audit dependencies
npm audit --audit-level=moderate

# Fix vulnerabilities
npm audit fix

# Check for secrets
git log --all --full-history -- path/to/file
```

### Pipeline Debugging

**Enable Debug Logging:**
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

**Re-run Failed Jobs:**
- Use GitHub Actions UI to re-run specific jobs
- Check step logs for detailed error information
- Review artifact uploads for test results

## Performance Optimization

### Pipeline Speed
- **Parallel Jobs:** Matrix builds for services
- **Caching:** npm packages, Docker layers
- **Conditional Execution:** Skip unchanged components
- **Early Termination:** Fail fast on critical errors

### Resource Management
- **Timeout Limits:** Prevent runaway jobs
- **Resource Constraints:** CPU and memory limits
- **Artifact Retention:** 7-day storage policy
- **Cache Cleanup:** Automatic cache pruning

## Security Best Practices

### Secret Management
- **Repository Secrets:** Encrypted storage
- **Environment Variables:** Runtime injection
- **Principle of Least Privilege:** Minimal permissions
- **Rotation Policy:** Regular credential updates

### Code Security
- **Dependency Scanning:** Automated vulnerability detection
- **Secret Scanning:** Prevent credential leaks
- **Code Analysis:** Static security analysis
- **License Compliance:** Open source license validation

## Costs & Optimization

### AWS Free Tier Usage
- **Lightsail Container Service:** $0 for 3 months, $10/month after
- **ECR Public:** Free for public repositories
- **Data Transfer:** 1TB/month included
- **Build Minutes:** GitHub Actions included minutes

### Cost Monitoring
```bash
# Check AWS costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost

# Monitor GitHub Actions usage
# Settings > Billing > Actions minutes
```

## Maintenance

### Regular Tasks
- **Weekly:** Review failed builds and security alerts
- **Monthly:** Update dependencies and base images
- **Quarterly:** Review and optimize pipeline performance
- **Annually:** Audit security practices and compliance

### Updates
- **GitHub Actions:** Use Dependabot for workflow updates
- **Base Images:** Regular updates for security patches
- **Dependencies:** Automated updates with testing
- **Documentation:** Keep in sync with pipeline changes

## Support

### Resources
- **GitHub Actions Documentation:** https://docs.github.com/actions
- **AWS Lightsail Documentation:** https://docs.aws.amazon.com/lightsail/
- **Terraform Documentation:** https://registry.terraform.io/providers/hashicorp/aws/latest/docs

### Getting Help
- **Internal Issues:** Create GitHub issue with `ci-cd` label
- **Security Concerns:** Use security reporting guidelines
- **Feature Requests:** Discuss in team meetings or GitHub discussions