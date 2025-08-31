/**
 * Core Module System Type Definitions
 * 
 * These types define how modules integrate with the core system
 */

export interface ModuleDefinition {
    /** Module identifier */
    name: string;

    /** Module version */
    version: string;

    /** Module display name */
    displayName: string;

    /** Module description */
    description: string;

    /** Module file system path */
    path?: string;

    /** Frontend routes this module provides */
    routes: RouteDefinition[];

    /** Backend API endpoints this module provides */
    apis: APIDefinition[];

    /** Database schemas this module needs */
    database?: DatabaseDefinition;

    /** Permissions this module requires */
    permissions: string[];

    /** Paywall configuration for this module */
    paywall?: PaywallDefinition;

    /** Module dependencies */
    dependencies?: string[];

    /** Module initialization function */
    initialize?: (coreServices: CoreServices) => Promise<void>;

    /** Module shutdown function */
    shutdown?: () => Promise<void>;
}

export interface RouteDefinition {
    /** Route path (e.g., '/exercises', '/exercises/:id') */
    path: string;

    /** React component to render */
    component: string;

    /** Route title for navigation */
    title: string;

    /** Route icon for navigation */
    icon?: string;

    /** Whether route requires authentication */
    requiresAuth?: boolean;

    /** Required permissions for this route */
    permissions?: string[];

    /** Whether this route should appear in navigation */
    showInNav?: boolean;

    /** Navigation order (lower numbers appear first) */
    navOrder?: number;
}

export interface APIDefinition {
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

    /** API endpoint path */
    path: string;

    /** Handler function name */
    handler: string;

    /** Required permissions for this endpoint */
    permissions?: string[];

    /** Rate limiting configuration */
    rateLimit?: RateLimitConfig;

    /** Whether this endpoint requires authentication */
    requiresAuth?: boolean;
}

export interface DatabaseDefinition {
    /** Database tables this module needs */
    tables: TableDefinition[];

    /** Database migrations */
    migrations?: MigrationDefinition[];

    /** Database seeds/fixtures */
    seeds?: SeedDefinition[];
}

export interface TableDefinition {
    name: string;
    columns: ColumnDefinition[];
    indexes?: IndexDefinition[];
}

export interface ColumnDefinition {
    name: string;
    type: string;
    nullable?: boolean;
    default?: any;
    primary?: boolean;
    unique?: boolean;
}

export interface IndexDefinition {
    name: string;
    columns: string[];
    unique?: boolean;
}

export interface MigrationDefinition {
    version: string;
    description: string;
    up: string;
    down: string;
}

export interface SeedDefinition {
    table: string;
    data: Record<string, any>[];
}

export interface PaywallDefinition {
    /** Free tier limitations */
    freeTier: {
        /** Maximum free usage (e.g., 5 exercises) */
        maxUsage?: number;

        /** Features available in free tier */
        features: string[];
    };

    /** Premium features this module provides */
    premiumFeatures: string[];

    /** Custom paywall messages */
    messages?: {
        limitReached?: string;
        upgradePrompt?: string;
        premiumFeaturePrompt?: string;
    };
}

export interface RateLimitConfig {
    /** Maximum requests per window */
    maxRequests: number;

    /** Time window in milliseconds */
    windowMs: number;

    /** Custom rate limit message */
    message?: string;
}

export interface CoreServices {
    /** Database connection */
    database: any;

    /** Authentication service */
    auth: any;

    /** Event bus for inter-module communication */
    eventBus: EventBus;

    /** Logger service */
    logger: any;

    /** Business logic service */
    business: any;
}

export interface EventBus {
    /** Emit an event to other modules */
    emit(event: string, data: any): void;

    /** Listen for events from other modules */
    on(event: string, handler: (data: any) => void): void;

    /** Remove event listener */
    off(event: string, handler: (data: any) => void): void;
}

export interface ModuleRegistry {
    /** All registered modules */
    modules: Map<string, ModuleDefinition>;

    /** Register a new module */
    register(module: ModuleDefinition): void;

    /** Get module by name */
    get(name: string): ModuleDefinition | undefined;

    /** Get all modules */
    getAll(): ModuleDefinition[];

    /** Get modules by dependency order */
    getByDependencyOrder(): ModuleDefinition[];
}

export interface ModuleLoader {
    /** Load all modules from directory */
    loadModules(directory: string): Promise<ModuleDefinition[]>;

    /** Load single module */
    loadModule(path: string): Promise<ModuleDefinition>;

    /** Initialize loaded modules */
    initializeModules(modules: ModuleDefinition[]): Promise<void>;
}

export interface APIGateway {
    /** Register module API routes */
    registerModuleRoutes(module: ModuleDefinition): void;

    /** Get all registered routes */
    getRoutes(): any[];

    /** Apply middleware to module routes */
    applyMiddleware(moduleName: string, middleware: any[]): void;
}