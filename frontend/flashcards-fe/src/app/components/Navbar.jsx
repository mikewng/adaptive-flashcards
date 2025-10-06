import "./Navbar.scss"
import { useNavigationContext } from "../context/useNavigationContext";
import { useAuth } from "../context/userAuthContext";

const Navbar = () => {
    const { setNavState } = useNavigationContext();
    const { user, isAuthenticated, logout } = useAuth();

    const handleLoginClick = () => {
        setNavState("Login");
    };

    const handleLogout = () => {
        logout();
        setNavState("Home");
    };

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
                        {isAuthenticated ? (
                            <>
                                <span className="fc-nav-user-email">{user?.email}</span>
                                <button className="fc-nav-button" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button className="fc-nav-button" onClick={handleLoginClick}>
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar