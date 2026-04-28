'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '../../context/studySessionContext';
import './WritingStudy.scss';

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
);
const ShuffleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4l1.5 0 7 8H13M3 12l1.5 0 7-8H13M11 2l2 2-2 2M11 14l2-2-2-2" />
    </svg>
);

const WritingStudy = ({ deckId }) => {
    const {
        sessionId,
        currentCard,
        userAnswer,
        setUserAnswer,
        showFeedback,
        lastResult,
        sessionStats,
        loading,
        error,
        progress,
        hasMoreCards,
        startSession,
        submitAnswer,
        nextCard,
        endSession,
        resetSession
    } = useStudy();

    const router = useRouter();
    const inputRef = useRef(null);
    const feedbackRef = useRef(null);

    useEffect(() => {
        if (deckId && !sessionId && !sessionStats) {
            handleStartSession();
        }
    }, [deckId]);

    useEffect(() => {
        if (!showFeedback && inputRef.current) {
            inputRef.current.focus();
        }
        if (showFeedback && feedbackRef.current) {
            feedbackRef.current.focus();
        }
    }, [showFeedback]);

    const handleStartSession = async () => {
        try { await startSession(parseInt(deckId), 'writing', 'due', 20, true); }
        catch (err) { console.error('Failed to start writing session:', err); }
    };

    const handleSubmitAnswer = async () => {
        try { await submitAnswer(); }
        catch (err) { console.error('Failed to submit answer:', err); }
    };

    const handleEndSession = async () => {
        try { await endSession(); }
        catch (err) { console.error('Failed to end session:', err); }
    };

    const handleBackToDeck = () => {
        if (sessionId) handleEndSession();
        resetSession();
        router.push(`/pages/decks/${deckId}`);
    };

    const handleResetAndRestart = () => {
        resetSession();
        handleStartSession();
    };

    /* ── Session complete summary ─────────────────────────────────────────── */
    if (sessionStats) {
        const pct = sessionStats.accuracy_rate?.toFixed(1) ?? '0.0';
        return (
            <div className="ws-overlay">
                <div className="ws-head">
                    <button className="ws-exit-btn" onClick={handleBackToDeck}>
                        <CloseIcon /> Back to deck
                    </button>
                    <div className="ws-progress"><i style={{ width: '100%' }} /></div>
                    <div className="ws-counter">{sessionStats.cards_studied} / {sessionStats.cards_studied}</div>
                </div>

                <div className="ws-summary-stage">
                    <div className="ws-summary-card">
                        <h2 className="ws-summary-title">
                            {parseFloat(pct) >= 80
                                ? <>Nicely <em>done.</em></>
                                : parseFloat(pct) >= 50
                                    ? <>Good <em>effort.</em></>
                                    : <>Keep <em>practicing.</em></>}
                        </h2>
                        <p className="ws-summary-blurb">
                            You reviewed {sessionStats.cards_studied} card{sessionStats.cards_studied !== 1 ? 's' : ''}.
                            {sessionStats.incorrect_count > 0
                                ? ` ${sessionStats.incorrect_count} are queued for another round.`
                                : ' Clean sweep!'}
                        </p>
                        <div className="ws-summary-stats">
                            <div><div className="ws-stat-v">{sessionStats.correct_count}</div><div className="ws-stat-l">Correct</div></div>
                            <div><div className="ws-stat-v">{sessionStats.incorrect_count}</div><div className="ws-stat-l">Incorrect</div></div>
                            <div><div className="ws-stat-v">{pct}<small>%</small></div><div className="ws-stat-l">Accuracy</div></div>
                        </div>
                        <div className="ws-summary-meta">
                            <span>Avg time per card: <b>{(sessionStats.average_time_per_card / 1000).toFixed(1)}s</b></span>
                            <span>Total time: <b>{(sessionStats.total_time_spent / 1000).toFixed(1)}s</b></span>
                        </div>
                        <div className="ws-summary-actions">
                            <button className="ws-btn ws-btn-primary ws-btn-lg" onClick={handleResetAndRestart}>
                                <ShuffleIcon /> Study Again
                            </button>
                            <button className="ws-btn ws-btn-lg" onClick={handleBackToDeck}>
                                Back to Deck
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Loading ──────────────────────────────────────────────────────────── */
    if (loading && !currentCard) {
        return (
            <div className="ws-overlay">
                <div className="ws-state-center">
                    <div className="ws-spinner" />
                    <p>Starting session…</p>
                </div>
            </div>
        );
    }

    /* ── Error ────────────────────────────────────────────────────────────── */
    if (error && !currentCard) {
        return (
            <div className="ws-overlay">
                <div className="ws-state-center">
                    <p className="ws-state-error">{error}</p>
                    <button className="ws-btn" onClick={handleBackToDeck}>Back to Deck</button>
                </div>
            </div>
        );
    }

    /* ── No cards due ─────────────────────────────────────────────────────── */
    if (!currentCard && !loading && !sessionStats) {
        return (
            <div className="ws-overlay">
                <div className="ws-state-center">
                    <h2 className="ws-state-title">All caught up!</h2>
                    <p>No cards are due for review right now.</p>
                    <button className="ws-btn ws-btn-primary" onClick={handleBackToDeck}>Back to Deck</button>
                </div>
            </div>
        );
    }

    /* ── Main study interface ─────────────────────────────────────────────── */
    const progressPct = progress.total > 0 ? ((progress.current - 1) / progress.total) * 100 : 0;

    const resultClass = lastResult?.correct ? 'correct'
        : (lastResult?.similarity_score * 100) > 75 ? 'partial'
        : 'incorrect';

    const resultLabel = lastResult?.correct ? 'Correct!'
        : (lastResult?.similarity_score * 100) > 75 ? 'Close!'
        : 'Not quite…';

    return (
        <div className="ws-overlay">
            {/* Header */}
            <div className="ws-head">
                <button className="ws-exit-btn" onClick={handleBackToDeck}>
                    <CloseIcon /> Exit
                </button>
                <div className="ws-progress">
                    <i style={{ width: `${progressPct}%` }} />
                </div>
                <div className="ws-counter">
                    {String(progress.current).padStart(2, '0')} / {String(progress.total).padStart(2, '0')}
                </div>
            </div>

            {/* Stage */}
            <div className="ws-stage">
                {/* Question card */}
                <div className="ws-question-card">
                    <span className="ws-corner">question</span>
                    <span className="ws-corner-r">writing mode</span>
                    <div className="ws-question-text">{currentCard?.question}</div>
                </div>

                {/* Answer area or feedback */}
                {!showFeedback ? (
                    <div className="ws-answer-section">
                        <label className="ws-answer-label" htmlFor="ws-input">Your answer</label>
                        <input
                            id="ws-input"
                            ref={inputRef}
                            type="text"
                            className="ws-answer-input"
                            value={userAnswer}
                            onChange={e => setUserAnswer(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !loading && handleSubmitAnswer()}
                            placeholder="Type your answer and press Enter…"
                            autoComplete="off"
                        />
                        {error && <div className="ws-inline-error">{error}</div>}
                        <button
                            className="ws-btn ws-btn-primary ws-btn-submit"
                            onClick={handleSubmitAnswer}
                            disabled={loading || !userAnswer.trim()}
                        >
                            {loading ? 'Submitting…' : 'Submit Answer'}
                        </button>
                    </div>
                ) : (
                    <div
                        ref={feedbackRef}
                        className="ws-feedback"
                        tabIndex="0"
                        onKeyDown={e => e.key === 'Enter' && nextCard()}
                    >
                        <div className={`ws-result-header ws-result-${resultClass}`}>
                            {resultLabel}
                        </div>
                        <div className="ws-result-details">
                            <div className="ws-result-row">
                                <span>Your answer</span>
                                <strong>{userAnswer}</strong>
                            </div>
                            <div className="ws-result-row">
                                <span>Correct answer</span>
                                <strong>{lastResult?.correct_answer}</strong>
                            </div>
                            <div className="ws-result-row">
                                <span>Similarity</span>
                                <strong>{(lastResult?.similarity_score * 100).toFixed(1)}%</strong>
                            </div>
                            <div className="ws-result-row">
                                <span>Response quality</span>
                                <strong>{lastResult?.response_quality} / 4</strong>
                            </div>
                        </div>
                        <button className="ws-btn ws-btn-next" onClick={nextCard}>
                            {hasMoreCards ? 'Next Card →' : 'Finish Session'}
                        </button>
                        <div className="ws-feedback-hint">press Enter to continue</div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="ws-footer">
                <button className="ws-end-btn" onClick={handleEndSession}>
                    End session early
                </button>
            </div>
        </div>
    );
};

export default WritingStudy;
