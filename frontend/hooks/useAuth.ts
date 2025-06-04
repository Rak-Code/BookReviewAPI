"use client"

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/api';
import { AxiosResponse } from 'axios';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

interface LoginResponse {
    token: string;
    user: User;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    const setUser = (user: User | null) => {
        setAuthState(prev => ({ ...prev, user, loading: false }));
    };

    const setError = (error: string | null) => {
        setAuthState(prev => ({ ...prev, error, loading: false }));
    };

    const login = async (email: string, password: string): Promise<LoginResponse> => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            const response = await auth.login({ email, password });
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            setError(message);
            throw new Error(message);
        }
    };

    const signup = async (name: string, email: string, password: string): Promise<LoginResponse> => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            const response = await auth.signup({ name, email, password });
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Signup failed';
            setError(message);
            throw new Error(message);
        }
    };

    const logout = useCallback(async () => {
        try {
            await auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, []);

    // Check auth status on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setAuthState(prev => ({ ...prev, loading: false }));
            return;
        }

        // We'll check auth status using the health check endpoint
        // If it fails, we'll clear the token
        fetch('http://localhost:3000/api/health', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Token invalid');
                }
                // If we get here, the token is valid
                // You might want to get the user profile here instead
                setAuthState(prev => ({ ...prev, loading: false }));
            })
            .catch(() => {
                localStorage.removeItem('token');
                setAuthState(prev => ({ ...prev, loading: false }));
            });
    }, []);

    return {
        user: authState.user,
        loading: authState.loading,
        error: authState.error,
        login,
        signup,
        logout,
        isAuthenticated: !!authState.user,
    };
};

export default useAuth;
