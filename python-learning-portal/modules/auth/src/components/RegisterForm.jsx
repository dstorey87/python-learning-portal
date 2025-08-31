/**
 * Register Form Component
 * Provides user registration interface with validation
 */

import React, { useState } from 'react';
import { AuthClient } from '../client/auth-client';

export function RegisterForm({ onSuccess, onShowLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirm: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        passwordConfirm: false
    });

    const authClient = AuthClient.getInstance();

    const validateForm = () => {
        const validationErrors = {};

        // Required fields
        if (!formData.name.trim()) {
            validationErrors.name = 'Name is required';
        }

        if (!formData.email) {
            validationErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            validationErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            validationErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            validationErrors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            validationErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        if (!formData.passwordConfirm) {
            validationErrors.passwordConfirm = 'Please confirm your password';
        } else if (formData.password !== formData.passwordConfirm) {
            validationErrors.passwordConfirm = 'Passwords do not match';
        }

        return validationErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            // Validate form
            const validationErrors = validateForm();
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            // Register
            await authClient.register({
                email: formData.email,
                password: formData.password,
                passwordConfirm: formData.passwordConfirm,
                name: formData.name
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setErrors({ general: error.message || 'Registration failed. Please try again.' });
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

        // Clear password confirmation error when either password changes
        if ((name === 'password' || name === 'passwordConfirm') && errors.passwordConfirm) {
            setErrors(prev => ({ ...prev, passwordConfirm: null }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, text: '', color: 'gray' };

        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength += 1;
        else feedback.push('8+ characters');

        if (/[a-z]/.test(password)) strength += 1;
        else feedback.push('lowercase letter');

        if (/[A-Z]/.test(password)) strength += 1;
        else feedback.push('uppercase letter');

        if (/\d/.test(password)) strength += 1;
        else feedback.push('number');

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

        const levels = [
            { text: 'Very Weak', color: 'red' },
            { text: 'Weak', color: 'orange' },
            { text: 'Fair', color: 'yellow' },
            { text: 'Good', color: 'blue' },
            { text: 'Strong', color: 'green' }
        ];

        return {
            strength,
            ...levels[Math.min(strength, 4)],
            feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Strong password!'
        };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-600 mt-2">Join the Python learning community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Error */}
                {errors.general && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* Name Field */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Your full name"
                        disabled={loading}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

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
                            type={showPasswords.password ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Create a strong password"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('password')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={loading}
                        >
                            <span className="text-gray-400 hover:text-gray-600">
                                {showPasswords.password ? '🙈' : '👁️'}
                            </span>
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                        <div className="mt-2">
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-medium text-${passwordStrength.color}-600`}>
                                    {passwordStrength.text}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                        </div>
                    )}

                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                </div>

                {/* Password Confirmation Field */}
                <div>
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.passwordConfirm ? 'text' : 'password'}
                            id="passwordConfirm"
                            name="passwordConfirm"
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.passwordConfirm ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Confirm your password"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('passwordConfirm')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={loading}
                        >
                            <span className="text-gray-400 hover:text-gray-600">
                                {showPasswords.passwordConfirm ? '🙈' : '👁️'}
                            </span>
                        </button>
                    </div>
                    {errors.passwordConfirm && (
                        <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || passwordStrength.strength < 2}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading || passwordStrength.strength < 2
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
                            Creating Account...
                        </span>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
                <div className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={onShowLogin}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Sign in here
                    </button>
                </div>
            </div>

            {/* Terms */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}