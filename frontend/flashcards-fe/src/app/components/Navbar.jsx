'use client'

import "./Navbar.scss"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/userAuthContext";

const Navbar = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();

    const handleLoginClick = () => {
        router.push("/login");
    };

    const handleLogout = () => {
        logout();
        router.push("/");
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
                    <div className="fc-nav-option">
                        <Link href="/" className="fc-nav-link">Home</Link>
                    </div>
                    <div className="fc-nav-option">
                        <div className="fc-nav-link">Create...</div>
                    </div>
                    <div className="fc-nav-option">
                        <Link href="/decks" className="fc-nav-link">My Decks</Link>
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