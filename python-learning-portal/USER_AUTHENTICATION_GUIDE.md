# 🏗️ **Modular User Authentication & Paywall Implementation Guide**

## 📋 **Overview**

This guide shows you how to implement a gold-standard user authentication system with dynamic paywalls in your modular Python Learning Portal architecture. You'll get:

- **Individual VS Code workspaces** for each module (low-impact development)
- **Supabase Authentication** (free tier: 50k users/month) 
- **Stripe subscription management** (dynamic paywall control)
- **Role-based access control** with dynamic permissions
- **Seamless integration** with your existing modular system

---

## 🎯 **Part 1: VS Code Workspace Setup for Modular Development**

### **1.1 Individual Module Development**

Each module now has its own VS Code workspace for isolated development:

```bash
# Core Module Development
code modules/core/core-module.code-workspace

# Exercises Module Development  
code modules/exercises/exercises-module.code-workspace

# Main Coordination (cross-module work)
code main-coordination.code-workspace
```

### **1.2 Development Workflow**

**For single-module changes:**
1. Open the specific module workspace
2. Make changes within that module
3. Test using module-specific tasks
4. Changes automatically integrate via core system

**For multi-module changes:**
1. Open main coordination workspace
2. Work across multiple modules
3. Use integration tests
4. Deploy coordinated changes

---

## 🔐 **Part 2: Gold-Standard User Authentication Implementation**

### **2.1 Recommended Architecture**

Based on research of 2024's best practices:

**🥇 Winner: Supabase Auth + Custom Express Middleware**

**Why this combination?**
- ✅ **Free tier**: 50k users/month (perfect for growth)
- ✅ **Built-in social logins**: Google, GitHub, Discord, etc.
- ✅ **JWT tokens**: Perfect for API authentication  
- ✅ **PostgreSQL integration**: Row-level security
- ✅ **Full control**: Custom paywall logic
- ✅ **Modular integration**: Works perfectly with your architecture

### **2.2 Create Users Module**

Let's create a dedicated users module using your module generator:

```bash
cd modules
mkdir users
cd users
```

Create the users module configuration:

```javascript
// modules/users/module.config.js
module.exports = {
  name: 'users',
  displayName: 'User Management',
  description: 'Authentication, authorization, and user management with Supabase',
  
  // Frontend routes
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
      title: 'Sign Up',
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

  // Backend APIs
  apis: [
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'loginUser',
      permissions: [],
      requiresAuth: false
    },
    {
      method: 'POST',
      path: '/auth/signup',
      handler: 'signupUser',
      permissions: [],
      requiresAuth: false
    },
    {
      method: 'GET',
      path: '/profile',
      handler: 'getUserProfile',
      permissions: ['view_profile'],
      requiresAuth: true
    },
    {
      method: 'PUT',
      path: '/profile',
      handler: 'updateUserProfile',
      permissions: ['edit_profile'],
      requiresAuth: true
    },
    {
      method: 'GET',
      path: '/subscription',
      handler: 'getSubscriptionStatus',
      permissions: ['view_subscription'],
      requiresAuth: true
    }
  ],

  // Permissions this module defines
  permissions: [
    'view_profile',
    'edit_profile', 
    'view_subscription',
    'manage_users', // admin only
    'view_analytics' // premium users
  ],

  // No dependencies - users is foundational
  dependencies: [],

  // Database schema
  database: {
    tables: [
      {
        name: 'user_profiles',
        columns: [
          { name: 'id', type: 'UUID', primary: true, references: 'auth.users(id)' },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, unique: true },
          { name: 'full_name', type: 'VARCHAR(255)' },
          { name: 'avatar_url', type: 'TEXT' },
          { name: 'subscription_tier', type: 'VARCHAR(50)', default: 'free' },
          { name: 'subscription_status', type: 'VARCHAR(50)', default: 'active' },
          { name: 'stripe_customer_id', type: 'VARCHAR(255)', unique: true },
          { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
          { name: 'updated_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
        ],
        indexes: [
          { columns: ['email'], unique: true },
          { columns: ['stripe_customer_id'], unique: true }
        ]
      },
      {
        name: 'user_permissions',
        columns: [
          { name: 'id', type: 'UUID', primary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'UUID', references: 'auth.users(id)', nullable: false },
          { name: 'permission', type: 'VARCHAR(100)', nullable: false },
          { name: 'granted_by', type: 'UUID', references: 'auth.users(id)' },
          { name: 'granted_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
          { name: 'expires_at', type: 'TIMESTAMPTZ' }
        ],
        indexes: [
          { columns: ['user_id', 'permission'], unique: true }
        ]
      }
    ]
  },

  // Free tier vs Premium features
  paywall: {
    freeTier: {
      maxUsage: 5, // exercises per day
      features: [
        'basic_exercises',
        'view_profile', 
        'edit_profile',
        'basic_progress_tracking'
      ]
    },
    premiumFeatures: [
      'unlimited_exercises',
      'advanced_exercises',
      'detailed_analytics',
      'progress_export',
      'priority_support',
      'custom_exercises'
    ]
  },

  // Module initialization
  async initialize(coreServices) {
    console.log('🚀 Initializing Users module...');
    
    // Set up Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Add Supabase to core services
    coreServices.supabase = supabase;
    coreServices.auth = {
      verifyToken: async (token) => {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        return error ? null : user;
      },
      
      getUserPermissions: async (userId) => {
        const { data } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString());
        
        return data?.map(p => p.permission) || [];
      }
    };
    
    console.log('✅ Users module initialized with Supabase');
  }
};
```

