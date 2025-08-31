/**
 * @portal/core - Core Module System
 * 
 * The orchestration layer that enables true modular architecture.
 * Discovers, loads, and manages all application modules.
 */

// Main orchestration system
export { CoreSystem } from './CoreSystem';

// Module discovery and registration
export { CoreModuleLoader } from './discovery/ModuleLoader';
export { ModuleRegistry } from './discovery/ModuleRegistry';

// API and communication infrastructure
export { APIGateway } from './gateway/APIGateway';
export { CoreEventBus, CORE_EVENTS } from './gateway/EventBus';

// Type definitions for modules
export * from './types/ModuleTypes';

/**
 * Quick start function for setting up the core system
 */
import { Express } from 'express';
import { CoreSystem } from './CoreSystem';

export async function setupCoreSystem(app: Express, modulesPath?: string): Promise<CoreSystem> {
    const core = new CoreSystem(app, modulesPath);
    await core.initialize();
    return core;
}

/**
 * HOW TO USE:
 * 
 * 1. In your main app:
 *    import { setupCoreSystem } from '@portal/core';
 *    const core = await setupCoreSystem(app, './modules');
 * 
 * 2. Create modules with module.config.js files
 * 3. Modules automatically discovered and loaded
 * 4. APIs and routes automatically registered
 * 5. Inter-module communication via event bus
 */