'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './DeckView.scss';
import DeckUpdateModal from './components/DeckUpdateModal';
import DeckComponent from './components/DeckComponent';
import ModalComponent from '../../components/ModalComponent';

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v10M3 8h10" />
    </svg>
);
const GridIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z" />
    </svg>
);
const ListIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h10M3 8h10M3 12h10" />
    </svg>
);
const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 11.5l3 3M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z" />
    </svg>
);

const DeckView = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deckToDelete, setDeckToDelete] = useState(null);
    const [view, setView] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const router = useRouter();

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                setLoading(true);
                const response = await flashcardApiService.getDecks();
                setDecks(response);
                setError(null);
            } catch (err) {
                console.error('Error fetching decks:', err);
                setError('Failed to load decks');
            } finally {
                setLoading(false);
            }
        };
        fetchDecks();
    }, []);

    const handleDeckClick = (deckId) => router.push(`/pages/decks/${deckId}`);
    const handleCreateDeck = () => setOpenCreateModal(true);
    const handleDeckCreated = (newDeck) => {
        setDecks([...decks, newDeck]);
        router.push(`/pages/decks/${newDeck.id}`);
    };
    const handleDeleteDeck = (deckId) => {
        setDeckToDelete(deckId);
        setDeleteModalOpen(true);
    };
    const confirmDeleteDeck = async () => {
        if (!deckToDelete) return;
        try {
            await flashcardApiService.deleteDeckById(deckToDelete);
            setDecks(decks.filter(deck => deck.id !== deckToDelete));
            setDeleteModalOpen(false);
            setDeckToDelete(null);
        } catch (err) {
            console.error('Error deleting deck:', err);
            alert('Failed to delete deck. Please try again.');
        }
    };
    const cancelDeleteDeck = () => {
        setDeleteModalOpen(false);
        setDeckToDelete(null);
    };

    const filteredDecks = decks.filter(d => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
    });

    const totalCards = decks.reduce((s, d) => s + (d.card_count ?? 0), 0);
    const totalDue = decks.reduce((s, d) => s + (d.due_count ?? 0), 0);

    if (loading) {
        return (
            <div className="fc-deckview-screen-wrapper">
                <div className="fc-loading-state">Loading your library…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-deckview-screen-wrapper">
                <div className="fc-error-state">{error}</div>
            </div>
        );
    }

    return (
        <div className="fc-deckview-screen-wrapper">
            {openCreateModal && (
                <DeckUpdateModal
                    onClose={() => setOpenCreateModal(false)}
                    onDeckCreated={handleDeckCreated}
                />
            )}
            {deleteModalOpen && (
                <ModalComponent
                    title="Delete Deck"
                    onClose={cancelDeleteDeck}
                    isOpen={deleteModalOpen}
                >
                    <p style={{ color: 'var(--ink-soft)', margin: '0 0 20px' }}>
                        Are you sure you want to delete this deck? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button className="fc-btn" onClick={cancelDeleteDeck}>Cancel</button>
                        <button className="fc-btn fc-btn-danger" onClick={confirmDeleteDeck}>Delete</button>
                    </div>
                </ModalComponent>
            )}

            {/* Topbar */}
            <div className="fc-topbar">
                <div>
                    <h1 className="fc-topbar-title">Your <em>library</em></h1>
                    <div className="fc-topbar-sub">{decks.length} deck{decks.length !== 1 ? 's' : ''} · {totalCards} cards in rotation</div>
                </div>
                <div className="fc-topbar-actions">
                    <div className="fc-search-wrap">
                        <SearchIcon />
                        <input
                            placeholder="Search your decks…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="fc-btn fc-btn-primary" onClick={handleCreateDeck}>
                        <PlusIcon /> New Deck
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="fc-stats-strip">
                <div className="fc-stat">
                    <div className="fc-stat-label">Total Decks</div>
                    <div className="fc-stat-value">{decks.length}</div>
                </div>
                <div className="fc-stat">
                    <div className="fc-stat-label">Total Cards</div>
                    <div className="fc-stat-value">{totalCards}</div>
                </div>
                <div className="fc-stat">
                    <div className="fc-stat-label">Due Today</div>
                    <div className="fc-stat-value">{totalDue}</div>
                    {totalDue > 0 && <div className="fc-stat-trend fc-trend-warn">needs review</div>}
                </div>
                <div className="fc-stat">
                    <div className="fc-stat-label">Showing</div>
                    <div className="fc-stat-value">{filteredDecks.length}</div>
                    <div className="fc-stat-trend">of {decks.length}</div>
                </div>
            </div>

            {/* Section header */}
            <div className="fc-section-head">
                <h2>All decks</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="fc-meta">{filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}</span>
                    <div className="fc-view-toggle">
                        <button
                            data-active={view === 'grid' ? 'true' : 'false'}
                            onClick={() => setView('grid')}
                            aria-label="Grid view"
                        >
                            <GridIcon />
                        </button>
                        <button
                            data-active={view === 'list' ? 'true' : 'false'}
                            onClick={() => setView('list')}
                            aria-label="List view"
                        >
                            <ListIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Deck grid or list */}
            {view === 'grid' ? (
                <div className="fc-decks-grid">
                    {filteredDecks.length > 0 ? (
                        filteredDecks.map((deck, i) => (
                            <DeckComponent
                                key={deck.id ?? i}
                                deck={deck}
                                onDeckClick={handleDeckClick}
                                onDelete={handleDeleteDeck}
                                viewMode="grid"
                            />
                        ))
                    ) : (
                        <div className="fc-no-decks">
                            {searchQuery
                                ? 'No decks match your search.'
                                : 'No decks yet. Create your first deck to get started!'}
                        </div>
                    )}
                </div>
            ) : (
                <div className="fc-decks-list-view">
                    {filteredDecks.length > 0 ? (
                        filteredDecks.map((deck, i) => (
                            <DeckComponent
                                key={deck.id ?? i}
                                deck={deck}
                                onDeckClick={handleDeckClick}
                                onDelete={handleDeleteDeck}
                                viewMode="list"
                            />
                        ))
                    ) : (
                        <div className="fc-no-decks">
                            {searchQuery
                                ? 'No decks match your search.'
                                : 'No decks yet. Create your first deck to get started!'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeckView;
