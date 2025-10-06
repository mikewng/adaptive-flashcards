import { useState } from 'react';
import CardComponent from './components/CardComponent';

const DeckView = () => {
    // Sample flashcard data - replace with your actual data
    const [cards] = useState([
        { id: 1, front: 'What is React?', back: 'A JavaScript library for building user interfaces' },
        { id: 2, front: 'What is a component?', back: 'A reusable piece of UI that can manage its own state and logic' },
        { id: 3, front: 'What is JSX?', back: 'A syntax extension for JavaScript that looks similar to HTML' },
    ]);

    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="fc-deckview-screen-wrapper">
            <div className="fc-deck-header">
                <h1>Deck Name</h1>
                <p className="fc-card-progress">
                    Card {currentIndex + 1} of {cards.length}
                </p>
            </div>

            <div className="fc-deck-content">
                {cards.length > 0 ? (
                    <CardComponent
                        front={cards[currentIndex].front}
                        back={cards[currentIndex].back}
                        key={cards[currentIndex].id}
                    />
                ) : (
                    <p className="fc-no-cards">No cards in this deck</p>
                )}
            </div>

            <div className="fc-deck-controls">
                <button
                    className="fc-nav-btn fc-prev-btn"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    ← Previous
                </button>
                <button
                    className="fc-nav-btn fc-next-btn"
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                >
                    Next →
                </button>
            </div>
        </div>
    );
};

export default DeckView;
