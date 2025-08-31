#!/usr/bin/env node

/**
 * PocketBase Setup Script for Python Portal
 * Initializes the PocketBase database with required collections and settings
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@pythonportal.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'AdminPass123!';

console.log('🔧 Setting up PocketBase for Python Portal...');

async function setupPocketBase() {
    try {
        // Wait for PocketBase to be ready
        console.log('⏳ Waiting for PocketBase to be ready...');
        await waitForPocketBase();
        console.log('✅ PocketBase is ready');

        // Check if admin already exists
        const adminExists = await checkAdminExists();

        let authToken = '';
        if (!adminExists) {
            console.log('👤 Creating admin user...');
            authToken = await createAdmin();
            console.log('✅ Admin user created');
        } else {
            console.log('👤 Admin user already exists, authenticating...');
            authToken = await authenticateAdmin();
            console.log('✅ Admin authenticated');
        }

        // Setup collections
        console.log('📚 Setting up collections...');
        await setupCollections(authToken);
        console.log('✅ Collections configured');

        // Configure auth settings
        console.log('🔐 Configuring authentication settings...');
        await configureAuthSettings(authToken);
        console.log('✅ Authentication configured');

        console.log('🎉 PocketBase setup complete!');
        console.log(`📊 Admin Panel: ${POCKETBASE_URL}/_/`);
        console.log(`🔑 Admin Email: ${ADMIN_EMAIL}`);

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

async function waitForPocketBase(maxRetries = 30, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(`${POCKETBASE_URL}/api/health`);
            if (response.ok) return;
        } catch (error) {
            // PocketBase not ready yet
        }

        console.log(`⏳ Waiting for PocketBase... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error('PocketBase did not become ready in time');
}

async function checkAdminExists() {
    try {
        const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identity: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            })
        });

        return response.ok;
    } catch (error) {
        return false;
    }
}

async function createAdmin() {
    const response = await fetch(`${POCKETBASE_URL}/api/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            passwordConfirm: ADMIN_PASSWORD
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create admin: ${error}`);
    }

    // Now authenticate to get token
    return authenticateAdmin();
}

async function authenticateAdmin() {
    const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identity: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to authenticate admin: ${error}`);
    }

    const data = await response.json();
    return data.token;
}

async function setupCollections(authToken) {
    // Users collection (should exist by default, but we'll configure it)
    await configureUsersCollection(authToken);

    // User Progress collection for tracking learning progress
    await createProgressCollection(authToken);

    // User Sessions collection for tracking login sessions
    await createSessionsCollection(authToken);
}

async function configureUsersCollection(authToken) {
    try {
        // Get existing users collection
        const response = await fetch(`${POCKETBASE_URL}/api/collections/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Users collection not found');
        }

        const collection = await response.json();

        // Update collection schema to include our custom fields
        const updatedSchema = [
            ...collection.schema,
            // Add any custom fields we need
            {
                name: 'display_name',
                type: 'text',
                required: false,
                options: { max: 100 }
            },
            {
                name: 'learning_streak',
                type: 'number',
                required: false,
                options: { min: 0 }
            },
            {
                name: 'last_activity',
                type: 'date',
                required: false
            }
        ].filter((field, index, arr) =>
            // Remove duplicates based on field name
            arr.findIndex(f => f.name === field.name) === index
        );

        // Update the collection
        const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/users`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                schema: updatedSchema,
                listRule: '', // Users can list other users
                viewRule: '', // Users can view other profiles
                createRule: '', // Anyone can create account
                updateRule: '@request.auth.id = id', // Users can only update their own profile
                deleteRule: '@request.auth.id = id' // Users can only delete their own account
            })
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.warn('⚠️ Failed to update users collection:', error);
        }
    } catch (error) {
        console.warn('⚠️ Failed to configure users collection:', error);
    }
}

async function createProgressCollection(authToken) {
    const schema = [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'exercise_id', type: 'text', required: true },
        { name: 'completed', type: 'bool', required: true },
        { name: 'completed_at', type: 'date', required: false },
        { name: 'attempts', type: 'number', required: false, options: { min: 0 } },
        { name: 'best_score', type: 'number', required: false, options: { min: 0, max: 100 } },
        { name: 'time_spent', type: 'number', required: false, options: { min: 0 } }, // in seconds
        { name: 'solution_code', type: 'text', required: false }
    ];

    await createCollection(authToken, {
        name: 'user_progress',
        type: 'base',
        schema,
        listRule: '@request.auth.id = user.id',
        viewRule: '@request.auth.id = user.id',
        createRule: '@request.auth.id = user.id',
        updateRule: '@request.auth.id = user.id',
        deleteRule: '@request.auth.id = user.id'
    });
}

async function createSessionsCollection(authToken) {
    const schema = [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'session_start', type: 'date', required: true },
        { name: 'session_end', type: 'date', required: false },
        { name: 'exercises_completed', type: 'number', required: false, options: { min: 0 } },
        { name: 'total_time', type: 'number', required: false, options: { min: 0 } }, // in seconds
        { name: 'ip_address', type: 'text', required: false },
        { name: 'user_agent', type: 'text', required: false }
    ];

    await createCollection(authToken, {
        name: 'user_sessions',
        type: 'base',
        schema,
        listRule: '@request.auth.id = user.id',
        viewRule: '@request.auth.id = user.id',
        createRule: '@request.auth.id = user.id',
        updateRule: '@request.auth.id = user.id',
        deleteRule: '@request.auth.id = user.id'
    });
}

async function createCollection(authToken, collectionData) {
    try {
        // Check if collection already exists
        const checkResponse = await fetch(`${POCKETBASE_URL}/api/collections/${collectionData.name}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (checkResponse.ok) {
            console.log(`📚 Collection '${collectionData.name}' already exists`);
            return;
        }

        // Create the collection
        const response = await fetch(`${POCKETBASE_URL}/api/collections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectionData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create collection '${collectionData.name}': ${error}`);
        }

        console.log(`✅ Created collection '${collectionData.name}'`);
    } catch (error) {
        console.error(`❌ Failed to create collection '${collectionData.name}':`, error);
    }
}

async function configureAuthSettings(authToken) {
    try {
        const settings = {
            emailAuth: {
                enabled: true,
                minPasswordLength: 8,
                onlyEmailDomains: null,
                exceptEmailDomains: null
            },
            googleAuth: {
                enabled: false
            },
            facebookAuth: {
                enabled: false
            },
            githubAuth: {
                enabled: false
            },
            gitlabAuth: {
                enabled: false
            }
        };

        const response = await fetch(`${POCKETBASE_URL}/api/settings`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            const error = await response.text();
            console.warn('⚠️ Failed to configure auth settings:', error);
        }
    } catch (error) {
        console.warn('⚠️ Failed to configure auth settings:', error);
    }
}

// Run setup
setupPocketBase().catch(console.error);