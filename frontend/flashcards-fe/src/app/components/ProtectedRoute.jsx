'use client';

import { useAuth } from '../context/userAuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children, redirectTo = '/pages/login' }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, loading, redirectTo, router]);

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
