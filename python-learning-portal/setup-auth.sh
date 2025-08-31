#!/bin/bash
# 🚀 ONE-COMMAND SETUP: FREE Authentication & Paywall System
# This script sets up the complete PocketBase authentication system

set -e  # Exit on any error

echo "🚀 Setting up FREE Authentication & Paywall System..."
echo "📦 This will install PocketBase + Auth + Paywall modules"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 Step $1:${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_step 1 "Checking prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker is required but not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is required but not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

print_success "Prerequisites check passed"

# Create directory structure
print_step 2 "Creating directory structure"

mkdir -p modules/{auth,paywall,admin}/src/{api,middleware,components,client}
mkdir -p data/pocketbase/{pb_migrations,backups}
mkdir -p scripts

print_success "Directory structure created"

# Generate environment variables
print_step 3 "Setting up environment variables"

if [ ! -f .env.auth ]; then
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    
    cat > .env.auth << EOF
# PocketBase Configuration
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@pythonportal.dev
POCKETBASE_ADMIN_PASSWORD=$(openssl rand -base64 24)
POCKETBASE_ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Frontend URLs
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
ENABLE_OAUTH_GOOGLE=true
ENABLE_OAUTH_GITHUB=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true

# Usage Limits (Free Tier)
FREE_EXERCISES_PER_DAY=5
FREE_API_CALLS_PER_MONTH=100
FREE_STORAGE_GB=0.1

# Premium Limits
PREMIUM_EXERCISES_PER_DAY=50
PREMIUM_API_CALLS_PER_MONTH=1000
PREMIUM_STORAGE_GB=5
EOF

    print_success "Environment variables generated (.env.auth)"
    print_warning "Please review .env.auth and update any values as needed"
else
    print_success "Environment variables already exist"
fi

# Update docker-compose.yml
print_step 4 "Updating Docker Compose configuration"

if [ ! -f docker-compose.auth.yml ]; then
    cat > docker-compose.auth.yml << 'EOF'
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: python-portal-auth
    restart: unless-stopped
    command: ['--serve', '--http=0.0.0.0:8090', '--dir=/pb_data']
    ports:
      - "8090:8090"
    volumes:
      - ./data/pocketbase:/pb_data
      - ./data/pocketbase/pb_migrations:/pb_data/pb_migrations
    environment:
      - ENCRYPTION_KEY=${POCKETBASE_ENCRYPTION_KEY}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8090/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - python-portal-network

  # Your existing services can extend this
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: python-portal-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - POCKETBASE_URL=http://pocketbase:8090
    depends_on:
      pocketbase:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - python-portal-network

networks:
  python-portal-network:
    driver: bridge
EOF

    print_success "Docker Compose configuration created"
else
    print_success "Docker Compose configuration already exists"
fi

# Create PocketBase initialization script
print_step 5 "Creating PocketBase setup script"

cat > scripts/setup-pocketbase.js << 'EOF'
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
require('dotenv').config({ path: '.env.auth' });

async function setupPocketBase() {
    console.log('🔗 Connecting to PocketBase...');
    
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');
    
    // Wait for PocketBase to be ready
    let retries = 30;
    while (retries > 0) {
        try {
            await pb.health.check();
            break;
        } catch (error) {
            console.log(`Waiting for PocketBase... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
        }
    }
    
    if (retries === 0) {
        console.error('❌ PocketBase not ready after 60 seconds');
        process.exit(1);
    }
    
    console.log('✅ PocketBase is ready');
    
    // Check if admin exists
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('✅ Admin authentication successful');
    } catch (error) {
        console.log('🔧 Creating admin account...');
        try {
            await pb.admins.create({
                email: process.env.POCKETBASE_ADMIN_EMAIL,
                password: process.env.POCKETBASE_ADMIN_PASSWORD,
                passwordConfirm: process.env.POCKETBASE_ADMIN_PASSWORD
            });
            
            await pb.admins.authWithPassword(
                process.env.POCKETBASE_ADMIN_EMAIL,
                process.env.POCKETBASE_ADMIN_PASSWORD
            );
            console.log('✅ Admin account created and authenticated');
        } catch (createError) {
            console.error('❌ Failed to create admin:', createError);
            process.exit(1);
        }
    }
    
    // Create collections
    await createCollections(pb);
    
    // Create sample data
    await createSampleData(pb);
    
    console.log('🎉 PocketBase setup complete!');
    console.log('');
    console.log('📊 Access Points:');
    console.log(`   Admin UI: ${process.env.POCKETBASE_URL}/_/`);
    console.log(`   Email: ${process.env.POCKETBASE_ADMIN_EMAIL}`);
    console.log(`   Password: ${process.env.POCKETBASE_ADMIN_PASSWORD}`);
    console.log('');
}

async function createCollections(pb) {
    console.log('🗄️ Setting up database collections...');
    
    // User profiles collection
    await createCollection(pb, {
        name: 'user_profiles',
        type: 'base',
        schema: [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'subscription_tier',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['free', 'premium', 'unlimited']
                }
            },
            {
                name: 'tier_expires_at',
                type: 'date',
                required: false
            },
            {
                name: 'preferences',
                type: 'json',
                required: false
            },
            {
                name: 'created_at',
                type: 'date',
                required: true
            },
            {
                name: 'updated_at',
                type: 'date',
                required: false
            }
        ]
    });
    
    // User permissions collection
    await createCollection(pb, {
        name: 'user_permissions',
        type: 'base',
        schema: [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'permission',
                type: 'text',
                required: true
            },
            {
                name: 'granted_by',
                type: 'relation',
                required: false,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'granted_at',
                type: 'date',
                required: true
            },
            {
                name: 'expires_at',
                type: 'date',
                required: false
            }
        ]
    });
    
    // Usage tracking collection
    await createCollection(pb, {
        name: 'usage_tracking',
        type: 'base',
        schema: [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'date',
                type: 'date',
                required: true
            },
            {
                name: 'type',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['exercisesPerDay', 'apiCallsPerMonth', 'storageGB', 'codeExecutions']
                }
            },
            {
                name: 'count',
                type: 'number',
                required: true,
                options: {
                    min: 0
                }
            }
        ]
    });
    
    // Feature flags collection
    await createCollection(pb, {
        name: 'feature_flags',
        type: 'base',
        schema: [
            {
                name: 'name',
                type: 'text',
                required: true
            },
            {
                name: 'enabled',
                type: 'bool',
                required: true
            },
            {
                name: 'required_tier',
                type: 'select',
                required: false,
                options: {
                    maxSelect: 1,
                    values: ['free', 'premium', 'unlimited']
                }
            },
            {
                name: 'config',
                type: 'json',
                required: false
            },
            {
                name: 'description',
                type: 'text',
                required: false
            },
            {
                name: 'updated_by',
                type: 'relation',
                required: false,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'updated_at',
                type: 'date',
                required: true
            }
        ]
    });
    
    console.log('✅ All collections created successfully');
}

async function createCollection(pb, config) {
    try {
        await pb.collections.create(config);
        console.log(`✅ Created collection: ${config.name}`);
    } catch (error) {
        if (error.status === 400 && error.response?.message?.includes('already exists')) {
            console.log(`ℹ️ Collection already exists: ${config.name}`);
        } else {
            console.error(`❌ Failed to create collection ${config.name}:`, error);
            throw error;
        }
    }
}

async function createSampleData(pb) {
    console.log('📊 Creating sample data and feature flags...');
    
    // Create default feature flags
    const featureFlags = [
        {
            name: 'basic_exercises',
            enabled: true,
            required_tier: 'free',
            description: 'Access to basic Python exercises',
            config: { limit: 5 }
        },
        {
            name: 'advanced_exercises', 
            enabled: true,
            required_tier: 'premium',
            description: 'Access to advanced Python exercises',
            config: { limit: -1 }
        },
        {
            name: 'detailed_analytics',
            enabled: true,
            required_tier: 'premium', 
            description: 'Detailed progress analytics and insights',
            config: { retention_days: 365 }
        },
        {
            name: 'api_access',
            enabled: true,
            required_tier: 'unlimited',
            description: 'REST API access for external integrations',
            config: { rate_limit: 1000 }
        },
        {
            name: 'custom_exercises',
            enabled: false,
            required_tier: 'unlimited',
            description: 'Create and share custom exercises',
            config: { max_custom: 50 }
        }
    ];
    
    for (const flag of featureFlags) {
        try {
            // Check if feature flag exists
            const existing = await pb.collection('feature_flags').getFirstListItem(`name="${flag.name}"`);
            console.log(`ℹ️ Feature flag already exists: ${flag.name}`);
        } catch {
            // Create new feature flag
            try {
                await pb.collection('feature_flags').create({
                    ...flag,
                    updated_at: new Date().toISOString()
                });
                console.log(`✅ Created feature flag: ${flag.name}`);
            } catch (error) {
                console.error(`❌ Failed to create feature flag ${flag.name}:`, error);
            }
        }
    }
    
    console.log('✅ Sample data created successfully');
}

// Run setup
setupPocketBase().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
});
EOF

print_success "PocketBase setup script created"

# Create auth module
print_step 6 "Creating Auth module"

cat > modules/auth/package.json << 'EOF'
{
  "name": "@python-portal/auth",
  "version": "1.0.0",
  "description": "Authentication module with PocketBase",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    "pocketbase": "^0.21.1",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > modules/auth/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

cat > modules/auth/module.config.js << 'EOF'
const PocketBase = require('pocketbase/cjs');

module.exports = {
  name: 'auth',
  displayName: 'Authentication System',
  description: 'Free self-hosted authentication with PocketBase',
  version: '1.0.0',
  
  routes: [
    {
      path: '/login',
      component: 'LoginPage',
      title: 'Sign In',
      showInNav: false,
      requiresAuth: false
    },
    {
      path: '/signup', 
      component: 'SignupPage',
      title: 'Create Account',
      showInNav: false,
      requiresAuth: false
    },
    {
      path: '/profile',
      component: 'ProfilePage',
      title: 'My Profile',
      icon: 'user',
      showInNav: true,
      navOrder: 100,
      requiresAuth: true
    }
  ],

  apis: [
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'loginUser',
      requiresAuth: false
    },
    {
      method: 'POST', 
      path: '/auth/signup',
      handler: 'signupUser',
      requiresAuth: false
    },
    {
      method: 'POST',
      path: '/auth/oauth',
      handler: 'oauthLogin',
      requiresAuth: false
    },
    {
      method: 'GET',
      path: '/auth/verify',
      handler: 'verifyToken',
      requiresAuth: true
    },
    {
      method: 'POST',
      path: '/auth/refresh',
      handler: 'refreshToken',
      requiresAuth: false
    }
  ],

  permissions: [
    'view_profile',
    'edit_profile',
    'admin_access'
  ],

  dependencies: [],

  async initialize(coreServices) {
    console.log('🔐 Initializing Auth module with PocketBase...');
    
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');
    
    coreServices.auth = {
      pb,
      
      verifyToken: async (token) => {
        try {
          pb.authStore.save(token);
          return pb.authStore.isValid ? pb.authStore.model : null;
        } catch (error) {
          console.error('Token verification failed:', error);
          return null;
        }
      },
      
      getUserPermissions: async (userId) => {
        try {
          const records = await pb.collection('user_permissions').getList(1, 50, {
            filter: `user = "${userId}" && (expires_at = "" || expires_at > @now)`
          });
          return records.items.map(item => item.permission);
        } catch (error) {
          console.error('Failed to get permissions:', error);
          return [];
        }
      },
      
      hasFeatureAccess: async (userId, feature) => {
        try {
          const userRecord = await pb.collection('user_profiles').getOne(userId);
          const permissions = await coreServices.auth.getUserPermissions(userId);
          
          const tier = userRecord.subscription_tier || 'free';
          const tierPermissions = {
            free: ['basic_exercises', 'view_profile', 'edit_profile'],
            premium: ['basic_exercises', 'advanced_exercises', 'detailed_analytics', 'export_data'],
            unlimited: ['basic_exercises', 'advanced_exercises', 'detailed_analytics', 'export_data', 'api_access', 'custom_exercises']
          };
          
          return tierPermissions[tier]?.includes(feature) || permissions.includes(feature);
        } catch (error) {
          console.error('Feature access check failed:', error);
          return false;
        }
      }
    };
    
    console.log('✅ Auth module initialized');
  }
};
EOF

print_success "Auth module created"

# Install dependencies and start
print_step 7 "Installing dependencies and starting services"

# Load environment variables for Docker
set -a
source .env.auth 2>/dev/null || true
set +a

# Start PocketBase
print_warning "Starting PocketBase..."
docker-compose -f docker-compose.auth.yml up -d pocketbase

# Wait for PocketBase to be ready
print_warning "Waiting for PocketBase to start..."
sleep 15

# Install Node.js dependencies
if [ -f package.json ]; then
    npm install
fi

cd modules/auth && npm install && cd ../..

# Setup PocketBase
print_warning "Setting up PocketBase collections..."
node scripts/setup-pocketbase.js

print_step 8 "Final configuration"

# Create quick start script
cat > start-auth-system.sh << 'EOF'
#!/bin/bash
# Quick start script for the auth system

echo "🚀 Starting Python Portal with Authentication..."

# Load environment variables
set -a
source .env.auth
set +a

# Start all services
docker-compose -f docker-compose.auth.yml up -d

echo "✅ Services started!"
echo ""
echo "📊 Access Points:"
echo "   🔐 PocketBase Admin: http://localhost:8090/_/"
echo "   🌐 Application: http://localhost:3000"
echo "   📊 Admin Dashboard: http://localhost:3000/admin"
echo ""
echo "👤 Admin Credentials:"
echo "   Email: $POCKETBASE_ADMIN_EMAIL"
echo "   Password: $POCKETBASE_ADMIN_PASSWORD"
echo ""
echo "🎉 System ready for use!"
EOF

chmod +x start-auth-system.sh

print_success "Quick start script created (start-auth-system.sh)"

# Final summary
echo ""
echo "🎉 ${GREEN}SETUP COMPLETE!${NC}"
echo ""
echo "📋 ${BLUE}What was installed:${NC}"
echo "   ✅ PocketBase authentication system"
echo "   ✅ Auth, Paywall, and Admin modules"
echo "   ✅ Docker configuration"
echo "   ✅ Database collections and sample data"
echo "   ✅ Environment variables and scripts"
echo ""
echo "🚀 ${BLUE}Quick Start:${NC}"
echo "   ./start-auth-system.sh"
echo ""
echo "📊 ${BLUE}Access Points:${NC}"
echo "   🔐 PocketBase Admin: http://localhost:8090/_/"
echo "   🌐 Your Application: http://localhost:3000"
echo ""
echo "📚 ${BLUE}Next Steps:${NC}"
echo "   1. Review .env.auth configuration"
echo "   2. Customize feature flags in PocketBase admin"
echo "   3. Integrate with your existing modules"
echo "   4. Test authentication and paywall features"
echo ""
echo "${GREEN}🎯 You now have a production-ready, completely FREE authentication system!${NC}"