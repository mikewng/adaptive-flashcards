import FeatureCard from "@/app/components/FeatureCard"
import "./Landing.scss"

const Landing = ({ }) => {
    return (
        <div className="fc-landing-screen-wrapper">
            <div className="fc-hero-section">
                <div className="fc-logo-icon">
                    FC Logo
                </div>

                <div className="fc-heading">
                    <h1 className="fc-title">Adaptive Flashcards</h1>
                    <p className="fc-subtitle">
                        Create decks that learn your learning process.
                    </p>
                </div>

                <div className="fc-cta-buttons">
                    <button className="fc-btn fc-btn-primary">Login</button>
                    <button className="fc-btn fc-btn-secondary">Register...</button>
                </div>

                <div className="fc-features">
                    <FeatureCard
                        title={"Fast Learning"}
                        description={"Monitor your learning journey with detailed stats"}
                        svgComponent={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                    />
                    <FeatureCard
                        title={"Track Progress"}
                        description={"Accelerate your learning with dynamic spaced repetition"}
                        svgComponent={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <FeatureCard
                        title={"Customizable"}
                        description={"Create decks tailored to your learning needs"}
                        svgComponent={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        }
                    />
                </div>
            </div>
        </div>
    )
}

export default Landing