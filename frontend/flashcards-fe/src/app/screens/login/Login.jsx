'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/userAuthContext';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, register, error: authError } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        if (!email || !password) {
            setFormError('Please fill in all fields');
            return false;
        }

        if (!email.includes('@')) {
            setFormError('Please enter a valid email');
            return false;
        }

        if (password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return false;
        }

        if (!isLogin && password !== confirmPassword) {
            setFormError('Passwords do not match');
            return false;
        }

        setFormError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setFormError('');

        try {
            const result = isLogin
                ? await login(email, password)
                : await register(email, password);

            if (result.success) {
                // Redirect to home/decks page after successful login
                navigate('/decks');
            } else {
                setFormError(result.error || 'Authentication failed');
            }
        } catch (err) {
            setFormError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="fc-login-screen-wrapper">
            <div className="fc-login-container">
                <div className="fc-login-card">
                    <h1 className="fc-login-title">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="fc-login-subtitle">
                        {isLogin
                            ? 'Sign in to continue your learning journey'
                            : 'Join us and start learning smarter'
                        }
                    </p>

                    <form onSubmit={handleSubmit} className="fc-login-form">
                        <div className="fc-form-group">
                            <label htmlFor="email" className="fc-form-label">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="fc-form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="fc-form-group">
                            <label htmlFor="password" className="fc-form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="fc-form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        {!isLogin && (
                            <div className="fc-form-group">
                                <label htmlFor="confirmPassword" className="fc-form-label">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className="fc-form-input"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {(formError || authError) && (
                            <div className="fc-error-message">
                                {formError || authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="fc-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="fc-toggle-mode">
                        <span>
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        </span>
                        <button
                            type="button"
                            className="fc-toggle-btn"
                            onClick={toggleMode}
                            disabled={isLoading}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
