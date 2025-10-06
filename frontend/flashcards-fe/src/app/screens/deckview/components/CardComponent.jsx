import { useState } from 'react';

const CardComponent = ({ type, front, back }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="fc-card-cpnt-wrapper" onClick={handleFlip}>
            <div className={`fc-card-inner ${isFlipped ? 'flipped' : ''}`}>
                <div className="fc-card-face fc-card-front">
                    <div className="fc-card-content">
                        <h2>{front || 'Front of Card'}</h2>
                    </div>
                    <div className="fc-card-hint">Click to flip</div>
                </div>
                <div className="fc-card-face fc-card-back">
                    <div className="fc-card-content">
                        <p>{back || 'Back of Card'}</p>
                    </div>
                    <div className="fc-card-hint">Click to flip</div>
                </div>
            </div>
        </div>
    );
};

export default CardComponent;
