'use client';

import { useAuth } from '../context/userAuthContext';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, redirectTo = '/login' }) {
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // window.location.href = redirectTo;
        }
    }, [isAuthenticated, loading, redirectTo]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return children;
}