### **2.3 Supabase Setup**

1. **Create Supabase Project**:
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new project
   # Copy URL and anon key
   ```

2. **Environment Variables**:
   ```bash
   # .env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ... # For server-side operations
   ```

3. **Install Dependencies**:
   ```bash
   cd modules/users
   npm install @supabase/supabase-js bcryptjs jsonwebtoken
   ```

### **2.4 Authentication Middleware**

Create powerful authentication middleware that integrates with your module system:

```typescript
// modules/users/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    subscriptionTier: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
    }

    const coreServices = (global as any).coreServices;
    const supabase = coreServices.supabase;
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Get user profile and permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: permissions } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', user.id)
      .or('expires_at.is.null,expires_at.gt.now()');

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
      permissions: permissions?.map(p => p.permission) || [],
      subscriptionTier: profile?.subscription_tier || 'free'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        error: `Permission '${permission}' required` 
      });
    }

    next();
  };
};

export const requireSubscription = (tier: 'free' | 'premium' | 'enterprise') => {
  const tierLevels = { free: 0, premium: 1, enterprise: 2 };
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const userLevel = tierLevels[req.user.subscriptionTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[tier];

    if (userLevel < requiredLevel) {
      return res.status(402).json({ 
        success: false, 
        error: `${tier} subscription required`,
        upgradeRequired: true,
        currentTier: req.user.subscriptionTier,
        requiredTier: tier
      });
    }

    next();
  };
};
```

---

## 💳 **Part 3: Stripe Integration for Dynamic Paywalls**

### **3.1 Create Payments Module**

```javascript
// modules/payments/module.config.js
module.exports = {
  name: 'payments',
  displayName: 'Subscription Management',
  description: 'Stripe integration for dynamic paywall management',
  
  routes: [
    {
      path: '/pricing',
      component: 'PricingPage',
      title: 'Pricing Plans',
      showInNav: true,
      navOrder: 90,
      requiresAuth: false
    },
    {
      path: '/billing',
      component: 'BillingPage',
      title: 'Billing',
      showInNav: true,
      navOrder: 95,
      requiresAuth: true
    }
  ],

  apis: [
    {
      method: 'POST',
      path: '/create-subscription',
      handler: 'createSubscription',
      permissions: [],
      requiresAuth: true
    },
    {
      method: 'POST',
      path: '/cancel-subscription',
      handler: 'cancelSubscription',
      permissions: ['manage_subscription'],
      requiresAuth: true
    },
    {
      method: 'POST',
      path: '/webhook',
      handler: 'handleStripeWebhook',
      permissions: [],
      requiresAuth: false
    },
    {
      method: 'GET',
      path: '/plans',
      handler: 'getSubscriptionPlans',
      permissions: [],
      requiresAuth: false
    }
  ],

  dependencies: ['users'], // Depends on users module

  paywall: {
    // This module defines the paywall system
    plans: {
      free: {
        price: 0,
        features: ['5 exercises per day', 'Basic progress tracking'],
        limits: { exercisesPerDay: 5, storageGB: 0.1 }
      },
      premium: {
        price: 9.99,
        priceId: 'price_premium_monthly', // Stripe price ID
        features: ['Unlimited exercises', 'Advanced analytics', 'Priority support'],
        limits: { exercisesPerDay: -1, storageGB: 10 }
      },
      enterprise: {
        price: 29.99,
        priceId: 'price_enterprise_monthly',
        features: ['Everything in Premium', 'Custom exercises', 'API access'],
        limits: { exercisesPerDay: -1, storageGB: 100 }
      }
    }
  },

  async initialize(coreServices) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    coreServices.stripe = stripe;
    
    // Set up paywall checking function
    coreServices.paywall = {
      checkAccess: async (userId, feature) => {
        const { data: profile } = await coreServices.supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('id', userId)
          .single();
        
        const tier = profile?.subscription_tier || 'free';
        const config = this.paywall.plans[tier];
        
        return config.features.includes(feature);
      },
      
      enforceLimit: async (userId, limitType, increment = 1) => {
        // Check daily limits, usage tracking, etc.
        // Return { allowed: boolean, remaining: number, resetTime: Date }
      }
    };
    
    console.log('✅ Payments module initialized with Stripe');
  }
};
```

### **3.2 Stripe Webhook Handler**

```typescript
// modules/payments/src/api/webhookHandler.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const coreServices = (global as any).coreServices;
  const stripe = coreServices.stripe;
  const supabase = coreServices.supabase;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        await cancelUserSubscription(deletedSub, supabase);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await recordPayment(invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function updateUserSubscription(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  
  // Get subscription tier from price ID
  const priceId = subscription.items.data[0].price.id;
  let tier = 'free';
  
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) tier = 'premium';
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) tier = 'enterprise';

  await supabase
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}
```

---

## 🔧 **Part 4: Dynamic Paywall Integration**

### **4.1 Update Core Module for Paywall Support**

Add paywall middleware to your existing core system:

```typescript
// modules/core/src/middleware/paywallMiddleware.ts
import { Request, Response, NextFunction } from 'express';

