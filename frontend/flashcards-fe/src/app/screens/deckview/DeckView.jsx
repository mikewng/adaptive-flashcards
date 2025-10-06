'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './DeckView.scss';
import ModalComponent from '@/app/components/ModalComponent';
import DeckUpdateModal from './components/DeckUpdateModal';

const DeckView = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDeck, setOpenDeck] = useState(null);
    const [openCreateModal, setOpenCreateModal] = useState(false);

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

    const handleDeckClick = (deckId) => {
        // Change to view cards
        router.push(`/deck/${deckId}/study`);
    };

    const handleCreateDeck = () => {
        // Change to open modal
        setOpenCreateModal(true)
    };

    if (loading) {
        return (
            <div className="fc-deckview-screen-wrapper">
                <div className="fc-loading">Loading decks...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fc-deckview-screen-wrapper">
                <div className="fc-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="fc-deckview-screen-wrapper">
            {
                openCreateModal &&
                <ModalComponent title={"Create Deck"} onClose={() => setOpenCreateModal(false)}>
                    <DeckUpdateModal />
                </ModalComponent>
            }
            <div className="fc-deck-header">
                <h1>My Decks</h1>
                <button className="fc-create-deck-btn" onClick={handleCreateDeck}>
                    + Create New Deck
                </button>
            </div>

            <div className="fc-deck-list">
                {decks.length > 0 ? (
                    decks.map((deck) => (
                        <div
                            key={deck.id}
                            className="fc-deck-card"
                            onClick={() => handleDeckClick(deck.id)}
                        >
                            <h3 className="fc-deck-name">{deck.name}</h3>
                            <div className="fc-deck-info">
                                <span className="fc-card-count">{`Card Count: ${deck.cardCount ?? 0}`}</span>
                                <span className="fc-last-studied">Last studied: {deck?.lastStudied ?? "N/A"}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="fc-no-decks">
                        <p>No decks yet. Create your first deck to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckView;
