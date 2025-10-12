"use client";

import { useState, useEffect } from 'react';
import { studyApiService } from '@/app/utils/studyApis';
import { flashcardApiService } from '@/app/utils/flashcardApis';

/**
 * BAREBONES TEST STUDY SESSION
 * Purpose: Test the study logic and backend services
 *
 * This is a temporary component for testing and will be replaced
 * with a refined version later.
 */
export default function TestStudy() {
    // Session state
    const [sessionId, setSessionId] = useState(null);
    const [deckId, setDeckId] = useState('');
    const [decks, setDecks] = useState([]);

    // Card state
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    // Feedback state
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    // Session stats
    const [sessionStats, setSessionStats] = useState(null);

    // Timer
    const [startTime, setStartTime] = useState(null);

    // Loading/Error state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load available decks on mount
    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        try {
            const data = await flashcardApiService.getDecks();
            setDecks(data);
        } catch (err) {
            console.error('Failed to load decks:', err);
            setError('Failed to load decks');
        }
    };

    const startSession = async () => {
        if (!deckId) {
            setError('Please select a deck');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Start session
            const session = await studyApiService.startStudySession(parseInt(deckId), 'writing');
            setSessionId(session.id);
            console.log('Session started:', session);

            // Get cards to study (due cards)
            const cardsData = await studyApiService.getDueCards(parseInt(deckId), 20);
            setCards(cardsData);
            setCurrentCardIndex(0);
            setStartTime(Date.now());

            console.log(`Loaded ${cardsData.length} cards`);
        } catch (err) {
            console.error('Failed to start session:', err);
            setError(`Failed to start session: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!userAnswer.trim()) {
            setError('Please enter an answer');
            return;
        }

        setLoading(true);
        setError(null);

        const currentCard = cards[currentCardIndex];
        const timeTaken = Date.now() - startTime;

        try {
            const result = await studyApiService.submitAnswer({
                session_id: sessionId,
                card_id: currentCard.id,
                user_input: userAnswer,
                time_taken_ms: timeTaken,
                typed_chars: userAnswer.length,
                backspace_count: 0, // Would need to track this in a real implementation
                typing_speed_cpm: Math.round((userAnswer.length / timeTaken) * 60000)
            });

            console.log('Answer result:', result);
            setLastResult(result);
            setShowFeedback(true);
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setError(`Failed to submit answer: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const nextCard = () => {
        setShowFeedback(false);
        setUserAnswer('');
        setLastResult(null);
        setStartTime(Date.now());

        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            // End of cards
            endSession();
        }
    };

    const endSession = async () => {
        if (!sessionId) return;

        setLoading(true);
        try {
            const stats = await studyApiService.endStudySession(sessionId);
            console.log('Session ended:', stats);
            setSessionStats(stats);
            setSessionId(null);
            setCards([]);
        } catch (err) {
            console.error('Failed to end session:', err);
            setError(`Failed to end session: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetTest = () => {
        setSessionId(null);
        setDeckId('');
        setCards([]);
        setCurrentCardIndex(0);
        setUserAnswer('');
        setShowFeedback(false);
        setLastResult(null);
        setSessionStats(null);
        setError(null);
    };

    // Render session stats summary
    if (sessionStats) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Session Complete!</h1>
                <div style={styles.statsCard}>
                    <h2>Session Summary</h2>
                    <div style={styles.statRow}>
                        <span>Cards Studied:</span>
                        <strong>{sessionStats.cards_studied}</strong>
                    </div>
                    <div style={styles.statRow}>
                        <span>Correct:</span>
                        <strong style={{ color: 'green' }}>{sessionStats.correct_count}</strong>
                    </div>
                    <div style={styles.statRow}>
                        <span>Incorrect:</span>
                        <strong style={{ color: 'red' }}>{sessionStats.incorrect_count}</strong>
                    </div>
                    <div style={styles.statRow}>
                        <span>Accuracy:</span>
                        <strong>{sessionStats.accuracy_rate?.toFixed(1)}%</strong>
                    </div>
                    <div style={styles.statRow}>
                        <span>Avg Time per Card:</span>
                        <strong>{(sessionStats.average_time_per_card / 1000).toFixed(1)}s</strong>
                    </div>
                    <div style={styles.statRow}>
                        <span>Total Time:</span>
                        <strong>{(sessionStats.total_time_spent / 1000).toFixed(1)}s</strong>
                    </div>
                    <button onClick={resetTest} style={styles.button}>
                        Start New Session
                    </button>
                </div>
            </div>
        );
    }

    // Render deck selection / session start
    if (!sessionId) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Test Study Session</h1>
                <p style={styles.subtitle}>Barebones testing interface for study logic</p>

                <div style={styles.card}>
                    <label style={styles.label}>
                        Select a Deck:
                        <select
                            value={deckId}
                            onChange={(e) => setDeckId(e.target.value)}
                            style={styles.select}
                        >
                            <option value="">-- Choose a deck --</option>
                            {decks.map(deck => (
                                <option key={deck.id} value={deck.id}>
                                    {deck.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {error && <div style={styles.error}>{error}</div>}

                    <button
                        onClick={startSession}
                        disabled={loading || !deckId}
                        style={styles.button}
                    >
                        {loading ? 'Starting...' : 'Start Study Session'}
                    </button>
                </div>
            </div>
        );
    }

    // Render study interface
    const currentCard = cards[currentCardIndex];

    if (!currentCard) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>No Cards Available</h1>
                <p>No cards are due for review in this deck.</p>
                <button onClick={endSession} style={styles.button}>
                    End Session
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Study Session</h1>
                <p style={styles.progress}>
                    Card {currentCardIndex + 1} of {cards.length}
                </p>
            </div>

            <div style={styles.card}>
                <div style={styles.question}>
                    <h2>Question:</h2>
                    <p style={styles.questionText}>{currentCard.question}</p>
                </div>

                {!showFeedback ? (
                    <div>
                        <label style={styles.label}>
                            Your Answer:
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                                placeholder="Type your answer..."
                                style={styles.input}
                                autoFocus
                            />
                        </label>

                        {error && <div style={styles.error}>{error}</div>}

                        <button
                            onClick={submitAnswer}
                            disabled={loading}
                            style={styles.button}
                        >
                            {loading ? 'Submitting...' : 'Submit Answer'}
                        </button>
                    </div>
                ) : (
                    <div style={styles.feedback}>
                        <h2 style={{
                            color: lastResult.correct ? 'green' : 'orange'
                        }}>
                            {lastResult.correct ? ' Correct!' : '~ Close!'}
                        </h2>

                        <div style={styles.resultDetail}>
                            <div style={styles.statRow}>
                                <span>Your Answer:</span>
                                <strong>{userAnswer}</strong>
                            </div>
                            <div style={styles.statRow}>
                                <span>Correct Answer:</span>
                                <strong>{lastResult.correct_answer}</strong>
                            </div>
                            <div style={styles.statRow}>
                                <span>Similarity Score:</span>
                                <strong>{(lastResult.similarity_score * 100).toFixed(1)}%</strong>
                            </div>
                            <div style={styles.statRow}>
                                <span>Response Quality:</span>
                                <strong>{lastResult.response_quality}/4</strong>
                            </div>
                        </div>

                        <button onClick={nextCard} style={styles.button}>
                            {currentCardIndex < cards.length - 1 ? 'Next Card' : 'Finish Session'}
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={endSession}
                style={{ ...styles.button, ...styles.endButton }}
            >
                End Session Early
            </button>
        </div>
    );
}

// Inline styles for barebones UI
const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    title: {
        fontSize: '32px',
        marginBottom: '10px',
    },
    subtitle: {
        color: '#666',
        marginBottom: '30px',
    },
    header: {
        marginBottom: '20px',
    },
    progress: {
        color: '#666',
        fontSize: '14px',
    },
    card: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px',
    },
    statsCard: {
        backgroundColor: '#f0f8ff',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '30px',
    },
    question: {
        marginBottom: '30px',
    },
    questionText: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginTop: '10px',
    },
    label: {
        display: 'block',
        marginBottom: '20px',
        fontSize: '16px',
    },
    input: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginTop: '8px',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginTop: '8px',
        boxSizing: 'border-box',
    },
    button: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '12px 24px',
        fontSize: '16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
        marginTop: '10px',
    },
    endButton: {
        backgroundColor: '#f44336',
    },
    error: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '10px',
    },
    feedback: {
        marginTop: '20px',
    },
    resultDetail: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '4px',
        marginTop: '15px',
        marginBottom: '15px',
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #eee',
    },
};
