'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { studyApiService } from '../utils/studyApis';

const StudySessionContext = createContext(null);

export function StudySessionProvider({ children }) {
    // Session identification
    const [studyType, setStudyType] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [deckId, setDeckId] = useState(null);
    const [sessionType, setSessionType] = useState('writing'); // 'writing' | 'multiple_choice'

    // Card state
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    // Feedback state
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    // Session stats (live during session)
    const [sessionStats, setSessionStats] = useState(null);

    // Timer tracking
    const [startTime, setStartTime] = useState(null);
    const cardStartTimeRef = useRef(null);

    // Loading/Error state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Session status
    const [isSessionActive, setIsSessionActive] = useState(false);

    /**
     * Start a new study session
     * @param {number} targetDeckId - The deck to study
     * @param {string} mode - Session type ('writing' or 'multiple_choice')
     * @param {string} cardSource - 'due' | 'new' | 'all'
     * @param {number} cardLimit - Max number of cards to load
     */
    const startSession = useCallback(async (targetDeckId, mode = 'writing', cardSource = 'due', cardLimit = 20) => {
        if (!targetDeckId) {
            setError('Please select a deck');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // First, check if there are cards available BEFORE creating a session
            let cardsData;
            if (cardSource === 'due') {
                cardsData = await studyApiService.getDueCards(parseInt(targetDeckId), cardLimit);
            } else if (cardSource === 'new') {
                cardsData = await studyApiService.getNewCards(parseInt(targetDeckId), cardLimit);
            } else {
                cardsData = await studyApiService.getAllCards(parseInt(targetDeckId), cardLimit);
            }

            // If no cards available, don't create a session
            if (!cardsData || cardsData.length === 0) {
                setCards([]);
                setDeckId(parseInt(targetDeckId));
                setError(null); // Clear error - this is not an error state
                return { session: null, cards: [] };
            }

            // Only create backend session if we have cards to study
            const session = await studyApiService.startStudySession(parseInt(targetDeckId), mode);
            setSessionId(session.id);
            setDeckId(parseInt(targetDeckId));
            setSessionType(mode);
            setIsSessionActive(true);

            setCards(cardsData);
            setCurrentCardIndex(0);
            setStartTime(Date.now());
            cardStartTimeRef.current = Date.now();

            return { session, cards: cardsData };
        } catch (err) {
            console.error('Failed to start session:', err);
            setError(`Failed to start session: ${err.message}`);
            setIsSessionActive(false);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Submit an answer for the current card
     * @param {object} answerData - Additional answer data (optional)
     */
    const submitAnswer = useCallback(async (answerData = {}) => {
        if (!userAnswer.trim() && !answerData.user_input) {
            setError('Please enter an answer');
            return;
        }

        setLoading(true);
        setError(null);

        const currentCard = cards[currentCardIndex];
        const timeTaken = Date.now() - (cardStartTimeRef.current || startTime);
        const answer = answerData.user_input || userAnswer;

        try {
            const result = await studyApiService.submitAnswer({
                session_id: sessionId,
                card_id: currentCard.id,
                user_input: answer,
                time_taken_ms: timeTaken,
                typed_chars: answer.length,
                backspace_count: answerData.backspace_count || 0,
                typing_speed_cpm: Math.round((answer.length / timeTaken) * 60000),
                ...answerData
            });

            setLastResult(result);
            setShowFeedback(true);

            return result;
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setError(`Failed to submit answer: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [sessionId, cards, currentCardIndex, userAnswer, startTime]);

    /**
     * Move to the next card or end session if no more cards
     */
    const nextCard = useCallback(() => {
        setShowFeedback(false);
        setUserAnswer('');
        setLastResult(null);
        cardStartTimeRef.current = Date.now();

        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            // End of cards - trigger end session
            endSession();
        }
    }, [currentCardIndex, cards.length]);

    /**
     * Get the current card being studied
     */
    const getCurrentCard = useCallback(() => {
        if (!cards.length || currentCardIndex >= cards.length) {
            return null;
        }
        return cards[currentCardIndex];
    }, [cards, currentCardIndex]);

    /**
     * End the current study session
     */
    const endSession = useCallback(async () => {
        if (!sessionId) {
            console.warn('No active session to end');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const stats = await studyApiService.endStudySession(sessionId);
            setSessionStats(stats);
            setIsSessionActive(false);

            return stats;
        } catch (err) {
            console.error('Failed to end session:', err);
            setError(`Failed to end session: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    /**
     * Reset all session state (use after viewing stats)
     */
    const resetSession = useCallback(() => {
        setSessionId(null);
        setDeckId(null);
        setSessionType('writing');
        setCards([]);
        setCurrentCardIndex(0);
        setUserAnswer('');
        setShowFeedback(false);
        setLastResult(null);
        setSessionStats(null);
        setStartTime(null);
        cardStartTimeRef.current = null;
        setIsSessionActive(false);
        setError(null);
    }, []);

    /**
     * Skip the current card (mark as seen but not answered)
     */
    const skipCard = useCallback(() => {
        nextCard();
    }, [cards, currentCardIndex, nextCard]);

    /**
     * Get progress information
     */
    const getProgress = useCallback(() => {
        return {
            current: currentCardIndex + 1,
            total: cards.length,
            percentage: cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0,
            remaining: cards.length - currentCardIndex - 1
        };
    }, [currentCardIndex, cards.length]);

    const value = {
        // Session identification
        studyType,
        setStudyType,
        sessionId,
        deckId,
        sessionType,

        // Card state
        cards,
        currentCardIndex,
        currentCard: getCurrentCard(),
        userAnswer,
        setUserAnswer,

        // Feedback state
        showFeedback,
        lastResult,

        // Stats (final session stats after completion)
        sessionStats,

        // Session status
        isSessionActive,
        loading,
        error,

        // Helper getters
        progress: getProgress(),
        hasMoreCards: currentCardIndex < cards.length - 1,

        // Actions
        startSession,
        submitAnswer,
        nextCard,
        skipCard,
        endSession,
        resetSession,
        getCurrentCard,
    };

    return (
        <StudySessionContext.Provider value={value}>
            {children}
        </StudySessionContext.Provider>
    );
}

export function useStudy() {
    const context = useContext(StudySessionContext);
    if (!context) {
        throw new Error('useStudy must be used within a StudySessionProvider');
    }
    return context;
}
