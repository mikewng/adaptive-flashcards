'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '../../context/studySessionContext';
import './WritingStudy.scss';

/**
 * Writing Study Mode
 * Type answers with session tracking and performance analytics
 * Creates a backend session for tracking progress
 */
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
    const feedbackRef = useRef(null);

    useEffect(() => {
        if (deckId && !sessionId && !sessionStats) {
            handleStartSession();
        }
    }, [deckId]);

    // Focus feedback section when it appears
    useEffect(() => {
        if (showFeedback && feedbackRef.current) {
            feedbackRef.current.focus();
        }
    }, [showFeedback]);

    const handleStartSession = async () => {
        try {
            await startSession(parseInt(deckId), 'writing', 'due', 20, true);
        } catch (err) {
            console.error('Failed to start writing session:', err);
        }
    };

    const handleSubmitAnswer = async () => {
        try {
            await submitAnswer();
        } catch (err) {
            console.error('Failed to submit answer:', err);
        }
    };

    const handleEndSession = async () => {
        try {
            await endSession();
        } catch (err) {
            console.error('Failed to end session:', err);
        }
    };

    const handleBackToDeck = () => {
        if (sessionId) {
            // End session before leaving
            handleEndSession();
        }
        resetSession();
        router.push(`/pages/decks/${deckId}`);
    };

    const handleResetAndRestart = () => {
        resetSession();
        handleStartSession();
    };

    // Render session stats summary
    if (sessionStats) {
        return (
            <div className="writing-study-wrapper">
                <div className="session-complete">
                    <h1>Session Complete!</h1>
                    <div className="stats-card">
                        <h2>Session Summary</h2>
                        <div className="stat-row">
                            <span>Cards Studied:</span>
                            <strong>{sessionStats.cards_studied}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Correct:</span>
                            <strong className="correct">{sessionStats.correct_count}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Incorrect:</span>
                            <strong className="incorrect">{sessionStats.incorrect_count}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Accuracy:</span>
                            <strong>{sessionStats.accuracy_rate?.toFixed(1)}%</strong>
                        </div>
                        <div className="stat-row">
                            <span>Avg Time per Card:</span>
                            <strong>{(sessionStats.average_time_per_card / 1000).toFixed(1)}s</strong>
                        </div>
                        <div className="stat-row">
                            <span>Total Time:</span>
                            <strong>{(sessionStats.total_time_spent / 1000).toFixed(1)}s</strong>
                        </div>
                        <div className="action-buttons">
                            <button onClick={handleResetAndRestart} className="primary-btn">
                                Study Again
                            </button>
                            <button onClick={handleBackToDeck} className="secondary-btn">
                                Back to Deck
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading && !currentCard) {
        return (
            <div className="writing-study-wrapper">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Starting study session...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !currentCard) {
        return (
            <div className="writing-study-wrapper">
                <div className="error-state">
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={handleBackToDeck} className="secondary-btn">
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    // No cards state
    if (!currentCard && !loading && !sessionStats) {
        return (
            <div className="writing-study-wrapper">
                <div className="no-cards-state">
                    <h2>No Cards Due for Review</h2>
                    <p>Great job! You're all caught up. There are no cards due for review right now.</p>
                    <p className="sub-text">Cards will become available as their review intervals expire.</p>
                    <button onClick={handleBackToDeck} className="primary-btn">
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    // Study interface
    return (
        <div className="writing-study-wrapper">
            <div className="study-header">
                <div className="study-mode-badge">Writing Mode</div>
                <div className="progress-info">
                    <span className="progress-text">
                        Card {progress.current} of {progress.total}
                    </span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress.percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="study-content">
                <div className="question-card">
                    <div className="question-label">Question:</div>
                    <div className="question-text">{currentCard.question}</div>
                </div>

                {!showFeedback ? (
                    <div className="answer-section">
                        <label className="answer-label">
                            Your Answer:
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmitAnswer()}
                                placeholder="Type your answer here..."
                                className="answer-input"
                                autoFocus
                            />
                        </label>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            onClick={handleSubmitAnswer}
                            disabled={loading || !userAnswer.trim()}
                            className="submit-btn"
                        >
                            {loading ? 'Submitting...' : 'Submit Answer'}
                        </button>
                    </div>
                ) : (
                    <div
                        ref={feedbackRef}
                        className="feedback-section"
                        tabIndex="0"
                        onKeyDown={(e) => e.key === 'Enter' && nextCard()}
                    >
                        <div className={`result-header ${
                            lastResult.correct ? 'correct' :
                            (lastResult.similarity_score * 100) > 75 ? 'partial' :
                            'incorrect'
                        }`}>
                            {
                                lastResult.correct ? "Correct!" :
                                    (lastResult.similarity_score * 100) > 75 ? "Close!" :
                                        "Wrong..."
                            }
                        </div>

                        <div className="result-details">
                            <div className="result-row">
                                <span>Your Answer:</span>
                                <strong>{userAnswer}</strong>
                            </div>
                            <div className="result-row">
                                <span>Correct Answer:</span>
                                <strong>{lastResult.correct_answer}</strong>
                            </div>
                            <div className="result-row">
                                <span>Similarity Score:</span>
                                <strong>{(lastResult.similarity_score * 100).toFixed(1)}%</strong>
                            </div>
                            <div className="result-row">
                                <span>Response Quality:</span>
                                <strong>{lastResult.response_quality}/4</strong>
                            </div>
                        </div>

                        <button onClick={nextCard} className="next-btn">
                            {hasMoreCards ? 'Next Card' : 'Finish Session'}
                        </button>
                    </div>
                )}
            </div>

            <div className="study-footer">
                <button onClick={handleEndSession} className="end-session-btn">
                    End Session Early
                </button>
            </div>
        </div>
    );
};

export default WritingStudy;
