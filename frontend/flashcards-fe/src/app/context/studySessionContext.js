'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const StudySessionContext = createContext(null);

export function StudySessionProvider({ children }) {

    const { deck, cards, loading, error, fetchDeckAndCards, createCard, updateCard, deleteCard } = useDeck();
    const [studyType, setStudyType] = useState("")


    const value = {
    };

    return (
        <StudySession.Provider value={value}>
            {children}
        </StudySession.Provider>
    );
}

export function useStudy() {
    const context = useContext(StudySessionContext);
    if (!context) {
        throw new Error('useStudySession must be used within an StudySessionProvider');
    }
    return context;
}
