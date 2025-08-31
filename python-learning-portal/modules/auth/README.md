# Authentication Module Documentation

## Overview

This authentication module provides a complete, free, self-hosted authentication solution using PocketBase as the backend. It includes:

- **User Authentication**: Login, registration, logout, password reset
- **User Profiles**: Customizable preferences and subscription tiers
- **Usage Tracking**: Monitor feature usage with tier-based limits
- **Feature Flags**: Dynamic feature control based on subscription tiers
- **Paywall System**: Flexible tier restrictions with upgrade prompts
- **Real-time Updates**: Event-driven authentication state management

## Architecture

```
modules/auth/
├── src/
│   ├── client/
│   │   └── auth-client.js      # Client-side authentication (browser/Node.js)
│   ├── middleware/
│   │   └── auth-middleware.js  # Express.js middleware
│   ├── api/
│   │   └── auth-routes.js      # REST API endpoints
│   ├── components/
│   │   ├── LoginForm.jsx       # Login form component
│   │   ├── RegisterForm.jsx    # Registration form component
│   │   ├── UserProfile.jsx     # User profile management
│   │   └── PaywallComponents.jsx # Paywall and tier components
│   └── setup/
│       └── setup-pocketbase.js # Database initialization script
```

## Database Schema

### Collections

#### users (Built-in PocketBase collection)
- `id` (string): Unique user identifier
- `email` (string): User email address (unique)
- `name` (string): User display name
- `password` (string): Hashed password
- `verified` (boolean): Email verification status
- `avatar` (file): Profile picture

#### user_profiles
- `id` (string): Profile ID
- `user` (relation to users): Link to user account
- `subscription_tier` (select): free, premium, enterprise
- `tier_expires_at` (datetime): Subscription expiration
- `preferences` (json): User preferences object

#### usage_tracking
- `id` (string): Usage record ID
- `user` (relation to users): Link to user account
- `date` (datetime): Usage date
- `type` (string): Usage type (exercise_runs, api_calls, etc.)
- `count` (number): Usage count

#### feature_flags
- `id` (string): Feature flag ID
- `name` (string): Feature identifier
- `enabled` (boolean): Feature enabled status
- `required_tier` (select): Minimum tier required
- `config` (json): Feature configuration

## Quick Start

### 1. Setup PocketBase

First, start PocketBase using Docker:

```bash
docker run -d \
  --name pocketbase \
  -p 8090:80 \
  -v ./data/pocketbase:/pb_data \
  -e POCKETBASE_ADMIN_EMAIL=admin@example.com \
  -e POCKETBASE_ADMIN_PASSWORD=AdminPass123 \
  spectado/pocketbase:latest
```

### 2. Initialize Database

Run the setup script to create collections and sample data:

```bash
node modules/auth/src/setup/setup-pocketbase.js
```

### 3. Client-Side Integration

#### Basic Authentication

```javascript
import { AuthClient } from './modules/auth/src/client/auth-client.js';

const auth = AuthClient.getInstance();

// Login
try {
    await auth.login('user@example.com', 'password');
    console.log('Login successful!');
} catch (error) {
    console.error('Login failed:', error.message);
}

// Register
try {
    await auth.register({
        email: 'newuser@example.com',
        password: 'securepassword',
        name: 'New User'
    });
    console.log('Registration successful!');
} catch (error) {
    console.error('Registration failed:', error.message);
}

// Check authentication status
if (auth.isAuthenticated()) {
    const user = auth.getCurrentUser();
    console.log('Welcome,', user.name);
}
```

#### Feature Access Control

```javascript
// Check if user has access to a feature
const hasAccess = await auth.hasFeatureAccess('advanced_exercises');
if (hasAccess) {
    // Show advanced exercises
} else {
    // Show paywall or upgrade prompt
}

// Get feature configuration
const config = await auth.getFeatureConfig('api_rate_limiting');
console.log('Rate limit:', config.requests_per_hour);
```

#### Usage Tracking

```javascript
// Track usage
await auth.trackUsage('exercise_runs');

// Check usage limits
const usage = await auth.getUsageStats();
const limits = await auth.getUsageLimits();

if (usage.exercise_runs.today >= limits.exercise_runs.daily) {
    // Show upgrade prompt
}
```

### 4. Server-Side Integration

#### Express.js Middleware

```javascript
const express = require('express');
const AuthMiddleware = require('./modules/auth/src/middleware/auth-middleware.js');
const authRoutes = require('./modules/auth/src/api/auth-routes.js');

const app = express();
const authMiddleware = new AuthMiddleware();

// Add authentication routes
app.use('/api/auth', authRoutes);

// Protect routes with authentication
app.get('/api/protected', 
    authMiddleware.authenticate(),
    (req, res) => {
        res.json({ message: `Hello ${req.user.name}!` });
    }
);

// Require specific tier
app.get('/api/premium-feature',
    authMiddleware.authenticate(),
    authMiddleware.requireTier('premium'),
    (req, res) => {
        res.json({ data: 'Premium content' });
    }
);

// Check feature access
app.get('/api/advanced-analytics',
    authMiddleware.authenticate(),
    authMiddleware.requireFeature('advanced_analytics'),
    (req, res) => {
        res.json({ analytics: 'Advanced data...' });
    }
);

// Track and limit usage
app.post('/api/run-exercise',
    authMiddleware.authenticate(),
    authMiddleware.trackUsage('exercise_runs'),
    (req, res) => {
        // Execute exercise
        res.json({ result: 'Exercise completed' });
    }
);
```

