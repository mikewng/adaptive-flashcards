const DeckComponent = ({ deck, onDeckClick }) => {
    return (
        <div
            key={deck.id}
            className="fc-deck-card"
            onClick={() => onDeckClick(deck.id)}
        >
            <h3 className="fc-deck-name">{deck.name}</h3>
            <div className="fc-deck-info">
                <span className="fc-desc">{deck?.description}</span>
                <span className="fc-card-count">{`Card Count: ${deck.cardCount ?? 0}`}</span>
                <span className="fc-last-studied">Last studied: {deck?.lastStudied ?? "N/A"}</span>
            </div>
        </div>
    )
}

export default DeckComponent;