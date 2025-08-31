/**
 * Module Registry
 * 
 * Manages all registered modules and their metadata
 */

import { ModuleDefinition, ModuleRegistry as IModuleRegistry } from '../types/ModuleTypes';

export class ModuleRegistry implements IModuleRegistry {
    public readonly modules = new Map<string, ModuleDefinition>();

    /**
     * Register a new module
     */
    register(module: ModuleDefinition): void {
        if (this.modules.has(module.name)) {
            throw new Error(`Module ${module.name} is already registered`);
        }

        this.modules.set(module.name, module);
        console.log(`📝 Registered module: ${module.name} v${module.version}`);
    }

    /**
     * Get module by name
     */
    get(name: string): ModuleDefinition | undefined {
        return this.modules.get(name);
    }

    /**
     * Get all registered modules
     */
    getAll(): ModuleDefinition[] {
        return Array.from(this.modules.values());
    }

    /**
     * Get modules ordered by dependencies
     */
    getByDependencyOrder(): ModuleDefinition[] {
        const modules = this.getAll();
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const ordered: ModuleDefinition[] = [];

        const visit = (moduleName: string) => {
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected: ${moduleName}`);
            }

            if (visited.has(moduleName)) {
                return;
            }

            const module = this.modules.get(moduleName);
            if (!module) {
                throw new Error(`Module not found: ${moduleName}`);
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
     * Get all routes from all modules
     */
    getAllRoutes() {
        const routes: any[] = [];

        for (const module of this.modules.values()) {
            for (const route of module.routes) {
                routes.push({
                    ...route,
                    moduleName: module.name,
                    moduleDisplayName: module.displayName
                });
            }
        }

        // Sort by navigation order
        return routes.sort((a, b) => {
            const orderA = a.navOrder || 999;
            const orderB = b.navOrder || 999;
            return orderA - orderB;
        });
    }

    /**
     * Get all API endpoints from all modules
     */
    getAllAPIs() {
        const apis: any[] = [];

        for (const module of this.modules.values()) {
            for (const api of module.apis) {
                apis.push({
                    ...api,
                    moduleName: module.name,
                    fullPath: `/api/${module.name}${api.path}`
                });
            }
        }

        return apis;
    }

    /**
     * Get all permissions from all modules
     */
    getAllPermissions(): string[] {
        const permissions = new Set<string>();

        for (const module of this.modules.values()) {
            for (const permission of module.permissions) {
                permissions.add(permission);
            }
        }

        return Array.from(permissions);
    }

    /**
     * Get modules that provide specific permissions
     */
    getModulesByPermission(permission: string): ModuleDefinition[] {
        return this.getAll().filter(module =>
            module.permissions.includes(permission)
        );
    }

    /**
     * Get navigation items from modules
     */
    getNavigationItems() {
        const navItems: any[] = [];

        for (const module of this.modules.values()) {
            for (const route of module.routes) {
                if (route.showInNav !== false) { // Default to showing in nav
                    navItems.push({
                        path: route.path,
                        title: route.title,
                        icon: route.icon,
                        moduleName: module.name,
                        moduleDisplayName: module.displayName,
                        order: route.navOrder || 999,
                        requiresAuth: route.requiresAuth,
                        permissions: route.permissions
                    });
                }
            }
        }

        return navItems.sort((a, b) => a.order - b.order);
    }

    /**
     * Get module statistics
     */
    getStatistics() {
        const modules = this.getAll();

        return {
            totalModules: modules.length,
            totalRoutes: modules.reduce((sum, mod) => sum + mod.routes.length, 0),
            totalAPIs: modules.reduce((sum, mod) => sum + mod.apis.length, 0),
            totalPermissions: this.getAllPermissions().length,
            modulesList: modules.map(mod => ({
                name: mod.name,
                version: mod.version,
                routes: mod.routes.length,
                apis: mod.apis.length,
                permissions: mod.permissions.length
            }))
        };
    }

    /**
     * Clear all registered modules
     */
    clear(): void {
        this.modules.clear();
    }

    /**
     * Unregister a specific module
     */
    unregister(name: string): boolean {
        const result = this.modules.delete(name);
        if (result) {
            console.log(`🗑️ Unregistered module: ${name}`);
        }
        return result;
    }
}