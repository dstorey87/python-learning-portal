/**
 * API Gateway
 * 
 * Manages module API routes and applies middleware
 */

import { Express, Router, Request, Response, NextFunction } from 'express';
import { ModuleDefinition, APIGateway as IAPIGateway } from '../types/ModuleTypes';

export class APIGateway implements IAPIGateway {
    private app: Express;
    private moduleRouters = new Map<string, Router>();
    private registeredRoutes: any[] = [];

    constructor(app: Express) {
        this.app = app;
    }

    /**
     * Register all API routes for a module
     */
    registerModuleRoutes(module: ModuleDefinition): void {
        const router = Router();
        const moduleBasePath = `/api/${module.name}`;

        // Create router for this module
        this.moduleRouters.set(module.name, router);

        // Register each API endpoint
        for (const api of module.apis) {
            const middlewares = this.buildMiddleware(api, module);
            const handler = this.createAPIHandler(api, module);

            // Register route with middleware
            const method = api.method.toLowerCase() as keyof Router;
            (router as any)[method](api.path, ...middlewares, handler);

            // Track registered route
            this.registeredRoutes.push({
                module: module.name,
                method: api.method,
                path: `${moduleBasePath}${api.path}`,
                handler: api.handler,
                permissions: api.permissions,
                requiresAuth: api.requiresAuth
            });

            console.log(`🔗 Registered API: ${api.method} ${moduleBasePath}${api.path}`);
        }

        // Mount module router
        this.app.use(moduleBasePath, router);
        console.log(`🚀 Mounted module API: ${module.name} at ${moduleBasePath}`);
    }

    /**
     * Get all registered routes
     */
    getRoutes(): any[] {
        return [...this.registeredRoutes];
    }

    /**
     * Apply middleware to specific module routes
     */
    applyMiddleware(moduleName: string, middleware: any[]): void {
        const router = this.moduleRouters.get(moduleName);
        if (router) {
            middleware.forEach(mw => router.use(mw));
            console.log(`🔧 Applied middleware to module: ${moduleName}`);
        }
    }

    /**
     * Build middleware stack for an API endpoint
     */
    private buildMiddleware(api: any, module: ModuleDefinition): any[] {
        const middlewares: any[] = [];

        // Add authentication middleware if required
        if (api.requiresAuth !== false && module.name !== 'auth') {
            middlewares.push(this.authenticationMiddleware);
        }

        // Add permission check middleware
        if (api.permissions && api.permissions.length > 0) {
            middlewares.push(this.permissionMiddleware(api.permissions));
        }

        // Add rate limiting if configured
        if (api.rateLimit) {
            middlewares.push(this.rateLimitMiddleware(api.rateLimit));
        }

        // Add request logging
        middlewares.push(this.loggingMiddleware(module.name, api));

        return middlewares;
    }

    /**
     * Create API handler that loads the actual module handler
     */
    private createAPIHandler(api: any, module: ModuleDefinition) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Dynamically load the module handler
                const handlerPath = `${module.path}/src/api/${api.handler}`;
                const handler = await this.loadHandler(handlerPath);

                if (typeof handler !== 'function') {
                    throw new Error(`Handler ${api.handler} is not a function`);
                }

                // Call the handler
                await handler(req, res, next);
            } catch (error) {
                console.error(`❌ Error in ${module.name}.${api.handler}:`, error);
                res.status(500).json({
                    error: 'Internal server error',
                    module: module.name,
                    handler: api.handler
                });
            }
        };
    }

    /**
     * Load handler function from module
     */
    private async loadHandler(handlerPath: string): Promise<Function> {
        try {
            // Clear require cache to allow hot reloading
            delete require.cache[require.resolve(handlerPath)];

            const handlerModule = require(handlerPath);

            // Support both default export and named exports
            return handlerModule.default || handlerModule;
        } catch (error) {
            throw new Error(`Failed to load handler at ${handlerPath}: ${error}`);
        }
    }

    /**
     * Authentication middleware
     */
    private authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
        // Basic auth check - will be enhanced with actual auth service
        const authHeader = req.headers.authorization;

        if (!authHeader && !(req as any).session?.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Add user info to request
        req.user = (req as any).session?.user || { id: 'guest', tier: 'free' };
        next();
    };

    /**
     * Permission checking middleware
     */
    private permissionMiddleware = (requiredPermissions: string[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
            // Basic permission check - will be enhanced with business service
            const userPermissions = req.user?.permissions || [];

            const hasPermission = requiredPermissions.every(permission =>
                userPermissions.includes(permission) || userPermissions.includes('*')
            );

            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: requiredPermissions,
                    user: userPermissions
                });
            }

            next();
        };
    };

    /**
     * Rate limiting middleware
     */
    private rateLimitMiddleware = (config: any) => {
        const requests = new Map<string, { count: number; resetTime: number }>();

        return (req: Request, res: Response, next: NextFunction) => {
            const key = req.ip || 'unknown';
            const now = Date.now();
            const windowStart = now - config.windowMs;

            let requestInfo = requests.get(key);

            if (!requestInfo || requestInfo.resetTime < windowStart) {
                requestInfo = { count: 0, resetTime: now + config.windowMs };
            }

            requestInfo.count++;
            requests.set(key, requestInfo);

            if (requestInfo.count > config.maxRequests) {
                return res.status(429).json({
                    error: config.message || 'Too many requests',
                    retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000)
                });
            }

            next();
        };
    };

    /**
     * Request logging middleware
     */
    private loggingMiddleware = (moduleName: string, api: any) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const start = Date.now();

            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`📊 ${moduleName}: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });

            next();
        };
    };

    /**
     * Get module API documentation
     */
    getDocumentation() {
        const docs: any = {};

        for (const route of this.registeredRoutes) {
            if (!docs[route.module]) {
                docs[route.module] = [];
            }

            docs[route.module].push({
                method: route.method,
                path: route.path,
                handler: route.handler,
                permissions: route.permissions,
                requiresAuth: route.requiresAuth
            });
        }

        return docs;
    }
}

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                tier: string;
                permissions?: string[];
            };
        }
    }
}