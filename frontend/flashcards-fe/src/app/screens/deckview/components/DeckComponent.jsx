import './DeckComponent.scss';

const DeckComponent = ({ deck, onDeckClick, onDelete }) => {
    const handleIconClick = (e, callback) => {
        e.stopPropagation();
        callback?.(deck.id);
    };

    // Format card count with due indicator
    const totalCards = deck.card_count ?? deck.cardCount ?? 0;
    const dueCards = deck.due_count ?? 0;

    return (
        <div
            key={deck.id}
            className="fc-deck-card"
            onClick={() => onDeckClick(deck.id)}
        >
            <div className="fc-deck-header">
                <h3 className="fc-deck-name">{deck.name}</h3>
                <div className="fc-deck-actions">
                    {/* <button
                        className="fc-icon-btn"
                        title="Edit"
                    >
                        <img src="/pencil-solid-full.svg" alt="Edit" className="fc-icon" />
                    </button> */}
                    <button
                        className="fc-icon-btn"
                        onClick={(e) => handleIconClick(e, onDelete)}
                        title="Delete"
                    >
                        <img src="/trash-solid-full.svg" alt="Delete" className="fc-icon" />
                    </button>
                </div>
            </div>
            <div className="fc-deck-info">
                {deck?.description && (
                    <span className="fc-desc">{deck.description}</span>
                )}
                <div className="fc-stats-row">
                    <span className="fc-card-count">
                        {totalCards} {totalCards === 1 ? 'card' : 'cards'}
                    </span>
                    {dueCards > 0 && (
                        <span className="fc-due-count">
                            {dueCards} due
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DeckComponent;