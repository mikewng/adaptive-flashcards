'use client';

import { useState, useEffect } from 'react';
import { studyApiService } from '../../../utils/studyApis';
import ModalComponent from '../../../components/ModalComponent';
import { useAuth } from '../../../context/userAuthContext';
import { formatDateInTimezone, getDaysUntilDue } from '../../../utils/dateFormatter';
import './CardStatsModal.scss';

const getDifficultyInfo = (accuracyRate, timesSeen) => {
    if (!timesSeen || timesSeen === 0) return { label: 'New', cls: 'new' };
    if (accuracyRate >= 75) return { label: 'Mastered', cls: 'mastered' };
    if (accuracyRate >= 40) return { label: 'Learning', cls: 'learning' };
    return { label: 'Struggling', cls: 'struggling' };
};

const CardStatsModal = ({ card, isOpen, onClose }) => {
    const { user } = useAuth();
    const userTimezone = user?.timezone || 'UTC';
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !card?.id) return;
        setLoading(true);
        studyApiService.getCardAnalytics(card.id)
            .then(data => setAnalytics(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [card?.id, isOpen]);

    if (!card) return null;

    const accuracyRate = card.accuracy_rate || 0;
    const difficulty = getDifficultyInfo(accuracyRate, card.times_seen);

    const timesReviewed = analytics?.total_reviews || 0;
    const timesCorrect  = analytics?.correct_reviews || 0;
    const avgResponseTime = analytics?.avg_response_time || 0;
    const recentAttempts  = analytics?.recent_attempts || [];

    const trend = (() => {
        if (!analytics?.accuracy_trend) return { symbol: '→', label: 'Stable', cls: 'stable' };
        if (analytics.accuracy_trend > 5)  return { symbol: '↑', label: 'Improving', cls: 'up' };
        if (analytics.accuracy_trend < -5) return { symbol: '↓', label: 'Declining', cls: 'down' };
        return { symbol: '→', label: 'Stable', cls: 'stable' };
    })();

    const formatDueLabel = (date) => {
        if (!date) return '—';
        const days = getDaysUntilDue(date);
        if (days === null) return '—';
        if (days < 0) return `Overdue by ${Math.abs(days)}d`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `In ${days} days`;
    };

    const formatMs = (ms) => {
        if (!ms || ms === 0) return '—';
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    };

    const formatAttemptDate = (dateString) => {
        const diff = Math.floor((Date.now() - new Date(dateString)) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff}d ago`;
        return formatDateInTimezone(dateString, userTimezone, { month: 'short', day: 'numeric' });
    };

    return (
        <ModalComponent title="Card stats" isOpen={isOpen} onClose={onClose}>
            <div className="csm-body">
                {loading ? (
                    <div className="csm-loading">Loading statistics…</div>
                ) : (
                    <>
                        {/* Question preview */}
                        <div className="csm-question">{card.question}</div>

                        {/* Key metrics strip */}
                        <div className="csm-metrics">
                            <div className="csm-metric">
                                <div className="csm-metric-value serif">
                                    {accuracyRate.toFixed(0)}<span>%</span>
                                </div>
                                <div className="csm-metric-label">Accuracy</div>
                            </div>
                            <div className="csm-metric">
                                <div className="csm-metric-value serif">
                                    {timesCorrect}<span>/{timesReviewed}</span>
                                </div>
                                <div className="csm-metric-label">Correct</div>
                            </div>
                            <div className={`csm-metric csm-trend-${trend.cls}`}>
                                <div className="csm-metric-value serif">{trend.symbol}</div>
                                <div className="csm-metric-label">{trend.label}</div>
                            </div>
                            <div className="csm-metric">
                                <div className={`csm-badge csm-badge-${difficulty.cls}`}>
                                    {difficulty.label}
                                </div>
                                <div className="csm-metric-label">Status</div>
                            </div>
                        </div>

                        {/* Spaced repetition detail rows */}
                        <div className="csm-section-head">Spaced repetition</div>
                        <div className="csm-detail-list">
                            <div className="csm-detail-row">
                                <span>Next review</span>
                                <span>{formatDueLabel(card.due_date)}</span>
                            </div>
                            <div className="csm-detail-row">
                                <span>Avg response time</span>
                                <span>{formatMs(avgResponseTime)}</span>
                            </div>
                            <div className="csm-detail-row">
                                <span>Times studied</span>
                                <span>{timesReviewed}</span>
                            </div>
                            <div className="csm-detail-row">
                                <span>Current interval</span>
                                <span>
                                    {analytics?.current_interval_days
                                        ? `${analytics.current_interval_days} days`
                                        : 'New card'}
                                </span>
                            </div>
                        </div>

                        {/* Recent attempts */}
                        <div className="csm-section-head">Recent attempts</div>
                        {recentAttempts.length > 0 ? (
                            <div className="csm-attempts">
                                {recentAttempts.slice(0, 8).map((a, i) => (
                                    <div key={i} className="csm-attempt-row">
                                        <span className="csm-attempt-date">{formatAttemptDate(a.date)}</span>
                                        <span className={`csm-attempt-result ${a.correct ? 'correct' : 'incorrect'}`}>
                                            {a.correct ? '✓' : '✗'}
                                        </span>
                                        <span className="csm-attempt-time">{formatMs(a.time_taken)}</span>
                                        {a.similarity_score != null && (
                                            <span className="csm-attempt-sim">
                                                {(a.similarity_score * 100 % 1 === 0
                                                    ? a.similarity_score * 100
                                                    : (a.similarity_score * 100).toFixed(1))}% match
                                            </span>
                                        )}
                                        <span className="csm-attempt-mode">{a.mode || 'study'}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="csm-empty">No study history yet.</div>
                        )}
                    </>
                )}
            </div>
        </ModalComponent>
    );
};

export default CardStatsModal;
