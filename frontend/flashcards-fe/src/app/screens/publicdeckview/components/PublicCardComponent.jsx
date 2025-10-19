import "../../cardmanagement/components/CardComponent.scss";

const PublicCardComponent = ({ card }) => {
    return (
        <div className={`fc-card-item`}>
            <div className="fc-card-content">
                <div className="fc-card-section">
                    <p className="fc-card-text">{card.question}</p>
                </div>
                <div className="fc-card-section">
                    <p className="fc-card-text">{card.answer}</p>
                </div>
            </div>
        </div>
    );
};

export default PublicCardComponent;
