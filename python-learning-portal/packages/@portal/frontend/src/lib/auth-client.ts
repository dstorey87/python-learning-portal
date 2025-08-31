/**
 * Authentication Client for Python Portal
 * Handles all authentication operations with PocketBase backend
 */

interface User {
    id: string;
    email: string;
    name: string;
    display_name?: string;
    learning_streak?: number;
    last_activity?: string;
    created: string;
    updated: string;
    verified: boolean;
}

interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
    error?: string;
}

interface RegisterData {
    email: string;
    password: string;
    passwordConfirm: string;
    name: string;
}

interface LoginData {
    email: string;
    password: string;
}

class AuthClient {
    private baseURL: string;
    private token: string | null;

    constructor() {
        this.baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3050';
        this.token = this.getStoredToken();
    }

    /**
     * Get stored authentication token
     */
    private getStoredToken(): string | null {
        try {
            return localStorage.getItem('auth_token');
        } catch {
            return null;
        }
    }

    /**
     * Store authentication token
     */
    private storeToken(token: string): void {
        try {
            localStorage.setItem('auth_token', token);
            this.token = token;
        } catch (error) {
            console.error('Failed to store auth token:', error);
        }
    }

    /**
     * Remove stored authentication token
     */
    private removeToken(): void {
        try {
            localStorage.removeItem('auth_token');
            this.token = null;
        } catch (error) {
            console.error('Failed to remove auth token:', error);
        }
    }

    /**
     * Get stored user data
     */
    private getStoredUser(): User | null {
        try {
            const userData = localStorage.getItem('auth_user');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    /**
     * Store user data
     */
    private storeUser(user: User): void {
        try {
            localStorage.setItem('auth_user', JSON.stringify(user));
        } catch (error) {
            console.error('Failed to store user data:', error);
        }
    }

    /**
     * Remove stored user data
     */
    private removeUser(): void {
        try {
            localStorage.removeItem('auth_user');
        } catch (error) {
            console.error('Failed to remove user data:', error);
        }
    }

    /**
     * Make authenticated API request
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}/api/auth${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated(): boolean {
        return !!this.token && !!this.getStoredUser();
    }

    /**
     * Get current user data
     */
    getCurrentUser(): User | null {
        return this.getStoredUser();
    }

    /**
     * Get current authentication token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Register a new user
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await this.request<AuthResponse>('/register', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (response.success && response.user) {
                this.storeUser(response.user);

                // Auto-login after registration if we get a token
                if (response.token) {
                    this.storeToken(response.token);
                }
            }

            return response;
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    }

    /**
     * Login user
     */
    async login(data: LoginData): Promise<AuthResponse> {
        try {
            const response = await this.request<AuthResponse>('/login', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (response.success && response.user && response.token) {
                this.storeToken(response.token);
                this.storeUser(response.user);
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            };
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<AuthResponse> {
        try {
            // Call logout endpoint (mainly for server-side cleanup)
            await this.request<AuthResponse>('/logout', {
                method: 'POST',
            });

            // Clear local storage regardless of server response
            this.removeToken();
            this.removeUser();

            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            // Still clear local data even if server request fails
            this.removeToken();
            this.removeUser();

            console.error('Logout error:', error);
            return { success: true, message: 'Logged out locally' };
        }
    }

    /**
     * Get current user profile from server
     */
    async getProfile(): Promise<AuthResponse> {
        try {
            if (!this.token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await this.request<AuthResponse>('/me', {
                method: 'GET',
            });

            if (response.success && response.user) {
                this.storeUser(response.user);
            }

            return response;
        } catch (error) {
            console.error('Get profile error:', error);

            // If token is invalid, clear auth state
            if (error instanceof Error && error.message.includes('401')) {
                this.removeToken();
                this.removeUser();
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get profile'
            };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(data: { name?: string; email?: string }): Promise<AuthResponse> {
        try {
            if (!this.token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await this.request<AuthResponse>('/me', {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (response.success && response.user) {
                this.storeUser(response.user);
            }

            return response;
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update profile'
            };
        }
    }

    /**
     * Change password
     */
    async changePassword(data: {
        oldPassword: string;
        password: string;
        passwordConfirm: string;
    }): Promise<AuthResponse> {
        try {
            if (!this.token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await this.request<AuthResponse>('/change-password', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            return response;
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to change password'
            };
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<AuthResponse> {
        try {
            const response = await this.request<AuthResponse>('/request-password-reset', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });

            return response;
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to request password reset'
            };
        }
    }

    /**
     * Check authentication service health
     */
    async checkHealth(): Promise<{ status: string; timestamp?: string; error?: string }> {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/health`);
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Auth health check error:', error);
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Health check failed'
            };
        }
    }

    /**
     * Refresh authentication status
     */
    async refreshAuth(): Promise<boolean> {
        if (!this.token) {
            return false;
        }

        try {
            const response = await this.getProfile();
            return response.success;
        } catch {
            this.removeToken();
            this.removeUser();
            return false;
        }
    }

    /**
     * Initialize auth client and check for existing session
     */
    async init(): Promise<User | null> {
        if (!this.token) {
            return null;
        }

        try {
            const response = await this.getProfile();
            return response.success ? response.user || null : null;
        } catch {
            // Clear invalid token
            this.removeToken();
            this.removeUser();
            return null;
        }
    }
}

// Export singleton instance
export const authClient = new AuthClient();
export default authClient;

// Export types for use in components
export type { User, AuthResponse, RegisterData, LoginData };