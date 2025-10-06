'use client'

import "./Navbar.scss"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/userAuthContext";
import { useState } from "react";
import DeckUpdateModal from "../screens/deckview/components/DeckUpdateModal";

const Navbar = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const [createDeck, setCreateDeck] = useState(false);

    const handleLoginClick = () => {
        router.push("/pages/login");
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleModalClose = () => {
        setCreateDeck(false)
    }

    return (
        <nav className="fc-navbar-cpnt-wrapper">
            {
                createDeck &&
                <DeckUpdateModal onClose={handleModalClose} />
            }
            <div className="fc-navbar-content">
                <div className="fc-navbar-brand">
                    <svg className="fc-navbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    </svg>
                    <span className="fc-navbar-title">Adaptive Flashcards</span>
                </div>
                <div className="fc-navbar-links">
                    {
                        !isAuthenticated &&
                        <div className="fc-nav-option">
                            <Link href="/" className="fc-nav-link">Home</Link>
                        </div>
                    }
                    {
                        isAuthenticated &&
                        <div className="fc-auth-links">
                            <div className="fc-nav-option">
                                <div
                                    className="fc-nav-link"
                                    onClick={() => { setCreateDeck(true) }}
                                >
                                    Create...
                                </div>
                            </div>
                            <div className="fc-nav-option">
                                <Link href="/pages/decks" className="fc-nav-link">My Decks</Link>
                            </div>
                        </div>
                    }

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