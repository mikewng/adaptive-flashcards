'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './Study.scss';

const Study = ({ deckId, studyType }) => {
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

    if (loading) {
        return (
            <div className="fc-study-wrapper">
                <div className="fc-loading">Loading study session...</div>
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
                <button onClick={handleBackToCards} className="fc-back-btn">
                    Back to Cards
                </button>
                <h1>{deck?.name}</h1>
                <div className="fc-progress">
                    {currentCardIndex + 1} / {cards.length}
                </div>
            </div>

            <div className="fc-study-content">
            </div>
        </div>
    );
};

export default Study;
