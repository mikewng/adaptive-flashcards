import { useState } from "react";
import "./CardComponent.scss";
import CardStatsModal from "./CardStatsModal";
import { useAuth } from "../../../context/userAuthContext";
import { formatDueDate, isOverdue } from "../../../utils/dateFormatter";

const CardComponent = ({ card, index, onEdit, onDelete }) => {
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const { user } = useAuth();
    const userTimezone = user?.timezone || 'UTC';
    const cardIsOverdue = isOverdue(card.due_date);

    const accuracyRate = card.accuracy_rate ?? 0;
    let statusLabel = 'new';
    let statusClass = 'status-new';
    if (card.times_seen > 0) {
        if (accuracyRate >= 75) { statusLabel = 'mastered'; statusClass = 'status-mastered'; }
        else if (accuracyRate >= 40) { statusLabel = 'learning'; statusClass = 'status-learning'; }
        else { statusLabel = 'struggling'; statusClass = 'status-struggling'; }
    }

    return (
        <div className={`fc-card-row ${statusClass}`}>
            <div className="fc-card-num">{String((index ?? 0) + 1).padStart(2, '0')}</div>
            <div className="fc-card-front">{card.question}</div>
            <div className="fc-card-back">{card.answer}</div>
            <div className="fc-card-due">
                {card.due_date
                    ? <span className={cardIsOverdue ? 'overdue' : ''}>{formatDueDate(card.due_date, userTimezone)}</span>
                    : <span className="no-date">—</span>}
            </div>
            <div className="fc-card-status">
                <span className="fc-status-dot" />
                {statusLabel}
            </div>
            <div className="fc-card-actions">
                <button className="fc-card-action stats" onClick={() => setIsStatsOpen(true)}>Stats</button>
                <button className="fc-card-action edit" onClick={() => onEdit(card)}>Edit</button>
                <button className="fc-card-action del" onClick={() => onDelete(card.id)}>Delete</button>
            </div>

            <CardStatsModal card={card} isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
        </div>
    );
};

export default CardComponent;
