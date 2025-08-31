/**
 * Core System Orchestrator
 * 
 * Main class that coordinates module loading, registration, and initialization
 */

import { Express } from 'express';
import path from 'path';
import { ModuleDefinition, CoreServices } from './types/ModuleTypes';
import { CoreModuleLoader } from './discovery/ModuleLoader';
import { ModuleRegistry } from './discovery/ModuleRegistry';
import { APIGateway } from './gateway/APIGateway';
import { CoreEventBus } from './gateway/EventBus';

export class CoreSystem {
    private app: Express;
    private moduleLoader: CoreModuleLoader;
    private moduleRegistry: ModuleRegistry;
    private apiGateway: APIGateway;
    private eventBus: CoreEventBus;
    private coreServices: CoreServices;
    private initialized = false;

    constructor(app: Express, modulesPath?: string) {
        this.app = app;

        // Initialize core services
        const defaultModulesPath = path.join(process.cwd(), 'modules');
        this.moduleLoader = new CoreModuleLoader(modulesPath || defaultModulesPath);
        this.moduleRegistry = new ModuleRegistry();
        this.apiGateway = new APIGateway(app);
        this.eventBus = new CoreEventBus();

        // Create core services that will be injected into modules
        this.coreServices = {
            database: null, // Will be set by calling code
            auth: null,     // Will be set by calling code  
            eventBus: this.eventBus,
            logger: console, // Simple logger for now
            business: null   // Will be set by calling code
        };
    }

    /**
     * Initialize the entire module system
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            throw new Error('Core system already initialized');
        }

        console.log('🚀 Initializing Core Module System...');

        try {
            // Step 1: Discover and load all modules
            console.log('📦 Discovering modules...');
            const modules = await this.moduleLoader.loadModules();

            if (modules.length === 0) {
                console.log('⚠️  No modules found to load');
                return;
            }

            // Step 2: Register modules in dependency order
            console.log('📝 Registering modules...');
            const orderedModules = this.orderModulesByDependencies(modules);

            for (const module of orderedModules) {
                this.moduleRegistry.register(module);
            }

            // Step 3: Register API routes for all modules
            console.log('🔗 Setting up API routes...');
            for (const module of orderedModules) {
                this.apiGateway.registerModuleRoutes(module);
            }

            // Step 4: Initialize modules with core services
            console.log('⚙️  Initializing modules...');
            await this.initializeModules(orderedModules);

            // Step 5: Set up core API endpoints
            this.setupCoreEndpoints();

            this.initialized = true;

            // Emit system ready event
            this.eventBus.emit('system.ready', {
                modules: modules.length,
                routes: this.moduleRegistry.getAllRoutes().length,
                apis: this.moduleRegistry.getAllAPIs().length
            });

            console.log(`✅ Core System initialized with ${modules.length} modules`);
            this.printSystemSummary();

        } catch (error) {
            console.error('❌ Failed to initialize core system:', error);
            throw error;
        }
    }

    /**
     * Set core services that modules can use
     */
    setCoreServices(services: Partial<CoreServices>): void {
        this.coreServices = { ...this.coreServices, ...services };
    }

    /**
     * Get module registry for external access
     */
    getModuleRegistry(): ModuleRegistry {
        return this.moduleRegistry;
    }

    /**
     * Get event bus for external access
     */
    getEventBus(): CoreEventBus {
        return this.eventBus;
    }

    /**
     * Get API gateway for external access
     */
    getAPIGateway(): APIGateway {
        return this.apiGateway;
    }