interface PaywallRequest extends Request {
  user?: {
    id: string;
    subscriptionTier: string;
  };
}

export const paywallMiddleware = (requiredFeature: string) => {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        paywall: {
          required: true,
          feature: requiredFeature
        }
      });
    }

    const coreServices = (global as any).coreServices;
    
    if (!coreServices.paywall) {
      console.warn('Paywall service not available');
      return next();
    }

    const hasAccess = await coreServices.paywall.checkAccess(
      req.user.id, 
      requiredFeature
    );

    if (!hasAccess) {
      return res.status(402).json({
        success: false,
        error: `Premium feature: ${requiredFeature}`,
        paywall: {
          required: true,
          feature: requiredFeature,
          currentTier: req.user.subscriptionTier,
          upgradeRequired: true,
          upgradeUrl: '/pricing'
        }
      });
    }

    next();
  };
};
```

### **4.2 Update Exercises Module with Paywall**

Add paywall checks to your exercises:

```typescript
// Update modules/exercises/src/api/exerciseHandlers.ts
import { paywallMiddleware } from '@portal/core';

export const getAdvancedExercise = [
  authMiddleware,
  paywallMiddleware('advanced_exercises'),
  async (req: Request, res: Response) => {
    // Only premium users can access this
    // Implementation here...
  }
];

export const executeCode = [
  authMiddleware,
  async (req: Request, res: Response) => {
    const coreServices = (global as any).coreServices;
    
    // Check daily execution limit
    const limit = await coreServices.paywall.enforceLimit(
      req.user.id,
      'codeExecutions'
    );
    
    if (!limit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Daily execution limit reached',
        paywall: {
          limitReached: true,
          resetTime: limit.resetTime,
          upgradeUrl: '/pricing'
        }
      });
    }
    
    // Execute code...
  }
];
```

---

## 🚀 **Part 5: Frontend Integration**

### **5.1 Supabase Client Setup**

```typescript
// modules/users/src/client/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const auth = {
  signUp: async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password })
  },
  
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  },
  
  signInWithGoogle: () => {
    return supabase.auth.signInWithOAuth({ provider: 'google' })
  },
  
  signOut: () => {
    return supabase.auth.signOut()
  },
  
  getCurrentUser: () => {
    return supabase.auth.getUser()
  }
}
```

### **5.2 Paywall Component**

```tsx
// modules/payments/src/components/PaywallModal.tsx
import React from 'react';

