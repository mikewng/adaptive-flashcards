'use client';

import { useState, useEffect } from 'react';
import { studyApiService } from '../../../utils/studyApis';
import ModalComponent from '../../../components/ModalComponent';
import { useAuth } from '../../../context/userAuthContext';
import { formatDateInTimezone, getDaysUntilDue } from '../../../utils/dateFormatter';
import './CardStatsModal.scss';

const getDifficultyClass = (accuracyRate) => {
    const ranges = [
        { max: Infinity, min: 71, class: "easy", label: "EASY" },
        { max: 70, min: 40, class: "medium", label: "MEDIUM" },
        { max: 39, min: 0, class: "hard", label: "HARD" }
    ];

    const range = ranges.find(r => accuracyRate >= r.min && accuracyRate <= r.max);
    return range || { class: "none", label: "NEW" };
};

const CardStatsModal = ({ card, isOpen, onClose }) => {
    const { user } = useAuth();
    const userTimezone = user?.timezone || 'UTC';
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!card?.id) return;

            setLoading(true);
            setError(null);

            try {
                // Try to fetch real analytics from backend
                const data = await studyApiService.getCardAnalytics(card.id);
                setAnalytics(data);
            } catch (err) {
                console.error('Failed to fetch card analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchAnalytics();
        }
    }, [card?.id, isOpen]);

    if (!card) return null;

    // Calculate metrics from card data and analytics
    const accuracyRate = card.accuracy_rate || 0;
    const difficulty = getDifficultyClass(accuracyRate);

    // Mock data for MVP - replace with actual analytics data when backend is ready
    const timesReviewed = analytics?.total_reviews || 0;
    const timesCorrect = analytics?.correct_reviews || 0;
    const avgResponseTime = analytics?.avg_response_time || 0;
    const recentAttempts = analytics?.recent_attempts || [];

    // Calculate trend
    const getTrend = () => {
        if (!analytics?.accuracy_trend) return { arrow: '→', label: 'Stable', class: 'stable' };

        if (analytics.accuracy_trend > 5) return { arrow: '↑', label: 'Improving', class: 'improving' };
        if (analytics.accuracy_trend < -5) return { arrow: '↓', label: 'Declining', class: 'declining' };
        return { arrow: '→', label: 'Stable', class: 'stable' };
    };

    const trend = getTrend();

    // Format due date with timezone awareness
    const formatDueDateWithDays = (date) => {
        if (!date) return 'Not scheduled';

        const daysUntil = getDaysUntilDue(date);
        if (daysUntil === null) return 'Not scheduled';

        if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
        if (daysUntil === 0) return 'Due today';
        if (daysUntil === 1) return 'Due tomorrow';
        return `Due in ${daysUntil} days`;
    };

    // Format time
    const formatTime = (ms) => {
        if (!ms || ms === 0) return 'N/A';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Format attempt with timezone awareness
    const formatAttemptDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return formatDateInTimezone(dateString, userTimezone, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <ModalComponent
            title="Card Statistics"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="fc-card-stats-modal">
                {loading ? (
                    <div className="fc-stats-loading">Loading statistics...</div>
                ) : error ? (
                    <div className="fc-stats-error">{error}</div>
                ) : (
                    <>
                        <div className="fc-stats-hero">
                            <div className="fc-stats-card-info">
                                <p className="fc-stats-question">{card.question}</p>
                            </div>

                            <div className="fc-stats-accuracy">
                                <div className={`fc-stats-badge ${difficulty.class}`}>
                                    <span className="fc-stats-percentage">{accuracyRate.toFixed(0)}%</span>
                                    <span className="fc-stats-difficulty">{difficulty.label}</span>
                                </div>
                            </div>

                            <div className="fc-stats-summary">
                                <div className="fc-stats-item">
                                    <span className="fc-stats-value">{timesCorrect}/{timesReviewed}</span>
                                    <span className="fc-stats-label">Correct</span>
                                </div>
                                <div className={`fc-stats-item fc-trend-${trend.class}`}>
                                    <span className="fc-stats-value">{trend.arrow} {trend.label}</span>
                                    <span className="fc-stats-label">Trend</span>
                                </div>
                            </div>
                        </div>
                        <div className="fc-stats-section">
                            <h3 className="fc-stats-section-title">Spaced Repetition</h3>
                            <div className="fc-stats-grid">
                                <div className="fc-stats-box">
                                    <span className="fc-stats-icon">📅</span>
                                    <div className="fc-stats-box-content">
                                        <span className="fc-stats-box-label">Next Review</span>
                                        <span className="fc-stats-box-value">{formatDueDateWithDays(card.due_date)}</span>
                                    </div>
                                </div>
                                <div className="fc-stats-box">
                                    <span className="fc-stats-icon">⏱️</span>
                                    <div className="fc-stats-box-content">
                                        <span className="fc-stats-box-label">Avg Response Time</span>
                                        <span className="fc-stats-box-value">{formatTime(avgResponseTime)}</span>
                                    </div>
                                </div>
                                <div className="fc-stats-box">
                                    <span className="fc-stats-icon">🔄</span>
                                    <div className="fc-stats-box-content">
                                        <span className="fc-stats-box-label">Times Studied</span>
                                        <span className="fc-stats-box-value">{timesReviewed}</span>
                                    </div>
                                </div>
                                <div className="fc-stats-box">
                                    <span className="fc-stats-icon">📈</span>
                                    <div className="fc-stats-box-content">
                                        <span className="fc-stats-box-label">Current Interval</span>
                                        <span className="fc-stats-box-value">
                                            {analytics?.current_interval_days
                                                ? `${analytics.current_interval_days} days`
                                                : 'New card'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="fc-stats-section">
                            <h3 className="fc-stats-section-title">Recent Attempts</h3>
                            {recentAttempts.length > 0 ? (
                                <div className="fc-stats-history">
                                    {recentAttempts.slice(0, 10).map((attempt, index) => (
                                        <div key={index} className="fc-stats-attempt">
                                            <span className="fc-attempt-date">
                                                {formatAttemptDate(attempt.date)}
                                            </span>
                                            <span className={`fc-attempt-result ${attempt.correct ? 'correct' : 'incorrect'}`}>
                                                {attempt.correct ? '✓' : '✗'}
                                            </span>
                                            <span className="fc-attempt-time">
                                                {formatTime(attempt.time_taken)}
                                            </span>
                                            {attempt.similarity_score && (
                                                <span className="fc-attempt-similarity">
                                                    {attempt.similarity_score % 1 === 0
                                                        ? attempt.similarity_score
                                                        : attempt.similarity_score.toFixed(2)}% match
                                                </span>
                                            )}
                                            <span className="fc-attempt-mode">
                                                {attempt.mode || 'Study'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="fc-stats-empty">
                                    <p>No study history yet. Start studying to see your progress!</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ModalComponent>
    );
};

export default CardStatsModal;
