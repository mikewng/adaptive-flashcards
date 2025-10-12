'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../../utils/flashcardApis';
import './StudySession.scss';
import { useStudy } from '@/app/context/studySessionContext';
import StudyFlashCard from '../components/StudyFlashCard';

const StudySession = ({ deckId }) => {

    const { studyType } = useStudy();

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
                <h1>{deck?.name}</h1>
                <div>
                    <div className="fc-progress">
                        {currentCardIndex + 1} / {cards.length}
                    </div>
                </div>
            </div>

            <div className="fc-study-content">
                {
                    studyType === "fc" &&
                    <StudyFlashCard card={currentCard} />
                }
            </div>

            {
                studyType == "fc" &&
                <div className="fc-study-controls">
                    <button
                        onClick={handlePrevious}
                        disabled={currentCardIndex === 0}
                        className="fc-control-btn fc-prev-btn"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentCardIndex === cards.length - 1}
                        className="fc-control-btn fc-next-btn"
                    >
                        Next
                    </button>
                </div>
            }
        </div>
    );
};

export default StudySession;
