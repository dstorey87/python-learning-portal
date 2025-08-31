/**
 * Module Template Generator
 * 
 * Creates scaffolding for new modules
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ModuleTemplateConfig {
    name: string;
    displayName: string;
    description: string;
    hasBackend?: boolean;
    hasFrontend?: boolean;
    hasDatabase?: boolean;
    permissions?: string[];
    dependencies?: string[];
}

export class ModuleTemplateGenerator {
    private templatesPath: string;

    constructor(templatesPath?: string) {
        this.templatesPath = templatesPath || path.join(__dirname, 'templates');
    }

    /**
     * Generate a new module from template
     */
    async generateModule(config: ModuleTemplateConfig, outputPath: string): Promise<void> {
        const modulePath = path.join(outputPath, config.name);

        // Create module directory structure
        await this.createDirectoryStructure(modulePath, config);

        // Generate module configuration
        await this.generateModuleConfig(modulePath, config);

        // Generate package.json
        await this.generatePackageJson(modulePath, config);

        // Generate TypeScript config
        await this.generateTsConfig(modulePath);

        // Generate backend files if needed
        if (config.hasBackend) {
            await this.generateBackendFiles(modulePath, config);
        }

        // Generate frontend files if needed
        if (config.hasFrontend) {
            await this.generateFrontendFiles(modulePath, config);
        }

        // Generate database files if needed
        if (config.hasDatabase) {
            await this.generateDatabaseFiles(modulePath, config);
        }

        console.log(`✅ Generated module: ${config.name} at ${modulePath}`);
    }

    /**
     * Create directory structure for module
     */
    private async createDirectoryStructure(modulePath: string, config: ModuleTemplateConfig): Promise<void> {
        const directories = [
            'src',
            'tests',
            'docs'
        ];

        if (config.hasBackend) {
            directories.push('src/api', 'src/services', 'src/middleware');
        }

        if (config.hasFrontend) {
            directories.push('src/components', 'src/hooks', 'src/utils');
        }

        if (config.hasDatabase) {
            directories.push('src/database', 'src/database/migrations', 'src/database/seeds');
        }

        for (const dir of directories) {
            const fullPath = path.join(modulePath, dir);
            await fs.promises.mkdir(fullPath, { recursive: true });
        }
    }

    /**
     * Generate module.config.js file
     */
    private async generateModuleConfig(modulePath: string, config: ModuleTemplateConfig): Promise<void> {
        const moduleConfig = `/**
 * ${config.displayName} Module Configuration
 * 
 * ${config.description}
 */

module.exports = {
  name: '${config.name}',
  displayName: '${config.displayName}',
  description: '${config.description}',
  
  // Frontend routes this module provides
  routes: [
    {
      path: '/${config.name}',
      component: '${config.name}Page',
      title: '${config.displayName}',
      icon: 'default-icon',
      showInNav: true,
      navOrder: 10,
      requiresAuth: false,
      permissions: []
    }
  ],

  // Backend API endpoints this module provides
  apis: [
    {
      method: 'GET',
      path: '/',
      handler: 'list${config.displayName.replace(/\s/g, '')}',
      permissions: ${JSON.stringify(config.permissions || [])},
      requiresAuth: false
    }
  ],

  // Permissions this module defines
  permissions: ${JSON.stringify(config.permissions || [])},

  // Module dependencies
  dependencies: ${JSON.stringify(config.dependencies || [])},

  // Database configuration
  ${config.hasDatabase ? `database: {
    tables: [
      {
        name: '${config.name}_items',
        columns: [
          { name: 'id', type: 'INTEGER', primary: true },
          { name: 'name', type: 'VARCHAR(255)', nullable: false },
          { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
        ]
      }
    ]
  },` : '// database: null,'}

  // Paywall configuration (optional)
  paywall: {
    freeTier: {
      maxUsage: 5,
      features: ['basic_access']
    },
    premiumFeatures: ['advanced_features', 'unlimited_access']
  },

  // Module initialization function
  async initialize(coreServices) {
    console.log('🚀 Initializing ${config.displayName} module...');
    
    // Initialize module services here
    // Access core services: coreServices.database, coreServices.eventBus, etc.
    
    // Set up event listeners
    coreServices.eventBus.on('user.logged_in', (data) => {
      console.log('${config.displayName}: User logged in', data);
    });
    
    console.log('✅ ${config.displayName} module initialized');
  },

  // Module shutdown function
  async shutdown() {
    console.log('🛑 Shutting down ${config.displayName} module...');
    // Clean up resources here
  }
};
`;

        const configPath = path.join(modulePath, 'module.config.js');
        await fs.promises.writeFile(configPath, moduleConfig);
    }

    /**
     * Generate package.json
     */
    private async generatePackageJson(modulePath: string, config: ModuleTemplateConfig): Promise<void> {
        const packageJson = {
            name: `@portal/${config.name}`,
            version: '1.0.0',
            description: config.description,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: {
                build: 'tsc',
                'build:watch': 'tsc --watch',
                dev: 'tsc --watch',
                'type-check': 'tsc --noEmit',
                test: 'jest',
                'test:watch': 'jest --watch',
                lint: 'eslint src/**/*.ts',
                'lint:fix': 'eslint src/**/*.ts --fix'
            },
            dependencies: {
                ...(config.hasBackend ? {
                    express: '^4.18.0',
                    '@portal/core': 'workspace:*'
                } : {}),
                ...(config.hasFrontend ? {
                    react: '^18.0.0',
                    '@portal/core': 'workspace:*'
                } : {})
            },
            devDependencies: {
                '@types/node': '^20.0.0',
                typescript: '^5.0.0',
                jest: '^29.0.0',
                '@types/jest': '^29.0.0',
                eslint: '^8.0.0',
                '@typescript-eslint/eslint-plugin': '^6.0.0',
                '@typescript-eslint/parser': '^6.0.0'
            },
            keywords: [
                'module',
                config.name,
                'python-learning-portal'
            ],
            author: 'Python Learning Portal Team',
            license: 'MIT'
        };

        const packagePath = path.join(modulePath, 'package.json');
        await fs.promises.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
    }

    /**
     * Generate tsconfig.json
     */
    private async generateTsConfig(modulePath: string): Promise<void> {
        const tsConfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'CommonJS',
                lib: ['ES2020'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true,
                moduleResolution: 'node',
                allowSyntheticDefaultImports: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist', '**/*.test.ts']
        };

        const tsConfigPath = path.join(modulePath, 'tsconfig.json');
        await fs.promises.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    }

    /**
     * Generate backend API files
     */
    private async generateBackendFiles(modulePath: string, config: ModuleTemplateConfig): Promise<void> {
        // Generate API handler
        const handlerName = `list${config.displayName.replace(/\s/g, '')}`;
        const apiHandler = `/**
 * ${config.displayName} API Handlers
 */

import { Request, Response } from 'express';

export const ${handlerName} = async (req: Request, res: Response) => {
  try {
    // TODO: Implement ${config.displayName} listing logic
    res.json({
      message: 'Welcome to ${config.displayName} module',
      data: [],
      module: '${config.name}'
    });
  } catch (error) {
    console.error('Error in ${handlerName}:', error);
    res.status(500).json({
      error: 'Internal server error',
      module: '${config.name}'
    });
  }
};
`;

        const apiPath = path.join(modulePath, `src/api/${handlerName}.ts`);
        await fs.promises.writeFile(apiPath, apiHandler);

        // Generate service file
        const service = `/**
 * ${config.displayName} Service
 */

export class ${config.displayName.replace(/\s/g, '')}Service {
  constructor() {
    // Initialize service
  }

  async getData() {
    // TODO: Implement data retrieval
    return [];
  }

  async createItem(data: any) {
    // TODO: Implement item creation
    return data;
  }

  async updateItem(id: string, data: any) {
    // TODO: Implement item update
    return data;
  }

  async deleteItem(id: string) {
    // TODO: Implement item deletion
    return true;
  }
}
`;

        const servicePath = path.join(modulePath, `src/services/${config.displayName.replace(/\s/g, '')}Service.ts`);
        await fs.promises.writeFile(servicePath, service);
    }

    /**
     * Generate frontend component files
     */
    private async generateFrontendFiles(modulePath: string, config: ModuleTemplateConfig): Promise<void> {
        const component = `/**
 * ${config.displayName} Main Component
 */

import React from 'react';

interface ${config.displayName.replace(/\s/g, '')}PageProps {
  // Define props here
}

export const ${config.name}Page: React.FC<${config.displayName.replace(/\s/g, '')}PageProps> = () => {
  return (
    <div className="module-page">
      <div className="module-header">
        <h1>${config.displayName}</h1>
        <p>${config.description}</p>
      </div>

      <div className="module-content">
        <p>Welcome to the ${config.displayName} module!</p>
        
        {/* TODO: Implement module functionality */}
      </div>
    </div>
  );
};

export default ${config.name}Page;
`;

        const componentPath = path.join(modulePath, `src/components/${config.name}Page.tsx`);
        await fs.promises.writeFile(componentPath, component);
    }

    /**
     * Generate database migration files
     */
    private async generateDatabaseFiles(modulePath: string, config: ModuleTemplateConfig): Promise<void> {
        const migration = `/**
 * ${config.displayName} Database Migration
 */

export const up = \`
  CREATE TABLE IF NOT EXISTS ${config.name}_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
\`;

export const down = \`
  DROP TABLE IF EXISTS ${config.name}_items;
\`;
`;

        const migrationPath = path.join(modulePath, 'src/database/migrations/001_initial.ts');
        await fs.promises.writeFile(migrationPath, migration);

        const seeds = `/**
 * ${config.displayName} Database Seeds
 */

export const seedData = [
  {
    name: 'Sample Item 1',
    description: 'This is a sample item for ${config.displayName}'
  },
  {
    name: 'Sample Item 2', 
    description: 'This is another sample item for ${config.displayName}'
  }
];
`;

        const seedsPath = path.join(modulePath, 'src/database/seeds/initial.ts');
        await fs.promises.writeFile(seedsPath, seeds);
    }
}

/**
 * CLI function to generate a new module
 */
export async function generateNewModule() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    };

    try {
        console.log('🏗️  Module Template Generator');
        console.log('============================\n');

        const name = await question('Module name (e.g., "analytics"): ');
        const displayName = await question('Display name (e.g., "Analytics Dashboard"): ');
        const description = await question('Description: ');
        const hasBackend = (await question('Include backend APIs? (y/n): ')).toLowerCase() === 'y';
        const hasFrontend = (await question('Include frontend components? (y/n): ')).toLowerCase() === 'y';
        const hasDatabase = (await question('Include database schema? (y/n): ')).toLowerCase() === 'y';

        const config: ModuleTemplateConfig = {
            name,
            displayName,
            description,
            hasBackend,
            hasFrontend,
            hasDatabase,
            permissions: [`view_${name}`, `manage_${name}`]
        };

        const generator = new ModuleTemplateGenerator();
        await generator.generateModule(config, './modules');

        console.log('\n✅ Module generated successfully!');
        console.log('\nNext steps:');
        console.log(`1. cd modules/${name}`);
        console.log('2. npm install');
        console.log('3. npm run build');
        console.log('4. Implement your module logic');
        console.log('5. Restart the main application to load the module');

    } catch (error) {
        console.error('❌ Error generating module:', error);
    } finally {
        rl.close();
    }
}

// Run generator if called directly
if (require.main === module) {
    generateNewModule();
}