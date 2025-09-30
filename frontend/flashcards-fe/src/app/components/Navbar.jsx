import "./Navbar.scss"

const Navbar = () => {
    return (
        <nav className="fc-navbar-cpnt-wrapper">
            <div className="fc-navbar-content">
                <div className="fc-navbar-brand">
                    <svg className="fc-navbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    </svg>
                    <span className="fc-navbar-title">Flashcards</span>
                </div>
                <div className="fc-navbar-links">
                    <a href="#" className="fc-nav-link">Home</a>
                    <a href="#" className="fc-nav-link">Decks</a>
                    <button className="fc-nav-button">Sign In</button>
                    <button className="fc-nav-button">Register...</button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar