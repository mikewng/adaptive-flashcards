'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/userAuthContext';
import './ProfileSettings.scss';

const COMMON_TIMEZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris, Berlin, Rome' },
    { value: 'Europe/Athens', label: 'Athens, Istanbul' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Shanghai', label: 'China' },
    { value: 'Asia/Tokyo', label: 'Tokyo, Seoul' },
    { value: 'Australia/Sydney', label: 'Sydney, Melbourne' },
    { value: 'Pacific/Auckland', label: 'New Zealand' },
];

const ProfileSettings = () => {
    const { user, loading: authLoading, updateProfile } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load user data when component mounts
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setTimezone(user.timezone || 'UTC');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const updates = {
                first_name: firstName || null,
                last_name: lastName || null,
                timezone: timezone,
            };

            const result = await updateProfile(updates);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: 'Profile updated successfully!',
                });
            } else {
                setMessage({
                    type: 'error',
                    text: result.error || 'Failed to update profile',
                });
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.message || 'Failed to update profile',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setTimezone(user.timezone || 'UTC');
            setMessage({ type: '', text: '' });
        }
    };

    if (authLoading) {
        return (
            <div className="profile-settings-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-settings-container">
                <div className="error">Please log in to view your profile</div>
            </div>
        );
    }

    return (
        <div className="profile-settings-container">
            <div className="profile-settings-card">
                <h1 className="profile-title">Profile Settings</h1>
                <p className="profile-subtitle">Update your personal information</p>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h2 className="section-title">Account Information</h2>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={user.email}
                                disabled
                                readOnly
                            />
                            <small className="form-hint">Email cannot be changed</small>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">Personal Information</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    className="form-input"
                                    placeholder="Enter your first name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    className="form-input"
                                    placeholder="Enter your last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">Preferences</h2>

                        <div className="form-group">
                            <label htmlFor="timezone" className="form-label">
                                Timezone
                            </label>
                            <select
                                id="timezone"
                                className="form-select"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                disabled={isLoading}
                            >
                                {COMMON_TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                            <small className="form-hint">
                                Used to display dates and times in your local timezone
                            </small>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleReset}
                            disabled={isLoading}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <div className="account-info">
                    <h2 className="section-title">Account Details</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Member Since:</span>
                            <span className="info-value">
                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">User ID:</span>
                            <span className="info-value">{user.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
