import { useState } from "react";
import "./CardComponent.scss";
import CardStatsModal from "./CardStatsModal";

const getDifficultyClass = (accuracyRate) => {
    const ranges = [
        { max: Infinity, min: 71, class: "easy" },
        { max: 70, min: 40, class: "medium" },
        { max: 39, min: 0, class: "hard" }
    ];

    return ranges.find(r => accuracyRate >= r.min && accuracyRate <= r.max)?.class || "none";
};

const CardComponent = ({ card, onEdit, onDelete, onGetStats, readOnly = false }) => {
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    return (
        <div className={`fc-card-item ${getDifficultyClass(card.accuracy_rate)} ${readOnly ? 'read-only' : ''}`}>
            <div className="fc-card-content">
                <div className="fc-card-section">
                    <p className="fc-card-text">{card.question}</p>
                </div>
                <div className="fc-card-section">
                    <p className="fc-card-text">{card.answer}</p>
                </div>
                <div className="fc-card-section split">
                    {
                        card.due_date ?
                            <p className="fc-card-due-date">
                                {"Due: " + new Date(card.due_date).toLocaleDateString() + " UTC"}
                            </p>
                            :
                            <p>None</p>
                    }

                </div>
                {!readOnly && (
                    <div className="fc-card-section">
                        <div className="fc-card-actions">
                            <button
                                className="fc-card-action-btn fc-edit-btn"
                                onClick={() => setIsStatsOpen(true)}
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
                )}
            </div>

            {!readOnly && (
                <CardStatsModal
                    card={card}
                    isOpen={isStatsOpen}
                    onClose={() => setIsStatsOpen(false)}
                />
            )}
        </div>
    );
};

export default CardComponent;
