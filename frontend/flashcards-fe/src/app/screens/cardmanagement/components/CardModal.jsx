import { useState, useEffect } from 'react';
import './CardModal.scss';

const CardModal = ({ card, onClose, onSave }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        if (card) {
            setQuestion(card.question || '');
            setAnswer(card.answer || '');
        }
    }, [card]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) {
            alert('Please fill in both question and answer');
            return;
        }
        onSave({ question: question.trim(), answer: answer.trim() });
    };

    return (
        <div className="fc-modal-overlay" onClick={onClose}>
            <div className="fc-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="fc-modal-header">
                    <h2>{card ? 'Edit Card' : 'Add New Card'}</h2>
                    <button className="fc-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="fc-card-form">
                    <div className="fc-form-group">
                        <label htmlFor="question">Question</label>
                        <textarea
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Enter the question..."
                            rows={4}
                            required
                        />
                    </div>
                    <div className="fc-form-group">
                        <label htmlFor="answer">Answer</label>
                        <textarea
                            id="answer"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Enter the answer..."
                            rows={4}
                            required
                        />
                    </div>
                    <div className="fc-modal-actions">
                        <button type="button" onClick={onClose} className="fc-btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="fc-btn-save">
                            {card ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CardModal;
