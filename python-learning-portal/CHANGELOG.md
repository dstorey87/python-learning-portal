# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions
- Automated deployment to AWS Lightsail
- Pull request validation workflows
- Release management automation
- Docker containerization for all services
- Infrastructure as Code with Terraform
- Comprehensive testing and security scanning

### Changed
- Migrated from monolithic to microservice architecture
- Separated concerns into independent packages
- Updated deployment process to use Docker containers

### Deprecated
- Legacy Docker Compose configuration in root directory

### Removed
- Monolithic backend structure
- Direct file-based exercise loading

### Fixed
- CORS configuration for microservice communication
- TypeScript build errors across packages
- Python execution security in isolated environment

### Security
- Added dependency vulnerability scanning
- Implemented secret scanning in CI/CD
- Enhanced container security with non-root users
- Added security headers in Nginx configuration

## [1.0.0] - 2024-08-30

### Added
- Initial release of Python Learning Portal
- 17 interactive Python exercises
- Live code execution environment
- Progress tracking and persistence
- Responsive web interface
- RESTful API for exercise management

### Features
- **Dashboard**: Progress overview and learning statistics
- **Learn Section**: 5 chapters covering Python fundamentals
- **Practice Section**: 17 hands-on coding exercises
- **Dictionary**: 28 Python concepts with examples
- **Code Editor**: Syntax highlighting and auto-completion
- **Test Runner**: Automated testing with visual feedback

### Technical
- React frontend with TypeScript
- Express.js backend with Node.js
- Python execution environment
- Containerized deployment
- AWS Lightsail hosting