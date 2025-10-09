'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeck } from '../../context/deckContext';
import './CardManagement.scss';
import CardComponent from './components/CardComponent';
import CardModal from './components/CardModal';
import StudyDropdown from './components/StudyDropdown';

const CardManagement = ({ deckId }) => {
    const { deck, cards, loading, error, fetchDeckAndCards, createCard, updateCard, deleteCard } = useDeck();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openStudyDropdown, setOpenStudyDropdown] = useState(false)

    const router = useRouter();

    useEffect(() => {
        if (deckId) {
            fetchDeckAndCards(deckId);
        }
    }, [deckId, fetchDeckAndCards]);

    const handleStudy = () => {
        router.push(`/pages/decks/${deckId}/study`);
    }

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
            await deleteCard(deckId, cardId);
        } catch (err) {
            alert('Failed to delete card');
        }
    };

    const handleSaveCard = async (cardData) => {
        try {
            if (editingCard) {
                await updateCard(deckId, editingCard.id, cardData);
            } else {
                await createCard(deckId, cardData);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert('Failed to save card');
        }
    };

    const handleBackToDeck = () => {
        router.push('/pages/decks');
    };

    const filteredCards = cards.filter(card => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            card.question?.toLowerCase().includes(query) ||
            card.answer?.toLowerCase().includes(query)
        );
    });

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
                <h1>{deck?.name}</h1>
                <div className='fc-tools-container'>
                    <div className='fc-dropdown-container'>
                        <div className="fc-btn-container study" onClick={() => { setOpenStudyDropdown(!openStudyDropdown) }}>
                            Study
                        </div>
                        {
                            openStudyDropdown &&
                            <StudyDropdown />
                        }
                    </div>
                    <div className="fc-btn-container add" onClick={handleAddCard}>
                        + Add Card
                    </div>
                </div>
            </div>

            {
                deck?.description && (
                    <p className="fc-deck-description">{deck.description}</p>
                )
            }
            <div className='fc-details-container'>
                <div className='fc-count-text'>{`Card Count: ${filteredCards?.length ?? 0} / ${cards?.length ?? 0}`}</div>
                <div className='fc-subtools-container'>
                    <input
                        className='fc-search-filter'
                        placeholder='Search cards...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className='fc-filter-container'>Sort By...</div>
                </div>
            </div>

            <div className="fc-card-list">
                {filteredCards.length > 0 ? (
                    filteredCards.map((card) => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            onEdit={handleEditCard}
                            onDelete={handleDeleteCard}
                        />
                    ))
                ) : (
                    <div className="fc-no-cards">
                        <p>{searchQuery ? 'No cards match your search.' : 'No cards yet. Add your first card to get started!'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardManagement;