### 5. React Components

#### Authentication Forms

```jsx
import React, { useState } from 'react';
import { LoginForm } from './modules/auth/src/components/LoginForm.jsx';
import { RegisterForm } from './modules/auth/src/components/RegisterForm.jsx';

function AuthPage() {
    const [showLogin, setShowLogin] = useState(true);

    const handleAuthSuccess = () => {
        // Redirect to dashboard or reload app
        window.location.reload();
    };

    return (
        <div>
            {showLogin ? (
                <LoginForm
                    onSuccess={handleAuthSuccess}
                    onShowRegister={() => setShowLogin(false)}
                />
            ) : (
                <RegisterForm
                    onSuccess={handleAuthSuccess}
                    onShowLogin={() => setShowLogin(true)}
                />
            )}
        </div>
    );
}
```

#### Paywall Integration

```jsx
import React, { useState } from 'react';
import { PaywallModal, UsageLimitBanner } from './modules/auth/src/components/PaywallComponents.jsx';
import { AuthClient } from './modules/auth/src/client/auth-client.js';

function ExercisePage() {
    const [showPaywall, setShowPaywall] = useState(false);
    const [usage, setUsage] = useState(null);

    const auth = AuthClient.getInstance();

    const handleFeatureAccess = async (feature) => {
        const hasAccess = await auth.hasFeatureAccess(feature);
        if (!hasAccess) {
            setShowPaywall(true);
        } else {
            // Allow access
        }
    };

    const handleUpgrade = (tier) => {
        // Implement upgrade logic or redirect to payment
        console.log('Upgrading to:', tier);
        setShowPaywall(false);
    };

    return (
        <div>
            <UsageLimitBanner
                usage={usage}
                limits={{ daily: 10 }}
                onUpgrade={handleUpgrade}
            />
            
            <button onClick={() => handleFeatureAccess('advanced_exercises')}>
                Access Advanced Exercises
            </button>

            {showPaywall && (
                <PaywallModal
                    feature="Advanced Exercises"
                    config={{ required_tier: 'premium' }}
                    onClose={() => setShowPaywall(false)}
                    onUpgrade={handleUpgrade}
                />
            )}
        </div>
    );
}
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/password-reset` - Request password reset

### Profile Management

- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Usage Tracking

- `GET /api/auth/usage` - Get usage statistics
- `POST /api/auth/usage` - Track usage manually

### Feature Flags

- `GET /api/auth/features` - Get available features
- `GET /api/auth/features/:name/check` - Check feature access

### Admin

- `POST /api/auth/upgrade` - Upgrade user tier (admin only)

## Configuration

### Environment Variables

```bash
# PocketBase Configuration
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=AdminPass123

# Application Settings
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:3000
```

### Subscription Tiers

The system supports three built-in tiers:

#### Free Tier
- Basic exercises
- Limited daily usage (configurable)
- Community support
- Progress tracking

#### Premium Tier ($9.99/month)
- All exercises
- Unlimited usage
- Priority support
- Advanced analytics
- Code explanations

#### Enterprise Tier ($29.99/month)
- Everything in Premium
- Team management
- Custom exercises
- API access
- Advanced reporting

## Events

The AuthClient emits events for real-time updates:

```javascript
const auth = AuthClient.getInstance();

// Listen for authentication state changes
auth.on('auth:login', (user) => {
    console.log('User logged in:', user);
});

auth.on('auth:logout', () => {
    console.log('User logged out');
});

auth.on('auth:profile_updated', (profile) => {
    console.log('Profile updated:', profile);
});

auth.on('auth:usage_updated', (usage) => {
    console.log('Usage updated:', usage);
});
```

## Security Features

- **Password Hashing**: Secure bcrypt hashing via PocketBase
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Rate Limiting**: Configurable rate limits per tier
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable CORS origins
- **SQL Injection Protection**: Parameterized queries via PocketBase ORM

## Customization

### Adding New Tiers

1. Update the `user_profiles` collection schema in PocketBase admin
2. Add tier configuration to `AuthClient.TIER_LEVELS`
3. Update UI components with new tier information

### Custom Feature Flags

1. Create feature flag in PocketBase admin or via API
2. Use `auth.hasFeatureAccess('your_feature')` to check access
3. Implement feature-specific logic based on access

### Usage Tracking Types

1. Define new usage types in your application
2. Call `auth.trackUsage('your_usage_type')` when appropriate
3. Configure limits in feature flags or tier configurations

## Troubleshooting

### Common Issues

#### PocketBase Connection Failed
- Verify PocketBase is running on the correct port
- Check POCKETBASE_URL environment variable
- Ensure Docker container is healthy

#### Authentication Fails
- Check admin credentials are correct
- Verify user exists and password is correct
- Check PocketBase logs for detailed errors

#### Feature Flags Not Working
- Ensure feature flags are created and enabled
- Check tier requirements match user's subscription
- Verify feature flag names match exactly

## Production Deployment

### Security Checklist

- [ ] Change default admin password
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set secure JWT secret
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for PocketBase data

### Performance Optimization

- [ ] Enable PocketBase caching
- [ ] Implement Redis for session storage (optional)
- [ ] Set up CDN for static assets
- [ ] Configure database connection pooling
- [ ] Monitor usage patterns and optimize queries

This authentication system provides a complete, production-ready solution that can be customized to fit your specific needs while maintaining security and scalability.