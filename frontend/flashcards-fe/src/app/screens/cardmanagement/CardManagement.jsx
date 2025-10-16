'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeck } from '../../context/deckContext';
import './CardManagement.scss';
import CardComponent from './components/CardComponent';
import CardModal from './components/CardModal';
import StudyDropdown from './components/StudyDropdown';

const CardManagement = ({ deckId, readOnly = false }) => {
    const { deck, cards, loading, error, fetchDeckAndCards, createCard, updateCard, deleteCard, updateDeck } = useDeck();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openStudyDropdown, setOpenStudyDropdown] = useState(false)
    const [togglingPrivacy, setTogglingPrivacy] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (deckId) {
            fetchDeckAndCards(deckId);
        }
    }, [deckId, fetchDeckAndCards]);

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

    const handleStudy = (studyMode) => {
        // Route to different study pages based on mode
        switch(studyMode) {
            case 'fc': // Flashcards
                router.push(`/pages/decks/${deckId}/study/flashcards`);
                break;
            case 'wt': // Writing
                router.push(`/pages/decks/${deckId}/study/writing`);
                break;
            case 'mc': // Multiple Choice
                router.push(`/pages/decks/${deckId}/study/mc`);
                break;
            default:
                console.error('Unknown study mode:', studyMode);
        }
    }

    const handleTogglePrivacy = async () => {
        if (!deck) return;

        const confirmMessage = deck.is_private
            ? 'Make this deck public? Anyone will be able to view and copy it.'
            : 'Make this deck private? It will no longer be visible to others.';

        if (!confirm(confirmMessage)) return;

        try {
            setTogglingPrivacy(true);
            await updateDeck(deckId, { is_private: !deck.is_private });
        } catch (err) {
            console.error('Error toggling deck privacy:', err);
            alert('Failed to update deck privacy. Please try again.');
        } finally {
            setTogglingPrivacy(false);
        }
    }

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
                {!readOnly && (
                    <div className='fc-tools-container'>
                        <div className='fc-dropdown-container'>
                            <div className="fc-btn-container study" onClick={() => { setOpenStudyDropdown(!openStudyDropdown) }}>
                                Study
                            </div>
                            {
                                openStudyDropdown &&
                                <StudyDropdown onStudyOptionClick={handleStudy} />
                            }
                        </div>
                        <div className="fc-btn-container add" onClick={handleAddCard}>
                            + Add Card
                        </div>
                        <div className="fc-btn-container db">
                            Dashboards
                        </div>
                    </div>
                )}
                {readOnly && (
                    <div className='fc-readonly-badge'>
                        Read Only - Public Deck
                    </div>
                )}
            </div>

            {
                deck?.description && (
                    <p className="fc-deck-description">{deck.description}</p>
                )
            }

            {!readOnly && (
                <div className="fc-privacy-section">
                    <div className="fc-privacy-status">
                        <span className="fc-privacy-label">Privacy:</span>
                        <span className={`fc-privacy-badge ${deck?.is_private ? 'private' : 'public'}`}>
                            {deck?.is_private ? 'Private' : 'Public'}
                        </span>
                    </div>
                    <button
                        className="fc-privacy-toggle-btn"
                        onClick={handleTogglePrivacy}
                        disabled={togglingPrivacy}
                    >
                        {togglingPrivacy
                            ? 'Updating...'
                            : deck?.is_private
                                ? 'Make Public'
                                : 'Make Private'
                        }
                    </button>
                </div>
            )}
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
                            onEdit={readOnly ? null : handleEditCard}
                            onDelete={readOnly ? null : handleDeleteCard}
                            readOnly={readOnly}
                        />
                    ))
                ) : (
                    <div className="fc-no-cards">
                        <p>{searchQuery ? 'No cards match your search.' : readOnly ? 'No cards in this deck yet.' : 'No cards yet. Add your first card to get started!'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardManagement;
