'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashcardApiService } from '../../utils/flashcardApis';
import './DeckView.scss';
import DeckUpdateModal from './components/DeckUpdateModal';
import DeckComponent from './components/DeckComponent';
import ModalComponent from '../../components/ModalComponent';

const DeckView = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deckToDelete, setDeckToDelete] = useState(null);

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
        router.push(`/pages/decks/${deckId}`);
    };

    const handleCreateDeck = () => {
        setOpenCreateModal(true)
    };

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
                <DeckUpdateModal
                    onClose={() => setOpenCreateModal(false)}
                    onDeckCreated={handleDeckCreated}
                />
            }
            {
                deleteModalOpen &&
                <ModalComponent
                    title="Delete Deck"
                    onClose={cancelDeleteDeck}
                    isOpen={deleteModalOpen}
                >
                    <p>Are you sure you want to delete this deck? This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                        <button onClick={cancelDeleteDeck} style={{ padding: '8px 16px' }}>
                            Cancel
                        </button>
                        <button onClick={confirmDeleteDeck} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Delete
                        </button>
                    </div>
                </ModalComponent>
            }
            <div className="fc-deck-header title">
                <h1>My Decks</h1>
                <button className="fc-create-deck-btn" onClick={handleCreateDeck}>
                    + Create New Deck
                </button>
            </div>

            <div className="fc-deck-list">
                {decks.length > 0 ? (
                    decks.map((deck, i) => (
                        <DeckComponent deck={deck} onDeckClick={handleDeckClick} onDelete={handleDeleteDeck} key={i} />
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
