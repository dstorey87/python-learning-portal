const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
// require('dotenv').config({ path: '.env.auth' });

async function setupPocketBase() {
    console.log('🔗 Connecting to PocketBase...');

    const pb = new PocketBase('http://localhost:8090');

    // Wait for PocketBase to be ready
    let retries = 30;
    while (retries > 0) {
        try {
            await pb.health.check();
            break;
        } catch (error) {
            console.log(`Waiting for PocketBase... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
        }
    }

    if (retries === 0) {
        console.error('❌ PocketBase not ready after 60 seconds');
        process.exit(1);
    }

    console.log('✅ PocketBase is ready');

    // Authenticate with existing admin
    console.log('🔐 Authenticating with admin...');
    const adminEmail = 'admin@portal.com';
    const adminPassword = 'AdminPass123';
    console.log('Debug - Email:', adminEmail);
    console.log('Debug - Password length:', adminPassword?.length);
    try {
        await pb.admins.authWithPassword(adminEmail, adminPassword);
        console.log('✅ Admin authentication successful');
    } catch (error) {
        console.error('❌ Admin authentication failed. Error details:', {
            url: error.url,
            status: error.status,
            message: error.message,
            response: error.response
        });

        // Try alternative authentication method for older PocketBase versions
        try {
            const authData = await pb.send('/api/admins/auth-with-password', {
                method: 'POST',
                body: {
                    identity: adminEmail,
                    password: adminPassword,
                },
            });

            if (authData && authData.token) {
                pb.authStore.save(authData.token, authData.admin);
                console.log('✅ Admin authentication successful (alternative method)');
            }
        } catch (altError) {
            console.error('❌ Alternative authentication also failed:', altError);
            process.exit(1);
        }
    }

    // Create collections (skip if they exist)
    console.log('🗄️ Checking database collections...');
    await checkCollections(pb);

    // Create sample data
    await createSampleData(pb);

    console.log('🎉 PocketBase setup complete!');
    console.log('');
    console.log('📊 Access Points:');
    console.log(`   Admin UI: ${process.env.POCKETBASE_URL}/_/`);
    console.log(`   Email: ${process.env.POCKETBASE_ADMIN_EMAIL}`);
    console.log(`   Password: ${process.env.POCKETBASE_ADMIN_PASSWORD}`);
    console.log('');
}

async function checkCollections(pb) {
    console.log('🔍 Checking existing collections...');

    try {
        const collections = await pb.collections.getList();
        const collectionNames = collections.items.map(c => c.name);

        const requiredCollections = ['user_profiles', 'usage_tracking', 'feature_flags'];
        const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));

        if (missingCollections.length > 0) {
            console.log(`❌ Missing collections: ${missingCollections.join(', ')}`);
            console.log('ℹ️ Please create them manually in the admin UI first.');
            process.exit(1);
        } else {
            console.log('✅ All required collections exist');
        }
    } catch (error) {
        console.error('❌ Failed to check collections:', error);
        throw error;
    }
}

async function createCollections(pb) {
    console.log('🗄️ Setting up database collections...');

    // User profiles collection
    await createCollection(pb, {
        name: 'user_profiles',
        type: 'base',
        schema: [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'subscription_tier',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['free', 'premium', 'enterprise']
                }
            },
            {
                name: 'tier_expires_at',
                type: 'date',
                required: false
            },
            {
                name: 'preferences',
                type: 'json',
                required: false
            }
        ]
    });

    // Usage tracking collection
    await createCollection(pb, {
        name: 'usage_tracking',
        type: 'base',
        schema: [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    minSelect: 1,
                    maxSelect: 1
                }
            },
            {
                name: 'date',
                type: 'date',
                required: true
            },
            {
                name: 'type',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['exercisesPerDay', 'apiCallsPerMonth', 'storageGB', 'codeExecutions']
                }
            },
            {
                name: 'count',
                type: 'number',
                required: true,
                options: {
                    min: 0
                }
            }
        ]
    });

    // Feature flags collection
    await createCollection(pb, {
        name: 'feature_flags',
        type: 'base',
        schema: [
            {
                name: 'name',
                type: 'text',
                required: true
            },
            {
                name: 'enabled',
                type: 'bool',
                required: true
            },
            {
                name: 'required_tier',
                type: 'select',
                required: false,
                options: {
                    maxSelect: 1,
                    values: ['free', 'premium', 'enterprise']
                }
            },
            {
                name: 'config',
                type: 'json',
                required: false
            },
            {
                name: 'updated_at',
                type: 'date',
                required: true
            }
        ]
    });

    console.log('✅ All collections created successfully');
}

async function createCollection(pb, config) {
    try {
        await pb.collections.create(config);
        console.log(`✅ Created collection: ${config.name}`);
    } catch (error) {
        if (error.status === 400 && error.response?.message?.includes('already exists')) {
            console.log(`ℹ️ Collection already exists: ${config.name}`);
        } else {
            console.error(`❌ Failed to create collection ${config.name}:`, error);
            throw error;
        }
    }
}

async function createSampleData(pb) {
    console.log('📊 Creating sample feature flags...');

    const featureFlags = [
        {
            name: 'basic_exercises',
            enabled: true,
            required_tier: 'free',
            config: { limit: 5 }
        },
        {
            name: 'advanced_exercises',
            enabled: true,
            required_tier: 'premium',
            config: { limit: -1 }
        },
        {
            name: 'detailed_analytics',
            enabled: true,
            required_tier: 'premium',
            config: { retention_days: 365 }
        },
        {
            name: 'api_access',
            enabled: true,
            required_tier: 'enterprise',
            config: { rate_limit: 1000 }
        }
    ];

    for (const flag of featureFlags) {
        try {
            const existing = await pb.collection('feature_flags').getFirstListItem(`name="${flag.name}"`);
            console.log(`ℹ️ Feature flag already exists: ${flag.name}`);
        } catch {
            try {
                await pb.collection('feature_flags').create({
                    ...flag,
                    updated_at: new Date().toISOString()
                });
                console.log(`✅ Created feature flag: ${flag.name}`);
            } catch (error) {
                console.error(`❌ Failed to create feature flag ${flag.name}:`, error);
            }
        }
    }

    console.log('✅ Sample data created successfully');
}

setupPocketBase().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
});
