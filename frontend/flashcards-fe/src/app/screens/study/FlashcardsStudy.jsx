'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './FlashcardsStudy.scss';
import StudyFlashCard from './components/StudyFlashCard';

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
);
const ArrowLeftIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 4L5 8l4.5 4M5.5 8h8" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 4l4.5 4-4.5 4M3 8h8" />
    </svg>
);
const ShuffleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4l1.5 0 7 8H13M3 12l1.5 0 7-8H13M11 2l2 2-2 2M11 14l2-2-2-2" />
    </svg>
);

const FlashcardsStudy = ({ deckId }) => {
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [originalCards, setOriginalCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shuffleEnabled, setShuffleEnabled] = useState(true);

    const router = useRouter();

    useEffect(() => {
        if (deckId) fetchDeckAndCards();
    }, [deckId]);

    const fetchDeckAndCards = async () => {
        try {
            setLoading(true);
            const [deckData, cardsData] = await Promise.all([
                flashcardApiService.getDeckById(deckId),
                flashcardApiService.getCardsByDeckId(deckId)
            ]);
            setDeck(deckData);
            setOriginalCards(cardsData);
            setCards([...cardsData].sort(() => Math.random() - 0.5));
        } catch (err) {
            console.error('Error fetching deck and cards:', err);
            setError('Failed to load deck and cards');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleShuffle = () => {
        setShuffleEnabled(!shuffleEnabled);
        setCurrentCardIndex(0);
        if (!shuffleEnabled) {
            setCards([...originalCards].sort(() => Math.random() - 0.5));
        } else {
            setCards([...originalCards]);
        }
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

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') router.push(`/pages/decks/${deckId}`);
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [currentCardIndex, cards.length]);

    if (loading) {
        return (
            <div className="fc-review-overlay">
                <div className="fc-review-loading">Loading flashcards…</div>
            </div>
        );
    }

    if (error || cards.length === 0) {
        return (
            <div className="fc-review-overlay">
                <div className="fc-review-loading">
                    {error || 'No cards available.'}
                    <button className="fc-review-btn" onClick={() => router.push(`/pages/decks/${deckId}`)}>
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentCardIndex];
    const progress = ((currentCardIndex) / cards.length) * 100;

    return (
        <div className="fc-review-overlay">
            {/* Header */}
            <div className="fc-review-head">
                <button
                    className="fc-review-exit-btn"
                    onClick={() => router.push(`/pages/decks/${deckId}`)}
                >
                    <CloseIcon /> Exit review
                </button>
                <div className="fc-review-progress">
                    <i style={{ width: `${progress}%` }} />
                </div>
                <div className="fc-review-counter">
                    {String(currentCardIndex + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
                </div>
            </div>

            {/* Card stage */}
            <div className="fc-review-stage">
                <StudyFlashCard card={currentCard} deckName={deck?.name} />
            </div>

            {/* Controls */}
            <div className="fc-review-controls">
                <button
                    className="fc-review-btn"
                    onClick={handlePrevious}
                    disabled={currentCardIndex === 0}
                >
                    <ArrowLeftIcon /> Previous
                </button>
                <button
                    className={`fc-review-btn ${shuffleEnabled ? 'active' : ''}`}
                    onClick={handleToggleShuffle}
                    title={shuffleEnabled ? 'Shuffle is ON' : 'Shuffle is OFF'}
                >
                    <ShuffleIcon /> {shuffleEnabled ? 'Shuffled' : 'In order'}
                </button>
                <button
                    className="fc-review-btn"
                    onClick={handleNext}
                    disabled={currentCardIndex >= cards.length - 1}
                >
                    Next <ArrowRightIcon />
                </button>
            </div>
        </div>
    );
};

export default FlashcardsStudy;
