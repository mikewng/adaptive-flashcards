'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import { useAuth } from '../../context/userAuthContext';
import './PublicDecksView.scss';
import ModalComponent from '../../components/ModalComponent';

const PublicDeckCard = ({ deck, onCopy, onClick, isAuthenticated }) => {
    return (
        <div className="fc-public-deck-card" onClick={() => onClick(deck.id)}>
            <div className="fc-deck-header">
                <h3 className="fc-deck-name">{deck.name}</h3>
                {isAuthenticated && (
                    <button
                        className="fc-copy-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy(deck.id);
                        }}
                        title="Copy this deck to your library"
                    >
                        Copy
                    </button>
                )}
            </div>
            <div className="fc-deck-info">
                {deck.description && (
                    <p className="fc-deck-description">{deck.description}</p>
                )}
                <div className="fc-deck-meta">
                    <span className="fc-card-count">
                        {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                    </span>
                    <span className="fc-deck-owner">by {deck.owner_username}</span>
                </div>
            </div>
        </div>
    );
};

const PublicDecksView = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copiedDeck, setCopiedDeck] = useState(null);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchPublicDecks();
    }, []);

    const fetchPublicDecks = async (search = null) => {
        try {
            setLoading(true);
            const response = await flashcardApiService.getPublicDecks(0, 50, search);
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
        if (!isAuthenticated) {
            alert('Please sign in to copy decks');
            return;
        }

        try {
            const copiedDeck = await flashcardApiService.copyDeck(deckId);
            setCopiedDeck(copiedDeck);
            setCopyModalOpen(true);
        } catch (err) {
            console.error('Error copying deck:', err);
            alert('Failed to copy deck. Please try again.');
        }
    };

    const handleGoToDeck = () => {
        if (copiedDeck) {
            router.push(`/pages/decks/${copiedDeck.id}`);
        }
    };

    const handleDeckClick = (deckId) => {
        router.push(`/pages/public-decks/${deckId}`);
    };

    if (loading) {
        return (
            <div className="fc-public-decks-wrapper">
                <div className="fc-loading">Loading public decks...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-public-decks-wrapper">
                <div className="fc-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="fc-public-decks-wrapper">
            {copyModalOpen && (
                <ModalComponent
                    title="Deck Copied Successfully!"
                    onClose={() => setCopyModalOpen(false)}
                    isOpen={copyModalOpen}
                >
                    <p>The deck has been copied to your library.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setCopyModalOpen(false)} style={{ padding: '8px 16px' }}>
                            Close
                        </button>
                        <button
                            onClick={handleGoToDeck}
                            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Go to Deck
                        </button>
                    </div>
                </ModalComponent>
            )}

            <div className="fc-public-decks-header">
                <h1>Browse Public Decks</h1>
                <p className="fc-subtitle">Discover and copy decks shared by the community</p>
            </div>

            <div className="fc-search-section">
                <form onSubmit={handleSearch} className="fc-search-form">
                    <input
                        type="text"
                        placeholder="Search decks by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="fc-search-input"
                    />
                    <button type="submit" className="fc-search-btn">
                        Search
                    </button>
                </form>
            </div>

            <div className="fc-decks-list">
                {decks.length > 0 ? (
                    decks.map((deck) => (
                        <PublicDeckCard
                            key={deck.id}
                            deck={deck}
                            onCopy={handleCopyDeck}
                            onClick={handleDeckClick}
                            isAuthenticated={isAuthenticated}
                        />
                    ))
                ) : (
                    <div className="fc-no-decks">
                        <p>No public decks found. Try a different search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicDecksView;
