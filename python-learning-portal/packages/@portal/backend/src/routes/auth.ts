import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// Type definitions for PocketBase responses
interface PocketBaseUser {
    id: string;
    email: string;
    name: string;
    created: string;
    updated: string;
    verified: boolean;
    password?: string;
    passwordConfirm?: string;
}

interface PocketBaseAuthResponse {
    token: string;
    record: PocketBaseUser;
}

interface PocketBaseError {
    code: number;
    message: string;
    data?: Record<string, any>;
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 auth requests per windowMs (login attempts, etc.)
    message: 'Too many authentication attempts, please try again later.',
    skip: (req: Request) => req.path === '/health' // Skip rate limiting for health checks
});

// Apply rate limiting to all auth routes
router.use(authLimiter);

// PocketBase client configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'authentication',
        pocketbase_url: POCKETBASE_URL,
        version: '1.0.0'
    });
});

// Authentication endpoints proxy to PocketBase
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, passwordConfirm, name } = req.body;

        // Validate required fields
        if (!email || !password || !passwordConfirm || !name) {
            res.status(400).json({
                error: 'Missing required fields: email, password, passwordConfirm, name'
            });
            return;
        }

        if (password !== passwordConfirm) {
            res.status(400).json({
                error: 'Passwords do not match'
            });
            return;
        }

        // Forward to PocketBase
        const response = await fetch(`${POCKETBASE_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                passwordConfirm,
                name,
                emailVisibility: false
            }),
        });

        const data = await response.json() as PocketBaseUser;

        if (!response.ok) {
            res.status(response.status).json(data);
            return;
        }

        // Return user data without password
        const { password: _, passwordConfirm: __, ...userData } = data;
        res.status(201).json({
            success: true,
            user: userData,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Internal server error'
        });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            res.status(400).json({
                error: 'Missing required fields: email, password'
            });
            return;
        }

        // Forward to PocketBase
        const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identity: email,
                password: password
            }),
        });

        const data = await response.json() as PocketBaseAuthResponse;

        if (!response.ok) {
            res.status(response.status).json(data);
            return;
        }

        // Return auth data
        res.json({
            success: true,
            user: data.record,
            token: data.token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Internal server error'
        });
    }
});

router.post('/logout', (req: Request, res: Response): void => {
    // Since we're using token-based auth, logout is handled client-side
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Get current user profile
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Missing or invalid authorization header'
            });
            return;
        }

        const token = authHeader.substring(7);

        // Verify token with PocketBase
        const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            res.status(401).json({
                error: 'Invalid or expired token'
            });
            return;
        }

        const data = await response.json() as PocketBaseAuthResponse;

        res.json({
            success: true,
            user: data.record
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user profile',
            message: 'Internal server error'
        });
    }
});

// Update user profile
router.put('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Missing or invalid authorization header'
            });
            return;
        }

        const token = authHeader.substring(7);
        const { name, email } = req.body;

        if (!name && !email) {
            res.status(400).json({
                error: 'At least one field (name, email) is required'
            });
            return;
        }

        // First get current user to get their ID
        const userResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!userResponse.ok) {
            res.status(401).json({
                error: 'Invalid or expired token'
            });
            return;
        }

        const userData = await userResponse.json() as PocketBaseAuthResponse;
        const userId = userData.record.id;

        // Update user record
        const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/records/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email }),
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            res.status(updateResponse.status).json(errorData);
            return;
        }

        const updatedData = await updateResponse.json() as PocketBaseUser;

        res.json({
            success: true,
            user: updatedData,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: 'Internal server error'
        });
    }
});

// Change password
router.post('/change-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Missing or invalid authorization header'
            });
            return;
        }

        const token = authHeader.substring(7);
        const { oldPassword, password, passwordConfirm } = req.body;

        if (!oldPassword || !password || !passwordConfirm) {
            res.status(400).json({
                error: 'Missing required fields: oldPassword, password, passwordConfirm'
            });
            return;
        }

        if (password !== passwordConfirm) {
            res.status(400).json({
                error: 'New passwords do not match'
            });
            return;
        }

        // First get current user to get their ID
        const userResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!userResponse.ok) {
            res.status(401).json({
                error: 'Invalid or expired token'
            });
            return;
        }

        const userData = await userResponse.json() as PocketBaseAuthResponse;
        const userId = userData.record.id;

        // Update password
        const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/records/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                oldPassword,
                password,
                passwordConfirm
            }),
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            res.status(updateResponse.status).json(errorData);
            return;
        }

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Failed to change password',
            message: 'Internal server error'
        });
    }
});

// Request password reset
router.post('/request-password-reset', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({
                error: 'Email is required'
            });
            return;
        }

        // Forward to PocketBase
        const response = await fetch(`${POCKETBASE_URL}/api/collections/users/request-password-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            res.status(response.status).json(errorData);
            return;
        }

        res.json({
            success: true,
            message: 'Password reset email sent if the email exists'
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            error: 'Failed to request password reset',
            message: 'Internal server error'
        });
    }
});

export { router as authRoutes };