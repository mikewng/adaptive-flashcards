'use client'

import { useState } from 'react';
import { flashcardApiService } from '@/app/utils/flashcardApis';
import ModalComponent from '@/app/components/ModalComponent';
import './DeckUpdateModal.scss';

const DeckUpdateModal = ({ isOpen, onClose, onDeckCreated }) => {
    const [deckName, setDeckName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!deckName.trim()) {
            setError('Deck name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const deckData = {
                name: deckName,
                description: description
            };

            const response = await flashcardApiService.createDeck(deckData);

            // Reset form
            setDeckName('');
            setDescription('');

            // Notify parent component
            if (onDeckCreated) {
                onDeckCreated(response);
            }

            // Close modal
            if (onClose) {
                onClose();
            }
        } catch (err) {
            console.error('Error creating deck:', err);
            setError(err.message || 'Failed to create deck');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setDeckName('');
            setDescription('');
            setError('');
            if (onClose) {
                onClose();
            }
        }
    };

    return (
        <ModalComponent
            title="Create New Deck"
            isOpen={isOpen}
            onClose={handleClose}
        >
            <form onSubmit={handleSubmit} className='fc-deckmodal-form'>
                <div className="fc-deckmodal-section-container">
                    <label htmlFor="deckName" className="fc-deckmodal-label">
                        Deck Name * <span className="fc-deckmodal-char-count">{deckName.length}/25</span>
                    </label>
                    <input
                        type="text"
                        id="deckName"
                        className="fc-deckmodal-input"
                        placeholder="Enter deck name"
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        maxLength={25}
                        disabled={isLoading}
                    />
                </div>

                <div className="fc-deckmodal-section-container">
                    <label htmlFor="description" className="fc-deckmodal-label">
                        Description <span className="fc-deckmodal-char-count">{description.length}/100</span>
                    </label>
                    <textarea
                        id="description"
                        className="fc-deckmodal-textarea"
                        placeholder="Enter deck description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={100}
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div className="fc-deckmodal-error">
                        {error}
                    </div>
                )}

                <div className="fc-deckmodal-actions">
                    <button
                        type="button"
                        className="fc-deckmodal-btn fc-deckmodal-btn-cancel"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="fc-deckmodal-btn fc-deckmodal-btn-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Deck'}
                    </button>
                </div>
            </form>
        </ModalComponent>
    )
}

export default DeckUpdateModal;