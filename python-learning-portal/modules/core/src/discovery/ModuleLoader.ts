/**
 * Module Discovery System
 * 
 * Automatically discovers and loads modules from the modules directory
 */

import * as fs from 'fs';
import * as path from 'path';
import { ModuleDefinition, ModuleLoader } from '../types/ModuleTypes';

export class CoreModuleLoader implements ModuleLoader {
    private modulesPath: string;

    constructor(modulesPath: string) {
        this.modulesPath = modulesPath;
    }

    /**
     * Discover and load all modules from the modules directory
     */
    async loadModules(directory: string = this.modulesPath): Promise<ModuleDefinition[]> {
        const modules: ModuleDefinition[] = [];

        try {
            const moduleDirectories = await this.findModuleDirectories(directory);

            for (const moduleDir of moduleDirectories) {
                try {
                    const module = await this.loadModule(moduleDir);
                    modules.push(module);
                    console.log(`✅ Loaded module: ${module.name} v${module.version}`);
                } catch (error) {
                    console.error(`❌ Failed to load module at ${moduleDir}:`, error);
                }
            }

            return this.orderModulesByDependencies(modules);
        } catch (error) {
            console.error('Error discovering modules:', error);
            return [];
        }
    }

    /**
     * Load a single module from its directory
     */
    async loadModule(modulePath: string): Promise<ModuleDefinition> {
        const configPath = path.join(modulePath, 'module.config.js');
        const packagePath = path.join(modulePath, 'package.json');

        if (!fs.existsSync(configPath)) {
            throw new Error(`Module config not found at ${configPath}`);
        }

        if (!fs.existsSync(packagePath)) {
            throw new Error(`Package.json not found at ${packagePath}`);
        }

        // Load module configuration
        const moduleConfig = require(configPath);

        // Load package.json for version info
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Validate module definition
        this.validateModuleDefinition(moduleConfig);

        return {
            ...moduleConfig,
            version: packageJson.version,
            path: modulePath
        } as ModuleDefinition;
    }

    /**
     * Initialize all loaded modules in dependency order
     */
    async initializeModules(modules: ModuleDefinition[]): Promise<void> {
        const orderedModules = this.orderModulesByDependencies(modules);

        for (const module of orderedModules) {
            try {
                if (module.initialize) {
                    // Core services will be properly injected by the main core system
                    const coreServices = {
                        database: {} as any,
                        auth: {} as any,
                        eventBus: {} as any,
                        logger: {} as any,
                        business: {} as any
                    };
                    await module.initialize(coreServices);
                }
                console.log(`🚀 Initialized module: ${module.name}`);
            } catch (error) {
                console.error(`❌ Failed to initialize module ${module.name}:`, error);
            }
        }
    }

    /**
     * Find all directories that contain modules
     */
    private async findModuleDirectories(directory: string): Promise<string[]> {
        const moduleDirectories: string[] = [];

        if (!fs.existsSync(directory)) {
            return moduleDirectories;
        }

        const entries = fs.readdirSync(directory, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== 'core') {
                const moduleDir = path.join(directory, entry.name);
                const configPath = path.join(moduleDir, 'module.config.js');

                if (fs.existsSync(configPath)) {
                    moduleDirectories.push(moduleDir);
                }
            }
        }

        return moduleDirectories;
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

        /**
         * Depth-first search for dependency resolution
         */
        const visit = (moduleName: string) => {
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected involving module: ${moduleName}`);
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
     * Validate module definition structure
     */
    private validateModuleDefinition(config: any): void {
        const required = ['name', 'displayName', 'description', 'routes', 'apis', 'permissions'];

        for (const field of required) {
            if (!config[field]) {
                throw new Error(`Module config missing required field: ${field}`);
            }
        }

        if (!Array.isArray(config.routes)) {
            throw new Error('Module routes must be an array');
        }

        if (!Array.isArray(config.apis)) {
            throw new Error('Module apis must be an array');
        }

        if (!Array.isArray(config.permissions)) {
            throw new Error('Module permissions must be an array');
        }
    }
}