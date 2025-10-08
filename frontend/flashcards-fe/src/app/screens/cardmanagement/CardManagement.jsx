'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './CardManagement.scss';
import CardComponent from './components/CardComponent';
import CardModal from './components/CardModal';

const CardManagement = ({ deckId }) => {
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

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

    const handleAddCard = () => {
        setEditingCard(null);
        setIsModalOpen(true);
    };

    const handleEditCard = (card) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    const handleDeleteCard = async (cardId) => {
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            await flashcardApiService.deleteCardById(cardId);
            await fetchDeckAndCards();
        } catch (err) {
            console.error('Error deleting card:', err);
            alert('Failed to delete card');
        }
    };

    const handleSaveCard = async (cardData) => {
        try {
            if (editingCard) {
                // await flashcardApiService.updateCard(editingCard.id, cardData);
            } else {
                // Create new card
                await flashcardApiService.createCard(deckId, cardData);
            }
            await fetchDeckAndCards();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving card:', err);
            alert('Failed to save card');
        }
    };

    const handleBackToDeck = () => {
        router.push('/pages/decks');
    };

    if (loading) {
        return (
            <div className="fc-cardmanagement-wrapper">
                <div className="fc-loading">Loading deck...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-cardmanagement-wrapper">
                <div className="fc-error">{error}</div>
                <button onClick={handleBackToDeck} className="fc-back-btn">
                    Back to Decks
                </button>
            </div>
        );
    }

    return (
        <div className="fc-cardmanagement-wrapper">
            {isModalOpen && (
                <CardModal
                    card={editingCard}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCard}
                />
            )}

            <div className="fc-cardmanagement-header">
                <div className="fc-header-left">
                    <button onClick={handleBackToDeck} className="fc-back-btn">
                        ← Back
                    </button>
                </div>
                <button className="fc-add-card-btn" onClick={handleAddCard}>
                    + Add Card
                </button>
            </div>
            <h1>{deck?.name}</h1>

            {deck?.description && (
                <p className="fc-deck-description">{deck.description}</p>
            )}

            <div className="fc-card-list">
                {cards.length > 0 ? (
                    cards.map((card) => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            onEdit={handleEditCard}
                            onDelete={handleDeleteCard}
                        />
                    ))
                ) : (
                    <div className="fc-no-cards">
                        <p>No cards yet. Add your first card to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardManagement;
