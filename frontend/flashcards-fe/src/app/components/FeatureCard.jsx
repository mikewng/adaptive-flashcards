import "./FeatureCard.scss"

const FeatureCard = ({ title, description, svgComponent }) => {
    return (
        <div className="fc-feature-card">
            <div className="fc-feature-icon fc-feature-icon-indigo">
                {svgComponent}
            </div>
            <h3 className="fc-feature-title">{title}</h3>
            <p className="fc-feature-description">
                {description}
            </p>
        </div>
    )
}

export default FeatureCard