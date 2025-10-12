'use client'

import { useRouter } from 'next/navigation';
import './MultipleChoiceStudy.scss';

/**
 * Multiple Choice Study Mode
 * Select answers with session tracking (Coming Soon)
 * This will create a backend session for tracking progress
 */
const MultipleChoiceStudy = ({ deckId }) => {
    const router = useRouter();

    const handleBackToDeck = () => {
        router.push(`/pages/decks/${deckId}`);
    };

    return (
        <div className="mc-study-wrapper">
            <div className="coming-soon">
                <h1>Multiple Choice Mode</h1>
                <p className="subtitle">Coming Soon!</p>
                <div className="description">
                    <p>This study mode will let you test your knowledge with multiple choice questions.</p>
                    <p>Features will include:</p>
                    <ul>
                        <li>Automatic generation of distractor answers</li>
                        <li>Quick review and testing</li>
                        <li>Performance tracking and analytics</li>
                        <li>Instant feedback on your choices</li>
                    </ul>
                </div>
                <button onClick={handleBackToDeck} className="back-btn">
                    Back to Deck
                </button>
            </div>
        </div>
    );
};

export default MultipleChoiceStudy;
