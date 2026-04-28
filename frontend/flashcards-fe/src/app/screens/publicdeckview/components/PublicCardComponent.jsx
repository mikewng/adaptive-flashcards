import './PublicCardComponent.scss';

const PublicCardComponent = ({ card, index }) => {
    return (
        <div className="pcc-row">
            <div className="pcc-num">{String((index ?? 0) + 1).padStart(2, '0')}</div>
            <div className="pcc-front">{card.question}</div>
            <div className="pcc-back">{card.answer}</div>
        </div>
    );
};

export default PublicCardComponent;
