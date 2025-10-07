const DeckComponent = ({ deck, onDeckClick, onEdit, onDelete }) => {
    const handleIconClick = (e, callback) => {
        e.stopPropagation();
        callback?.(deck.id);
    };

    return (
        <div
            key={deck.id}
            className="fc-deck-card"
            onClick={() => onDeckClick(deck.id)}
        >
            <div className="fc-deck-header">
                <h3 className="fc-deck-name">{deck.name}</h3>
                <div className="fc-deck-actions">
                    <button
                        className="fc-icon-btn"
                        onClick={(e) => handleIconClick(e, onEdit)}
                        title="Edit"
                    >
                        Edit
                    </button>
                    <button
                        className="fc-icon-btn"
                        onClick={(e) => handleIconClick(e, onDelete)}
                        title="Delete"
                    >
                        Delete
                    </button>
                </div>
            </div>
            <div className="fc-deck-info">
                <span className="fc-desc">{deck?.description}</span>
                <span className="fc-card-count">{`Card Count: ${deck.cardCount ?? 0}`}</span>
                <span className="fc-last-studied">Last studied: {deck?.lastStudied ?? "N/A"}</span>
            </div>
        </div>
    )
}

export default DeckComponent;