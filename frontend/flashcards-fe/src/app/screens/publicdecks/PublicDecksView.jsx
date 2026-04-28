'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import { useAuth } from '../../context/userAuthContext';
import './PublicDecksView.scss';
import ModalComponent from '../../components/ModalComponent';

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 11.5l3 3M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z" />
    </svg>
);
const CopyIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5V2.5h8.5V11H11M2.5 5H11v8.5H2.5z" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 4l4.5 4-4.5 4M3 8h8" />
    </svg>
);

const PublicDeckCard = ({ deck, onCopy, onClick, isAuthenticated }) => (
    <button className="fc-pub-deck-card" onClick={() => onClick(deck.id)}>
        <div className="fc-pub-deck-stack">
            <div className="fc-pub-deck-stack-2" />
            <div className="fc-pub-deck-stack-3" />
        </div>
        <div className="fc-pub-deck-inner">
            <div className="fc-pub-deck-tag">
                <span className="fc-pub-deck-dot" />
                Public
            </div>
            <h3 className="fc-pub-deck-title">{deck.name}</h3>
            {deck.description && (
                <p className="fc-pub-deck-blurb">{deck.description}</p>
            )}
            <div className="fc-pub-deck-meta">
                <span>{deck.card_count} card{deck.card_count !== 1 ? 's' : ''}</span>
                <span className="fc-pub-deck-owner">by {deck.owner_username}</span>
                {isAuthenticated && (
                    <button
                        className="fc-pub-copy-btn"
                        onClick={(e) => { e.stopPropagation(); onCopy(deck.id); }}
                        title="Copy this deck to your library"
                    >
                        <CopyIcon /> Save
                    </button>
                )}
            </div>
        </div>
    </button>
);

const PublicDecksView = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copiedDeck, setCopiedDeck] = useState(null);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => { fetchPublicDecks(); }, []);

    const fetchPublicDecks = async (search = null) => {
        try {
            setLoading(true);
            const response = await flashcardApiService.getPublicDecks(0, 12, search);
            setDecks(response);
            setError(null);
        } catch (err) {
            console.error('Error fetching public decks:', err);
            setError('Failed to load public decks');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPublicDecks(searchQuery || null);
    };

    const handleCopyDeck = async (deckId) => {
        if (!isAuthenticated) { alert('Please sign in to copy decks'); return; }
        try {
            const copied = await flashcardApiService.copyDeck(deckId);
            setCopiedDeck(copied);
            setCopyModalOpen(true);
        } catch { alert('Failed to copy deck. Please try again.'); }
    };

    const handleDeckClick = (deckId) => router.push(`/pages/public-decks/${deckId}`);

    if (loading) {
        return (
            <div className="fc-pub-wrapper">
                <div className="fc-pub-loading">Loading community decks…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-pub-wrapper">
                <div className="fc-pub-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="fc-pub-wrapper">
            {copyModalOpen && (
                <ModalComponent
                    title="Deck copied!"
                    onClose={() => setCopyModalOpen(false)}
                    isOpen={copyModalOpen}
                >
                    <p style={{ color: 'var(--ink-soft)', margin: '0 0 20px' }}>
                        The deck has been added to your library.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button className="fc-pub-modal-btn" onClick={() => setCopyModalOpen(false)}>Close</button>
                        <button
                            className="fc-pub-modal-btn primary"
                            onClick={() => { if (copiedDeck) router.push(`/pages/decks/${copiedDeck.id}`); }}
                        >
                            Go to Deck <ArrowRightIcon />
                        </button>
                    </div>
                </ModalComponent>
            )}

            {/* Topbar */}
            <div className="fc-pub-topbar">
                <div>
                    <h1 className="fc-pub-title">Find your next <em>deck</em></h1>
                    <div className="fc-pub-sub">Community decks · shared by learners</div>
                </div>
            </div>

            {/* Hero search */}
            <div className="fc-pub-hero">
                <h2>What would you like to <em>learn</em> today?</h2>
                <p>Search decks shared by the community, then copy any deck straight to your library.</p>
                <form onSubmit={handleSearch} className="fc-pub-search">
                    <SearchIcon />
                    <input
                        placeholder="Search by name or description…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="fc-pub-search-btn">Search</button>
                </form>
            </div>

            {/* Section */}
            <div className="fc-pub-section-head">
                <h2>Recently published</h2>
                <span className="fc-pub-meta">{decks.length} deck{decks.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="fc-pub-decks-grid">
                {decks.length > 0 ? (
                    decks.map(deck => (
                        <PublicDeckCard
                            key={deck.id}
                            deck={deck}
                            onCopy={handleCopyDeck}
                            onClick={handleDeckClick}
                            isAuthenticated={isAuthenticated}
                        />
                    ))
                ) : (
                    <div className="fc-pub-no-decks">No public decks found. Try a different search term.</div>
                )}
            </div>
        </div>
    );
};

export default PublicDecksView;
