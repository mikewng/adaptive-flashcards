'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { flashcardApiService } from '../utils/flashcardApis';

const StudySessionContext = createContext(null);

export function StudySessionProvider({ children }) {
    const [studyType, setStudyType] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [currentCard, setCurrentCard] = useState(null);
    const [sessionStats, setSessionStats] = useState({
        totalCards: 0,
        reviewedCards: 0,
        correctCount: 0,
        incorrectCount: 0,
        startTime: null,
        endTime: null
    });
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startSession = useCallback(async (deckId, mode) => {
        try {
            setLoading(true);
            setError(null);

            // const session = await flashcardApiService.startStudySession(deckId, mode);

            setStudyType(mode);
            setIsSessionActive(true);
            setSessionStats(prev => ({
                ...prev,
                startTime: new Date().toISOString(),
                totalCards: 0,
                reviewedCards: 0,
                correctCount: 0,
                incorrectCount: 0
            }));

            await getNextCard(deckId);
        } catch (err) {
            console.error('Error starting study session:', err);
            setError('Failed to start study session');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getNextCard = useCallback(async (deckId) => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Update to pass deckId and sessionId
            const nextCard = await flashcardApiService.getStudySessionCards(deckId);
            setCurrentCard(nextCard);

            return nextCard;
        } catch (err) {
            console.error('Error fetching next card:', err);
            setError('Failed to fetch next card');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const submitReview = useCallback(async (deckId, cardId, rating, timeSpent) => {
        try {
            setLoading(true);
            setError(null);

            const reviewData = {
                sessionId,
                cardId,
                rating,
                timeSpent,
                studyType
            };

            await flashcardApiService.reviewCard(reviewData);

            setSessionStats(prev => ({
                ...prev,
                reviewedCards: prev.reviewedCards + 1,
                correctCount: rating >= 3 ? prev.correctCount + 1 : prev.correctCount,
                incorrectCount: rating < 3 ? prev.incorrectCount + 1 : prev.incorrectCount
            }));

            await getNextCard(deckId);
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Failed to submit review');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [sessionId, studyType, getNextCard]);

    const endSession = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // await flashcardApiService.endStudySession(sessionId);

            setSessionStats(prev => ({
                ...prev,
                endTime: new Date().toISOString()
            }));

            setIsSessionActive(false);
        } catch (err) {
            console.error('Error ending study session:', err);
            setError('Failed to end study session');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    const resetSession = useCallback(() => {
        setStudyType("");
        setSessionId(null);
        setCurrentCard(null);
        setSessionStats({
            totalCards: 0,
            reviewedCards: 0,
            correctCount: 0,
            incorrectCount: 0,
            startTime: null,
            endTime: null
        });
        setIsSessionActive(false);
        setError(null);
    }, []);

    const value = {
        // State
        studyType,
        sessionId,
        currentCard,
        sessionStats,
        isSessionActive,
        loading,
        error,

        // Actions
        setStudyType,
        startSession,
        getNextCard,
        submitReview,
        endSession,
        resetSession
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
        throw new Error('useStudySession must be used within an StudySessionProvider');
    }
    return context;
}
