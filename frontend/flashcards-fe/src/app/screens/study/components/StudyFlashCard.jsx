'use client'

import { useState, useEffect } from 'react';
import "./StudyFlashCard.scss"

const StudyFlashCard = ({ card, deckName }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
    }, [card]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setIsFlipped(f => !f);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div
            className="fc-flashcard-wrap"
            onClick={() => setIsFlipped(f => !f)}
        >
            <div className="fc-flashcard" data-flipped={isFlipped}>
                {/* Front */}
                <div className="fc-flashcard-face fc-flashcard-front">
                    <span className="fc-corner">{deckName || 'Question'}</span>
                    <span className="fc-corner-r">term</span>
                    <div className="fc-term">{card?.question || 'No question'}</div>
                    <span className="fc-hint">click or press SPACE to flip</span>
                </div>
                {/* Back */}
                <div className="fc-flashcard-face fc-flashcard-back">
                    <span className="fc-corner">definition</span>
                    <span className="fc-corner-r">{deckName || 'Answer'}</span>
                    <div className="fc-term-ref">{card?.question}</div>
                    <div className="fc-definition">{card?.answer || 'No answer'}</div>
                    <span className="fc-hint">click to flip back</span>
                </div>
            </div>
        </div>
    );
};

export default StudyFlashCard;
