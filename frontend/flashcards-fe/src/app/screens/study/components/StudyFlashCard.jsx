'use client'

import { useState, useEffect } from 'react';
import "./StudyFlashCard.scss"

const StudyFlashCard = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
    }, [card]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="fc-flashcard-container">
            <div className="fc-flashcard" onClick={handleFlip}>
                <div className="fc-card-label">
                    {isFlipped ? 'Answer' : 'Question'}
                </div>
                <div className="fc-card-text">
                    {isFlipped
                        ? (card?.answer || 'Sample Answer')
                        : (card?.question || 'Sample Question')
                    }
                </div>
                <div className="fc-flip-hint">Click to flip</div>
            </div>
        </div>
    )
}

export default StudyFlashCard;