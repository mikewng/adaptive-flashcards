import './DeckComponent.scss';

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 4.5h11M6 4.5V3h4v1.5M5 4.5l.5 8h5l.5-8" />
    </svg>
);

const DeckComponent = ({ deck, onDeckClick, onDelete, viewMode = 'grid' }) => {
    const handleIconClick = (e, callback) => {
        e.stopPropagation();
        callback?.(deck.id);
    };

    const totalCards = deck.card_count ?? deck.cardCount ?? 0;
    const dueCards = deck.due_count ?? 0;

    if (viewMode === 'list') {
        return (
            <button className="fc-deck-row" onClick={() => onDeckClick(deck.id)}>
                <div className="fc-deck-row-swatch" />
                <div className="fc-deck-row-title">
                    <b>{deck.name}</b>
                    {deck.description && <span>{deck.description.slice(0, 70)}{deck.description.length > 70 ? '…' : ''}</span>}
                </div>
                <div className="fc-deck-row-meta">{totalCards} card{totalCards !== 1 ? 's' : ''}</div>
                {dueCards > 0 && (
                    <div className="fc-deck-row-due">{dueCards} due</div>
                )}
                <div className="fc-deck-row-actions">
                    <button
                        className="fc-deck-row-del"
                        onClick={(e) => handleIconClick(e, onDelete)}
                        title="Delete"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </button>
        );
    }

    return (
        <button className="fc-deck-card" onClick={() => onDeckClick(deck.id)}>
            <div className="fc-deck-stack">
                <div className="fc-deck-stack-2" />
                <div className="fc-deck-stack-3" />
            </div>
            <div className="fc-deck-inner">
                <div className="fc-deck-tag">
                    <span className="fc-deck-dot" />
                    {deck.is_private ? 'Private' : 'Public'}
                </div>
                <h3 className="fc-deck-title">{deck.name}</h3>
                {deck.description && (
                    <p className="fc-deck-blurb">{deck.description}</p>
                )}
                <div className="fc-deck-meta-row">
                    <span className="fc-deck-count">{totalCards} card{totalCards !== 1 ? 's' : ''}</span>
                    {dueCards > 0 && (
                        <span className="fc-deck-due">{dueCards} due</span>
                    )}
                    <button
                        className="fc-deck-del-btn"
                        onClick={(e) => handleIconClick(e, onDelete)}
                        title="Delete"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </button>
    );
};

export default DeckComponent;
