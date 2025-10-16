'use client'

import { createContext, useContext, useState, useCallback } from 'react';
import { flashcardApiService } from '../utils/flashcardApis';

const DeckContext = createContext(undefined);

export const DeckProvider = ({ children }) => {
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDeckAndCards = useCallback(async (deckId) => {
        if (!deckId) return;

        try {
            setLoading(true);
            setError(null);
            const [deckData, cardsData] = await Promise.all([
                flashcardApiService.getDeckById(deckId),
                flashcardApiService.getCardsByDeckId(deckId)
            ]);
            setDeck(deckData);
            setCards(cardsData);
        } catch (err) {
            console.error('Error fetching deck and cards:', err);
            setError('Failed to load deck and cards');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCard = useCallback(async (deckId, cardData) => {
        try {
            await flashcardApiService.createCard(deckId, cardData);
            await fetchDeckAndCards(deckId);
        } catch (err) {
            console.error('Error creating card:', err);
            throw err;
        }
    }, [fetchDeckAndCards]);

    const updateCard = useCallback(async (deckId, cardId, cardData) => {
        try {
            await flashcardApiService.updateCard(cardId, cardData);
            await fetchDeckAndCards(deckId);
        } catch (err) {
            console.error('Error updating card:', err);
            throw err;
        }
    }, [fetchDeckAndCards]);

    const deleteCard = useCallback(async (deckId, cardId) => {
        try {
            await flashcardApiService.deleteCardById(cardId);
            await fetchDeckAndCards(deckId);
        } catch (err) {
            console.error('Error deleting card:', err);
            throw err;
        }
    }, [fetchDeckAndCards]);

    const updateDeck = useCallback(async (deckId, deckData) => {
        try {
            const updatedDeck = await flashcardApiService.updateDeck(deckId, deckData);
            setDeck(updatedDeck);
            return updatedDeck;
        } catch (err) {
            console.error('Error updating deck:', err);
            throw err;
        }
    }, []);

    const clearDeck = useCallback(() => {
        setDeck(null);
        setCards([]);
        setError(null);
    }, []);

    const value = {
        deck,
        cards,
        loading,
        error,
        fetchDeckAndCards,
        createCard,
        updateCard,
        deleteCard,
        updateDeck,
        clearDeck
    };

    return (
        <DeckContext.Provider value={value}>
            {children}
        </DeckContext.Provider>
    );
};

export const useDeck = () => {
    const context = useContext(DeckContext);
    if (context === undefined) {
        throw new Error('useDeck must be used within a DeckProvider');
    }
    return context;
};
