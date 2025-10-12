import "./CardComponent.scss"

const CardComponent = ({ card, onEdit, onDelete }) => {
    return (
        <div className="fc-card-item">
            <div className="fc-card-content">
                <div className="fc-card-section">
                    <p className="fc-card-text">{card.question}</p>
                </div>
                <div className="fc-card-section">
                    <p className="fc-card-text">{card.answer}</p>
                </div>
                <div className="fc-card-section">
                    {
                        card.due_date ?
                            <p className="fc-card-due-date">
                                {"Due: " + new Date(card.due_date).toLocaleDateString()}
                            </p>
                            :
                            <p>None</p>
                    }

                </div>
                <div className="fc-card-section">
                    <div className="fc-card-actions">
                        <button
                            className="fc-card-action-btn fc-edit-btn"
                            title="Stats"
                        >
                            Stats
                        </button>
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
            </div>

        </div>
    );
};

export default CardComponent;
