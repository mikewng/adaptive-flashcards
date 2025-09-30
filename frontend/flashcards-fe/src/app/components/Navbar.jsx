import "./Navbar.scss"
import { useNavigationContext } from "../context/useNavigationContext";

const Navbar = () => {
    const { setNavState } = useNavigationContext();

    return (
        <nav className="fc-navbar-cpnt-wrapper">
            <div className="fc-navbar-content">
                <div className="fc-navbar-brand">
                    <svg className="fc-navbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    </svg>
                    <span className="fc-navbar-title">Adaptive Flashcards</span>
                </div>
                <div className="fc-navbar-links">
                    <div className="fc-nav-option" onClick={() => setNavState("Home")}>
                        <div className="fc-nav-link">Home</div>
                    </div>
                    <div className="fc-nav-option">
                        <div className="fc-nav-link">Create...</div>
                    </div>
                    <div className="fc-nav-option" onClick={() => setNavState("Decks")}>
                        <div className="fc-nav-link">My Decks</div>
                    </div>
                    <div className="fc-nav-account-container">
                        <button className="fc-nav-button">Sign In</button>
                        <button className="fc-nav-button">Register...</button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar