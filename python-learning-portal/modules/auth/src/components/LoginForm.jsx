/**
 * Login Form Component
 * Provides user login interface with validation
 */

import React, { useState } from 'react';
import { AuthClient } from '../client/auth-client';

export function LoginForm({ onSuccess, onShowRegister }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const authClient = AuthClient.getInstance();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            // Validate form
            const validationErrors = {};
            if (!formData.email) validationErrors.email = 'Email is required';
            if (!formData.password) validationErrors.password = 'Password is required';

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            // Login
            await authClient.login(formData.email, formData.password);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setErrors({ general: error.message || 'Login failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600 mt-2">Access your learning portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Error */}
                {errors.general && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="your.email@example.com"
                        disabled={loading}
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={loading}
                        >
                            <span className="text-gray-400 hover:text-gray-600">
                                {showPassword ? '🙈' : '👁️'}
                            </span>
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing In...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-3">
                <button
                    onClick={() => {/* TODO: Handle password reset */ }}
                    className="text-sm text-blue-600 hover:text-blue-500"
                >
                    Forgot your password?
                </button>

                <div className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                        onClick={onShowRegister}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Sign up here
                    </button>
                </div>
            </div>
        </div>
    );
}