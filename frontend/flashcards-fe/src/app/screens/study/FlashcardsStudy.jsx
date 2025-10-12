'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './FlashcardsStudy.scss';
import StudyFlashCard from './components/StudyFlashCard';

/**
 * Flashcards Study Mode
 * Simple card flipping without session tracking
 * No backend session needed - just browse through cards
 */
const FlashcardsStudy = ({ deckId }) => {
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();

    useEffect(() => {
        if (deckId) {
            fetchDeckAndCards();
        }
    }, [deckId]);

    const fetchDeckAndCards = async () => {
        try {
            setLoading(true);
            const [deckData, cardsData] = await Promise.all([
                flashcardApiService.getDeckById(deckId),
                flashcardApiService.getCardsByDeckId(deckId)
            ]);
            setDeck(deckData);
            setCards(cardsData);
            setError(null);
        } catch (err) {
            console.error('Error fetching deck and cards:', err);
            setError('Failed to load deck and cards');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToCards = () => {
        router.push(`/pages/decks/${deckId}`);
    };

    const handleNext = () => {
        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        }
    };

    if (loading) {
        return (
            <div className="fc-study-wrapper">
                <div className="fc-loading">Loading flashcards...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-study-wrapper">
                <div className="fc-error">{error}</div>
                <button onClick={handleBackToCards} className="fc-back-btn">
                    Back to Cards
                </button>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="fc-study-wrapper">
                <div className="fc-no-cards">
                    <p>No cards available to study. Add some cards first!</p>
                    <button onClick={handleBackToCards} className="fc-back-btn">
                        Back to Cards
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentCardIndex];

    return (
        <div className="fc-study-wrapper">
            <div className="fc-study-header">
                <h1>{deck?.name}</h1>
                <div className="fc-study-mode-badge">Flashcards Mode</div>
                <div className="fc-progress">
                    {currentCardIndex + 1} / {cards.length}
                </div>
            </div>

            <div className="fc-study-content">
                <StudyFlashCard card={currentCard} />
            </div>

            <div className="fc-study-controls">
                <button
                    onClick={handlePrevious}
                    disabled={currentCardIndex === 0}
                    className="fc-control-btn fc-prev-btn"
                >
                    Previous
                </button>
                <button
                    onClick={handleBackToCards}
                    className="fc-control-btn fc-back-btn-inline"
                >
                    Back to Deck
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentCardIndex === cards.length - 1}
                    className="fc-control-btn fc-next-btn"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default FlashcardsStudy;
