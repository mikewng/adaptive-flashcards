'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import { useAuth } from '../../context/userAuthContext';
import './PublicDeckView.scss';
import PublicCardComponent from './components/PublicCardComponent';
import ModalComponent from '../../components/ModalComponent';

const ArrowLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 4L5 8l4.5 4M5.5 8h8" />
    </svg>
);
const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5V2.5h8.5V11H11M2.5 5H11v8.5H2.5z" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 4l4.5 4-4.5 4M3 8h8" />
    </svg>
);
const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 11.5l3 3M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z" />
    </svg>
);

const PublicDeckView = ({ deckId }) => {
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copiedDeck, setCopiedDeck] = useState(null);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (deckId) fetchDeckAndCards(deckId);
    }, [deckId]);

    const fetchDeckAndCards = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const [deckData, cardsData] = await Promise.all([
                flashcardApiService.getDeckById(id),
                flashcardApiService.getCardsByDeckId(id)
            ]);
            setDeck(deckData);
            setCards(cardsData);
        } catch (err) {
            console.error('Error fetching deck and cards:', err);
            setError('Failed to load deck. It may be private or not exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyDeck = async () => {
        if (!isAuthenticated) {
            router.push('/pages/login');
            return;
        }
        try {
            const copied = await flashcardApiService.copyDeck(deckId);
            setCopiedDeck(copied);
            setCopyModalOpen(true);
        } catch {
            alert('Failed to copy deck. Please try again.');
        }
    };

    const filteredCards = cards.filter(card => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return card.question?.toLowerCase().includes(q) || card.answer?.toLowerCase().includes(q);
    });

    if (loading) {
        return (
            <div className="pdv-wrapper">
                <div className="pdv-state">Loading deck…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pdv-wrapper">
                <div className="pdv-state pdv-state-error">{error}</div>
                <button className="pdv-back-btn" onClick={() => router.push('/pages/public-decks')}>
                    <ArrowLeftIcon /> Back to Discover
                </button>
            </div>
        );
    }

    return (
        <div className="pdv-wrapper">
            {copyModalOpen && (
                <ModalComponent
                    title="Deck copied!"
                    onClose={() => setCopyModalOpen(false)}
                    isOpen={copyModalOpen}
                >
                    <p style={{ color: 'var(--ink-soft)', margin: '0 0 20px' }}>
                        Added to your library. All cards have been reset for fresh learning.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="pdv-modal-btn" onClick={() => setCopyModalOpen(false)}>Close</button>
                        <button
                            className="pdv-modal-btn primary"
                            onClick={() => copiedDeck && router.push(`/pages/decks/${copiedDeck.id}`)}
                        >
                            Go to My Deck <ArrowRightIcon />
                        </button>
                    </div>
                </ModalComponent>
            )}

            {/* Back link */}
            <button className="pdv-back-btn" onClick={() => router.push('/pages/public-decks')}>
                <ArrowLeftIcon /> Discover
            </button>

            {/* Hero */}
            <div className="pdv-hero">
                <div className="pdv-hero-main">
                    <div className="pdv-deck-tag">
                        <span className="pdv-dot" /> Public deck
                    </div>
                    <h1 className="pdv-title">{deck?.name}</h1>
                    {deck?.description && (
                        <p className="pdv-description">{deck.description}</p>
                    )}
                    <div className="pdv-notice">
                        Read-only view — copy this deck to your library to study and edit cards.
                    </div>
                    {isAuthenticated && (
                        <div className="pdv-actions">
                            <button className="pdv-btn pdv-btn-primary pdv-btn-lg" onClick={handleCopyDeck}>
                                <CopyIcon /> Save to My Decks
                            </button>
                        </div>
                    )}
                </div>

                <div className="pdv-aside">
                    <h3>Deck info</h3>
                    <div className="pdv-aside-stats">
                        <div className="pdv-aside-row">
                            <span>Total cards</span>
                            <span>{cards.length}</span>
                        </div>
                        <div className="pdv-aside-row">
                            <span>Showing</span>
                            <span>{filteredCards.length}</span>
                        </div>
                        <div className="pdv-aside-row">
                            <span>Visibility</span>
                            <span>Public</span>
                        </div>
                    </div>
                    {!isAuthenticated && (
                        <button
                            className="pdv-btn pdv-btn-primary"
                            style={{ width: '100%', marginTop: 16 }}
                            onClick={() => router.push('/pages/login')}
                        >
                            Sign in to save
                        </button>
                    )}
                </div>
            </div>

            {/* Card list header */}
            <div className="pdv-section-head">
                <h2>All cards</h2>
                <div className="pdv-search-wrap">
                    <SearchIcon />
                    <input
                        placeholder="Search cards…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Cards */}
            <div className="pdv-card-list">
                {filteredCards.length > 0 ? (
                    filteredCards.map((card, i) => (
                        <PublicCardComponent key={card.id} card={card} index={i} />
                    ))
                ) : (
                    <div className="pdv-no-cards">
                        {searchQuery ? 'No cards match your search.' : 'No cards in this deck yet.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicDeckView;
