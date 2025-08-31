# @portal/business - Centralized Business Logic Package

## 🎯 **THE SINGLE SOURCE OF TRUTH FOR ALL BUSINESS DECISIONS**

This package solves the **critical architectural flaw** you identified: "*How do I add paywalling without editing multiple packages?*"

**Answer: You don't. You only edit THIS package.**

## 🏗️ **Architecture Solution**

### The Problem (Before)
```
❌ TIGHT COUPLING - Business logic scattered everywhere
├── Frontend makes subscription decisions
├── Backend enforces access rules  
├── Executor checks rate limits
└── Each package duplicates business logic
```

### The Solution (After)
```
✅ LOOSE COUPLING - Business logic centralized
├── @portal/business ← ALL business decisions here
├── @portal/frontend ← Asks business: "Can user do X?"
├── @portal/backend ← Asks business: "Can user do X?"
└── @portal/executor ← Asks business: "Can user do X?"
```

## 🚀 **How to Add Paywalling - ONLY Touch This Package**

### Step 1: Define the business rule (AccessControlService.ts)
```typescript
case 'use_new_feature':
  return this.checkNewFeatureAccess(permissions);
```

### Step 2: Other packages ask permission
```typescript
// Frontend
import { canUserAccess } from '@portal/business';
const decision = await canUserAccess({ userId, action: 'use_new_feature' });
if (!decision.allowed) showPaywall(decision.redirect);

// Backend  
const business = getBusinessFacade();
const canAccess = await business.canUserAccess({ userId, action: 'use_new_feature' });
if (!canAccess.allowed) return res.status(402).json({ error: canAccess.reason });

// Executor
const decision = await canExecuteCode(userId);
if (!decision.allowed) return { error: decision.reason };
```

### Step 3: No other packages need changes
✅ Frontend: No business logic changes  
✅ Backend: No business logic changes  
✅ Executor: No business logic changes  
✅ Exercises: No changes needed  

## 📦 **Package Structure**

```
@portal/business/
├── src/
│   ├── BusinessFacade.ts           ← Main entry point
│   ├── services/
│   │   ├── AccessControlService.ts ← Permission gates
│   │   └── PaymentService.ts       ← Subscription logic
│   ├── interfaces/                 ← Type definitions
│   │   ├── BusinessInterfaces.ts
│   │   ├── UserInterfaces.ts
│   │   ├── PaymentInterfaces.ts
│   │   └── AnalyticsInterfaces.ts
│   └── index.ts                    ← Public exports
├── DEMO_Paywalling.ts              ← See it in action!
└── package.json
```

## 🎮 **See It In Action**

Run the demonstration to see how paywalling works:

```bash
cd packages/@portal/business
npm run demo
```

This shows:
- ✅ Free users blocked from premium features
- ✅ Clear paywall messages with upgrade links
- ✅ How other packages integrate seamlessly
- ✅ Adding new premium features requires ONLY business package changes

## 🔧 **Integration Examples**

### Frontend Integration
```typescript
import { canUserAccess } from '@portal/business';

// Before showing exercise
const decision = await canUserAccess({
  userId: currentUser?.id,
  exerciseId: 'E8_ops_module',
  action: 'view_exercise'
});

if (!decision.allowed) {
  showPaywallModal(decision.reason, decision.redirect);
  return;
}

// Continue to exercise...
```

### Backend API Integration
```typescript
import { getBusinessFacade } from '@portal/business';

app.get('/api/exercise/:id', async (req, res) => {
  const business = getBusinessFacade();
  const canAccess = await business.canAccessExercise(req.user?.id, req.params.id);
  
  if (!canAccess.allowed) {
    return res.status(402).json({ 
      error: canAccess.reason,
      upgradeUrl: canAccess.redirect 
    });
  }
  
  // Serve content...
});
```

### Python Executor Integration
```typescript
import { canExecuteCode } from '@portal/business';

export async function executeUserCode(userId: string, code: string) {
  const decision = await canExecuteCode(userId);
  
  if (!decision.allowed) {
    return { 
      error: decision.reason,
      upgradeRequired: true 
    };
  }
  
  return await runPythonCode(code);
}
```

## 💰 **Subscription Plans & Pricing**

The PaymentService defines all available plans:

- **Free Trial**: 14 days, limited features
- **Premium Monthly**: $9.99/month, all features
- **Premium Annual**: $99.99/year (17% discount) 
- **Enterprise**: $299.99/year, team features

Want to add new plans? Only modify `PaymentService.getAvailablePlans()`.

## 🎯 **Business Rules Engine**

The AccessControlService enforces:

- **Free users**: Basic exercises, 10 executions/hour
- **Trial users**: All exercises, AI hints, 50 executions/hour  
- **Premium users**: Everything + downloads, unlimited executions
- **Enterprise users**: Everything + team features, priority support

Want to change rules? Only modify `AccessControlService.getUserPermissions()`.

## 🔍 **Available Business Actions**

Current actions supported:
- `view_exercise` - Access to exercise content
- `execute_code` - Run Python code  
- `view_solution` - See exercise solutions
- `download_content` - Download materials
- `use_ai_hints` - AI-powered hints

Want new actions? Add them to `AccessControlService.canUserAccess()`.

## 🚀 **Extending for Premium Features**

Adding any new premium feature follows the same pattern:

1. **Add business rule** (AccessControlService)
2. **Other packages ask permission** (import from this package)
3. **Show paywall if denied** (using provided redirect URL)

Examples of features you can add:
- ✨ AI Code Review
- 🔍 Advanced Debugging  
- 👥 Team Collaboration
- 📊 Progress Analytics
- 🎨 Custom Themes
- ⚡ Priority Support
- 📈 A/B Testing
- 📱 Mobile App Features

## 📈 **Analytics & Tracking**

Built-in business intelligence:
- Conversion funnel tracking
- A/B testing framework  
- User behavior analytics
- Revenue per user metrics
- Churn rate calculations

## ⚠️ **Important Notes**

### For Other Package Developers:
- **NEVER make business decisions in your package**
- **ALWAYS ask this package for permission**
- **NEVER duplicate business logic**
- **Import only from this package's index.ts**

### For Business Feature Development:
- **ALL business rules go in AccessControlService**
- **ALL payment logic goes in PaymentService**  
- **ALL user tiers defined in UserInterfaces**
- **Use BusinessFacade as single entry point**

## 🎉 **Success Metrics**

With this architecture:
- ✅ Adding paywalling requires editing ONLY 1 package
- ✅ Business logic is never duplicated
- ✅ All packages remain loosely coupled
- ✅ Premium features can be added rapidly
- ✅ A/B testing business rules is trivial
- ✅ Subscription management is centralized

## 🛠️ **Development Commands**

```bash
# Install dependencies
npm install

# Build package  
npm run build

# Run demonstration
npm run demo

# Type checking
npm run type-check
```

---

## 💡 **The Big Picture**

This package transforms your architecture from:

**"I need to edit 5 packages to add paywalling"** 

to:

**"I only edit the business package to add paywalling"**

That's **TRUE loose coupling** for business expansion. 🚀