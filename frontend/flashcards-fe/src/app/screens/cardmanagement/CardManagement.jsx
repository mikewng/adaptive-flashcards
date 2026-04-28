'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeck } from '../../context/deckContext';
import './CardManagement.scss';
import CardComponent from './components/CardComponent';
import CardModal from './components/CardModal';
import StudyDropdown from './components/StudyDropdown';

const ArrowLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 4L5 8l4.5 4M5.5 8h8" />
    </svg>
);
const PlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 3l8 5-8 5z" fill="currentColor" stroke="none" />
    </svg>
);
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v10M3 8h10" />
    </svg>
);
const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 11.5l3 3M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z" />
    </svg>
);

const CardManagement = ({ deckId }) => {
    const { deck, cards, loading, error, fetchDeckAndCards, createCard, updateCard, deleteCard, updateDeck } = useDeck();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openStudyDropdown, setOpenStudyDropdown] = useState(false);
    const [togglingPrivacy, setTogglingPrivacy] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (deckId) fetchDeckAndCards(deckId);
    }, [deckId, fetchDeckAndCards]);

    const handleAddCard = () => { setEditingCard(null); setIsModalOpen(true); };
    const handleEditCard = (card) => { setEditingCard(card); setIsModalOpen(true); };
    const handleDeleteCard = async (cardId) => {
        if (!confirm('Are you sure you want to delete this card?')) return;
        try { await deleteCard(deckId, cardId); } catch { alert('Failed to delete card'); }
    };
    const handleSaveCard = async (cardData) => {
        try {
            if (editingCard) await updateCard(deckId, editingCard.id, cardData);
            else await createCard(deckId, cardData);
            setIsModalOpen(false);
        } catch { alert('Failed to save card'); }
    };
    const handleStudy = (studyMode) => {
        const routes = { fc: 'flashcards', wt: 'writing', mc: 'mc' };
        if (routes[studyMode]) router.push(`/pages/decks/${deckId}/study/${routes[studyMode]}`);
    };
    const handleTogglePrivacy = async () => {
        if (!deck) return;
        const msg = deck.is_private
            ? 'Make this deck public? Anyone will be able to view and copy it.'
            : 'Make this deck private? It will no longer be visible to others.';
        if (!confirm(msg)) return;
        try {
            setTogglingPrivacy(true);
            await updateDeck(deckId, { is_private: !deck.is_private });
        } catch { alert('Failed to update deck privacy. Please try again.'); }
        finally { setTogglingPrivacy(false); }
    };

    const filteredCards = cards.filter(card => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return card.question?.toLowerCase().includes(q) || card.answer?.toLowerCase().includes(q);
    });

    if (loading) {
        return (
            <div className="fc-cm-wrapper">
                <div className="fc-cm-loading">Loading deck…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-cm-wrapper">
                <div className="fc-cm-error">{error}</div>
                <button className="fc-cm-btn" onClick={() => router.push('/pages/decks')}>Back to Decks</button>
            </div>
        );
    }

    return (
        <div className="fc-cm-wrapper">
            {isModalOpen && (
                <CardModal
                    card={editingCard}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCard}
                />
            )}

            {/* Back link */}
            <button className="fc-cm-back-btn" onClick={() => router.push('/pages/decks')}>
                <ArrowLeftIcon /> Library
            </button>

            {/* Hero section */}
            <div className="fc-cm-hero">
                <div className="fc-cm-hero-main">
                    <div className="fc-cm-deck-tag">
                        <span className="fc-cm-dot" />
                        {deck?.is_private ? 'Private' : 'Public'}
                    </div>
                    <h1 className="fc-cm-title">{deck?.name}</h1>
                    {deck?.description && (
                        <p className="fc-cm-description">{deck.description}</p>
                    )}

                    {/* Action buttons */}
                    <div className="fc-cm-actions">
                        <div className="fc-cm-study-wrap">
                            <button
                                className="fc-cm-btn fc-cm-btn-primary fc-cm-btn-lg"
                                onClick={() => setOpenStudyDropdown(!openStudyDropdown)}
                            >
                                <PlayIcon /> Study {cards.length} card{cards.length !== 1 ? 's' : ''}
                            </button>
                            {openStudyDropdown && (
                                <StudyDropdown onStudyOptionClick={(mode) => { setOpenStudyDropdown(false); handleStudy(mode); }} />
                            )}
                        </div>
                        <button className="fc-cm-btn fc-cm-btn-lg" onClick={handleAddCard}>
                            <PlusIcon /> Add Card
                        </button>
                        <button
                            className="fc-cm-btn fc-cm-btn-lg fc-cm-btn-privacy"
                            onClick={handleTogglePrivacy}
                            disabled={togglingPrivacy}
                        >
                            {togglingPrivacy ? 'Updating…' : deck?.is_private ? 'Make Public' : 'Make Private'}
                        </button>
                    </div>
                </div>

                {/* Aside stats */}
                <div className="fc-cm-aside">
                    <h3>Deck info</h3>
                    <div className="fc-cm-aside-stats">
                        <div className="fc-cm-aside-row">
                            <span>Total cards</span>
                            <span>{cards.length}</span>
                        </div>
                        <div className="fc-cm-aside-row">
                            <span>Showing</span>
                            <span>{filteredCards.length}</span>
                        </div>
                        <div className="fc-cm-aside-row">
                            <span>Visibility</span>
                            <span>{deck?.is_private ? 'Private' : 'Public'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card list header */}
            <div className="fc-cm-section-head">
                <h2>All cards</h2>
                <div className="fc-cm-search-wrap">
                    <SearchIcon />
                    <input
                        placeholder="Search cards…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Cards */}
            <div className="fc-cm-card-list">
                {filteredCards.length > 0 ? (
                    filteredCards.map((card, i) => (
                        <CardComponent
                            key={card.id}
                            card={card}
                            index={i}
                            onEdit={handleEditCard}
                            onDelete={handleDeleteCard}
                        />
                    ))
                ) : (
                    <div className="fc-cm-no-cards">
                        {searchQuery ? 'No cards match your search.' : 'No cards yet. Add your first card to get started!'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardManagement;