    /**
     * Hot reload a specific module (development feature)
     */
    async reloadModule(moduleName: string): Promise<void> {
        console.log(`🔄 Reloading module: ${moduleName}`);

        const existingModule = this.moduleRegistry.get(moduleName);
        if (!existingModule) {
            throw new Error(`Module ${moduleName} not found`);
        }

        try {
            // Unregister existing module
            this.moduleRegistry.unregister(moduleName);

            // Reload module
            const reloadedModule = await this.moduleLoader.loadModule(existingModule.path!);

            // Re-register
            this.moduleRegistry.register(reloadedModule);

            // Re-register API routes
            this.apiGateway.registerModuleRoutes(reloadedModule);

            console.log(`✅ Module ${moduleName} reloaded successfully`);

            // Emit reload event
            this.eventBus.emit('system.module_reloaded', {
                moduleName,
                version: reloadedModule.version
            });

        } catch (error) {
            console.error(`❌ Failed to reload module ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Order modules by their dependencies
     */
    private orderModulesByDependencies(modules: ModuleDefinition[]): ModuleDefinition[] {
        const moduleMap = new Map<string, ModuleDefinition>();
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const ordered: ModuleDefinition[] = [];

        // Create module map
        modules.forEach(module => moduleMap.set(module.name, module));

        const visit = (moduleName: string) => {
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected: ${moduleName}`);
            }

            if (visited.has(moduleName)) {
                return;
            }

            const module = moduleMap.get(moduleName);
            if (!module) {
                throw new Error(`Module dependency not found: ${moduleName}`);
            }

            visiting.add(moduleName);

            // Visit dependencies first
            if (module.dependencies) {
                for (const dependency of module.dependencies) {
                    visit(dependency);
                }
            }

            visiting.delete(moduleName);
            visited.add(moduleName);
            ordered.push(module);
        };

        // Visit all modules
        modules.forEach(module => {
            if (!visited.has(module.name)) {
                visit(module.name);
            }
        });

        return ordered;
    }

    /**
     * Initialize all modules with core services
     */
    private async initializeModules(modules: ModuleDefinition[]): Promise<void> {
        for (const module of modules) {
            try {
                if (module.initialize) {
                    await module.initialize(this.coreServices);
                }

                // Emit module loaded event
                this.eventBus.emit('system.module_loaded', {
                    name: module.name,
                    version: module.version
                });

                console.log(`✅ Initialized module: ${module.name} v${module.version}`);
            } catch (error) {
                console.error(`❌ Failed to initialize module ${module.name}:`, error);

                // Emit module error event
                this.eventBus.emit('system.module_error', {
                    name: module.name,
                    error: (error as Error).message
                });
            }
        }
    }

    /**
     * Set up core system endpoints
     */
    private setupCoreEndpoints(): void {
        // System status endpoint
        this.app.get('/api/system/status', (req, res) => {
            res.json({
                status: 'running',
                initialized: this.initialized,
                modules: this.moduleRegistry.getStatistics(),
                eventBus: this.eventBus.getStatistics(),
                timestamp: new Date().toISOString()
            });
        });

        // Module registry endpoint
        this.app.get('/api/system/modules', (req, res) => {
            res.json({
                modules: this.moduleRegistry.getAll().map((m: ModuleDefinition) => ({
                    name: m.name,
                    version: m.version,
                    displayName: m.displayName,
                    description: m.description,
                    routes: m.routes.length,
                    apis: m.apis.length,
                    permissions: m.permissions
                }))
            });
        });

        // Navigation endpoint for frontend
        this.app.get('/api/system/navigation', (req, res) => {
            res.json({
                items: this.moduleRegistry.getNavigationItems()
            });
        });

        // API documentation endpoint
        this.app.get('/api/system/docs', (req, res) => {
            res.json({
                apis: this.apiGateway.getDocumentation()
            });
        });
    }

    /**
     * Print system summary
     */
    private printSystemSummary(): void {
        const stats = this.moduleRegistry.getStatistics();

        console.log('\n🎯 CORE SYSTEM SUMMARY');
        console.log('========================');
        console.log(`📦 Modules: ${stats.totalModules}`);
        console.log(`🔗 Routes: ${stats.totalRoutes}`);
        console.log(`🚀 APIs: ${stats.totalAPIs}`);
        console.log(`🔐 Permissions: ${stats.totalPermissions}`);
        console.log('\n📋 Loaded Modules:');

        stats.modulesList.forEach((module: any) => {
            console.log(`   ✅ ${module.name} v${module.version} (${module.routes} routes, ${module.apis} APIs)`);
        });

        console.log('\n🚀 System ready for requests!');
        console.log('========================\n');
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        console.log('🛑 Shutting down core system...');

        // Call shutdown on all modules
        const modules = this.moduleRegistry.getAll();
        for (const module of modules) {
            try {
                if (module.shutdown) {
                    await module.shutdown();
                }
            } catch (error) {
                console.error(`❌ Error shutting down module ${module.name}:`, error);
            }
        }

        // Clear event listeners
        this.eventBus.removeAllListeners();

        // Clear registry
        this.moduleRegistry.clear();

        this.initialized = false;
        console.log('✅ Core system shut down complete');
    }
}