interface PaywallModalProps {
  feature: string;
  currentTier: string;
  onUpgrade: () => void;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  feature,
  currentTier,
  onUpgrade,
  onClose
}) => {
  return (
    <div className="paywall-modal">
      <div className="paywall-content">
        <h2>🚀 Upgrade to Premium</h2>
        <p>
          The feature "{feature}" is available for Premium subscribers.
        </p>
        <p>
          Your current plan: <strong>{currentTier}</strong>
        </p>
        
        <div className="paywall-benefits">
          <h3>Premium Benefits:</h3>
          <ul>
            <li>✅ Unlimited exercise runs</li>
            <li>✅ Advanced Python exercises</li>
            <li>✅ Detailed progress analytics</li>
            <li>✅ Priority support</li>
          </ul>
        </div>
        
        <div className="paywall-actions">
          <button onClick={onUpgrade} className="upgrade-btn">
            Upgrade to Premium - $9.99/month
          </button>
          <button onClick={onClose} className="close-btn">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📦 **Part 6: Complete Implementation Steps**

### **6.1 Step-by-Step Setup**

1. **Create Supabase Project**:
   ```bash
   # 1. Visit https://supabase.com
   # 2. Create new project
   # 3. Set up authentication providers (Google, GitHub)
   # 4. Copy environment variables
   ```

2. **Set up Stripe**:
   ```bash
   # 1. Create Stripe account
   # 2. Create products and prices
   # 3. Set up webhooks
   # 4. Copy API keys
   ```

3. **Create Users Module**:
   ```bash
   cd modules
   # Copy the users module code above
   # Install dependencies
   npm install @supabase/supabase-js stripe bcryptjs
   ```

4. **Create Payments Module**:
   ```bash
   cd modules
   # Copy the payments module code above
   # Set up Stripe products
   ```

5. **Update Environment Variables**:
   ```bash
   # .env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   STRIPE_PREMIUM_PRICE_ID=price_premium_monthly
   STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly
   ```

6. **Test the Integration**:
   ```bash
   # Start development server
   npm run dev
   
   # Test authentication
   # Test paywall blocking
   # Test subscription upgrade
   ```

---

## 🎯 **Part 7: Dynamic Access Control**

### **7.1 Real-Time Permission Updates**

```typescript
// Admin API for dynamic permission management
export const updateUserPermissions = async (req: Request, res: Response) => {
  const { userId, permissions, action } = req.body; // add, remove, or replace
  
  const coreServices = (global as any).coreServices;
  const supabase = coreServices.supabase;

  try {
    if (action === 'replace') {
      // Remove all existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);
      
      // Add new permissions
      const newPermissions = permissions.map((permission: string) => ({
        user_id: userId,
        permission,
        granted_by: req.user.id,
        granted_at: new Date().toISOString()
      }));
      
      await supabase
        .from('user_permissions')
        .insert(newPermissions);
    }
    
    // Emit event for real-time updates
    coreServices.eventBus.emit('user.permissions_updated', {
      userId,
      permissions,
      updatedBy: req.user.id
    });

    res.json({ success: true, message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};
```

---

## 🎉 **Part 8: Benefits of This Architecture**

### **8.1 Modular Development Workflow**

```bash
# Working on authentication only
code modules/users/users-module.code-workspace

# Working on payment features only  
code modules/payments/payments-module.code-workspace

# Working on exercises with paywall integration
code modules/exercises/exercises-module.code-workspace

# Cross-module coordination
code main-coordination.code-workspace
```

### **8.2 Dynamic Feature Control**

- ✅ **Real-time paywall updates** - no code changes needed
- ✅ **A/B test pricing** - change limits dynamically
- ✅ **Gradual feature rollout** - enable features per user
- ✅ **Emergency feature disabling** - instant control

### **8.3 Scalability Benefits**

- ✅ **Free tier**: 50k users before any costs
- ✅ **Modular scaling**: Scale each service independently
- ✅ **Database efficiency**: Supabase auto-scaling
- ✅ **CDN integration**: Built-in global distribution

---

## ⚡ **Quick Start Commands**

```bash
# 1. Set up authentication
cd modules/users && npm install @supabase/supabase-js

# 2. Set up payments
cd modules/payments && npm install stripe

# 3. Update core system
cd modules/core && npm run build

# 4. Start coordinated development
code main-coordination.code-workspace

# 5. Test the full system
npm run test:integration
```

**🎯 Result**: You now have a gold-standard authentication system with dynamic paywalls that integrates seamlessly with your modular architecture. Each module can be developed independently while the core system orchestrates everything together!
