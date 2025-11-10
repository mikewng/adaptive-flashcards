'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authApiService } from '../utils/authApis';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (token && refreshToken) {
            loadUser();
        } else {
            setLoading(false);
        }

        const handleTokenExpired = () => {
            setUser(null);
            setError('Your session has expired. Please log in again.');
            router.push('/login');
        };

        window.addEventListener('token-expired', handleTokenExpired);

        return () => {
            window.removeEventListener('token-expired', handleTokenExpired);
        };
    }, [router]);

    const loadUser = async () => {
        try {
            const userData = await authApiService.getCurrentUser();
            setUser(userData);
            setError(null);
        } catch (err) {
            console.error('Failed to load user:', err);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authApiService.login(email, password);

            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            await loadUser();
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const register = async (email, password, firstName = null, lastName = null, timezone = 'UTC') => {
        try {
            setError(null);
            await authApiService.register(email, password, firstName, lastName, timezone);
            return await login(email, password);
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                await authApiService.logout(refreshToken);
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setError(null);
        }
    };

    const updateProfile = async (updates) => {
        try {
            setError(null);
            await authApiService.updateProfile(updates);
            await loadUser();
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
