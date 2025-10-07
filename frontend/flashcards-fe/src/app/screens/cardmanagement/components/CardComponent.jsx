const CardComponent = ({ card, onEdit, onDelete }) => {
    return (
        <div className="fc-card-item">
            <div className="fc-card-content">
                <div className="fc-card-section">
                    <label className="fc-card-label">Question</label>
                    <p className="fc-card-text">{card.question}</p>
                </div>
                <div className="fc-card-section">
                    <label className="fc-card-label">Answer</label>
                    <p className="fc-card-text">{card.answer}</p>
                </div>
            </div>
            <div className="fc-card-actions">
                <button
                    className="fc-card-action-btn fc-edit-btn"
                    onClick={() => onEdit(card)}
                    title="Edit"
                >
                    Edit
                </button>
                <button
                    className="fc-card-action-btn fc-delete-btn"
                    onClick={() => onDelete(card.id)}
                    title="Delete"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default CardComponent;
