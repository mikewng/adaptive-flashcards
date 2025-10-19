'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import { useAuth } from '../../context/userAuthContext';
import '../cardmanagement/CardManagement.scss';
import PublicCardComponent from './components/PublicCardComponent';
import ModalComponent from '../../components/ModalComponent';

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
        if (deckId) {
            fetchDeckAndCards(deckId);
        }
    }, [deckId]);

    const fetchDeckAndCards = async (deckId) => {
        try {
            setLoading(true);
            setError(null);
            const [deckData, cardsData] = await Promise.all([
                flashcardApiService.getDeckById(deckId),
                flashcardApiService.getCardsByDeckId(deckId)
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
            alert('Please sign in to copy this deck');
            router.push('/pages/login');
            return;
        }

        try {
            const copiedDeckData = await flashcardApiService.copyDeck(deckId);
            setCopiedDeck(copiedDeckData);
            setCopyModalOpen(true);
        } catch (err) {
            console.error('Error copying deck:', err);
            alert('Failed to copy deck. Please try again.');
        }
    };

    const handleGoToCopiedDeck = () => {
        if (copiedDeck) {
            router.push(`/pages/decks/${copiedDeck.id}`);
        }
    };

    const handleBackToPublicDecks = () => {
        router.push('/pages/public-decks');
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
                <button onClick={handleBackToPublicDecks} className="fc-back-btn">
                    Back to Public Decks
                </button>
            </div>
        );
    }

    return (
        <div className="fc-cardmanagement-wrapper">
            {copyModalOpen && (
                <ModalComponent
                    title="Deck Copied Successfully!"
                    onClose={() => setCopyModalOpen(false)}
                    isOpen={copyModalOpen}
                >
                    <p>The deck has been copied to your library. All cards have been reset for fresh learning.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setCopyModalOpen(false)} style={{ padding: '8px 16px' }}>
                            Close
                        </button>
                        <button
                            onClick={handleGoToCopiedDeck}
                            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Go to My Deck
                        </button>
                    </div>
                </ModalComponent>
            )}

            <div className="fc-cardmanagement-header">
                <h1>{deck?.name}</h1>
                <div className='fc-tools-container'>
                    <div onClick={handleBackToPublicDecks} className="fc-btn-container">
                        ← Back
                    </div>
                    <div onClick={handleCopyDeck} className="fc-btn-container copy">
                        Copy to My Decks
                    </div>
                </div>
            </div>

            {deck?.description && (
                <p className="fc-deck-description">{deck.description}</p>
            )}

            <div className="fc-privacy-section">
                <div className="fc-privacy-status">
                    This deck is public and is read-only. To study and modify this deck, copy it to add to your decks.
                </div>
            </div>

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
                        <PublicCardComponent
                            key={card.id}
                            card={card}
                        />
                    ))
                ) : (
                    <div className="fc-no-cards">
                        <p>{searchQuery ? 'No cards match your search.' : 'No cards in this deck yet.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicDeckView;
