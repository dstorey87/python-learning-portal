/**
 * DEMONSTRATION: How Paywalling Works with Centralized Business Logic
 * 
 * This shows how ONLY the business package needs to change to add paywalling.
 * No other package needs modification.
 */

import { getBusinessFacade } from './src/BusinessFacade';
import { BusinessContext } from './src/interfaces/BusinessInterfaces';

/**
 * SCENARIO 1: Current state - All exercises are free
 */
async function demoCurrentState() {
    console.log('\n=== CURRENT STATE: All exercises are free ===');

    const business = getBusinessFacade();

    // Free user trying to access any exercise
    const freeUserResult = await business.canAccessExercise(undefined, 'E9_bug_hunt');
    console.log('Free user accessing E9_bug_hunt:', freeUserResult);

    // Free user trying to execute code
    const executeResult = await business.canExecuteCode(undefined);
    console.log('Free user executing code:', executeResult);
}

/**
 * SCENARIO 2: Adding paywalling - Only business package changes
 */
async function demoPaywallingAdded() {
    console.log('\n=== AFTER ADDING PAYWALLING: Some exercises require payment ===');

    const business = getBusinessFacade();

    // Free user trying to access premium exercise
    const premiumExerciseResult = await business.canAccessExercise('free_user_123', 'E8_ops_module');
    console.log('Free user accessing premium E8_ops_module:', premiumExerciseResult);

    // Free user trying to view solutions (premium feature)
    const solutionResult = await business.canViewSolutions('free_user_123');
    console.log('Free user viewing solutions:', solutionResult);

    // Free user trying to use AI hints (premium feature)
    const aiHintResult = await business.canUseAIHints('free_user_123');
    console.log('Free user using AI hints:', aiHintResult);
}

/**
 * SCENARIO 3: Premium user - All access granted
 */
async function demoPremiumUser() {
    console.log('\n=== PREMIUM USER: Full access ===');

    const business = getBusinessFacade();

    // Note: In real implementation, user tier would come from database
    // For demo, we're showing what would happen with premium user

    console.log('Premium user would have:');
    console.log('- Access to all exercises: ✅');
    console.log('- Unlimited code execution: ✅');
    console.log('- Solution downloads: ✅');
    console.log('- AI hints: ✅');
    console.log('- Advanced features: ✅');
}

/**
 * SCENARIO 4: How other packages consume business decisions
 */
function demoPackageIntegration() {
    console.log('\n=== HOW OTHER PACKAGES INTEGRATE ===');

    console.log(`
  // FRONTEND INTEGRATION:
  import { canUserAccess } from '@portal/business';
  
  async function handleExerciseClick(exerciseId: string) {
    const decision = await canUserAccess({
      userId: currentUser?.id,
      exerciseId,
      action: 'view_exercise'
    });
    
    if (!decision.allowed) {
      // Show paywall with upgrade prompt
      showPaywallModal(decision.reason, decision.redirect);
      return;
    }
    
    // Continue to exercise
    navigateToExercise(exerciseId);
  }
  
  // BACKEND INTEGRATION:
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
    
    // Serve exercise content
    res.json(await getExerciseContent(req.params.id));
  });
  
  // EXECUTOR INTEGRATION:
  import { canExecuteCode } from '@portal/business';
  
  export async function executeUserCode(userId: string, code: string) {
    const decision = await canExecuteCode(userId);
    
    if (!decision.allowed) {
      return { 
        error: decision.reason,
        upgradeRequired: true 
      };
    }
    
    // Execute the code
    return await runPythonCode(code);
  }
  `);
}

/**
 * SCENARIO 5: Adding new premium features - Business package only
 */
function demoAddingNewFeatures() {
    console.log('\n=== ADDING NEW PREMIUM FEATURES ===');

    console.log(`
  Want to add AI Code Review? Only modify business package:
  
  1. Add new action to AccessControlService:
     case 'use_ai_code_review':
       return this.checkAICodeReviewAccess(permissions);
  
  2. Frontend calls:
     const canUseAI = await canUserAccess({ userId, action: 'use_ai_code_review' });
  
  3. No other packages need changes!
  
  Same pattern for ANY new premium feature:
  - Advanced debugging
  - Team collaboration  
  - Custom themes
  - Priority support
  - Advanced analytics
  - Export progress reports
  
  ALL business decisions stay in the business package.
  Other packages just ask "can user do X?" and show paywall if not.
  `);
}

/**
 * Run all demonstrations
 */
async function runDemonstrations() {
    console.log('🚀 BUSINESS LOGIC CENTRALIZATION DEMONSTRATION');
    console.log('==============================================');

    await demoCurrentState();
    await demoPaywallingAdded();
    await demoPremiumUser();
    demoPackageIntegration();
    demoAddingNewFeatures();

    console.log('\n✅ DEMONSTRATION COMPLETE');
    console.log('\nKEY TAKEAWAY:');
    console.log('- Business decisions = ONLY in @portal/business package');
    console.log('- Other packages ask questions, don\'t make decisions');
    console.log('- Adding paywalling = modify ONLY business package');
    console.log('- This is TRUE loose coupling for business expansion');
}

// Run if this file is executed directly
if (require.main === module) {
    runDemonstrations().catch(console.error);
}